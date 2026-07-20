import { buildAndInstallPlugin, ensureVaultExists } from './utils.mjs';

await ensureVaultExists();
await buildAndInstallPlugin();
