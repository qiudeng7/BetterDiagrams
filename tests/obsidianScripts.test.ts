import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
	scripts: Record<string, string>;
};

describe('Obsidian development scripts', () => {
	test('exposes one command for each development operation', () => {
		expect(packageJson.scripts).toMatchObject({
			'obsidian:check': 'node scripts/obsidian/check-cli.mjs',
			'obsidian:vault:create': 'node scripts/obsidian/create-vault.mjs',
			'obsidian:plugin:install': 'node scripts/obsidian/install-plugin.mjs',
			'obsidian:vault:open': 'node scripts/obsidian/open-vault.mjs',
			'obsidian:plugin:reload': 'node scripts/obsidian/reload-plugin.mjs',
		});
	});

	test('uses only the repository test vault', () => {
		const library = readFileSync(new URL('../scripts/obsidian/utils.mjs', import.meta.url), 'utf8');

		expect(library).toContain("export const vaultDir = join(rootDir, 'test-vault');");
		expect(library).not.toContain('process.env.VAULT_DIR');
	});

	test('keeps the five operation scripts available', () => {
		for (const script of [
			'check-cli.mjs',
			'create-vault.mjs',
			'install-plugin.mjs',
			'open-vault.mjs',
			'reload-plugin.mjs',
		]) {
			expect(existsSync(new URL(`../scripts/obsidian/${script}`, import.meta.url))).toBe(true);
		}
	});

	test('checks for the CLI without invoking Obsidian', () => {
		const script = readFileSync(new URL('../scripts/obsidian/check-cli.mjs', import.meta.url), 'utf8');

		expect(script).toContain("findOnPath('obsidian')");
		expect(script).not.toContain("spawnSync('obsidian'");
	});

	test('installs the latest build before reloading the plugin', () => {
		const script = readFileSync(new URL('../scripts/obsidian/reload-plugin.mjs', import.meta.url), 'utf8');

		expect(script).toContain('await buildAndInstallPlugin()');
	});


	test('opens the registered test vault by URI', () => {
		const script = readFileSync(new URL('../scripts/obsidian/open-vault.mjs', import.meta.url), 'utf8');

		expect(script).toContain('await isVaultRegistered()');
		expect(script).toContain('obsidian://open?vault=');
	});
});
