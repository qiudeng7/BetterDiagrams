#!/usr/bin/env bash
#
# Installs and controls the Obsidian development plugin from WSL.
#
# This script is intentionally the single implementation behind the package
# scripts `pnpm obsidian:start` and `pnpm obsidian:reload`. It builds the plugin
# into `dist/`, copies the generated Obsidian plugin files into the configured
# development vault, ensures the community plugin is enabled in that vault, then
# either opens the vault or asks Obsidian's command line interface to reload the
# plugin.
#
# Obsidian CLI must be enabled in Obsidian first:
# Settings -> About -> Advanced -> Obsidian command line.
#
# Paths may be passed as WSL paths or Windows paths. The default executable path
# matches the local Windows installation used by this project:
# D:\APP\Obsidian\Obsidian.exe.

set -euo pipefail

# Obsidian community plugin id. Must match manifest.json and the target plugin folder name.
PLUGIN_ID="common-markdown-diagram-editor"

# Absolute path to this script and repository root. Used so the script works from any cwd.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

# Development vault path. Defaults to the Windows desktop vault so Obsidian can access it.
# Accepts either WSL paths or Windows paths via --vault-path.
VAULT_DIR="/mnt/c/Users/qiudeng/Desktop/test-vault"

# Vault name registered in Obsidian. Defaults to the vault folder name when not provided.
VAULT_NAME=""

# Obsidian executable path. Can be overridden with OBSIDIAN_PATH or --obsidian-path.
OBSIDIAN_PATH="${OBSIDIAN_PATH:-}"

# Script mode: start opens the vault, reload runs plugin:reload, install only copies files.
ACTION="start"

# Build control. Set by --skip-build when dist already contains the desired plugin files.
SKIP_BUILD=0

usage() {
	cat <<'EOF'
Usage: scripts/test-obsidian.sh [mode] [options]

Builds the plugin into ./dist, installs it into a development vault, and starts or reloads Obsidian.

Modes:
  --start              Install the plugin and open the development vault. Default.
  --reload             Install the plugin and run Obsidian plugin:reload.
  --install-only       Install the plugin without launching or reloading Obsidian.

Options:
  --obsidian-path PATH  Path to Obsidian.exe. Accepts WSL or Windows paths.
  --vault-path PATH     Development vault path. Defaults to the Windows desktop test vault.
  --vault-name NAME     Obsidian vault name. Defaults to the vault folder name.
  --skip-build          Copy existing build output without running pnpm build.
  --no-launch           Alias for --install-only.
  -h, --help            Show this help message.

Environment:
  OBSIDIAN_PATH         Alternative to --obsidian-path.

Examples:
  scripts/test-obsidian.sh --start
  scripts/test-obsidian.sh --reload
  pnpm obsidian:start
  pnpm obsidian:reload
EOF
}

fail() {
	printf 'Error: %s\n' "$*" >&2
	exit 1
}

info() {
	printf '[test:obsidian] %s\n' "$*"
}

enable_plugin() {
	local plugins_file="$VAULT_DIR/.obsidian/community-plugins.json"

	node - "$plugins_file" "$PLUGIN_ID" <<'NODE'
const fs = require('node:fs');

const pluginsFile = process.argv[2];
const pluginId = process.argv[3];
let plugins = [];

if (fs.existsSync(pluginsFile)) {
	try {
		const parsed = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
		if (Array.isArray(parsed)) {
			plugins = parsed.filter((value) => typeof value === 'string');
		}
	} catch {
		plugins = [];
	}
}

if (!plugins.includes(pluginId)) {
	plugins.push(pluginId);
}

fs.writeFileSync(pluginsFile, `${JSON.stringify(plugins, null, '\t')}\n`);
NODE
}

url_encode() {
	node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$1"
}

to_wsl_path() {
	local path="$1"

	if command -v wslpath >/dev/null 2>&1 && [[ "$path" =~ ^[A-Za-z]:\\ ]]; then
		wslpath -u "$path"
		return
	fi

	printf '%s\n' "$path"
}

to_windows_path() {
	local path="$1"

	if command -v wslpath >/dev/null 2>&1; then
		wslpath -w "$path"
		return
	fi

	printf '%s\n' "$path"
}

resolve_obsidian_path() {
	if [[ -n "$OBSIDIAN_PATH" ]]; then
		to_wsl_path "$OBSIDIAN_PATH"
		return
	fi

	local windows_user="${WINDOWS_USER:-${USER:-}}"
	local candidates=()

	if [[ -n "$windows_user" ]]; then
		candidates+=("/mnt/c/Users/$windows_user/AppData/Local/Obsidian/Obsidian.exe")
	fi

	candidates+=(
		"/mnt/d/APP/Obsidian/Obsidian.exe"
		"/mnt/c/Program Files/Obsidian/Obsidian.exe"
		"/mnt/c/Program Files (x86)/Obsidian/Obsidian.exe"
	)

	for candidate in "${candidates[@]}"; do
		if [[ -f "$candidate" ]]; then
			printf '%s\n' "$candidate"
			return
		fi
	done

	return 1
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--start)
			ACTION="start"
			shift
			;;
		--reload)
			ACTION="reload"
			shift
			;;
		--install-only)
			ACTION="install"
			shift
			;;
		--obsidian-path)
			[[ $# -ge 2 ]] || fail '--obsidian-path requires a value.'
			OBSIDIAN_PATH="$2"
			shift 2
			;;
		--vault-path)
			[[ $# -ge 2 ]] || fail '--vault-path requires a value.'
			VAULT_DIR="$2"
			shift 2
			;;
		--vault-name)
			[[ $# -ge 2 ]] || fail '--vault-name requires a value.'
			VAULT_NAME="$2"
			shift 2
			;;
		--skip-build)
			SKIP_BUILD=1
			shift
			;;
		--no-launch)
			ACTION="install"
			shift
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			fail "Unknown option: $1"
			;;
	esac
done

VAULT_DIR="$(to_wsl_path "$VAULT_DIR")"
if [[ -z "$VAULT_NAME" ]]; then
	VAULT_NAME="$(basename "$VAULT_DIR")"
fi
PLUGIN_DIR="$VAULT_DIR/.obsidian/plugins/$PLUGIN_ID"
DIST_DIR="$ROOT_DIR/dist"

if [[ "$SKIP_BUILD" -eq 0 ]]; then
	info 'Building plugin...'
	(cd "$ROOT_DIR" && pnpm build)
else
	info 'Skipping build.'
fi

for file in manifest.json main.js styles.css; do
	[[ -f "$DIST_DIR/$file" ]] || fail "Missing dist/$file. Run pnpm build first."
done

info "Installing plugin into $PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR"
cp "$DIST_DIR/manifest.json" "$DIST_DIR/main.js" "$DIST_DIR/styles.css" "$PLUGIN_DIR/"
enable_plugin

if [[ "$ACTION" == "install" ]]; then
	info 'Installed plugin. Skipping Obsidian launch and reload.'
	exit 0
fi

OBSIDIAN_EXE="$(resolve_obsidian_path || true)"

if [[ -z "$OBSIDIAN_EXE" || ! -f "$OBSIDIAN_EXE" ]]; then
	fail 'Could not find Obsidian.exe. Pass --obsidian-path or set OBSIDIAN_PATH.'
fi

VAULT_URI="obsidian://open?vault=$(url_encode "$VAULT_NAME")"

if [[ "$ACTION" == "start" ]]; then
	info "Launching Obsidian at $OBSIDIAN_EXE"
	info "Opening vault $VAULT_NAME via $VAULT_URI"
	("$OBSIDIAN_EXE" "$VAULT_URI" >/dev/null 2>&1 &)
	exit 0
fi

if [[ "$ACTION" == "reload" ]]; then
	info "Reloading plugin $PLUGIN_ID in vault $VAULT_NAME"
	"$OBSIDIAN_EXE" "vault=$VAULT_NAME" plugin:reload "id=$PLUGIN_ID"
	exit 0
fi

fail "Unknown action: $ACTION"
