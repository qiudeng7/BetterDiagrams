interface MarkdownSubViewLike {
	getScroll?: () => number;
	applyScroll?: (scroll: number) => void;
}

interface MarkdownPreviewLike {
	rerender?: (full?: boolean) => void;
}

interface EditorLike {
	getScrollInfo?: () => { left: number; top: number };
	scrollTo?: (x?: number | null, y?: number | null) => void;
}

export interface MarkdownViewLike {
	currentMode?: MarkdownSubViewLike;
	previewMode?: MarkdownPreviewLike;
	editor?: EditorLike;
	getViewData?: () => string;
	setViewData?: (data: string, clear: boolean) => void;
}

export interface MarkdownScrollSnapshot {
	modeScroll?: number;
	editorScroll?: {
		left: number;
		top: number;
	};
}

export function captureMarkdownScroll(view: MarkdownViewLike | null): MarkdownScrollSnapshot | null {
	if (!view) {
		return null;
	}

	const snapshot: MarkdownScrollSnapshot = {};

	if (typeof view.currentMode?.getScroll === 'function') {
		snapshot.modeScroll = view.currentMode.getScroll();
	}

	if (typeof view.editor?.getScrollInfo === 'function') {
		snapshot.editorScroll = view.editor.getScrollInfo();
	}

	return snapshot.modeScroll === undefined && !snapshot.editorScroll ? null : snapshot;
}

export async function refreshMarkdownView(
	view: MarkdownViewLike | null,
	snapshot: MarkdownScrollSnapshot | null,
	waitForLayout = waitForAnimationFrame,
): Promise<void> {
	if (!view) {
		return;
	}

	if (typeof view.previewMode?.rerender === 'function') {
		view.previewMode.rerender(true);
	} else if (typeof view.getViewData === 'function' && typeof view.setViewData === 'function') {
		view.setViewData(view.getViewData(), false);
	}

	await waitForLayout();
	await waitForLayout();

	if (snapshot?.modeScroll !== undefined && typeof view.currentMode?.applyScroll === 'function') {
		view.currentMode.applyScroll(snapshot.modeScroll);
	}

	if (snapshot?.editorScroll && typeof view.editor?.scrollTo === 'function') {
		view.editor.scrollTo(snapshot.editorScroll.left, snapshot.editorScroll.top);
	}
}

function waitForAnimationFrame(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}
