---
status: complete
created: '2026-09-07'
tags: []
priority: medium
created_at: '2026-09-07T08:54:05.767Z'
updated_at: '2026-09-07T09:45:45.067Z'
transitions:
  - status: in-progress
    at: '2026-09-07T08:54:17.958Z'
  - status: complete
    at: '2026-09-07T09:26:34.690Z'
  - status: in-progress
    at: '2026-09-07T09:31:37.497Z'
  - status: complete
    at: '2026-09-07T09:45:45.067Z'
completed_at: '2026-09-07T09:26:34.690Z'
completed: '2026-09-07'
---

# 消费积分与独立积分商城

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-07

## Overview

实付100元得1积分，只记整数；消费积分流水、独立商品库存、兑换订单及商城管理台运营。

## Design

- 已确认：每笔实付 100 元获得 1 积分，只记整数。采用向下取整；99.99 元得 0、199.99 元得 1、200 元得 2。不累计零头。
- 支付成功时发放，覆盖商城、DIY、预约、咨询的现有支付入口；积分兑换不产生消费积分。
- 退款成功按支付单累计净实付重算，已发减应得即扣回积分；已花积分允许形成负余额，后续兑换必须余额足够。迁移前支付不补发积分。
- payment-service 持有独立 points_account、points_ledger、points_payment_award、points_product、points_order 表。现金商品、库存、订单和经营报表均不混用。
- 商品独立名称、分类、图片、详情、整数积分价格、库存、上下架；在商城管理台“积分商城”统一运营。
- 兑换只支付积分，每次兑换一种商品，可选数量及收货地址；后端复核当前价格和库存，同一事务扣积分、扣库存、创建订单和流水。
- 兑换状态：pending → shipped → completed；pending 可取消，积分与库存原路退回；无现金补差、无现金退款。
- 以用户 + 请求编号保证兑换幂等；运营编辑以 version 防止覆盖并发库存变动；服务端 JWT 与商城角色校验。

## Plan

- [x] 接管两个既有任务并核对四仓库起始工作区
- [x] 数据迁移、积分账本、支付和退款事务
- [x] H5 与 iOS 积分入口、明细、商品兑换和兑换记录
- [x] 商城管理台独立商品、发货及报表
- [x] 集成验证与交付说明

## Test

- 单元测试覆盖 100 元整数门槛、非法价格/库存/图片地址。
- 独立 MySQL 验证迁移重复执行、支付发积分幂等、8 并发重复兑换、库存最后一件竞争、版本冲突、越权取消、退款负余额、取消重复提交与事务回滚。
- H5、商城管理台生产构建；iOS CocoaPods workspace 无签名编译；接口角色验证。

## Notes

本功能已于 2026-09-07 部署 ECS。先执行 scripts/db/20260907_points_mall.sql，再部署 payment-service（HTTP 与 RPC）、gateway 和前端；详见下方 ECS 验收记录。

## 本地验收记录（2026-09-07）

- payment-service 与 gateway-service Go 测试通过；积分用户/管理路由 JWT 角色隔离测试通过。
- 独立 MySQL 8.0：迁移重复执行、消费积分幂等、8 并发重复兑换、最后一件库存竞争、库存版本冲突、跨用户取消拒绝、部分退款负余额、取消幂等与事务回滚通过。
- 实际 PaymentModel/RefundModel 的支付成功获积分与退款成功扣回、重复调用及非法状态回退测试通过。
- 发货履约：积分不足拒绝、用户不能发货、未发货不能确认收货、重复发货保持运单号、已发货不能取消、确认收货通过。
- H5 与商城管理台生产构建通过，iOS CocoaPods workspace arm64 无签名编译成功。
- Playwright 3 项通过：H5 375/768 视口兑换取消、商城台商品新增和发货；浏览器用受控接口数据，数据库事务另行真实测试，未执行生产支付闭环。
- 复现入口：后端 `bash scripts/test-points-mall.sh` 自动创建并清理隔离数据库；前端 `npx playwright test -c playwright.points.config.ts`。包装脚本已做语法检查，其内部数据库测试命令已分别执行通过。
- 本地验收阶段尚未向 ECS 发布；后续 ECS 发布记录如下。

## ECS 发布与验收（2026-09-07）

- 目标：root@101.96.228.71，主机 iv-yes4e0oz5st56onbh8bf。发布版本：20260907-points-v1。
- 页面目录：/var/www/askxuan/releases/20260907-points-v1/public；当前 /var/www/askxuan/public 已原子切换到该目录。
- 新建 5 张积分表，既有现金商品、库存、订单表没有因迁移而修改。迁移在 ECS 同一个 MySQL 镜像的隔离容器中重复执行两次通过。
- payment-service（含 HTTP/RPC）和 gateway-service 已重建并定向重启，均 healthy；其余业务服务保持运行。
- 支付镜像：sha256:52d8a895eb639cc8ed452bc55c63f5f558d06d5930e01f2d734d35642a7b7f53。网关镜像：sha256:f5e4636126d505b1a8aa72ca055cd286ffce1fac97089574377a470441b96b8d。
- 备份：/opt/askxuan/backups/20260907-points-v1，含 payment-before.sql、旧源码、旧网关配置、manifest.json、发布日志和线上验收结果；旧镜像均保留 rollback-20260907-points-v1 标签。
- 页面回滚版本：/var/www/askxuan/releases/20260904-145729-five-ui-responsive-v5/public。
- 公网 API 16 项通过：匿名/角色隔离、专用账户登录、积分商品上架、积分不足拦截、现金订单实付 200 元、获得 2 积分、支付幂等、并发兑换幂等、现金与积分库存独立、取消幂等退回、退款扣回、完整流水和独立报表。
- 真实登录态浏览器通过：H5 /c/points（390px，无溢出/JS异常）与商城管理台 /shop/points-mall（独立积分商品可见，无JS异常）。
- 验收专用账户 userId=8，积分余额 0 → 2 → 1 → 2 → 0；兑换单已取消，支付已退款，验收商品均下架。保留明确标记为验收的订单和流水作为审计证据。
- 当前 ECS 沿用原有 mock 支付 Provider；本次验证不是微信/支付宝真实扣款。iOS 代码已构建通过；原生客户端需重新安装对应构建才会出现新页面。
- ECS 发布发生在 Git 归档之前；实际部署源码以备份内 manifest.json 的 SHA-256 清单为准。

## Git 归档（2026-09-07）

- 后端 main：0b32013，整数消费积分、退款扣回、独立积分商城及事务测试。
- 前端 master：071721d，iOS 积分中心、商城管理台与端到端测试。
- H5 main：06b9e0b，积分余额、明细、兑换与取消。
- 文档提交包含本规格、API 契约、LeanSpec 配置及 ECS 发布验收记录。
