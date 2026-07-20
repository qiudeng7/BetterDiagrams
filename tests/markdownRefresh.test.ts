import { describe, expect, test, vi } from 'vitest';
import { refreshMarkdownView } from '../src/obsidian/markdownRefresh';

function createView(options: { rebuildView?: () => Promise<void>; openFile?: () => Promise<void> } = {}) {
	const scrollTo = vi.fn();
	const leaf = {
		view: { editor: { scrollTo } },
		rebuildView: options.rebuildView,
		openFile: options.openFile ?? vi.fn(async () => undefined),
		getEphemeralState: () => ({ focus: true }),
	};
	const view = {
		file: { path: 'note.md' },
		leaf,
		editor: { getScrollInfo: () => ({ left: 8, top: 420 }) },
	};

	return { leaf, scrollTo, view };
}

describe('markdown tab refresh', () => {
	test('uses the private rebuild API by default', async () => {
		const rebuildView = vi.fn(async () => undefined);
		const { leaf, scrollTo, view } = createView({ rebuildView });

		await refreshMarkdownView(view as never, 'private-first', async () => undefined);

		expect(rebuildView).toHaveBeenCalledOnce();
		expect(leaf.openFile).not.toHaveBeenCalled();
		expect(scrollTo).toHaveBeenCalledWith(8, 420);
	});

	test('falls back to reopening the file when the private API fails', async () => {
		const rebuildView = vi.fn(async () => { throw new Error('unavailable'); });
		const openFile = vi.fn(async () => undefined);
		const { scrollTo, view } = createView({ rebuildView, openFile });

		await refreshMarkdownView(view as never, 'private-first', async () => undefined);

		expect(openFile).toHaveBeenCalledWith(view.file, { eState: { focus: true } });
		expect(scrollTo).toHaveBeenCalledWith(8, 420);
	});

	test('uses only the selected refresh mechanism', async () => {
		const rebuildView = vi.fn(async () => { throw new Error('unavailable'); });
		const openFile = vi.fn(async () => undefined);
		const { view } = createView({ rebuildView, openFile });

		await expect(refreshMarkdownView(view as never, 'private-only', async () => undefined)).rejects.toThrow('unavailable');
		expect(openFile).not.toHaveBeenCalled();

		await refreshMarkdownView(view as never, 'safe-only', async () => undefined);
		expect(openFile).toHaveBeenCalledOnce();
	});
});
