import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('test-obsidian script', () => {
	test('copies built plugin files into a development vault without launching Obsidian', () => {
		const tempRoot = mkdtempSync(join(tmpdir(), 'common-markdown-diagram-editor-'));
		const vaultPath = join(tempRoot, 'test-vault');

		try {
			execFileSync(
				'bash',
				[
					'scripts/test-obsidian.sh',
					'--no-launch',
					'--vault-path',
					vaultPath,
				],
				{ cwd: process.cwd(), stdio: 'pipe' },
			);

			const pluginDir = join(
				vaultPath,
				'.obsidian',
				'plugins',
				'common-markdown-diagram-editor',
			);

			expect(existsSync(join(pluginDir, 'manifest.json'))).toBe(true);
			expect(existsSync(join(pluginDir, 'main.js'))).toBe(true);
			expect(existsSync(join(pluginDir, 'styles.css'))).toBe(true);

			const manifest = JSON.parse(
				readFileSync(join(pluginDir, 'manifest.json'), 'utf8'),
			) as { id: string };

			expect(manifest.id).toBe('common-markdown-diagram-editor');

			const enabledPlugins = JSON.parse(
				readFileSync(
					join(vaultPath, '.obsidian', 'community-plugins.json'),
					'utf8',
				),
			) as string[];

			expect(enabledPlugins).toContain('common-markdown-diagram-editor');
		} finally {
			rmSync(tempRoot, { recursive: true, force: true });
		}
	}, 60_000);
});
