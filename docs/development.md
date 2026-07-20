# 开发流程

开发脚本固定使用仓库根目录下的 `test-vault`，不支持传入其他 Vault 路径或名称。每个命令只完成一项工作，可按需组合。

## 1. 检查 Obsidian CLI

```bash
pnpm obsidian:check
```

该命令只检查 `obsidian` CLI 是否可用，不能自动启用它。首次使用时，请在 Obsidian 中手动打开：

```text
Settings -> About -> Advanced -> Obsidian command line
```

## 2. 创建测试 Vault

```bash
pnpm obsidian:vault:create
```

创建 `test-vault/.obsidian/`。命令可重复运行，不会删除或覆盖 Vault 内容。

首次创建后，还需要在 Obsidian 的 Vault 管理器中选择 **Open folder as vault**，并选择该 `test-vault` 目录。这是 Obsidian 注册 Vault 的一次性人工步骤；后续打开和重载命令都会检查名为 `test-vault` 的 Vault 是否已注册。

## 3. 注入插件

```bash
pnpm obsidian:plugin:install
```

该命令会构建插件，将 `dist/` 中的 `manifest.json`、`main.js` 和 `styles.css` 复制到：

```text
test-vault/.obsidian/plugins/better-diagram/
```

同时确保 `better-diagram` 已写入 `test-vault/.obsidian/community-plugins.json`。

## 4. 打开测试 Vault

```bash
pnpm obsidian:vault:open
```

该命令使用 `obsidian://open?vault=test-vault` 打开已注册的测试 Vault，不依赖 Obsidian CLI；未注册时会给出操作提示，而不会打开上次使用的 Vault。

## 5. 重载已打开的插件

```bash
pnpm obsidian:plugin:reload
```

该命令会先构建插件并注入 `test-vault`，再重载已打开 Vault 中的 `better-diagram`。代码改动后的常用流程是：

```bash
pnpm obsidian:plugin:reload
```

## 其他命令

```bash
pnpm test
pnpm build
```
