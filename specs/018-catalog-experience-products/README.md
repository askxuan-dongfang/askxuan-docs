---
status: complete
created: '2026-09-10'
tags: []
priority: medium
created_at: '2026-09-10T15:56:58.714Z'
updated_at: '2026-09-10T17:18:47.962Z'
transitions:
  - status: in-progress
    at: '2026-09-10T15:59:41.157Z'
  - status: complete
    at: '2026-09-10T17:18:47.962Z'
depends_on:
  - 017-simple-marketplace
completed_at: '2026-09-10T17:18:47.962Z'
completed: '2026-09-10'
---

# 真实案例体验商品

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-10


用户授权：先上架体验商品，完整跑通商城流程。按线上现有分类覆盖，每个品类两款；不增加虚构品类。

## 商品清单

资料核对日期：2026-09-11。以下价格为体验结算金额，数量为模拟库存，不代表原商家实时价格、库存或供货关系。

| 类别 | 公开商品案例 | 体验价 | 规格 | 初始模拟库存 |
| --- | --- | ---: | --- | ---: |
| 佛珠手串 | [步步生莲檀木手串](https://detail.youzan.com/show/goods?alias=2fpjhi0afsu2ns2&from_source=gbox_seo) | ¥59 | 檀香木、绿檀木、黑檀木 | 60 |
| 佛珠手串 | [青芜 · 艾草合香珠手串](https://detail.youzan.com/show/goods?from_source=gbox_seo&alias=1ybs9m7vsdgrjyd) | ¥79 | 单圈 · 10mm | 20 |
| 法器供具 | [敦煌飞天引香盏](https://detail.youzan.com/show/goods?from_source=gbox_seo&alias=1yj8kuhkaagxbpw) | ¥129 | 色釉陶瓷 · 单件 | 20 |
| 法器供具 | [敦煌飞天粗陶香炉](https://detail.youzan.com/show/goods?from_source=gbox_seo&alias=3nejfqkbslw8vzi) | ¥159 | 粗陶 · 单件 | 20 |

商品名称、图片和基础参数参考新敦煌旗舰店公开页面；介绍重写为材质、尺寸和使用说明，不做功效承诺。11 张来源图片保留原貌和归属，只用于明确标注的非售卖案例，不主张图片所有权或已获得供应商授权。来源链接、原图片 URL 和 SHA-256 记录在后端 `scripts/catalog-experience-products.json`，客户端图片路径为 `/catalog-experiences/`。

## 全栈行为

- 数据库新增 `is_experience`、`source_name`、`source_url`、`source_note`，现有商品默认普通类型。商品类型创建后不可切换；旧客户端省略新字段时保留原值。
- H5 / iOS 展示体验标识、原图相册、可选规格、来源链接。购物车和立即购买携带体验快照；结算前核对服务端价格、库存、类型，混合普通与体验商品须分单。
- 服务端校验商品状态、真实 SKU 归属和库存，禁止跳过规格。预占、释放及后台 SKU 更新与商品总库存一致；重复请求保留幂等行为。
- 订单使用服务端生成的 `EXO-` 独立编号前缀快照体验属性，不接受客户端决定订单类型；支付只允许 mock。
- 支付成功及退款保持正常消息流程，订单仍可进入待发货、待收货、完成和售后。体验发货强制记录“体验物流（不发货）”与 `SIM-EXO-...` 运单，不实际寄送。
- 体验订单不写消费积分奖励，不入平台收款/退款总账，不计入商城销售统计。普通订单原有积分和财务规则继续保留。
- 统一后台支持创建体验商品、编辑来源、上下架、维护规格及识别体验订单；发货窗口明确提示模拟。原商城管理入口继续跳转统一平台。

## 导入与发布

1. 备份商品、规格、图片、分类四张表。
2. 运行 `scripts/ops/import-catalog-experiences.py schema --apply --backup-dir ...`：按列检查后执行增量迁移，不重建表。
3. 从同一 Git 归档依次构建部署 finance、payment、order、product 服务；每个服务保留旧镜像和原容器配置，健康失败自动回滚。
4. ECS 构建四个 Web 客户端，检查图片静态文件后切换版本。
5. 运行导入脚本 `publish --apply`：商品编号去重，事务新增四款及六个 SKU，不覆盖既有数据、不重置已经消耗的库存。每次执行留备份。
6. 验证分类覆盖、图片 Content-Type / 内容、后台数据及实际模拟订单闭环。

## 验证与发布记录

- 本地：公共模块、产品、订单、支付、财务服务 Go 测试通过；H5 / 统一后台生产构建通过；iOS 专用模拟器 StorefrontNativeTests 4 项通过。
- 商城 Playwright 共 23 个用例：原 21 项全通过，追加支付状态同步通过；收货弹窗测试首次因可访问名称不匹配失败，修正后单项通过，最后对三条受影响链路回归通过。
- 线上商品 ID 8 / 9 / 10 / 11，共 6 个 SKU、11 张图片。四项后台商品详情接口验证通过；公开 HTTPS 图片类型、文件头、SHA-256 全部验证通过。
- 实际 H5 下单：订单 4，`EXO-1de5ba5acba444079413fe56`，绿檀木 2 件，模拟金额 ¥118；支付单 17，`success/mock`。后台模拟发货后，H5 已通过“确认模拟收货”将订单置为 `completed`。运单 `SIM-EXO-1de5ba5acba444079413fe56`。
- 数据核验：产品 8 库存 58，与 SKU 总库存 58 一致；积分奖励记录 0，账户仍 987；平台财务交易 0。重复执行导入仍为四款，已消耗库存不恢复。
- 验收追加修复：支付确认后自动查询订单状态，最多十次，避免消息同步期间显示再次支付；提示绑定当前订单。收货使用商城统一弹窗，体验收货明确无实物。
- H5 SPA 内部重定向落到 `/index.html` 时曾丢失 `/c/` 的缓存头；新增精确 HTML location，在线验证 `Cache-Control: no-store, no-cache, must-revalidate`，原配置已备份。
- 四个后端服务基于 `b41e0ae` 构建并健康上线；后端 Git `71b756a` 另包含缓存运维修复。最终四个 Web 均在 ECS 构建并发布到 `20260911-catalog-final-8f8b05a`，前端 Git `8f8b05a`，H5 Git `f735f31`；订单 4 已在线上 H5 完成收货。商品分类筛选逐项验证均为两款。
- 后台页面交互使用本地认证夹具测试；线上商品维护与模拟发货通过实际网关管理接口验证，未声称已经使用真人管理员登录完成 UI 验收。iOS 为代码和模拟器验收，不包含真机分发。
- 数据备份 `/opt/askxuan/backups/20260911-catalog-data`；HTML 配置备份 `/opt/askxuan/backups/20260911-catalog-html-cache`；服务和 Web 各自保留前版镜像/源码/页面。仅清理经挂载核查的旧 node_modules 以腾出构建空间，业务数据未清理。
