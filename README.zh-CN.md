# Common Markdown Diagram Editor

一个 Obsidian 插件原型，用于从 Markdown 编辑基于 SVG 的图表。

语言：[English](README.md) | 简体中文

## 快速开始

安装依赖：

```bash
pnpm install
```

在任意位置创建一个测试 Obsidian vault，然后将 `VAULT_DIR` 导出为该 vault 路径。

```bash
export VAULT_DIR="/mnt/c/Users/qiudeng/Desktop/test-vault"
```

该 vault 必须已经在 Obsidian 中注册，因为开发脚本会通过 vault 名称打开它。

如果你在 Windows 上使用 WSL 开发，请将 `OBSIDIAN_PATH` 设置为本地 Obsidian 可执行文件路径。

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
