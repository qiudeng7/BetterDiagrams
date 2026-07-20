# BetterDiagram

BetterDiagram 是一个 Obsidian 插件原型，用于从 Markdown 编辑基于 SVG 的图表。

> **破坏性改名：** 插件 ID 已改为 `better-diagram`。安装此版本前请删除旧插件目录；携带旧元数据属性的 SVG 文件不再受 BetterDiagram 支持。

语言：[English](README.md) | 简体中文

## 快速开始

安装依赖：

```bash
pnpm install
```

开发命令固定使用仓库内的 `test-vault`。请先在 `Settings -> About -> Advanced -> Obsidian command line` 中手动启用 Obsidian CLI，然后检查 CLI 是否可用：

```bash
pnpm obsidian:check
```

创建开发 Vault。仅首次需要在 Obsidian 的 Vault 管理器中使用 **Open folder as vault** 注册该目录；之后注入构建后的插件并打开它：

```bash
pnpm obsidian:vault:create
pnpm obsidian:plugin:install
pnpm obsidian:vault:open
```

代码修改后，重新注入并重载已打开 Vault 中的插件：

```bash
pnpm obsidian:plugin:install
pnpm obsidian:plugin:reload
```

所有命令见 [开发流程](docs/development.md)。
