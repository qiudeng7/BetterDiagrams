import { describe, expect, test, vi } from 'vitest';
import { captureMarkdownScroll, refreshMarkdownView } from '../src/markdownRefresh';

describe('markdown refresh helpers', () => {
	test('captures preview scroll and restores it after rerender', async () => {
		const applyScroll = vi.fn();
		const rerender = vi.fn();
		const view = {
			currentMode: {
				getScroll: () => 420,
				applyScroll,
			},
			previewMode: {
				rerender,
			},
		};

		const snapshot = captureMarkdownScroll(view);

		await refreshMarkdownView(view, snapshot, async () => undefined);

		expect(rerender).toHaveBeenCalledWith(true);
		expect(applyScroll).toHaveBeenCalledWith(420);
	});

	test('falls back to resetting view data when preview rerender is unavailable', async () => {
		const setViewData = vi.fn();
		const view = {
			currentMode: {
				getScroll: () => 12,
				applyScroll: vi.fn(),
			},
			getViewData: () => 'markdown',
			setViewData,
		};

		await refreshMarkdownView(view, captureMarkdownScroll(view), async () => undefined);

		expect(setViewData).toHaveBeenCalledWith('markdown', false);
	});
});
