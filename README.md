# 问玄东方产品与工程文档

本仓库统一维护产品现状、使用手册、接口、研发规范和验收记录。2026-09-13 以当前已推送源码重新核对；历史报告保留原始日期和适用范围，不等同于当前能力。

## 产品手册

本次把旧产品方案、宣传提案和竞品研究整理为四册手册，PDF 已更新为统一视觉排版。[进入手册目录](docs/guides/手册目录.md) 查看正文、下载与旧版对应关系。

| 册别 | 当前手册 |
| --- | --- |
| 01 | [产品使用手册](docs/guides/产品使用手册.md) |
| 02 | [视觉设计与交互手册](docs/guides/视觉设计与交互手册.md) |
| 03 | [运营与合作手册](docs/guides/运营与合作手册.md) |
| 04 | [竞品研究与产品决策手册](docs/guides/竞品研究与产品决策手册.md) |

## 按需阅读

| 目的 | 入口 |
| --- | --- |
| 了解现有产品、端差异和未完成项 | [产品现状与能力边界](docs/product/产品现状与能力边界.md) · [功能对齐矩阵](docs/product/功能对齐矩阵.md) |
| 操作 H5、iOS 与管理后台 | [产品使用手册](docs/guides/产品使用手册.md) |
| 核对本次整理结果与发布证据 | [2026-09-13 产品与文档核验](docs/reports/2026-09-13-产品与文档核验.md) |
| 查找之前的报告 | [报告目录与历史口径](docs/reports/README.md) |
| 接入接口 | [API Reference](API-REFERENCE.md) · [API 规范](docs/architecture/API规范.md) |
| 了解 DIY 全流程 | [DIY 创作与定制](docs/guides/manual/DIY创作与定制.md) |
| 了解后台权限和入口 | [法师与后台操作](docs/guides/manual/法师与后台操作.md) |
| 统一视觉与验证 | [视觉设计与交互手册](docs/guides/视觉设计与交互手册.md) |
| 本地研发、目录维护 | [本地项目目录与维护](docs/guides/本地项目目录与维护.md) · [Go 后端](docs/guides/Go后端指南.md) · [iOS](docs/guides/iOS入门指南.md) |
| 部署和恢复 | [GitHub Actions 与 ECS](docs/deployment/GITHUB-ACTIONS.md) · [聊天运维](docs/deployment/CHAT.md) · [MQ 故障演练](docs/guides/MQ可靠投递监控与故障演练.md) |
| 查询架构与数据 | [技术架构](docs/architecture/技术架构.md) · [业务流程](docs/architecture/业务流程.md) · [状态机](docs/architecture/状态机.md) · [字段字典](docs/standards/字段字典.md) · [统一字典](docs/standards/统一数据字典.md) |

## 产品载体

| 载体 | 当前角色 |
| --- | --- |
| H5 `/c`、`/m` | 信众与法师，独立 H5 Git 仓库 |
| 两套原生 iOS | 信众 App 与法师工作台；独立构建和签名发布 |
| Web `/admin` | 平台/商城角色共用统一运营管理台，按权限展示功能 |
| Web `/temple` | 寺院管理台 |
| Web `/shop` | 旧商城入口的兼容跳转；代码包仍保留 |
| `mobile-customer` | 备用 Expo 客户端，不作为本轮多端体验验收对象 |

“五端”旧文件名沿用历史角色划分，不能据此漏掉 H5，也不能把三个管理包理解为三套独立运营体系。

## 源码与核验

- [后端仓库](https://github.com/askxuan-dongfang/askxuan-backend)：19 个业务服务和 1 个网关。本轮扫描得到 **19 个业务服务的 383 个唯一 HTTP 契约**。
- [前端仓库](https://github.com/askxuan-dongfang/askxuan-frontend)：两 iOS、三 Web 包、共享视觉与品牌资产。
- [H5 仓库](https://github.com/askxuan-dongfang/askxuan-h5)：独立发布；本地位于前端的 `apps/web-h5`，必须单独检查 Git 状态。
- [文档仓库](https://github.com/askxuan-dongfang/askxuan-docs)：本仓库；`specs/` 记录需求和实施过程，状态不代表全部上线验收。

在本仓库运行 `node scripts/audit-markdown-links.mjs` 校验本地链接；运行 `node scripts/audit-api-contracts.mjs ../askXuan-backend` 核对接口（包含数据驱动注册）。两者是静态核验，不替代真实支付、设备或业务闭环验收。详细基线与证据见本次核验报告。

## 维护约定

产品说明和手册记录当前行为；方案与报告保留日期、源码版本、验证环境及限制。新增或改变能力时同步更新入口文档、接口与手册，避免反复复制易失效的数量和完成率。历史截图、构建日志、发布回执和原始报告保留，统一从报告目录检索。
