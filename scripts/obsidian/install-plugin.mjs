import { ensureVaultExists, info, installPluginFiles, pluginDir, pluginId, rootDir, run } from './utils.mjs';

await ensureVaultExists();
info('Building plugin...');
run('pnpm', ['build'], { cwd: rootDir });
await installPluginFiles();
info(`Installed ${pluginId} into ${pluginDir}`);
