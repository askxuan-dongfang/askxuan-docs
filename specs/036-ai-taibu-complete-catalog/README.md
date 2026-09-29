---
status: complete
created: '2026-09-29'
tags: []
priority: medium
created_at: '2026-09-29T02:26:50.937Z'
updated_at: '2026-09-29T03:26:09.044Z'
transitions:
  - status: in-progress
    at: '2026-09-29T02:27:11.259Z'
  - status: complete
    at: '2026-09-29T03:26:09.044Z'
depends_on:
  - 034-ai-discovery-and-interactive-skills
completed_at: '2026-09-29T03:26:09.044Z'
completed: '2026-09-29'
---

# taibu 全工具接入

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-29


将生产 taibu 的 15 个只读计算工具接入 Harness。新增独立技能、输入契约、资料补问、H5 分类入口、管理台草稿增补与调试，保留实际调用轨迹。

## 验收

- 15 个工具真实 MCP 调用通过；30 个已开放子选项通过。
- 缺资料须补问，模型不得填参数；四柱反推候选不能成为已确认资料。
- 八字大运使用完整返回，包含流年；占星本命时间按出生地，流运统一为等价 UTC 请求。
- 单轮仍限制 4 次模型调用、4 次工具调用，保持现有停止、重试和权限边界。
- H5、管理台和后端构建回归通过后，独立验证生产版本与合成会话。

原生新增表单尚未交付；本次不宣称全端交互一致。新工具属于文化参考，不能承诺结果真实性或预测效果。
