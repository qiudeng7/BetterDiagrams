# BetterDiagram

在 Obsidian 的 Markdown 编辑器内直接双击 SVG 图片，即可打开内置的 draw.io 或 tldraw 编辑器来编辑图片。使用 insert 命令创建 draw.io 或 tldraw 图表，然后直接双击图片开始编辑。工程信息会保存在 SVG 的 metadata 中，导出的 SVG 内容保留在 SVG 本体中，用于在 Markdown 内显示。

语言：[English](README.md) | 简体中文

## 安装

BetterDiagram 暂未上架 Obsidian 社区插件市场。可以从 GitHub Release 手动安装，或通过 BRAT 安装。

### 从 GitHub Release 安装

1. 打开[最新 Release](https://github.com/qiudeng7/BetterDiagrams/releases/latest)。
2. 在 **Assets** 中下载 `main.js`、`manifest.json` 和 `styles.css`。
3. 在 Vault 中创建 `.obsidian/plugins/better-diagram/` 目录。
4. 将下载的三个文件放入该目录。
5. 重启 Obsidian，然后在 **设置 → 第三方插件** 中启用 **BetterDiagram**。

### 通过 BRAT 安装

1. 从社区插件市场安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 从命令面板运行 **BRAT: Add a beta plugin for testing**。
3. 输入仓库地址：`qiudeng7/BetterDiagrams`。
4. 确认安装，然后在 **设置 → 第三方插件** 中启用 **BetterDiagram**。

BRAT 会检查仓库的 GitHub Release 更新；需要时可运行 **BRAT: Check for updates to all beta plugins** 手动更新。

## 使用

1. 在 Markdown 笔记中运行命令 **Insert a new Drawio diagram** 或 **Insert a new tldraw diagram**。
2. 编辑图表并保存。
3. 随时双击渲染后的 SVG，即可在其原始编辑器中重新打开。

draw.io 和 tldraw 的编辑器界面从各自官方在线服务加载，因此编辑时需要网络连接；生成的 SVG 和其中嵌入的编辑器数据会保存在本地 Vault 中。

## 开发者

开发命令和本地测试 Vault 流程见[开发流程](docs/development.md)。
