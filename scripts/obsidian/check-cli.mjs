import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const executable = await findOnPath('obsidian');

if (!executable) {
	console.error(`Obsidian CLI is unavailable.

Enable it manually in Obsidian:
Settings -> About -> Advanced -> Obsidian command line`);
	process.exit(1);
}

console.log(`Obsidian CLI is available at ${executable}`);

async function findOnPath(command) {
	for (const directory of process.env.PATH?.split(':') ?? []) {
		const candidate = join(directory, command);

		try {
			await access(candidate, constants.X_OK);
			return candidate;
		} catch {
			// Try the next PATH entry.
		}
	}

	return null;
}
