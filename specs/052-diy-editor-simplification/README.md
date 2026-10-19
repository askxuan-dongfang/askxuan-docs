---
status: in-progress
created: '2026-10-19'
tags:
  - product
  - diy
  - cross-platform
priority: medium
created_at: '2026-10-19T14:47:15.024Z'
depends_on:
  - 044-diy-unified-3d-studio
updated_at: '2026-10-19T14:47:19.156Z'
transitions:
  - status: in-progress
    at: '2026-10-19T14:47:19.156Z'
---

# DIY 编辑器界面精简

## Overview

撤销 / 重做收进预览右下角；删除常驻暂存成功行、选中操作提示栏、珠子序列条；材料分类改竖排。

## Design

页面布局、状态、键盘操作和端差异见[产品原型方案](../../docs/product/目录筛选与DIY编辑器产品原型方案.md)。

- 点选后通过预览内菜单复制、删除、前移 / 后移；拖动和手围设置保留。
- 本机草稿继续自动保存和恢复，只有存储失败常驻提醒。
- 预览保留键盘选择、换位和删除；原生提供可访问珠子选择入口。
- 采用现有主题和简繁词表，320px 布局不溢出。

## Plan

- [x] H5 / iOS 界面精简
- [x] H5 编辑、历史、刷新恢复和窄屏验收
- [x] iOS 构建
- [ ] 原生操作验收、Git / ECS 发布
- [ ] 产品原型与发布证据同步

## Test

H5 3D 六项回归通过；Ego Lite 已验证添加、复制、删除、键盘换位、撤销重做及草稿恢复。原生及生产状态见[验收记录](../../docs/reports/2026-10-19-目录筛选与DIY编辑器.md)。
