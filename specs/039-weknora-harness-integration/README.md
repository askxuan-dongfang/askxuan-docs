---
status: complete
created: '2026-09-29'
tags: []
priority: medium
created_at: '2026-09-29T17:50:19.684Z'
updated_at: '2026-09-29T19:06:00.164Z'
transitions:
  - status: in-progress
    at: '2026-09-29T17:50:55.349Z'
  - status: complete
    at: '2026-09-29T19:06:00.164Z'
depends_on:
  - 038-agent-knowledge-memory-domain
completed_at: '2026-09-29T19:06:00.164Z'
completed: '2026-09-29'
---

# WeKnora 知识引擎与 Harness 集成

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-29


## 目标

把正式文档管理和检索交给固定版本 WeKnora，保留问玄现有智能体调度、身份、用户记忆及专题算法。

## 设计

- 固定上游 v0.8.2 / 3e8b0bfc80b845b2d4b2ed683994748741450a97，使用官方镜像和独立持久卷。
- 标准 PostgreSQL（ParadeDB/pgvector）+ Redis + DocReader + 本地中文 FastEmbed。
- 管理台通过问玄后端的明确资源接口建库、导入文本/文件、查看处理状态与分块、重解析、审核启停和删除。
- MySQL 保存平台知识库登记、文档审核策略和操作审计；不暴露上游 API、模型密钥或登录入口。
- 智能体版本绑定 knowledgeBaseIds，空集合拒绝检索。Harness 的 search_knowledge 通过内部 REST 适配器调用 WeKnora 混合检索；MCP 计算工具保持原路径。
- 检索双重校验知识库和文档状态、保留原文片段/来源/分块/哈希；上游失败明确报错，不静默回退或捏造引用。
- 个人长期记忆继续按用户隔离，不自动导入公共库。旧片段保留，不做破坏性迁移。

## 验收

- [x] 管理 API 权限、知识范围、停用撤销、上游错误与密钥保护测试。
- [x] 后端相关包 race 测试、管理台构建。
- [x] 固定版本真实 TXT、DOCX 表格、文字 PDF 解析与混合检索。
- [x] 管理台浏览器、23 项技能评测及生产 Harness run 52 引用链路验收。
- [x] 备份、迁移、发布 v1/100%、运行健康及回滚记录。
