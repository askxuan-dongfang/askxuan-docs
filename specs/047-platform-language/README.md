---
status: complete
created: '2026-10-19'
tags:
  - frontend
  - ios
  - macos
  - i18n
priority: high
created_at: '2026-10-19T00:21:17.805Z'
updated_at: '2026-10-19T01:36:37.000Z'
transitions:
  - status: in-progress
    at: '2026-10-19T00:22:07.443Z'
  - status: complete
    at: '2026-10-19T01:36:37.000Z'
completed_at: '2026-10-19T01:36:37.000Z'
completed: '2026-10-19'
---

# 全产品简繁中文与系统语言偏好

> **Status**: ✅ Complete · **Priority**: High · **Created**: 2026-10-19 · **Tags**: frontend, ios, macos, i18n


## 目标与范围

问玄东方各产品形态与已有外观偏好保持一致，提供「跟随系统 / 简体中文 / 繁體中文」三项界面语言设置。当前不增加英文等其他语言。

覆盖信众/法师 H5（含 PWA）、信众/法师原生 iOS、统一运营后台（含商城）、寺院后台、Mac 管理台，以及原生聊天内嵌 H5。旧商城入口继续迁移到统一后台。

## 规则

- 默认跟随系统；系统偏好列表中首个受支持的中文语言生效。显式 Hans/Hant 优先于地区；TW/HK/MO 使用繁体，CN/SG 等使用简体；无受支持中文时回退简体。
- 用户手动选择覆盖系统，切回「跟随系统」重新自动匹配。语言与浅色/深色/系统外观独立。
- Web 在同源标签间同步，在语言变化事件后更新；原生在系统 locale 变化和回到前台时刷新。
- 偏好保存在当前浏览器/设备，退出登录不丢失；暂不做跨设备账号同步。
- 修改语言保留当前路由、登录态、表单草稿和焦点。输入值、业务标识、接口 payload、用户原文与已生成 AI 内容不作翻译。

## 实现

- `packages/localization` 维护语言协议、简繁文案目录、字典生成器与测试；独立 H5 保存同版本镜像，不依赖未发布父仓。
- React 使用明确的文本查表和订阅；Vue 使用响应式 `$t` 与 Element Plus locale；SwiftUI 使用可观察偏好及明确的显示层本地化。
- 不使用 DOM 文本重写，不以重载页面/重建视图作为语言切换手段。
- Mac 将语言偏好在两个独立 WebKit 数据仓库与原生菜单间同步，仅接受同源主框架消息；iOS 聊天 WebView 同步宿主当前语言。
- 日期控件和显示格式跟随语言；币种、时区和业务时间戳语义不变。

## 验收

- [x] 语言解析、手动覆盖、无效持久值、存储不可用、系统事件、跨标签同步的自动测试。
- [x] H5 类型检查，H5/运营后台/寺院后台生产构建。
- [x] 两个 iOS 模拟器构建、Mac 构建。
- [x] Ego Lite 本地实际切换、登录草稿保留、跨标签同步、390px 无整页横向溢出。
- [x] Mac 原生语言解析和原有门户隔离测试。
- [x] 两个 iOS 在专用模拟器实际切换与进程重启记忆检查。
- [x] Git 推送、Web/H5 ECS 发布及线上入口核验。

## 证据边界

本地界面测试的业务接口未接入真实服务，不能替代业务验收。线上已验证语言设置相关行为，未重新执行交易、抽奖、真实 IM 等全量业务验收。

原生 UI 自动化 Runner 在开始测试前停滞并中止，不能记为通过；随后使用 Computer Use 完成两个 iOS 的实际切换与进程重启检查。Mac 构建与 5 项原生测试通过；新包的原生菜单/WebView 联动 UI 未单独验收，现有用户运行实例保持原样。未执行真机安装、TestFlight/App Store 发布及 Developer ID 公证。

## 最终版本与发布

- frontend/master：`884facd3d1c74b07545a99b212b151d37c0f441e`。
- H5/main：`7c6f5844993a9201727f2b0b2d25a5273b4d214e`。
- [后台 CI](https://github.com/askxuan-dongfang/askxuan-frontend/actions/runs/39184499928) 99 项浏览器回归通过，部署 `ci-web-39184499928-1-884facd3d1c7`。
- [H5 CI](https://github.com/askxuan-dongfang/askxuan-h5/actions/runs/39184565052) 80 项浏览器回归通过，部署 `ci-h5-39184565052-1-7c6f5844993a`。GitHub artifact 配额不足后使用已有恢复发布流程，同 runner 完成构建、回归和受限接收验证。
- ECS 三个 Web 组件来源与最终提交一致，13 个 HTTPS 页面及资源文件校验和匹配；后端服务无变更。
- Ego Lite 线上后台、寺院、信众/法师 H5 语言入口、简繁切换、偏好记忆与 390px 布局检查通过；登录态与路由保留，测试后恢复系统语言偏好。
- 本地证据：`artifacts/history/2026-10/platform-language-20261019/` 与 `artifacts/native/2026-10/platform-language-20261019/`，均相对 DongFang 工作区根目录，仅本地保留。
