---
status: in-progress
created: '2026-11-06'
tags:
  - h5
  - quiet
  - release
  - 3d
priority: high
created_at: '2026-11-06T03:46:22.962Z'
depends_on:
  - 063-quiet-business-integration
updated_at: '2026-11-06T03:46:23.200Z'
transitions:
  - status: in-progress
    at: '2026-11-06T03:46:23.200Z'
---

# 园区视觉精修与生产上线

统一首页栏目和卡片边距，精修五区建模与庭院；准备独立房间服务和可回滚的生产发布。状态保持 in-progress，直到主分支合并、正式CI产物与真实上线验收都完成。

## Design

- 三个首页标题共用20px/600/30px、主题正文色与左边线；园区卡片沿用首页两侧留白。
- 原创资产版本2026.11.06.5：十二殿瓦垄、窗洞、梁架、PBR材质、13个GLB及13份Blender源；人物16骨/5动作，修正相向合十手掌。造像仍是风格化示意。
- 分区石铺与石径、院墙压顶、实例化植栽替换整块方格地面与大块山体；大雄殿始终详细加载，其余34进入/40卸载，内饰和阴影按距离控制，手机DPR1。
- quiet独立Go module、独立CI/scope与backend/quiet状态键；不加入go.work，不触发旧20服务输入指纹变更；现有backend配置契约保持c4193a348dd4b566155209dfa0b0ace141d13878f67e29ffce43e20305850fca。
- 首装仅新quiet_local库/受限quiet用户、独立带密码Redis及卷、固定摘要Alpine运行层；默认plan，明确apply才创建。密码仅从服务器受保护secrets.env读取后传给MySQL子进程，不读取到开发机或CI。
- 公网代理只到loopback18196；HTTPS origin精确白名单；跨域名共享WS400/IP40、保存POST全园60r/m/IP20r/m，429保留设备副本；健康Ping只允许loopback。阈值是beta保护边界，不是容量验收结果。

## Plan

- [x] 首页统一与真实数据下的320/390/435px明暗主题浏览器核验。
- [x] 五区资源、材质、动作与庭院精修；保留旧版回退和独立渲染QA。
- [x] 生产来源校验、存储前缀、独立CI、root模板/首装/回滚、Nginx代理与限流准备。
- [x] 提交受控分支和PR：backend#20、frontend#26、h5#22；完成必要源码审阅和本地测试。
- [ ] H5最终PR浏览器检查终态确认；正式main/main/master合并审批。
- [ ] 合并后固定main源SHA构建正式包，若仅artifact配额失败再启用严格SHA/工作流hash的私有同源relay。
- [ ] 安装审阅receiver与运行配置，独立服务→代理→H5依次发布，验正式源码/GLB字节、WSS双连接、记录和其他业务服务未变化。

## Test

已通过本地TypeScript、quiet协议/音频/运动/景观/分区/AI草稿、首页35项Playwright回归，以及Go race。发布/首装脚本30个测试、私有relay11个测试通过。资源QA验证13 GLB、16骨5clip、门宽/floor接口与38张渲染；同机20客户端90秒的最终全员姿态收敛结果沿用独立既有证据，不扩写成公网20设备或逐条快照100%送达。

新CI记录与浏览器证据保存在本地 `artifacts/history/2026-11/quiet-park-release-polish-20261106/`。PR构建是候选验证，不能替代默认分支正式CI包与生产验收。

## Notes

2026-11-06 自动审批拒绝直接向默认master推送：上线授权未明确允许直接推默认分支替代受控分支/PR流程。已采用独立分支与PR；未合并、未写生产应用/运行配置/数据库。准备完成后需明确批准PR合并和上线。

生产只读核验：新quiet数据库/用户均不存在，无askxuan-quiet容器，剩余7.4GB；既有MySQL容器环境中的root口令已漂移，实际使用项目既有服务器root-only secrets.env来源已完成只读核验，不重置任何口令。固定Alpine摘要在本机隔离容器验证CA/wget前提通过。

微信/iPhone真机性能、合法业务账号跨端历史及公网20设备仍未验收；不实现支付、成长值、分布式房间接管或自动删除永久历史。

最终后端候选ce827b4已通过完整13项检查（42164960046、42164960125）；共享前端c2f2f08通过42163570794；H5业务代码候选f0661a8通过42163684094，去除构建checkout凭据后的7de3735正在42164842680复验浏览器。后端只在本地mock及专用CI初始化测试数据，生产从未apply。
