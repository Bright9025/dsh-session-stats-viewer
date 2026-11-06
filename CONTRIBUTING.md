# 贡献指南 / Contributing to DSH Session Stats Viewer

感谢你愿意改进 Session Stats Viewer。无论是 Bug 报告、文档修订、截图更新还是代码提交，都欢迎。

> English speakers: the commands and PR checklist below apply to everyone. Feel free to open an issue in English.

## 开始之前

1. 先阅读 [README.md](./README.md) 和 [English README](./README.en.md)，确认当前功能与已知边界。
2. 搜索现有 [Issues](https://github.com/Bright9025/dsh-session-stats-viewer/issues)，避免重复报告。
3. 较大的功能改动请先开 Issue 讨论方向，不要直接提交一个难以评审的大 PR。
4. **不要提交个人数据**：会话标题、工作区路径、真实 Token 账单、`fold-*.json` 快照、`~/.dsh` 下的任何文件。

## 开发环境

- DeepSeek Harness（DSH）Desktop 或 Web GUI
- Node.js ≥ 20（仅测试需要）
- 无需安装依赖、无需构建

```bash
git clone https://github.com/Bright9025/dsh-session-stats-viewer.git
cd dsh-session-stats-viewer
npm test
```

在 DSH 中测试时，把这个目录作为本地 bundle 安装到测试 profile，然后在侧边栏打开「会话统计」。

## 修改后如何验证

1. 运行 `npm test`，确认折叠、范围、均价与工作区映射的用例全部通过；
2. 安装/重新安装本地 bundle，打开「会话统计」；
3. 检查：
   - 五个时间范围（24 小时 / 7 / 14 / 30 天 / 所有）都能切换；
   - 柱状图标签不重叠，悬停显示完整日期；
   - 排行的三种排序下主数字与次行正确切换；
   - 人民币 / 美元切换后均价单位合理；
   - 重启 DSH 后首屏先显示快照，再自动刷新。
4. 如果改动涉及快照结构，必须同时提升 `SNAPSHOT_VERSION` 并更换快照文件名，避免旧数据被误读。

## 代码约定

- Host 代码放在 `src/index.js`；Client 代码放在 `src/client.js`。
- Client 是单个浏览器模块，模块 id 必须与 `package.json` 的包名一致；不要引入外部 UI 库，也不要 `require` 其他 DSH Client 包。
- 样式使用 DSH 主题变量（`--dsw-alias-*`），不要写死颜色；容器与文字必须同时适配明暗主题。
- 所有可见文案通过 Client locale 注册；新增或修改文案时，必须同时补齐 `zh`、`en`、`ja`、`es`、`fr`、`de`、`ru`、`pt` 八种字典，并保留 `{placeholder}` 占位符（`npm test` 会检查键与占位符完整性）。
- Host 的纯函数（`foldSession`、`buildView`、`costOf`）保持可导出、无副作用，便于测试。
- 不新增运行时依赖；确需新增时先开 Issue 说明理由。
- 不修改、不归档、不删除任何会话数据；统计页必须保持只读。
- 不读取其他插件的 DOM、样式或组件源码。

## 分支与提交

- 从 `main` 拉出功能分支：

```bash
git switch -c feat/your-feature
# 或
git switch -c fix/your-bug
```

- 一个提交只做一件事，提交信息使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)：

```text
feat: 增加按工作区筛选
fix(client): 修复窄屏下标签重叠
docs: 更新安装说明
test: 覆盖空数据视图
```

- 描述用中文、动词开头、不超过 40 字；正文说明原因与影响。
- 不要提交 `node_modules/`、日志、快照、个人截图或临时文件。
- 提交前先同步 `main`，解决冲突后再发起 PR。

## Pull Request 检查清单

- [ ] 已关联对应 Issue（如有）
- [ ] `npm test` 通过
- [ ] 手动验证了相关时间范围与排序
- [ ] 中英文 README / 截图路径已同步（如涉及界面变化）
- [ ] 没有提交个人数据、快照、日志或构建产物
- [ ] 改动聚焦，提交信息符合约定式提交

## 许可证

提交代码即表示你同意以本项目的 [MIT License](./LICENSE) 授权你的贡献。

## 联系方式

- Bug / 功能建议：GitHub Issues
- 安全问题：请通过 GitHub 私下联系维护者，不要在公开 Issue 中贴出利用细节
