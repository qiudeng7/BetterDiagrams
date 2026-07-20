import { App, MarkdownView, Notice, TFile } from 'obsidian';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getSnapshot, loadSnapshot, Tldraw, type Editor } from 'tldraw';
import { refreshMarkdownView } from '../obsidian/markdownRefresh';
import type { DiagramRefreshStrategy } from '../settings';
import { embedDiagramMetadata, extractDiagramMetadata } from '../svg/metadata';
import { createEmptyTldrawSvg, parseTldrawSnapshot, TLDRAW_PROJECT_FORMAT } from './diagram';

export class TldrawDiagramOverlay {
	private rootEl: HTMLDivElement | null = null;
	private editorRoot: Root | null = null;
	private editor: Editor | null = null;
	private stopListening: (() => void) | null = null;
	private dirty = false;
	private closed = false;
	private snapshot: Record<string, unknown> | null = null;

	constructor(
		private readonly app: App,
		private readonly file: TFile,
		private readonly sourceView: MarkdownView | null,
		private readonly refreshStrategy: DiagramRefreshStrategy,
	) {}

	async open(): Promise<void> {
		try {
			const metadata = extractDiagramMetadata(await this.app.vault.read(this.file));

			if (!metadata || metadata.editor !== 'tldraw' || metadata.project.format !== TLDRAW_PROJECT_FORMAT) {
				new Notice('This SVG does not contain editable tldraw project data.');
				return;
			}

			this.snapshot = parseTldrawSnapshot(metadata.project.data);

			if (!this.snapshot) {
				new Notice('This SVG has invalid tldraw project data.');
				return;
			}

			this.createOverlay();
		} catch (error) {
			new Notice(`Failed to open tldraw diagram: ${formatError(error)}`);
			this.close();
		}
	}

	private createOverlay(): void {
		this.rootEl = document.createElement('div');
		this.rootEl.className = 'better-diagram-overlay';
		const toolbarEl = document.createElement('div');
		toolbarEl.className = 'better-diagram-toolbar';
		this.rootEl.appendChild(toolbarEl);

		const titleEl = document.createElement('div');
		titleEl.className = 'better-diagram-title';
		titleEl.textContent = this.file.path;
		toolbarEl.appendChild(titleEl);
		toolbarEl.append(this.createButton('Save', () => void this.save()));
		toolbarEl.append(this.createButton('Close', () => this.closeWithPrompt()));

		const editorEl = document.createElement('div');
		editorEl.className = 'better-diagram-tldraw';
		this.rootEl.appendChild(editorEl);
		document.body.appendChild(this.rootEl);

		this.editorRoot = createRoot(editorEl);
		this.editorRoot.render(createElement(Tldraw, {
			onMount: (editor: Editor) => this.onEditorMount(editor),
		}));
	}

	private onEditorMount(editor: Editor): void {
		if (this.closed) {
			return;
		}

		if (this.snapshot) {
			loadSnapshot(editor.store, this.snapshot);
		}

		this.editor = editor;
		this.stopListening = editor.store.listen(() => {
			this.dirty = true;
		});
	}

	private createButton(label: string, onClick: () => void): HTMLButtonElement {
		const buttonEl = document.createElement('button');
		buttonEl.type = 'button';
		buttonEl.textContent = label;
		buttonEl.addEventListener('click', onClick);
		return buttonEl;
	}

	private async save(): Promise<void> {
		if (!this.editor) {
			new Notice('tldraw is still loading.');
			return;
		}

		try {
			const exported = await this.editor.getSvgString(this.editor.getCurrentPageShapes(), { background: true });
			const updatedSvg = embedDiagramMetadata(exported?.svg ?? createEmptyTldrawSvg(), {
				schemaVersion: 1,
				editor: 'tldraw',
				project: { format: TLDRAW_PROJECT_FORMAT, data: JSON.stringify(getSnapshot(this.editor.store)) },
			});
			await this.app.vault.modify(this.file, updatedSvg);
			this.dirty = false;

			try {
				await refreshMarkdownView(this.sourceView, this.refreshStrategy);
			} catch (error) {
				new Notice(`Diagram saved, but the Markdown tab could not be refreshed: ${formatError(error)}`);
			}

			new Notice('Diagram saved.');
		} catch (error) {
			new Notice(`Failed to save tldraw diagram: ${formatError(error)}`);
		}
	}

	private closeWithPrompt(): void {
		if (this.dirty && !window.confirm('Close the diagram editor and discard unsaved changes?')) {
			return;
		}
		this.close();
	}

	private close(): void {
		this.closed = true;
		this.stopListening?.();
		this.stopListening = null;
		this.editorRoot?.unmount();
		this.editorRoot = null;
		this.editor = null;
		this.rootEl?.remove();
		this.rootEl = null;
	}
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
