import { App, MarkdownView, Notice, TFile } from 'obsidian';
import {
	refreshMarkdownView,
} from '../obsidian/markdownRefresh';
import type { DiagramRefreshStrategy } from '../settings';
import { embedDiagramMetadata, extractDiagramMetadata } from '../svg/metadata';
import {
	DRAWIO_EMBED_ORIGIN,
	createBlankDrawioXml,
	createDrawioEmbedUrl,
	decodeDrawioSvgData,
	getDrawioXmlFromMetadata,
	parseDrawioMessage,
	type DrawioMessage,
} from './protocol';

interface PendingSave {
	xml: string;
	closeAfterSave: boolean;
	silent: boolean;
}

export class DrawioDiagramOverlay {
	private rootEl: HTMLDivElement | null = null;
	private iframeEl: HTMLIFrameElement | null = null;
	private statusEl: HTMLElement | null = null;
	private saveTimer: number | null = null;
	private currentXml = createBlankDrawioXml();
	private pendingSave: PendingSave | null = null;
	private dirty = false;
	private closed = false;

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
		private readonly app: App,
		private readonly file: TFile,
		private readonly sourceView: MarkdownView | null,
		private readonly refreshStrategy: DiagramRefreshStrategy,
	) {}

	async open(): Promise<void> {
		try {
			const svg = await this.app.vault.read(this.file);

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
		this.rootEl.className = 'better-diagram-overlay';
		window.addEventListener('message', this.handleMessage);
		window.addEventListener('keydown', this.handleKeyDown, true);

		const toolbarEl = document.createElement('div');
		toolbarEl.className = 'better-diagram-toolbar';
		this.rootEl.appendChild(toolbarEl);

		const titleEl = document.createElement('div');
		titleEl.className = 'better-diagram-title';
		titleEl.textContent = this.file.path;
		toolbarEl.appendChild(titleEl);

		this.statusEl = document.createElement('div');
		this.statusEl.className = 'better-diagram-status';
		this.statusEl.textContent = 'Loading draw.io...';
		toolbarEl.appendChild(this.statusEl);

		toolbarEl.append(this.createButton('Save', () => this.requestExport(false, false)));
		toolbarEl.append(this.createButton('Close', () => void this.closeWithPrompt()));

		this.iframeEl = document.createElement('iframe');
		this.iframeEl.className = 'better-diagram-frame';
		this.iframeEl.title = 'draw.io diagram editor';
		this.iframeEl.src = createDrawioEmbedUrl();
		this.iframeEl.setAttribute(
			'sandbox',
			'allow-downloads allow-forms allow-popups allow-same-origin allow-scripts',
		);
		this.rootEl.appendChild(this.iframeEl);

		document.body.appendChild(this.rootEl);
	}

	private createButton(label: string, onClick: () => void): HTMLButtonElement {
		const buttonEl = document.createElement('button');
		buttonEl.type = 'button';
		buttonEl.textContent = label;
		buttonEl.addEventListener('click', onClick);
		return buttonEl;
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
			action: 'load', xml: this.currentXml, autosave: 1, modified: 0,
			saveAndExit: 1, noExitBtn: 1, title: this.file.name,
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

		this.pendingSave = { xml: this.currentXml, closeAfterSave, silent };
		this.setStatus('Exporting SVG...');
		this.postToDrawio({ action: 'export', format: 'svg', xml: this.currentXml, embedImages: true, border: 0 });
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
				project: { format: 'drawio-mxfile', data: pendingSave.xml },
			});

			await this.app.vault.modify(this.file, updatedSvg);
			this.pendingSave = null;
			this.dirty = false;
			this.setStatus('Saved');

			try {
				await refreshMarkdownView(this.sourceView, this.refreshStrategy);
			} catch (error) {
				new Notice(`Diagram saved, but the Markdown tab could not be refreshed: ${formatError(error)}`);
			}

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

	}

	private setStatus(status: string): void {
		if (this.statusEl) {
			this.statusEl.textContent = status;
		}
	}
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
