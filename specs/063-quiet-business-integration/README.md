---
status: complete
created: '2026-11-06'
tags:
  - h5
  - quiet
  - integration
priority: high
created_at: '2026-11-06T01:41:13.535Z'
depends_on:
  - 062-quiet-park-world
updated_at: '2026-11-06T03:24:10.873Z'
transitions:
  - status: in-progress
    at: '2026-11-06T01:41:13.764Z'
  - status: complete
    at: '2026-11-06T03:24:10.873Z'
completed_at: '2026-11-06T03:24:10.873Z'
completed: '2026-11-06'
---

# 园区业务接入与连续多人验收

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-11-06 · **Tags**: h5, quiet, integration

## Overview

延续五区园区，将现有业务入口、账号练习历史与AI草稿往返接通，并补持续多人验证。范围为本地实现和联调，不发布远端、不发送真实AI请求或执行支付。

## Design

- DIY／商城沿用现有开发API配置，不改业务数据或伪造空列表。当前公开接口及页面正常；旧500无法恢复日志，不声称已定位根因。
- 练习账号归属由quiet服务调用现有`auth/access`核验，不信任body／query／用户头。账号owner带canonical Auth authority和验证后的userId；复用原表，不合并访客历史，不绑定多人形象。
- H5复用现有续期／撤销，隔离访客、账号和设备共享副本。切账号及跨标签页变化清缓存并拒绝迟到结果。鉴权错误不降级访客保存。
- 未发送AI文本、File对象、所选主题和当前会话仅留当前标签页内存；换账号／退出清除。恢复先于NPC建议，不自动发送；新会话确认后写URL，POP切其他会话清旧草稿，提交未确认前保留原文。
- 使用独立Go测试hub做20客户端90秒10Hz持续同步、争座、重连、分房与清理。不能把同机合成负载当作20设备／公网容量。

## Plan

- [x] 核对真实公开业务接口并从园区进入DIY／商城。
- [x] 账号练习历史与服务端核验、隔离、错误及切换竞态保护。
- [x] AI标签页草稿与会话恢复、提交确认和URL切换。
- [x] 独立持续同步、真实存储及WSS回归。
- [x] 最终浏览器、构建、文档和证据归档。

## Test

- DIY公开作品1件、素材45种、商城4件／2分类：真实公开API与浏览器页面，未执行远端写入。
- 账号：mock Auth＋真实独立MySQL正向隔离／重开持久化；真实既有Auth严格TLS可达、无效Bearer拒绝。合法账号跨端历史未实测。
- AI：纯逻辑测试与独立`.localhost`域内模拟API的真实React页面交互，测试内容不发到模型。区分模拟身份与真实业务鉴权。
- 原有房间仍为访客，Redis／MySQL／nginx WSS回归；20客户端90秒发送17632次移动、全部客户端最终姿态一致；中间15探针未观察到并保留统计，另有冻结源码和二进制证据。

详细证据见[续验归档](../../../artifacts/history/2026-11/quiet-park-world-20261106/integration-continuation/README.md)。

## Notes

不改生产服务器、不替换真实素材、不声明专业宗教审校或20台手机验收。原本地园区基础见依赖的上一阶段实现；历史500及先前未接账号结论保留在其当时证据内。
