# 问玄东方 0.0.1

本仓库维护产品 **0.0.1** 的当前手册、技术契约、部署方法与待办。版本号统一产品基线，不代表所有真实交易、设备和外部服务均已验收。当前限制见[产品现状与能力边界](docs/product/产品现状与能力边界.md)。

## 四册产品手册

| 册别 | 在线正文 | PDF |
| --- | --- | --- |
| 01 使用 | [产品使用手册](docs/guides/产品使用手册.md) | [下载](output/pdf/问玄东方_产品使用手册.pdf) |
| 02 设计 | [视觉设计与交互手册](docs/guides/视觉设计与交互手册.md) | [下载](output/pdf/问玄东方_视觉设计与交互手册.pdf) |
| 03 运营 | [运营与合作手册](docs/guides/运营与合作手册.md) | [下载](output/pdf/问玄东方_运营与合作手册.pdf) |
| 04 决策 | [竞品研究与产品决策手册](docs/guides/竞品研究与产品决策手册.md) | [下载](output/pdf/天机阁与佑愿天机_竞品研究与产品决策手册.pdf) |

生成与维护方式见[手册目录](docs/guides/手册目录.md)。

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
| Web `/shop` | 商城兼容入口，跳转统一管理台对应业务 |

正式品牌资源只维护在[前端 packages/brand](https://github.com/askxuan-dongfang/askxuan-frontend/tree/master/packages/brand)。手册必要图版位于 `docs/assets/0.0.1/`；不把普通功能图标或用户头像当作 Logo。

## 源码与验证

- [后端](https://github.com/askxuan-dongfang/askxuan-backend)：19 个业务服务及 1 个网关。API 静态审计覆盖 **19 个业务服务的 383 个唯一 HTTP 契约**，不计网关 health 和 OpenIM 透传。
- [前端](https://github.com/askxuan-dongfang/askxuan-frontend)：两套 iOS、管理包与共享视觉资源。
- [H5](https://github.com/askxuan-dongfang/askxuan-h5)：独立发布，本地位于前端 `apps/web-h5`，需单独检查 Git 状态。

运行 `node scripts/audit-markdown-links.mjs` 检查文档链接，运行 `node scripts/audit-api-contracts.mjs ../askXuan-backend` 检查业务 API 覆盖。源码、构建、部署、页面验证与真实业务验收分别记录；没有相应证据的能力保留为限制或待办。
