import {
	ensureVaultExists,
	info,
	isVaultRegistered,
	printVaultRegistrationHint,
	run,
	vaultName,
} from './utils.mjs';

await ensureVaultExists();

if (!(await isVaultRegistered())) {
	printVaultRegistrationHint();
	process.exit(1);
}

info(`Opening ${vaultName}`);
run('open', ['-a', 'Obsidian', `obsidian://open?vault=${encodeURIComponent(vaultName)}`]);
