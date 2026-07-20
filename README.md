# BetterDiagram

Double-click an SVG image directly in Obsidian's Markdown editor to edit it with the built-in draw.io or tldraw editor. Use an insert command to create a draw.io or tldraw diagram, then double-click the image to start editing. Project data is stored in the SVG metadata, while the exported SVG content remains in the SVG itself for display in Markdown.

Languages: English | [简体中文](README.zh-CN.md)

## Install

BetterDiagram is not currently in the Obsidian Community Plugins directory. Install it from a GitHub Release or through BRAT.

### Install from GitHub Releases

1. Open the [latest release](https://github.com/qiudeng7/BetterDiagrams/releases/latest).
2. Download `main.js`, `manifest.json`, and `styles.css` from **Assets**.
3. In your vault, create `.obsidian/plugins/better-diagram/`.
4. Place the three downloaded files in that folder.
5. Restart Obsidian, then enable **BetterDiagram** under **Settings → Community plugins**.

### Install with BRAT

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin.
2. Run **BRAT: Add a beta plugin for testing** from the Command Palette.
3. Enter `qiudeng7/BetterDiagrams` as the repository.
4. Confirm the installation, then enable **BetterDiagram** under **Settings → Community plugins**.

BRAT checks the repository's GitHub Releases for updates. Use **BRAT: Check for updates to all beta plugins** to update manually.

## Use

1. In a Markdown note, run either **Insert a new Drawio diagram** or **Insert a new tldraw diagram**.
2. Edit the diagram and save it.
3. Double-click the rendered SVG at any time to reopen it in its original editor.

draw.io and tldraw load their editor UI from their official online services, so an internet connection is needed while editing. The resulting SVG and its embedded editor data are stored locally in your vault.

## For developers

Development commands and the local test vault workflow are documented in [开发流程](docs/development.md).
