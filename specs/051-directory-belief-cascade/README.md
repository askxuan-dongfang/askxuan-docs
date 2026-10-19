---
status: in-progress
created: '2026-10-19'
tags:
  - product
  - directory
  - cross-platform
priority: medium
created_at: '2026-10-19T14:32:11.699Z'
updated_at: '2026-10-19T14:32:14.283Z'
transitions:
  - status: in-progress
    at: '2026-10-19T14:32:14.283Z'
---

# 寺院与师傅两级信仰筛选

## Overview

移除独立宗派 / 信俗栏。点击五大信仰类型，在类型下方显示其所属子标签；两目录和 iOS 使用统一服务端归属。

## Design

完整页面规格和可交互原型见[产品原型方案](../../docs/product/目录筛选与DIY编辑器产品原型方案.md)。

- 子标签属于汉传、藏传、南传、道教、民间信仰之一；后台管理 `beliefCode`。
- 切换类型清除旧子项，地区、服务、师傅身份和擅长保留。
- H5 归一化旧链接、刷新保持选择，过滤未知 / 停用 / 不匹配的隐藏条件。
- 新增数据库字段并回填 24 个现有宗派，保持已有类型和提供者关联。重复迁移不覆盖已配置归属。

## Plan

- [x] H5 / iOS 目录联动与后台归属字段
- [x] 数据迁移、输入验证及旧客户端更名兼容
- [x] MySQL 集成与 H5 回归
- [ ] 原生交互验收与 Git / ECS 发布
- [ ] 发布版本和在线验收归档

## Test

六项 H5 URL 回归、MySQL 五项数据库回归通过；Ego Lite 验证五类子项、独立筛选保留、旧链接、320px 繁体深色。原生及生产状态见[验收记录](../../docs/reports/2026-10-19-目录筛选与DIY编辑器.md)。
