# 0.0.1 需求入口

本目录只维护当前版本规格与仍未完成的需求。状态由 LeanSpec 管理；不得手工编辑规格 frontmatter，也不因文档整理而将业务需求标记完成。

| 规格 | 用途 |
| --- | --- |
| [产品 0.0.1 当前基线](027-product-0-0-1/README.md) | 本次产品版本、文档、目录和发布核验工作 |
| [全端语言偏好](047-platform-language/README.md) | 系统、简体与繁体语言设置，发布和设备验收边界 |
| [DIY 定稿发布与首页统一](056-diy-publication-gate/README.md) | 付款确认后发布、个人稿与公开定稿分离、首页统一与成长四入口；原生 UI 保持待验 |
| [DIY 大画布与直接拖拽](055-diy-direct-drag/README.md) | 放大预览、直接换位 / 拖出删除、只读作品详情和我的设计管理 |
| [五级成长体系方案](../docs/product/五级成长体系方案.md) | 成长规则、等级权益、折扣结算与全端一致性；实施和各端验收以对应记录为准 |
| [聊天完整性与体验](024-chat-completeness-and-experience/README.md) | 当前聊天实现与尚未完成的 APNs、真机、公网通话验收 |

其他真实限制集中在[产品现状与能力边界](../docs/product/产品现状与能力边界.md)。完成一条规格不等于全产品上线、真实交易或设备验收通过。

使用 `lean-spec board` 查看状态、`lean-spec search <关键词>` 发现已有需求；新增规格使用 `lean-spec create`，状态和依赖变更使用 CLI 对应命令。
