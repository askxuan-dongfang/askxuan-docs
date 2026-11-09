---
status: complete
created: '2026-11-05'
tags:
  - h5
  - quiet
  - 3d
  - multiplayer
  - assets
priority: high
created_at: '2026-11-05T17:05:52.538Z'
depends_on:
  - 061-quiet-space-prototype
updated_at: '2026-11-05T17:40:10.023Z'
transitions:
  - status: in-progress
    at: '2026-11-05T17:05:52.792Z'
  - status: complete
    at: '2026-11-05T17:40:10.023Z'
completed_at: '2026-11-05T17:40:10.023Z'
completed: '2026-11-05'
---

# 五区虚拟园区与3D功能入口

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-11-05 · **Tags**: h5, quiet, 3d, multiplayer, assets

## Overview

独立五区园区与功能入口：十二殿堂、共修、DIY／商城／AI、GLB动画与真实多人存储／WSS。

## Design

### 五区与十二殿堂

五区是产品游览分类，不是“五种宗教”：汉传、藏传、南传上座部同属佛教的不同传承；道教为独立宗教；妈祖属于本版独立呈现的民间信俗文化区，不归作佛教分支。既有目录代码沿用 `han_buddhism / tibetan_buddhism / theravada_buddhism / daoism / folk`，妈祖另带 `mazu` 标签。

本地配置与原创 GLB 已实现；未授权现实寺院、专业审校或上线。配置见 [quietPlaces.ts](../../../askXuan-frontend/apps/web-h5/src/features/quiet/quietPlaces.ts) 为准。

| 区域 | 殿堂 ID / 名称 | 本版对象 |
| --- | --- | --- |
| 汉传 | `han-main` 大雄宝殿 | 释迦牟尼佛 |
| 汉传 | `han-guanyin` 观音殿 | 观世音菩萨 |
| 汉传 | `han-wenshu` 文殊殿 | 文殊菩萨 |
| 藏传 | `tibetan-buddha` 释迦佛堂 | 释迦牟尼佛，独立藏式版本 |
| 藏传 | `tibetan-guanyin` 观音佛堂 | 藏传观音形制示意，与汉传版本分开 |
| 藏传 | `tibetan-tara` 度母佛堂 | 绿度母 |
| 南传上座部 | `theravada-buddha` 南传礼佛堂 | 释迦牟尼佛坐像 |
| 南传上座部 | `theravada-reclining` 卧佛展示殿 | 同一位释迦牟尼佛的卧像，不另造一位神祇 |
| 道教 | `dao-sanqing` 三清殿 | 元始天尊、灵宝天尊、道德天尊，三尊分别建模和标名 |
| 道教 | `dao-caishen` 财神殿 | 赵公明题材示意，不承诺祈愿效果 |
| 道教 | `dao-zhenwu` 真武殿 | 真武大帝／玄天上帝 |
| 妈祖信俗 | `mazu-tianhou` 天后宫 | 妈祖主尊、千里眼与顺风耳两位护从，分别建模 |

### 后续目录，尚未实现对应资产

| 区域 | 可扩展目录与边界 |
| --- | --- |
| 汉传 | 既有禅宗、净土、天台、华严标签；可逐项扩充弥陀、药师、普贤、地藏与天王殿。主尊、胁侍及三佛组合依所选传统单独配置，不把所有对象堆在同一佛坛。 |
| 藏传 | 当前宗派标签为格鲁、宁玛、噶举、萨迦；觉囊及具体支系作为待核目录，不伪称四派穷尽全部传统。祖师／上师单列 `teacher`，喇嘛是教师称谓，不是神祇种类或新宗派；本尊、护法及具体传承坛城另行审校。 |
| 南传上座部 | 可扩佛塔文化、菩提静坐庭院及地域造像版本；不照搬整套汉传观音／地藏殿，也不把坐像、卧像算成不同神祇。 |
| 道教 | 保留全真、正一传统区分；灵官、玉皇、三官、文昌、斗姥及祖师堂逐项核对尊名、冠服、持物和布置。 |
| 民间信俗 | 既有候选还包括关帝、城隍、王爷、福德正神、保生大帝、哪吒、洪圣、黄大仙、九皇爷、大伯公、拿督公、三山国王。各地域信俗独立取样；不将本版妈祖区等同全部民间信仰，也不强行收纳世界全部宗教。 |

分类与形制资料采用官方／馆藏来源，具体造型仍需复核：

- 佛教三大传承见[北京市民宗委](https://mzzjw.beijing.gov.cn/bjmz/bjdzj/zjzhjs/fj/)；汉传殿堂见[灵隐寺大雄宝殿](https://lingyinsi.org/detail_1073_11987.html)、[天王殿](https://lingyinsi.org/detail_14264.html)。
- 藏传造像参考 Rubin 博物馆[释迦、弥勒与观音](https://rubinmuseum.org/collection/c2006-71-10/)、[绿度母](https://rubinmuseum.org/projecthimalayanart/exhibition/symbols-and-meanings/female-deities/green-tara/)、[喇嘛／教师馆藏](https://rubinmuseum.org/collection/c2006-66-647/)；宗派扩展参考[国家民委资料](https://www.neac.gov.cn/seac/xwzx/202405/1173030.shtml)。
- 南传实例见卧佛寺官网[主殿坐佛](https://watpho.com/en/buddha/detail/198)、[卧佛](https://watpho.com/en/buddha/detail/204)；这些实例不代表全部上座部地区使用相同形制。
- 道教见[上海民宗委三清说明](https://mzzj.sh.gov.cn/zjzswd/20030929/0007-24416.html)、[中国道协供稿的白云观介绍](https://www.bjxch.gov.cn/xcfw/whfw/xxxq/pnidpv736416.html)、[武当真武信俗资料](https://www.hbda.gov.cn/info/6664)。
- 妈祖见[UNESCO 妈祖信俗项目](https://ich.unesco.org/en/RL/mazu-belief-and-customs-00227)与[福州天后宫主尊／护从实例](https://www.gl.gov.cn/xjwz/rw/mdgl/gjms/202503/t20250324_4993317.htm)。独立分区不否认现实信俗与道教等传统存在交融。

### 原创 Blender 资源与审校边界

- 生成器：[build-quiet-assets.py](../../../askXuan-frontend/apps/web-h5/scripts/build-quiet-assets.py)；输入为 `assets/quiet-source/hall-inputs.json`。保存十二个 `<hall-id>.blend` 与 `visitor.blend`，共十三个可编辑源文件；操作见[源文件说明](../../../askXuan-frontend/apps/web-h5/assets/quiet-source/README.md)。
- [资源 manifest](../../../askXuan-frontend/apps/web-h5/public/quiet-assets/manifest.json) 版本 `2026.11.06.3`：十二殿堂及访客合计 7,471,280B、107,820 三角；最大单殿 774,792B。各殿含独立 `Roof`、`WallFront` 和具名造像节点，两张原创 256×256 木／石纹理实际嵌入 GLB。
- 访客 `visitor.glb` 为 169,180B／1,792 三角，真实 16 骨 armature、15 根受权重骨骼；有 `Idle / Walk / Sit / Greet / Bow` 五段有效动画。`Sit` 为盘腿坐垫姿态，合掌及礼拜已做渲染检查；手部挂点为 `RightHandSocket`。
- 独立检查通过 GLB 结构、纹理、skin／动画、模型与源文件 SHA-256、实际 world bounds、殿内地面 Y=0.4m 与净门宽 3.6m；证据见[资源 QA 说明](../../../artifacts/history/2026-11/quiet-park-world-20261106/asset-qa/README.md)及[最终结构报告](../../../artifacts/history/2026-11/quiet-park-world-20261106/asset-qa/final/validation-report.json)。这些结论不代替浏览器、多人业务或真机性能验收。
- 五类建筑与冠服保持各自主题；道教及妈祖采用方形阶座／宝座，佛教区另用莲座。所有造像是原创程序示意，不声称完全写实、已开光或符合全部宗派仪轨。尊名、比例、冠服、手印、持物、胁侍及左右位置需专业审校。
- 本项目原创程序生成、无第三方模型／贴图，许可沿用项目约定；没有追加 CC0 等对外开放许可，也未发布资源。参考链接仅用于文化资料核对，未复制其摄影、扫描或馆藏模型。

## Plan

- [x] 五区十二殿、30座、园区地图与原创GLB／骨骼动画。
- [x] DIY／商城／八位AI向导入口，暂停进度与明确返回。
- [x] Go权威房间、Redis短期状态、MySQL访客历史、Docker本地WSS。
- [x] 单元／集成与双页浏览器验收，区分本地验证和生产边界。

## Test

- [x] H5构建、quiet协议／音频／移动／世界配置、导航18项及语言4项通过。
- [x] Go race、真实MySQL重建持久化／访客隔离、Redis快照TTL、nginx TLS→WSS→记录CRUD通过。
- [x] 双页供香与观音殿入座同步；静坐／木鱼→DIY→返回进度恢复；商城入口与AI登录保留向导参数通过。
- [x] 本地＋在线写入同时失败时留在园区并保留次数；重试成功；临时进度写失败阻止离开；显式首页不回到上一模块。
- [x] 320／390／768／1024／1440／1920和844×390布局边界；手机地图展开时收起练习栏。

详细日志、截图与限制见[本地集成验收](../../../artifacts/history/2026-11/quiet-park-world-20261106/README.md)。

## Notes

交付是未发布的本地集成版本。20人是配置与分房边界测试，不是持续性能验收；尚未接业务账号、跨进程接管或正式ECS。微信／iPhone真机与造像专业审校待做。现有DIY作品接口500，AI仅验证登录前入口和草稿保护逻辑，未发送真实模型请求或完成支付。
