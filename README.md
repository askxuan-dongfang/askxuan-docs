# 问玄东方 0.0.1

2026-10-21 当前更正：找师傅侧栏为“提供服务＋价格区间”，服务默认展开，价格默认折叠，按平台标准服务编码与已启用标签筛选；移除身份筛选及旧 `position` 链接的隐藏过滤。身份仍是资料字段，不新增自行编辑权限。H5 已部署 ECS，生产 DOM 14/14、390px 简浅/繁深截图复核通过；原生编译通过，Unit/UI 实际执行与视觉仍待验。已同步 [v4 方案](docs/product/DIY定稿发布与首页统一产品原型方案.md)与[原型](docs/product/prototypes/diy-publication-v4/index.html)，实际实现、上线及验收进度见[服务筛选更正记录](docs/reports/2026-10-21-找师傅服务筛选更正.md)；前轮报告保留历史口径。

2026-10-20 当前方案：[DIY 定稿发布与首页统一 v4](docs/product/DIY定稿发布与首页统一产品原型方案.md)、[可操作原型](docs/product/prototypes/diy-publication-v4/index.html)。最新首页修订已部署 ECS，并通过线上六尺寸、两组主题/语言共 12 项检查：四入口透明、保留纹样，信仰与心愿左对齐、取消竖框，宽屏重排。原型大字及原生编译通过；原生 UI、实际 H5 大字和独立容器仍待验，详见[首页对齐与主题协调验收](docs/reports/2026-10-20-首页对齐与主题协调.md)。

同日[前轮定稿发布验收](docs/reports/2026-10-20-DIY定稿发布与首页统一.md)：付款并确认后发布不可变定稿，保留可编辑草稿；精简师傅筛选，成长规则合入等级权益。Web、H5 和后端已上线并完成该轮专项核验，原生 UI 仍待验；新合同替代 v3 保存后自动下架，历史记录不改写。

前轮 v3：[DIY 大画布与直接拖拽标准方案](docs/product/DIY大画布与直接拖拽产品原型方案.md)、[可操作原型](docs/product/prototypes/diy-direct-drag-v3/index.html)及[历史验收状态与归档索引](docs/reports/2026-10-20-DIY大画布与直接拖拽.md)。扩大默认渲染区，直接拖珠换位 / 拖出删除；精简广场与我的设计，公开详情只读，二次编辑与发布统一在我的设计。同轮追加找寺院 / 找师傅类型行右侧固定地区浮层，服务字号协调；首页固定 2 × 2 等大纹样四卡，并区分全站与目录搜索范围。发布合同与首页新增精简以 v4 为准。

前轮：[无框 DIY 与轻量导航 v2](docs/product/无框DIY与轻量导航产品原型方案.md)、[可交互原型](docs/product/prototypes/diy-open-canvas-v2/index.html)及[已发布验收记录](docs/reports/2026-10-20-无框DIY与轻量导航.md)。包括工具避让、长度反馈、配件模型、悬浮宗派、商城顶栏与成长值入口；v2 原型保留目录、商城和个人页五态。

前版：[目录筛选与 DIY 编辑器方案](docs/product/目录筛选与DIY编辑器产品原型方案.md)及[2026-10-19 验收记录](docs/reports/2026-10-19-目录筛选与DIY编辑器.md)。

四册基础手册修订：**2026-09-16**；AI Harness 增量正文与专项 PDF：**2026-09-29**。覆盖邮箱认证、双轨入驻、服务执行与回执、集中进度和 iOS 对齐；竞品旧观察与历史截图保留原日期。

本仓库维护产品 **0.0.1** 的当前手册、技术契约、部署方法与待办。版本号统一产品基线，不代表所有真实交易、设备和外部服务均已验收。当前限制见[产品现状与能力边界](docs/product/产品现状与能力边界.md)。

## 产品侧、需求侧与投资侧交付

完整交付入口见[产品与测试交付包](docs/delivery/README.md)：4 册核心 PDF、4 册配套 PDF、66 个测试场景、22 项需求追踪与执行 / 缺陷模板。新增正文位于 `docs/delivery/`，核心 PDF 位于 `output/pdf/交付套件/`，可分发整包位于 `output/delivery/`。测试场景初始均为未执行。

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

## 2026-09-29 AI 增量文档

新增 [AI 智能体使用与验收](docs/guides/AI智能体使用与验收.md)，说明 23 项审核技能、15 个 taibu 工具、多步执行、补问、报告追问、运营评测及能力边界；[首版发布记录](docs/reports/2026-09-29-Harness发布.md)、[上下文升级记录](docs/reports/2026-09-29-Harness上下文升级.md)及[全工具接入记录](docs/reports/2026-09-29-taibu全工具接入.md)单独记录生产证据。四册旧 PDF 保留各自日期，本次另提供[智能体专项 PDF](output/pdf/问玄东方_AI智能体使用与验收.pdf)，不把旧册内容自动视为全部更新。

## 报告优先改造

[专题报告使用与验证](docs/guides/专题报告使用与验证.md)说明保留的三个页面、十二个专题、图表依据、Harness 生成、验证记录和未补齐范围。部署与真实模型验收见[专题报告发布记录](docs/reports/2026-09-29-专题报告发布.md)。专项 PDF 保留此前日期，此增量以正文为准。

## 2026-09-30 知识库与资料

[WeKnora 管理与 Harness 接入](docs/guides/WeKnora知识库管理与Harness接入.md)说明上传、审核、启停和发布；[十二专题首批资料库](docs/guides/AI问事首批资料库与使用说明.md)包含 159 份文档的范围、问答示例、[逐文档出处](docs/guides/AI问事首批资料来源目录.md)与[可重建归档](docs/resources/AI问事首批资料-20260930.zip)。本增量以正文和归档为准，旧 PDF 保留原日期。

## 2026-10-13 至 14 日目录与心愿验收记录

已恢复旧工作分支中的四份完成记录：[地域与预约一致性](specs/archived/034-region-tags/README.md)、[师傅资料整理](specs/archived/035-master-profile-refinement/README.md)、[目录分类与寺院详情](specs/archived/036-directory-taxonomy-temple-detail/README.md)、[演示媒体与服务心愿继承](specs/archived/037-directory-media-wish-completeness/README.md)。

这些是保留原日期、提交版本和验收范围的历史记录。其旧编号与当前规格重复，已通过 LeanSpec 归档；当前规格编号及状态不变。文中本地 `artifacts` 路径用于追溯当时证据，不表示历史源码工作区或发布包会永久保留。

## 按任务阅读

| 任务 | 入口 |
| --- | --- |
| 钱包使用与测试 | [钱包使用与验收](docs/guides/钱包使用与验收.md) |
| 产品能力、端差异与未验收项 | [当前能力与限制](docs/product/产品现状与能力边界.md) |
| 需求与版本工作 | [需求入口](specs/README.md) |
| 五级成长体系设计 | [标准产品原型](docs/product/成长体系产品原型方案.md) · [业务规则](docs/product/五级成长体系方案.md) · [补齐验收](docs/reports/成长体系补齐验收-20261019.md)，首期已上线，本轮已实现详情价、同步与规则版本 |
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
