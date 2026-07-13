# askXuan-docs 问玄东方项目文档

问玄东方（askXuan）项目的中央文档仓库，涵盖架构规范、服务设计、业务流程、字段字典与开发指南。

> 配套仓库：
> - 后端：[askxuan-dongfang/askxuan-backend](https://github.com/askxuan-dongfang/askxuan-backend)
> - 前端：[askxuan-dongfang/askxuan-frontend](https://github.com/askxuan-dongfang/askxuan-frontend)

## 目录结构

```
askXuan-docs/
├── API-REFERENCE.md                # 全栈接口文档（214 个接口，覆盖 6 客户端 × 17 服务）
│
├── docs/
│   ├── architecture/               # 架构规范
│   │   ├── 技术架构.md              # 整体技术栈与微服务架构
│   │   ├── API规范.md               # RESTful 命名、响应格式、错误码、鉴权
│   │   ├── 业务流程.md              # 核心业务流程时序图
│   │   ├── 状态机.md                # 预约/订单/DIY/退款等状态机
│   │   └── services/               # 17 个后端服务设计文档
│   │       ├── 网关服务.md
│   │       ├── 认证服务.md
│   │       ├── 用户服务.md
│   │       ├── 寺院服务.md
│   │       ├── 法师服务.md
│   │       ├── 预约服务.md
│   │       ├── 评价服务.md
│   │       ├── 商品服务.md
│   │       ├── 订单服务.md
│   │       ├── 支付服务.md
│   │       ├── DIY手串服务.md
│   │       ├── 消息服务.md
│   │       ├── 文件服务.md
│   │       ├── AI问事服务.md
│   │       ├── 媒体与直播服务.md
│   │       ├── 审核服务.md
│   │       ├── 财务服务.md
│   │       ├── 物流服务.md
│   │       └── 营销服务.md
│   │
│   ├── product/                    # 产品设计
│   │   ├── 管理端架构.md            # 三套管理台（寺院/商城/平台）的权限与功能划分
│   │   └── 业务逻辑对齐审计报告.md   # 代码-文档-原型一致性审计
│   │
│   ├── guides/                     # 开发指南
│   │   ├── Go后端指南.md            # go-zero 微服务开发入门
│   │   ├── iOS入门指南.md           # iOS 原生开发（C 端 + 法师端）
│   │   └── Expo入门指南.md          # React Native (Expo) 开发入门
│   │
│   └── standards/                  # 数据与字段规范
│       ├── 字段字典.md              # 核心表字段定义
│       └── 统一数据字典.md          # 枚举值、状态码、常量
```

## 核心内容速览

### 接口规范
- RESTful 风格，路径复数命名（`/api/v1/temples`）
- 统一响应：`{code, message, data}`
- 鉴权：JWT Bearer Token（Access 2h + Refresh 7d）
- 错误码范围：40001-50299

### 微服务架构
- 19 个下游微服务 + 1 个网关，按 5 大业务域分组（platform / content / commerce / infrastructure / operation）
- 通信方式：HTTP REST（客户端-网关）、go-zero zrpc/gRPC（服务间）、RabbitMQ（异步）、MySQL 每服务独库
- 注册中心：etcd

### 客户端矩阵
| 客户端 | 类型 | 技术栈 |
|--------|------|--------|
| C 端 iOS App | 移动端 | Swift + UIKit |
| 法师端 iOS App | 移动端 | Swift + UIKit |
| mobile-customer | 跨端 | React Native (Expo) |
| 寺院管理台 | Web | Vue 3 + Vite + TailwindCSS |
| 商城管理台 | Web | Vue 3 + Vite + TailwindCSS |
| 平台管理台 | Web | Vue 3 + Vite + TailwindCSS |

## 文档约定
- 中文撰写，技术术语保留英文原文
- 表格优先用于字段定义、枚举值、端口表
- 状态机使用 Mermaid 图
- 服务文档统一结构：职责 / API / 数据模型 / 依赖 / 状态机 / MQ 事件

## 相关仓库
| 仓库 | 说明 |
|------|------|
| [askxuan-backend](https://github.com/askxuan-dongfang/askxuan-backend) | Go 微服务后端（go-zero + etcd + MySQL + RabbitMQ） |
| [askxuan-frontend](https://github.com/askxuan-dongfang/askxuan-frontend) | 多端前端（iOS × 2 + Web Admin × 3 + RN） |
| askxuan-docs | 本仓库，项目文档 |
