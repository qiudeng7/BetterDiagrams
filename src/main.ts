import { Modal, Notice, Plugin, TFile } from 'obsidian';
import { normalizeSvgPath } from './svgPath';

export default class CommonMarkdownDiagramEditorPlugin extends Plugin {
	async onload(): Promise<void> {
		this.addCommand({
			id: 'open-editor-placeholder',
			name: 'Open diagram editor placeholder',
			callback: () => {
				new DiagramEditorModal(this, null).open();
			},
		});

		this.registerDomEvent(document, 'dblclick', (event: MouseEvent) => {
			const image = getTargetImage(event.target);

			if (!image) {
				return;
			}

			const svgPath = normalizeSvgPath(image.getAttribute('src'));

			if (!svgPath) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			new DiagramEditorModal(this, svgPath).open();
		});
	}
}

class DiagramEditorModal extends Modal {
	constructor(
		private readonly plugin: CommonMarkdownDiagramEditorPlugin,
		private readonly svgPath: string | null,
	) {
		super(plugin.app);
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.empty();
		contentEl.addClass('common-markdown-diagram-editor-modal');
		contentEl.createEl('h2', { text: 'Common Markdown Diagram Editor' });

		if (!this.svgPath) {
			contentEl.createEl('p', {
				text: 'Editor integration is ready to be wired. Double-click an SVG image in Reading view to pass its path into this dialog.',
			});
			return;
		}

		const file = this.plugin.app.vault.getAbstractFileByPath(this.svgPath);

		contentEl.createEl('p', { text: 'SVG selected from Markdown:' });
		contentEl.createEl('code', { text: this.svgPath });

		if (file instanceof TFile) {
			contentEl.createEl('p', {
				text: 'Next step: mount draw.io or tldraw here, read embedded metadata from this SVG, then save exported SVG back to the same file.',
			});
		} else {
			contentEl.createEl('p', {
				text: 'The image path was detected, but Obsidian did not resolve it as a vault file. The next iteration should improve path resolution for app:// resource URLs if you see this message.',
			});
			new Notice('SVG path detected, but vault file was not resolved.');
		}
	}

	onClose(): void {
		this.contentEl.empty();
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
