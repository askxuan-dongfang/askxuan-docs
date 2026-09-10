---
status: in-progress
created: '2026-09-10'
tags: []
priority: high
created_at: '2026-09-10T16:36:43.395Z'
updated_at: '2026-09-10T16:38:21.512Z'
transitions:
  - status: in-progress
    at: '2026-09-10T16:38:19.782Z'
depends_on:
  - 003-commerce-upgrade
---

# DIY 工作台与设计广场升级

## 范围与隔离

本次仅负责 DIY 的 H5、iOS、后端、平台管理台。工作分支 `codex/diy-studio-20260911`；源任务工作区未被编辑。构建前已在独立副本中合入源任务商城最新提交（后端 71b756a、前端 8f8b05a、H5 f735f31）。新增文档使用 019，保留源任务的 018 编号。

## 交付行为

- 2D 使用原始照片裁切、材质纹理、阴影与形制。2D/3D 共用珠径和相邻珠子弦长算法；手围与松量分离，最多 60 颗。
- H5 支持拖动和键盘换位、增删复制、撤销重做、深浅台面、缩放、旋转、账户/设计隔离的设备草稿恢复。3D 使用物理材质、透射、环境灯光、PBR 纹理缓存，设备失败回退 2D，尊重减少动态效果。
- iOS 接入 SceneKit 3D、原图裁切、真实珠径排列、编辑与发布、分享、复制为独立设计和加载更多作品。
- 设计广场读取真实分页数据，展示作品详情和材料参考价；分享链接支持访客查看。私密作品仅作者可读。
- 作者可保存、发布、下架作品。保存修改转为私密；再次发布需要重新确认库存。复制生成新 ID、私密状态、来源 ID，不修改原作。PNG 导出附素材署名入口。
- 平台管理台配置单珠照片/PBR 贴图/署名，查看设计、来源、作者、参考价，并确认下架。
- 服务端以 JWT 为身份来源；保存从材料/SKU 重建价格与数量，忽略客户端伪造价格与作者。`revision` 条件更新防止覆盖其他设备的新版本。管理台下架后原作者需修改再发布。

## 素材

目录：H5 `public/assets/diy/`；`manifest.json` 记录原图来源、作者、授权、SHA-256 和画布裁切坐标；`credits.html` 是用户可打开的来源页。

- [青金石球实拍](https://commons.wikimedia.org/wiki/File:2_lapis_lazuli.jpg)，Adam Ognisty，CC BY-SA 3.0，接入青金石。
- [粉晶球实拍](https://commons.wikimedia.org/wiki/File:Rosecuartezar.jpg)，Ba7rainsun，CC BY-SA 4.0，接入粉晶。
- [紫色萤石球实拍](https://commons.wikimedia.org/wiki/File:AMETHYST-COLOUR-FLUORITE.jpg)，Fluorite，公有领域，存入储备素材库，未误映射为紫水晶。
- [ambientCG Wood051](https://ambientcg.com/view?id=Wood051)、[Marble013](https://ambientcg.com/view?id=Marble013)，CC0 通用 PBR 纹理。木类接入法线与粗糙度，石材包作为可选素材储备。

照片是第三方矿石球参考，并非本店 SKU 实拍。程序纹理、照片裁切、PBR 预览分别标明来源。当前只映射两种实拍参考；其余材料仍是程序/PBR 预览。尝试过内置 imagegen 透明底提取，但输出没有有效透明通道，未纳入生产素材；最终直接使用未修改原图。

产品研究参考：[养个石头官方发布](https://www.douyin.com/video/7605432569631535973)、[珠了个珠官方发布](https://www.douyin.com/video/7616345471162682506)。未取得两者实现代码，不能据此断言其渲染架构。开源 Jewelry-3D-configurator 为 GPL-3.0，仅研究思路，未复制其代码和资产。

## 验证与发布

- 后端 `go test ./...`；真实 MySQL + HTTP 测试覆盖价格/数量篡改、作者隔离、私有读取、发布、访客读取、复制、版本冲突、管理台下架和缺货门禁。
- `20260911_diy_studio.sql` 在独立 MySQL 连续执行两次通过；为增量、可重跑迁移。
- H5 浏览器在 390/768/1440 验证无横向溢出；实拍选材、拖动/键盘、撤销重做、WebGL、保存发布、分享链接、PNG 下载、访客读取、副本不改原作、草稿恢复均通过。
- H5 / 平台管理台生产构建已通过；iOS 无签名 generic iOS 构建已通过，未做真机触摸与 GPU 性能验收。
- 不在本次测试中创建真实支付或订单；成交仍走已有库存/价格复核流程。
- 部署只更新 DIY 容器、H5 与平台管理台静态产物；其他服务与入口继承当前发布。切换前再次比较当前发布目录，防止覆盖并行发布。记录数据库备份、旧容器镜像与静态目录回退点。
