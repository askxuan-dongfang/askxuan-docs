# 报告目录与历史口径

当前结论从[2026-09-13 产品与文档核验](2026-09-13-产品与文档核验.md)进入，操作说明见[产品手册](../guides/产品使用手册.md)。旧报告保存当时证据，不覆盖后续实现。根工作区 `artifacts/README.md` 提供可点击的完整本地目录索引；下表路径均相对 `DongFang/`，独立克隆本仓时不要求附带大型发布包。

## 持续维护的产品文档

| 主题 | 当前入口 |
| --- | --- |
| 产品功能、平台差异 | [产品现状与能力边界](../product/产品现状与能力边界.md) · [功能矩阵](../product/功能对齐矩阵.md) |
| DIY 流程 | [当前能力审计](../product/DIY手串全流程能力审计.md) |
| 全端一致性旧问题追踪 | [业务逻辑审计及 2026-09-13 校正](../product/业务逻辑对齐审计报告.md) |
| 视觉/交互 | [UI 蓝图及当前校正](../product/五端UI重绘蓝图.md) · [回归用例](../product/五端视觉回归与业务闭环用例.md) |
| CI / 部署 | [GitHub Actions 与 ECS](../deployment/GITHUB-ACTIONS.md) · [聊天发布](../deployment/CHAT.md) |

## 近期证据索引

| 主题/日期 | 本地原始目录 | 当前阅读提示 |
| --- | --- | --- |
| 品牌重绘 09-13 | `artifacts/brand-identity-20260913/verification.md` | 最新 Web/H5 发布；六款标识，109 项资源核验，iOS 无签名构建；CI cancelled 与 receiver deployed 分开 |
| 本地清理/文档 09-13 | `artifacts/maintenance-20260913/` | 35 目录精确删除、保护项 hash、文档/API/原型检查 |
| DIY 材料筛选 09-12 | `artifacts/diy-material-sidebar-20260912/` | 竖向分类、五行上移、删除冗余；后续品牌版包含 |
| DIY 订单 09-12 | `artifacts/diy-orders-20260912/` | 紧凑布局、明细、错误态与线上存量订单只读核验 |
| DIY 画布与筛选 09-12 | `artifacts/diy-review-20260912/` | 删除多余跳转、画布留白与筛选外观修正 |
| 全局动效 09-12 | `artifacts/product-motion-20260912/verification.md` | 模态框/导航/按钮等；其 frontend 工作树保留最新品牌源码与历史夹具引用 |
| 字体/主题 09-12 | `artifacts/global-ui-20260912/verification.md`、`artifacts/diy-brand-color-20260912/verification.md` | 浅深主题、字体和减少动态效果；旧发布 SHA 非当前最新 |
| 登录过期 09-12 | `artifacts/auth-expiry-20260912/verification.md` | 无效会话清理、进入对应登录入口；夹具依赖路径保留 |
| AI Provider 设置 09-12 | `artifacts/ai-provider-admin-20260912/README.md` | 权限、脱敏、配置连接测试和当次部署；单 AI 实例约束 |
| AI 模型选择 09-12 | `artifacts/ai-model-selection-20260912/`、`artifacts/ai-model-picker-20260912/` | 动态模型目录、选择交互；以规格 025/026 和源码为准 |
| 聊天 09-12 | `artifacts/chat-completion-20260912/README.md` | 消息/附件上线，公网通话暂缓，APNs/真机未验收 |
| DIY 升级 09-11 | `artifacts/diy-upgrade-20260911/verification/acceptance.md` | 早期工作台证据，后续 H5 2D 已采用 SVG，iOS 已有真 3D |
| CI 接管/环境审计 09-11 | `artifacts/ci-cd-20260911/`、`artifacts/environment-audit-20260911/REVIEW.md`、`artifacts/environment-cleanup-20260911/REVIEW.md` | 历史发布和清理，不代表现在可以删除同名数据 |
| 首页广告/社区 09-11 | `artifacts/home-promotions-20260911/`、`artifacts/community-experience-20260911/REVIEW.md` | 内容发布与代码发布分别保留授权/验证边界 |
| 统一后台 09-10 | `artifacts/unified-admin-20260910/README.md` | 旧商城兼容跳转、平台/商城角色分权 |
| 积分与活动 09-09～10 | `artifacts/points-rewards-20260910/README.md`、`artifacts/points-live-20260910/`、`artifacts/free-rewards-20260909/` | **当前参与消耗正整数积分**；free-rewards 目录/旧标题是历史命名，不是当前免费承诺 |
| 体验商城/转盘 09-10 | `artifacts/reward-demo-motion-20260910/README.md`、`artifacts/wheel-focus-20260910/` | 体验商城与普通商城、积分和功德值分别说明 |
| 演示/研究材料 | `artifacts/askxuan-partner-deck/`、`artifacts/askxuan-strategy-deck/`、`artifacts/tianji-research/` | 保留演示文稿/PDF及可编辑源；定位/规划不是上线验收 |

其余专题与截图从本地完整索引检索。构建 `dist` 已删除时，可由源码重建；这不影响已保留的 CI 原包、发布回执和截图证据。

## 已归档报告

- `artifacts/maintenance-20260913/history/2026-08-15-文档与原型资产分析.md.txt`：根部隐藏草稿原文，按字节保留；旧本地链接和统计仅属当时记录。
- `artifacts/maintenance-20260913/history/2026-08-15-本地目录说明.md.txt`：保留旧根 README 原文，避免把过期目录和端划分继续作为入口。
- [2026-09-03 DIY 审计](history/2026-09-03-DIY手串全流程能力审计.md)：历史结论，正文保留。
- [2026-09-04 全端业务审计](history/2026-09-04-业务逻辑对齐审计报告.md)：历史结论；仅调整归档后的相对链接。

历史报告不追改原始通过率、不抹去失败记录；当前报告说明后续修正。新报告至少写核对日期、源码提交、测试环境、部署回执和未验收项，避免出现没有证据支撑的“全部完成”。
