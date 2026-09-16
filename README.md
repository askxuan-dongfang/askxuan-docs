# 问玄东方 0.0.1

本次正文与 PDF 修订：**2026-09-16**。覆盖邮箱认证、双轨入驻、服务执行与回执、集中进度和 iOS 对齐；竞品旧观察与历史截图保留原日期。

本仓库维护产品 **0.0.1** 的当前手册、技术契约、部署方法与待办。版本号统一产品基线，不代表所有真实交易、设备和外部服务均已验收。当前限制见[产品现状与能力边界](docs/product/产品现状与能力边界.md)。

## 四册产品手册

| 册别 | 在线正文 | PDF |
| --- | --- | --- |
| 01 使用 | [产品使用手册](docs/guides/产品使用手册.md) | [下载](output/pdf/问玄东方_产品使用手册.pdf) |
| 02 设计 | [视觉设计与交互手册](docs/guides/视觉设计与交互手册.md) | [下载](output/pdf/问玄东方_视觉设计与交互手册.pdf) |
| 03 运营 | [运营与合作手册](docs/guides/运营与合作手册.md) | [下载](output/pdf/问玄东方_运营与合作手册.pdf) |
| 04 决策 | [竞品研究与产品决策手册](docs/guides/竞品研究与产品决策手册.md) | [下载](output/pdf/天机阁与佑愿天机_竞品研究与产品决策手册.pdf) |

四册正文与 PDF 对应当前产品 0.0.1，生成与维护方式见[手册目录](docs/guides/手册目录.md)，交付检查结果见[本次同步核验](docs/reports/2026-09-16-产品文档同步.md)。

## 定位、宣传、功能与调研在哪里

- 产品定位、对外介绍、运营和合作：[运营与合作手册](docs/guides/运营与合作手册.md)。
- 功能与用户操作：[产品使用手册](docs/guides/产品使用手册.md)及其五份分册。
- 当前实现、端差异和限制：[产品现状与能力边界](docs/product/产品现状与能力边界.md)。
- 视觉、图标与动效：[视觉设计与交互手册](docs/guides/视觉设计与交互手册.md)。
- 竞品调研与产品决策：[竞品研究与产品决策手册](docs/guides/竞品研究与产品决策手册.md)。
- 本次更新与证据：[9 月 16 日同步记录](docs/reports/2026-09-16-产品文档同步.md)。

正文集中维护在 `docs/guides/`，可分享 PDF 在 `output/pdf/`；`artifacts/` 用于本地交付证据，不另设产品手册副本。私密测试账号不打包进公开手册。

## 按任务阅读

| 任务 | 入口 |
| --- | --- |
| 产品能力、端差异与未验收项 | [当前能力与限制](docs/product/产品现状与能力边界.md) |
| 需求与版本工作 | [需求入口](specs/README.md) |
| API 接入 | [API Reference](API-REFERENCE.md) · [API 规范](docs/architecture/API规范.md) |
| 架构与数据 | [技术架构](docs/architecture/技术架构.md) · [业务流程](docs/architecture/业务流程.md) · [状态机](docs/architecture/状态机.md) · [字段字典](docs/standards/字段字典.md) · [统一字典](docs/standards/统一数据字典.md) |
| 本地研发 | [目录与维护](docs/guides/本地项目目录与维护.md) · [Go](docs/guides/Go后端指南.md) · [iOS](docs/guides/iOS入门指南.md) |
| 发布、恢复与运维 | [GitHub Actions 与 ECS](docs/deployment/GITHUB-ACTIONS.md) · [聊天运维](docs/deployment/CHAT.md) · [MQ 故障演练](docs/guides/MQ可靠投递监控与故障演练.md) |
| 文档及交付核验 | [0.0.1 核验](docs/reports/0.0.1-核验.md) |

## 当前产品载体

| 载体 | 角色 |
| --- | --- |
| H5 `/c`、`/m` | 信众与法师；H5 为独立 Git 仓库 |
| 两套原生 iOS | 信众 App 与法师工作台，分别构建和签名 |
| Web `/admin` | 平台与商城共用统一运营管理台，按权限展示 |
| Web `/temple` | 寺院管理台 |
| Web `/shop` | 统一后台构建内的静态迁移页，跳转对应商城业务 |

业务 Web 只维护两个构建工程：`apps/web-platform-admin`（包含商城 `/commerce/*`）和 `apps/web-temple-admin`。旧 `apps/web-shop-admin` 工程移除；`/shop` 由统一后台产物 `dist/legacy/shop/index.html` 接管，随 admin 发布，无独立 npm 工程或组件依赖。寺院管理台继续独立维护。

产品版本为 **0.0.1**，源码按[代码核对索引](docs/guides/manual/代码核对索引.md)中的精确提交定位。构建、发布和验收结果记录在[核验页](docs/reports/0.0.1-核验.md)，产品版本不替代实际交付证据。

正式品牌资源只维护在[前端 packages/brand](https://github.com/askxuan-dongfang/askxuan-frontend/tree/f4d72ec774f095cad276aed3e4b76e23a0c8770f/packages/brand)。手册必要图版位于 `docs/assets/0.0.1/`；不把普通功能图标或用户头像当作 Logo。

## 源码与验证

- [后端](https://github.com/askxuan-dongfang/askxuan-backend)：19 个业务服务及 1 个网关。2026-09-16 API 静态审计覆盖 **19 个业务服务的 412 个唯一 HTTP 契约**，不计网关 health 和 OpenIM 透传。
- [前端](https://github.com/askxuan-dongfang/askxuan-frontend)：两套 iOS、管理包与共享视觉资源。
- [H5](https://github.com/askxuan-dongfang/askxuan-h5)：独立发布，本地位于前端 `apps/web-h5`，需单独检查 Git 状态。

运行 `node scripts/audit-markdown-links.mjs` 检查文档链接，运行 `node scripts/audit-api-contracts.mjs ../askXuan-backend` 检查业务 API 覆盖。源码、构建、部署、页面验证与真实业务验收分别记录；没有相应证据的能力保留为限制或待办。
