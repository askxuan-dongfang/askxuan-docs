# 问玄东方 · Go + go-zero 微服务后端开发入门指南

> 面向有其他语言编程基础、首次接触 Go 与 go-zero 的开发者。
>
> 项目「问玄东方」后端从 Java/Spring Boot 迁移到 **Go 1.22 + go-zero 微服务框架**，注册中心使用 **etcd**，共规划 **16 个业务微服务 + 1 网关 + 1 认证服务 = 18 个服务**。前端联调阶段可使用 Mock Server（Node Express，地址 `http://localhost:3001/api/v1`）作为占位。
>
> 本指南配套数据字典：6 寺院 / 6 法师 / 13 种用户端服务类型 / 4 项加持服务 / 14 种 DIY 手串材料。

---

## 目录

1. [环境准备](#1-环境准备)
2. [Go 语言核心](#2-go-语言核心)
3. [go-zero 框架核心](#3-go-zero-框架核心)
4. [goctl 代码生成](#4-goctl-代码生成)
5. [创建第一个服务实战（auth 服务）](#5-创建第一个服务实战auth-服务)
6. [数据访问层（model）](#6-数据访问层model)
7. [API 网关](#7-api-网关)
8. [服务间通信](#8-服务间通信)
9. [消息队列（RabbitMQ）](#9-消息队列rabbitmq)
10. [对象存储（MinIO）](#10-对象存储minio)
11. [与前端联调](#11-与前端联调)
12. [部署](#12-部署)
13. [调试技巧](#13-调试技巧)
14. [推荐学习资源](#14-推荐学习资源)
15. [问玄东方后端开发路线图](#15-问玄东方后端开发路线图)

---

## 1. 环境准备

### 1.1 安装 Go 1.22+

**Mac（推荐 Homebrew）：**

```bash
brew install go
```

**或官网下载：** 访问 https://go.dev/dl/ ，下载 `go1.22.x.darwin-amd64.pkg`（Intel）或 `go1.22.x.darwin-arm64.pkg`（Apple Silicon），双击安装。

验证：

```bash
go version
# 期望输出：go version go1.22.x darwin/amd64
```

### 1.2 配置环境变量

编辑 `~/.zshrc`（或 `~/.bash_profile`）：

```bash
# GOROOT 是 Go 安装目录（brew 安装通常无需手动设置）
export GOROOT=/opt/homebrew/Cellar/go/1.22/libexec
# GOPATH 是工作区目录（module 模式下作用弱化，但仍建议设置）
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin:$GOROOT/bin

# 开启 module 支持（Go 1.16+ 默认开启，显式设置更保险）
export GO111MODULE=on
# 国内加速代理（必须配置，否则拉依赖极慢）
export GOPROXY=https://goproxy.cn,direct
# 私有仓库（如有内部 GitLab，可加）
export GOPRIVATE=git.example.com
```

使配置生效：

```bash
source ~/.zshrc
```

### 1.3 安装 goctl 脚手架

goctl 是 go-zero 官方代码生成工具，能从 `.api` / `.proto` / SQL 一键生成服务骨架。

```bash
go install github.com/zeromicro/go-zero/tools/goctl@latest
```

验证：

```bash
goctl --version
# 期望输出类似：goctl version 1.6.x ...
```

### 1.4 可选 IDE

- **VS Code + Go 扩展**（免费，推荐）：安装 Go 扩展后，命令面板执行 `Go: Install/Update Tools` 全选安装。
- **GoLand**（JetBrains，付费）：开箱即用，调试体验最佳。

### 1.5 启动基础设施

项目根目录执行：

```bash
docker-compose up -d
```

依赖的基础设施（docker-compose.yml 中定义）：

| 组件 | 端口 | 用途 |
| --- | --- | --- |
| MySQL 8 | 3306 | 业务数据存储 |
| Redis 7 | 6379 | 缓存 / JWT 黑名单 |
| RabbitMQ | 5672（AMQP）/ 15672（管理台） | 异步消息（预约通知等） |
| MinIO | 9000（API）/ 9001（控制台） | 对象存储（图片/文件） |
| etcd | 2379 | 服务注册与发现 / 配置中心 |

验证 etcd 启动：

```bash
etcdctl --endpoints=http://localhost:2379 endpoint health
# 期望：localhost:2379 is healthy
```

---

## 2. Go 语言核心

> 本节面向有 Java/Python/JS 等语言基础的开发者，快速建立 Go 心智模型。

### 2.1 包与导入

每个 Go 文件第一行必须声明所属包。`package main` 是可执行程序的入口。

```go
package main

import (
    "fmt"           // 标准库
    "strings"       // 标准库
    "github.com/zeromicro/go-zero/core/logx" // 第三方
)
```

- 导入未使用的包会**编译报错**（不像 Java 允许未用 import）。
- 大写字母开头的标识符是**导出的**（public），小写是**包内可见**（private）。

### 2.2 变量与常量

```go
// var 显式声明
var name string          // 零值为 ""
var age int = 18         // 带初始值
var score = 95.5         // 类型推断

// 短变量声明 :=（只能在函数内用，最常用）
city := "杭州"            // 自动推断为 string
count := 0

// 常量
const Pi = 3.14159
const (
    StatusPending = "pending"
    StatusDone    = "done"
)
```

### 2.3 基本类型

```go
// 数值
var i int = 100
var f float64 = 3.14
var b bool = true

// 字符串
s := "问玄东方"

// 数组（固定长度，较少直接用）
arr := [3]int{1, 2, 3}

// 切片（动态数组，最常用）
list := []int{1, 2, 3}
list = append(list, 4) // 追加

// map（键值对）
m := map[string]int{
    "灵隐寺": 1,
    "少林寺": 3,
}
m["白云观"] = 2
v, ok := m["大昭寺"] // 双返回值：值 + 是否存在

// struct（结构体）
type Temple struct {
    Id   int64
    Name string
    Region string
}
t := Temple{Id: 1, Name: "灵隐寺", Region: "浙江杭州"}
```

### 2.4 控制流

Go **没有 while**，统一用 `for`。

```go
// if（条件无需括号）
if age >= 18 {
    fmt.Println("成年")
} else if age >= 12 {
    fmt.Println("少年")
} else {
    fmt.Println("儿童")
}

// if 可带初始化语句（常见用法）
if v, ok := m["灵隐寺"]; ok {
    fmt.Println(v)
}

// for 三种形态
for i := 0; i < 3; i++ { /* 经典 for */ }
for len(list) > 0 { /* 相当于 while */ }
for k, v := range m { /* 遍历 map/切片 */ }

// switch（默认 break，不向下穿透；需穿透用 fallthrough）
switch day {
case "周六", "周日":
    fmt.Println("周末")
default:
    fmt.Println("工作日")
}
```

### 2.5 函数

```go
// 多返回值（Go 特色，常用于返回 result + error）
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为 0")
    }
    return a / b, nil
}

// 命名返回值（可直接 return）
func split(sum int) (x, y int) {
    x = sum * 2 / 3
    y = sum - x
    return // 裸 return，返回 x, y
}

// 闭包
func counter() func() int {
    n := 0
    return func() int {
        n++
        return n
    }
}
```

### 2.6 指针

Go 指针受限，**不能做指针运算**（比 C 安全），主要用于避免大结构体拷贝和修改原值。

```go
x := 10
p := &x          // p 是 *int，指向 x
fmt.Println(*p)  // 解引用，输出 10
*p = 20          // 通过指针修改 x
fmt.Println(x)   // 输出 20

// 函数传指针才能修改原值
func inc(n *int) { *n++ }
```

### 2.7 结构体与方法

```go
type Master struct {
    Id    int64
    Name  string
    Title string
}

// 值接收者方法（不修改原对象，适合只读）
func (m Master) DisplayName() string {
    return m.Title + " " + m.Name
}

// 指针接收者方法（可修改原对象，适合修改或大结构体）
func (m *Master) SetTitle(t string) {
    m.Title = t
}
```

> **经验法则：** 一个结构体的方法尽量统一用指针接收者，避免混用导致接口实现混乱。

### 2.8 接口

Go 接口是**隐式实现**（duck typing），无需 `implements` 关键字。

```go
type Stringer interface {
    String() string
}

// 只要 Master 实现了 String() string 方法，就自动满足 Stringer
func (m Master) String() string {
    return m.Title + " " + m.Name
}

func print(s Stringer) {
    fmt.Println(s.String())
}
```

### 2.9 错误处理

Go **没有 try/catch**，错误通过返回值传递，惯用 `if err != nil`。

```go
result, err := divide(10, 0)
if err != nil {
    fmt.Println("出错：", err)
    return
}
fmt.Println(result)

// 自定义错误类型
type BizError struct {
    Code int
    Msg  string
}
func (e *BizError) Error() string {
    return fmt.Sprintf("[%d] %s", e.Code, e.Msg)
}

// errors.Is / errors.As（Go 1.13+）
var bizErr *BizError
if errors.As(err, &bizErr) {
    fmt.Println("业务错误码：", bizErr.Code)
}
```

### 2.10 并发：goroutine + channel + select

```go
// goroutine：用 go 关键字启动轻量级线程
go func() {
    fmt.Println("我在另一个 goroutine 里跑")
}()

// channel：goroutine 间通信
ch := make(chan int, 3) // 带缓冲
ch <- 1                  // 发送
v := <-ch                // 接收

// select：多路复用
select {
case v := <-ch:
    fmt.Println("收到", v)
case <-time.After(time.Second):
    fmt.Println("超时")
}
```

### 2.11 context

`context.Context` 用于在 goroutine 间传递截止时间、取消信号、请求级值。**所有 I/O 操作都应接收 context。**

```go
func fetchTemple(ctx context.Context, id int64) (*Temple, error) {
    // 2 秒超时
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    select {
    case <-ctx.Done():
        return nil, ctx.Err() // 超时或取消
    case r := <-dbQuery(ctx, id):
        return r, nil
    }
}
```

### 2.12 泛型基础（Go 1.18+）

```go
// 泛型函数：T 是类型参数，comparable 是约束
func Contains[T comparable](slice []T, target T) bool {
    for _, v := range slice {
        if v == target {
            return true
        }
    }
    return false
}

// 使用
has := Contains([]int{1, 2, 3}, 2)             // true
has = Contains([]string{"a", "b"}, "c")         // false
```

---

## 3. go-zero 框架核心

### 3.1 go-zero 是什么

[go-zero](https://github.com/zeromicro/go-zero) 是国内开源的微服务框架（好未来出品），核心特点：

- **代码生成**：goctl 从 `.api`/`.proto`/SQL 一键生成骨架，省去样板代码。
- **开箱即用**：内置服务发现、熔断、限流、链路追踪、日志、缓存。
- **中文文档友好**：官方文档 https://go-zero.dev 全中文。
- **高性能**：经过好未来大规模生产验证。

### 3.2 核心能力一览

| 能力 | 说明 |
| --- | --- |
| 服务发现 | 基于 etcd，自动注册与发现 |
| 熔断 | 内置断路器，错误率超阈值自动熔断 |
| 限流 | 内置 tokenlimit / periodlimit |
| 链路追踪 | 集成 OpenTelemetry / Jaeger |
| 日志 | logx 结构化日志 |
| 缓存 | sqlx + caching 自动 Redis 缓存 |
| 配置 | conf 包，YAML 配置 + etcd 配置中心 |

### 3.3 两种服务类型

- **API 服务（HTTP）**：对外暴露 RESTful 接口，用 `.api` 文件定义。网关和对外服务用这种。
- **RPC 服务（gRPC）**：服务间高性能通信，用 `.proto` 定义。内部调用用这种。

一个服务可同时是 API + RPC（如 auth 既是 HTTP 又对外提供 gRPC 供其他服务校验 token）。

### 3.4 项目结构约定

go-zero 单服务标准目录：

```
askXuan-backend/<svc>/
├── api/
│   └── <svc>.api              # 接口定义（goctl 源）
├── etc/
│   └── <svc>.yaml             # 配置文件
├── internal/
│   ├── config/
│   │   └── config.go          # 配置结构体（扩展自 rest.RestConf 等）
│   ├── handler/               # HTTP handler（goctl 生成，薄层）
│   ├── logic/                 # 业务逻辑（手写核心，goctl 只生成空壳）
│   ├── svc/
│   │   └── servicecontext.go  # 依赖注入容器
│   ├── types/
│   │   └── types.go           # 请求/响应类型（goctl 生成）
│   └── model/                 # 数据访问层 + sqlx
├── <svc>.go                   # main 入口
└── go.mod
```

### 3.5 配置：etc/<svc>.yaml + internal/config/config.go

**etc/temple.yaml：**

```yaml
Name: temple-service
Host: 0.0.0.0
Port: 8083

# etcd 服务发现（注册自己）
Telemetry:
  Name: temple-service
  Endpoint: http://localhost:2379

# 数据库
DataSource: root:123456@tcp(localhost:3306)/dongfang?charset=utf8mb4&parseTime=true&loc=Local

# Redis
Redis:
  Host: localhost:6379
  Type: node
```

**internal/config/config.go：**

```go
package config

import (
    "github.com/zeromicro/go-zero/core/stores/cache"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
    "github.com/zeromicro/go-zero/rest"
)

type Config struct {
    rest.RestConf
    DataSource string
    Redis      struct {
        Host string
        Type string
    }
    Cache cache.CacheConf
}
```

### 3.6 依赖注入：ServiceContext 模式

`ServiceContext` 是每个服务的依赖容器，在 main 中初始化一次，注入到所有 logic。

```go
package svc

import (
    "temple-service/internal/config"
    "temple-service/internal/model"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
    Config      config.Config
    TempleModel model.TempleModel
}

func NewServiceContext(c config.Config) *ServiceContext {
    conn := sqlx.NewMysql(c.DataSource)
    return &ServiceContext{
        Config:      c,
        TempleModel: model.NewTempleModel(conn, c.Cache),
    }
}
```

在 logic 中通过 `svcCtx.TempleModel.FindOne(...)` 调用，依赖清晰、便于测试。

---

## 4. goctl 代码生成

### 4.1 .api 文件语法

`.api` 文件是 goctl 的接口定义 DSL，包含 `syntax`/`info`/`type`/`@server`/`service` 五部分。

```
syntax = "v1"                       // 语法版本

info (                               // 元信息
    title:   "Temple Service"
    desc:    "问玄东方 寺院服务"
    author:  "dongfang"
    version: "v1"
)

type (                               // 类型定义（请求/响应/实体）
    Temple {
        Id         int64   `json:"id,string"`
        Name       string  `json:"name"`
        Region     string  `json:"region"`
        Sect       string  `json:"sect"`
        CoverImage string  `json:"coverImage"`
        Rating     float64 `json:"rating"`
    }
    ListReq {
        Sect string `form:"sect,optional"`
        Page int    `form:"page,default=1"`
        Size int    `form:"size,default=20"`
    }
    ListResp {
        Total int64    `json:"total"`
        List  []Temple `json:"list"`
    }
)

@server (                            // 路由分组与中间件
    group: temple
    prefix: /api/v1/temples
)
service temple-service {             # 服务名
    @handler list
    get / (ListReq) returns (ListResp)

    @handler detail
    get /:id returns (Temple)
}
```

**关键 tag：**
- `form:"xxx,optional"` — query 参数名，optional 可省
- `json:"xxx"` — JSON 序列化字段名
- `path:"id"` — 路径参数
- `header:"xxx"` — 请求头

### 4.2 生成 API 服务

```bash
goctl api go -api api/temple.api -dir .
```

生成 `internal/{handler,logic,svc,types}`、`etc/temple.yaml`、`temple.go`，可直接 `go run`。

### 4.3 生成 model

**方式一：从 SQL DDL 生成（推荐，离线）：**

```bash
goctl model mysql ddl -src schema.sql -dir internal/model -cache
```

**方式二：从数据源直接生成（连库）：**

```bash
goctl model mysql datasource \
  -url "root:123456@tcp(localhost:3306)/dongfang" \
  -table temple \
  -dir internal/model \
  -cache
```

`-cache` 启用 go-zero 内置缓存（自动 Redis）。

### 4.4 生成 Dockerfile

```bash
goctl docker -go temple.go -port 8083
```

生成 `Dockerfile`，多阶段构建（构建 + scratch/alpine 运行）。

### 4.5 生成 k8s 部署

```bash
goctl kube deploy -name temple-service -namespace dongfang -image temple-service:latest -port 8083
```

### 4.6 重新生成不会覆盖 logic（重要）

goctl 重新生成时：
- ✅ **覆盖**：handler、types、routes、svc 空壳
- ✅ **安全**：`logic/` 下已存在的文件**不会被覆盖**（只生成不存在的）

所以手写业务逻辑放在 `logic/` 是安全的。但若改了 `.api` 中某接口签名，对应 logic 文件需手动调整（goctl 不会覆盖但也不会自动改）。

---

## 5. 创建第一个服务实战（auth 服务）

本节从零创建认证服务，包含 login / refresh / logout 三个接口，签发 Access Token（2h）+ Refresh Token（7d）。

### 5.1 创建目录

```bash
mkdir -p askXuan-backend/services/platform/auth-service && cd askXuan-backend/services/platform/auth-service
```

### 5.2 编写 api/auth.api

```
syntax = "v1"

info (
    title:   "Auth Service"
    desc:    "问玄东方 认证服务"
    author:  "dongfang"
    version: "v1"
)

type (
    LoginReq {
        Mobile   string `json:"mobile"`
        Password string `json:"password"`
    }
    LoginResp {
        AccessToken  string `json:"accessToken"`
        RefreshToken string `json:"refreshToken"`
        ExpiresIn    int64  `json:"expiresIn"`
    }
    RefreshReq {
        RefreshToken string `json:"refreshToken"`
    }
    RefreshResp {
        AccessToken  string `json:"accessToken"`
        ExpiresIn    int64  `json:"expiresIn"`
    }
    LogoutReq {
        AccessToken string `json:"accessToken"`
    }
)

@server (
    group: auth
    prefix: /api/v1/auth
)
service auth-service {
    @handler login
    post /login (LoginReq) returns (LoginResp)

    @handler refresh
    post /refresh (RefreshReq) returns (RefreshResp)

    @handler logout
    post /logout (LogoutReq)
}
```

### 5.3 生成骨架

```bash
goctl api go -api api/auth.api -dir .
```

生成后目录：

```
askXuan-backend/services/platform/auth-service/
├── api/auth.api
├── etc/auth.yaml
├── auth.go
└── internal/
    ├── config/config.go
    ├── handler/{login,refresh,logout}handler.go
    ├── logic/{login,refresh,logout}logic.go
    ├── svc/servicecontext.go
    └── types/types.go
```

### 5.4 编写 etc/auth.yaml

```yaml
Name: auth-service
Host: 0.0.0.0
Port: 8081

# etcd 服务注册
Telemetry:
  Name: auth-service
  Endpoint: http://localhost:2379

# MySQL
DataSource: root:123456@tcp(localhost:3306)/dongfang?charset=utf8mb4&parseTime=true&loc=Local

# Redis（存 JWT 黑名单）
Redis:
  Host: localhost:6379
  Type: node

# JWT 配置
Auth:
  AccessSecret: "dongfang-access-secret-change-in-prod"
  AccessExpire: 7200        # 2 小时（秒）
  RefreshExpire: 604800     # 7 天（秒）
```

### 5.5 扩展 internal/config/config.go

```go
package config

import (
    "github.com/zeromicro/go-zero/core/stores/redis"
    "github.com/zeromicro/go-zero/rest"
)

type Config struct {
    rest.RestConf
    DataSource string
    Redis      redis.RedisConf
    Auth       struct {
        AccessSecret  string
        AccessExpire  int64
        RefreshExpire int64
    }
}
```

### 5.6 编写 internal/svc/servicecontext.go

```go
package svc

import (
    "auth-service/internal/config"
    "auth-service/internal/model"
    "github.com/zeromicro/go-zero/core/stores/redis"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
    Config    config.Config
    UserModel model.UserModel
    Redis     *redis.Redis
}

func NewServiceContext(c config.Config) *ServiceContext {
    conn := sqlx.NewMysql(c.DataSource)
    rds := redis.MustNewRedis(c.Redis)
    return &ServiceContext{
        Config:    c,
        UserModel: model.NewUserModel(conn),
        Redis:     rds,
    }
}
```

### 5.7 实现 internal/logic/loginlogic.go

```go
package logic

import (
    "context"
    "time"

    "auth-service/internal/config"
    "auth-service/internal/svc"
    "auth-service/internal/types"

    "github.com/golang-jwt/jwt/v5"
    "github.com/zeromicro/go-zero/core/logx"
    "golang.org/x/crypto/bcrypt"
)

type LoginLogic struct {
    logx.Logger
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
    return &LoginLogic{
        Logger: logx.WithContext(ctx),
        ctx:    ctx,
        svcCtx: svcCtx,
    }
}

func (l *LoginLogic) Login(req *types.LoginReq) (*types.LoginResp, error) {
    // 1. 查用户
    user, err := l.svcCtx.UserModel.FindOneByMobile(l.ctx, req.Mobile)
    if err != nil {
        return nil, err
    }
    if user == nil {
        return nil, errorx.New("用户不存在")
    }

    // 2. 校验密码（bcrypt）
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
        return nil, errorx.New("手机号或密码错误")
    }

    // 3. 签发 Access Token（2h）
    now := time.Now().Unix()
    accessClaims := jwt.MapClaims{
        "userId": user.Id,
        "mobile": user.Mobile,
        "exp":    now + l.svcCtx.Config.Auth.AccessExpire,
        "iat":    now,
    }
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessStr, err := accessToken.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
    if err != nil {
        return nil, err
    }

    // 4. 签发 Refresh Token（7d，仅含 userId）
    refreshClaims := jwt.MapClaims{
        "userId": user.Id,
        "type":   "refresh",
        "exp":    now + l.svcCtx.Config.Auth.RefreshExpire,
        "iat":    now,
    }
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshStr, err := refreshToken.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
    if err != nil {
        return nil, err
    }

    return &types.LoginResp{
        AccessToken:  accessStr,
        RefreshToken: refreshStr,
        ExpiresIn:    l.svcCtx.Config.Auth.AccessExpire,
    }, nil
}
```

> 配套的 `refreshlogic.go` 校验 refresh token 并重签 access；`logoutlogic.go` 将 access token 写入 Redis 黑名单（key `jwt:blacklist:<token>`，TTL = 剩余有效期）。

### 5.8 自定义错误（可选 errorx 包）

```go
package errorx

import "fmt"

type CodeError struct {
    Code int
    Msg  string
}

func (e *CodeError) Error() string {
    return fmt.Sprintf("[%d] %s", e.Code, e.Msg)
}

func New(msg string) *CodeError {
    return &CodeError{Code: 1001, Msg: msg}
}
```

### 5.9 初始化 module 并启动

```bash
go mod init auth
go mod tidy
go run auth.go -f etc/auth.yaml
```

### 5.10 验证

```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"13800138000","password":"123456"}'
```

期望返回：

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 7200
}
```

---

## 6. 数据访问层（model）

### 6.1 go-zero sqlx 简介

go-zero 的 `sqlx` 包是对 `database/sql` 的轻量封装：

- **防 SQL 注入**：强制使用占位符 `?`，禁止字符串拼接。
- **连接池**：内置连接池管理。
- **上下文支持**：所有方法接收 `context.Context`。
- **缓存集成**：与 `caching` 包配合自动 Redis 缓存。

### 6.2 用 goctl 从 SQL 生成 model

准备 `schema.sql`（以寺院表为例，含数据字典中的 6 寺院字段）：

```sql
CREATE TABLE `temple` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(16) NOT NULL COMMENT '寺院编码如 T001',
  `name` VARCHAR(64) NOT NULL COMMENT '名称',
  `region` VARCHAR(64) NOT NULL COMMENT '地区',
  `type` VARCHAR(32) NOT NULL COMMENT '类型 汉传佛教/道教/藏传佛教',
  `sect` VARCHAR(32) NOT NULL COMMENT '宗派 禅宗/全真派/格鲁派/正一派',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 2待审核',
  `address` VARCHAR(255) NOT NULL DEFAULT '',
  `cover_image` VARCHAR(255) NOT NULL DEFAULT '',
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='寺院表';
```

生成：

```bash
goctl model mysql ddl -src schema.sql -dir internal/model -cache
```

### 6.3 手写 model 示例（TempleModel）

生成产物基础上扩展（goctl 会生成基础 CRUD，下面是补充手写方法）：

```go
package model

import (
    "context"
    "time"

    "github.com/zeromicro/go-zero/core/stores/cache"
    "github.com/zeromicro/go-zero/core/stores/sqlx"
)

type Temple struct {
    Id         int64     `db:"id"`
    Code       string    `db:"code"`
    Name       string    `db:"name"`
    Region     string    `db:"region"`
    Type       string    `db:"type"`
    Sect       string    `db:"sect"`
    Status     int64     `db:"status"`
    Address    string    `db:"address"`
    CoverImage string    `db:"cover_image"`
    Rating     float64   `db:"rating"`
    CreateTime time.Time `db:"create_time"`
    UpdateTime time.Time `db:"update_time"`
}

type TempleModel interface {
    Insert(ctx context.Context, data *Temple) (int64, error)
    FindOne(ctx context.Context, id int64) (*Temple, error)
    FindList(ctx context.Context, sect string, page, size int) ([]*Temple, int64, error)
    Update(ctx context.Context, data *Temple) error
    Delete(ctx context.Context, id int64) error
}

type templeModel struct {
    sqlx.SqlConn
    cache cache.Cache
}

func NewTempleModel(conn sqlx.SqlConn, c cache.CacheConf) TempleModel {
    return &templeModel{
        SqlConn: conn,
        cache:   cache.New(c, conn, func(v interface{}) string {
            return "temple:" + v.(int64)
        }),
    }
}

func (m *templeModel) Insert(ctx context.Context, data *Temple) (int64, error) {
    query := `INSERT INTO temple (code, name, region, type, sect, status, address, cover_image, rating)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    res, err := m.ExecCtx(ctx, query,
        data.Code, data.Name, data.Region, data.Type, data.Sect,
        data.Status, data.Address, data.CoverImage, data.Rating)
    if err != nil {
        return 0, err
    }
    id, _ := res.LastInsertId()
    return id, nil
}

func (m *templeModel) FindOne(ctx context.Context, id int64) (*Temple, error) {
    var t Temple
    query := `SELECT id, code, name, region, type, sect, status, address, cover_image, rating,
                     create_time, update_time FROM temple WHERE id = ? LIMIT 1`
    // 使用带缓存的查询（cache key 由 NewTempleModel 中的 func 生成）
    err := m.QueryRowCtx(ctx, &t, id, func(ctx context.Context, conn sqlx.SqlConn, v interface{}) error {
        return conn.QueryRowCtx(ctx, v, query, id)
    })
    if err != nil {
        return nil, err
    }
    return &t, nil
}

func (m *templeModel) FindList(ctx context.Context, sect string, page, size int) ([]*Temple, int64, error) {
    var total int64
    countQuery := `SELECT COUNT(*) FROM temple WHERE 1=1`
    listQuery := `SELECT id, code, name, region, type, sect, status, address, cover_image, rating,
                         create_time, update_time FROM temple WHERE 1=1`
    args := []interface{}{}
    if sect != "" {
        countQuery += ` AND sect = ?`
        listQuery += ` AND sect = ?`
        args = append(args, sect)
    }
    if err := m.QueryRowCtx(ctx, &total, countQuery, args...); err != nil {
        return nil, 0, err
    }
    offset := (page - 1) * size
    listQuery += ` ORDER BY id DESC LIMIT ?, ?`
    args = append(args, offset, size)
    var list []*Temple
    if err := m.QueryRowsCtx(ctx, &list, listQuery, args...); err != nil {
        return nil, 0, err
    }
    return list, total, nil
}

func (m *templeModel) Update(ctx context.Context, data *Temple) error {
    query := `UPDATE temple SET name=?, region=?, type=?, sect=?, status=?, address=?, cover_image=?, rating=? WHERE id=?`
    _, err := m.ExecCtx(ctx, query, data.Name, data.Region, data.Type, data.Sect,
        data.Status, data.Address, data.CoverImage, data.Rating, data.Id)
    return err
}

func (m *templeModel) Delete(ctx context.Context, id int64) error {
    _, err := m.ExecCtx(ctx, `DELETE FROM temple WHERE id = ?`, id)
    return err
}
```

> 说明：上面代码省略了 `model` 接口的编译期断言。goctl 生成的 model 通常带 `var _ TempleModel = (*templeModel)(nil)` 确保实现完整，建议保留该断言。

### 6.4 缓存

go-zero 内置 caching：`NewTempleModel(conn, c cache.CacheConf)` 传入 cache 配置后，`QueryRowCtx` 自动读/写 Redis。

- 命中缓存直接返回，不打 DB。
- `Insert/Update/Delete` 后**自动失效**对应 key。
- 缓存 key 通过构造时的 func 自定义。

**注意：** 列表查询通常不走单条缓存，可手动加 list 维度缓存 key。

### 6.5 事务

```go
err := m.TransactCtx(ctx, func(ctx context.Context, session sqlx.Session) error {
    // 在事务中插订单
    _, err := session.ExecCtx(ctx, `INSERT INTO booking (...) VALUES (...)`, ...)
    if err != nil {
        return err
    }
    // 在同一事务中扣库存
    _, err = session.ExecCtx(ctx, `UPDATE inventory SET stock = stock - 1 WHERE ...`, ...)
    return err
})
if err != nil {
    // 整个事务回滚
}
```

### 6.6 何时引入 GORM

go-zero sqlx 适合 90% 场景。以下情况可考虑 GORM：

- 复杂多表关联查询（sqlx 写起来啰嗦）。
- 需要动态条件构造（where 链式）。
- 需要 hook（软删除、自动时间戳）。

引入方式：在 ServiceContext 中注入 `*gorm.DB`，model 层用 GORM。注意 GORM 与 go-zero 缓存需自行整合。

---

## 7. API 网关

### 7.1 go-zero gateway 模式

网关独立成一个服务（`askXuan-backend/services/platform/gateway-service`），职责：

1. **路由聚合**：把 19 条 C 端业务路由、1 条 OpenIM 透传路由和 21 条管理台路由转发到对应后端服务。
2. **鉴权前置**：JWT 校验 + 用户信息注入 context。
3. **限流**：tokenlimit。
4. **CORS**：跨域。

### 7.2 基于 etcd 的动态路由

网关不写死下游地址，而是通过 etcd 服务发现。配置中只需声明路由前缀 → 服务名，运行时由 etcd 解析实例。

### 7.3 鉴权中间件：JWT 校验

```go
package middleware

import (
    "context"
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

type JWTMiddleware struct {
    Secret string
}

func (m *JWTMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        auth := r.Header.Get("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") {
            http.Error(w, "未登录", http.StatusUnauthorized)
            return
        }
        tokenStr := strings.TrimPrefix(auth, "Bearer ")
        claims := jwt.MapClaims{}
        token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
            return []byte(m.Secret), nil
        })
        if err != nil || !token.Valid {
            http.Error(w, "token 无效", http.StatusUnauthorized)
            return
        }
        // 注入用户信息到 context
        userId := int64(claims["userId"].(float64))
        ctx := context.WithValue(r.Context(), "userId", userId)
        next(w, r.WithContext(ctx))
    }
}
```

### 7.4 限流中间件

```go
import "github.com/zeromicro/go-zero/core/limit"

// 每秒 100 个请求，突发 200
limiter := limit.NewPeriodLimit(100, 200, redisClient, "api_limit")
```

### 7.5 CORS 中间件

```go
package middleware

import "net/http"

func Cors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

### 7.6 gateway.yaml 完整配置（19 条 C 端业务路由 + 1 条 OpenIM 透传 + 21 条管理台路由）

```yaml
Name: gateway
Host: 0.0.0.0
Port: 8080

# JWT（网关层校验）
Auth:
  AccessSecret: "dongfang-access-secret-change-in-prod"

# etcd 服务发现
Telemetry:
  Name: gateway
  Endpoint: http://localhost:2379

# Redis（限流用）
Redis:
  Host: localhost:6379
  Type: node

# 下游服务路由（通过 etcd 解析实例）
Upstreams:
  - Name: auth
    Prefix: /api/v1/auth
  - Name: user-service
    Prefix: /api/v1/users
  - Name: temple-service
    Prefix: /api/v1/temples
  - Name: master-service
    Prefix: /api/v1/masters
  - Name: booking-service
    Prefix: /api/v1/booking
  - Name: product-service
    Prefix: /api/v1/product
  - Name: diy-service
    Prefix: /api/v1/diy
  - Name: order-service
    Prefix: /api/v1/order
  - Name: payment-service
    Prefix: /api/v1/payments
  - Name: logistics-service
    Prefix: /api/v1/logistics
  - Name: review-service
    Prefix: /api/v1/review
  - Name: content-audit-service
    Prefix: /api/v1/audit
  - Name: finance-service
    Prefix: /api/v1/finance
  - Name: message-service
    Prefix: /api/v1/messages
  - Name: marketing-service
    Prefix: /api/v1/marketing
  - Name: ai-service
    Prefix: /api/v1/ai
  - Name: file-service
    Prefix: /api/v1/files

# 不需要鉴权的白名单路径（共 16 条，与 gateway.yaml:NoAuthPaths 一致）
NoAuthPaths:
  - /api/v1/auth/login
  - /api/v1/auth/refresh
  - /api/v1/auth/admin/login
  - /api/v1/users/register
  - /api/v1/payments/callback/wechat
  - /api/v1/payments/callback/alipay
  - /api/v1/temples
  - /api/v1/masters
  - /api/v1/products
  - /api/v1/marketing/banners
  - /api/v1/announcements
  - /api/v1/diy/designs
  - /api/v1/diy/materials
  - /api/v1/health
  - /api/v1/im
  - /openim/webhook
```

> 对应路由前缀与服务的完整映射见 spec.md 网关路由约定章节。

---

## 8. 服务间通信

### 8.1 方式一：HTTP（resty 客户端）

简单场景直接 HTTP 调用，go-zero 集成 `resty`。适合调用第三方或临时联调。

```go
import "github.com/go-resty/resty/v2"

client := resty.New()
resp, err := client.R().
    SetHeader("Authorization", "Bearer "+token).
    SetResult(&Master{}).
    Get("http://master-service:8084/api/v1/masters/" + masterId)
```

### 8.2 方式二：gRPC（推荐，高性能）

go-zero rpc 模块基于 gRPC，配合 etcd 自动服务发现。

#### 定义 .proto

`askXuan-backend/services/content/master-service/rpc/master.proto`：

```protobuf
syntax = "proto3";

package master;
option go_package = "./master";

message MasterInfo {
  int64 id = 1;
  string name = 2;
  string title = 3;
  int64 temple_id = 4;
}

message GetMasterReq {
  int64 id = 1;
}

message GetMasterResp {
  MasterInfo master = 1;
}

service Master {
  rpc GetMaster(GetMasterReq) returns (GetMasterResp);
}
```

生成 gRPC 代码：

```bash
goctl rpc protoc master.proto --go_out=./ --go-grpc_out=./ --zrpc_out=. --style goZero
```

### 8.3 服务发现：etcd 自动解析

master-service 启动时注册到 etcd，temple-service 通过 etcd 解析实例。配置中只需服务名：

**temple-service/etc/temple.yaml：**

```yaml
MasterRpc:
  Etcd:
    Hosts:
      - localhost:2379
    Key: master.rpc
```

### 8.4 链路追踪：Jaeger + OpenTelemetry

各服务 etc/*.yaml 加：

```yaml
Telemetry:
  Name: temple-service
  Endpoint: http://localhost:14268/api/traces
  Sampler: 1.0
  Batcher: jaeger
```

启动 Jaeger：`docker run -d -p 16686:16686 -p 14268:14268 jaegertracing/all-in-one`

### 8.5 temple-service 调用 master-service 的 gRPC 示例

**ServiceContext 注入 RPC client：**

```go
package svc

import (
    "temple-service/internal/config"
    "temple-service/master"

    "github.com/zeromicro/go-zero/core/stores/sqlx"
    "github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
    Config      config.Config
    TempleModel model.TempleModel
    MasterRpc   master.Master
}

func NewServiceContext(c config.Config) *ServiceContext {
    conn := sqlx.NewMysql(c.DataSource)
    return &ServiceContext{
        Config:      c,
        TempleModel: model.NewTempleModel(conn, c.Cache),
        MasterRpc:   master.NewMaster(zrpc.MustNewClient(c.MasterRpc)),
    }
}
```

**logic 中调用：**

```go
func (l *TempleDetailLogic) TempleDetail(req *types.DetailReq) (*types.Temple, error) {
    temple, err := l.svcCtx.TempleModel.FindOne(l.ctx, req.Id)
    if err != nil {
        return nil, err
    }
    // 跨服务调用 master-service，etcd 自动解析
    masterResp, err := l.svcCtx.MasterRpc.GetMaster(l.ctx, &master.GetMasterReq{
        Id: temple.MasterId,
    })
    if err != nil {
        l.Errorf("调用 master-service 失败: %v", err)
        // 降级：master 信息缺失不影响主流程
    }
    _ = masterResp // 组装返回
    return convert(temple), nil
}
```

---

## 9. 消息队列（RabbitMQ）

### 9.1 Go 客户端

```bash
go get github.com/rabbitmq/amqp091-go
```

### 9.2 生产者：booking-service 发送预约通知

预约创建后发送 `booking.notify` 事件，message-service 消费生成站内消息。

```go
package mq

import (
    "context"
    "encoding/json"

    "github.com/rabbitmq/amqp091-go"
)

type Producer struct {
    ch *amqp.Channel
}

func NewProducer(conn *amqp.Connection) (*Producer, error) {
    ch, err := conn.Channel()
    if err != nil {
        return nil, err
    }
    // 声明交换机（fanout 广播给所有感兴趣的队列）
    if err := ch.ExchangeDeclare(
        "booking.events", "fanout", true, false, false, false, nil,
    ); err != nil {
        return nil, err
    }
    return &Producer{ch: ch}, nil
}

type BookingNotify struct {
    BookingId int64  `json:"bookingId"`
    UserId    int64  `json:"userId"`
    TempleId  int64  `json:"templeId"`
    Action    string `json:"action"` // created / confirmed / completed
}

func (p *Producer) Publish(ctx context.Context, evt BookingNotify) error {
    body, _ := json.Marshal(evt)
    return p.ch.PublishWithContext(ctx,
        "booking.events", // exchange
        "",               // routing key（fanout 无需）
        false, false,
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        },
    )
}
```

booking-service 在创建预约后调用：

```go
err := svcCtx.MqProducer.Publish(ctx, mq.BookingNotify{
    BookingId: booking.Id,
    UserId:    booking.UserId,
    TempleId:  booking.TempleId,
    Action:    "created",
})
if err != nil {
    logx.Errorf("发送预约通知失败，不影响主流程: %v", err)
}
```

### 9.3 消费者：message-service 监听

```go
package mq

import (
    "context"
    "encoding/json"

    "github.com/rabbitmq/amqp091-go"
)

type Consumer struct {
    ch *amqp.Channel
}

func NewConsumer(conn *amqp.Connection) (*Consumer, error) {
    ch, err := conn.Channel()
    if err != nil {
        return nil, err
    }
    // 声明交换机
    if err := ch.ExchangeDeclare("booking.events", "fanout", true, false, false, false, nil); err != nil {
        return nil, err
    }
    // 声明队列
    q, err := ch.QueueDeclare("message.booking.notify", true, false, false, false, nil)
    if err != nil {
        return nil, err
    }
    // 绑定
    if err := ch.QueueBind(q.Name, "", "booking.events", false, nil); err != nil {
        return nil, err
    }
    return &Consumer{ch: ch}, nil
}

func (c *Consumer) Consume(ctx context.Context, handler func(BookingNotify) error) error {
    // 设置 prefetch，避免一次拉太多
    _ = c.ch.Qos(1, 0, false)
    msgs, err := c.ch.Consume("message.booking.notify", "", false, false, false, false, nil)
    if err != nil {
        return err
    }
    go func() {
        for {
            select {
            case <-ctx.Done():
                return
            case msg, ok := <-msgs:
                if !ok {
                    return
                }
                var evt BookingNotify
                if err := json.Unmarshal(msg.Body, &evt); err != nil {
                    // 解析失败，直接 ack 丢弃，避免毒消息
                    _ = msg.Ack(false)
                    continue
                }
                if err := handler(evt); err != nil {
                    // 处理失败，nack 并 requeue
                    _ = msg.Nack(false, true)
                    continue
                }
                _ = msg.Ack(false)
            }
        }
    }()
    return nil
}
```

message-service 启动时注册消费者，生成站内消息（"您的预约已创建，请等待确认"等）。

### 9.4 可靠投递：手动 ack + 死信队列

- **手动 ack**：消费者处理成功才 ack（上面 `msg.Ack(false)`），失败 nack 重投。
- **死信队列（DLX）**：对队列声明 `x-dead-letter-exchange`，nack 不 requeue 时消息进死信队列，供人工排查。

```go
args := amqp.Table{
    "x-dead-letter-exchange": "booking.dlx",
}
q, _ := ch.QueueDeclare("message.booking.notify", true, false, false, false, args)
```

---

## 10. 对象存储（MinIO）

### 10.1 Go SDK

```bash
go get github.com/minio/minio-go/v7
```

### 10.2 file-service 上传接口

支持两种方式：
- **PresignedPutObject**：前端直传（推荐，省后端带宽）。
- **PutObject**：后端代传（小文件/需处理后入库）。

```go
package logic

import (
    "context"
    "fmt"
    "time"

    "file-service/internal/svc"
    "file-service/internal/types"

    "github.com/minio/minio-go/v7"
    "github.com/zeromicro/go-zero/core/logx"
)

type PresignLogic struct {
    logx.Logger
    ctx    context.Context
    svcCtx *svc.ServiceContext
}

func NewPresignLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PresignLogic {
    return &PresignLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

// PresignUpload 生成前端直传的预签名 PUT URL
func (l *PresignLogic) PresignUpload(req *types.PresignReq) (*types.PresignResp, error) {
    bucket := l.svcCtx.Config.MinIO.Bucket
    objectName := fmt.Sprintf("temples/%d/%s", req.TempleId, req.FileName)

    // 生成 15 分钟有效的预签名上传 URL
    presignedURL, err := l.svcCtx.MinIOClient.PresignedPutObject(l.ctx, bucket, objectName, 15*time.Minute)
    if err != nil {
        return nil, err
    }

    return &types.PresignResp{
        UploadUrl:  presignedURL.String(),
        ObjectName: objectName,
        ExpiresIn:  900,
    }, nil
}

// PresignDownload 生成下载用的临时 URL
func (l *PresignLogic) PresignDownload(req *types.DownloadReq) (*types.DownloadResp, error) {
    presignedURL, err := l.svcCtx.MinIOClient.PresignedGetObject(l.ctx,
        l.svcCtx.Config.MinIO.Bucket, req.ObjectName, time.Hour, nil)
    if err != nil {
        return nil, err
    }
    return &types.DownloadResp{Url: presignedURL.String()}, nil
}

// PutObject 后端代传（流式上传）
func (l *PresignLogic) PutObject(req *types.UploadReq) error {
    _, err := l.svcCtx.MinIOClient.PutObject(l.ctx,
        l.svcCtx.Config.MinIO.Bucket, req.ObjectName, req.Reader, req.Size,
        minio.PutObjectOptions{ContentType: req.ContentType})
    return err
}
```

**config.go 中 MinIO 配置：**

```go
type Config struct {
    rest.RestConf
    MinIO struct {
        Endpoint  string
        AccessKey string
        SecretKey string
        Bucket    string
        UseSSL    bool
    }
}
```

**etc/file.yaml：**

```yaml
MinIO:
  Endpoint: localhost:9000
  AccessKey: minioadmin
  SecretKey: minioadmin
  Bucket: dongfang
  UseSSL: false
```

前端拿到 `uploadUrl` 后直接 `PUT` 文件到 MinIO，再把 `objectName` 回传后端入库。下载时后端返回临时签名 URL，前端直接访问。

---

## 11. 与前端联调

### 11.1 CORS 配置

在网关层统一处理（见 [7.5](#75-cors-中间件)）。后端各服务无需重复配置 CORS，因为前端只访问网关 `8080`。

### 11.2 统一响应格式

自定义 `httpx` 封装，所有接口返回 `{code, message, data}`。

```go
package responsex

import (
    "errors"
    "net/http"

    "github.com/zeromicro/go-zero/rest/httpx"
)

type Body struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// Ok 成功响应
func Ok(w http.ResponseWriter, data interface{}) {
    httpx.OkJson(w, &Body{Code: 0, Message: "ok", Data: data})
}

// JsonError 统一错误响应
func JsonError(w http.ResponseWriter, err error) {
    var be *BizError
    if errors.As(err, &be) {
        httpx.WriteJson(w, http.StatusOK, &Body{Code: be.Code, Message: be.Msg})
        return
    }
    // 未知错误统一返回 5000
    httpx.WriteJson(w, http.StatusOK, &Body{Code: 5000, Message: "服务器内部错误"})
}
```

在 handler 中使用：

```go
func LoginHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req types.LoginReq
        if err := httpx.Parse(r, &req); err != nil {
            responsex.JsonError(w, err)
            return
        }
        l := logic.NewLoginLogic(r.Context(), svcCtx)
        resp, err := l.Login(&req)
        if err != nil {
            responsex.JsonError(w, err)
        } else {
            responsex.Ok(w, resp)
        }
    }
}
```

### 11.3 错误码规范

| 区间 | 含义 |
| --- | --- |
| 0 | 成功 |
| 40001-40099 | 参数错误 |
| 40101-40199 | 认证错误 |
| 40301-40399 | 权限错误 |
| 40401-40499 | 资源不存在 |
| 40901-40999 | 冲突错误 |
| 50001-50099 | 系统错误 |
| 50201-50299 | 第三方服务错误 |

### 11.4 JWT 前端携带

```http
Authorization: Bearer <accessToken>
```

前端（Expo / Web）登录后存储 token，每次请求带上。token 过期（2h）后用 refreshToken 调 `/api/v1/auth/refresh` 换新。

### 11.5 Mock Server 与真实后端切换

**前端视角切换，后端无需特殊处理：**

```ts
// 开发联调阶段用 Mock
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
// Mock:    http://localhost:3001/api/v1
// 真实后端: http://localhost:8080/api/v1
```

Mock Server 已实现，接口契约与真实后端一致，前端切换 BASE_URL 即可。真实后端上线后只需改环境变量。

### 11.6 联调端口

| 角色 | 地址 |
| --- | --- |
| API 网关（真实后端入口） | `http://localhost:8080` |
| Mock Server | `http://localhost:3001/api/v1` |
| 前端配置 | `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1` |

> iOS 模拟器可直接用 localhost；真机需用电脑局域网 IP。

---

## 12. 部署

### 12.1 单服务二进制部署

```bash
# 编译（Mac 编译 Linux 产物）
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o auth auth.go

# 上传到服务器后运行
./auth -f etc/auth.yaml
```

Go 编译为单个二进制，无运行时依赖，部署极简。

### 12.2 Dockerfile（goctl 生成）

```bash
goctl docker -go auth.go -port 8081
```

生成的 Dockerfile 多阶段构建：builder 阶段编译，最终镜像基于 alpine，体积小（~20MB）。

### 12.3 docker-compose 编排

```yaml
version: '3.8'
services:
  auth:
    build: ./askXuan-backend/services/platform/auth-service
    ports:
      - "8081:8081"
    depends_on:
      - mysql
      - redis
      - etcd
    environment:
      - AUTH_DATASOURCE=root:123456@tcp(mysql:3306)/dongfang
    restart: always

  gateway:
    build: ./askXuan-backend/services/platform/gateway-service
    ports:
      - "8080:8080"
    depends_on:
      - auth
      - temple-service
    restart: always

  # ... 其余 16 个服务同理
```

### 12.4 配置管理

- **开发环境**：各服务 `etc/<svc>.yaml` 本地文件。
- **生产环境**：
  - 方式一：etcd 配置中心，服务启动从 etcd 拉配置。
  - 方式二：环境变量注入（go-zero conf 支持 `${ENV}` 占位）。

**etc/auth.yaml 用环境变量：**

```yaml
DataSource: ${AUTH_DATASOURCE}
Auth:
  AccessSecret: ${AUTH_ACCESS_SECRET}
```

### 12.5 健康检查

每个服务暴露 `/health` 接口（go-zero 默认支持，或自定义）：

```go
server.AddRoute(rest.Route{
    Method:  http.MethodGet,
    Path:    "/health",
    Handler: func(w http.ResponseWriter, r *http.Request) {
        httpx.OkJson(w, map[string]string{"status": "ok"})
    },
})
```

docker-compose / k8s 据此做健康探测。

---

## 13. 调试技巧

### 13.1 热重载：air 工具

```bash
go install github.com/cosmtrek/air@latest
# 在服务目录创建 .air.toml，然后
air
```

修改 .go 文件自动重新编译运行，开发体验大幅提升。

### 13.2 delve debugger

```bash
# 启动调试
dlv debug auth.go -- -f etc/auth.yaml
# VS Code 用 F5 启动（需配置 launch.json 的 delve mode）
```

### 13.3 go-zero logx 结构化日志

```go
logx.Infof("用户登录 userId=%d", userId)
logx.Errorf("查询失败: %v", err)

// 带字段的结构化日志
logx.WithFields(logx.Field("userId", userId), logx.Field("templeId", templeId)).
    Info("预约创建")
```

输出 JSON 格式，便于 ELK 采集检索。

### 13.4 pprof 性能分析

```go
import _ "net/http/pprof"

// 在 main 中启动 pprof server
go func() {
    http.ListenAndServe(":6060", nil)
}()
```

```bash
# CPU 采样
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
# 内存采样
go tool pprof http://localhost:6060/debug/pprof/heap
# 在 pprof 交互中用 top / web 命令分析
```

### 13.5 etcdctl 查看注册的服务

```bash
# 查看所有注册到 etcd 的服务
etcdctl --endpoints=http://localhost:2379 get /zero/ --prefix

# 期望看到类似：
# /zero/auth/xxx -> {"host":"192.168.1.5","port":8081,...}
# /zero/temple-service/xxx -> ...
```

---

## 14. 推荐学习资源

### 官方文档

- **go-zero 官方文档**：https://go-zero.dev （全中文，含教程与 API 参考）
- **go-zero GitHub**：https://github.com/zeromicro/go-zero
- **go-zero 示例库**：https://github.com/zeromicro/zero-examples

### Go 语言

- **Go 官方 Tour**：https://go.dev/tour （交互式入门，2 小时通关）
- **Go by Example**：https://gobyexample.com （按语法点给示例）
- **Effective Go**：https://go.dev/doc/effective_go （进阶最佳实践）

### 视频 / 书籍

- **go-zero 微服务实战**（B 站搜索 "go-zero" 有大量教程）
- **《Go 语言实战》**、**《Go 程序设计语言》**（The Go Programming Language，经典）
- **go-zero 知识星球**（作者团队运营，问答及时）

### 相关生态

- etcd 官方：https://etcd.io
- gRPC Go：https://grpc.io/docs/languages/go/
- Jaeger：https://www.jaegertracing.io

---

## 15. 问玄东方后端开发路线图

> 按依赖顺序推进，每一步形成可验证闭环。Task 编号对应项目 tasks.md。

### 第一步：登录闭环（Task 4 / 5 / 6 前半）

**目标：** 用户能注册、登录、拿到 JWT，通过网关访问受保护接口。

涉及服务：
- `auth-service` — JWT 签发/续期/登出
- `gateway-service` — 路由 + 鉴权中间件 + CORS
- `user-service` — 用户注册/资料

验证：
1. 注册用户 → 登录拿 token
2. 带 token 访问 `/api/v1/users/profile` 返回用户信息
3. 无 token 访问受保护接口返回 401

### 第二步：预约闭环（Task 6 后半）

**目标：** 用户能浏览寺院/法师、下单预约、状态流转。

涉及服务：
- `temple-service` — 6 寺院数据（灵隐寺/白云观/少林寺/大昭寺/普陀山/武当山）
- `master-service` — 6 法师数据（智海/清风/释延心/扎西多吉/慧明/真武）
- `booking-service` — 预约订单与状态流转（待确认→已确认→进行中→已完成 / 已取消）

验证：
1. 列表查询寺院（按宗派筛选）
2. 查看法师详情（关联寺院）
3. 创建预约 → 状态流转 → 完成

### 第三步：通知与文件（Task 7）

**目标：** 预约事件触发站内消息，图片可上传下载。

涉及服务：
- `message-service` — 监听 RabbitMQ 生成站内消息
- `file-service` — MinIO 上传/下载（寺院封面、法师头像等）

验证：
1. 创建预约后用户收到站内消息
2. 前端直传图片到 MinIO 后能通过签名 URL 访问

### 第四步：商城二期服务（Task 8）

**目标：** DIY 手串设计下单、商城订单、支付、评价闭环。

涉及服务：
- `product-service` — 商品/SKU
- `diy-service` — DIY 设计/材料（14 种材料：小叶紫檀/星月菩提/凤眼菩提…；4 项加持服务 E001-E004）
- `order-service` — 商城订单
- `payment-service` — 支付/退款
- `logistics-service` — 物流
- `review-service` — 评价
- `content-audit-service` — 内容审核
- `finance-service` — 结算
- `marketing-service` — 优惠券/活动
- `ai-service` — AI 问事

验证：
1. DIY 手串设计 → 选加持服务（如"灵隐寺·开光加持 ¥168"）→ 下单
2. 支付 → 发货 → 评价 → 结算
3. 材料价格与数据字典精确匹配（如小叶紫檀圆珠 10mm ¥28/颗）

---

> **文档版本：** v1.0 · 2026-06-30
>
> **配套文档：** `统一数据字典.md`（数据规范）、`技术架构.md`（架构总览）、`Expo入门指南.md`（移动端）
>
> 如发现文档与实际代码不一致，以代码为准并反馈更新本指南。
