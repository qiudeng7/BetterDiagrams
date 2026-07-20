# BetterDiagram

BetterDiagram 是一个 Obsidian 插件原型，用于从 Markdown 编辑基于 SVG 的图表。

> **破坏性改名：** 插件 ID 已改为 `better-diagram`。安装此版本前请删除旧插件目录；携带旧元数据属性的 SVG 文件不再受 BetterDiagram 支持。

语言：[English](README.md) | 简体中文

## 快速开始

安装依赖：

```bash
pnpm install
```

开发脚本默认使用仓库内的 `test-vault`；需要时可通过 `VAULT_DIR` 覆盖。

```bash
export VAULT_DIR="/path/to/test-vault"
```

该 vault 必须已经在 Obsidian 中注册，因为开发脚本会通过 vault 名称打开它。

在 macOS 上，脚本会使用 PATH 中的 `obsidian` 命令或标准应用路径；在 WSL 上，如果未找到 Windows 候选路径，请设置 `OBSIDIAN_PATH`。

```bash
export OBSIDIAN_PATH="/mnt/d/APP/Obsidian/Obsidian.exe"
```

在 `Obsidian Settings -> About -> Advanced` 中启用 Obsidian CLI。

之后使用下面的 package scripts。实现细节可查看 `scripts/test-obsidian.sh` 注释。

将构建后的插件安装到本地开发 vault 并启动 Obsidian：

```bash
pnpm obsidian:start
```

将构建后的插件安装到已经运行的 Obsidian 窗口，并重新加载插件：

```bash
pnpm obsidian:reload
```

在 `--` 后传递脚本选项：

```bash
pnpm obsidian:start -- --vault-name "My Vault"
pnpm obsidian:reload -- --skip-build
```

完整的 WSL + Windows Obsidian 工作流见 [开发流程](docs/development.md)。
