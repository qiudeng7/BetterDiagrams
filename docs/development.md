# 开发流程

本项目在 WSL 中开发，并在 Windows 版 Obsidian 中进行人工验证。

## 命令

使用 Obsidian 自动化命令前，需要先在 Obsidian 中启用 CLI：

```text
Settings -> About -> Advanced -> Obsidian command line
```

如果没有启用该设置，`obsidian:start` 和 `obsidian:reload` 无法稳定地从命令行打开 Vault 或重新加载插件。

在 Obsidian 中启动开发 Vault：

```bash
pnpm obsidian:start
```

该命令会构建插件，把 `dist/` 复制到测试 Vault 的插件目录，确保插件已启用，并通过 Obsidian URI 打开 Vault。

代码变更后重新加载插件：

```bash
pnpm obsidian:reload
```

该命令会构建插件，把 `dist/` 复制到测试 Vault 的插件目录，确保插件已启用，并执行 Obsidian CLI 的 `plugin:reload`。

只运行测试：

```bash
pnpm test
```

只运行构建：

```bash
pnpm build
```

## 脚本配置

package scripts 会调用 `scripts/test-obsidian.sh`。

默认配置：

```bash
PLUGIN_ID="common-markdown-diagram-editor"
VAULT_DIR="/mnt/c/Users/qiudeng/Desktop/test-vault"
VAULT_NAME="test-vault"
OBSIDIAN_PATH="D:\APP\Obsidian\Obsidian.exe"
```

脚本同时接受 Windows 路径和 WSL 路径。

使用自定义 Obsidian 可执行文件：

```bash
pnpm obsidian:start -- --obsidian-path "C:\path\to\Obsidian.exe"
```

使用自定义 Vault 路径和已注册的 Vault 名称：

```bash
pnpm obsidian:start -- --vault-path "C:\path\to\vault" --vault-name "My Vault"
```

使用环境变量代替 CLI 参数：

```bash
OBSIDIAN_PATH="/mnt/d/APP/Obsidian/Obsidian.exe" pnpm obsidian:start
```

只安装文件，不打开或重新加载 Obsidian：

```bash
bash scripts/test-obsidian.sh --install-only
```

不重新构建，直接复制已有 `dist/` 文件：

```bash
bash scripts/test-obsidian.sh --reload --skip-build
```

## 脚本行为

`obsidian:start` 和 `obsidian:reload` 都会执行以下共享步骤：

1. 除非传入 `--skip-build`，否则运行 `pnpm build`。
2. 检查 `dist/main.js`、`dist/manifest.json` 和 `dist/styles.css` 是否存在。
3. 如果需要，创建 `test-vault/.obsidian/plugins/common-markdown-diagram-editor/`。
4. 将三个 `dist/` 文件复制到该插件目录。
5. 将 `common-markdown-diagram-editor` 写入 `test-vault/.obsidian/community-plugins.json`。

随后根据模式执行不同操作。

`obsidian:start` 使用以下 URI 打开 Vault：

```text
obsidian://open?vault=test-vault
```

`obsidian:reload` 执行：

```bash
"/mnt/d/APP/Obsidian/Obsidian.exe" vault=test-vault plugin:reload id=common-markdown-diagram-editor
```

## Vault 名称

Obsidian CLI 按已注册的 Vault 名称定位 Vault，而不是按文件系统路径定位。

列出已注册的 Vault：

```bash
"/mnt/d/APP/Obsidian/Obsidian.exe" vaults verbose
```

如果脚本安装到一个路径，但 Obsidian 打开或重载了另一个 Vault，请传入正确的 `--vault-name`。

## 故障排查

如果 `obsidian:reload` 没有反应，请先运行 `pnpm obsidian:start`，并等待 Obsidian 完成 Vault 加载。

如果找不到 Obsidian 可执行文件，请传入 `--obsidian-path` 或设置 `OBSIDIAN_PATH`。

如果 Obsidian 提示安装器过旧，请从 `https://obsidian.md/download` 更新安装器。当前 CLI 仍可使用，但新版安装器包含更好的 CLI 支持。

如果插件没有显示为已启用，请检查：

```text
test-vault/.obsidian/community-plugins.json
```

其中应包含：

```json
["common-markdown-diagram-editor"]
```
