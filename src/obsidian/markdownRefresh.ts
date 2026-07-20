import type { MarkdownView, WorkspaceLeaf } from 'obsidian';
import type { DiagramRefreshStrategy } from '../settings';

interface RebuildableWorkspaceLeaf extends WorkspaceLeaf {
	rebuildView?: () => Promise<void>;
}

export async function refreshMarkdownView(
	view: MarkdownView | null,
	strategy: DiagramRefreshStrategy,
	waitForLayout = waitForAnimationFrame,
): Promise<void> {
	if (!view) {
		return;
	}

	const scroll = view.editor.getScrollInfo();

	if (strategy === 'safe-only') {
		await reopenFileInLeaf(view);
	} else if (strategy === 'private-only') {
		await rebuildLeafView(view.leaf);
	} else {
		try {
			await rebuildLeafView(view.leaf);
		} catch {
			await reopenFileInLeaf(view);
		}
	}

	await waitForLayout();
	await waitForLayout();
	(view.leaf.view as MarkdownView).editor.scrollTo(scroll.left, scroll.top);
}

async function rebuildLeafView(leaf: WorkspaceLeaf): Promise<void> {
	const rebuildableLeaf = leaf as RebuildableWorkspaceLeaf;

	if (typeof rebuildableLeaf.rebuildView !== 'function') {
		throw new Error('WorkspaceLeaf.rebuildView is unavailable.');
	}

	await rebuildableLeaf.rebuildView();
}

async function reopenFileInLeaf(view: MarkdownView): Promise<void> {
	if (!view.file) {
		throw new Error('The Markdown tab has no file to reopen.');
	}

	await view.leaf.openFile(view.file, { eState: view.leaf.getEphemeralState() });
}

function waitForAnimationFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
