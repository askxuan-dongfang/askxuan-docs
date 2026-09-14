---
status: complete
created: '2026-09-14'
tags: []
priority: high
created_at: '2026-09-14T03:49:37.533Z'
updated_at: '2026-09-14T04:48:37.266Z'
transitions:
  - status: in-progress
    at: '2026-09-14T03:50:02.330Z'
  - status: complete
    at: '2026-09-14T04:13:53.388Z'
  - status: in-progress
    at: '2026-09-14T04:30:45.698Z'
  - status: complete
    at: '2026-09-14T04:34:48.271Z'
  - status: in-progress
    at: '2026-09-14T04:37:40.773Z'
  - status: complete
    at: '2026-09-14T04:40:28.320Z'
  - status: in-progress
    at: '2026-09-14T04:45:57.784Z'
  - status: complete
    at: '2026-09-14T04:48:37.266Z'
depends_on:
  - 027-product-0-0-1
completed_at: '2026-09-14T04:13:53.388Z'
completed: '2026-09-14'
---

# H5 首页与个人页视觉及动效重设计

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-09-14


## Overview

根据六处浏览器批注重新设计首页双入口、信仰流派、心愿区及个人页账户卡。用 emilkowalski/skills 的设计与动效指导减少重复动画，保持现有浅色、深色、跟随系统外观。

## Design

- 首页双入口改为细线、留白的双列卡片；四个流派完整放入双列网格，移除“按流派聚合”副文案。
- 八个心愿采用四列两行；真实 taxonomy 中 landingType=diy 的入口优先，直接进入 DIY。移除原来指向通用服务目录的“更多”。
- 个人账户身份和资产分层，功德值显示未开放，积分及优惠券保持真实 API 语义；失败不显示为零，展开卡支持键盘操作。
- 高频主导航不执行整页淡入；移除图标位移和首页悬停上浮。轮播仅相邻页移动，首尾及跨页切换直接到达，统一现有 motion token。
- 编辑资料弹层减少动态模式不缩放按钮；保留原生 dialog 焦点管理。

## Plan

- [x] 安装技能并只读审查动效。
- [x] 独立代码副本实现六处视觉调整及有依据的动效修正。
- [x] 构建、认证回归与真实浏览器交互验证。
- [x] 浅深主题及窄屏视觉检查，整理可审阅证据。
- [x] 改版独立验证后快进合并到 H5 main，推送、CI 构建、部署及线上验收完成。

## Test

- 八个心愿完整可见、DIY 首位、路由正确，流派无横向截断；320/390/507/768px 无页面横溢。
- 账户信息、积分链接、优惠券和地址键盘展开、编辑资料关闭及焦点回归。
- 连续 Tab 切换无 main 动画；三张轮播相邻/首尾/远跳；reduced-motion 无缩放。
- H5 build 和 test:auth。线上读取与本地模拟场景分别标注，不提交测试业务数据。

## Notes

技能上游版本：d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7。仅 H5 范围，未宣称原生 iOS 同步完成。

本地完成提交 `be4bb3b`，验收记录：`artifacts/home-profile-redesign-20260914/README.md`（DongFang 工作区）。28 项认证回归、16 组响应式布局、14 个入口路由和动效/失败场景已通过。

紧凑度反馈已完成，追加提交 `2cfefa3`。390px 心愿区底部由约 913px 收紧到 723px；四种宽度及浅深主题复核通过。游客 DIY 试做可用，保存/定制/我的设计需登录，订单页有登录提示；不改变权限策略。

心愿区进一步收紧，提交 `c4c72b3`：八个线性 SVG 图标、图文横排，网格高 98px；四屏宽两主题共八组布局与构建通过。

目录筛选批注完成：`a4957dd` 去除两页侧栏重复流派（类型/认证资质），顶部统一控制；组合筛选、旧链接兼容、首页流派参数及刷新已由真实浏览器验证，构建通过。

## Production release

2026-09-14 经用户授权推送与部署，H5 main 为 `a4957dd2b0456b5201a6132b04632543c5c0da8e`。[CI 34811606968](https://github.com/askxuan-dongfang/askxuan-h5/actions/runs/34811606968) build/deploy 均成功：28 项认证测试，社区 17、聊天 11、AI 模型 8 项模拟浏览器回归通过。

ECS 发布 `ci-h5-34811606968-1-a4957dd2b045` 已 complete。共享 frontend 构建输入 `99015d873252207103e175e4d0bafc77c2f44d70`；仅 web/h5 组件更新，admin、temple、shop 别名与后端版本保持不变，20 个业务服务健康。上一静态版本目录保留，未执行回滚演练。

生产浏览器验证：首页 8 个图标、98px 心愿网格、DIY 首位、无横溢；两处目录重复筛选移除，组合筛选/旧链接/刷新通过；个人页真实 977 积分及优惠券键盘展开通过；广场关注/图文/视频/发现切换未退回登录。入口 HTML 和主脚本 SHA256 与 CI manifest 一致。未提交测试业务数据，未验收直播播放或真实交易。

工作区发布证据位于 `artifacts/home-profile-redesign-20260914/verification/`，完整记录为同目录上级 README.md。
