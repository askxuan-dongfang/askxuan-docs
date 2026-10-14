---
status: complete
created: '2026-10-14'
tags:
  - ai
  - models
  - volcengine
priority: medium
created_at: '2026-10-14T02:11:55.369Z'
updated_at: '2026-10-14T09:43:16.268Z'
transitions:
  - status: in-progress
    at: '2026-10-14T02:12:23.770Z'
  - status: complete
    at: '2026-10-14T02:32:37.066Z'
  - status: in-progress
    at: '2026-10-14T09:14:15.900Z'
  - status: complete
    at: '2026-10-14T09:43:16.268Z'
completed_at: '2026-10-14T02:32:37.066Z'
completed: '2026-10-14'
---

# 问事智能体支持火山引擎模型

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-10-14 · **Tags**: ai, models, volcengine

## Overview

模型连接支持火山方舟模型服务和 Agent Plan 套餐，兼容现有配置安全与智能体执行。

## Design

- 在大模型连接中新增 `volcengine`，默认方舟北京 `/api/v3` 地址，允许对应地域的官方域名；使用模型服务 API Key。
- 手动登记 Model ID 或 Endpoint ID。模型目录仅包含已填 ID，不将公共 `/models` 列表当作账号接入点清单。
- 测试和保存逐个探测已填 ID；固定文本与可选测试图片，不包含用户内容，最大并发 4，模型服务总时限 15 秒。失败不得覆盖旧配置。
- 复用现有权限、地址校验、加密存储、修订检查、审计和不可变快照；支持普通生成、流式生成及 Harness 工具调用。
- 保留方舟 `thinking.type`，思考模式使用总输出预算 `max_completion_tokens`；不继承 DeepSeek 定价。
- 面向聊天/图片理解模型，沿用单个生效连接。多模态向量、重排、生图、生视频不在本次范围。
- 2026-10-14 兼容性补齐：Agent Plan 使用 `/api/plan/v3`、套餐 API Key 和 Model Name；页面明确区分套餐与按量地址。所有调用路径省略 `thinking` 和 `reasoning_effort`，不执行关闭思考重试。套餐探测 512 Token、25 秒、最多并发 4；不依赖 `/models`。
- 连接失败按状态分类为鉴权、模型不存在、参数不兼容、额度、超时等固定提示；不暴露上游错误正文。切换地址必须提供新密钥，测试不改变生产配置。

## Plan

- [x] 方舟模型登记、探测、持久化及执行适配
- [x] 管理台 Provider、地址预设、模型 ID 输入及探测提示
- [x] 官方协议核对与接入操作文档
- [x] Agent Plan 实际账户兼容性补齐与上线验证

## Test

- [x] AI 服务完整竞态回归与静态检查
- [x] 管理台类型检查、生产构建及既有构建前检查
- [x] Ego Lite 页面、请求响应与真实配置管理器验证（模拟模型上游）

## Notes

工作区：`artifacts/volcengine-models-20261014/{backend,frontend,docs}`；基于后端 `5fc3101`、前端 `fa3675c`、文档 `bc61ad1` 的独立分支。上线和真实账号模型验收另行记录，不能用本地模拟测试代替。

2026-10-14 发布验收：后端 main `91589859f8ad`、前端 master `38a2f13ea553` 已推送。ECS 发布为 `ci-backend-38503098108-1-91589859f8ad` 与 `ci-web-38502435506-1-38a2f13ea553`。发布前合入线上已有历史以保留现有功能，数据库/运行配置契约保持不变。后端构建、测试、静态检查及三组数据库回归全部通过；自动上传因速度过慢取消后，用同一次 CI 原包经 GitHub SHA256 和包内文件校验，通过原 receiver 发布成功，工作流最终状态仍记录为 cancelled。前端 CI 与自动发布全部成功。

20 个后端服务 healthy，AI/payment 实际二进制与 CI 清单一致，admin 216 个与 temple 124 个线上文件匹配清单。Ego Lite 验证供应商选项、地址预填、模型 ID 表单与空模型保护后撤销草稿；生产配置仍为 DeepSeek / deepseek-flash / v2，密钥不回显。此次没有实际方舟账号调用，真实模型聊天、流式输出和工具能力仍待账号验收。

CI 顺带修复了已有现金钱包 MySQL 测试的咨询表夹具，并验证无有效咨询不能付款且余额不变；付款生产源码未改。发布器的源码指纹包含测试文件，因此重建 ai、payment 两个容器，其他 18 个后端服务保持原容器。

官方依据：[兼容 OpenAI SDK](https://docs.volcengine.com/docs/ark/compatible-with-openai-sdk?lang=zh)、[Chat API](https://docs.volcengine.com/docs/ark/chat-api?lang=zh)。

### Agent Plan 补齐与验收（2026-10-14 17:42 CST）

- 后端 main：`616f44fb93dfb0e6e650057c5a5e6cacf2e28bbd`；前端 master：`4fd8522bb73fc35b41657ab7b2965783f5c95df3`。均从当时线上完整历史继续修改，保留并行任务。
- 后端 CI `38541690364` 的构建、测试、静态检查与三组数据库回归成功；上传过慢取消（最终 cancelled）。下载同一次原包，校验 GitHub ZIP SHA256、20 个文件 SHA256 和配置契约后，经原接收器发布 `ci-backend-38541690364-1-616f44fb93df`。只替换 AI 容器，实际二进制哈希匹配 CI。
- 前端 CI `38542840229` 全部成功，发布 `ci-web-38542840229-1-4fd8522bb73f`，340 个线上静态文件匹配清单。首次新增回归用例因点中被覆盖的输入框失败，已改点可见控件并通过重跑。
- Ego Lite 实际账号验收：选择 Agent Plan、套餐地址和 `ark-code-latest`，通过线上管理台发起测试，HTTP 200、业务 code=0、页面连接成功，3828 ms。独立官方 SSE 测试 HTTP 200、实际模型 `glm-5.3`、回答 `OK`，1924 ms，32 Token。
- 测试后撤销草稿，密钥输入为空，生产仍为 DeepSeek / deepseek-flash / v2。20 个后端服务 healthy，其余 19 个服务容器和当前 H5 发布保持不变。
- 完整 AI 竞态测试和 vet、管理台生产构建、本机真实配置管理器的保存/刷新/密钥保护验证已通过。线上验收覆盖连接探测与官方流式协议；具体智能体业务问事/报告的 Agent Plan 回合未执行，Eino/Harness 参数由回归测试覆盖。

接入步骤见[后端接入文档](https://github.com/askxuan-dongfang/askxuan-backend/blob/616f44fb93dfb0e6e650057c5a5e6cacf2e28bbd/docs/ai/volcengine-models.md)。本地脱敏证据：`artifacts/ark-agent-plan-20261014/verification/`。不保留真实密钥或上游思考正文。
