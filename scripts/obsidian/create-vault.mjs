import { mkdir } from 'node:fs/promises';
import { info, vaultDir } from './utils.mjs';

await mkdir(`${vaultDir}/.obsidian`, { recursive: true });
info(`Test vault is ready at ${vaultDir}`);
