# 问玄东方全栈接口文档（面向 5 个端侧客户端）

**文档版本**：2026-07-31
**网关地址**：`http://localhost:8080`（本地开发）/ `https://api.askxuan.com`（生产）
**网关模型**：自研 net/http + httputil.ReverseProxy，23 条公开业务路由 + 2 条 IM 路由 + 26 条管理台路由 = 51 条 Prefix；最长前缀匹配，动态服务发现优先、静态 Target 回退
**接口总数**：279 个唯一运行时 HTTP 契约（由 `routes.go` 与本文档机器对比）

**文档结构**：

- **上篇：客户端视角**——6 个客户端各自调用哪些接口（第一至第五章）
- **下篇：后端视角**——19 个业务服务各自提供哪些接口（第六至第二十四章）；gateway 作为第 20 个后端进程列在附录
- **附录**：覆盖矩阵、网关路由表、端口表、统计表

---

## 序章：通用约定

### 1. 鉴权

| 项 | 值 |
|----|----|
| 方式 | JWT Bearer Token |
| Header | `Authorization: Bearer <accessToken>` |
| 网关注入 Header | `X-User-Id` / `X-User-Roles` / `X-Client-Id` / `X-Temple-Id` / `X-Master-Id` / `X-User-Type` / `X-Client-Type` |
| JWT Claims | UserId / Mobile / UserType / Roles / ClientID / TempleID / MasterID / Type（8 字段） |
| 不鉴权白名单 | `/api/v1/auth/login`、`/api/v1/auth/refresh`、`/api/v1/auth/admin/login`、`/api/v1/users/register`、`/api/v1/bookings/availability`、支付回调、`/api/v1/beliefs`、`/api/v1/temples`、`/api/v1/masters`、`/api/v1/products`、`/api/v1/health`、`/api/v1/im`、OpenIM webhook 等公开入口；webhook 仅允许 OpenIM 内网访问 |
| 白名单匹配规则 | GET 请求：前缀匹配（`path == prefix` 或 `path 以 prefix+"/" 开头`，支持 `/temples/T001` 等详情页）；非 GET 请求：精确匹配 |

### 2. 响应格式

```json
// 标准 envelope（绝大多数接口）
{ "code": 0, "message": "success", "data": {...} }

// message-service 部分接口返回裸 JSON（无 code/message/data 包装）
{ "total": 12, "list": [...] }
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未授权（JWT 失效或过期） |
| 40301 | 禁止访问（角色权限不足） |
| 40401 | 资源不存在 |
| 50001 | 服务器内部错误 |
| 50201-50299 | 业务错误码（具体见各服务） |
| 40414 | 寺院未提供该服务 |
| 40415 | 时段不存在或已停用 |
| 40907 | 时段容量已满 |
| 40908 | 预约支付已过期 |
| 50205 | temple/master/payment gRPC 依赖不可用 |

### 3. 分页约定

- 请求参数：`page`（从 1 开始）、`size`（默认 10，最大 100）
- 响应结构：`{ "list": [...], "total": 100, "page": 1, "size": 10 }`

### 4. ID 命名规范

- 业务 ID 用字符串：`T001`（寺院）、`M001`（法师）、`U001`（用户）、`BK20260704xxxx`（预约）、`PAY20260704xxxx`（支付）
- 数据库自增 ID 用 int64：仅内部关联，不暴露给前端

---

# 上篇：客户端视角

> 本篇按 6 个端侧客户端分章，回答"每个客户端调用哪些接口"。
> 两个 iOS C 端（ios-customer + mobile-customer）合并为第一章。

---

## 第一章：C 端接口（ios-customer + mobile-customer）

**客户端基础配置**：

| 项 | ios-customer | mobile-customer |
|----|--------------|-----------------|
| 技术栈 | Swift / SwiftUI | Expo 52 / RN / TS |
| baseURL | Debug: `http://localhost:8080/api/v1` / Release: `https://api.askxuan.com/api/v1` | `EXPO_PUBLIC_API_BASE_URL \|\| 'http://localhost:8080/api/v1'`（✅ 已修复，原 3001） |
| 鉴权存储 | Keychain (`com.dongfang.customer` / `df_jwt_token`) | SecureStore（key=`dongfang_jwt`，未按端隔离） |
| 401 处理 | HTTP 401 + 业务码 40101 双识别，自动 refresh + 重试一次 | HTTP 401 + 业务码 40101 双识别（✅ 已修复，原仅识别 401）；无 refresh 重试，401 直接登出 |
| X-Client-Type | `customer` | 未注入（⚠️ 其他 5 端均注入） |
| 实时消息 | `WebSocketManager` 实为 HTTP 5s 轮询 `/messages/unread-count` | 无 |
| OpenIM 集成 | ✅ 已集成真实 SDK（CocoaPods `OpenIMSDK ~> 3.8.3`，WS 10001 长连接） | 无 |

### 1.1 认证模块（auth-service @ 8081）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/auth/login` | ios-customer ✓ / mobile-customer ✓ | `phone`, `code`(opt), `account`(opt), `password`(opt) | 无 | 手机号验证码 或 账号密码登录 |
| POST | `/api/v1/auth/refresh` | ios-customer ✓ / mobile-customer ✓ | `refreshToken` | 无 | Token 续期 |
| POST | `/api/v1/auth/logout` | ios-customer ✓ | `accessToken`(opt) | 无 | 登出（mobile-customer 仅本地清理） |
| POST | `/api/v1/users/register` | ios-customer ✓ | `mobile`, `code`, `nickname`(opt) | 无 | 用户注册（路径在 user 域） |

### 1.2 用户模块（user-service @ 8082）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/users/profile` | ios-customer ✓ | — | Bearer | 获取个人资料 |
| PUT | `/api/v1/users/profile` | ios-customer ✓ | `nickname`(opt), `avatar`(opt), `gender`(opt), `birthday`(opt), `region`(opt) | Bearer | 更新资料 |
| GET | `/api/v1/users/addresses` | ios-customer ✓ | — | Bearer | 地址列表 |
| POST | `/api/v1/users/addresses` | ios-customer ✓ | `name`, `phone`, `province`, `city`, `district` | Bearer | 新增地址 |
| PUT | `/api/v1/users/addresses/:id` | ios-customer ✓ | `name`(opt), `phone`(opt), `province`(opt), `city`(opt) | Bearer | 修改地址 |
| DELETE | `/api/v1/users/addresses/:id` | ios-customer ✓ | — | Bearer | 删除地址 |

### 1.3 寺院模块（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/beliefs` | ios-customer ✓ / mobile-customer ✓ | — | 无 | 平台启用的一级流派，按 `sort/code` 排序；客户端首页和筛选项以此为准 |
| GET | `/api/v1/beliefs/:code` | ios-customer ✓ | — | 无 | 一级流派详情；`code` 是平台维护的稳定业务编码 |
| GET | `/api/v1/temples` | ios-customer ✓ / mobile-customer ✓ | `beliefCode`(opt), `sect`(opt), `type`(opt), `region`(opt), `page`, `size` | 无 | 寺院列表 |
| GET | `/api/v1/temples/:id` | ios-customer ✓ / mobile-customer ✓ | — | 无 | 寺院详情 |
| GET | `/api/v1/temples/:id/services` | ios-customer ✓ | — | 无 | 寺院服务列表 |

### 1.4 法师模块（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/masters` | ios-customer ✓ / mobile-customer ✓ | `beliefCode`(opt), `sect`(opt), `type`(opt), `templeId`(opt), `page`, `size` | 无 | 法师列表 |
| GET | `/api/v1/masters/:id` | ios-customer ✓ / mobile-customer ✓ | — | 无 | 法师详情 |

### 1.5 预约模块（booking-service @ 8085）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/bookings` | ios-customer ✓ / mobile-customer ✓ | `requestId`, `templeId`, `masterId`, `serviceId`, `slotCode`, `bookingDate`, `meritMoney`, `meritMoneyTier`, `note`(opt) | Bearer | 服务端计价、占位并自动调用本地模拟支付；名称/价格字段忽略 |
| GET | `/api/v1/bookings/availability` | ios-customer ✓ / mobile-customer ✓ | `templeId`, `serviceId`, `date` | 公开 | 权威服务费、容量和剩余时段 |
| POST | `/api/v1/bookings/:id/pay` | ios-customer 兼容 | — | Bearer | 待支付预约幂等重试 |
| GET | `/api/v1/bookings` | ios-customer ✓ / mobile-customer ✓ | `status`(opt), `templeId`(opt), `page`, `size`；用户以JWT为准 | Bearer | 预约列表 |
| GET | `/api/v1/bookings/:id` | ios-customer ✓ / mobile-customer ✓ | — | Bearer | 预约详情 |
| PUT | `/api/v1/bookings/:id/status` | ios-customer ✓ | `status=cancelled` | Bearer | 用户取消自己的预约并释放时段 |
| POST | `/api/v1/bookings/:id/review` | — | `rating`, `content`, `images`(opt) | Bearer | 创建预约评价 |
| GET | `/api/v1/bookings/:id/review` | — | — | Bearer | 预约评价详情 |
| GET | `/api/v1/bookings/chats` | ios-customer ✓ / ios-master ✓ | `page`, `size` | Bearer | 仅返回支付成功且未取消、归属当前用户/法师的预约会话 |
| GET | `/api/v1/bookings/:id/chat/messages` | ios-customer ✓ / ios-master ✓ | `page`, `size` | Bearer | 按预约读取持久化文字历史，校验双方归属 |
| POST | `/api/v1/bookings/:id/chat/messages` | ios-customer ✓ / ios-master ✓ | `clientMessageId`, `content` | Bearer | 服务端再次核验支付与归属后，通过 OpenIM 实时投递；幂等发送 |

### 1.6 商品模块（product-service @ 8086）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/products` | ios-customer ✓ | `categoryId`(opt), `keyword`(opt), `page`, `size` | 无 | 商品列表 |
| GET | `/api/v1/products/:id` | ios-customer ✓ | — | 无 | 商品详情 |
| GET | `/api/v1/products/categories` | ios-customer ✓ | — | 无 | 分类树 |

### 1.7 DIY 模块（diy-service @ 8088）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/diy/designs` | ios-customer ✓ | `page`, `size` | 无 | 设计列表 |
| POST | `/api/v1/diy/designs` | ios-customer ✓ | `userId`, `name`, `designData`(v1/v2 JSON 字符串), `totalPrice`(展示预估), `status`, `blessServiceCode`(opt) | Bearer | 保存设计，响应 `{id}`；不锁库存 |
| GET | `/api/v1/diy/designs/:id` | ios-customer ✓ | — | 无 | 设计详情 |
| POST | `/api/v1/diy/designs/:id/order` | ios-customer ✓ | `userId`, `blessServiceCode`(opt), `addressId` | Bearer | 服务端按材料/SKU重定价并创建订单，返回最终金额、明细、`paymentStatus`和快照 |
| GET | `/api/v1/diy/materials` | ios-customer ✓ | `category`(opt), `page`, `size` | 无 | 材料库列表 |
| GET | `/api/v1/diy/blessing-services` | ios-customer ✓ | `page`, `size` | 无 | 可选加持服务列表 |
| POST | `/api/v1/diy/orders` | ios-customer ✓ | `userId`, `designId`, `items`, `blessServiceCode`(opt), `addressId` | Bearer | 创建 DIY 订单 |
| GET | `/api/v1/diy/orders` | ios-customer ✓ | `userId`, `status`(opt), `page`, `size` | Bearer | DIY 订单列表 |
| GET | `/api/v1/diy/orders/:id` | ios-customer ✓ | — | Bearer | DIY 订单详情 |

`designData` v2 使用 `version=2`、`wristSizeMm`、`fitAllowanceMm`、有序 `beads[]`、可选 `cord` 和聚合 `items[]`。`beads[]` 保存 `slotId/position/materialId/skuId/materialName/spec/unitPrice/subtype/image/diameterMm`；`items[]` 保存现有下单解析器使用的 `materialId/skuId/materialName/spec/unitPrice/quantity/subtype`。客户端 `unitPrice/totalPrice` 只用于预估展示，创建订单时服务端按材料/SKU、上下架状态和库存重新计价。

### 1.8 订单模块（order-service @ 8089）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/orders` | — | `userId`, `addressId`, `note`(opt), `items` | Bearer | 创建订单 |
| GET | `/api/v1/orders` | — | `userId`, `status`(opt), `page`, `size` | Bearer | 订单列表 |
| GET | `/api/v1/orders/:id` | — | — | Bearer | 订单详情 |
| PUT | `/api/v1/orders/:id/confirm` | — | — | Bearer | 确认收货 |
| POST | `/api/v1/orders/:id/return` | — | `type`, `reason` | Bearer | 申请退换货 |

> 注：mobile-customer 与 ios-customer 当前未集成商城订单接口。

### 1.9 支付模块（payment-service @ 8090）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/payments` | ios-customer ✓ | `orderType`, `orderNo`, `amount`, `channel`, `userId` | Bearer | 发起支付；DIY订单校验所属、状态和服务端最终金额 |
| GET | `/api/v1/payments/:id` | ios-customer ✓ | — | Bearer | 查询支付状态 |
| POST | `/api/v1/payments/callback/wechat` | — | 第三方回调体 | 无 | 微信回调 |
| POST | `/api/v1/payments/callback/alipay` | — | 第三方回调体 | 无 | 支付宝回调 |

### 1.10 消息模块（message-service @ 8094）

> **注**：实时聊天功能已迁移至 OpenIM SDK（WS 10001 长连接），客户端用 imToken 直连 OpenIM 收发消息。下表 REST API 保留作为站内信兜底（未集成 SDK 的端可轮询）。

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/messages/list` | ios-customer ✓ | `userId`, `isRead`(opt), `page`, `size` | Bearer | 站内消息列表 |
| PUT | `/api/v1/messages/:id/read` | ios-customer ✓ | — | Bearer | 标记单条已读 |
| GET | `/api/v1/messages/unread-count` | ios-customer ✓ | `userId` | Bearer | 未读数 |
| PUT | `/api/v1/messages/read-all` | ios-customer ✓ | `userId` | Bearer | 全部已读 |
| POST | `/api/v1/messages/send` | 旧版兼容 | `conversationId`, `userId`, `content` | Bearer | 已废弃，固定返回 `40909`；改用付费预约对话 |
| POST | `/api/v1/messages/device-token` | ios-customer ✓ | `userId`, `clientType`, `platform`, `deviceToken`, `bundleId`(opt) | Bearer | 注册 APNs token |
| DELETE | `/api/v1/messages/device-token` | — | `userId`, `deviceToken` | Bearer | 解绑设备 token |
| DELETE | `/api/v1/messages/:id` | ios-customer ✓ | — | Bearer | 删除消息 |

### 1.11 公告模块（message-service @ 8094）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/announcements/list` | ios-customer ✓ | `type`(opt), `targetAudience`(opt), `page`, `size` | 无 | 公告列表 |

### 1.12 AI 模块（ai-service @ 8098）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/ai/skills` | — | `status`(opt) | 无 | AI 入口列表（general + 7 个兼容技能） |
| POST | `/api/v1/ai/sessions` | ios-customer ✓ | `userId`, `skillCode`(opt), `question`(opt) | Bearer | 创建会话，默认 general |
| GET | `/api/v1/ai/sessions` | ios-customer ✓ | `userId`, `status`(opt), `page`, `size` | Bearer | 会话列表 |
| GET | `/api/v1/ai/sessions/:id` | ios-customer ✓ | — | Bearer | 会话详情 |
| GET | `/api/v1/ai/sessions/:id/messages` | ios-customer ✓ | `userId`, `page`, `size` | Bearer | 会话消息列表 |
| POST | `/api/v1/ai/sessions/:id/messages` | ios-customer ✓ | `userId`, `content` | Bearer | 发送消息 |
| POST | `/api/v1/ai/sessions/:id/messages/:messageId/retry` | ios-customer ✓ | `userId` | Bearer | 重试失败的助手消息 |
| DELETE | `/api/v1/ai/sessions/:id` | ios-customer ✓ | — | Bearer | 删除会话 |

### 1.13 媒体与直播（media-service @ 8100）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/media/uploads/credentials` | ios-master ✓ | `fileName`, `mediaType`, `contentType`, `fileSize`(opt) | Bearer | 获取 Provider 上传凭证 |
| POST | `/api/v1/media/:id/complete` | ios-master ✓ | `coverMediaId`(opt), `ETag`(opt) | Bearer | 校验对象并完成上传 |
| GET | `/api/v1/media/:id` | ios-customer / ios-master ✓ | — | Bearer | 所有者可查处理状态；其他用户仅可查 ready + approved |
| POST | `/api/v1/media/callback/transcode` | Provider | `mediaId`, `status`, Provider 结果字段 | 回调令牌 | 幂等转码回调，省略字段不覆盖原值 |
| POST | `/api/v1/media/callback/audit` | Provider | `mediaId`, `auditStatus`, `reason`(opt) | 回调令牌 | 幂等审核回调 |
| GET | `/api/v1/live/capabilities` | ios-master ✓ | — | 无 | 返回启用、Provider 配置和可开播状态 |
| GET | `/api/v1/live/rooms` | ios-customer ✓ | `masterId`(opt), `limit`(opt) | Bearer | 仅返回直播中房间，不返回推流地址 |
| POST | `/api/v1/live/rooms` | ios-master ✓ | `title`, `coverMediaId`(opt), `openimGroupId`(opt) | Master | 创建直播房间 |
| GET | `/api/v1/live/rooms/:id` | ios-customer / ios-master ✓ | — | Bearer | 非房主仅可读 live 房间；推流地址仅房主可见 |
| PUT | `/api/v1/live/rooms/:id/openim` | ios-master ✓ | `openimGroupId` | Master | 绑定 OpenIM 群聊 |
| POST | `/api/v1/live/rooms/:id/start` | ios-master ✓ | — | Master | 调用已配置直播 Provider 开播 |
| POST | `/api/v1/live/rooms/:id/close` | ios-master ✓ | — | Master | 关闭 Provider 会话和房间 |

> 默认 `LIVE_ENABLED=false` 且 Provider 为 `disabled`。此状态下法师端不展示开播控件，`start` 返回 `50320`，不会生成伪造推流或观看地址。
> Docker 本地开发中，服务端对象校验使用内部 `Endpoint=minio:9000`，返回客户端的预签名 URL 使用 `PresignEndpoint=localhost:9000`；两者指向同一 MinIO，避免把容器内部地址暴露给客户端。

### 1.14 社区内容 / 大师广场（community-service @ 8099）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/community/feed` | ios-customer ✓ | `type`(opt), `beliefCode`(opt), `page`, `size` | 无 | 仅返回审核通过的图文/视频混合内容流 |
| GET | `/api/v1/community/posts/:id` | ios-customer ✓ | — | 无 | 内容详情 |
| POST | `/api/v1/community/posts/:id/like` | ios-customer ✓ | — | Bearer | 幂等点赞 |
| DELETE | `/api/v1/community/posts/:id/like` | ios-customer ✓ | — | Bearer | 取消点赞 |
| GET | `/api/v1/community/posts/:id/comments` | ios-customer ✓ | `page`, `size` | 无 | 评论列表 |
| POST | `/api/v1/community/posts/:id/comments` | ios-customer ✓ | `content` | Bearer | 提交评论，状态为 pending，审核通过前不可见 |
| POST | `/api/v1/community/masters/:id/follow` | ios-customer ✓ | — | Bearer | 幂等关注大师 |
| DELETE | `/api/v1/community/masters/:id/follow` | ios-customer ✓ | — | Bearer | 取消关注大师 |

### 1.15 诉求聚合（product-service @ 8086）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/intentions/tags` | ios-customer ✓ / mobile-customer ✓ | — | 无 | 平台启用的心愿分类，含图标、落地类型、落地值、按钮文案和排序 |
| GET | `/api/v1/intentions` | ios-customer ✓ | `code`(opt), `page`, `size` | 无 | 混合返回商品与寺院服务；含 `resourceType/sourceId/price/image/orderTarget/templeCode/serviceCode` |

### 1.16 营销模块（marketing-service @ 8096）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/marketing/banners` | — | `status`(opt), `page`, `size` | 无 | Banner 列表 |
| GET | `/api/v1/marketing/recommends` | — | `type`(opt), `status`(opt), `page`, `size` | 无 | 推荐位 |
| GET | `/api/v1/marketing/activities` | — | `status`(opt), `type`(opt), `page`, `size` | 无 | 活动列表 |
| GET | `/api/v1/marketing/coupons` | — | `status`(opt), `type`(opt), `page`, `size` | 无 | 优惠券列表 |
| POST | `/api/v1/marketing/coupons/:id/receive` | — | `userId` | Bearer | 领取优惠券 |
| GET | `/api/v1/marketing/my-coupons` | — | `userId`, `status`(opt), `page`, `size` | Bearer | 我的优惠券 |

### 1.16 文件模块（file-service @ 8097）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/files/presigned` | ios-customer ✓ | `fileName`, `objectType`(opt), `operate`(opt), `objectName`(opt) | Bearer | 预签名 URL |
| POST | `/api/v1/files/upload` | ios-customer ✓ | multipart form | Bearer | 直接上传 |

管理台上传同样使用 `/api/v1/files/upload`：寺院台维护寺院封面、图册和法师头像，平台台维护流派封面与运营图片，商城台维护商品与 DIY 素材图。返回的 `url` 必须是客户端可访问的公网 HTTPS 地址，容器内部 `minio:9000` 只用于服务端连接。

### 1.15 评价模块（review-service @ 8092）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/reviews` | — | `userId`, `targetType`, `targetId`, `rating`, `content` | Bearer | 提交评价 |
| GET | `/api/v1/reviews` | — | `targetType`(opt), `targetId`(opt), `userId`(opt), `rating`(opt), `page` | 无 | 评价列表 |
| GET | `/api/v1/reviews/:id` | — | — | 无 | 评价详情 |

### 1.18 备用 React Native C 端已知问题

> `mobile-customer` 是回归参考实现，不属于本次定义的五个正式客户端；以下问题不计入五端发布结论，但保留为后续维护队列。

| # | 客户端 | 位置 | 问题 |
|---|--------|------|------|
| C1 | mobile-customer | ~~`client.ts:29`~~ | ✅ 已修复：默认端口已改为 8080 |
| C2 | mobile-customer | ~~`client.ts:65`~~ | ✅ 已修复：已识别 40101 业务码 |
| C3 | mobile-customer | ~~`booking.ts:7,11,16`~~ | ✅ 已修复：路径已改为复数 `/bookings` |
| C4 | mobile-customer | ~~`types/index.ts:80-92`~~ | ✅ 已修复：`CreateBookingInput` 已补 `userId` 必填字段 |
| C5 | mobile-customer | `home.tsx:65-72` | `temples.slice`/`masters.slice` 运行时崩溃（返回分页对象非数组） |
| C6 | mobile-customer | ~~`types/index.ts:104-107`~~ | ✅ 已修复：`LoginResult.accessToken` 已对齐后端字段名 |
| C7 | mobile-customer | `auth.ts` | `logout()` 仅本地清理，未调用后端 `/auth/logout` |
| C8 | mobile-customer | `auth.ts` | `refresh()` 占位实现，无自动刷新重试（401 直接登出，弱于 3 个 web 端） |
| C9 | ios-customer | 路径不统一 | 消息列表用 `/message/list`（单数），其他消息接口用 `/messages/*`（复数）——后端设计如此，非 bug |
| C10 | ios-customer | ~~`AuthStore.swift`~~ | ✅ 已修复：`userId` 已持久化到 UserDefaults，不再用 `U001` 占位 |
| C11 | ios-customer | `WebSocketManager.swift` | 实为 HTTP 5s 轮询，后端无 WS ——设计如此，IM 走 OpenIM SDK（✅ 已集成真实 SDK，WS 10001 长连接） |
| C12 | 两端 | logout | 缺少服务端 token 失效机制 |
| C13 | mobile-customer | `storage.ts:6` | token key `dongfang_jwt` 未按端隔离（其他端用 `df_*_token`），命名不规范 |
| C14 | mobile-customer | `client.ts` | 未注入 `X-Client-Type` header（其他 5 端均注入），后端若依赖此 header 识别客户端会漏掉 RN 端 |

---

## 第二章：iOS 法师端接口（ios-master）

**客户端基础配置**：

| 项 | 值 |
|----|----|
| 技术栈 | Swift / SwiftUI |
| baseURL | Debug: `http://localhost:8080/api/v1` / Release: `https://api.askxuan.com/api/v1` |
| 鉴权存储 | Keychain (`com.askxuan.master` / `df_master_token`) |
| 401 处理 | HTTP 401 + 业务码 40101 双识别（✅ 已修复，原仅识别 HTTP 401） |
| X-Client-Type | `master` |
| 法师身份 | 由 JWT Claims 携带，禁止 URL 传参 |
| 自动刷新 | HTTP 401 时 refresh + 重试一次（`adminLogin` / `authRefresh` 不刷新） |
| OpenIM 集成 | ✅ 已集成真实 SDK（CocoaPods `OpenIMSDK ~> 3.8.3`，与 ios-customer 相同） |

### 2.1 认证

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/auth/admin/login` | ✓ | `account`, `password` | 无 | 管理台登录（role=master） |
| POST | `/api/v1/auth/refresh` | ✓ | `refreshToken` | 无 | 刷新 token |

### 2.2 法师预约（booking-service @ 8085）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/bookings` | ✓ | `status`(opt), `page`, `size` | Bearer + AdminAuth | 法师视角预约列表 |
| GET | `/api/v1/admin/masters/bookings/:id` | ✓ | — | Bearer | 预约详情（校验归属本法师） |
| PUT | `/api/v1/admin/masters/bookings/:id/confirm` | ✓ | `remark`(opt) | Bearer | 确认预约（pending → confirmed） |
| PUT | `/api/v1/admin/masters/bookings/:id/start` | ✓ | `remark`(opt) | Bearer | 开始服务（confirmed → in_progress） |
| PUT | `/api/v1/admin/masters/bookings/:id/complete` | ✓ | `remark`(opt) | Bearer | 完成预约（in_progress → completed） |

> **注**：法师端 detail/confirm/start/complete 端点已补齐，均校验预约必须归属当前 JWT 法师。

### 2.3 法师加持任务（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/blessing-tasks` | ✓ | `status`(opt), `page`, `size` | Bearer | 加持任务列表 |
| GET | `/api/v1/admin/masters/blessing-tasks/:id` | ✓ | — | Bearer | 任务详情 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/accept` | ✓ | — | Bearer | 接单 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/start` | ✓ | — | Bearer | 开始加持 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/complete` | ✓ | `certificateUrls` | Bearer | 完成加持 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/reject` | ✓ | — | Bearer | 拒单 |

### 2.4 法师日程（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/schedules` | ✓ | `date`(opt), `page`, `size` | Bearer | 日程列表 |
| PUT | `/api/v1/admin/masters/schedules` | ✓ | `date`, `timeSlots`, `status` | Bearer | 更新日程 |

### 2.5 法师收益（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/earnings/summary` | ✓ | — | Bearer | 收益汇总 |
| GET | `/api/v1/admin/masters/earnings/details` | ✓ | `serviceType`(opt), `page`, `size` | Bearer | 收益明细 |

### 2.6 法师资料（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/profile` | ✓ | — | Bearer | 法师资料 |
| PUT | `/api/v1/admin/masters/profile` | ✓ | `bio`(opt), `specialties`(opt), `avatar`(opt), `pricing`(opt) | Bearer | 更新资料 |

### 2.7 法师社区内容 / 大师广场（community-service @ 8099）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/community/posts` | ✓ | `status`(opt), `page`, `size` | Bearer | 法师本人发布内容列表 |
| POST | `/api/v1/admin/masters/community/posts` | ✓ | `type`, `title`, `content`(opt), `coverMediaId`(opt), `beliefCode`(opt), `assets[]`, `submit` | Master | 保存草稿或提交审核；素材只引用 mediaId |
| PUT | `/api/v1/admin/masters/community/posts/:id` | ✓ | 同创建接口 | Master | 仅编辑草稿或被驳回内容，并重新校验媒体归属与 ready 状态 |
| PUT | `/api/v1/admin/masters/community/posts/:id/status` | ✓ | `status` | Bearer | 草稿/提交审核/下架 |

### 2.8 平台社区审核（community-service @ 8099）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/platform/community/posts` | web-platform-admin ✓ | `status`(opt), `page`, `size` | Platform | 帖子审核列表 |
| PUT | `/api/v1/admin/platform/community/posts/:id/approve` | web-platform-admin ✓ | `remark`(opt) | Platform | 帖子通过；与 Audit 队列/日志同事务 |
| PUT | `/api/v1/admin/platform/community/posts/:id/reject` | web-platform-admin ✓ | `remark` | Platform | 帖子驳回 |
| GET | `/api/v1/admin/platform/community/comments` | web-platform-admin ✓ | `status`(opt), `page`, `size` | Platform | 评论审核列表 |
| PUT | `/api/v1/admin/platform/community/comments/:id/approve` | web-platform-admin ✓ | `remark`(opt) | Platform | 评论通过后才计入并公开显示 |
| PUT | `/api/v1/admin/platform/community/comments/:id/reject` | web-platform-admin ✓ | `remark` | Platform | 评论驳回 |

### 2.9 法师消息（message-service @ 8094）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/messages/master` | ✓ | `isRead`(opt), `page`, `size` | Bearer | 法师消息列表 |
| PUT | `/api/v1/admin/messages/master/:id/read` | ✓ | — | Bearer | 标记已读 |
| POST | `/api/v1/messages/device-token` | ✓ | `userId`, `clientType`, `platform`, `deviceToken`, `bundleId`(opt) | Bearer | 注册 APNs token（**路径无 admin 前缀**，与 C 端共用） |

### 2.10 法师评价（review-service @ 8092）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/masters/reviews` | ✓ | `rating`(opt), `page`, `size` | Bearer | 当前法师评价列表（法师身份从 JWT 获取） |

### 2.10 法师提现（finance-service @ 8091）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/admin/finance/withdrawals/apply` | ✓ | `amount`, `bankCard` | Bearer | 提现申请 |

### 2.11 法师端已知不对齐问题

| # | 位置 | 问题 |
|---|------|------|
| M1 | `APIClient.swift` | ✅ 已修复：识别 40101 并触发统一登出 |
| M2 | `Endpoint.swift` | ✅ 已修复：预约详情、确认、开始、完成路径与后端复数路由一致 |
| M3 | `BookingsView.swift` | ✅ 已修复：状态筛选、分页、空态和详情均使用真实 ViewModel 数据及预约 ID |
| M4 | `Models/BlessingTask.swift` | ✅ 已修复：状态使用 `in_progress` / `completed` |

---

## 第三章：寺院管理台接口（web-temple-admin）

**客户端基础配置**：

| 项 | 值 |
|----|----|
| 技术栈 | Vue3 + Vite + TS + Element Plus |
| dev 端口 | 5174 |
| baseURL | `/api/v1`（dev Vite proxy → `http://localhost:8080`） |
| 鉴权存储 | localStorage `df_temple_admin_token` / `df_temple_admin_refresh_token` |
| 401 处理 | HTTP 401 自动 refresh + 重试一次；兼容 message-service 裸 JSON |
| X-Client-Type | `temple-admin` |

### 3.1 认证

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/auth/admin/login` | ✓ | `account`, `password` | 无 | 寺院管理员登录 |
| POST | `/api/v1/auth/refresh` | ✓（拦截器内部） | `refreshToken` | 无 | 刷新 token |

### 3.2 寺院信息（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/temples/info` | ✓ | — | Bearer | 寺院信息（JWT 推导 templeId） |
| PUT | `/api/v1/admin/temples/info` | ✓ | `name`(opt), `region`(opt), `type`(opt), `beliefCode`(opt), `sect`(opt), `address`(opt), `coverImage`(opt) | Bearer | 更新寺院信息 |
| GET | `/api/v1/admin/temples/images` | ✓ | — | Bearer | 当前寺院图册 |
| POST | `/api/v1/admin/temples/images` | ✓ | `url`, `type`, `sort`(opt) | Bearer | 新增寺院图片 |
| DELETE | `/api/v1/admin/temples/images/:id` | ✓ | — | Bearer | 删除寺院图片 |

### 3.3 寺院服务（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/temples/services` | ✓ | — | Bearer | 服务列表 |
| POST | `/api/v1/admin/temples/services` | ✓ | `serviceCode`, `serviceName`, `price`, `slots[{code,label,startTime,endTime,capacity,status,sort}]`, `timeSlots`(compat), `intentTags`(opt) | Bearer | 新增服务 |
| PUT | `/api/v1/admin/temples/services/:id` | ✓ | `serviceName`(opt), `price`(opt), `slots`(opt), `timeSlots`(compat), `intentTags`(opt) | Bearer | 更新服务 |
| PUT | `/api/v1/admin/temples/services/:id/status` | ✓ | `status` | Bearer | 服务上下架 |

> **注**：`service.ts` 与 `temple.ts` 都实现了此组接口，存在重复定义。

### 3.4 法师管理（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/temples/masters` | ✓ | `templeId`, `status`(opt), `page`, `size` | Bearer | 法师列表 |
| POST | `/api/v1/admin/temples/masters` | ✓ | `dharmaName`, `layName`, `templeId`, `position`, `beliefCode`, `sect`, `type` | Bearer | 新增法师 |
| PUT | `/api/v1/admin/temples/masters/:id` | ✓ | `dharmaName`(opt), `layName`(opt), `position`(opt), `beliefCode`(opt), `sect`(opt), `specialties`(opt) | Bearer | 更新法师 |
| PUT | `/api/v1/admin/temples/masters/:id/status` | ✓ | `status` | Bearer | 法师上下架 |

### 3.5 预约管理（booking-service @ 8085）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/bookings` | ✓ | `templeId`, `status`(opt), `masterId`(opt), `page`, `size` | Bearer | 预约列表 |
| GET | `/api/v1/admin/bookings/:id` | ✓ | — | Bearer | 预约详情 |
| PUT | `/api/v1/admin/bookings/:id/confirm` | ✓ | `remark`(opt) | Bearer | 确认预约 |
| PUT | `/api/v1/admin/bookings/:id/cancel` | ✓ | `remark`(opt) | Bearer | 取消预约 |
| GET | `/api/v1/admin/bookings/:id/status-log` | ✓ | — | Bearer | 状态流转日志 |
| PUT | `/api/v1/admin/bookings/:id/review/reply` | ✓ | `masterReply` | Bearer | 法师回复评价 |

### 3.6 加持任务（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/temples/blessing-tasks` | ✓ | `status`(opt), `page`, `size` | Bearer | 加持任务列表 |
| GET | `/api/v1/admin/temples/blessing-tasks/:id` | ✓ | — | Bearer | 任务详情 |
| PUT | `/api/v1/admin/temples/blessing-tasks/:id/assign` | ✓ | `masterCode` | Bearer | 分配法师 |

### 3.7 评价管理（review-service @ 8092）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/reviews` | ✓ | `targetType`(opt), `targetId`(opt), `status`(opt), `rating`(opt), `page` | Bearer | 评价列表 |
| GET | `/api/v1/admin/reviews/:id` | ✓ | — | Bearer | 评价详情 |
| POST | `/api/v1/admin/reviews/:id/reply` | ✓ | `replierType`, `replierId`, `content` | Bearer | 回复评价（replierType 固定 `temple_admin`） |

### 3.8 寺院报表（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/temples/reports` | ✓ | `startTime`(opt), `endTime`(opt) | Bearer | 寺院数据报表 |

### 3.9 寺院端已知不对齐问题

| # | 位置 | 问题 |
|---|------|------|
| T1 | `service.ts` + `temple.ts` | 服务接口重复定义（`/admin/temples/services` 系列） |
| T2 | ~~localStorage key~~ | ✅ 已修复：各端 token key 已隔离（`df_temple_admin_token` / `df_shop_admin_token` / `df_platform_admin_token`） |

---

## 第四章：商城管理台接口（web-shop-admin）

**客户端基础配置**：

| 项 | 值 |
|----|----|
| 技术栈 | Vue3 + Vite + TS + Element Plus |
| dev 端口 | 5175 |
| baseURL | `/api/v1`（dev Vite proxy → `http://localhost:8080`） |
| 鉴权存储 | localStorage `df_shop_admin_token` / `df_shop_admin_refresh_token` |
| 401 处理 | HTTP 401 自动 refresh + 重试一次；**未兼容 message-service 裸 JSON** |
| X-Client-Type | `shop-admin` |

### 4.1 认证

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/auth/admin/login` | ✓ | `account`, `password` | 无 | 商城管理员登录 |
| POST | `/api/v1/auth/refresh` | ✓（拦截器内部） | `refreshToken` | 无 | 刷新 token |

> ✅ **已修复**：原 `stores/auth.ts:31-48` 的 Mock 登录兜底（admin/123456）已移除，现走真实接口 `POST /auth/admin/login`。token key 已隔离为 `df_shop_admin_token`（与 web-temple-admin 的 `df_temple_admin_token`、web-platform-admin 的 `df_platform_admin_token` 互不干扰）。

### 4.2 商品管理（product-service @ 8086）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/products` | ✓ | `categoryId`(opt), `keyword`(opt), `status`(opt), `page`, `size` | Bearer | 商品列表 |
| POST | `/api/v1/admin/products` | ✓ | `name`, `categoryId`, `description`(opt), `mainImage`, `price`, `intentTags`(opt) | Bearer | 创建商品 |
| GET | `/api/v1/admin/products/:id` | ✓ | — | Bearer | 商品详情 |
| PUT | `/api/v1/admin/products/:id` | ✓ | `name`, `categoryId`, `description`(opt), `mainImage`, `intentTags`(opt) | Bearer | 更新商品 |
| DELETE | `/api/v1/admin/products/:id` | ✓ | — | Bearer | 删除商品 |
| PUT | `/api/v1/admin/products/:id/status` | ✓ | `status` | Bearer | 上下架 |

### 4.3 商品分类（product-service @ 8086）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/products/categories` | ✓ | `parentId`(opt), `page`, `size` | Bearer | 分类列表 |
| POST | `/api/v1/admin/products/categories` | ✓ | `parentId`, `name`, `level`, `sort`(opt) | Bearer | 新增分类 |
| PUT | `/api/v1/admin/products/categories/:id` | ✓ | `parentId`, `name`, `level`, `sort`(opt) | Bearer | 更新分类 |
| DELETE | `/api/v1/admin/products/categories/:id` | ✓ | — | Bearer | 删除分类 |

### 4.4 DIY 材料管理（diy-service @ 8088）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/diy/materials` | ✓ | `category`(opt), `keyword`(opt), `page`, `size` | Bearer | 材料列表 |
| POST | `/api/v1/admin/diy/materials` | ✓ | `name`, `spec`, `unitPrice`, `unit`, `category` | Bearer | 新增材料 |
| PUT | `/api/v1/admin/diy/materials/:id` | ✓ | `name`, `spec`, `unitPrice`, `unit` | Bearer | 更新材料 |
| PUT | `/api/v1/admin/diy/materials/:id/status` | ✓ | `status` | Bearer | 材料上下架 |

### 4.5 DIY 加持服务（diy-service @ 8088）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/diy/blessing-services` | ✓ | `page`, `size` | Bearer | 加持服务列表 |
| POST | `/api/v1/admin/diy/blessing-services` | ✓ | `serviceName`, `templeCode`, `masterCode`, `price`, `description`(opt) | Bearer | 新增服务 |
| PUT | `/api/v1/admin/diy/blessing-services/:id` | ✓ | `serviceName`, `templeCode`, `masterCode`, `price` | Bearer | 更新服务 |
| DELETE | `/api/v1/admin/diy/blessing-services/:id` | ✓ | — | Bearer | 删除服务 |

### 4.6 DIY 订单管理（diy-service @ 8088）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/diy/orders` | ✓ | `status`(opt), `page`, `size` | Bearer | DIY 订单列表 |
| GET | `/api/v1/admin/diy/orders/:id` | ✓ | — | Bearer | DIY 订单详情 |
| PUT | `/api/v1/admin/diy/orders/:id/review` | ✓ | `action`, `reason`(opt) | Bearer | 审核订单 |
| PUT | `/api/v1/admin/diy/orders/:id/make-complete` | ✓ | — | Bearer | 制作完成 |
| PUT | `/api/v1/admin/diy/orders/:id/ship` | ✓ | `expressCompany`, `trackingNo` | Bearer | 发货 |

### 4.7 商城订单管理（order-service @ 8089）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/orders` | ✓ | `status`(opt), `page`, `size` | Bearer | 订单列表 |
| GET | `/api/v1/admin/orders/:id` | ✓ | — | Bearer | 订单详情 |
| PUT | `/api/v1/admin/orders/:id/ship` | ✓ | `expressCompany`, `trackingNo` | Bearer | 发货 |
| GET | `/api/v1/admin/orders/returns` | ✓ | `status`(opt), `page`, `size` | Bearer | 退货列表 |
| PUT | `/api/v1/admin/orders/returns/:id/review` | ✓ | `action`, `reason`(opt) | Bearer | 退货审核 |
| PUT | `/api/v1/admin/orders/returns/:id/refund` | ✓ | `amount` | Bearer | 退款 |

### 4.8 物流管理（logistics-service @ 8095）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/logistics/express` | ✓ | `code`(opt), `name`(opt), `status`(opt), `page`, `size` | Bearer | 快递公司列表 |
| POST | `/api/v1/admin/logistics/express` | ✓ | `code`, `name`, `logoUrl`(opt), `customerService`(opt), `sort` | Bearer | 新增快递 |
| PUT | `/api/v1/admin/logistics/express/:id` | ✓ | `name`(opt), `logoUrl`(opt), `customerService`(opt), `sort`(opt) | Bearer | 更新快递 |
| GET | `/api/v1/admin/logistics/freight-templates` | ✓ | `name`(opt), `type`(opt), `status`(opt), `page`, `size` | Bearer | 运费模板列表 |
| POST | `/api/v1/admin/logistics/freight-templates` | ✓ | `name`, `type`, `freeShipping`, `config` | Bearer | 新增模板 |
| PUT | `/api/v1/admin/logistics/freight-templates/:id` | ✓ | `name`(opt), `type`(opt), `freeShipping`(opt), `config`(opt) | Bearer | 更新模板 |
| GET | `/api/v1/admin/logistics/tracks/:trackingNo` | ✓ | — | Bearer | 物流轨迹查询 |
| POST | `/api/v1/admin/logistics/tracks/batch-sync` | ✓ | `trackingNos`(opt) | Bearer | 批量同步轨迹 |

### 4.9 商城报表（finance-service @ 8091）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/finance/shop/reports` | ✓ | `startTime`, `endTime`, `type`(opt), `page`, `size` | Bearer | 商城报表 |

### 4.10 商城端已知不对齐问题

| # | 位置 | 问题 |
|---|------|------|
| S1 | ~~`stores/auth.ts:31-48`~~ | ✅ 已修复：Mock 登录兜底已移除，走真实接口；token key 已隔离为 `df_shop_admin_token` |
| S2 | `client.ts:57` | 未兼容 message-service 裸 JSON（缺 `'code' in res` 判断） |
| S3 | ~~`report.ts`~~ | ✅ 已修复：后端 `shopReports` handler + logic 已实现，测试返回 code=0 success |
| S4 | ~~localStorage key~~ | ✅ 已修复：已隔离为 `df_shop_admin_token` |

---

## 第五章：平台管理台接口（web-platform-admin）

**客户端基础配置**：

| 项 | 值 |
|----|----|
| 技术栈 | Vue3 + Vite + TS + Element Plus |
| dev 端口 | 5210 |
| baseURL | `/api/v1`（dev Vite proxy → `http://localhost:8080`） |
| 鉴权存储 | localStorage `df_platform_admin_token` / `df_platform_admin_refresh_token` |
| 401 处理 | HTTP 401 自动 refresh + 重试一次；兼容 message-service 裸 JSON |
| X-Client-Type | `platform-admin` |

### 5.1 认证与权限（auth-service @ 8081）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| POST | `/api/v1/auth/admin/login` | ✓ | `account`, `password` | 无 | 平台管理员登录 |
| POST | `/api/v1/auth/refresh` | ✓（拦截器内部） | `refreshToken` | 无 | 刷新 token |
| GET | `/api/v1/admin/auth/accounts` | ✓ | `keyword`(opt), `status`(opt), `page`, `size` | Bearer | 管理账号列表 |
| POST | `/api/v1/admin/auth/accounts` | ✓ | `account`, `password`, `name`, `roleId`, `templeId`(opt) | Bearer | 创建管理账号 |
| PUT | `/api/v1/admin/auth/accounts/:id` | ✓ | `name`(opt), `roleId`(opt), `templeId`(opt), `masterId`(opt) | Bearer | 更新账号 |
| PUT | `/api/v1/admin/auth/accounts/:id/status` | ✓ | `status` | Bearer | 启用/禁用账号 |
| GET | `/api/v1/admin/auth/roles` | ✓ | — | Bearer | 角色列表 |
| POST | `/api/v1/admin/auth/roles` | ✓ | `name`, `code`, `description`(opt) | Bearer | 创建角色 |
| PUT | `/api/v1/admin/auth/roles/:id` | ✓ | `name`(opt), `description`(opt) | Bearer | 更新角色 |
| GET | `/api/v1/admin/auth/permissions` | ✓ | — | Bearer | 权限列表 |

### 5.2 用户管理（user-service @ 8082）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/users` | ✓ | `keyword`(opt), `status`(opt), `page`, `size` | Bearer | 平台用户列表 |
| GET | `/api/v1/admin/users/:id` | ✓ | — | Bearer | 用户详情 |
| PUT | `/api/v1/admin/users/:id/status` | ✓ | `status` | Bearer | 封禁/解封用户 |

### 5.3 寺院审核（temple-service @ 8083）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/platform/temples` | ✓ | `beliefCode`(opt), `sect`(opt), `type`(opt), `region`(opt), `page`, `size` | Bearer | 平台寺院列表，包含全状态寺院及真实上架服务摘要 |
| GET | `/api/v1/admin/platform/temples/:id` | ✓ | — | Bearer | 平台寺院详情，可查看待审核/封禁寺院 |
| GET | `/api/v1/admin/platform/temples/audits` | ✓ | `templeCode`(opt), `status`(opt), `page`, `size` | Bearer | 入驻审核列表 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/first-pass` | ✓ | `auditRemark`(opt) | Bearer | 初审通过 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/final-pass` | ✓ | `auditRemark`(opt) | Bearer | 终审通过 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/reject` | ✓ | `auditRemark`(opt) | Bearer | 驳回申请 |
| PUT | `/api/v1/admin/platform/temples/:id/status` | ✓ | `status` (`normal/banned/recommended`) | Bearer | 寺院运营状态；待审核寺院不可用此接口绕过入驻审核 |
| GET | `/api/v1/admin/platform/beliefs` | ✓ | — | Bearer | 一级流派列表，包含停用项 |
| POST | `/api/v1/admin/platform/beliefs` | ✓ | `code`, `name`, `summary`(opt), `description`, `coverImage`(opt), `icon`(opt), `sort`(opt) | Bearer | 新增一级流派运营资料 |
| PUT | `/api/v1/admin/platform/beliefs/:code` | ✓ | `name`, `summary`(opt), `description`, `coverImage`(opt), `icon`(opt), `sort`(opt) | Bearer | 编辑一级流派运营资料 |
| PUT | `/api/v1/admin/platform/beliefs/:code/status` | ✓ | `status` (`enabled/disabled`) | Bearer | 启用或停用一级流派入口 |
| GET | `/api/v1/temples/:id` | ✓ | — | 无 | C 端寺院详情，仅正常/推荐状态可见 |

### 5.3.1 首页心愿分类（product-service @ 8086）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/platform/intentions` | ✓ | — | Bearer | 心愿分类列表，包含停用项 |
| POST | `/api/v1/admin/platform/intentions` | ✓ | `code`, `name`, `description`(opt), `icon`(opt), `landingType`(opt), `landingValue`(opt), `actionTitle`(opt), `sort`(opt) | Bearer | 新增心愿分类 |
| PUT | `/api/v1/admin/platform/intentions/:code` | ✓ | `name`, `description`(opt), `icon`(opt), `landingType`(opt), `landingValue`(opt), `actionTitle`(opt), `sort`(opt) | Bearer | 编辑心愿分类 |
| PUT | `/api/v1/admin/platform/intentions/:code/status` | ✓ | `status` (`enabled/disabled`) | Bearer | 启用或停用心愿入口 |

### 5.4 法师审核（master-service @ 8084）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/platform/masters/audits` | ✓ | `status`(opt), `page`, `size` | Bearer | 法师资质审核列表 |
| PUT | `/api/v1/admin/platform/masters/audits/:id/pass` | ✓ | `auditRemark`(opt) | Bearer | 审核通过 |
| PUT | `/api/v1/admin/platform/masters/audits/:id/reject` | ✓ | `auditRemark`(opt) | Bearer | 审核驳回 |
| PUT | `/api/v1/admin/platform/masters/:id/status` | ✓ | `status` | Bearer | 法师状态（normal/banned） |
| GET | `/api/v1/masters` | ✓ | `sect`(opt), `type`(opt), `templeId`(opt), `page`, `size` | 无 | 法师列表（**复用 C 端接口**） |
| GET | `/api/v1/masters/:id` | ✓ | — | 无 | 法师详情（**复用 C 端接口**） |

### 5.5 评价管理（review-service @ 8092）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/reviews` | ✓ | `targetType`(opt), `targetId`(opt), `status`(opt), `rating`(opt), `page` | Bearer | 评价列表 |
| GET | `/api/v1/admin/reviews/:id` | ✓ | — | Bearer | 评价详情 |
| POST | `/api/v1/admin/reviews/:id/reply` | ✓ | `replierType`, `replierId`, `content` | Bearer | 回复评价 |
| GET | `/api/v1/admin/platform/reviews/reports` | ✓ | `status`(opt), `page`, `size` | Bearer | 平台举报列表 |
| PUT | `/api/v1/admin/platform/reviews/reports/:id/handle` | ✓ | `handleResult`, `remark`(opt) | Bearer | 处理举报 |

### 5.6 审核中心（audit-service @ 8093）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/audit/queue` | ✓ | `bizType`(opt), `status`(opt), `page`, `size` | Bearer | 审核队列列表 |
| GET | `/api/v1/admin/audit/queue/:id` | ✓ | — | Bearer | 审核详情 |
| PUT | `/api/v1/admin/audit/queue/:id/approve` | ✓ | `auditorId`, `remark`(opt) | Bearer | 审核通过 |
| PUT | `/api/v1/admin/audit/queue/:id/reject` | ✓ | `auditorId`, `remark` | Bearer | 审核驳回 |
| GET | `/api/v1/admin/audit/reports` | ✓ | `targetType`(opt), `status`(opt), `page`, `size` | Bearer | 举报列表 |
| PUT | `/api/v1/admin/audit/reports/:id/handle` | ✓ | `handlerId`, `handleResult`, `remark`(opt) | Bearer | 处理举报 |
| GET | `/api/v1/admin/audit/sensitive-words` | ✓ | `category`(opt), `status`(opt), `keyword`(opt), `page`, `size` | Bearer | 敏感词列表 |
| POST | `/api/v1/admin/audit/sensitive-words` | ✓ | `word`, `category` | Bearer | 新增敏感词 |
| DELETE | `/api/v1/admin/audit/sensitive-words/:id` | ✓ | — | Bearer | 删除敏感词 |
| GET | `/api/v1/admin/audit/statistics` | ✓ | `bizType`(opt) | Bearer | 审核统计 |

### 5.7 财务管理（finance-service @ 8091）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/finance/overview` | ✓ | `startTime`(opt), `endTime`(opt) | Bearer | 收入总览 |
| GET | `/api/v1/admin/finance/settlements` | ✓ | `settleType`(opt), `status`(opt), `page`, `size` | Bearer | 结算单列表 |
| GET | `/api/v1/admin/finance/settlements/:id` | ✓ | — | Bearer | 结算单详情 |
| POST | `/api/v1/admin/finance/settlements/confirm/:id` | ✓ | — | Bearer | 确认结算单 |
| GET | `/api/v1/admin/finance/withdrawals` | ✓ | `applicantType`(opt), `status`(opt), `page`, `size` | Bearer | 提现列表 |
| PUT | `/api/v1/admin/finance/withdrawals/:id/audit` | ✓ | `action`, `remark`(opt) | Bearer | 提现审核 |
| PUT | `/api/v1/admin/finance/withdrawals/:id/process` | ✓ | — | Bearer | 提现打款 |
| GET | `/api/v1/admin/finance/commission-config` | ✓ | `bizType`(opt) | Bearer | 抽成配置列表 |
| PUT | `/api/v1/admin/finance/commission-config/:id` | ✓ | `rate`, `description`(opt) | Bearer | 更新抽成配置 |
| GET | `/api/v1/admin/finance/reports` | ✓ | `startTime`, `endTime`, `type`(opt), `page`, `size` | Bearer | 财务报表 |

结算单列表和详情响应包含 `sourceType`、`sourceNo`，用于从平台结算追溯预约等原始业务单。预约支付先形成平台总账收款，`reviewed` 后才生成寺院/大师结算；支付成功不等于已向大师入账。

### 5.8 消息推送（message-service @ 8094）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/messages/templates` | ✓ | `type`(opt), `page`, `size` | Bearer | 消息模板列表 |
| POST | `/api/v1/admin/messages/templates` | ✓ | `code`, `titleTemplate`, `contentTemplate`, `variables`(opt), `type` | Bearer | 创建模板 |
| PUT | `/api/v1/admin/messages/templates/:id` | ✓ | `titleTemplate`(opt), `contentTemplate`(opt), `variables`(opt) | Bearer | 更新模板 |
| POST | `/api/v1/admin/messages/push` | ✓ | `userId`, `pushType`, `title`, `content`, `bizType`(opt) | Bearer | 推送消息 |

### 5.9 公告管理（message-service @ 8094）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/announcements/list` | ✓ | `type`(opt), `targetAudience`(opt), `page`, `size` | Bearer | 公告列表 |
| POST | `/api/v1/admin/announcements/create` | ✓ | `title`, `content`, `type`, `targetAudience` | Bearer | 创建公告 |
| PUT | `/api/v1/admin/announcements/:id/status` | ✓ | `status` | Bearer | 公告上下线 |

### 5.10 营销管理（marketing-service @ 8096）

| 方法 | 路径 | 客户端调用 | 请求字段 | 鉴权 | 说明 |
|------|------|-----------|---------|------|------|
| GET | `/api/v1/admin/marketing/banners` | ✓ | `status`(opt), `page`, `size` | Bearer | Banner 列表 |
| POST | `/api/v1/admin/marketing/banners` | ✓ | `title`, `imageUrl`, `linkType`, `linkValue`, `sort`(opt) | Bearer | 创建 Banner |
| PUT | `/api/v1/admin/marketing/banners/:id` | ✓ | `title`(opt), `imageUrl`(opt), `linkType`(opt), `linkValue`(opt) | Bearer | 更新 Banner |
| GET | `/api/v1/admin/marketing/activities` | ✓ | `status`(opt), `type`(opt), `page`, `size` | Bearer | 活动列表 |
| POST | `/api/v1/admin/marketing/activities` | ✓ | `name`, `type`, `startTime`, `endTime`, `config`(opt) | Bearer | 创建活动 |
| PUT | `/api/v1/admin/marketing/activities/:id` | ✓ | `name`(opt), `type`(opt), `startTime`(opt), `endTime`(opt) | Bearer | 更新活动 |
| GET | `/api/v1/admin/marketing/coupons` | ✓ | `status`(opt), `type`(opt), `page`, `size` | Bearer | 优惠券列表 |
| POST | `/api/v1/admin/marketing/coupons` | ✓ | `name`, `type`, `value`, `minAmount`(opt), `categoryId`(opt) | Bearer | 创建优惠券 |
| PUT | `/api/v1/admin/marketing/coupons/:id` | ✓ | `name`(opt), `type`(opt), `value`(opt), `minAmount`(opt) | Bearer | 更新优惠券 |

### 5.11 平台端已知不对齐问题

| # | 位置 | 问题 |
|---|------|------|
| P1 | `master.ts` + `temple.ts` | C 端与管理端接口混用：`getMasterList`/`getMasterDetail` 用 C 端 `/masters`，`getTempleDetail` 用 C 端 `/temples/{id}` |
| P2 | `system.ts` | 角色/权限/敏感词从其他模块 re-export，职责重叠 |
| P3 | localStorage key | ✅ 已修复：使用 `df_platform_admin_token`，与寺院台和商城台隔离 |

---

# 下篇：后端视角

> 本篇按 19 个业务服务分章，回答"每个业务服务提供哪些接口"；gateway 作为第 20 个后端进程负责统一鉴权、发现与转发，路由见附录 B。
> 每个服务分 C 端接口和管理台接口两组，标注鉴权方式与客户端调用情况。
> 客户端调用列：📱=ios-customer，📲=mobile-customer，🔪=ios-master，🏛️=web-temple-admin，🛒=web-shop-admin，🌐=web-platform-admin。

---

## 第六章：auth-service（端口 8081）

**路径前缀**：`/api/v1/auth`（C 端）、`/api/v1/admin/auth`（管理台）
**职责**：认证、JWT 签发与续期、管理台账号与角色权限

### 6.1 C 端接口（4 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/auth/login` | login | `phone`, `code`(opt), `account`(opt), `password`(opt) | 无 | 📱 📲 🔪 🏛️ 🛒 🌐 | 手机号验证码 或 账号密码登录 |
| POST | `/api/v1/auth/refresh` | refresh | `refreshToken` | 无 | 📱 📲 🔪 🏛️ 🛒 🌐 | Token 续期 |
| POST | `/api/v1/auth/logout` | logout | `accessToken`(opt) | 无 | 📱 | 登出 |
| POST | `/api/v1/auth/admin/login` | adminLogin | `account`, `password` | 无 | 🔪 🏛️ 🛒 🌐 | 管理台登录入口 |

### 6.2 管理台接口（8 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/auth/accounts` | adminAccountList | `keyword`(opt), `status`(opt), `page`, `size` | jwt:Auth | 🌐 | 管理账号列表 |
| POST | `/api/v1/admin/auth/accounts` | adminAccountCreate | `account`, `password`, `name`, `roleId`, `templeId`(opt) | jwt:Auth | 🌐 | 创建管理账号 |
| PUT | `/api/v1/admin/auth/accounts/:id` | adminAccountUpdate | `name`(opt), `roleId`(opt), `templeId`(opt), `masterId`(opt) | jwt:Auth | 🌐 | 更新管理账号 |
| PUT | `/api/v1/admin/auth/accounts/:id/status` | adminAccountStatus | `status` | jwt:Auth | 🌐 | 启用/禁用账号 |
| GET | `/api/v1/admin/auth/roles` | adminRoleList | — | jwt:Auth | 🌐 | 角色列表 |
| POST | `/api/v1/admin/auth/roles` | adminRoleCreate | `name`, `code`, `description`(opt) | jwt:Auth | 🌐 | 创建角色 |
| PUT | `/api/v1/admin/auth/roles/:id` | adminRoleUpdate | `name`(opt), `description`(opt) | jwt:Auth | 🌐 | 更新角色 |
| GET | `/api/v1/admin/auth/permissions` | adminPermissionList | — | jwt:Auth | 🌐 | 权限列表 |

---

## 第七章：user-service（端口 8082）

**路径前缀**：`/api/v1/users`（C 端）、`/api/v1/admin/users`（管理台）
**职责**：用户注册、个人资料、收货地址管理

### 7.1 C 端接口（7 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/users/register` | register | `mobile`, `code`, `nickname`(opt) | 无 | 📱 | 用户注册 |
| GET | `/api/v1/users/profile` | profile | — | Bearer | 📱 | 获取个人资料 |
| PUT | `/api/v1/users/profile` | updateProfile | `nickname`(opt), `avatar`(opt), `gender`(opt), `birthday`(opt), `region`(opt) | Bearer | 📱 | 更新资料 |
| GET | `/api/v1/users/addresses` | addressList | — | Bearer | 📱 | 地址列表 |
| POST | `/api/v1/users/addresses` | addressCreate | `name`, `phone`, `province`, `city`, `district` | Bearer | 📱 | 新增地址 |
| PUT | `/api/v1/users/addresses/:id` | addressUpdate | `name`(opt), `phone`(opt), `province`(opt), `city`(opt) | Bearer | 📱 | 修改地址 |
| DELETE | `/api/v1/users/addresses/:id` | addressDelete | — | Bearer | 📱 | 删除地址 |

### 7.2 管理台接口（3 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/users` | adminUserList | `keyword`(opt), `status`(opt), `page`, `size` | jwt:Auth | 🌐 | 平台用户列表 |
| GET | `/api/v1/admin/users/:id` | adminUserDetail | — | jwt:Auth | 🌐 | 用户详情 |
| PUT | `/api/v1/admin/users/:id/status` | adminUserStatus | `status` | jwt:Auth | 🌐 | 封禁/解封用户 |

---

## 第八章：temple-service（端口 8083）

**路径前缀**：`/api/v1/temples`（C 端）、`/api/v1/admin/temples`（寺院台）、`/api/v1/admin/platform/temples`（平台台）
**职责**：寺院信息、寺院图片、寺院服务、加持任务分配、寺院入驻申请、寺院报表、平台审核

### 8.1 C 端接口（3 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/temples` | list | `sect`(opt), `type`(opt), `region`(opt), `page`, `size` | 无 | 📱 📲 🌐 | 寺院列表 |
| GET | `/api/v1/temples/:id` | detail | — | 无 | 📱 📲 🌐 | 寺院详情 |
| GET | `/api/v1/temples/:id/services` | serviceList | — | 无 | 📱 | 寺院服务列表 |

### 8.2 寺院管理台接口（13 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/temples/info` | adminTempleInfo | — | jwt:Auth | 🏛️ | 寺院信息 |
| PUT | `/api/v1/admin/temples/info` | adminTempleUpdate | `name`(opt), `region`(opt), `address`(opt), `coverImage`(opt) | jwt:Auth | 🏛️ | 更新寺院信息 |
| GET | `/api/v1/admin/temples/images` | adminImageList | — | jwt:Auth | 🏛️ | 当前寺院图册 |
| POST | `/api/v1/admin/temples/images` | adminImageCreate | `url`, `type`, `sort`(opt) | jwt:Auth | 🏛️ | 新增寺院图片 |
| DELETE | `/api/v1/admin/temples/images/:id` | adminImageDelete | — | jwt:Auth | 🏛️ | 删除寺院图片 |
| GET | `/api/v1/admin/temples/services` | adminServiceList | — | jwt:Auth | 🏛️ | 寺院服务列表 |
| POST | `/api/v1/admin/temples/services` | adminServiceCreate | `serviceCode`, `serviceName`, `price`, `slots`, `timeSlots`(compat), `intentTags`(opt) | jwt:Auth | 🏛️ | 新增服务与容量时段 |
| PUT | `/api/v1/admin/temples/services/:id` | adminServiceUpdate | `serviceName`(opt), `price`(opt), `slots`(opt), `timeSlots`(compat), `intentTags`(opt) | jwt:Auth | 🏛️ | 更新服务与容量时段 |
| PUT | `/api/v1/admin/temples/services/:id/status` | adminServiceStatus | `status` | jwt:Auth | 🏛️ | 服务上下架 |
| GET | `/api/v1/admin/temples/blessing-tasks` | adminBlessingTaskList | `status`(opt), `page`, `size` | jwt:Auth | 🏛️ | 加持任务列表 |
| GET | `/api/v1/admin/temples/blessing-tasks/:id` | adminBlessingTaskDetail | — | jwt:Auth | 🏛️ | 加持任务详情 |
| PUT | `/api/v1/admin/temples/blessing-tasks/:id/assign` | adminBlessingAssign | `masterCode` | jwt:Auth | 🏛️ | 分配法师 |
| POST | `/api/v1/admin/temples/apply` | adminTempleApply | `templeCode`, `applicantName`, `contactPhone`, `certUrls` | jwt:Auth | — | 寺院入驻申请 |
| GET | `/api/v1/admin/temples/reports` | adminTempleReports | `startTime`(opt), `endTime`(opt) | jwt:Auth | 🏛️ | 寺院报表 |

### 8.3 平台管理台接口（6 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/platform/temples` | platformTempleList | `beliefCode`(opt), `sect`(opt), `type`(opt), `region`(opt), `page`, `size` | jwt:Auth | 🌐 | 平台寺院列表，含上架服务摘要 |
| GET | `/api/v1/admin/platform/temples/:id` | platformTempleDetail | — | jwt:Auth | 🌐 | 平台寺院详情，含待审核/封禁数据 |
| GET | `/api/v1/admin/platform/temples/audits` | platformAuditList | `templeCode`(opt), `status`(opt), `page`, `size` | jwt:Auth | 🌐 | 入驻审核列表 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/first-pass` | platformAuditFirstPass | `auditRemark`(opt) | jwt:Auth | 🌐 | 初审通过 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/final-pass` | platformAuditFinalPass | `auditRemark`(opt) | jwt:Auth | 🌐 | 终审通过 |
| PUT | `/api/v1/admin/platform/temples/audits/:id/reject` | platformAuditReject | `auditRemark`(opt) | jwt:Auth | 🌐 | 驳回申请 |
| PUT | `/api/v1/admin/platform/temples/:id/status` | platformTempleStatus | `status` (`normal/banned/recommended`) | jwt:Auth | 🌐 | 寺院运营状态变更，不可绕过入驻审核 |

---

## 第九章：master-service（端口 8084）

**路径前缀**：`/api/v1/masters`（C 端）、`/api/v1/admin/temples/masters`（寺院台）、`/api/v1/admin/masters`（法师台）、`/api/v1/admin/platform/masters`（平台台）
**职责**：法师列表、法师资料、加持任务工作流、日程、收益、平台审核

### 9.1 C 端接口（2 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/masters` | list | `sect`(opt), `type`(opt), `templeId`(opt), `page`, `size` | 无 | 📱 📲 🌐 | 法师列表 |
| GET | `/api/v1/masters/:id` | detail | — | 无 | 📱 📲 🌐 | 法师详情 |

### 9.2 寺院管理台接口（4 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/temples/masters` | adminMasterList | `templeId`, `status`(opt), `page`, `size` | jwt:Auth | 🏛️ | 法师列表 |
| POST | `/api/v1/admin/temples/masters` | adminMasterCreate | `dharmaName`, `layName`, `templeId`, `templeName`(opt), `position` | jwt:Auth | 🏛️ | 新增法师 |
| PUT | `/api/v1/admin/temples/masters/:id` | adminMasterUpdate | `dharmaName`(opt), `layName`(opt), `position`(opt), `specialties`(opt) | jwt:Auth | 🏛️ | 更新法师 |
| PUT | `/api/v1/admin/temples/masters/:id/status` | adminMasterStatus | `status` | jwt:Auth | 🏛️ | 法师上下架 |

### 9.3 法师工作台接口（8 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/masters/blessing-tasks` | workspaceBlessingTaskList | `status`(opt), `page`, `size` | jwt:Auth | 🔪 | 加持任务列表 |
| GET | `/api/v1/admin/masters/blessing-tasks/:id` | workspaceBlessingTaskDetail | — | jwt:Auth | 🔪 | 任务详情 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/accept` | workspaceBlessingAccept | — | jwt:Auth | 🔪 | 接单 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/start` | workspaceBlessingStart | — | jwt:Auth | 🔪 | 开始加持 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/complete` | workspaceBlessingComplete | `certificateUrls` | jwt:Auth | 🔪 | 完成加持 |
| PUT | `/api/v1/admin/masters/blessing-tasks/:id/reject` | workspaceBlessingReject | — | jwt:Auth | 🔪 | 拒单 |
| GET | `/api/v1/admin/masters/schedules` | workspaceScheduleList | `date`(opt), `page`, `size` | jwt:Auth | 🔪 | 日程列表 |
| PUT | `/api/v1/admin/masters/schedules` | workspaceScheduleUpdate | `date`, `timeSlots`, `status` | jwt:Auth | 🔪 | 更新日程 |

### 9.4 法师收益与资料接口（4 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/masters/earnings/summary` | workspaceEarningsSummary | — | jwt:Auth | 🔪 | 收益汇总 |
| GET | `/api/v1/admin/masters/earnings/details` | workspaceEarningsDetails | `serviceType`(opt), `page`, `size` | jwt:Auth | 🔪 | 收益明细 |
| GET | `/api/v1/admin/masters/profile` | workspaceProfileGet | — | jwt:Auth | 🔪 | 法师资料 |
| PUT | `/api/v1/admin/masters/profile` | workspaceProfileUpdate | `bio`(opt), `specialties`(opt), `avatar`(opt), `pricing`(opt) | jwt:Auth | 🔪 | 更新资料 |

### 9.5 平台审核接口（4 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/platform/masters/audits` | platformAuditList | `status`(opt), `page`, `size` | jwt:Auth | 🌐 | 法师资质审核列表 |
| PUT | `/api/v1/admin/platform/masters/audits/:id/pass` | platformAuditPass | `auditRemark`(opt) | jwt:Auth | 🌐 | 审核通过 |
| PUT | `/api/v1/admin/platform/masters/audits/:id/reject` | platformAuditReject | `auditRemark`(opt) | jwt:Auth | 🌐 | 审核驳回 |
| PUT | `/api/v1/admin/platform/masters/:id/status` | platformMasterStatus | `status` | jwt:Auth | 🌐 | 法师状态变更 |

---

## 第十章：booking-service（端口 8085）

**路径前缀**：`/api/v1/bookings`（C 端）、`/api/v1/admin/bookings`（寺院台）、`/api/v1/admin/masters/bookings`（法师台）
**职责**：服务端计价、日期时段容量、防超卖、模拟支付及补偿对账、预约履约与评价

**内部 gRPC**：`temple.rpc:9083`、`master.rpc:9084`、`payment.rpc:9090`，均通过 etcd 发现；booking-service 不运行时跨库查询寺院、法师或支付库。

**OpenIM 强制权限**：OpenIM 的 `beforeSendSingleMsg` 同步回调指向 booking-service，`failedContinue=false`。`u_<userId>` 与 `m_<masterNumericId>` 的文字消息必须带有 booking-service 生成的 `ex=askxuan-booking:<bookingId>:<clientMessageId>` 标记，并且该精确预约必须 `payment_status=success`、未取消且双方归属匹配；`afterSendSingleMsg` 按该预约将文字消息写入 `booking_chat_message`。客户端持有 IMToken 也不能绕过 REST 直接发送。

### 10.1 C 端接口（6 个，Bearer 鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/bookings` | create | `requestId`, `templeId`, `masterId`, `serviceId`, `slotCode`, `bookingDate`, `meritMoney`, `meritMoneyTier`, `note`(opt) | Bearer | 📱 📲 | 服务端计价、占位、模拟支付 |
| GET | `/api/v1/bookings/availability` | availability | `templeId`, `serviceId`, `date` | 公开 | 📱 📲 | 权威价格与剩余时段 |
| POST | `/api/v1/bookings/:id/pay` | pay | — | Bearer | 📱 📲 | 幂等支付重试 |
| GET | `/api/v1/bookings` | list | `status`(opt), `templeId`(opt), `page`, `size` | Bearer | 📱 📲 | JWT用户预约列表 |
| GET | `/api/v1/bookings/:id` | detail | — | Bearer | 📱 📲 | 预约详情 |
| PUT | `/api/v1/bookings/:id/status` | updateStatus | `status=cancelled` | Bearer | 📱 | 取消自己的预约 |
| POST | `/api/v1/bookings/:id/review` | createReview | `rating`, `content`, `images`(opt) | Bearer | — | 创建评价 |
| GET | `/api/v1/bookings/:id/review` | reviewDetail | — | Bearer | — | 评价详情 |
| GET | `/api/v1/bookings/chats` | chatList | `page`, `size` | Bearer | 📱 法师端 | 已支付预约会话列表 |
| GET | `/api/v1/bookings/:id/chat/messages` | chatMessageList | `page`, `size` | Bearer | 📱 法师端 | 预约文字消息历史 |
| POST | `/api/v1/bookings/:id/chat/messages` | chatMessageSend | `clientMessageId`, `content` | Bearer | 📱 法师端 | 权限校验、持久化和 OpenIM 投递 |
| POST | `/openim/booking-chat-webhook` | bookingChatWebhook | OpenIM callback payload | OpenIM 内网 | OpenIM | 发送前付费资格校验或发送后消息落库 |
| POST | `/openim/booking-chat-webhook/:command` | bookingChatWebhook | 同上 | OpenIM 内网 | OpenIM | 命令式兼容入口 |

### 10.2 寺院管理台接口（8 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/bookings` | adminBookingList | `templeId`, `status`(opt), `masterId`(opt), `page`, `size` | jwt:Auth | 🏛️ | 预约列表 |
| GET | `/api/v1/admin/bookings/:id` | adminBookingDetail | — | jwt:Auth | 🏛️ | 预约详情 |
| PUT | `/api/v1/admin/bookings/:id/confirm` | adminBookingConfirm | `remark`(opt) | jwt:Auth | 🏛️ | 确认预约 |
| PUT | `/api/v1/admin/bookings/:id/complete` | adminBookingComplete | `remark`(opt) | jwt:Auth | — | 完成预约 |
| PUT | `/api/v1/admin/bookings/:id/cancel` | adminBookingCancel | `remark`(opt) | jwt:Auth | 🏛️ | 取消预约 |
| PUT | `/api/v1/admin/bookings/:id/timeout-cancel` | adminBookingTimeoutCancel | `remark`(opt) | jwt:Auth | — | 超时取消 |
| GET | `/api/v1/admin/bookings/:id/status-log` | adminBookingStatusLog | — | jwt:Auth | 🏛️ | 状态流转日志 |
| PUT | `/api/v1/admin/bookings/:id/review/reply` | adminReviewReply | `masterReply` | jwt:Auth | 🏛️ | 法师回复评价 |

### 10.3 法师工作台接口（5 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/masters/bookings` | masterBookingList | `status`(opt), `page`, `size` | jwt:Auth | 🔪 | 法师视角预约列表 |
| GET | `/api/v1/admin/masters/bookings/:id` | masterBookingDetail | — | jwt:Auth | 🔪 | 预约详情（校验归属本法师） |
| PUT | `/api/v1/admin/masters/bookings/:id/confirm` | masterBookingConfirm | `remark`(opt) | jwt:Auth | 🔪 | 确认预约（pending → confirmed） |
| PUT | `/api/v1/admin/masters/bookings/:id/start` | masterBookingStart | `remark`(opt) | jwt:Auth | 🔪 | 开始服务（confirmed → in_progress） |
| PUT | `/api/v1/admin/masters/bookings/:id/complete` | masterBookingComplete | `remark`(opt) | jwt:Auth | 🔪 | 完成预约（in_progress → completed） |

> ✅ **闭环修复**：补齐法师端 detail/confirm/start/complete 端点，校验预约必须匹配当前 JWT 法师。

---

## 第十一章：product-service（端口 8086）

**路径前缀**：`/api/v1/products`（C 端）、`/api/v1/admin/products`（管理台）
**职责**：商品 CRUD、商品 SKU、商品分类树

### 11.1 C 端接口（3 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/products` | customerProductList | `categoryId`(opt), `keyword`(opt), `page`, `size` | 无 | 📱 | 商品列表 |
| GET | `/api/v1/products/:id` | customerProductDetail | — | 无 | 📱 | 商品详情 |
| GET | `/api/v1/products/categories` | customerCategoryTree | — | 无 | 📱 | 分类树 |

### 11.2 管理台接口（12 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/products` | adminProductList | `categoryId`(opt), `keyword`(opt), `status`(opt), `page`, `size` | jwt:Auth | 🛒 | 商品列表 |
| POST | `/api/v1/admin/products` | adminProductCreate | `name`, `categoryId`, `description`(opt), `mainImage`, `price`, `intentTags`(opt) | jwt:Auth | 🛒 | 创建商品 |
| GET | `/api/v1/admin/products/:id` | adminProductDetail | — | jwt:Auth | 🛒 | 商品详情 |
| PUT | `/api/v1/admin/products/:id` | adminProductUpdate | `name`, `categoryId`, `description`(opt), `mainImage`, `intentTags`(opt) | jwt:Auth | 🛒 | 更新商品 |
| DELETE | `/api/v1/admin/products/:id` | adminProductDelete | — | jwt:Auth | 🛒 | 删除商品 |
| PUT | `/api/v1/admin/products/:id/status` | adminProductStatus | `status` | jwt:Auth | 🛒 | 上下架 |
| POST | `/api/v1/admin/products/:id/skus` | adminSkuCreate | `specName`, `specValue`, `price`, `stock` | jwt:Auth | — | 新增 SKU |
| PUT | `/api/v1/admin/products/:id/skus/:skuId` | adminSkuUpdate | `specName`, `specValue`, `price` | jwt:Auth | — | 更新 SKU |
| GET | `/api/v1/admin/products/categories` | adminCategoryList | `parentId`(opt), `page`, `size` | jwt:Auth | 🛒 | 分类列表 |
| POST | `/api/v1/admin/products/categories` | adminCategoryCreate | `parentId`, `name`, `level`, `sort`(opt) | jwt:Auth | 🛒 | 新增分类 |
| PUT | `/api/v1/admin/products/categories/:id` | adminCategoryUpdate | `parentId`, `name`, `level`, `sort`(opt) | jwt:Auth | 🛒 | 更新分类 |
| DELETE | `/api/v1/admin/products/categories/:id` | adminCategoryDelete | — | jwt:Auth | 🛒 | 删除分类 |

---

## 第十二章：diy-service（端口 8088）

**路径前缀**：`/api/v1/diy`（C 端）、`/api/v1/admin/diy`（管理台）
**职责**：DIY 设计、材料库、DIY 订单、加持服务

### 12.1 C 端接口（9 个，设计与材料读取无需鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/diy/designs` | designList | `page`, `size` | 无 | 📱 | 设计列表 |
| POST | `/api/v1/diy/designs` | designSave | `userId`, `name`, `designData`(v1/v2 JSON 字符串), `totalPrice`(展示预估), `status`, `blessServiceCode`(opt) | Bearer | 📱 | 保存设计，响应 `{id}`；不锁库存 |
| GET | `/api/v1/diy/designs/:id` | designDetail | — | 无 | 📱 | 设计详情 |
| POST | `/api/v1/diy/designs/:id/order` | diyDesignOrderCreate | `userId`, `blessServiceCode`(opt), `addressId` | Bearer | 📱 | 服务端重定价，返回最终金额、材料明细、设计与计价快照 |
| GET | `/api/v1/diy/materials` | materialList | `category`(opt), `page`, `size` | 无 | 📱 | 材料库列表 |
| GET | `/api/v1/diy/blessing-services` | blessingServiceList | `page`, `size` | 无 | 📱 | 可选加持服务列表 |
| POST | `/api/v1/diy/orders` | diyOrderCreate | `userId`, `designId`, `items`, `blessServiceCode`(opt), `addressId` | Bearer | 📱 | 创建 DIY 订单 |
| GET | `/api/v1/diy/orders` | diyOrderList | `userId`, `status`(opt), `page`, `size` | Bearer | 📱 | DIY 订单列表 |
| GET | `/api/v1/diy/orders/:id` | diyOrderDetail | — | Bearer | 📱 | DIY 订单详情 |

设计文档 v2 的字段和计价信任边界见第一章 1.7：有序 `beads[]` 用于精确恢复编辑状态，聚合 `items[]` 保持设计广场下单兼容；最终价格始终以服务端下单事务的重新查询结果为准。

### 12.2 管理台接口（13 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/diy/orders` | adminDiyOrderList | `status`(opt), `page`, `size` | jwt:Auth | 🛒 | DIY 订单列表 |
| GET | `/api/v1/admin/diy/orders/:id` | adminDiyOrderDetail | — | jwt:Auth | 🛒 | DIY 订单详情 |
| PUT | `/api/v1/admin/diy/orders/:id/review` | adminDiyOrderReview | `action`, `reason`(opt) | jwt:Auth | 🛒 | 审核订单 |
| PUT | `/api/v1/admin/diy/orders/:id/make-complete` | adminDiyOrderMakeComplete | — | jwt:Auth | 🛒 | 制作完成 |
| PUT | `/api/v1/admin/diy/orders/:id/ship` | adminDiyOrderShip | `expressCompany`, `trackingNo` | jwt:Auth | 🛒 | 发货 |
| GET | `/api/v1/admin/diy/materials` | adminMaterialList | `category`(opt), `keyword`(opt), `page`, `size` | jwt:Auth | 🛒 | 材料列表 |
| POST | `/api/v1/admin/diy/materials` | adminMaterialCreate | `name`, `spec`, `unitPrice`, `unit`, `category` | jwt:Auth | 🛒 | 新增材料 |
| PUT | `/api/v1/admin/diy/materials/:id` | adminMaterialUpdate | `name`, `spec`, `unitPrice`, `unit` | jwt:Auth | 🛒 | 更新材料 |
| PUT | `/api/v1/admin/diy/materials/:id/status` | adminMaterialStatus | `status` | jwt:Auth | 🛒 | 材料上下架 |
| GET | `/api/v1/admin/diy/blessing-services` | adminBlessingServiceList | `page`, `size` | jwt:Auth | 🛒 | 加持服务列表 |
| POST | `/api/v1/admin/diy/blessing-services` | adminBlessingServiceCreate | `serviceName`, `templeCode`, `masterCode`, `price`, `description`(opt) | jwt:Auth | 🛒 | 新增服务 |
| PUT | `/api/v1/admin/diy/blessing-services/:id` | adminBlessingServiceUpdate | `serviceName`, `templeCode`, `masterCode`, `price` | jwt:Auth | 🛒 | 更新服务 |
| DELETE | `/api/v1/admin/diy/blessing-services/:id` | adminBlessingServiceDelete | — | jwt:Auth | 🛒 | 删除服务 |

---

## 第十三章：order-service（端口 8089）

**路径前缀**：`/api/v1/orders`（C 端）、`/api/v1/admin/orders`（管理台）
**职责**：商城订单创建、发货、确认收货、退换货

### 13.1 C 端接口（5 个，Bearer 鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/orders` | orderCreate | `userId`, `addressId`, `note`(opt), `items` | Bearer | — | 创建订单 |
| GET | `/api/v1/orders` | orderList | `userId`, `status`(opt), `page`, `size` | Bearer | — | 订单列表 |
| GET | `/api/v1/orders/:id` | orderDetail | — | Bearer | — | 订单详情 |
| PUT | `/api/v1/orders/:id/confirm` | orderConfirm | — | Bearer | — | 确认收货 |
| POST | `/api/v1/orders/:id/return` | orderReturn | `type`, `reason` | Bearer | — | 申请退换货 |

### 13.2 管理台接口（6 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/orders` | adminOrderList | `status`(opt), `page`, `size` | jwt:Auth | 🛒 | 订单列表 |
| GET | `/api/v1/admin/orders/:id` | adminOrderDetail | — | jwt:Auth | 🛒 | 订单详情 |
| PUT | `/api/v1/admin/orders/:id/ship` | adminOrderShip | `expressCompany`, `trackingNo` | jwt:Auth | 🛒 | 发货 |
| GET | `/api/v1/admin/orders/returns` | adminReturnList | `status`(opt), `page`, `size` | jwt:Auth | 🛒 | 退货列表 |
| PUT | `/api/v1/admin/orders/returns/:id/review` | adminReturnReview | `action`, `reason`(opt) | jwt:Auth | 🛒 | 退货审核 |
| PUT | `/api/v1/admin/orders/returns/:id/refund` | adminReturnRefund | `amount` | jwt:Auth | 🛒 | 退款 |

---

## 第十四章：payment-service（端口 8090）

**路径前缀**：`/api/v1/payments`（C 端 + 回调 + 内部）
**职责**：发起支付、查询支付状态、第三方回调、内部退款

### 14.1 C 端接口（5 个）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/payments` | paymentCreate | `orderType`, `orderNo`, `amount`, `channel`, `userId` | Bearer | — | 发起支付 |
| GET | `/api/v1/payments/:id` | paymentQuery | — | Bearer | — | 查询支付状态 |
| POST | `/api/v1/payments/callback/wechat` | callbackWechat | 第三方回调体 | 无 | — | 微信回调 |
| POST | `/api/v1/payments/callback/alipay` | callbackAlipay | 第三方回调体 | 无 | — | 支付宝回调 |
| POST | `/api/v1/payments/refund` | refund | `paymentNo`, `amount`, `reason` | jwt:Auth | — | 内部退款（服务间调用） |

---

## 第十五章：review-service（端口 8092）

**路径前缀**：`/api/v1/reviews`（C 端）、`/api/v1/admin/reviews`（寺院/平台台）、`/api/v1/admin/platform/reviews`（平台台）、`/api/v1/admin/masters/reviews`（法师端）
**职责**：评价提交、评价回复、评价举报

### 15.1 C 端接口（3 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/reviews` | createReview | `userId`, `targetType`, `targetId`, `rating`, `content` | Bearer | — | 提交评价 |
| GET | `/api/v1/reviews` | reviewList | `targetType`(opt), `targetId`(opt), `userId`(opt), `rating`(opt), `page` | 无 | — | 评价列表 |
| GET | `/api/v1/reviews/:id` | reviewDetail | — | 无 | — | 评价详情 |

### 15.2 管理台接口（4 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/reviews` | adminReviewList | `targetType`(opt), `targetId`(opt), `status`(opt), `rating`(opt), `page` | ⚠️ 无 | 🏛️ 🌐 | 管理台评价列表 |
| GET | `/api/v1/admin/reviews/:id` | adminReviewDetail | — | ⚠️ 无 | 🏛️ 🌐 | 评价详情 |
| POST | `/api/v1/admin/reviews/:id/reply` | reviewReply | `replierType`, `replierId`, `content` | ⚠️ 无 | 🏛️ 🌐 | 回复评价 |
| POST | `/api/v1/admin/reviews/:id/report` | reviewReport | `reporterId`, `reason` | ⚠️ 无 | — | 举报评价 |

### 15.3 平台管理台接口（2 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/platform/reviews/reports` | reportList | `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 举报列表 |
| PUT | `/api/v1/admin/platform/reviews/reports/:id/handle` | reportHandle | `handleResult`, `remark`(opt) | ⚠️ 无 | 🌐 | 处理举报 |

### 15.4 法师端接口（1 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/masters/reviews` | masterReviewList | `rating`(opt), `page`, `size` | jwt:Auth | 🔪 | 当前法师评价列表，法师身份从 JWT 获取 |

---

## 第十六章：finance-service（端口 8091）

**路径前缀**：`/api/v1/admin/finance`（管理台）
**职责**：法师提现、财务总览、结算单、抽成配置、财务报表

### 16.1 法师提现接口（1 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/api/v1/admin/finance/withdrawals/apply` | withdrawalApply | `amount`, `bankCard` | jwt:Auth | 🔪 | 法师提现申请 |

### 16.2 财务管理接口（10 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/finance/overview` | overview | `startTime`(opt), `endTime`(opt) | ⚠️ 无 | 🌐 | 收入总览 |
| GET | `/api/v1/admin/finance/settlements` | settlementList | `settleType`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 结算单列表 |
| GET | `/api/v1/admin/finance/settlements/:id` | settlementDetail | — | ⚠️ 无 | 🌐 | 结算单详情 |
| POST | `/api/v1/admin/finance/settlements/confirm/:id` | settlementConfirm | — | ⚠️ 无 | 🌐 | 确认结算单 |
| GET | `/api/v1/admin/finance/withdrawals` | withdrawalList | `applicantType`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 提现列表 |
| PUT | `/api/v1/admin/finance/withdrawals/:id/audit` | withdrawalAudit | `action`, `remark`(opt) | ⚠️ 无 | 🌐 | 提现审核 |
| PUT | `/api/v1/admin/finance/withdrawals/:id/process` | withdrawalProcess | — | ⚠️ 无 | 🌐 | 提现打款 |
| GET | `/api/v1/admin/finance/commission-config` | commissionConfigList | `bizType`(opt) | ⚠️ 无 | 🌐 | 抽成配置列表 |
| PUT | `/api/v1/admin/finance/commission-config/:id` | commissionConfigUpdate | `rate`, `description`(opt) | ⚠️ 无 | 🌐 | 更新抽成配置 |
| GET | `/api/v1/admin/finance/reports` | reports | `startTime`, `endTime`, `type`(opt), `page`, `size` | ✓ | 🌐 | 财务报表 |

---

## 第十七章：audit-service（端口 8093）

**路径前缀**：`/api/v1/admin/audit`（管理台）
**职责**：审核队列、举报处理、敏感词管理、审核统计

### 17.1 管理台接口（10 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/audit/queue` | auditQueueList | `bizType`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 审核队列列表 |
| GET | `/api/v1/admin/audit/queue/:id` | auditQueueDetail | — | ⚠️ 无 | 🌐 | 审核详情 |
| PUT | `/api/v1/admin/audit/queue/:id/approve` | auditApprove | `auditorId`, `remark`(opt) | ⚠️ 无 | 🌐 | 审核通过 |
| PUT | `/api/v1/admin/audit/queue/:id/reject` | auditReject | `auditorId`, `remark` | ⚠️ 无 | 🌐 | 审核驳回 |
| GET | `/api/v1/admin/audit/reports` | reportList | `targetType`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 举报列表 |
| PUT | `/api/v1/admin/audit/reports/:id/handle` | reportHandle | `handlerId`, `handleResult`, `remark`(opt) | ⚠️ 无 | 🌐 | 处理举报 |
| GET | `/api/v1/admin/audit/sensitive-words` | sensitiveWordList | `category`(opt), `status`(opt), `keyword`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 敏感词列表 |
| POST | `/api/v1/admin/audit/sensitive-words` | sensitiveWordCreate | `word`, `category` | ⚠️ 无 | 🌐 | 新增敏感词 |
| DELETE | `/api/v1/admin/audit/sensitive-words/:id` | sensitiveWordDelete | — | ⚠️ 无 | 🌐 | 删除敏感词 |
| GET | `/api/v1/admin/audit/statistics` | statistics | `bizType`(opt) | ⚠️ 无 | 🌐 | 审核统计 |

---

## 第十八章：message-service（端口 8094）

**路径前缀**：`/api/v1/messages`（C 端）、`/api/v1/announcements`（C 端）、`/api/v1/admin/messages`（管理台）、`/api/v1/admin/announcements`（管理台）
**职责**：站内消息、未读数、设备 token、公告、消息模板、推送

### 18.1 C 端接口 - 消息（2 个，Bearer）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/messages/list` | list | `userId`, `isRead`(opt), `page`, `size` | Bearer | 📱 | 站内消息列表 |
| PUT | `/api/v1/messages/:id/read` | read | — | Bearer | 📱 | 标记已读 |

### 18.2 C 端接口 - 消息扩展（6 个，Bearer）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/messages/unread-count` | unreadCount | `userId` | Bearer | 📱 | 未读数（**复数**） |
| PUT | `/api/v1/messages/read-all` | readAll | `userId` | Bearer | 📱 | 全部已读 |
| POST | `/api/v1/messages/send` | sendMessage | `conversationId`, `userId`, `content` | Bearer | 兼容 | 已废弃，固定返回 `40909`；改用 `/api/v1/bookings/:id/chat/messages` |
| POST | `/api/v1/messages/device-token` | registerDeviceToken | `userId`, `clientType`, `platform`, `deviceToken`, `bundleId`(opt) | Bearer | 📱 🔪 | 注册 APNs token |
| DELETE | `/api/v1/messages/device-token` | unbindDeviceToken | `userId`, `deviceToken` | Bearer | — | 解绑设备 token |
| DELETE | `/api/v1/messages/:id` | deleteMessage | — | Bearer | 📱 | 删除消息 |

### 18.3 C 端接口 - 公告（1 个，无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/announcements/list` | announcementList | `type`(opt), `targetAudience`(opt), `page`, `size` | 无 | 📱 | 公告列表 |

### 18.4 管理台接口 - 消息管理（5 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/messages/templates` | adminTemplateList | `type`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 消息模板列表 |
| POST | `/api/v1/admin/messages/templates` | adminTemplateCreate | `code`, `titleTemplate`, `contentTemplate`, `variables`(opt), `type` | ⚠️ 无 | 🌐 | 创建模板 |
| PUT | `/api/v1/admin/messages/templates/:id` | adminTemplateUpdate | `titleTemplate`(opt), `contentTemplate`(opt), `variables`(opt) | ⚠️ 无 | 🌐 | 更新模板 |
| POST | `/api/v1/admin/messages/push` | adminPush | `userId`, `pushType`, `title`, `content`, `bizType`(opt) | ⚠️ 无 | 🌐 | 推送消息 |
| GET | `/api/v1/admin/messages/push-logs` | adminPushLogList | `userId`(opt), `status`(opt), `bizType`(opt), `page`, `size` | ⚠️ 无 | — | 推送日志 |

### 18.5 管理台接口 - 公告管理（3 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/announcements/list` | adminAnnouncementList | `type`(opt), `targetAudience`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 公告列表 |
| POST | `/api/v1/admin/announcements/create` | adminAnnouncementCreate | `title`, `content`, `type`, `targetAudience` | ⚠️ 无 | 🌐 | 创建公告 |
| PUT | `/api/v1/admin/announcements/:id/status` | adminAnnouncementStatus | `status` | ⚠️ 无 | 🌐 | 公告上下线 |

### 18.6 管理台接口 - 法师消息（2 个，jwt:Auth）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/messages/master` | masterMessageList | `isRead`(opt), `page`, `size` | jwt:Auth | 🔪 | 法师消息列表 |
| PUT | `/api/v1/admin/messages/master/:id/read` | masterMessageRead | — | jwt:Auth | 🔪 | 法师消息已读 |

### 18.7 OpenIM 回调（2 个，显式注册）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| POST | `/openim/webhook` | openIMWebhook | 历史回调体 | 网关白名单 | 兼容 | 已废弃的成功空操作，不再写入咨询通知 |
| POST | `/openim/webhook/:command` | openIMWebhook | 同上 | 网关白名单 | 兼容 | 已废弃的命令式空操作；预约聊天回调由 booking-service 内网处理 |

两条回调不在 `message.api` 中，由 message-service 直接注册；生产部署必须限制来源网络，并在 OpenIM 侧配置回调地址。

---

## 第十九章：logistics-service（端口 8095）

**路径前缀**：`/api/v1/admin/logistics`（管理台）
**职责**：快递公司、运费模板、物流轨迹

### 19.1 管理台接口（8 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/logistics/express` | expressList | `code`(opt), `name`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🛒 | 快递公司列表 |
| POST | `/api/v1/admin/logistics/express` | expressCreate | `code`, `name`, `logoUrl`(opt), `customerService`(opt), `sort` | ⚠️ 无 | 🛒 | 新增快递 |
| PUT | `/api/v1/admin/logistics/express/:id` | expressUpdate | `name`(opt), `logoUrl`(opt), `customerService`(opt), `sort`(opt) | ⚠️ 无 | 🛒 | 更新快递 |
| GET | `/api/v1/admin/logistics/freight-templates` | freightTemplateList | `name`(opt), `type`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | 🛒 | 运费模板列表 |
| POST | `/api/v1/admin/logistics/freight-templates` | freightTemplateCreate | `name`, `type`, `freeShipping`, `config` | ⚠️ 无 | 🛒 | 新增模板 |
| PUT | `/api/v1/admin/logistics/freight-templates/:id` | freightTemplateUpdate | `name`(opt), `type`(opt), `freeShipping`(opt), `config`(opt) | ⚠️ 无 | 🛒 | 更新模板 |
| GET | `/api/v1/admin/logistics/tracks/:trackingNo` | trackQuery | — | ⚠️ 无 | 🛒 | 物流轨迹查询 |
| POST | `/api/v1/admin/logistics/tracks/batch-sync` | tracksBatchSync | `trackingNos`(opt) | ⚠️ 无 | 🛒 | 批量同步轨迹 |

---

## 第二十章：marketing-service（端口 8096）

**路径前缀**：`/api/v1/marketing`（C 端）、`/api/v1/admin/marketing`（管理台）
**职责**：Banner、推荐位、活动、优惠券

### 20.1 C 端接口（6 个，均无鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/marketing/banners` | customerBannerList | `status`(opt), `page`, `size` | 无 | — | Banner 列表 |
| GET | `/api/v1/marketing/recommends` | customerRecommendList | `type`(opt), `status`(opt), `page`, `size` | 无 | — | 推荐位 |
| GET | `/api/v1/marketing/activities` | customerActivityList | `status`(opt), `type`(opt), `page`, `size` | 无 | — | 活动列表 |
| GET | `/api/v1/marketing/coupons` | customerCouponList | `status`(opt), `type`(opt), `page`, `size` | 无 | — | 优惠券列表 |
| POST | `/api/v1/marketing/coupons/:id/receive` | customerCouponReceive | `userId` | Bearer | — | 领取优惠券 |
| GET | `/api/v1/marketing/my-coupons` | customerMyCoupon | `userId`, `status`(opt), `page`, `size` | Bearer | — | 我的优惠券 |

### 20.2 管理台接口（11 个，⚠️ .api 未声明 jwt）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/marketing/banners` | adminBannerList | `status`(opt), `page`, `size` | ⚠️ 无 | 🌐 | Banner 列表 |
| POST | `/api/v1/admin/marketing/banners` | adminBannerCreate | `title`, `imageUrl`, `linkType`, `linkValue`, `sort`(opt) | ⚠️ 无 | 🌐 | 创建 Banner |
| PUT | `/api/v1/admin/marketing/banners/:id` | adminBannerUpdate | `title`(opt), `imageUrl`(opt), `linkType`(opt), `linkValue`(opt) | ⚠️ 无 | 🌐 | 更新 Banner |
| GET | `/api/v1/admin/marketing/activities` | adminActivityList | `status`(opt), `type`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 活动列表 |
| POST | `/api/v1/admin/marketing/activities` | adminActivityCreate | `name`, `type`, `startTime`, `endTime`, `config`(opt) | ⚠️ 无 | 🌐 | 创建活动 |
| PUT | `/api/v1/admin/marketing/activities/:id` | adminActivityUpdate | `name`(opt), `type`(opt), `startTime`(opt), `endTime`(opt) | ⚠️ 无 | 🌐 | 更新活动 |
| GET | `/api/v1/admin/marketing/coupons` | adminCouponList | `status`(opt), `type`(opt), `page`, `size` | ⚠️ 无 | 🌐 | 优惠券列表 |
| POST | `/api/v1/admin/marketing/coupons` | adminCouponCreate | `name`, `type`, `value`, `minAmount`(opt), `categoryId`(opt) | ⚠️ 无 | 🌐 | 创建优惠券 |
| PUT | `/api/v1/admin/marketing/coupons/:id` | adminCouponUpdate | `name`(opt), `type`(opt), `value`(opt), `minAmount`(opt) | ⚠️ 无 | 🌐 | 更新优惠券 |
| GET | `/api/v1/admin/marketing/recommends` | adminRecommendList | `type`(opt), `status`(opt), `page`, `size` | ⚠️ 无 | — | 推荐位列表 |
| PUT | `/api/v1/admin/marketing/recommends/:id` | adminRecommendUpdate | `type`(opt), `targetId`(opt), `sort`(opt), `status`(opt) | ⚠️ 无 | — | 更新推荐位 |

---

## 第二十一章：file-service（端口 8097）

**路径前缀**：`/api/v1/files`（C 端）、`/api/v1/admin/files`（平台管理台）
**职责**：文件上传、预签名 URL、数据库备份创建/下载/恢复

### 21.1 C 端接口（2 个，Bearer 鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/files/presigned` | presigned | `fileName`, `objectType`(opt), `operate`(opt), `objectName`(opt) | Bearer | 📱 | 预签名 URL |
| POST | `/api/v1/files/upload` | upload | multipart form | Bearer | 📱 | 直接上传 |

### 21.2 平台备份接口（4 个，由网关限制 platform_super）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/admin/files/backups` | backupList | — | 网关角色校验 | 🌐 | 备份列表 |
| POST | `/api/v1/admin/files/backups` | backupCreate | — | 网关角色校验 | 🌐 | 创建手动全量备份 |
| GET | `/api/v1/admin/files/backups/:filename/download` | backupDownload | — | 网关角色校验 | 🌐 | 获取限时下载地址 |
| POST | `/api/v1/admin/files/backups/:filename/restore` | backupRestore | `confirm` | 网关角色校验 | 🌐 | 恢复指定备份 |

---

## 第二十二章：ai-service（端口 8098）

**路径前缀**：`/api/v1/ai`（C 端）
**职责**：AI 技能、会话管理、消息发送

### 22.1 C 端接口（8 个，其中技能列表无需鉴权）

| 方法 | 路径 | Handler | 请求字段 | 鉴权 | 客户端调用 | 说明 |
|------|------|---------|---------|------|-----------|------|
| GET | `/api/v1/ai/skills` | skillList | `status`(opt) | 无 | 📱 | AI 入口列表（general + 7 个兼容技能） |
| POST | `/api/v1/ai/sessions` | sessionCreate | `userId`, `skillCode`(opt), `question`(opt) | Bearer | 📱 | 创建会话，默认 general |
| GET | `/api/v1/ai/sessions` | sessionList | `userId`, `status`(opt), `page`, `size` | Bearer | 📱 | 会话列表 |
| GET | `/api/v1/ai/sessions/:id` | sessionDetail | — | Bearer | 📱 | 会话详情 |
| GET | `/api/v1/ai/sessions/:id/messages` | messageList | `userId`, `page`, `size` | Bearer | 📱 | 会话消息列表 |
| POST | `/api/v1/ai/sessions/:id/messages` | messageSend | `userId`, `content` | Bearer | 📱 | 发送消息 |
| POST | `/api/v1/ai/sessions/:id/messages/:messageId/retry` | messageRetry | `userId` | Bearer | 📱 | 重试失败的助手消息 |
| DELETE | `/api/v1/ai/sessions/:id` | sessionDelete | — | Bearer | 📱 | 删除会话 |

---

## 第二十三章：media-service（端口 8100）

**路径前缀**：`/api/v1/media`、`/api/v1/live`
**职责**：媒体凭证上传、对象完成校验、转码/审核回调、直播房间和 OpenIM 群聊绑定。接口明细见 1.13。

本地开发使用 MinIO Provider；服务端内部对象校验地址与客户端预签名地址分离配置。直播 Provider 未配置时能力接口明确返回关闭状态，开播接口失败且不产生推流会话。

---

## 第二十四章：community-service（端口 8099）

**路径前缀**：`/api/v1/community`、`/api/v1/admin/masters/community`、`/api/v1/admin/platform/community`
**职责**：大师图文/视频内容、媒体引用、幂等点赞、关注、评论先审后显，以及与 Audit Service 同事务的帖子/评论审核。接口明细见 1.14、2.7 和 2.8。

---

## 下篇总结：后端服务接口统计

| 序号 | 服务名 | 端口 | C 端 | 管理台 | 总计 | 鉴权情况 |
|------|--------|------|-----|-------|------|---------|
| 6 | auth-service | 8081 | 4 | 8 | 12 | ✅ 管理台 jwt |
| 7 | user-service | 8082 | 7 | 3 | 10 | ✅ 管理台 jwt |
| 8 | temple-service | 8083 | 5 | 19 | 24 | ✅ 管理台 jwt |
| 9 | master-service | 8084 | 2 | 20 | 22 | ✅ 管理台 jwt |
| 10 | booking-service | 8085 | 11 | 13 | 24 | ✅ 运行时统一 JWT 中间件；聊天校验支付与归属 |
| 11 | product-service | 8086 | 4 | 12 | 16 | ✅ 管理台 jwt |
| 12 | diy-service | 8088 | 9 | 13 | 22 | ✅ 管理台 jwt |
| 13 | order-service | 8089 | 5 | 6 | 11 | ✅ 管理台 jwt |
| 14 | payment-service | 8090 | 5 | 0 | 5 | ✅ refund jwt |
| 15 | review-service | 8092 | 3 | 7 | 10 | ⚠️ 通用管理接口未声明 jwt；法师接口有 jwt |
| 16 | finance-service | 8091 | 0 | 11 | 11 | ⚠️ 管理台未声明 jwt |
| 17 | audit-service | 8093 | 0 | 10 | 10 | ⚠️ 管理台未声明 jwt |
| 18 | message-service | 8094 | 9 | 10 | 19 | ⚠️ 部分管理台未声明 jwt |
| 19 | logistics-service | 8095 | 0 | 8 | 8 | ⚠️ 管理台未声明 jwt |
| 20 | marketing-service | 8096 | 6 | 11 | 17 | ⚠️ 管理台未声明 jwt |
| 21 | file-service | 8097 | 2 | 4 | 6 | ✅ 网关限制平台超管 |
| 22 | ai-service | 8098 | 8 | 0 | 8 | ✅ 会话所有权校验 |
| 23 | media-service | 8100 | 3 | 7 | 12 | ✅ 所有权/角色/回调令牌 |
| 24 | community-service | 8099 | 8 | 10 | 18 | ✅ 所有权/角色/审核事务 |
| **`.api` 合计** | — | — | **91** | **172** | **265** | — |

> media-service 的总计另含 2 个 Provider 回调，因此 265 比 C 端与管理台两列之和多 2。另有 14 条由服务直接注册、未写入 `.api` 的路由：finance-service 商城报表 1 条、message-service 通用 OpenIM 回调 2 条、booking-service OpenIM 强制权限回调 2 条，以及信仰/心愿动态主数据 9 条；完整唯一运行时 HTTP 契约为 279 条。执行 `node scripts/audit-api-reference.mjs` 可复核源码与本文档。

> ⚠️ **鉴权缺口**：review / finance / audit / message(部分) / logistics / marketing 共 6 个服务的管理台接口在 .api 文件中未声明 `jwt: Auth`，完全依赖网关鉴权。绕过网关直连服务端口即可无鉴权访问。

---

## 附录 A：客户端接口覆盖矩阵

| 接口模块 | ios-customer | mobile-customer | ios-master | web-temple | web-shop | web-platform |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| auth | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| user | ✓ | ✗ | ✗ | ✗ | ✗ | ✓（admin） |
| temple | ✓ | ✓ | ✗ | ✓（admin） | ✗ | ✓（platform） |
| master | ✓ | ✓ | ✓（profile） | ✓（temple-scoped） | ✗ | ✓（platform） |
| booking | ✓ | ✗✗（路径错） | ✓（master） | ✓（admin） | ✗ | ✗ |
| blessing | ✗ | ✗ | ✓（accept/complete） | ✓（assign） | ✗ | ✗ |
| service | ✗ | ✓ | ✗ | ✓（CRUD） | ✓（blessing-services） | ✗ |
| review | ✗ | ✗ | ✓（master） | ✓（list/reply） | ✗ | ✓（list/reply/reports） |
| audit | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| finance | ✗ | ✗ | ✓（withdrawal） | ✗ | ✓（shop reports） | ✓（overview/settlements） |
| schedule | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| earnings | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| message | ✓ | ✗ | ✓（master） | ✗ | ✗ | ✓（templates/push） |
| announcement | ✓ | ✗ | ✗ | ✗ | ✗ | ✓（CRUD） |
| diy | ✓ | ✗ | ✗ | ✗ | ✓（materials/orders） | ✗ |
| product | ✓ | ✗ | ✗ | ✗ | ✓（CRUD） | ✗ |
| order | ✗ | ✗ | ✗ | ✗ | ✓（list/ship/returns） | ✗ |
| logistics | ✗ | ✗ | ✗ | ✗ | ✓（express/freight） | ✓（list，预留） |
| marketing | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| ai | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payment | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| file | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 附录 B：网关路由表（50 条 Prefix）

### C 端与透传路由（25 条）

| 前缀 | 目标服务 | 端口 |
|------|---------|------|
| `/api/v1/auth` | auth-service | 8081 |
| `/api/v1/users` | user-service | 8082 |
| `/api/v1/temples` | temple-service | 8083 |
| `/api/v1/beliefs` | temple-service | 8083 |
| `/api/v1/masters` | master-service | 8084 |
| `/api/v1/bookings` | booking-service | 8085 |
| `/api/v1/products` | product-service | 8086 |
| `/api/v1/intentions` | product-service | 8086 |
| `/api/v1/diy` | diy-service | 8088 |
| `/api/v1/orders` | order-service | 8089 |
| `/api/v1/payments` | payment-service | 8090 |
| `/api/v1/reviews` | review-service | 8092 |
| `/api/v1/audit` | audit-service | 8093 |
| `/api/v1/finance` | finance-service | 8091 |
| `/api/v1/marketing` | marketing-service | 8096 |
| `/api/v1/messages` | message-service | 8094 |
| `/api/v1/announcements` | message-service | 8094 |
| `/api/v1/files` | file-service | 8097 |
| `/api/v1/ai` | ai-service | 8098 |
| `/api/v1/community` | community-service | 8099 |
| `/api/v1/media` | media-service | 8100 |
| `/api/v1/live` | media-service | 8100 |
| `/api/v1/logistics` | logistics-service | 8095 |
| `/api/v1/im` | OpenIM | 10002 |
| `/openim` | message-service | 8094 |

### 管理台路由（26 条，最长前缀匹配）

| 前缀 | 目标服务 | 端口 |
|------|---------|------|
| `/api/v1/admin/files` | file-service | 8097 |
| `/api/v1/admin/platform/beliefs` | temple-service | 8083 |
| `/api/v1/admin/platform/intentions` | product-service | 8086 |
| `/api/v1/admin/auth` | auth-service | 8081 |
| `/api/v1/admin/users` | user-service | 8082 |
| `/api/v1/admin/temples/masters` | master-service | 8084 |
| `/api/v1/admin/temples` | temple-service | 8083 |
| `/api/v1/admin/platform/temples` | temple-service | 8083 |
| `/api/v1/admin/masters/bookings` | booking-service | 8085 |
| `/api/v1/admin/masters/community` | community-service | 8099 |
| `/api/v1/admin/masters` | master-service | 8084 |
| `/api/v1/admin/platform/masters` | master-service | 8084 |
| `/api/v1/admin/platform/community` | community-service | 8099 |
| `/api/v1/admin/bookings` | booking-service | 8085 |
| `/api/v1/admin/messages` | message-service | 8094 |
| `/api/v1/admin/announcements` | message-service | 8094 |
| `/api/v1/admin/products` | product-service | 8086 |
| `/api/v1/admin/diy` | diy-service | 8088 |
| `/api/v1/admin/orders` | order-service | 8089 |
| `/api/v1/admin/finance` | finance-service | 8091 |
| `/api/v1/admin/platform/reviews` | review-service | 8092 |
| `/api/v1/admin/reviews` | review-service | 8092 |
| `/api/v1/admin/masters/reviews` | review-service | 8092 |
| `/api/v1/admin/audit` | audit-service | 8093 |
| `/api/v1/admin/logistics` | logistics-service | 8095 |
| `/api/v1/admin/marketing` | marketing-service | 8096 |

---

## 附录 C：后端服务端口表

| 端口 | 服务 | 路径 |
|------|------|------|
| 8080 | gateway | services/platform/gateway-service |
| 8081 | auth | services/platform/auth-service |
| 8082 | user | services/platform/user-service |
| 8083 | temple | services/content/temple-service |
| 8084 | master | services/content/master-service |
| 8085 | booking | services/content/booking-service |
| 8086 | product | services/commerce/product-service |
| 8087 | —（空缺） | — |
| 8088 | diy | services/commerce/diy-service |
| 8089 | order | services/commerce/order-service |
| 8090 | payment | services/commerce/payment-service |
| 8091 | finance | services/operation/finance-service |
| 8092 | review | services/content/review-service |
| 8093 | audit | services/operation/audit-service |
| 8094 | message | services/infrastructure/message-service |
| 8095 | logistics | services/operation/logistics-service |
| 8096 | marketing | services/operation/marketing-service |
| 8097 | file | services/infrastructure/file-service |
| 8098 | ai | services/infrastructure/ai-service |
| 8099 | community | services/content/community-service |
| 8100 | media | services/infrastructure/media-service |
| 10002 | OpenIM | 外部依赖 |

---

## 附录 D：接口统计

| 序号 | 服务名 | 端口 | C 端 | 管理台 | 总计 |
|------|--------|------|-----|-------|------|
| 1 | auth-service | 8081 | 4 | 8 | 12 |
| 2 | user-service | 8082 | 7 | 3 | 10 |
| 3 | temple-service | 8083 | 5 | 19 | 24 |
| 4 | master-service | 8084 | 2 | 20 | 22 |
| 5 | booking-service | 8085 | 11 | 13 | 24 |
| 6 | product-service | 8086 | 4 | 12 | 16 |
| 7 | diy-service | 8088 | 9 | 13 | 22 |
| 8 | order-service | 8089 | 5 | 6 | 11 |
| 9 | payment-service | 8090 | 5 | 0 | 5 |
| 10 | finance-service | 8091 | 0 | 11 | 11 |
| 11 | review-service | 8092 | 3 | 7 | 10 |
| 12 | audit-service | 8093 | 0 | 10 | 10 |
| 13 | message-service | 8094 | 9 | 10 | 19 |
| 14 | logistics-service | 8095 | 0 | 8 | 8 |
| 15 | marketing-service | 8096 | 6 | 11 | 17 |
| 16 | file-service | 8097 | 2 | 4 | 6 |
| 17 | ai-service | 8098 | 8 | 0 | 8 |
| 18 | media-service | 8100 | 3 | 7 | 12 |
| 19 | community-service | 8099 | 8 | 10 | 18 |
| **`.api` 合计** | — | — | **91** | **172** | **265** |

---

**文档完成。本接口文档基于 2026-08-12 项目代码状态整理，覆盖 5 个正式客户端、备用 mobile-customer、Provider 回调与显式注册路由涉及的 279 个唯一运行时 HTTP 契约。**
