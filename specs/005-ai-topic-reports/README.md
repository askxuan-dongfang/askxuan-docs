---
status: complete
created: '2026-09-09'
tags: []
priority: medium
created_at: '2026-09-09T11:57:59.129Z'
updated_at: '2026-09-09T12:27:16.948Z'
transitions:
  - status: in-progress
    at: '2026-09-09T11:58:08.693Z'
  - status: complete
    at: '2026-09-09T12:27:16.948Z'
completed_at: '2026-09-09T12:27:16.948Z'
completed: '2026-09-09'
---

# AI 问事专题报告与积分解锁

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-09


## 实现范围

iOS 与 H5 的新建问事上方新增八字、紫微、姻缘、风水、六爻、奇门、塔罗七个专题入口。专题拥有独立页面、表单、免费摘要、完整报告目录、积分确认购买、报告归档和关联追问；通用问事与动态技能聊天继续保留。

H5 专题使用青绿与暖白配色、宋体标题、章节编号和移动端自适应布局。iOS 使用原生全屏专题、日期选择器、购买确认和系统分享。返回专题前的聊天草稿不丢失。

## 交付与收费边界

- 状态为 generating / ready / failed。先完成报告生成，再允许购买；失败不扣积分，可免费重试。进程中断超过五分钟允许恢复。
- 完整正文由服务端权益判断控制，未购买时不返回正文，列表始终不含正文；ID 与 JWT 用户绑定。
- 积分支付由 payment-service 管理。在同一 MySQL 事务中锁报告和积分账户，记积分流水并解锁；重复购买幂等，余额不足和价格不符回滚。
- 功德金没有接入报告消费。
- 当前系统支付提供方仅为 mock，未接入真实现金收款。客户端明确显示现金支付暂未开放，不把模拟付款作为真实支付提供。price_cents 为后续现金定价预留，不能据此宣称现金支付闭环完成。
- 首版种子价格 10 积分是可配置的测试初值，正式发布前应依据实际积分发行规则调整 ai_report_product.points_price；不作为已验证商业定价。
- 使用现有技能配置与受控 MCP；不能取得计算依据时必须说明，不伪造盘面、抽牌或预测。首版交付为结构化文字报告，没有实现天机阁全部可视化排盘交互。
- 报告必须有摘要、至少三节和有效正文，否则标记失败。保存生成模型、token 和估算成本。真实模型报告质量尚需上线前用非敏感样本验收。
- 追问创建带已购报告内容的独立聊天，重复进入复用同一会话；后续消息消耗正常聊天额度，不承诺额外免费次数。

## API 契约

接口沿用统一 code/message/data 包装；以下形状指 data。

| 方法与路径 | 请求 | 响应 |
|---|---|---|
| GET /api/v1/ai/topics | 无 | 专题数组，包含 code/title/subtitle/priceCents/pointsPrice/chapters/version |
| POST /api/v1/ai/reports | skillCode/question/inputs/requestKey | 报告详情，初始 generating |
| GET /api/v1/ai/reports?page=1 | 每页20条 | 当前用户报告数组，不含正文 |
| GET /api/v1/ai/reports/:id | 当前用户身份 | 报告详情，正文按 unlocked 下发 |
| POST /api/v1/ai/reports/:id/retry | 无 | 报告状态；仅失败或过期任务触发新生成 |
| POST /api/v1/ai/reports/:id/conversation | 无 | sessionId，仅已购报告可用 |
| POST /api/v1/payments/ai-report | reportId/expectedPoints | unlocked；价格与归属由服务端检查 |

H5 路由：/c/ai/topics/:code、/c/ai/reports、/c/ai/reports/:reportId。以 /c/ai?session=ID 进入报告追问。专题是 AI 页子路由，错误边界不再因专题切换重建聊天组件。

## 数据与发布

- 新增 ai_report_product 和 ai_report，不更改既有预约、商城订单或功德金结算。
- 新安装 schema 已加入 backend/db/init.sql。
- 已有环境执行 scripts/db/20260909_ai_topic_reports.sql；幂等创建与 INSERT IGNORE 保留已有产品配置和报告。
- 需要 ai-service 查询 askxuan_payment.payment；payment-service 读写 askxuan_ai.ai_report。依赖目前同一 MySQL 实例的跨库事务，若数据库拆分需改为服务端订单／权益协议。
- 发布顺序：数据库迁移 → ai-service 与 payment-service → H5 → iOS。网关现有 /ai 与 /payments 前缀可覆盖新增接口。
- 回滚前端及服务版本时保留新增表与积分流水；不得删除已购买报告或通过重建账户回退余额。
- 当前仅本地开发与验证，未部署 ECS、未提交应用商店、未执行真实充值或付款。

## 验证

- H5 TypeScript 与生产构建。
- iOS CocoaPods workspace / iPhone Simulator Debug 构建。
- Go 权限、正文屏蔽、价格防篡改、余额不足回滚及重复购买单元测试。
- scripts/test-ai-topic-reports.sh：独立临时 MySQL，验证迁移重复执行、异步生成与摘要屏蔽、跨账号拒绝、12 并发购买仅扣一次、购买后正文与追问会话复用。模型使用明确的测试 Provider，不是实际模型质量验证。
- Playwright 三种屏宽（375/430/768），验证专题入口、表单、取消确认、积分购买、重复查看、无横向溢出、聊天草稿保留。该 UI 验收使用接口 fixture；数据库验收单独执行。
