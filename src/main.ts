import { MarkdownView, Notice, Plugin, TFile, type Editor, type MarkdownFileInfo } from 'obsidian';
import {
	createDrawioDiagramFilename,
	createInitialDrawioSvg,
	createMarkdownImageEmbed,
} from './diagramInsert';
import {
	DRAWIO_EMBED_ORIGIN,
	createBlankDrawioXml,
	createDrawioEmbedUrl,
	decodeDrawioSvgData,
	getDrawioXmlFromMetadata,
	parseDrawioMessage,
	type DrawioMessage,
} from './drawioProtocol';
import {
	captureMarkdownScroll,
	refreshMarkdownView,
	type MarkdownScrollSnapshot,
} from './markdownRefresh';
import { embedDiagramMetadata, extractDiagramMetadata } from './svgMetadata';
import { normalizeSvgPath } from './svgPath';

export default class CommonMarkdownDiagramEditorPlugin extends Plugin {
	async onload(): Promise<void> {
		this.addCommand({
			id: 'insert-new-drawio-diagram',
			name: 'Insert a new Drawio diagram',
			editorCallback: (editor, ctx) => {
				void this.insertNewDrawioDiagram(editor, ctx);
			},
		});

		this.addCommand({
			id: 'open-diagram-editor-help',
			name: 'Open diagram editor help',
			callback: () => {
				new Notice('Double-click an SVG image in Reading view to open the diagram editor.');
			},
		});

		this.registerDomEvent(document, 'dblclick', (event: MouseEvent) => {
			const image = getTargetImage(event.target);

			if (!image) {
				return;
			}

			const svgPath = normalizeSvgPath(
				image.getAttribute('src') ?? image.currentSrc,
				getVaultBasePath(this),
			);

			if (!svgPath) {
				return;
			}

			const file = this.resolveSvgFile(svgPath);

			if (!file) {
				new Notice('SVG path detected, but the vault file could not be resolved.');
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			void new DrawioDiagramOverlay(this, file, this.app.workspace.getActiveViewOfType(MarkdownView)).open();
		});
	}

	private resolveSvgFile(svgPath: string): TFile | null {
		const directFile = this.app.vault.getAbstractFileByPath(svgPath);

		if (directFile instanceof TFile) {
			return directFile;
		}

		const activeFile = this.app.workspace.getActiveFile();
		const linkedFile = this.app.metadataCache.getFirstLinkpathDest(svgPath, activeFile?.path ?? '');

		return linkedFile instanceof TFile ? linkedFile : null;
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
			void new DrawioDiagramOverlay(this, diagramFile, getMarkdownView(ctx, this)).open();
		} catch (error) {
			new Notice(`Failed to insert draw.io diagram: ${formatError(error)}`);
		}
	}
}

interface PendingSave {
	xml: string;
	closeAfterSave: boolean;
	silent: boolean;
}

class DrawioDiagramOverlay {
	private rootEl: HTMLDivElement | null = null;
	private iframeEl: HTMLIFrameElement | null = null;
	private statusEl: HTMLElement | null = null;
	private saveTimer: number | null = null;
	private currentXml = createBlankDrawioXml();
	private pendingSave: PendingSave | null = null;
	private dirty = false;
	private closed = false;
	private savedSinceOpen = false;
	private refreshStarted = false;
	private readonly sourceScroll: MarkdownScrollSnapshot | null;

	private readonly handleMessage = (event: MessageEvent<unknown>): void => {
		void this.onMessage(event);
	};

	private readonly handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape') {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		void this.closeWithPrompt();
	};

	constructor(
		private readonly plugin: CommonMarkdownDiagramEditorPlugin,
		private readonly file: TFile,
		private readonly sourceView: MarkdownView | null,
	) {
		this.sourceScroll = captureMarkdownScroll(sourceView);
	}

	async open(): Promise<void> {
		try {
			const svg = await this.plugin.app.vault.read(this.file);

			if (!/<svg\b/i.test(svg)) {
				new Notice('The selected file is not an editable SVG.');
				return;
			}

			const metadata = extractDiagramMetadata(svg);

			if (metadata && metadata.editor !== 'drawio') {
				new Notice(`The ${metadata.editor} editor is not supported yet.`);
				return;
			}

			if (metadata) {
				const drawioXml = getDrawioXmlFromMetadata(metadata);

				if (!drawioXml) {
					new Notice('This SVG has draw.io metadata, but the project data is invalid.');
					return;
				}

				this.currentXml = drawioXml;
			}

			this.createOverlay();
		} catch (error) {
			new Notice(`Failed to open SVG diagram: ${formatError(error)}`);
			this.close();
		}
	}

	private createOverlay(): void {
		this.rootEl = document.createElement('div');
		this.rootEl.className = 'common-markdown-diagram-editor-overlay';
		window.addEventListener('message', this.handleMessage);
		window.addEventListener('keydown', this.handleKeyDown, true);

		const toolbarEl = document.createElement('div');
		toolbarEl.className = 'common-markdown-diagram-editor-toolbar';
		this.rootEl.appendChild(toolbarEl);

		const titleEl = document.createElement('div');
		titleEl.className = 'common-markdown-diagram-editor-title';
		titleEl.textContent = this.file.path;
		toolbarEl.appendChild(titleEl);

		this.statusEl = document.createElement('div');
		this.statusEl.className = 'common-markdown-diagram-editor-status';
		this.statusEl.textContent = 'Loading draw.io...';
		toolbarEl.appendChild(this.statusEl);

		const saveButtonEl = document.createElement('button');
		saveButtonEl.type = 'button';
		saveButtonEl.textContent = 'Save';
		saveButtonEl.addEventListener('click', () => {
			this.requestExport(false, false);
		});
		toolbarEl.appendChild(saveButtonEl);

		const closeButtonEl = document.createElement('button');
		closeButtonEl.type = 'button';
		closeButtonEl.textContent = 'Close';
		closeButtonEl.addEventListener('click', () => {
			void this.closeWithPrompt();
		});
		toolbarEl.appendChild(closeButtonEl);

		this.iframeEl = document.createElement('iframe');
		this.iframeEl.className = 'common-markdown-diagram-editor-frame';
		this.iframeEl.title = 'draw.io diagram editor';
		this.iframeEl.src = createDrawioEmbedUrl();
		this.iframeEl.setAttribute(
			'sandbox',
			'allow-downloads allow-forms allow-popups allow-same-origin allow-scripts',
		);
		this.rootEl.appendChild(this.iframeEl);

		document.body.appendChild(this.rootEl);
	}

	private async onMessage(event: MessageEvent<unknown>): Promise<void> {
		if (this.closed || event.origin !== DRAWIO_EMBED_ORIGIN) {
			return;
		}

		const message = parseDrawioMessage(event.data);

		if (!message) {
			return;
		}

		if (message.event === 'init') {
			this.loadDrawio();
			return;
		}

		if ((message.event === 'autosave' || message.event === 'save') && typeof message.xml === 'string') {
			this.currentXml = message.xml;
			this.dirty = true;
			this.setStatus(message.event === 'autosave' ? 'Changed. Auto-saving...' : 'Saving...');

			if (message.event === 'autosave') {
				this.scheduleAutoSave();
			} else {
				this.requestExport(message.exit === true, false);
			}

			return;
		}

		if (message.event === 'export') {
			await this.saveExport(message);
			return;
		}

		if (message.event === 'exit') {
			await this.closeWithPrompt();
		}
	}

	private loadDrawio(): void {
		this.postToDrawio({
			action: 'load',
			xml: this.currentXml,
			autosave: 1,
			modified: 0,
			saveAndExit: 1,
			noExitBtn: 1,
			title: this.file.name,
		});
		this.setStatus('Ready');
	}

	private scheduleAutoSave(): void {
		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
		}

		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			this.requestExport(false, true);
		}, 1200);
	}

	private requestExport(closeAfterSave: boolean, silent: boolean): void {
		if (!this.iframeEl?.contentWindow) {
			new Notice('draw.io is not ready yet.');
			return;
		}

		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}

		this.pendingSave = {
			xml: this.currentXml,
			closeAfterSave,
			silent,
		};
		this.setStatus('Exporting SVG...');
		this.postToDrawio({
			action: 'export',
			format: 'svg',
			xml: this.currentXml,
			embedImages: true,
			border: 0,
		});
	}

	private async saveExport(message: DrawioMessage): Promise<void> {
		const pendingSave = this.pendingSave;

		if (!pendingSave) {
			return;
		}

		if (typeof message.data !== 'string') {
			new Notice('draw.io did not return SVG data.');
			this.setStatus('Save failed');
			return;
		}

		try {
			const svg = decodeDrawioSvgData(message.data);
			const updatedSvg = embedDiagramMetadata(svg, {
				schemaVersion: 1,
				editor: 'drawio',
				project: {
					format: 'drawio-mxfile',
					data: pendingSave.xml,
				},
			});

			await this.plugin.app.vault.modify(this.file, updatedSvg);
			this.pendingSave = null;
			this.dirty = false;
			this.savedSinceOpen = true;
			this.setStatus('Saved');

			if (!pendingSave.silent) {
				new Notice('Diagram saved.');
			}

			if (pendingSave.closeAfterSave) {
				this.close();
			}
		} catch (error) {
			new Notice(`Failed to save diagram: ${formatError(error)}`);
			this.setStatus('Save failed');
		}
	}

	private postToDrawio(message: Record<string, unknown>): void {
		this.iframeEl?.contentWindow?.postMessage(JSON.stringify(message), DRAWIO_EMBED_ORIGIN);
	}

	private async closeWithPrompt(): Promise<void> {
		if (this.dirty && !window.confirm('Close the diagram editor and discard unsaved changes?')) {
			return;
		}

		this.close();
	}

	private close(): void {
		this.closed = true;

		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}

		window.removeEventListener('message', this.handleMessage);
		window.removeEventListener('keydown', this.handleKeyDown, true);
		this.rootEl?.remove();
		this.rootEl = null;
		this.iframeEl = null;
		this.statusEl = null;

		if (this.savedSinceOpen && !this.refreshStarted) {
			this.refreshStarted = true;
			void refreshMarkdownView(this.sourceView, this.sourceScroll);
		}
	}

	private setStatus(status: string): void {
		if (this.statusEl) {
			this.statusEl.textContent = status;
		}
	}
}

function getTargetImage(target: EventTarget | null): HTMLImageElement | null {
	if (!(target instanceof Element)) {
		return null;
	}

	const image = target.closest('img');

	if (image instanceof HTMLImageElement) {
		return image;
	}

	return null;
}

function getVaultBasePath(plugin: CommonMarkdownDiagramEditorPlugin): string | undefined {
	const adapter = plugin.app.vault.adapter as { getBasePath?: () => string };

	return typeof adapter.getBasePath === 'function' ? adapter.getBasePath() : undefined;
}

function getMarkdownView(
	ctx: MarkdownFileInfo,
	plugin: CommonMarkdownDiagramEditorPlugin,
): MarkdownView | null {
	return ctx instanceof MarkdownView ? ctx : plugin.app.workspace.getActiveViewOfType(MarkdownView);
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
