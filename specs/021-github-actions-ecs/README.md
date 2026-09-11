---
status: in-progress
created: '2026-09-11'
tags: []
priority: high
created_at: '2026-09-11T00:52:52.293Z'
updated_at: '2026-09-11T00:52:52.923Z'
transitions:
  - status: in-progress
    at: '2026-09-11T00:52:52.923Z'
---

# GitHub Actions 自动构建与 ECS 发布

推送发布分支后在 GitHub 执行检查和编译，ECS 只接收构建产物并切换服务。

## 范围与设计

- 后端 main：20 个 Linux amd64 Go 服务构建、严格单元测试、vet；按源码指纹只重建变化的运行容器。
- 前端 master：管理台、商家兼容入口、寺院端；iOS 单独改动不触发 Web 发布。
- H5 main：独立构建 H5；共享包变化后手动触发 H5 workflow_dispatch 重建；记录 H5 和共享前端包的精确 Git SHA。
- PR 只执行检查。production 环境限定各自发布分支；每仓库独立 SSH 密钥，只能调用固定发布接收器。
- ECS 全局文件锁串行发布。逐组件校验祖先提交，拒绝旧任务覆盖新任务；静态站点以原子软链接切换。
- 保留当前 Docker 配置、数据挂载、环境变量及回滚镜像；新服务健康检查和公开接口检查失败自动回滚。
- SQL、服务配置模板、运行镜像基础定义发生变化时阻止自动发布，完成审阅和运维操作后才更新基线。不会执行初始化 SQL。

## 验证与进度

- [x] 合并 DIY 与社区分支，消除文档编号冲突并补齐 API 索引。
- [x] 发布接收器覆盖路径穿越、符号链接、陈旧版本、组件保留、前后端回滚测试。
- [ ] 三个仓库真实推送通过 GitHub 检查并自动部署。
- [ ] ECS 容器健康、静态文件身份和浏览器只读验收。

具体配置、迁移处理和回滚操作记录在 docs/deployment/GITHUB-ACTIONS.md。
