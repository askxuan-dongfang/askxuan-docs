# 0.0.1 需求入口

本目录只维护当前版本规格与仍未完成的需求。状态由 LeanSpec 管理；不得手工编辑规格 frontmatter，也不因文档整理而将业务需求标记完成。

| 规格 | 用途 |
| --- | --- |
| [产品 0.0.1 当前基线](027-product-0-0-1/README.md) | 本次产品版本、文档、目录和发布核验工作 |
| [聊天完整性与体验](024-chat-completeness-and-experience/README.md) | 当前聊天实现与尚未完成的 APNs、真机、公网通话验收 |

其他真实限制集中在[产品现状与能力边界](../docs/product/产品现状与能力边界.md)。完成一条规格不等于全产品上线、真实交易或设备验收通过。

使用 `lean-spec board` 查看状态、`lean-spec search <关键词>` 发现已有需求；新增规格使用 `lean-spec create`，状态和依赖变更使用 CLI 对应命令。
