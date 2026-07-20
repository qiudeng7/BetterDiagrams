import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, basename, join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));

export const rootDir = join(scriptDir, '..', '..');
export const vaultDir = join(rootDir, 'test-vault');
export const vaultName = 'test-vault';
export const pluginId = 'better-diagram';
export const pluginDir = join(vaultDir, '.obsidian', 'plugins', pluginId);
export const distDir = join(rootDir, 'dist');
const obsidianRegistryPath = join(homedir(), 'Library', 'Application Support', 'obsidian', 'obsidian.json');

export function info(message) {
	console.log(`[obsidian] ${message}`);
}

export async function ensureVaultExists() {
	try {
		await access(vaultDir);
	} catch {
		throw new Error('Test vault does not exist. Run pnpm obsidian:vault:create first.');
	}
}

export async function isVaultRegistered() {
	let registry;

	try {
		registry = JSON.parse(await readFile(obsidianRegistryPath, 'utf8'));
	} catch {
		return false;
	}

	return Object.values(registry.vaults ?? {}).some(
		(vault) =>
			vault &&
			typeof vault === 'object' &&
			typeof vault.path === 'string' &&
			basename(vault.path) === vaultName,
	);
}

export function printVaultRegistrationHint() {
	console.error(`Test vault is not registered. In Obsidian's vault manager, open ${vaultDir} once with “Open folder as vault”, then retry.`);
}

export function run(command, args, options = {}) {
	const result = spawnSync(command, args, { stdio: 'inherit', ...options });

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with code ${result.status}.`);
	}
}

export async function buildAndInstallPlugin() {
	info('Building plugin...');
	run('pnpm', ['build'], { cwd: rootDir });
	await installPluginFiles();
	info(`Installed ${pluginId} into ${pluginDir}`);
}

export async function installPluginFiles() {
	for (const file of ['manifest.json', 'main.js', 'styles.css']) {
		await access(join(distDir, file));
	}
	await mkdir(pluginDir, { recursive: true });
	await Promise.all([
		rm(join(pluginDir, 'drawio'), { recursive: true, force: true }),
		rm(join(pluginDir, 'tldraw-assets'), { recursive: true, force: true }),
	]);
	await Promise.all(
		['manifest.json', 'main.js', 'styles.css'].map((file) =>
			cp(join(distDir, file), join(pluginDir, file)),
		),
	);
	const enabledPluginsPath = join(vaultDir, '.obsidian', 'community-plugins.json');
	const enabledPlugins = await readEnabledPlugins(enabledPluginsPath);

	if (!enabledPlugins.includes(pluginId)) {
		enabledPlugins.push(pluginId);
	}

	await writeFile(enabledPluginsPath, `${JSON.stringify(enabledPlugins, null, '\t')}\n`);
}

async function readEnabledPlugins(path) {
	try {
		const value = JSON.parse(await readFile(path, 'utf8'));
		return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
	} catch {
		return [];
	}
}
