---
status: complete
created: '2026-09-12'
tags: []
priority: medium
created_at: '2026-09-12T09:03:10.368Z'
updated_at: '2026-09-12T10:23:11.140Z'
transitions:
  - status: in-progress
    at: '2026-09-12T09:05:28.348Z'
  - status: complete
    at: '2026-09-12T10:23:11.140Z'
completed_at: '2026-09-12T10:23:11.140Z'
completed: '2026-09-12'
---

# AI 问事动态模型选择

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-12


## 目标

H5 与 iOS 用户端允许为下一条消息选择 DeepSeek 模型；可选 ID 来自当前服务端密钥可访问的官方模型列表。新密钥仅配置在 ECS AI 服务，默认 `deepseek-flash`。

## 设计

- 新增受登录保护的 `GET /api/v1/ai/models`，返回 `list`、`defaultModel`、`stale`。后端访问 DeepSeek `/models`；正常缓存 5 分钟，失败重试间隔 15 秒，成功旧列表最多保留 1 小时。没有有效列表时显示可重试错误，不编造选项。
- 模型 ID 动态获取；名称、图片兼容性属于后端维护的能力元数据。2026-09-12 实测可用 `deepseek-flash`（图文）、`deepseek-v4-pro`（文字）。未知新 ID 默认文字模式，需核实能力后更新元数据。
- 新建会话与发送消息的可选 `model` 参数先校验，再与待生成消息在同一数据库事务中保存。复用已有 `ai_message.model`，无结构迁移。重试沿用原消息模型；并发请求不修改服务级默认模型。
- 不传 `model` 的旧客户端继续采用配置的文字/图片路由。显式模型无效或不支持当前图片历史时，在占用额度前拒绝请求。
- 两端按账号记住选择，模型下架后回到有效默认值；列表加载/失败时禁用发送并提供重试。含图片时禁用不支持图片的模型。模型选择对下一条消息生效，回答旁标注实际模型。
- 供应商非成功响应只记录状态码，避免透传敏感响应。访客页面不请求受保护模型接口。
- `AI_MODEL_PRICING` 支持按模型配置供应商用量成本估算；Flash 别名映射同组费率。估算不等同支付、积分或用户收费。

## 验证

- [x] AI 模块 `go test -race ./...` 与 `go vet ./...`。
- [x] 动态列表缓存、并发、失败恢复、无效模型与图片能力测试。
- [x] 消息模型事务持久化及失败回滚；多模型成本估算测试。
- [x] H5 5 项模型选择浏览器测试；17 项社区/登录回归；10 项 AI 报告回归。
- [x] 合并最新字体与动画后再次通过 5 项模型选择测试及 iOS 模拟器目标编译。
- [x] 新密钥已按明确授权替换，默认 Flash，仅重启 AI 服务，健康检查通过。
- [x] CI 发布、线上目录与实际供应商调用验证。

## 2026-09-12 发布验收

- 后端 `22d310c5610352cc58ba4d5e47075330941dcfa1`，前端/iOS `1a355b5c14e29a716876f1a3b495cfbfae681ec5`，H5 `f633fa28babd0d9303a6760b4dccf4c52b79a244`。合并并保留另一个任务最新字体与动画更新。
- [H5 CI 34686864855](https://github.com/askxuan-dongfang/askxuan-h5/actions/runs/34686864855) 构建、17 项社区、11 项聊天、5 项模型选择检查和部署全部成功；[前端 CI 34686774243](https://github.com/askxuan-dongfang/askxuan-frontend/actions/runs/34686774243) 成功。
- [后端 CI 34686195360](https://github.com/askxuan-dongfang/askxuan-backend/actions/runs/34686195360) 的 test/build/vet 成功，GitHub 到 ECS 传输长时间未完成。取消该部署，转送原始 CI 制品，20 个文件 SHA256 全部一致，由同一接收器完成发布 `ci-backend-34686195360-1-22d310c56103`；没有本地重新编译或绕过版本检查。
- ECS 发布事务为 complete，`changed_services=[ai]`，20/20 业务服务健康。默认及图片模型都是 Flash。
- 线上模型目录使用短期合成身份只读校验，返回两个当前模型、`stale=false`、`Cache-Control: no-store`；访客被拒绝。未写入用户会话、消息或积分记录。
- 部署新密钥后直接调用供应商两个模型，各用一条极短测试提示，实际返回模型与所选一致，均产生有效文本、1 个输出 token。
- H5 页面确认加载了新模型入口；原浏览器会话登录凭据已失效，清理后需用户重新登录。真实用户会话的端到端发送未执行；交互链路使用隔离浏览器用例验证。
- iOS 最终合并版本 `xcodebuild` 模拟器目标 Debug 编译成功，未安装到真机。验收材料位于工作区 `artifacts/ai-model-selection-20260912/`。

## 发布与回滚

代码进入后端 main、前端 master、H5 main，由既有 CI 生成并通过受限接收器发布。密钥不进入 Git、客户端、构建包或日志；生产配置仅保留 root 可读回滚材料。密钥回滚与代码回滚分开执行，避免恢复其他服务的旧配置。

本次凭据备份目录为 ECS `/opt/askxuan/backups/deepseek-key-20260912T174025`（目录 0700、文件 0600）。其中 `old-ai-values.json` 只保存本次修改的四个 AI 配置项，`rollback.json` 保存当时 AI 容器配置。恢复时持有发布锁，恢复这四项及 AI 服务即可，不恢复完整运行时文件。

iOS 编译证明源代码可构建；用户设备需安装包含本次修改的新版本。公网通话配置不属于本次变更。

## 官方接口依据

- [可用模型列表](https://api-docs.deepseek.com/api/list-models/)
- [模型能力与用量价格](https://api-docs.deepseek.com/quick_start/pricing/)
- [图片输入](https://api-docs.deepseek.com/guides/vision/)
