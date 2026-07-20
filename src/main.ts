import {
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	type Editor,
	type MarkdownFileInfo,
} from 'obsidian';
import {
	createDrawioDiagramFilename,
	createInitialDrawioSvg,
	createMarkdownImageEmbed,
} from './drawio/diagram';
import { DrawioDiagramOverlay } from './drawio/overlay';
import { getVaultBasePath, resolveSvgFile } from './obsidian/svgFile';
import {
	BetterDiagramSettingTab,
	DEFAULT_SETTINGS,
	type BetterDiagramSettings,
} from './settings';
import { normalizeSvgPath } from './svg/path';
import { extractDiagramMetadata } from './svg/metadata';
import { createInitialTldrawSvg, createTldrawDiagramFilename } from './tldraw/diagram';
import { TldrawDiagramOverlay } from './tldraw/overlay';

export default class BetterDiagramPlugin extends Plugin {
	settings: BetterDiagramSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new BetterDiagramSettingTab(this.app, this));

		this.addCommand({
			id: 'insert-new-drawio-diagram',
			name: 'Insert a new Drawio diagram',
			editorCallback: (editor, ctx) => void this.insertNewDrawioDiagram(editor, ctx),
		});
		this.addCommand({
			id: 'insert-new-tldraw-diagram',
			name: 'Insert a new tldraw diagram',
			editorCallback: (editor, ctx) => void this.insertNewTldrawDiagram(editor, ctx),
		});

		this.registerDomEvent(document, 'dblclick', (event: MouseEvent) => this.openDiagramFromImage(event));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	private openDiagramFromImage(event: MouseEvent): void {
		const image = getTargetImage(event.target);

		if (!image) {
			return;
		}

		const svgPath = normalizeSvgPath(
			image.getAttribute('src') ?? image.currentSrc,
			getVaultBasePath(this.app),
		);

		if (!svgPath) {
			return;
		}

		const file = resolveSvgFile(this.app, svgPath);

		if (!file) {
			new Notice('SVG path detected, but the vault file could not be resolved.');
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		void this.openDiagram(file, this.app.workspace.getActiveViewOfType(MarkdownView));
	}

	private async insertNewDrawioDiagram(editor: Editor, ctx: MarkdownFileInfo): Promise<void> {
		const sourceFile = ctx.file ?? this.app.workspace.getActiveFile();

		if (!(sourceFile instanceof TFile)) {
			new Notice('Open a Markdown file before inserting a draw.io diagram.');
			return;
		}

		try {
			const diagramPath = await this.app.fileManager.getAvailablePathForAttachment(
				createDrawioDiagramFilename(),
				sourceFile.path,
			);
			const diagramFile = await this.app.vault.create(diagramPath, createInitialDrawioSvg());
			const markdownLink = this.app.fileManager.generateMarkdownLink(diagramFile, sourceFile.path);

			editor.replaceSelection(createMarkdownImageEmbed(markdownLink));
			new Notice(`Inserted ${diagramFile.name}.`);
			void this.openDrawioDiagram(diagramFile, getMarkdownView(ctx, this));
		} catch (error) {
			new Notice(`Failed to insert draw.io diagram: ${formatError(error)}`);
		}
	}

	private async insertNewTldrawDiagram(editor: Editor, ctx: MarkdownFileInfo): Promise<void> {
		const sourceFile = ctx.file ?? this.app.workspace.getActiveFile();

		if (!(sourceFile instanceof TFile)) {
			new Notice('Open a Markdown file before inserting a tldraw diagram.');
			return;
		}

		try {
			const diagramPath = await this.app.fileManager.getAvailablePathForAttachment(
				createTldrawDiagramFilename(),
				sourceFile.path,
			);
			const diagramFile = await this.app.vault.create(diagramPath, createInitialTldrawSvg());
			const markdownLink = this.app.fileManager.generateMarkdownLink(diagramFile, sourceFile.path);

			editor.replaceSelection(createMarkdownImageEmbed(markdownLink));
			new Notice(`Inserted ${diagramFile.name}.`);
			void this.openTldrawDiagram(diagramFile, getMarkdownView(ctx, this));
		} catch (error) {
			new Notice(`Failed to insert tldraw diagram: ${formatError(error)}`);
		}
	}

	private async openDiagram(file: TFile, sourceView: MarkdownView | null): Promise<void> {
		try {
			const metadata = extractDiagramMetadata(await this.app.vault.read(file));

			if (metadata?.editor === 'tldraw') {
				void this.openTldrawDiagram(file, sourceView);
				return;
			}

			if (metadata && metadata.editor !== 'drawio') {
				new Notice(`The ${metadata.editor} editor is not supported yet.`);
				return;
			}

			void this.openDrawioDiagram(file, sourceView);
		} catch (error) {
			new Notice(`Failed to open SVG diagram: ${formatError(error)}`);
		}
	}

	private openDrawioDiagram(file: TFile, sourceView: MarkdownView | null): Promise<void> {
		return new DrawioDiagramOverlay(
			this.app,
			file,
			sourceView,
			this.settings.refreshStrategy,
		).open();
	}

	private openTldrawDiagram(file: TFile, sourceView: MarkdownView | null): Promise<void> {
		return new TldrawDiagramOverlay(
			this.app,
			file,
			sourceView,
			this.settings.refreshStrategy,
		).open();
	}
}

function getTargetImage(target: EventTarget | null): HTMLImageElement | null {
	if (!(target instanceof Element)) {
		return null;
	}

	const image = target.closest('img');
	return image instanceof HTMLImageElement ? image : null;
}

function getMarkdownView(ctx: MarkdownFileInfo, plugin: BetterDiagramPlugin): MarkdownView | null {
	return ctx instanceof MarkdownView ? ctx : plugin.app.workspace.getActiveViewOfType(MarkdownView);
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
