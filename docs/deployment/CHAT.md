# 咨询聊天发布与验收

2026-09-12 的发布范围为真人咨询与预约消息、H5 页面和双 iOS 聊天接入。用户明确选择暂不开通公网通话，生产环境不得设置 `CHAT_TURN_URLS` / `CHAT_TURN_SECRET`，本次没有新增公网端口。

## 数据与运行环境

- `scripts/db/20260912_chat_experience.sql` 是增量、可重复执行迁移。先备份 `askxuan_booking` 与 `askxuan_message`，再迁移；不能执行全量初始化 SQL。
- 业务库先接受消息，再通过 OpenIM outbox 通知；“已发送”表示服务器已保存。“已读”来自对方的业务读取游标，不表示 OpenIM 的送达状态。
- 同一个 `clientMessageId` 的重试只返回原发送人的原始消息，不创建重复消息或覆盖内容。
- 图片、语音、视频、文件均走已鉴权的会话附件接口，单文件 20 MiB。宿主机 `/opt/askxuan/storage/chat` 持久挂载到 booking 容器 `/var/lib/askxuan/chat`，目录归 UID 1000，权限 0700。
- booking 的 `MaxBytes=23068672`、`Timeout=120000` 允许移动网络上传；入口代理保持原有上传限制。附件访问必须经过 JWT 与参与人校验，不能通过静态站点公开。
- 未发送的附件草稿六天后不可再次发送，七天后清理；已发送附件和消息历史保留。已结束通话的 SDP/ICE 在一天后清理。
- booking 禁用 SQL 正文调试日志，避免将咨询消息写入日志。
- 公共 IM 凭据缓存支持并发保护和失效刷新；H5 申请平台 5 的 OpenIM 令牌，原生端保留平台 1，避免平台混用。

## iOS 通知配置

双端已有真实 APNs 设备注册、注销、权限提示、会话跳转及原生附件分享。服务端使用签名后的 HTTP/2 APNs 请求，通知正文不包含咨询内容。消息通知有效期最多一天，来电邀请十秒后失效。

上线真实推送仍需外部配置，不能把代码构建成功等同于推送验收：

- Apple Developer `.p8` 文件、Key ID、Team ID。
- 在 booking 容器只读挂载私钥，并设置 `APNS_KEY_FILE`、`APNS_KEY_ID`、`APNS_TEAM_ID`。私钥不得进入 Git、构建产物或对话内容。
- 用户端 bundle 为 `com.dongfang.customer`，师傅端为 `com.askxuan.master`；两端签名与 App ID 需启用 Push Notifications。
- Debug 为 sandbox，Release 为 production；必须使用相应签名的真实设备验证权限、锁屏提醒、点击跳转、注销解绑和无效设备回收。
- 当前没有 Apple 密钥配置或真机通知成功的验收证据。来电使用普通通知和前台来电界面；不包含 PushKit / CallKit，也未验证系统后台持续通话。

## 验收证据与边界

- 社区与认证回归：17 项通过，保留访客鉴权、未读语义、失败重试与 Markdown 安全检查。
- H5 自动化：11 项通过，覆盖用户/师傅、375/430/768 宽度、发送结果不确定后的幂等恢复、草稿、历史滚动、已读位置、图片与大图关闭、真实浏览器录音、双浏览器 WebRTC 媒体与挂断。
- 数据库：独立随机 `askxuan_chat_test_*` 库测试通过，含 16 并发去重、IM 故障恢复、125 条历史分页、未读游标、附件权限、信令权限/去重与过期释放。测试库已删除，没有向真实用户发送测试消息。
- 迁移：在两个独立随机库执行两遍成功，测试库已删除。
- 共同包：OpenIM 合约、凭据并发刷新和 APNs 请求/无效令牌分类测试通过。
- iOS：用户端、师傅端 Debug / iOS Simulator 目标 `xcodebuild` 成功。这不代表已安装到用户手机，也不代替真机 APNs 或 WebKit 媒体验收。
- 公网 TURN 未启用，浏览器通话证据来自隔离信令与本机媒体连接，不能称为公网通话验收。

日常发布继续通过 [GitHub Actions](GITHUB-ACTIONS.md)。配置/迁移经核实后才更新 ECS `backend_contract`；代码通过主分支 CI 编译、上传、健康检查与自动回滚，不从开发电脑同步未提交源码。

## 本次运行准备记录

备份与可回滚配置：`/opt/askxuan/backups/chat-20260912T151319`。包含迁移前两个数据库、原 booking 配置、容器回滚清单和原 CI 合约配置，文件仅 root 可读。实际附件卷已准备并验证 booking 服务健康。生产没有启动 TURN；Apple APNs 私钥仍未配置。

## 2026-09-12 实际发布结果

| 范围 | 源码 / 发布标识 | 实际结果 |
| --- | --- | --- |
| 后端 20 个服务 | `2af992a6c2c3` / `ci-backend-34681043352-1-2af992a6c2c3` | CI build、test、vet 通过；原始 CI 产物补发成功，20 个服务健康 |
| H5 聊天 | `4f0e39884b37` / `ci-h5-34681650217-1-4f0e39884b37` | CI 的 17 项社区回归与 11 项聊天检查通过，自动发布成功 |
| Web 管理端 | `b35be5988afe` / `ci-web-34681261292-1-b35be5988afe` | CI build 通过，SSH 连接超时；原始 CI 产物补发成功 |
| 双 iOS | 聊天提交 `6ec96daa1fd0` | 已推送并通过双端模拟器目标构建；未安装到真机 |

GitHub runner 到 ECS 的后端上传过慢，旧尝试仅传入部分压缩包。停止自动上传后，使用 `gh run download` 下载同一次 CI 的 `ecs-release`，逐文件校验 manifest，再经本机 SSH 中转到现有 `/usr/local/sbin/askxuan-ci-receiver`。没有从本地源码重新编译生产包；接收器原有发布锁、版本祖先校验、配置合约、文件哈希、健康检查及失败回滚均保留。后端 run 的最终状态为 cancelled，Web run 为 failure，不能把补发成功描述成这两个 workflow 全绿。

原始归档 SHA-256：

- backend: `5ffb3b643fef6b605b8c54f9ac834fc3630cf67ca91af062f073a2973a5cc51a`
- h5: `6af849ab14713eae909721a370d1702e316eb03558e2a6821684d083d03468af`
- web: `38befb7dd441ea25cb64e226d0cec5ab34eafde92ea2786d3561ffa92677286d`

另一项主题优化随后将 H5 更新为 `386149d62d28`，发布为 `ci-h5-34682348955-1-386149d62d28`；Web 更新为 `a8c48f4821b5` / `ci-web-34682713968-1-a8c48f4821b5`。已核验它们包含本次聊天提交，保留这些版本，不回退或覆盖主题工作。前端主仓库同样合并了聊天提交，开发目录已快进到已发布的远程主线。逐文件核验当前 H5 196 个、admin 132 个、shop 6 个、temple 57 个文件与对应 CI 清单一致，HTML 返回 no-store / no-cache。

上线后只读检查使用不对应真实账号的短期合成身份，不创建用户、消息、已读游标或设备绑定。普通列表、仅看未读、搜索与仅看未读组合、未读总数和前台来电查询通过；无令牌访问被拒绝。375/768 两种宽度的线上访客入口无脚本异常或横向溢出，且未请求受保护的聊天 API。35 个容器运行，20 个业务服务健康，OpenIM core/bridge 均 active。

## 生产资料读取权限

线上搜索检查暴露了最小权限账号与测试环境的差异：`booking_user` 无法读取 `askxuan_user.user`，搜索接口返回 50001；对端昵称、头像查询也会回退为默认值。所需范围仅为以下列级只读权限，不能授予整库权限或额外写权限：

```sql
GRANT SELECT (id,nickname,avatar) ON askxuan_user.user TO 'booking_user'@'%';
GRANT SELECT (id,dharma_name,avatar) ON askxuan_master.master TO 'booking_user'@'%';
```

首次执行被自动审批以持久权限变更为由拦截。用户随后明确授权上述两组列级只读权限，现已执行。执行前的 `SHOW GRANTS FOR 'booking_user'@'%'` 已保存为私有备份目录中的 `booking-profile-grants-before.sql`，实际授权语句保存在 `booking-profile-grants-applied.sql`。回退时以原权限快照为依据，只撤销本次新增的列权限，避免移除已有授权。

授权后，以真实运行账号 `booking_user` 验证两组资料列 `SELECT ... LIMIT 0` 成功，同时 `mobile` 列访问继续被拒绝，未读取个人资料记录。线上搜索与未读组合查询返回 code=0，其他列表、未读及访客鉴权复测通过。该检查补充了使用独立测试库时未覆盖到的生产账号权限差异。

APNs 尚未配置。后续启用时还需按实际查询核实 `device_token` 的列级 SELECT 和仅 `status` 列的 UPDATE 权限，再进行真机验收；本次未提前扩大这些权限。
