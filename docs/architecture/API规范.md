# 问玄东方 - API 设计规范

> **文档版本**: v1.0
> **创建日期**: 2026-07-01
> **关联文档**: [技术架构](./技术架构.md)

---

## 1. URL 规范

### 1.1 基础格式

```
{HTTP方法} /api/v1/{业务域}/{资源}[/{ID}][/{子操作}]
```

| 组成 | 规则 | 示例 |
|------|------|------|
| 版本 | `/api/v1/` 固定前缀 | - |
| 业务域 | 小写复数名词 | `/temples`, `/masters`, `/bookings` |
| 资源ID | 路径参数 | `/api/v1/bookings/B20260630001` |
| 子操作 | 动词 | `/api/v1/bookings/:id/status`, `/api/v1/bookings/:id/review` |

### 1.2 HTTP 方法语义

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询（列表/详情） | `GET /api/v1/temples` |
| POST | 创建/动作 | `POST /api/v1/bookings` |
| PUT | 全量更新/状态变更 | `PUT /api/v1/bookings/:id/status` |
| PATCH | 部分更新 | `PATCH /api/v1/users/profile` |
| DELETE | 删除 | `DELETE /api/v1/products/:id` |

### 1.3 路径分组

按业务域 + 端角色分组：

| 前缀 | 说明 |
|------|------|
| `/api/v1/auth/*` | 认证（公开） |
| `/api/v1/user/*` | C端用户（需JWT） |
| `/api/v1/temples/*` | 寺院（C端只读 + 管理台CRUD） |
| `/api/v1/masters/*` | 法师（C端只读 + 工作台） |
| `/api/v1/booking/*` | 预约（C端 + 寺院台 + 法师台） |
| `/api/v1/products/*` | 商品（C端只读 + 商城台CRUD） |
| `/api/v1/diy/*` | DIY（C端 + 商城台） |
| `/api/v1/orders/*` | 商城订单（C端 + 商城台） |
| `/api/v1/payments/*` | 支付（C端 + 回调） |
| `/api/v1/finance/*` | 财务（管理台） |
| `/api/v1/reviews/*` | 评价（C端 + 管理台） |
| `/api/v1/audit/*` | 审核（管理台） |
| `/api/v1/logistics/*` | 物流（商城台） |
| `/api/v1/marketing/*` | 营销（管理台） |
| `/api/v1/ai/*` | AI问事（C端） |
| `/api/v1/messages/*` | 消息（全端） |
| `/api/v1/file/*` | 文件（全端） |

## 2. 统一响应格式

### 2.1 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 2.2 分页响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "list": [ ... ],
    "page": 1,
    "size": 20
  }
}
```

### 2.3 错误响应

```json
{
  "code": 40001,
  "message": "参数错误：手机号不能为空",
  "data": null
}
```

### 2.4 错误码规范

| 范围 | 含义 |
|------|------|
| 0 | 成功 |
| 40001-40099 | 参数校验错误 |
| 40101-40199 | 认证错误（未登录/Token过期） |
| 40301-40399 | 权限错误（无权操作） |
| 40401-40499 | 资源不存在 |
| 40901-40999 | 业务冲突（状态不允许/重复操作） |
| 50001-50099 | 系统内部错误 |
| 50201-50299 | 第三方服务错误（支付/物流） |

## 3. 鉴权规范

### 3.1 JWT Token

| Token 类型 | 有效期 | 用途 |
|-----------|--------|------|
| Access Token | 2小时 | API 请求鉴权 |
| Refresh Token | 7天 | 刷新 Access Token |

### 3.2 请求头

```
Authorization: Bearer {accessToken}
X-Client-Type: customer|temple-admin|master|shop-admin|platform-admin
X-Client-Version: 1.0.0
```

### 3.3 白名单路径（无需鉴权）

> 与 `gateway-service/etc/gateway.yaml` 的 `NoAuthPaths` 一致，共 16 条。
> **匹配规则**：GET 请求前缀匹配（`path == prefix` 或 `path 以 prefix+"/" 开头`，支持 `/temples/T001` 等详情页）；非 GET 请求精确匹配。

- `POST /api/v1/auth/login`（C 端登录）
- `POST /api/v1/auth/refresh`（Token 续期）
- `POST /api/v1/auth/admin/login`（管理台登录，含 temple_admin / master / shop_admin / platform_admin）
- `POST /api/v1/user/register`（用户注册）
- `POST /api/v1/payments/callback/wechat`（微信支付回调）
- `POST /api/v1/payments/callback/alipay`（支付宝支付回调）
- `GET /api/v1/temples*`（C 端浏览寺院列表/详情）
- `GET /api/v1/masters*`（C 端浏览法师列表/详情）
- `GET /api/v1/products*`（C 端浏览商品列表/详情/分类）
- `GET /api/v1/marketing/banners*`（Banner 列表）
- `GET /api/v1/announcements*`（公告列表）
- `GET /api/v1/diy/designs*`（DIY 设计广场）
- `GET /api/v1/diy/materials*`（DIY 材料库）
- `GET /api/v1/health`（网关健康检查）
- `/api/v1/im*`（OpenIM REST 透传，由 OpenIM 自身鉴权，多方法）
- `POST /openim/webhook`（OpenIM webhook 回调，无 JWT）

## 4. 角色权限

### 4.1 角色定义

| 角色 | 值 | 端 |
|------|-----|-----|
| C端用户 | `customer` | C端 App |
| 寺院管理员 | `temple_admin` | 寺院管理台 |
| 法师 | `master` | 法师工作台 |
| 商城运营 | `shop_admin` | 商城管理台 |
| 平台超管 | `platform_super` | 平台管理台 |
| 平台客服 | `platform_service` | 平台管理台 |

### 4.2 数据隔离

| 角色 | 数据范围 |
|------|---------|
| temple_admin | 仅本寺院数据（temple_id 过滤） |
| master | 仅本人数据（master_id 过滤） |
| shop_admin | 商城域全部数据 |
| platform_super | 全平台数据 |
| platform_service | 投诉/举报相关数据 |

## 5. 接口分组规范

每个服务按端角色分组，用 `@server` 注解区分：

```api
// C端接口（需用户JWT）
@server (
    group: temple.customer
    prefix: /api/v1/temples
    jwt: Auth
)
service temple-service {
    @handler customerList
    get / (ListReq) returns (ListResp)
}

// 管理台接口（需管理员JWT+角色）
@server (
    group: temple.admin
    prefix: /api/v1/admin/temples
    jwt: Auth
    middleware: AdminAuth
)
service temple-service {
    @handler adminCreate
    post / (CreateReq) returns (CreateResp)
}
```

## 6. 通用参数

### 6.1 分页参数

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | int | 1 | 页码 |
| size | int | 20 | 每页条数（最大100） |

### 6.2 排序参数

| 字段 | 类型 | 说明 |
|------|------|------|
| sort | string | 排序字段，如 `create_time` |
| order | string | `asc` 或 `desc` |

### 6.3 时间范围

| 字段 | 类型 | 说明 |
|------|------|------|
| start_time | string | 开始时间 yyyy-MM-dd HH:mm:ss |
| end_time | string | 结束时间 |

---

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-01 | 初始版本 |
