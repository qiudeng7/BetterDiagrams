import { MarkdownView, Notice, Plugin, TFile, type Editor, type MarkdownFileInfo } from 'obsidian';
import {
	createDrawioDiagramFilename,
	createInitialDrawioSvg,
	createMarkdownImageEmbed,
} from './drawio/diagram';
import { DrawioDiagramOverlay } from './drawio/overlay';
import { getVaultBasePath, resolveSvgFile } from './obsidian/svgFile';
import { normalizeSvgPath } from './svg/path';

export default class BetterDiagramPlugin extends Plugin {
	async onload(): Promise<void> {
		this.addCommand({
			id: 'insert-new-drawio-diagram',
			name: 'Insert a new Drawio diagram',
			editorCallback: (editor, ctx) => void this.insertNewDrawioDiagram(editor, ctx),
		});

		this.addCommand({
			id: 'open-diagram-editor-help',
			name: 'Open diagram editor help',
			callback: () => new Notice('Double-click an SVG image in Reading view to open the diagram editor.'),
		});

		this.registerDomEvent(document, 'dblclick', (event: MouseEvent) => this.openDiagramFromImage(event));
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
		void new DrawioDiagramOverlay(
			this.app,
			file,
			this.app.workspace.getActiveViewOfType(MarkdownView),
		).open();
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
			void new DrawioDiagramOverlay(this.app, diagramFile, getMarkdownView(ctx, this)).open();
		} catch (error) {
			new Notice(`Failed to insert draw.io diagram: ${formatError(error)}`);
		}
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
