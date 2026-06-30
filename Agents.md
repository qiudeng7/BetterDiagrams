## Collaboration Notes

- The assistant runs inside WSL and can edit code, read documentation, run static checks, and execute builds or CLI-based tests available in this environment. Obsidian desktop installation, plugin loading, UI interaction, and end-to-end manual verification must be performed by the user in the local Windows/Obsidian environment, with results fed back to the assistant for fixes.

## Project Conventions

- Use `pnpm` for dependency installation and package scripts. Do not use `npm` for this project unless explicitly requested.
- Use Conventional Commits in the form `type(scope): message`, for example `chore(dev): configure obsidian workflow`.
