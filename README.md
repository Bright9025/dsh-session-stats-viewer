<div align="center">

# 📊 Session Stats Viewer

[English](./README.en.md) | [简体中文](./README.md)

为 **DeepSeek Harness（DSH）** 的 Web 侧边栏增加一个「会话统计」页：汇总全部会话的 Token 消耗、预估成本、缓存命中、每日用量、会话排行、对话性能与 DSH 运行时状态。

> DSH 插件 · 只读统计 · 无额外服务 · 无第三方依赖

</div>

## ✨ 功能特点

- 📈 **总览指标** – 总 Token、预估成本、会话数、缓存命中率，支持近 24 小时 / 7 天 / 14 天 / 30 天 / 所有。
- 💰 **可读的均价** – 按已用量自动选择 `1M / 10M / 100M / 1B tokens` 单位，避免出现 `¥0.00` 这类无意义数字。
- 🗓️ **每日消耗** – 输入 / 缓存读取 / 缓存写入 / 输出四类 Token 堆叠柱状图，悬停查看完整日期与拆分。
- 🏆 **会话消耗排行** – 按 Token、按耗时、按金额三种排序；主数字跟随所选指标，并显示所属工作区与轮次。
- ⚡ **对话性能** – 平均每轮耗时、平均首字延迟、输出速度、工具错误率。
- 🖥️ **DSH 运行状态** – 进程 CPU（单核与整机）、内存 RSS / 堆、事件循环 p99、运行时长、PID 与 Node 版本，每 5 秒采样。
- 🎯 **标题与侧边栏一致** – 标题取自 DSH 的 `title` 投影，而不是原始日志或首条消息。
- 🚀 **缓存先行 + 增量刷新** – 首屏直接显示上次快照，后台只重读有变化的会话。

## 🖼️ 界面

![会话统计总览](./docs/screenshots/overview.png)

## 📁 项目结构

```text
session-stats-viewer/
├── src/
│   ├── index.js            # Host：日志折叠、快照缓存、运行时采样、/api 路由
│   └── client.js           # Client：侧边栏图标与统计页面（单文件浏览器模块）
├── test/
│   └── stats.test.js       # 折叠、范围、均价、工作区映射的单元测试
├── locale/
│   ├── en.json             # 插件展示元数据（英文）
│   └── zh.json             # 插件展示元数据（中文）
├── docs/
│   └── screenshots/        # README 截图
├── cordis.patch.yml        # 插入 Host 插件行
├── icon.svg                # 插件图标
├── package.json
├── LICENSE
├── README.md
├── README.en.md
└── CONTRIBUTING.md
```

- **无构建步骤**：Host 与 Client 都是可直接加载的纯 JavaScript。
- **无运行时依赖**：只使用 Node 内置模块与 DSH 提供的服务。
- **只读**：不会写入、修改、归档或删除任何会话数据。

## 🚀 安装

### 环境要求

- DeepSeek Harness（DSH）Desktop 或 Web GUI，且当前 profile 具备 Web 界面
- 无需额外服务或 API Key
- 仅开发/测试需要 Node.js ≥ 20

### 从源码安装为本地插件

```bash
git clone https://github.com/Bright9025/session-stats-viewer.git
```

然后在 DSH 中把该目录作为本地 bundle 安装（例如让 DSH 智能体执行
`plugin_manager install_bundle`，参数为仓库的**绝对路径**），安装完成后：

1. 左侧边栏出现「会话统计」入口；
2. 若入口未出现，刷新页面或重启 DSH。

> 本插件以本地目录形式安装，不会发布到 npm；升级时重新安装该目录即可。

## 🧭 使用

1. 点击左侧边栏的 **会话统计**。
2. 顶部切换时间范围与货币（人民币 / 美元）。
3. 柱状图悬停查看某一天的完整日期与四类 Token 拆分。
4. 会话排行可切换 **按 Token / 按耗时 / 按金额**，点击任一行直接打开该会话。
5. 页面每 20 秒自动刷新；切换范围会立即重新取数。

## ⚙️ 配置

成本为**估算值**，默认单价（人民币 / 百万 Token）写在 `cordis.patch.yml`：

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `input` | 0.5 | 未命中缓存的输入 |
| `cacheRead` | 0.05 | 缓存读取 |
| `cacheWrite` | 0.5 | 缓存写入 |
| `output` | 2 | 输出 |
| `cnyPerUsd` | 7.2 | 人民币 / 美元换算 |

需要修改时，在 profile 的 `cordis.patch.yml` 中覆盖 `session-stats-page` 行（会替换整份 config，请把全部字段写全），然后重启 DSH：

```yaml
- id: session-stats-page
  config:
    pricing:
      input: 0.5
      cacheRead: 0.05
      cacheWrite: 0.5
      output: 2
      cnyPerUsd: 7.2
```

## 🧠 实现说明

- **数据来源**：Host 通过 `ctx.sessionQuery` 读取会话日志，折叠成按小时的 Token / 耗时 / 首字延迟 / 工具结果桶。
- **标题**：通过 `ctx.sessionQuery.observeSession(...).projections.values.title` 读取，与侧边栏使用同一份 `title` 投影。
- **工作区**：用会话的 `cwd` 匹配 `ctx.workspaceRegistry.list()`，得到侧边栏中的工作区名。
- **增量折叠**：每个会话的折叠结果按 `ctx.sessionPersistence` 的 revision 缓存；刷新时只重读有变化的会话。
- **快照**：完整折叠写入 `$DSH_HOME/cache/session-stats/fold-v2.json`；重启后首屏先显示该快照，再后台增量刷新。
- **接口**：`POST /api/session-stats.data`，经 DSH 的浏览器鉴权挂载，只返回所选时间范围的聚合视图。
- **客户端**：注册到 `sidebar.panellist` 与 `main` 插槽，使用 DSH 主题变量，不引入外部 UI 库。

## ⚠️ 已知限制

- **成本是估算**：按 Token 单价计算，不代表真实账单。
- **运行状态只描述 DSH 进程**：CPU / 内存为 DSH 自身；「整机」那一行才是所有核心的总 CPU。
- **首次冷启动较慢**：没有快照时需完整折叠一次；之后启动先显示快照。
- **「所有」从最早记录开始**：如果历史只有 21 天，它会比「近 30 天」的固定窗口短，但总量相同。
- **工作区标签依赖 `cwd` 匹配**：会话目录不在任何已注册工作区时，只显示轮次。
- **工具错误率**按 `tool/result` 中带 `error` 的记录统计。

## 🧪 开发与测试

```bash
npm test
```

测试使用 Node 内置 `node:test`，覆盖折叠、时间范围、均价、工作区映射与空数据。

手动验证：

1. 把仓库作为本地 bundle 安装到测试 profile；
2. 打开「会话统计」，检查各范围、三种排行、悬停详情与货币切换；
3. 重启 DSH，确认首屏来自快照且随后自动刷新。

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📧 联系方式

- Bug / 功能建议：GitHub Issues
- 安全问题：请通过 GitHub 私下联系维护者，不要在公开 Issue 中贴出利用细节
