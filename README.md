# Common Markdown Diagram Editor

An Obsidian plugin prototype for editing SVG-backed diagrams from Markdown.

## Package Scripts

Install dependencies:

```bash
pnpm install
```

Run unit tests:

```bash
pnpm test
```

Build once:

```bash
pnpm build
```

Watch and rebuild during plugin development:

```bash
pnpm dev
```

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

See `docs/development.md` for the full WSL + Windows Obsidian workflow and required Obsidian CLI setting.
