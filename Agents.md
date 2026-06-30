## 协作说明

- 助手运行在 WSL 中，可以编辑代码、阅读文档、运行静态检查，并执行当前环境可用的构建或 CLI 测试。Obsidian 桌面端安装、插件加载、界面交互和端到端手动验证必须由用户在本地 Windows/Obsidian 环境中完成，并将结果反馈给助手继续修复。

## 项目规范

- 使用 `pnpm` 安装依赖和运行 package scripts。除非明确要求，不要在本项目中使用 `npm`。
- Git 提交信息使用 `type(scope): 中文message` 格式，message 部分必须为中文，例如 `chore(dev): 初始化 Obsidian 插件脚手架`。
- `README.md` 是主要英文版，必须引用中文版 `README.zh-CN.md`；`README.zh-CN.md` 是中文版，并引用主要英文版。编辑 README 内容时必须同步更新两个版本。
- 除主要英文版 `README.md` 外，项目内其他文档默认使用中文。
