# MQ 可靠投递、监控与故障演练

> 更新日期：2026-09-03
> 适用范围：booking-service、payment-service、diy-service 与 order-service

## 1. 可靠性口径

预约、即时咨询、支付、退款、DIY 加持派单和 DIY 发货事件先写入各业务库 `event_outbox`，再由 relay 发布到 RabbitMQ。事件使用稳定 `event_key` 去重；relay 每 2 秒扫描一次，使用条件更新抢占任务，失败按平方秒退避，最多重试 12 次，超过后标记 `dead`。处理进程中断超过 2 分钟的 `processing` 记录会自动回到 `pending`。

业务状态落库后、outbox 写入前仍存在极短的进程崩溃窗口，因此各服务每 30 秒从自己的事实表扫描缺失事件。扫描使用 `LEFT JOIN event_outbox ... WHERE e.id IS NULL`，按最旧记录分批补齐，不受单批 1000 条限制。商城退款请求已有“退货状态 + outbox”同事务写入，继续使用 order-service 原有 outbox。

首次在已有数据库启用时，必须先执行 `scripts/db/20260903_reporting_outbox.sql`。迁移会把启用前已经存在的预约、咨询、支付、DIY 派单和发货事实登记为 `sent` 基线，避免历史通知被重新广播；`INSERT IGNORE` 不会覆盖部署期间已由新代码写入的 `pending` 事件。基线完成后产生的新事实才由事务 outbox 和补偿扫描负责投递。

当前保证为至少一次投递。消费端必须继续按业务单号、状态机和唯一键幂等处理，不能依赖 RabbitMQ 恰好一次。

## 2. 覆盖事件

| 事实源 | 稳定事件键 | 交换机 | 说明 |
|---|---|---|---|
| `booking_status_log` | `booking:{bookingNo}:{action}` | `booking.events` | 创建、确认、完成、评价、取消等 |
| `consultation_order` | `consultation:{orderNo}:paid` | `consultation.events` | 即时咨询支付成功 |
| `payment` | `payment:{paymentNo}:{status}` | `payment.events` | success/failed/refunded |
| `refund` | `refund:{refundNo}:{status}` | `payment.events` | 结构化退款完成事件 |
| `blessing_task` | `diy:blessing:{taskNo}:dispatch` | `blessing.events` | DIY 加持派单 |
| `diy_order` | `diy:order:{orderNo}:shipped` | `order.events` | DIY 发货后创建物流 |
| `return_order` | order-service 原有聚合键 | `order.events` | 商城退款请求，同业务事务写入 |

寺院分配法师、法师完成加持、通用评价、审核结果、财务通知和物流签收等生产者仍使用持久化 RabbitMQ 消息，但尚未全部迁入统一 outbox。它们属于下一批覆盖范围，不能据此宣称全平台 MQ 已达到同一可靠性等级。

## 3. 监控与告警

执行：

```bash
make monitor-runtime
```

脚本检查网关健康、RabbitMQ ping、askXuan 容器健康，以及 booking/payment/DIY 三库 outbox 的待处理数、死信数和最老消息年龄。默认阈值：待处理超过 20 条、最老待处理超过 120 秒或出现任何 `dead` 即返回非零。

可通过环境变量调整：

```bash
OUTBOX_PENDING_WARN=50 \
OUTBOX_AGE_WARN_SECONDS=300 \
ALERT_WEBHOOK_URL=https://example.invalid/webhook \
bash scripts/ops/monitor-runtime.sh
```

生产环境应由云监控或 systemd timer 每分钟执行，并以退出码接入告警；Webhook 只是可选通知通道，不替代主监控平台。

ECS 默认从 `/opt/askxuan/runtime/secrets.env` 读取当前 `APP_DB_PASSWORD`，避免依赖 MySQL 容器初始化后可能漂移的 root 环境变量；其他环境可用 `SECRETS_ENV` 指定受控密钥文件。脚本不输出密码。

## 4. RabbitMQ 中断演练

仅在测试环境执行：

```bash
make drill-mq-outbox
```

演练会停止 `askxuan-rabbitmq`，向 payment outbox 写入无业务副作用的 `drill.probe`，确认消息在 MQ 不可用时保留，再恢复 RabbitMQ 并等待记录进入 `sent`。脚本用 trap 保证异常退出时也尝试恢复容器。

通过标准：RabbitMQ 停止期间事件不丢失；恢复后 60 秒内自动投递；`dead=0`；网关和相关服务恢复健康。演练结束后还应运行付款、预约、DIY 发货和退款回归脚本，确认消费者无重复副作用。
