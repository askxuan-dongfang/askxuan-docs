# GitHub Actions 与 ECS 发布

## 日常开发

| 仓库 | 自动发布分支 | 构建内容 |
| --- | --- | --- |
| askxuan-backend | main | 20 个 Go 服务，按服务源码指纹更新变化的容器 |
| askxuan-frontend | master | 平台管理台、商家兼容入口、寺院端；仅 Web/共享包/脚本/工作流改动触发 |
| askxuan-h5 | main | H5；同时记录构建使用的前端共享包提交 |

本地提交并推送以上分支即可。后端 develop 和 PR 只检查；iOS 单独改动不部署网站。

流程：GitHub checkout 精确提交 → 严格检查 → GitHub Runner 编译 → 带 SHA256 清单的短期 artifact → production 环境 → 受限 SSH 上传 → ECS 全局发布锁 → 校验提交祖先/文件完整性 → 切换容器或静态目录 → 健康检查，失败回滚。

ECS 不执行 git fetch/pull，也不接收开发电脑的未提交源码。Go 二进制和前端 dist 都在 GitHub 编译。ECS 只为二进制添加固定运行镜像层并启动容器；生产配置、数据库和卷维持原位置。`/opt/askxuan/backend` 中的历史源码不再作为发布输入；当前版本以 `/opt/askxuan/ci/state.json` 为准，旧 runtime/release.txt 只用于历史追溯。

H5 是独立私有仓库且禁止 Deploy Key。管理端不读取私有 H5 源码。H5 自己的工作流读取公开 frontend/master 的共享包，发布清单记录两个仓库的确切 SHA；共享包单独变更后执行：

    gh workflow run release.yml --repo askxuan-dongfang/askxuan-h5 --ref main

每个仓库的 Actions 页面也有 Run workflow / Re-run jobs。不要从其他分支部署生产。仓库内并发设置不取消正在发布的任务；服务器 `/opt/askxuan/ci/publish.lock` 跨三个仓库串行发布。逐组件祖先校验拒绝陈旧或分叉版本，因此不应 force-push 发布分支。

## 配置和权限

- 三仓库变量：`ECS_HOST`、`ECS_DEPLOY_ENABLED=true`。
- 三仓库 production 环境秘密：`ECS_DEPLOY_KEY`、`ECS_KNOWN_HOSTS`。环境限定 main 或 master 分支。
- 每个仓库使用不同部署密钥；SSH 用户 `askxuan-ci` 只能调用 root 所有的接收器及该仓库的固定组件范围，不能获得普通 shell、SCP、端口转发或任意 sudo。
- `/usr/local/sbin/askxuan-ci-receiver` 是经过审阅、单独安装的脚本。发布包不能更新它。
- 发布逻辑源文件在 backend 的 `scripts/ci/`。前端工作流引用后端工具的固定提交；升级工具需要显式更新两个工作流中的 ref，接收器变更还需运维安装。
- 不复用个人 GitHub Token 或人工 root SSH 私钥。GitHub 构建缓存和产物不包含生产环境变量。

## 数据库迁移、配置与运行镜像

`/opt/askxuan/ci/config.json` 保存 `backend_contract`，覆盖 `db/`、`scripts/db/`、20 个服务的 etc 模板和 Dockerfile。它是已审阅源码基线，不是“全部 SQL 已执行”的账本。

这些路径变化时接收器在切换容器前拒绝自动部署。由运维先审阅 SQL、备份对应数据库，使用既有部署流程执行所需迁移/更新实际配置，验证成功后再更新基线并重跑 CI。不得执行全量 init.sql、重置数据库或仅为让 CI 变绿而放宽基线。

在目标后端提交的干净 checkout 中计算新值：

    python3 scripts/ci/release.py contract

服务运行配置来自当前容器绑定目录 `/opt/askxuan/backend/.docker/etc/`；CI 不覆盖密码、挂载、端口或 OpenIM/RenewNote 服务。运行镜像的 `ci-runtime-base` 标签固定自首次接管的运行环境，保留 file-service 的数据库客户端等依赖；基础镜像安全更新须单独审阅构建、更新该标签，再重新发布。

## 发布记录与故障恢复

- 当前组件 Git SHA：`/opt/askxuan/ci/state.json`。
- 每次发布：`/opt/askxuan/ci/releases/<release>/manifest.json`、`transaction.json`。
- 后端还保留 `compose.json`、`rollback.json` 和构建日志；这些文件可能含生产环境变量，仅 root 可读，不要贴到公开工单或 Actions 日志。
- 静态站点：`/var/www/askxuan/public` 原子指向版本目录。发布 H5 保留 admin/shop/temple；管理端发布保留 H5。
- 完成发布后删除冗余上传包和二进制副本，保留镜像/清单/回滚目录；磁盘不足 3 GiB 时拒绝发布，避免挤占运行空间。

新版本健康检查或 HTTP 内容校验失败，会恢复此次变更涉及的旧容器或静态软链接。回滚不会反向执行数据库迁移。

需要主动回滚时，先将三仓库 `ECS_DEPLOY_ENABLED` 改成 false，确认没有正在执行的部署，再在 ECS 以 root 执行：

    /usr/local/sbin/askxuan-ci-receiver --rollback <state.json 中的 last_release>

该命令共用发布锁，只允许回滚最后一次全局发布，避免覆盖之后其他仓库的成果。重跑流水线前恢复变量。若 `transaction.json` 停留在 preparing/switching 阶段（例如进程被强制终止），后续发布会暂停；先检查日志、容器和 previous_public，完成恢复并核对状态，不能直接删除事务记录。

旧人工部署脚本保留用于专项迁移和救援。使用这些脚本前暂停自动发布，执行时持有同一个 publish.lock，完成后核对 CI 组件状态；日常代码发布统一走 Actions。

## 首次接管修正记录

2026-09-11 首次后端接管时，Compose 对复制自容器的 `${BINARY}` 命令进行了提前插值，导致服务启动失败。已恢复原镜像和配置，随后在接收器提交 `679da48` 中对 Compose 字符串统一转义美元符号；真实 ECS Compose 容器往返验证和对应回归测试均通过。不要安装更早版本的服务器接收器。前端固定引用的后端工具提交仅用于构建与 SSH 客户端，不负责安装接收器。


## 2026-09-13 品牌发布与清单类型修正记录

Web `ci-web-34706515528-1-8df155727224`、H5 `ci-h5-34706677301-1-9e3a8457144c` 已由既有接收器发布；GitHub 构建和测试通过，自动上传因连接慢被取消。经校验转送的是同次 CI 原始包，实际 deployed 回执不将 workflow 的 cancelled 改写为 success。

发布后发现两角色 webmanifest 的 MIME 不正确，已在独立后端分支提交 `2c3c95c149c1f5c48bcdfcd34e8b498aae9ab0c0`，通过既有 `scripts/ops/refresh-h5-html-cache.sh` 备份、配置测试和 reload 应用；没有重发业务服务。两条精确 manifest location 返回 `application/manifest+json` 并禁止旧缓存。备份为 `/opt/askxuan/backups/20260913-brand-manifests-2c3c95c`。

该次验收时[草稿 PR #1](https://github.com/askxuan-dongfang/askxuan-backend/pull/1)尚未合并；后续重装 Nginx 前必须核对实际合并状态和配置来源，不能假定 backend/main 已含修复。细分验证与限制见[产品与文档核验](../reports/2026-09-13-产品与文档核验.md)。本地清理保留原始发布包/回执，ECS 历史运行源码与本地副本不是互相替代的部署凭据。
