# BetterDiagram

BetterDiagram is an Obsidian plugin prototype for editing SVG-backed diagrams from Markdown.

> **Breaking rename:** the plugin ID is now `better-diagram`. Remove the old plugin directory before installing this version. SVG files carrying the former metadata attribute are not supported by BetterDiagram.

Languages: English | [简体中文](README.zh-CN.md)

## Quick Start

Install dependencies:

```bash
pnpm install
```

The development script uses this repository's `test-vault` by default. Override it with `VAULT_DIR` when needed.

```bash
export VAULT_DIR="/path/to/test-vault"
```

The vault must already be registered in Obsidian because the development script opens it by vault name.

On macOS, the script uses the `obsidian` command on `PATH` or the standard application path. On WSL, set `OBSIDIAN_PATH` if no Windows candidate is found.

```bash
export OBSIDIAN_PATH="/mnt/d/APP/Obsidian/Obsidian.exe"
```

Enable the Obsidian CLI at `Obsidian Settings -> About -> Advanced`.

After that, use the package scripts below. See `scripts/test-obsidian.sh` comments for implementation details.

Install the built plugin into the local development vault and launch Obsidian:

```bash
pnpm obsidian:start
```

Install the built plugin and reload it in an already-running Obsidian window:

```bash
pnpm obsidian:reload
```

Pass script options after `--`:

```bash
pnpm obsidian:start -- --vault-name "My Vault"
pnpm obsidian:reload -- --skip-build
```

See [开发流程](docs/development.md) for the full WSL + Windows Obsidian workflow.
