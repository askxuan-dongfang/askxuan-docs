---
status: complete
created: '2026-09-10'
tags: []
priority: medium
created_at: '2026-09-10T06:18:28.916Z'
updated_at: '2026-09-10T09:15:41.793Z'
transitions:
  - status: in-progress
    at: '2026-09-10T06:19:01.594Z'
  - status: complete
    at: '2026-09-10T09:15:41.793Z'
depends_on:
  - 013-ai-experience-refresh
completed_at: '2026-09-10T09:15:41.793Z'
completed: '2026-09-10'
---

# 全产品字体与文字层级统一

> **Status**: ✅ Complete · **Priority**: Medium · **Created**: 2026-09-10

## 目标与覆盖

以 [AI 专题体验](../013-ai-experience-refresh/README.md) 为文字风格基准，统一全产品的字体族、字号角色、字重和数字排版。覆盖 C/M 两端 H5、平台/商城兼容入口/寺院管理端、C 端与大师端 iOS，以及保留的 React Native 移动入口。

## 字体规范

| 用途 | 字体与字重 | 基准字号 |
| --- | --- | --- |
| 品牌/专题主标题 | 宋体风格，600 | 24/28 |
| 区块/卡片标题 | 宋体风格，600 | 20/18 |
| 顶部导航 | 宋体风格，600 | 17 |
| 正文/长文 | 系统无衬线，400 | 14/16 |
| 主按钮/输入 | 系统无衬线，600/400 | 15 |
| 标签/说明 | 系统无衬线，400/500 | 13/12，紧凑标签 11 |
| 金额/积分/统计 | 无衬线等宽数字，500/600 | 按信息层级使用 18/24/36/48 |

- 字重收敛到 400、500、600；保留插图文字和图标本身需要的特殊尺寸。
- 标题行高 1.5、普通正文 1.7、长文 1.9；中文标题仅轻微字距，数字不增加字距。
- Web 本地提供 AskXuan Serif（Noto Serif SC 600，保留完整字库并重命名），再回退到系统宋体；正文使用平台系统无衬线。字体随应用发布，不依赖外站运行时请求，采用 WOFF2 压缩和 font-display: swap，下载时仍可阅读。
- iOS 在应用包注册相同 TTF，并通过 `UIFont` 检查注册结果；正文和数字使用公开的 Helvetica Neue 字体名称，避免私有系统字体名称导致 Times 回退。正文、控制项与主要标题支持相对系统文字尺寸；金额使用等宽数字。

## 实现与维护

- `packages/design-tokens/tokens.json` 定义共享字号、字重、行高和字体族。
- `node scripts/sync-typography.mjs` 生成共享 Web 变量及 H5 独立仓库镜像，并同步原生主要标题字号；`--check` 在管理端构建前检查漂移。
- H5 接入基础文字角色，清理页面中的默认 serif、混用字重及邻近字号；管理端统一共享组件和 Element Plus 弹窗/表单排版。
- 两套 iOS 的 `AppTypography` 提供同名角色和可用字体回退；原有共享标题、按钮、统计组件和专题页面统一接入。
- RN 用 expo-font 加载同一份 TTF，Metro 监测共享资源目录；保留系统正文与相同字号角色。
- 字体来源：[Google Fonts Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc)，SIL OFL 1.1。完整授权随原生资源、共享源码及四个 Web 的 `/fonts/OFL.txt` 分发；来源、改名和 SHA-256 记录在字体目录 README。

## 验证

- [x] H5 与三个管理端 TypeScript/Vite 构建。
- [x] React Native TypeScript 检查及 Expo iOS 离线资源导出。
- [x] 两套 iOS 模拟器构建。
- [x] 管理端原有 121 项迁移/权限/表单回归通过；使用隔离夹具。
- [x] AI 专题 7 项交互回归通过；使用隔离夹具。
- [x] H5 的旧通用夹具补齐 `/ai/topics` 和 `/orders/1/returns` 数组契约后，C/M 核心路由及窄屏金额、状态和业务编号检查通过。
- [x] 实际加载字体后的 H5 5 项回归通过（768 下专属 320 用例按设计跳过）；管理端 121 项通过，统计卡片调整后补跑 2 项首页回归，桌面/320 金额完整显示；AI 6 项通过，报告目录用例等待字体布局稳定后单独复跑通过。
- [x] 原生 320/390/768 中文与数字渲染测试通过；两套 iOS 构建通过，字体注册名称断言通过。
- [x] 截图复核：标题宋体、数字无衬线；修正管理端密集卡片中的金额折行。证据见 [iOS 390](../../assets/product-typography/ios-type-390.png)、[H5 专题](../../assets/product-typography/h5-ai-topic-375.png)、[管理端桌面](../../assets/product-typography/admin-desktop.png)。
- [x] 精确提交推送、ECS 四个 Web 客户端重新构建、线上字体验收。

## 发布边界

发布脚本 `scripts/ops/deploy-web.sh` 仅重新构建四个 Web 客户端，沿用现有服务和数据，保存原静态路径后原子切换。后端接口、活动配置、积分与履约数据不变。iOS 代码构建和模拟器验收不等于真机安装或商店发布。

## 发布记录

- H5 main：`d3b623c`（包含 `4c91a2a` 的统一规范及线上复核修正）；frontend master：`f1c00bb`，均已推送。
- ECS 发布前磁盘余量仅 289 MB；核对容器挂载后，清理三期旧发布的 12 个 Web `node_modules`（可从 lockfile 重建），恢复约 3 GB 空间；源码、在线静态站点、历史回滚文件、数据库和服务镜像保留。清理路径记录于 `/opt/askxuan/backups/20260910-typography-build-cache-cleanup.txt`。

- 线上复核发现积分余额单位因无效字体简写继承大字号，已修正积分/转盘的字体简写、单位字号和数值字体，并补跑 3 项 H5 窄屏回归全部通过。
- 四端首次构建发布为 `20260910-product-type-f1c00bb`；H5 追加发布为 `20260910-product-type-d3b623c-r2`，复用此前已验收的管理端构建。

- H5 追加构建需要前端仓库的 `packages/domain-status`，发布目录保留 `frontend/apps/web-h5` 层级并提取同一前端提交的共享包；缺少共享包的第一次构建失败在切换前，未影响在线版本。

- 线上浏览器验收：积分页 H1 为 24px 宋体，余额为系统无衬线约 48px，单位为 13px；八字专题主标题 28px/600、区块标题 20px/600，表单使用无衬线。仅进行只读浏览，没有扣分、生成报告或修改用户数据。
- H5/平台/寺院通过 HTTP 提供的 WOFF2 与发布文件 SHA-256 一致；Nginx 配置与网关健康检查通过。商城旧入口保持兼容跳转。
- 当前静态目录：`/var/www/askxuan/releases/20260910-product-type-d3b623c-r2/public`。本次发布前回滚基线保存在 `/opt/askxuan/backups/20260910-product-type-f1c00bb/previous-public`，H5 补发的直接上版保存在 `/opt/askxuan/backups/20260910-product-type-d3b623c-r2/previous-public`。回退时原子恢复对应软链接；源文件备份在同目录，业务服务与数据库无需回退。
