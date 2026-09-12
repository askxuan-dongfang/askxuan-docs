---
status: complete
created: '2026-09-12'
tags: []
priority: medium
created_at: '2026-09-12T10:36:54.708Z'
updated_at: '2026-09-12T11:16:00.707Z'
transitions:
  - status: in-progress
    at: '2026-09-12T10:36:55.198Z'
  - status: complete
    at: '2026-09-12T11:16:00.707Z'
depends_on:
  - 025-ai-model-selection
completed_at: '2026-09-12T11:16:00.707Z'
completed: '2026-09-12'
---

# AI Provider 管理平台设置

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-12


## 使用入口与范围

平台管理台 → 系统治理 → AI 模型设置（`/admin/settings/ai`），仅 `userType=admin` 且拥有 `platform_super` 的管理员可进入和调用 API。复用平台路由角色控制；网关与 AI 服务分别检查权限。客服、商城、寺院、大师、用户及内部服务 token 不可配置模型凭据。

支持 DeepSeek 官方接口及使用 Chat Completions / Models 协议的 OpenAI 兼容接口。可配置接口根地址、写入式 API Key、默认模型、图片模型、用户开放模型列表、思考模式、推理强度与问事最大输出 Token。专题报告沿用固定结构化输出上限，Provider、默认模型和思考参数共用此设置。

基于[动态模型选择](../025-ai-model-selection/README.md)。H5/iOS 无需再发版，即可读取管理员开放的模型；留空开放列表表示动态开放上游当前所有模型。显式选择与失败重试均遵守开放范围。

## 生效与安全

- GET `/api/v1/ai/admin/provider`：仅返回公开配置、hasApiKey、配置来源、版本与最近 50 条变更元数据，使用 no-store。
- POST `/api/v1/ai/admin/provider/test`：读取上游模型目录，不保存草稿、不发送用户问事内容、不生成回答。
- PUT `/api/v1/ai/admin/provider`：再次验证连接、默认模型、图片能力和开放范围，版本一致才原子保存。保存失败保留原运行配置；冲突提示重新加载。
- 每个请求持有不可变配置快照，异步消息/报告继续使用同一快照；新请求使用保存后的 Provider。保存无需重启服务。
- 密钥留空保留当前值，变更 API 根地址必须输入新密钥，防止旧密钥被发往其他地址。不提供密钥回显、localStorage 保存或复制现有密钥功能。
- 自定义接口仅支持公网 HTTPS/443；禁止 URL 账号、参数和片段。DNS 解析结果必须全部是公开地址，拨号使用已验证 IP，禁用代理与跳转，拒绝本机、内网、链路本地、云元数据和地址转换范围。
- AI 服务使用仅记录方法、路径和耗时的请求日志，关闭可能在 5xx 时转储请求体的默认日志。审计记录只含操作者、时间、版本、变更字段，不含密钥或其片段。

## 持久化与部署

无需数据库迁移或新增数据库权限。ECS 当前为一个 AI 服务实例，使用独立私有挂载目录：主机 `/opt/askxuan/runtime/ai-provider-settings` → 容器 `/app/provider-settings`，目录 0700、文件 0600、容器 uid 1000。

`AI_SETTINGS_DIR` 指向挂载路径，`AI_SETTINGS_ENCRYPTION_KEY` 为服务器生成的随机 32 字节 Base64 密钥，通过 root 私有 runtime secrets 注入，不进入 Git。设置和审计一起以 AES-256-GCM 加密写入 `settings.enc`，旧版保留为 `previous.enc`。磁盘原子替换与版本锁保护写入；加密文件损坏时启动失败，不静默使用过时环境变量。

优先级：已保存的平台配置 > 启动时环境变量。首次保存前显示服务器初始配置；未配置持久化时后台为只读。当前实现面向单实例，扩容多实例前需引入共享配置刷新/广播，不能仅复制目录。

运行已审阅脚本 `askXuan-backend/scripts/ops/enable-ai-provider-settings.py` 启用挂载与加密密钥。脚本持有统一发布锁，确认无正在生成的任务，保持现有镜像、Provider 和 API Key，备份后仅重建 AI 容器。2026-09-12 已启用，私有回滚目录 `/opt/askxuan/backups/ai-provider-settings-20260912T185500`。

回滚：代码按 CI 发布记录回滚；平台配置可在停止 AI 服务后用 `previous.enc` 恢复 `settings.enc` 并重启。挂载初始化回滚使用该私有目录的 rollback.json 与 previous-values.json，仅恢复两项新增环境变量和 AI 容器，勿覆盖其他服务。加密密钥必须与配置文件一起保留在受限服务器备份中。

## 验证状态

- [x] AI 模块 race tests / vet；加密、重启读取、防篡改、密钥不回显、保存失败不生效、并发版本冲突、开放模型校验。
- [x] 网关 race tests / vet；伪造角色头、客服/商城角色和内部服务凭据被拒绝。
- [x] 管理台构建；6 项桌面/手机、密钥替换、连接测试、确认生效、失败保留草稿、权限与只读状态浏览器测试。
- [x] 合入并保留并发登录过期恢复任务；重新执行 6 项测试通过。
- [x] CI 制品发布、线上读写配置与连接验证；20/20 业务容器 healthy。

2026-09-12 线上验收：管理员读取、五类无权限身份及伪造头拦截、真实 DeepSeek 模型目录连接测试、无效模型保存拒绝、原配置保存与 H5/iOS 共用模型接口均通过。配置版本 1，默认与图片模型仍为 `deepseek-flash`，密钥保持原值；磁盘密文不含明文密钥且权限 0600。验收以短期合成管理员身份执行，变更记录 actor 为 `9876500198765`，未创建问事会话或扣费记录。

前端 CI `34689847152` 构建和部署成功。后端 CI `34689756225` 测试/构建成功，跨境传输过慢后取消传输任务，校验原制品 20 项 SHA256 后经本地接续转送，仍由同一 ECS 接收器校验并发布，实际更新 `ai`、`gateway`。后端工作流整体为 cancelled，不将其写作全自动 CI 成功。

线上浏览器已验证 `/admin/settings/ai` 正确跳转登录并保留 `/settings/ai` 返回路径；本轮未使用真实管理员登录。桌面/手机页面与交互由隔离 API 的 6 项浏览器测试覆盖，线上权限和配置读写由真实 API 验收覆盖，两者独立记录。

## 版本

后端：`61133335dbe30824f7a0c14fc60824a6540ff228`。前端最终合并：`5c3f933ce9c45b7fb3aec734b534e8cedcbd2187`。H5/iOS 本次无额外功能修改。
