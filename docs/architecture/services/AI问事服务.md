# ai-service AI 问事服务设计文档

> **文档版本**: v1.3
> **创建日期**: 2026-07-01
> **更新日期**: 2026-07-13
> **服务端口**: 8098
> **业务域**: AI 域
> **关联文档**: [技术架构](../技术架构.md) | [API规范](../API规范.md) | [状态机](../状态机.md) | [业务流程](../业务流程.md)

---

## 1. 服务职责

ai-service 提供 C 端可直接提问的 AI 对话能力。`skillCode` 为可选字段，未指定时使用 `general`；原有七个技能入口继续兼容。

| 技能编码 | 名称 | 说明 |
|---------|------|------|
| `general` | 综合问事 | 直接对话默认入口 |
| `bazi` | 八字命理 | 依据生辰八字推演命格运势 |
| `marriage` | 姻缘测算 | 测算姻缘婚恋走势 |
| `tarot` | 塔罗牌 | 塔罗牌占卜指引 |
| `fengshui` | 风水分析 | 居家风水布局建议 |
| `qimen` | 奇门遁甲 | 奇门遁甲预测决策 |
| `ziwei` | 紫微斗数 | 紫微斗数命盘解析 |
| `liuyao` | 六爻梅花 | 六爻梅花易数占断 |

主要职责：
- 查询启用中的技能配置。
- 创建、查询和关闭当前用户自己的会话。
- 将会话与消息持久化到 MySQL，服务重启后恢复历史。
- 同步接收用户消息并创建 `pending` 助手消息，异步调用模型 Provider。
- 支持失败状态展示和用户主动重试。

---

## 2. 架构图

```mermaid
graph LR
    C[C端 App<br/>直接对话/历史抽屉/重试] --> GW[gateway<br/>/api/v1/ai]
    GW --> H[handler/logic<br/>鉴权与事务]
    H --> DB[(MySQL<br/>ai_skill/ai_session/ai_message)]
    H --> P[Provider 接口]
    P --> MOCK[mock<br/>本地开发]
    P --> OA[openai_compatible<br/>外部模型服务]
    OA --> DB
    MOCK --> DB
```

模型调用不依赖 RabbitMQ。HTTP 请求先完成用户消息和 `pending` 助手消息的事务写入，再由服务内异步任务调用 Provider 并更新最终状态。

---

## 3. 数据表设计

### 3.1 ai_skill（AI 技能表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| code | VARCHAR(32) | 技能编码，含默认 `general` |
| name | VARCHAR(64) | 技能名称 |
| description | VARCHAR(255) | 技能描述 |
| icon | VARCHAR(255) | 图标地址 |
| prompt_template | TEXT | 系统提示词模板，C 端不返回 |
| status | VARCHAR(32) | enabled/disabled |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### 3.2 ai_session（AI 会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| session_no | VARCHAR(32) | 唯一会话号 |
| user_id | VARCHAR(64) | 会话所有者 |
| skill_code | VARCHAR(32) | 技能编码，应用层默认 general |
| title | VARCHAR(100) | 会话标题，首问自动截取 |
| status | VARCHAR(32) | active/closed |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 最后更新时间 |

### 3.3 ai_message（AI 对话消息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT | 主键 |
| session_id | BIGINT | 会话 ID |
| role | VARCHAR(32) | user/assistant |
| content | TEXT | 消息内容 |
| tokens | INT | Provider 返回的 token 数 |
| status | VARCHAR(16) | pending/completed/failed |
| error_message | VARCHAR(255) | 面向客户端的失败原因 |
| retry_count | INT | 重试次数 |
| create_time | DATETIME | 创建时间 |

---

## 4. 接口清单

接口前缀为 `/api/v1/ai`，共 8 个 C 端路由。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /skills | 查询技能列表 |
| POST | /sessions | 创建会话，skillCode 可选，question 可作为首问 |
| GET | /sessions | 查询当前用户会话列表 |
| GET | /sessions/:id | 查询会话详情 |
| GET | /sessions/:id/messages | 分页查询消息，按时间正序 |
| POST | /sessions/:id/messages | 发送消息，返回助手 messageId 与 pending 状态 |
| POST | /sessions/:id/messages/:messageId/retry | 重试失败的助手消息 |
| DELETE | /sessions/:id | 将会话状态置为 closed |

---

## 5. 业务逻辑要点

1. **直接对话**：创建会话不传 `skillCode` 时使用 `general`；旧客户端仍可传原技能编码。
2. **会话所有权**：优先使用网关注入的 `X-User-Id`，并校验请求中的兼容 `userId`；用户不能读取、关闭、发送或重试其他用户的会话。
3. **事务写入**：首问或后续发送均在同一 `sqlx.Session` 中写入 user 消息和 `pending` assistant 消息，任一写入失败整体回滚。
4. **Provider 状态**：Provider 成功后写入 `completed/content/tokens`；失败后写入 `failed/error_message`，客户端显示可重试状态。
5. **重启恢复**：服务启动时将遗留的 `pending` 助手消息转为 `failed`，错误文案为“服务重启，点击重试”，避免消息永久等待。
6. **重试约束**：仅会话所有者可重试本会话中 `failed` 的 assistant 消息；重试时状态改回 `pending` 并增加 `retry_count`。
7. **客户端轮询**：发送或重试后，C 端轮询消息列表，直到助手消息进入 `completed` 或 `failed`。
8. **软删除**：删除会话仅将状态置为 `closed`，历史消息保留用于追溯。

---

## 6. Provider 与配置

| Provider | 用途 | 行为 |
|----------|------|------|
| `mock` | 本地开发与无密钥环境 | 返回明确带“本地开发模拟”标识的结果，不伪装外部模型 |
| `openai_compatible` | OpenAI 兼容模型网关 | 调用兼容的 chat completions HTTP 接口 |

环境变量优先于 YAML：

| 环境变量 | 说明 |
|----------|------|
| `AI_PROVIDER` | `mock` 或 `openai_compatible` |
| `AI_BASE_URL` | OpenAI 兼容 API 基础地址 |
| `AI_API_KEY` | Provider 密钥 |
| `AI_MODEL` | 模型名称 |

生产环境不得使用 `mock` 冒充真实推理。`openai_compatible` 配置不完整时服务启动失败，避免静默降级。

---

## 7. 依赖关系

| 依赖类型 | 依赖 | 说明 |
|---------|------|------|
| MySQL | askxuan_ai | 技能、会话和消息持久化 |
| HTTP | 模型 Provider | 仅 `openai_compatible` 使用 |
| etcd | 服务注册 | 服务发现 |
| common | 公共包 | 统一响应、错误码和中间件 |

---

## 8. 错误与可见状态

| 场景 | 返回/状态 |
|------|-----------|
| 参数缺失或技能无效 | 400 类业务错误 |
| 会话或消息不存在 | 404 类业务错误 |
| 非会话所有者访问 | `40301` 无权限访问 |
| Provider 调用失败 | 请求已接收，assistant 消息转为 failed 并可重试 |
| 服务在推理期间重启 | pending 恢复为 failed 并可重试 |

---

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.3 | 2026-07-13 | 切换 MySQL 持久化，新增 general 默认入口、Provider、所有权校验、失败重试和重启恢复 |
| v1.2 | 2026-07-09 | 补齐早期内存版会话与消息闭环 |
| v1.1 | 2026-07-09 | 对齐 App 直接问事与历史抽屉原型 |
| v1.0 | 2026-07-01 | 初始版本 |
