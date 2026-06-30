# Development Workflow

This project is developed from WSL and manually verified in Windows Obsidian.

## Commands

Before using the Obsidian automation commands, enable Obsidian CLI in Obsidian:

```text
Settings -> About -> Advanced -> Obsidian command line
```

Without this setting, `obsidian:start` and `obsidian:reload` cannot reliably open vaults or reload plugins from the command line.

Start the development vault in Obsidian:

```bash
pnpm obsidian:start
```

This command builds the plugin, copies `dist/` into the test vault plugin folder, ensures the plugin is enabled, and opens the vault with an Obsidian URI.

Reload the plugin after code changes:

```bash
pnpm obsidian:reload
```

This command builds the plugin, copies `dist/` into the test vault plugin folder, ensures the plugin is enabled, and runs Obsidian CLI `plugin:reload`.

Run tests only:

```bash
pnpm test
```

Build only:

```bash
pnpm build
```

## Script Configuration

The package scripts call `scripts/test-obsidian.sh`.

Default configuration:

```bash
PLUGIN_ID="common-markdown-diagram-editor"
VAULT_DIR="./test-vault"
VAULT_NAME="test-vault"
OBSIDIAN_PATH="D:\APP\Obsidian\Obsidian.exe"
```

The script accepts Windows paths and WSL paths.

Use a custom Obsidian executable:

```bash
pnpm obsidian:start -- --obsidian-path "C:\path\to\Obsidian.exe"
```

Use a custom vault path and registered vault name:

```bash
pnpm obsidian:start -- --vault-path "C:\path\to\vault" --vault-name "My Vault"
```

Use an environment variable instead of a CLI flag:

```bash
OBSIDIAN_PATH="/mnt/d/APP/Obsidian/Obsidian.exe" pnpm obsidian:start
```

Install files without opening or reloading Obsidian:

```bash
bash scripts/test-obsidian.sh --install-only
```

Copy existing `dist/` files without rebuilding:

```bash
bash scripts/test-obsidian.sh --reload --skip-build
```

## What The Script Does

Both `obsidian:start` and `obsidian:reload` perform these shared steps:

1. Run `pnpm build` unless `--skip-build` is provided.
2. Verify `dist/main.js`, `dist/manifest.json`, and `dist/styles.css` exist.
3. Create `test-vault/.obsidian/plugins/common-markdown-diagram-editor/` if needed.
4. Copy the three `dist/` files into that plugin folder.
5. Add `common-markdown-diagram-editor` to `test-vault/.obsidian/community-plugins.json`.

Then the modes diverge:

`obsidian:start` opens the vault with:

```text
obsidian://open?vault=test-vault
```

`obsidian:reload` runs:

```bash
"/mnt/d/APP/Obsidian/Obsidian.exe" vault=test-vault plugin:reload id=common-markdown-diagram-editor
```

## Vault Names

Obsidian CLI targets vaults by registered vault name, not by filesystem path.

List registered vaults:

```bash
"/mnt/d/APP/Obsidian/Obsidian.exe" vaults verbose
```

If the script installs into one path but Obsidian opens or reloads another vault, pass the correct `--vault-name`.

## Troubleshooting

If `obsidian:reload` does nothing, first run `pnpm obsidian:start` and wait for Obsidian to finish loading the vault.

If Obsidian cannot find the executable, pass `--obsidian-path` or set `OBSIDIAN_PATH`.

If Obsidian reports the installer is out of date, update the installer from `https://obsidian.md/download`. The current CLI still works, but newer installers include better CLI support.

If the plugin does not appear enabled, inspect:

```text
test-vault/.obsidian/community-plugins.json
```

It should include:

```json
["common-markdown-diagram-editor"]
```
