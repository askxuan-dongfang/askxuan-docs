---
status: complete
created: '2026-09-13'
tags:
  - architecture
  - admin
  - security
priority: high
created_at: '2026-09-13T15:41:27.599Z'
updated_at: '2026-09-13T17:10:15.692Z'
transitions:
  - status: in-progress
    at: '2026-09-13T15:42:37.308Z'
  - status: complete
    at: '2026-09-13T17:10:15.692Z'
completed_at: '2026-09-13T17:10:15.692Z'
completed: '2026-09-13'
---

# 统一管理后台全面整合

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-09-13 · **Tags**: architecture, admin, security

## Overview

商城的17个业务页面已进入总管理台，但独立商城工程、依赖、组件副本和发布组件仍存在。此次删除独立商城工程并让总管理台完整接管；用户已确认寺院后台保留独立。

## Design

仅保留 web-platform-admin 与 web-temple-admin 两个业务 Web 构建工程。商城模块位于总管理台 src/commerce，沿用统一会话与按角色导航。

总管理台构建内生成自包含的 legacy/shop/index.html，接管旧 /shop 地址和旧会话迁移；它没有独立 npm 工程、组件或发布身份。接收器在同一发布事务内更新总管理台和旧地址文件，失败同时回滚。

刷新令牌绑定 user/admin/master 身份域，续期重查账号状态，拒绝缺域的旧令牌；平台消息管理同时经过网关和服务角色校验。无数据库、密钥或现有业务 API 路径迁移。

产品仍为0.0.1，已发布标签保持不变；源码、手册与当前发布清单记录本次修订的精确提交。

## Plan

- [x] 删除独立商城工程，收敛依赖、组件同步、开发入口和构建检查。
- [x] 建立总管理台拥有的旧地址与会话迁移页，替换过期迁移哈希检查。
- [x] 修复刷新身份混淆与平台消息权限缺口，并通过隔离测试。
- [x] 更新发布工具、接收器和兼容地址事务回滚测试。
- [x] 更新当前产品文档与手册，提交并部署后核对源码、组件与浏览器结果。

## Test

- [x] 商城17个页面与8个API适配器保留，两个管理台构建及迁移行为回归通过。
- [x] 同ID跨身份、旧令牌、停用账号与消息权限矩阵测试通过。
- [x] 新发布仅包含admin/temple，旧shop组件消失且地址可用；发布失败可以恢复旧目录与来源。
- [x] 线上浏览器核验旧地址与统一登录；本地 API 夹具验证商城/平台角色导航；四册 PDF 全部 83 页验收。

## Delivery

前端 99015d873252207103e175e4d0bafc77c2f44d70，后端 5c1d7b2fc0998cc6ab89b8adb2634b820fa619cf 已推送；Web/H5 CI 发布成功，后端原 CI 包经同一接收器本机中转发布成功。ECS 23 个组件、商城别名及 20 服务健康已核对。当前结果见 [0.0.1 核验](../../docs/reports/0.0.1-核验.md)。
