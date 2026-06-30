# Common Markdown Diagram Editor

An Obsidian plugin prototype for editing SVG-backed diagrams from Markdown.

Languages: English | [简体中文](README.zh-CN.md)

## Quick Start

Install dependencies:

```bash
pnpm install
```

Create a test Obsidian vault anywhere, then export `VAULT_DIR` to its path.

```bash
export VAULT_DIR="/mnt/c/Users/qiudeng/Desktop/test-vault"
```

The vault must already be registered in Obsidian because the development script opens it by vault name.

If you develop from WSL on Windows, set `OBSIDIAN_PATH` to your local Obsidian executable.

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
