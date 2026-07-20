import {
	buildAndInstallPlugin,
	ensureVaultExists,
	info,
	isVaultRegistered,
	pluginId,
	printVaultRegistrationHint,
	run,
	vaultName,
} from './utils.mjs';

await ensureVaultExists();

if (!(await isVaultRegistered())) {
	printVaultRegistrationHint();
	process.exit(1);
}

await buildAndInstallPlugin();
info(`Reloading ${pluginId} in ${vaultName}`);
run('obsidian', [`vault=${vaultName}`, 'plugin:reload', `id=${pluginId}`]);
