# 咨询聊天发布与验收

产品版本：**0.0.1**。当前包含真人咨询与预约消息、H5 页面和双 iOS 聊天接入。公网通话暂缓启用，当前生产配置不启用 `CHAT_TURN_URLS` / `CHAT_TURN_SECRET`；开放前需独立确认配置与跨网络验收。

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

## 验收要求与边界

- 使用隔离身份验证用户与法师消息、幂等重试、草稿、历史分页、已读、附件权限和来电状态，禁止向真实用户发送测试消息。
- 数据库测试覆盖并发去重、IM 故障补偿、读取游标单调、信令去重及到期释放；迁移需验证重复执行。
- 浏览器验证移动布局、录音/视频权限、关闭预览、断网重连及来电/挂断。隔离本机媒体连接不作为公网通话验收。
- iOS 分别记录无签名构建、签名安装、WebKit 媒体和 APNs 真机通知，不能相互代替。
- 当前 APNs 与公网 TURN/跨网络通话未完成放行，见[进行中的聊天需求](../../specs/024-chat-completeness-and-experience/README.md)。

日常发布通过 [GitHub Actions](GITHUB-ACTIONS.md)。迁移/配置经核实后才更新 ECS `backend_contract`；备份数据库、运行配置与权限快照，发布后核对服务健康、版本和附件持久挂载。

## 生产资料读取权限

对端资料和搜索需要 `booking_user` 具备以下列级只读权限；缺失时搜索可能失败、昵称或头像降级。配置应限制到实际查询列，不能授予整库权限或额外写权限：

```sql
GRANT SELECT (id,nickname,avatar) ON askxuan_user.user TO 'booking_user'@'%';
GRANT SELECT (id,dharma_name,avatar) ON askxuan_master.master TO 'booking_user'@'%';
```

变更前保存当前 `SHOW GRANTS`，按已批准范围执行。验证时使用运行账号检查这两组列的 `SELECT ... LIMIT 0`，并检查未授权列仍被拒绝；无需读取个人资料。回退依据原权限快照，只撤销新增权限。

APNs 启用前还需按实际查询核对 `device_token` 的列级 SELECT 和仅 `status` 列 UPDATE 权限，再做真机验收；不能仅为准备推送提前扩大整个用户库权限。
