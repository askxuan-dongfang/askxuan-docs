---
status: complete
created: '2026-10-14'
tags:
  - ai
  - models
  - volcengine
priority: medium
created_at: '2026-10-14T02:11:55.369Z'
updated_at: '2026-10-14T02:32:37.066Z'
transitions:
  - status: in-progress
    at: '2026-10-14T02:12:23.770Z'
  - status: complete
    at: '2026-10-14T02:32:37.066Z'
completed_at: '2026-10-14T02:32:37.066Z'
completed: '2026-10-14'
---

# 问事智能体支持火山引擎模型

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-10-14 · **Tags**: ai, models, volcengine

## Overview

模型连接支持火山方舟 API Key、Model ID 和 Endpoint ID；兼容现有配置安全与智能体执行。

## Design

- 在大模型连接中新增 `volcengine`，默认方舟北京 `/api/v3` 地址，允许对应地域的官方域名；使用模型服务 API Key。
- 手动登记 Model ID 或 Endpoint ID。模型目录仅包含已填 ID，不将公共 `/models` 列表当作账号接入点清单。
- 测试和保存逐个探测已填 ID；固定文本与可选测试图片，不包含用户内容，最大并发 4，总时限 15 秒。失败不得覆盖旧配置。
- 复用现有权限、地址校验、加密存储、修订检查、审计和不可变快照；支持普通生成、流式生成及 Harness 工具调用。
- 保留方舟 `thinking.type`，思考模式使用总输出预算 `max_completion_tokens`；不继承 DeepSeek 定价。
- 本次面向聊天/图片理解模型，沿用单个生效连接。多模态向量、重排、生图、生视频和 Plan 套餐不在本次范围。

## Plan

- [x] 方舟模型登记、探测、持久化及执行适配
- [x] 管理台 Provider、地址预设、模型 ID 输入及探测提示
- [x] 官方协议核对与接入操作文档

## Test

- [x] AI 服务完整竞态回归与静态检查
- [x] 管理台类型检查、生产构建及既有构建前检查
- [x] Ego Lite 页面、请求响应与真实配置管理器验证（模拟模型上游）

## Notes

工作区：`artifacts/volcengine-models-20261014/{backend,frontend,docs}`；基于后端 `5fc3101`、前端 `fa3675c`、文档 `bc61ad1` 的独立分支。上线和真实账号模型验收另行记录，不能用本地模拟测试代替。

官方依据：[兼容 OpenAI SDK](https://docs.volcengine.com/docs/ark/compatible-with-openai-sdk?lang=zh)、[Chat API](https://docs.volcengine.com/docs/ark/chat-api?lang=zh)。
