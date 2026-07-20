# BetterDiagram

BetterDiagram is an Obsidian plugin prototype for editing SVG-backed diagrams from Markdown.

> **Breaking rename:** the plugin ID is now `better-diagram`. Remove the old plugin directory before installing this version. SVG files carrying the former metadata attribute are not supported by BetterDiagram.

Languages: English | [简体中文](README.zh-CN.md)

## Quick Start

Install dependencies:

```bash
pnpm install
```

Development commands always use this repository's `test-vault`. Enable the Obsidian CLI manually at `Settings -> About -> Advanced -> Obsidian command line`, then check that it is available:

```bash
pnpm obsidian:check
```

Create the development vault. The first time only, register this folder through Obsidian's vault manager with **Open folder as vault**. Then install the built plugin and open it:

```bash
pnpm obsidian:vault:create
pnpm obsidian:plugin:install
pnpm obsidian:vault:open
```

After changing code, install and reload the plugin in the already-open vault:

```bash
pnpm obsidian:plugin:install
pnpm obsidian:plugin:reload
```

See [开发流程](docs/development.md) for all commands.
