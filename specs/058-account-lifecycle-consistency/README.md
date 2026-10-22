---
status: complete
created: '2026-10-22'
tags:
  - admin
  - account
  - security
priority: high
created_at: '2026-10-22T10:43:43.576Z'
depends_on:
  - 057-admin-product-architecture
  - 031-dual-track-onboarding
  - 030-email-password-auth
updated_at: '2026-10-22T11:26:28.421Z'
transitions:
  - status: in-progress
    at: '2026-10-22T10:43:43.843Z'
  - status: complete
    at: '2026-10-22T11:26:28.421Z'
completed_at: '2026-10-22T11:26:28.421Z'
completed: '2026-10-22'
---

# 账号生命周期、真实统计与身份关联

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-10-22 · **Tags**: admin, account, security


## Overview

统一封禁即时生效、真实消费统计、工作账号详情、显式身份关联与独立主体状态。完整页面合同见[产品原型](../../docs/product/账号与用户管理产品原型方案.md)，分层证据见[本轮验收](../../docs/reports/2026-10-22-账号生命周期与真实统计验收.md)。不按邮箱自动合并，不修改原凭据或资产。

## Design

- 账号与主体实时权限版本撤销；access／refresh 旧会话不因解封复活；各端区分 40105 与依赖故障 50205。
- 五类真实已付业务按成功退款净额统计，订单去重；查询失败不能显示虚假零。
- 工作账号详情解释激活、平台停用、分配、角色与主体；平台停用优先，提供撤销会话和反向入口，保护最后有效超管。
- 寺院认证、平台封禁、上架和推荐独立；版本检查防覆盖，下架保留既有履约，解封不自动上架。

## Plan

- [x] 源码、调用方、配置、数据库迁移与兼容边界
- [x] 真实 MySQL／Redis／HTTP、并发与收银专项
- [x] 三仓 Git 合并和标准 ECS 发布
- [x] 线上只读／Mac 回看、文档与本轮资源清理

## Validation

iOS 编译和模拟器已按用户要求停止；师傅状态变化后原生界面未观察，不以构建、接口返回或启动屏冒充。完整平台架构 [057](../057-admin-product-architecture/README.md) 的其他范围仍保持进行中。
