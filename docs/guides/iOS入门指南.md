# 问玄东方 iOS 开发入门指南

> **面向读者**：从未接触过 iOS 开发的零基础工程师，目标是上手为「问玄东方」项目开发两款 iOS App：
> - **C 端信众 App**（P01）：21 个页面，5 Tab 导航（首页 / 对话 / AI 问事 / 商城 / 我的）
> - **法师工作台 App**（P03）：16 个页面，供法师接单、管理预约、查看收入
>
> **技术栈**：Swift 5.9 + SwiftUI + MVVM + async/await，最低支持 iOS 16
>
> **预计学习时间**：环境 0.5 天 + Swift 语法 1-2 天 + SwiftUI 2-3 天 + MVVM/网络层 1-2 天 ≈ 一周可写出第一个完整页面

---

## 目录

1. [环境准备](#1-环境准备)
2. [Swift 语言核心](#2-swift-语言核心)
3. [SwiftUI 核心](#3-swiftui-核心)
4. [MVVM 架构实战](#4-mvvm-架构实战)
5. [网络层封装](#5-网络层封装)
6. [工程结构详解](#6-工程结构详解)
7. [设计系统接入](#7-设计系统接入)
8. [与后端联调](#8-与后端联调)
9. [创建第一个页面实战](#9-创建第一个页面实战)
10. [调试技巧](#10-调试技巧)
11. [推荐学习资源](#11-推荐学习资源)
12. [问玄东方项目开发路线图](#12-问玄东方项目开发路线图)

---

## 1. 环境准备

iOS 开发只能在 macOS 上进行（Apple 官方限制），无法在 Windows / Linux 上原生开发。请按以下步骤准备环境。

### 1.1 macOS 系统要求

| 项 | 最低要求 | 推荐 |
| --- | --- | --- |
| 系统 | macOS Ventura 13.5 | **macOS Sonoma 14+** |
| 机型 | 2018 年后的 Mac（Intel 或 Apple Silicon 均可） | Apple Silicon（M1/M2/M3） |
| 内存 | 8 GB | 16 GB 及以上 |
| 磁盘 | 50 GB 可用空间 | 80 GB+（含模拟器、多版本 Xcode） |

> **Apple Silicon 提示**：M 系列芯片运行模拟器速度远超 Intel，且可同时跑 iOS / iPadOS / macOS 三端，强烈推荐。

### 1.2 安装 Xcode 15+

**Xcode** 是 Apple 官方 IDE，集编辑器、编译器、调试器、模拟器、Interface Builder 于一体。SwiftUI 必须用 Xcode 开发。

**安装方式**（任选其一）：

- **方式 A（推荐新手）：Mac App Store**
  1. 打开 `Mac App Store`，搜索 `Xcode`
  2. 点击「获取 / 安装」（约 12 GB 下载量，下载完成后自动安装到 `/Applications/Xcode.app`）
  3. 整个过程（下载 + 安装）实际占用约 **35-50 GB** 磁盘空间

- **方式 B：Apple Developer 官网下载 `.xip`**
  1. 访问 https://developer.apple.com/download/all/
  2. 用 Apple ID 登录，搜索 `Xcode 15` 下载 `.xip` 压缩包
  3. 双击 `.xip` 解压，将 `Xcode.app` 拖入 `/Applications/`

> **磁盘空间说明**：Xcode 主体约 12 GB，安装后还需下载 iOS Simulators（每个约 5-7 GB）、Command Line Tools、文档等，整体预留 50 GB 比较稳妥。

### 1.3 注册 Apple ID

| 账号类型 | 费用 | 能做什么 | 不能做什么 |
| --- | --- | --- | --- |
| 免费 Apple ID | 0 | 模拟器调试、写代码、本地测试 | 真机调试、上架 App Store、使用 Push/支付 等服务 |
| Apple Developer Program | **$99/年** | 上述全部 + 真机调试 + 上架 + 推送 + 内购 | — |

**注册步骤**：
1. 访问 https://developer.apple.com/，点击 `Account` → `Create Apple ID`
2. 填写邮箱、姓名、生日、手机号，设置密码
3. 邮箱验证 + 手机验证码验证
4. **新手阶段用免费账号即可**，待需要真机调试时再升级为 $99/年的付费账号

### 1.4 Xcode 首次启动配置

第一次打开 Xcode 会要求：

1. **同意 License 协议**：点击 `Agree`
2. **输入管理员密码**：Xcode 需要安装额外组件（Command Line Tools、模拟器 runtime）
3. **等待「Installing additional components」完成**（约 5-10 分钟）
4. 启动后看到欢迎界面：
   - `Create a new Xcode project` —— 新建工程
   - `Clone an existing project` —— 从 Git 克隆
   - `Open a project or file` —— 打开已有工程

**验证安装**：打开终端执行：

```bash
xcodebuild -version
# 应输出类似：
# Xcode 15.2
# Build version 15C500b

xcode-select -p
# 应输出：/Applications/Xcode.app/Contents/Developer
```

### 1.5 可选：安装 Homebrew 与 Git

macOS 自带 Git，但版本较老。推荐用 [Homebrew](https://brew.sh/) 统一管理命令行工具：

```bash
# 安装 Homebrew（见官网最新命令）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装最新版 Git
brew install git

# 验证
git --version
```

可选辅助工具：

```bash
brew install --cask proxyman      # 抓包工具（替代 Charles）
brew install --cask sourcetree    # Git 图形客户端
brew install swift-format         # Swift 代码格式化
```

---

## 2. Swift 语言核心

Swift 是 Apple 2014 年推出的现代编程语言，安全、快速、表达力强。本章覆盖阅读问玄东方项目代码所需的全部核心语法。

### 2.1 变量与常量（var / let）

```swift
// var：变量，可重新赋值
var age = 25
age = 26              // ✅ OK

// let：常量，赋值后不可改
let pi = 3.14159
// pi = 3.14          // ❌ 编译错误：Cannot assign to value

// 优先用 let，只在需要修改时用 var —— 这是 Swift 性能与安全的最佳实践
let templeName = "灵隐寺"
var visitorCount = 0
visitorCount += 1
```

### 2.2 数据类型

```swift
// 整数
let population: Int = 1_000_000      // 下划线分隔，更易读
let score: Int = 95

// 浮点数
let price: Double = 168.00           // 推荐 Double（64 位）
let ratio: Float = 0.618             // Float 32 位

// 布尔
let isOpen: Bool = true

// 字符串
let greeting: String = "南无阿弥陀佛"

// 数组 Array（有序、可重复）
let temples: [String] = ["灵隐寺", "白云观", "少林寺"]
let firstTemple = temples[0]         // 灵隐寺
let count = temples.count            // 3

// 字典 Dictionary（键值对）
let templeById: [String: String] = [
    "T001": "灵隐寺",
    "T002": "白云观"
]
let name = templeById["T001"]        // 类型是 String?（可选）

// 集合 Set（无序、不重复）
let tags: Set<String> = ["禅宗", "净土", "禅宗"]   // 实际只有 2 个元素

// 空集合初始化
var emptyArray = [Int]()
var emptyDict = [String: Int]()
```

### 2.3 可选类型 Optional ⭐️ 重点

**这是新手最常踩坑的概念，务必理解。**

Swift 不允许变量为 `null`，必须显式声明「可能没有值」的类型——这就是 Optional。一个 `String` 一定有值，一个 `String?`（Optional String）可能有值也可能是 `nil`。

```swift
// 1) 声明可选类型：在类型后加 ?
let masterName: String? = "明觉法师（演示）"
let unknownName: String? = nil       // ✅ OK

// 2) 解包方式一：强制解包 !（危险，不推荐）
// 如果变量为 nil 会运行时崩溃！
let unwrapped1: String = masterName!       // ✅ 此时 masterName 有值
// let crash = unknownName!                 // ❌ 运行时崩溃：Fatal error

// 3) 解包方式二：if let（推荐）
if let name = masterName {
    print("法师名字：\(name)")              // name 在此作用域内是 String（非可选）
} else {
    print("没有名字")
}

// 4) 解包方式三：guard let（函数中提前返回，强烈推荐）
func greet(_ name: String?) {
    guard let name = name else {
        print("名字为空，退出")
        return                            // 提前退出
    }
    // name 在后续作用域内都是 String（非可选）
    print("你好，\(name)")
}

// 5) 解包方式四：?? 空合运算符（给默认值）
let display: String = masterName ?? "未知法师"
let display2: String = unknownName ?? "未知法师"   // "未知法师"

// 6) 可选链式调用 ?.（链上任意环节为 nil 则整个表达式为 nil）
let temple: Temple? = getTemple()
let templeName2 = temple?.name               // String?
let upper = temple?.name.uppercased()        // String?
```

**实战口诀**：
- 函数返回值可能是「没有」 → 返回 `?`
- 拿到 Optional → 优先 `guard let` 解包
- 想要默认值 → 用 `??`
- **绝对不要随手用 `!`**，除非你 100% 确定它有值（如 IBOutlet）

### 2.4 字符串插值

```swift
let name = "智海"
let age = 45
let message = "法师 \(name) 今年 \(age) 岁，明年 \(age + 1) 岁"
// "法师 智海 今年 45 岁，明年 46 岁"

// 多行字符串
let intro = """
明觉法师（演示），灵隐寺客堂法师，
专长：佛学、禅修、开光、祈福
"""
```

### 2.5 函数定义与参数标签

```swift
// 基本函数
func greet(name: String) -> String {
    return "你好，\(name)"
}
greet(name: "智海")                // 调用时必须写参数名

// 参数标签（外部名）+ 参数名（内部名）
// from 是外部标签，sender 是内部名
func sendBlessing(from sender: String, to receiver: String) -> String {
    return "\(sender) 向 \(receiver) 祈福"
}
sendBlessing(from: "张三", to: "灵隐寺")

// 省略外部标签（_）
func greet(_ name: String) -> String {
    return "你好，\(name)"
}
greet("智海")                     // 调用时不写参数名

// 默认参数
func orderIncense(count: Int = 3) -> String {
    return "请 \(count) 柱香"
}
orderIncense()                    // "请 3 柱香"
orderIncense(count: 9)            // "请 9 柱香"

// 可变参数
func sum(_ numbers: Int...) -> Int {
    return numbers.reduce(0, +)
}
sum(1, 2, 3, 4)                   // 10
```

### 2.6 闭包与尾随闭包

闭包是「自包含的代码块」，类似其他语言的 lambda / 匿名函数。SwiftUI 大量使用尾随闭包语法。

```swift
// 闭包完整形式
let add: (Int, Int) -> Int = { (a: Int, b: Int) -> Int in
    return a + b
}
add(2, 3)                         // 5

// 类型推断后简写
let add2: (Int, Int) -> Int = { a, b in a + b }

// 最简形式（$0、$1 代表第 1、2 个参数）
let add3: (Int, Int) -> Int = { $0 + $1 }

// 高阶函数：map / filter / reduce
let prices = [100, 200, 300]
let discounted = prices.map { $0 * 0.8 }      // [80.0, 160.0, 240.0]
let expensive = prices.filter { $0 > 150 }    // [200, 300]
let total = prices.reduce(0, +)               // 600

// 尾随闭包：函数最后一个参数是闭包时，可写在括号外
func fetchData(completion: (Result<String, Error>) -> Void) {
    completion(.success("数据已加载"))
}

// 完整调用
fetchData(completion: { result in
    print(result)
})

// 尾随闭包简写
fetchData { result in
    print(result)
}
```

### 2.7 结构体 struct 与类 class

Swift 中 struct 和 class 都能定义数据类型，但行为差异很大。

```swift
// 结构体 struct —— 值类型（赋值时复制副本）
struct Temple {
    let id: String
    var name: String
    var region: String
    
    // 自动生成成员初始化器
    // Temple(id:name:region:)
}

var t1 = Temple(id: "T001", name: "灵隐寺", region: "杭州")
var t2 = t1                  // 复制！t1 和 t2 是独立的两份
t2.name = "灵隐古寺"
print(t1.name)               // 灵隐寺（t1 没变）
print(t2.name)               // 灵隐古寺

// 类 class —— 引用类型（赋值时只传递引用，不复制）
class Cart {
    var items: [String] = []
    
    func add(_ item: String) {
        items.append(item)
    }
}

let c1 = Cart()
let c2 = c1                  // 共享同一个对象
c2.add("佛珠")
print(c1.items)              // ["佛珠"]（c1 也变了）
```

| 特性 | struct（值类型） | class（引用类型） |
| --- | --- | --- |
| 赋值行为 | 复制副本 | 共享引用 |
| 内存管理 | 栈，自动释放 | 堆，引用计数（ARC） |
| 继承 | ❌ 不能继承 | ✅ 可以继承 |
| `Equatable` 默认 | ✅ 自动按值比较 | ❌ 默认按引用比较 |
| SwiftUI Model 首选 | ✅ Model 用 struct | — |
| ViewModel | — | ✅ ViewModel 用 class（ObservableObject） |

**项目中约定**：Model 用 `struct`，ViewModel 用 `class`。

### 2.8 协议 protocol 与扩展 extension

**协议**定义「必须实现的方法/属性清单」，类似 Java/Go 的 interface。

```swift
// 定义协议
protocol Describable {
    var description: String { get }
    func describe() -> String
}

// 遵守协议
struct Temple: Describable {
    let id: String
    let name: String
    
    var description: String { "\(id) - \(name)" }
    
    func describe() -> String {
        return "寺院：\(name)"
    }
}

// SwiftUI 常用协议
// - View：所有视图必须遵守
// - ObservableObject：所有 ViewModel 必须遵守
// - Codable：JSON 自动编解码
// - Identifiable：列表元素必须遵守（提供 id）

struct Temple2: Identifiable, Codable {
    let id: String              // Identifiable 要求
    let name: String
}
```

**扩展**：给已有类型（包括系统类型）添加方法，是 Swift 强大的代码组织工具。

```swift
// 给 String 加方法
extension String {
    var isChineseName: Bool {
        return !isEmpty && allSatisfy { $0.isCJKVLetter }
    }
}

"智海".isChineseName            // true

// 给 Color 加便捷构造器（项目中大量使用）
import SwiftUI

extension Color {
    init(hex: String) {
        // ...解析十六进制色值
        self = .red
    }
}
```

### 2.9 错误处理（throws / try / catch）

```swift
// 1) 定义错误（遵守 Error 协议）
enum APIError: Error {
    case invalidURL
    case networkFailed
    case decodingFailed
    case serverError(code: Int, message: String)
}

// 2) 定义可抛错的函数（throws）
func fetchTemple(id: String) throws -> Temple {
    guard !id.isEmpty else {
        throw APIError.invalidURL
    }
    // ...网络请求
    if /* 网络失败 */ true {
        throw APIError.networkFailed
    }
    return Temple(id: id, name: "灵隐寺", region: "杭州")
}

// 3) 调用：try? / try! / do-catch

// 3.1 try? —— 失败返回 nil
let temple: Temple? = try? fetchTemple(id: "T001")

// 3.2 try! —— 失败崩溃（仅当你 100% 确定不会失败时用）
// let t = try! fetchTemple(id: "T001")

// 3.3 do-catch —— 完整处理
do {
    let temple = try fetchTemple(id: "T001")
    print(temple.name)
} catch APIError.invalidURL {
    print("URL 错误")
} catch APIError.networkFailed {
    print("网络失败，请检查网络")
} catch let APIError.serverError(code, message) {
    print("服务器错误：\(code) - \(message)")
} catch {
    print("未知错误：\(error)")
}
```

### 2.10 并发（async / await / Task）⭐️ 现代 Swift 核心

`async/await` 是 Swift 5.5 引入的现代并发模型，所有网络请求、耗时操作都用它。

```swift
// 1) 定义异步函数（async）
func fetchTemples() async throws -> [Temple] {
    let url = URL(string: "http://localhost:3001/api/v1/temples")!
    let (data, response) = try await URLSession.shared.data(from: url)
    let temples = try JSONDecoder().decode([Temple].self, from: data)
    return temples
}

// 2) 调用异步函数
// 必须在 async 上下文中，或用 Task 包装
func loadTemples() {
    Task {
        do {
            let temples = try await fetchTemples()
            print("获取到 \(temples.count) 座寺院")
        } catch {
            print("加载失败：\(error)")
        }
    }
}

// 3) 并发执行多个任务
func loadAll() async {
    async let temples = fetchTemples()
    async let masters = fetchMasters()
    
    // 两个任务并行执行，最后一起 await
    let (t, m) = (try await temples, try await masters)
    print("寺院 \(t.count)，法师 \(m.count)")
}

// 4) @MainActor —— 标记代码运行在主线程（更新 UI 必须）
@MainActor
class TempleListViewModel: ObservableObject {
    @Published var temples: [Temple] = []
    
    func load() async {
        // 即使后台线程返回，@MainActor 保证 temples 赋值在主线程
        temples = (try? await fetchTemples()) ?? []
    }
}
```

> **SwiftUI 中调用**：在 View 的 `.task` 修饰符中调用 async 函数，视图出现时自动执行，视图销毁时自动取消。

---

## 3. SwiftUI 核心

SwiftUI 是 Apple 2019 年推出的声明式 UI 框架。你「描述界面长什么样」，框架负责把它渲染出来。相比传统的 UIKit（命令式、拖线连线），SwiftUI 对新手更友好。

### 3.1 第一个 SwiftUI 视图

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("南无阿弥陀佛")
            .font(.title)
            .foregroundStyle(.white)
            .padding()
    }
}

// Xcode 预览（开发时实时看到效果）
#Preview {
    ContentView()
}
```

**关键点**：
- 所有视图都是 `struct`，遵守 `View` 协议
- 必须实现 `var body: some View` 计算属性
- `some View` 表示「某种 View 类型」（不透明类型）
- 视图是不可变的，靠「状态」驱动刷新

### 3.2 布局容器：VStack / HStack / ZStack

```swift
// VStack：纵向排列（默认居中对齐）
VStack(spacing: 16) {
    Text("灵隐寺")
    Text("禅宗")
    Text("杭州")
}
// ↓ 渲染：
// 灵隐寺
// 禅宗
// 杭州

// HStack：横向排列
HStack(spacing: 8) {
    Image(systemName: "mappin.and.ellipse")
    Text("杭州市西湖区灵隐路")
}
// ↓ 渲染：📍 杭州市西湖区灵隐路

// ZStack：层叠（后面的覆盖前面的）
ZStack {
    Color.black.opacity(0.8)            // 背景层
    Text("加载中...")                    // 文字层
}

// 复合嵌套
VStack(spacing: 12) {
    Text("寺院推荐")
        .font(.headline)
    
    HStack {
        Text("灵隐寺")
        Spacer()                         // 弹性空间，把后面推到最右
        Text("禅宗")
    }
    
    HStack {
        Text("白云观")
        Spacer()
        Text("道教")
    }
}
```

### 3.3 常用视图

```swift
// Text：显示文本
Text("标题")
    .font(.title2)
    .fontWeight(.semibold)
    .foregroundStyle(Color(hex: "#C8A96E"))    // 琉璃金

// Image：显示图片
Image("temple-card-lingyinsi")    // Assets 中的图片
    .resizable()                   // 允许缩放
    .aspectRatio(contentMode: .fill)
    .frame(height: 200)
    .clipped()                     // 裁剪超出部分

// 系统图标（SF Symbols）
Image(systemName: "mappin.and.ellipse")
    .font(.title2)
    .foregroundStyle(.red)

// Button：按钮
Button(action: {
    print("点击了预约")
}) {
    Text("立即预约")
        .padding(.horizontal, 24)
        .padding(.vertical, 12)
        .background(Color(hex: "#C45A3C"))     // 朱砂
        .foregroundStyle(.white)
        .cornerRadius(8)
}

// TextField：输入框
TextField("请输入手机号", text: $phoneNumber)    // $ 表示双向绑定
    .textFieldStyle(.roundedBorder)
    .keyboardType(.numberPad)

// List：列表（自动支持滚动）
List {
    Text("灵隐寺")
    Text("白云观")
    Text("少林寺")
}

// ScrollView：滚动容器
ScrollView(.horizontal, showsIndicators: false) {
    HStack(spacing: 12) {
        ForEach(0..<5) { i in
            Text("卡片 \(i)")
                .frame(width: 120, height: 80)
                .background(Color.gray.opacity(0.2))
                .cornerRadius(8)
        }
    }
    .padding(.horizontal)
}
```

### 3.4 修饰符链式调用 ⭐️ 顺序很重要

修饰符是从内到外依次「包装」视图的，**顺序不同结果完全不同**。

```swift
// ✅ 正确：先 padding 再 background，背景会包含 padding 区域
Text("确认预约")
    .padding(.horizontal, 24)
    .padding(.vertical, 12)
    .background(Color(hex: "#C45A3C"))
    .cornerRadius(8)
// 渲染：朱砂背景包裹着文字，留有内边距

// ❌ 错误：先 background 再 padding，背景只覆盖文字本身，padding 区域无背景
Text("确认预约")
    .background(Color(hex: "#C45A3C"))
    .padding(.horizontal, 24)
    .padding(.vertical, 12)
    .cornerRadius(8)
// 渲染：朱砂方块只有文字大小，外边距是空白

// 常用修饰符
Text("标题")
    .font(.title)                              // 字体
    .fontWeight(.bold)                         // 字重
    .foregroundStyle(.white)                   // 前景色（文字/图标）
    .padding(.all, 16)                         // 内边距
    .frame(maxWidth: .infinity, alignment: .leading)   // 尺寸
    .background(Color.black)                   // 背景
    .cornerRadius(12)                          // 圆角
    .overlay(RoundedRectangle(cornerRadius: 12).stroke(.red, lineWidth: 1))  // 边框
    .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 2)  // 阴影
```

### 3.5 状态管理 ⭐️ 最重要

SwiftUI 是「状态驱动 UI」：状态变了 → 框架自动重新计算 body → UI 刷新。**理解状态管理 = 理解 SwiftUI**。

#### @State —— 视图内部局部状态

```swift
struct CounterView: View {
    @State private var count = 0       // 视图内部状态，必须用 private
    
    var body: some View {
        VStack(spacing: 20) {
            Text("计数：\(count)")
                .font(.title)
            Button("加 1") {
                count += 1              // 修改 @State 自动触发刷新
            }
        }
    }
}
```

> **何时用**：按钮点击次数、输入框文字、开关状态等「视图自己用的临时数据」。**不要**把网络请求的数据放 `@State`，用 ViewModel。

#### @Binding —— 父子视图双向传递

```swift
// 子视图：接收绑定的开关
struct ToggleSwitch: View {
    @Binding var isOn: Bool             // 注意是 Binding
    
    var body: some View {
        Toggle("开启提醒", isOn: $isOn)
    }
}

// 父视图：把 @State 用 $ 传给子视图
struct ParentView: View {
    @State private var reminderOn = false
    
    var body: some View {
        VStack {
            Text("当前状态：\(reminderOn ? "开" : "关")")
            ToggleSwitch(isOn: $reminderOn)      // $ 表示双向绑定
        }
    }
}
```

> **何时用**：自定义开关、TextField 等需要把状态「下沉」到子视图，又希望子视图修改能反映到父视图。

#### @EnvironmentObject —— 全局注入

```swift
// 1) 定义全局状态（通常是用户的登录态、购物车等）
@MainActor
class AppState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var userId: String?
    @Published var jwtToken: String?
}

// 2) 在最顶层注入
@main
struct DongFangApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)     // 全局注入
        }
    }
}

// 3) 在任意子视图中读取（无需层层传递）
struct ProfileView: View {
    @EnvironmentObject var appState: AppState    // 自动从环境获取
    
    var body: some View {
        Text(appState.isLoggedIn ? "已登录" : "未登录")
    }
}
```

> **何时用**：登录状态、主题、用户信息等「全局共享」的数据。避免层层传递。

#### @StateObject vs @ObservedObject ⭐️ 新手最易混淆

两者都是观察外部 `ObservableObject`，但**所有权不同**：

| 修饰符 | 谁拥有对象 | 何时用 |
| --- | --- | --- |
| `@StateObject` | 当前视图拥有，负责创建与销毁 | **创建** ViewModel 的视图（生命周期拥有者） |
| `@ObservedObject` | 别处拥有，当前视图只是观察 | **接收**已存在的 ViewModel（被传递过来） |
| `@EnvironmentObject` | 全局环境拥有 | 全局共享的对象 |

```swift
// ❌ 错误：用 @ObservedObject 创建 ViewModel
struct TempleListView: View {
    @ObservedObject var viewModel = TempleListViewModel()   // 父视图刷新时会被重建！
}

// ✅ 正确：用 @StateObject 创建 ViewModel
struct TempleListView: View {
    @StateObject private var viewModel = TempleListViewModel()  // 只创建一次，跟随视图生命周期
    
    var body: some View {
        TempleListContentView(viewModel: viewModel)   // 子视图用 @ObservedObject
    }
}

// 子视图：接收已存在的 ViewModel
struct TempleListContentView: View {
    @ObservedObject var viewModel: TempleListViewModel     // 不创建，只观察
    
    var body: some View {
        List(viewModel.temples) { temple in
            Text(temple.name)
        }
    }
}
```

> **口诀**：「自己 new 的用 StateObject，别人给的用 ObservedObject」。

#### @Environment —— 读取系统环境值

```swift
struct AdaptiveView: View {
    @Environment(\.colorScheme) var colorScheme          // 浅色/深色模式
    @Environment(\.dismiss) var dismiss                  // 关闭当前页
    @Environment(\.horizontalSizeClass) var sizeClass    // 紧凑/常规尺寸
    
    var body: some View {
        VStack {
            Text(colorScheme == .dark ? "深色模式" : "浅色模式")
            Button("关闭") {
                dismiss()                                 // 关闭 sheet/导航
            }
        }
    }
}
```

### 3.6 导航：NavigationStack + sheet

```swift
import SwiftUI

// 1) value-based 导航（iOS 16+ 推荐）
struct TempleListView: View {
    var body: some View {
        NavigationStack {
            List(temples) { temple in
                NavigationLink(value: temple) {        // 把 temple 作为目标值
                    Text(temple.name)
                }
            }
            .navigationTitle("寺院列表")
            .navigationDestination(for: Temple.self) { temple in
                TempleDetailView(temple: temple)       // 系统根据 value 类型自动路由
            }
        }
    }
}

// 2) sheet：从底部弹出的临时页面（如登录、筛选）
struct HomeView: View {
    @State private var showFilter = false
    
    var body: some View {
        Button("筛选") {
            showFilter = true
        }
        .sheet(isPresented: $showFilter) {
            FilterView()
                .presentationDetents([.medium, .large])  // 半屏/全屏
        }
    }
}

// 3) fullScreenCover：全屏覆盖（如启动页、支付页）
Button("去支付") {
    showPay = true
}
.fullScreenCover(isPresented: $showPay) {
    PaymentView()
}
```

### 3.7 列表与循环：ForEach + List

```swift
// List + ForEach 渲染动态列表
struct TempleListView: View {
    let temples: [Temple]
    
    var body: some View {
        List {
            ForEach(temples) { temple in
                TempleRow(temple: temple)            // 每行用子视图
            }
        }
        .listStyle(.plain)
    }
}

// 自定义行视图
struct TempleRow: View {
    let temple: Temple
    
    var body: some View {
        HStack(spacing: 12) {
            Image(temple.imageName)
                .resizable()
                .frame(width: 60, height: 60)
                .cornerRadius(8)
            VStack(alignment: .leading, spacing: 4) {
                Text(temple.name).font(.headline)
                Text(temple.region).font(.caption).foregroundStyle(.gray)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.gray)
        }
        .padding(.vertical, 4)
    }
}
```

### 3.8 自定义视图：提取子视图

当 `body` 太长时，提取子视图让代码更清晰：

```swift
// ❌ 反例：所有内容塞在一个 body
struct BadHomeView: View {
    var body: some View {
        VStack {
            // Banner 50 行
            // 入口卡片 30 行
            // 列表 40 行
            // ...
        }
    }
}

// ✅ 正例：按区块拆分
struct GoodHomeView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                BannerSection()
                EntryCardSection()
                HotTempleSection()
                HotMasterSection()
            }
        }
    }
}

struct BannerSection: View {
    var body: some View {
        // Banner 实现
    }
}

struct EntryCardSection: View {
    var body: some View {
        // 入口卡片实现
    }
}
```

> **技巧**：当一个 `body` 超过 50 行就该拆分了。

---

## 4. MVVM 架构实战

### 4.1 什么是 MVVM，为什么用 MVVM

**MVVM = Model - View - ViewModel**，是 SwiftUI 项目的标准架构：

```
View (SwiftUI)          ──观察──►         ViewModel (@ObservableObject)
  │                                          │
  │ 用户交互 / 状态绑定                       │ 调用 ───► APIClient
  │                                          │ 持有 ───► Model (struct, Codable)
  ▼                                          │
  渲染 UI                                    └── @Published 属性变化 ──► 触发 View 刷新
```

**为什么要用 MVVM**：
- **View 单一职责**：只负责渲染 UI 和捕获用户操作
- **ViewModel 单一职责**：只负责业务逻辑、数据加工、网络请求
- **可测试**：ViewModel 不依赖 UI，可以直接写单元测试
- **SwiftUI 天然契合**：`@Published` + `@StateObject` 自动驱动刷新

### 4.2 ViewModel 模板

```swift
import SwiftUI

@MainActor                              // 所有 UI 更新在主线程
class TempleListViewModel: ObservableObject {
    @Published var temples: [Temple] = []           // 列表数据
    @Published var isLoading = false                // 加载态
    @Published var errorMessage: String?            // 错误信息
    
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    func loadTemples() async {
        isLoading = true
        errorMessage = nil
        do {
            temples = try await apiClient.request(.temples)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

**关键点**：
- `@MainActor`：保证 `@Published` 属性在主线程更新（SwiftUI 要求）
- `@Published`：属性变化时自动通知观察的 View
- `ObservableObject`：ViewModel 必须遵守此协议
- 依赖通过 `init` 注入，便于测试和替换

### 4.3 Model 模板

```swift
import Foundation

struct Temple: Identifiable, Codable, Hashable {
    let id: String                       // Identifiable 要求
    let name: String
    let region: String
    let sect: String                     // 宗派
    let type: String                     // 汉传佛教/道教/藏传佛教
    let address: String?
    let imageName: String?
    let description: String?
    
    // CodingKeys：当 JSON 字段名与 Swift 属性名不一致时映射
    enum CodingKeys: String, CodingKey {
        case id, name, region, sect, type, address
        case imageName = "image_name"    // 后端 snake_case → Swift camelCase
        case description
    }
}
```

**约定**：
- Model 永远是 `struct`
- 遵守 `Identifiable`（List 用）、`Codable`（JSON 解析）、`Hashable`（导航用）

### 4.4 View 绑定 ViewModel 完整示例

```swift
import SwiftUI

struct TempleListView: View {
    @StateObject private var viewModel = TempleListViewModel()
    
    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("加载中...")
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 12) {
                    Text("加载失败：\(error)").foregroundStyle(.red)
                    Button("重试") {
                        Task { await viewModel.loadTemples() }
                    }
                }
            } else {
                List(viewModel.temples) { temple in
                    TempleRow(temple: temple)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("寺院列表")
        .task {                                          // 视图出现时自动调用
            await viewModel.loadTemples()
        }
        .refreshable {                                   // 下拉刷新
            await viewModel.loadTemples()
        }
    }
}
```

### 4.5 项目实际应用：寺院列表完整代码

下面是问玄东方项目中「寺院列表」三件套的完整可运行代码：

```swift
// ===== Model: Temple.swift =====
import Foundation

struct Temple: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let region: String
    let sect: String
    let type: String
    let address: String
    let imageName: String?
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, region, sect, type, address
        case imageName = "image_name"
        case description
    }
}

// ===== ViewModel: TempleListViewModel.swift =====
import SwiftUI

@MainActor
final class TempleListViewModel: ObservableObject {
    @Published var temples: [Temple] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedSect: String? = nil         // 当前筛选的宗派
    
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    var filteredTemples: [Temple] {
        guard let sect = selectedSect else { return temples }
        return temples.filter { $0.sect == sect }
    }
    
    func loadTemples() async {
        isLoading = true
        errorMessage = nil
        do {
            temples = try await apiClient.request(.temples)
        } catch let APIError.serverError(code, msg) {
            errorMessage = "服务器错误 \(code)：\(msg)"
        } catch {
            errorMessage = "网络异常：\(error.localizedDescription)"
        }
        isLoading = false
    }
}

// ===== View: TempleListView.swift =====
import SwiftUI

struct TempleListView: View {
    @StateObject private var viewModel = TempleListViewModel()
    
    private let sects = ["全部", "禅宗", "全真派", "格鲁派", "正一派"]
    
    var body: some View {
        VStack(spacing: 0) {
            // 顶部宗派筛选
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(sects, id: \.self) { sect in
                        let isSelected = viewModel.selectedSect == sect ||
                                       (sect == "全部" && viewModel.selectedSect == nil)
                        Text(sect)
                            .font(.caption)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(isSelected ? Color.brand : Color.bgTertiary)
                            .foregroundStyle(isSelected ? .white : .textTertiary)
                            .cornerRadius(9999)
                            .onTapGesture {
                                viewModel.selectedSect = (sect == "全部") ? nil : sect
                            }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            
            // 列表内容
            content
        }
        .background(Color.bgPrimary)
        .navigationTitle("找寺院")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if viewModel.temples.isEmpty {
                await viewModel.loadTemples()
            }
        }
        .refreshable {
            await viewModel.loadTemples()
        }
    }
    
    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            Spacer()
            ProgressView().tint(.accent)
            Spacer()
        } else if let error = viewModel.errorMessage {
            Spacer()
            VStack(spacing: 12) {
                Text(error).foregroundStyle(.stateError)
                Button("重试") { Task { await viewModel.loadTemples() } }
            }
            Spacer()
        } else {
            List(viewModel.filteredTemples) { temple in
                NavigationLink(value: temple) {
                    TempleCard(temple: temple)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(Color.bgPrimary)
        }
    }
}

// 卡片样式
struct TempleCard: View {
    let temple: Temple
    
    var body: some View {
        HStack(spacing: 12) {
            if let imageName = temple.imageName {
                Image(imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 80, height: 80)
                    .cornerRadius(8)
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.bgTertiary)
                    .frame(width: 80, height: 80)
                    .overlay(Image(systemName: "building.2"))
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text(temple.name).font(.headline).foregroundStyle(.textPrimary)
                Text(temple.region).font(.caption).foregroundStyle(.textSecondary)
                Text(temple.sect)
                    .font(.caption2)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(Color.accent.opacity(0.15))
                    .foregroundStyle(.accent)
                    .cornerRadius(4)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.bgSecondary)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.borderGold, lineWidth: 1)
        )
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
        .padding(.vertical, 4)
    }
}
```

---

## 5. 网络层封装

### 5.1 APIClient 完整实现

```swift
import Foundation

// 错误模型
enum APIError: Error, LocalizedError {
    case invalidURL
    case networkFailed(Error)
    case decodingFailed(Error)
    case serverError(code: Int, message: String)
    case unauthorized                                // 401，token 失效
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL 错误"
        case .networkFailed(let e): return "网络失败：\(e.localizedDescription)"
        case .decodingFailed(let e): return "解析失败：\(e.localizedDescription)"
        case .serverError(let code, let msg): return "服务器错误 \(code)：\(msg)"
        case .unauthorized: return "登录已过期，请重新登录"
        }
    }
}

// 后端统一响应格式
struct APIResponse<T: Decodable>: Decodable {
    let code: Int                       // 0 表示成功
    let message: String
    let data: T?
}

// APIClient
@MainActor
final class APIClient {
    static let shared = APIClient()
    
    #if DEBUG
    let baseURL = URL(string: "http://localhost:3001")!    // Mock Server
    #else
    let baseURL = URL(string: "https://api.dongfang.com")! // 生产环境
    #endif
    
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    // 拦截器：注入 JWT Token
    var tokenProvider: () -> String? = {
        // 从 Keychain 或 UserDefaults 读取
        return UserDefaults.standard.string(forKey: "jwt_token")
    }
    
    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
        
        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }
    
    // 核心请求方法
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let request = try buildRequest(endpoint)
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkFailed(URLError(.badServerResponse))
        }
        
        // 401 鉴权失败
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        // 非 2xx 错误
        guard (200..<300).contains(httpResponse.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "未知错误"
            throw APIError.serverError(code: httpResponse.statusCode, message: msg)
        }
        
        // 解析：如果接口用 { code, message, data } 包装
        do {
            let apiResp = try decoder.decode(APIResponse<T>.self, from: data)
            if apiResp.code == 0, let result = apiResp.data {
                return result
            }
            throw APIError.serverError(code: apiResp.code, message: apiResp.message)
        } catch {
            // 如果不是统一响应格式，直接尝试解析 data
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingFailed(error)
            }
        }
    }
    
    // 构造 URLRequest
    private func buildRequest(_ endpoint: Endpoint) throws -> URLRequest {
        var url = baseURL.appendingPathComponent(endpoint.path)
        
        // query 参数
        if let query = endpoint.query, !query.isEmpty {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
            guard let finalURL = components?.url else { throw APIError.invalidURL }
            url = finalURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        
        // 默认 Header
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // 注入 JWT Token（拦截器）
        if let token = tokenProvider() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // body
        if let body = endpoint.body {
            request.httpBody = try encoder.encode(body)
        }
        
        return request
    }
}
```

### 5.2 Endpoint 枚举设计

```swift
import Foundation

enum HTTPMethod: String {
    case GET, POST, PUT, DELETE, PATCH
}

enum Endpoint {
    case temples                                       // GET /api/v1/temples
    case templeDetail(id: String)                      // GET /api/v1/temples/{id}
    case masters(sect: String? = nil)                  // GET /api/v1/masters?sect=xxx
    case masterDetail(id: String)                      // GET /api/v1/masters/{id}
    case createBooking(BookingRequest)                 // POST /api/v1/bookings
    case login(phone: String, code: String)            // POST /api/v1/auth/login
    
    var path: String {
        switch self {
        case .temples:               return "/api/v1/temples"
        case .templeDetail(let id):  return "/api/v1/temples/\(id)"
        case .masters:               return "/api/v1/masters"
        case .masterDetail(let id):  return "/api/v1/masters/\(id)"
        case .createBooking:         return "/api/v1/bookings"
        case .login:                 return "/api/v1/auth/login"
        }
    }
    
    var method: HTTPMethod {
        switch self {
        case .temples, .templeDetail, .masters, .masterDetail:
            return .GET
        case .createBooking, .login:
            return .POST
        }
    }
    
    var query: [String: String]? {
        switch self {
        case .masters(let sect):
            return sect.map { ["sect": $0] }
        default:
            return nil
        }
    }
    
    var body: Encodable? {
        switch self {
        case .createBooking(let req): return req
        case .login(let phone, let code):
            return ["phone": phone, "code": code]
        default: return nil
        }
    }
}
```

### 5.3 Codable 自动解析 JSON

```swift
// 后端返回的 JSON：
// {
//   "code": 0,
//   "message": "success",
//   "data": {
//     "id": "T001",
//     "name": "灵隐寺",
//     "region": "浙江杭州",
//     "sect": "禅宗",
//     "type": "汉传佛教",
//     "address": "杭州市西湖区灵隐路法云弄1号",
//     "image_name": "temple-card-lingyinsi",
//     "description": "江南名刹，禅宗祖庭"
//   }
// }

// 对应的 Model：
struct Temple: Identifiable, Codable {
    let id: String
    let name: String
    let region: String
    let sect: String
    let type: String
    let address: String
    let imageName: String?
    let description: String?
    
    // 用 CodingKeys 把后端 snake_case 映射成 Swift camelCase
    enum CodingKeys: String, CodingKey {
        case id, name, region, sect, type, address, description
        case imageName = "image_name"
    }
}

// 调用：
let temple: Temple = try await apiClient.request(.templeDetail(id: "T001"))
print(temple.name)            // 灵隐寺
```

### 5.4 请求拦截器注入 JWT Token

见 5.1 中 `tokenProvider` 闭包，调用方可在 App 启动时设置：

```swift
@main
struct DongFangApp: App {
    @StateObject private var appState = AppState()
    
    init() {
        // 注入 token 提供者
        APIClient.shared.tokenProvider = {
            // 从 Keychain 读取更安全
            return KeychainHelper.shared.read(key: "jwt_token")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
```

### 5.5 统一错误处理

```swift
// 调用方统一处理
func loadTemples() async {
    do {
        temples = try await apiClient.request(.temples)
    } catch let APIError.unauthorized {
        // 401：跳转登录页
        appState.logout()
    } catch let APIError.serverError(code, msg) {
        errorMessage = "服务器错误 \(code)：\(msg)"
    } catch let APIError.networkFailed(_) {
        errorMessage = "网络异常，请检查网络后重试"
    } catch {
        errorMessage = "未知错误：\(error.localizedDescription)"
    }
}
```

### 5.6 DEBUG 模式切换 BaseURL

```swift
final class APIClient {
    #if DEBUG
    let baseURL = URL(string: "http://localhost:3001")!        // Mock Server
    #else
    let baseURL = URL(string: "https://api.dongfang.com")!     // 生产
    #endif
}

// 更灵活的方式：用编译条件区分多种环境
enum Environment {
    static var baseURL: URL {
        #if DEBUG
        return URL(string: "http://localhost:3001")!            // 本地 Mock
        // return URL(string: "http://192.168.1.100:8080")!     // 真机联调后端
        #else
        return URL(string: "https://api.dongfang.com")!
        #endif
    }
}
```

---

## 6. 工程结构详解

### 6.1 C 端 App 工程目录结构

按 `spec.md` 第 3.6 节，C 端 App 的标准目录如下：

```
askXuan-frontend/apps/ios-customer/
├── DongFangApp.xcodeproj              # Xcode 工程文件（不要手动改）
├── DongFangApp/
│   ├── App/                           # App 入口
│   │   ├── DongFangApp.swift          # @main 入口，初始化 AppState
│   │   └── ContentView.swift          # 根视图（TabView 容器）
│   ├── Core/                          # 核心基础层
│   │   ├── Network/                   # 网络层
│   │   │   ├── APIClient.swift
│   │   │   ├── Endpoint.swift
│   │   │   ├── APIError.swift
│   │   │   └── Interceptor.swift
│   │   ├── Storage/                   # 本地存储
│   │   │   ├── KeychainHelper.swift   # Keychain（存 token）
│   │   │   └── UserDefaults+Ext.swift # UserDefaults 扩展
│   │   └── Extensions/                # Swift 扩展
│   │       ├── Color+Hex.swift
│   │       ├── View+Modifiers.swift
│   │       └── String+Validation.swift
│   ├── DesignSystem/                  # 设计系统
│   │   ├── Tokens.swift               # Design Token（色彩/字体/间距）
│   │   ├── Components/                # 通用组件
│   │   │   ├── Card.swift
│   │   │   ├── PrimaryButton.swift
│   │   │   ├── SecondaryButton.swift
│   │   │   ├── TopNavBar.swift
│   │   │   ├── BottomTabBar.swift
│   │   │   ├── TagPill.swift
│   │   │   └── BannerCarousel.swift
│   │   └── Modifiers/                 # 自定义修饰符
│   │       └── CardStyle.swift
│   ├── Features/                      # 功能模块（按业务拆分）
│   │   ├── Home/                      # 首页
│   │   │   ├── HomeView.swift
│   │   │   ├── HomeViewModel.swift
│   │   │   └── Components/
│   │   ├── Temple/                    # 寺院模块
│   │   │   ├── TempleListView.swift
│   │   │   ├── TempleListViewModel.swift
│   │   │   ├── TempleDetailView.swift
│   │   │   └── TempleDetailViewModel.swift
│   │   ├── Master/                    # 师傅模块
│   │   ├── Booking/                   # 预约模块
│   │   ├── DIY/                       # DIY 手串模块
│   │   ├── AI/                        # AI 问事模块
│   │   ├── Shop/                      # 商城模块
│   │   └── Profile/                   # 我的模块
│   ├── Models/                        # 全局共享 Model
│   │   ├── Temple.swift
│   │   ├── Master.swift
│   │   ├── Booking.swift
│   │   ├── Service.swift
│   │   └── User.swift
│   ├── ViewModels/                    # 全局共享 ViewModel（少用）
│   └── Resources/                     # 资源
│       ├── Assets.xcassets            # 图片资源（AppIcon / 图片）
│       ├── fonts/                     # 自定义字体
│       │   ├── NotoSerifSC-Bold.otf
│       │   └── NotoSansSC-Regular.otf
│       └── mock/                      # 本地 Mock JSON
│           └── temples.json
└── DongFangAppTests/                  # 单元测试
    ├── TempleListViewModelTests.swift
    └── APIClientTests.swift
```

### 6.2 每个目录的职责

| 目录 | 职责 | 谁能依赖它 |
| --- | --- | --- |
| `App/` | App 启动入口、根视图 | 所有层 |
| `Core/` | 网络层、存储、扩展等基础设施 | 业务层可依赖 |
| `DesignSystem/` | 颜色、组件、修饰符 | 业务层可依赖 |
| `Features/` | 按业务模块组织页面与 ViewModel | 仅依赖 Core / DesignSystem / Models |
| `Models/` | 跨模块共享的 Model | 所有层 |
| `ViewModels/` | 跨模块共享的 ViewModel（如 AppState） | 业务层 |
| `Resources/` | 图片、字体、本地 JSON | 所有层 |

**依赖方向**：`Features → Core / DesignSystem / Models`，**不要**反向依赖。

### 6.3 按 Feature 组织代码

每个 Feature 模块内部独立组织 View + ViewModel + 子组件：

```
Features/Temple/
├── TempleListView.swift              # 列表页 View
├── TempleListViewModel.swift         # 列表页 ViewModel
├── TempleDetailView.swift            # 详情页 View
├── TempleDetailViewModel.swift       # 详情页 ViewModel
└── Components/                       # 模块专用组件（不外复用）
    ├── TempleCard.swift
    └── TempleFilterBar.swift
```

**优点**：
- 删除一个 Feature 只需删一个目录，无残留
- 模块内高内聚，跨模块低耦合
- 多人协作时按 Feature 分工互不冲突

### 6.4 资源管理

#### Assets.xcassets（图片资源）

把设计稿 `问玄东方App/assets/` 下的 27 张图片拖入 Xcode 的 `Assets.xcassets`：

```
Assets.xcassets/
├── AppIcon.appiconset/               # App 图标
├── AccentColor.colorset/             # 主题色
├── banner-ad-1.imageset/             # Banner 1
│   ├── banner-ad-1.jpg
│   └── Contents.json
├── temple-card-lingyinsi.imageset/   # 寺院卡片
└── master-avatar-miaoyin.imageset/   # 法师头像
```

使用：`Image("temple-card-lingyinsi")`（不需要写后缀）

#### 本地 JSON（Mock 数据）

```
Resources/mock/temples.json
```

加载方法：

```swift
func loadMockTemples() -> [Temple] {
    guard let url = Bundle.main.url(forResource: "temples", withExtension: "json"),
          let data = try? Data(contentsOf: url),
          let temples = try? JSONDecoder().decode([Temple].self, from: data)
    else { return [] }
    return temples
}
```

#### 自定义字体

把 `NotoSerifSC-Bold.otf`、`NotoSansSC-Regular.otf` 拖入 `Resources/fonts/`，然后在 `Info.plist` 注册：

```xml
<key>UIAppFonts</key>
<array>
    <string>NotoSerifSC-Bold.otf</string>
    <string>NotoSansSC-Regular.otf</string>
</array>
```

使用：

```swift
Text("问玄东方")
    .font(.custom("NotoSerifSC-Bold", size: 24))
```

---

## 7. 设计系统接入

### 7.1 Tokens.swift：Design Token 映射

将 `问玄东方App/colors_and_type.css` 中的 21 个色彩变量、字体、圆角映射为 Swift 常量。

```swift
// DesignSystem/Tokens.swift
import SwiftUI

extension Color {
    // === 背景 ===
    static let bgPrimary   = Color(hex: "#1C1210")      // 主背景 深檀木色
    static let bgSecondary = Color(hex: "#2A1E1A")      // 卡片背景
    static let bgTertiary  = Color(hex: "#3A2C25")      // 三级背景
    static let bgElevated  = Color(hex: "#44342C")      // 悬浮/高亮
    
    // === 品牌色（朱砂） ===
    static let brand       = Color(hex: "#C45A3C")      // 朱砂红，主 CTA
    static let brandLight  = Color(hex: "#D4735A")
    static let brandDark   = Color(hex: "#A64830")
    
    // === 强调色（琉璃金） ===
    static let accent      = Color(hex: "#C8A96E")      // 暗金色
    static let accentLight = Color(hex: "#D4BC8A")
    static let accentDark  = Color(hex: "#A88A50")
    
    // === 朱砂色 ===
    static let cinnabar       = Color(hex: "#B5453A")
    static let cinnabarLight  = Color(hex: "#CC5A4F")
    
    // === 文字 ===
    static let textPrimary   = Color(hex: "#F0E6DA")    // 温暖白
    static let textSecondary = Color(hex: "#C5B097")    // 淡金灰
    static let textTertiary  = Color(hex: "#8A7A6A")    // 灰褐色
    
    // === 状态色 ===
    static let stateSuccess = Color(hex: "#5B8C5A")
    static let stateWarning = Color(hex: "#D4A843")
    static let stateError   = Color(hex: "#C45A3C")
    
    // === 边框 ===
    static let borderGold      = Color(red: 200/255, green: 169/255, blue: 110/255, opacity: 0.15)
    static let borderGoldStrong = Color(red: 200/255, green: 169/255, blue: 110/255, opacity: 0.30)
    static let divider         = Color(red: 200/255, green: 169/255, blue: 110/255, opacity: 0.08)
}

// 十六进制色值解析
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6: r = (int >> 16) & 0xFF; g = (int >> 8) & 0xFF; b = int & 0xFF
        default: r = 0; g = 0; b = 0
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}

// 圆角 Token
enum Radius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    static let lg: CGFloat = 12
    static let xl: CGFloat = 16
}

// 间距 Token
enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
}

// 字体 Token
extension Font {
    static let brandTitle = Font.custom("NotoSerifSC-Bold", size: 20)
    static let brandTitleLarge = Font.custom("NotoSerifSC-Bold", size: 28)
    static let bodyText = Font.custom("NotoSansSC-Regular", size: 14)
    static let bodyTextBold = Font.custom("NotoSansSC-Bold", size: 14)
}
```

使用：

```swift
Text("灵隐寺")
    .font(.brandTitle)
    .foregroundStyle(.textPrimary)

RoundedRectangle(cornerRadius: Radius.lg)
    .fill(Color.bgSecondary)
```

### 7.2 通用组件实现

#### Card 组件

```swift
// DesignSystem/Components/Card.swift
struct Card<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(12)
            .background(Color.bgSecondary)
            .cornerRadius(Radius.lg)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.lg)
                    .stroke(Color.borderGold, lineWidth: 1)
            )
    }
}

// 使用
Card {
    VStack(alignment: .leading, spacing: 8) {
        Text("灵隐寺").font(.headline).foregroundStyle(.textPrimary)
        Text("禅宗 · 杭州").font(.caption).foregroundStyle(.textSecondary)
    }
}
```

#### PrimaryButton（朱砂渐变）

```swift
// DesignSystem/Components/PrimaryButton.swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.bodyTextBold)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [Color.brand, Color(hex: "#D97B4A")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(Radius.md)
        }
        .buttonStyle(.plain)
    }
}

// 使用
PrimaryButton(title: "立即预约") {
    Task { await viewModel.submitBooking() }
}
```

#### TopNavBar（毛玻璃）

```swift
// DesignSystem/Components/TopNavBar.swift
struct TopNavBar<Title: View, Leading: View, Trailing: View>: View {
    let title: Title
    let leading: Leading
    let trailing: Trailing
    
    init(
        @ViewBuilder title: () -> Title,
        @ViewBuilder leading: () -> Leading,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.title = title()
        self.leading = leading()
        self.trailing = trailing()
    }
    
    var body: some View {
        ZStack {
            // 毛玻璃背景（对应 .top-nav: backdrop-filter: blur(12px)）
            Color.bgPrimary.opacity(0.92)
                .background(.ultraThinMaterial)
                .ignoresSafeArea(edges: .top)
            
            HStack {
                leading
                Spacer()
                title
                Spacer()
                trailing
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(height: 44)
        }
        .overlay(Rectangle().fill(Color.divider).frame(height: 1), alignment: .bottom)
    }
}

// 简化使用
extension TopNavBar where Title == Text, Leading == EmptyView, Trailing == EmptyView {
    init(_ title: String) {
        self.init(title: { Text(title).font(.headline).foregroundStyle(.textPrimary) },
                  leading: { EmptyView() },
                  trailing: { EmptyView() })
    }
}

// 使用
TopNavBar("寺院详情")
```

---

## 8. 与后端联调

### 8.1 Info.plist 配置 ATS 例外

iOS 默认禁止明文 HTTP 请求（App Transport Security），开发时需要允许 `http://localhost`：

**方法 A：完全关闭 ATS（仅 DEBUG）**

在 Xcode 中选中工程 → TARGETS → Info → 添加 `App Transport Security Settings`：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**方法 B：仅允许 localhost（更安全，推荐）**

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 8.2 模拟器与真机访问后端

| 设备 | 后端地址 | 说明 |
| --- | --- | --- |
| 模拟器 | `http://localhost:3001` 或 `http://localhost:8080` | 模拟器与 Mac 共享网络栈，可直接访问 localhost |
| 真机 | `http://192.168.x.x:3001`（Mac 局域网 IP） | 真机与 Mac 必须在同一 Wi-Fi |

**查 Mac 局域网 IP**：系统偏好设置 → 网络，或终端执行：

```bash
ipconfig getifaddr en0
# 输出类似：192.168.1.105
```

### 8.3 #if DEBUG 切换 BaseURL

```swift
enum AppConfig {
    static var baseURL: URL {
        #if DEBUG
        // 本地开发：模拟器走 Mock Server
        // 真机联调改为 Mac 局域网 IP
        return URL(string: "http://localhost:3001")!
        // return URL(string: "http://192.168.1.105:8080")!
        #else
        // 生产环境
        return URL(string: "https://api.dongfang.com")!
        #endif
    }
    
    static var isMockEnabled: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}
```

### 8.4 抓包调试（可选）

**Proxyman（推荐，免费试用，原生 macOS）**

```bash
brew install --cask proxyman
```

启用 Proxyman 后：
1. 顶部菜单 `Certificate` → `Install Certificate on iOS` → 模拟器
2. 启动 Proxyman 抓包
3. App 发起请求会自动被 Proxyman 拦截，可查看 Request / Response 完整内容、修改重放

**Charles**（经典，付费）：使用方式类似，需要安装 Charles 根证书到模拟器。

抓包典型用途：
- 看请求是否真的发出、参数是否正确
- 看响应体结构是否与 Model 字段对得上
- 修改响应测试错误分支（如改 500 看错误提示是否正常）

---

## 9. 创建第一个页面实战

本章从零开始创建一个完整的「寺院列表页」，对接 `http://localhost:3001/api/v1/temples` 接口。

### 9.1 步骤总览

1. 在 Xcode 中创建 SwiftUI 文件 `TempleListView.swift`
2. 定义 `Temple` Model
3. 实现 `TempleListViewModel`（调用 `/api/v1/temples`）
4. 实现 `TempleListView`（List + 卡片样式）
5. 接入主界面

### 9.2 步骤 1：创建 Swift 文件

在 Xcode 中：
1. `File → New → File from Template...`
2. 选 `Swift File`，命名 `TempleListView.swift`，保存到 `Features/Temple/` 目录
3. 勾选 `Targets: DongFangApp`，确保文件加入编译目标

> **专业技巧**：用 SwiftUI View 模板（带 `#Preview`）更方便预览。

### 9.3 步骤 2：定义 Temple Model

新建 `Models/Temple.swift`：

```swift
import Foundation

struct Temple: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let region: String
    let sect: String
    let type: String
    let address: String
    let imageName: String?
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, region, sect, type, address, description
        case imageName = "image_name"
    }
}
```

### 9.4 步骤 3：实现 TempleListViewModel

新建 `Features/Temple/TempleListViewModel.swift`：

```swift
import SwiftUI

@MainActor
final class TempleListViewModel: ObservableObject {
    @Published var temples: [Temple] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedSect: String? = nil
    
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    var filteredTemples: [Temple] {
        guard let sect = selectedSect else { return temples }
        return temples.filter { $0.sect == sect }
    }
    
    var availableSects: [String] {
        var sects = Set(temples.map { $0.sect })
        return ["全部"] + Array(sects).sorted()
    }
    
    func loadTemples() async {
        isLoading = true
        errorMessage = nil
        do {
            temples = try await apiClient.request(.temples) as [Temple]
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

### 9.5 步骤 4：实现 TempleListView

新建 `Features/Temple/TempleListView.swift`：

```swift
import SwiftUI

struct TempleListView: View {
    @StateObject private var viewModel = TempleListViewModel()
    
    var body: some View {
        VStack(spacing: 0) {
            // 顶部宗派筛选条
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(viewModel.availableSects, id: \.self) { sect in
                        let isSelected = viewModel.selectedSect == sect ||
                                       (sect == "全部" && viewModel.selectedSect == nil)
                        Text(sect)
                            .font(.caption)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(isSelected ? Color.brand : Color.bgTertiary)
                            .foregroundStyle(isSelected ? .white : .textTertiary)
                            .cornerRadius(9999)
                            .onTapGesture {
                                viewModel.selectedSect = (sect == "全部") ? nil : sect
                            }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            .background(Color.bgPrimary)
            
            // 内容区
            content
                .background(Color.bgPrimary)
        }
        .background(Color.bgPrimary)
        .navigationTitle("找寺院")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if viewModel.temples.isEmpty {
                await viewModel.loadTemples()
            }
        }
        .refreshable {
            await viewModel.loadTemples()
        }
    }
    
    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading {
            Spacer()
            ProgressView()
                .tint(.accent)
                .scaleEffect(1.2)
            Spacer()
        } else if let error = viewModel.errorMessage {
            Spacer()
            VStack(spacing: 16) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.largeTitle)
                    .foregroundStyle(.stateError)
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                PrimaryButton(title: "重试") {
                    Task { await viewModel.loadTemples() }
                }
                .padding(.horizontal, 48)
            }
            Spacer()
        } else {
            List(viewModel.filteredTemples) { temple in
                NavigationLink(value: temple) {
                    TempleCard(temple: temple)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        }
    }
}

struct TempleCard: View {
    let temple: Temple
    
    var body: some View {
        HStack(spacing: 12) {
            if let imageName = temple.imageName {
                Image(imageName)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 84, height: 84)
                    .cornerRadius(Radius.md)
            } else {
                RoundedRectangle(cornerRadius: Radius.md)
                    .fill(Color.bgTertiary)
                    .frame(width: 84, height: 84)
                    .overlay(
                        Image(systemName: "building.2.fill")
                            .foregroundStyle(.textTertiary)
                    )
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text(temple.name)
                    .font(.headline)
                    .foregroundStyle(.textPrimary)
                Text(temple.region)
                    .font(.caption)
                    .foregroundStyle(.textSecondary)
                HStack(spacing: 6) {
                    Text(temple.sect)
                    Text("·")
                    Text(temple.type)
                }
                .font(.caption2)
                .foregroundStyle(.accent)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.textTertiary)
        }
        .padding(12)
        .background(Color.bgSecondary)
        .cornerRadius(Radius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.lg)
                .stroke(Color.borderGold, lineWidth: 1)
        )
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        TempleListView()
    }
    .preferredColorScheme(.dark)
}
```

### 9.6 步骤 5：接入主界面

修改 `App/ContentView.swift`，把 `TempleListView` 接入 Tab：

```swift
import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Image(systemName: "house")
                Text("首页")
            }
            .tag(0)
            
            NavigationStack {
                TempleListView()                    // 临时挂在第二个 Tab 调试
            }
            .tabItem {
                Image(systemName: "mappin.circle")
                Text("寺院")
            }
            .tag(1)
            
            // 其他 Tab...
        }
        .tint(.brand)
    }
}
```

### 9.7 运行验证

1. 启动 Mock Server：

```bash
cd askXuan-frontend/packages/mock-server
npm install
npm run dev
# 监听 http://localhost:3001
```

2. 在 Xcode 按 `Cmd+R` 运行模拟器
3. 切到「寺院」Tab，应看到 6 座寺院（灵隐寺 / 白云观 / 少林寺 / 大昭寺 / 普陀山 / 武当山）
4. 点击顶部宗派标签可筛选
5. 下拉刷新

> 如果运行报错 `Cannot connect to host`，检查 Info.plist ATS 配置和 Mock Server 是否在运行。

---

## 10. 调试技巧

### 10.1 Xcode 断点调试

1. **打断点**：在代码行号左侧点击，出现蓝色箭头
2. **运行到断点**：`Cmd+R` 启动，程序运行到断点会自动暂停
3. **查看变量**：底部 `Variables View` 中可查看所有局部变量
4. **逐行执行**：
   - `F6`（`Step Over`）：执行当前行，不进入函数
   - `F7`（`Step Into`）：进入函数内部
   - `F8`（`Step Out`）：跳出当前函数
5. **条件断点**：右键断点 → `Edit Breakpoint`，可设条件（如 `temples.count == 0`）、忽略次数
6. **符号断点**：`Breakpoint Navigator → + → Symbolic Breakpoint`，可在 `UIViewController.viewDidLoad` 等系统方法处自动暂停

### 10.2 Print 与 os.Logger

```swift
// 简单 print（仅 DEBUG 控制台）
print("寺院数量：\(temples.count)")

// 更专业：os.Logger（iOS 14+，可在 Console.app 过滤）
import os

let logger = Logger(subsystem: "com.dongfang.app", category: "TempleList")

logger.debug("开始加载寺院列表")
logger.info("加载成功，共 \(temples.count) 座寺院")
logger.error("加载失败：\(error.localizedDescription, privacy: .public)")

// 在 Console.app 中按 subsystem:com.dongfang.app 过滤
```

### 10.3 SwiftUI Preview 实时预览

在文件底部加 `#Preview`，无需运行 App 就能实时看到界面：

```swift
#Preview {
    NavigationStack {
        TempleListView()
    }
    .preferredColorScheme(.dark)
}

// 带模拟数据预览（推荐）
#Preview("加载中") {
    TempleListView()
        .environmentObject(AppState.preview)
}

#Preview("错误态") {
    // 注入 Mock ViewModel 触发错误态
}
```

操作：
- `Cmd+Option+P`：刷新预览
- `Cmd+Option+Enter`：显示/隐藏预览面板

### 10.4 模拟器快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Cmd+R` | 编译并运行 |
| `Cmd+.` | 停止运行 |
| `Cmd+Shift+H` | 回到主屏（Home 键） |
| `Cmd+Shift+K` | 清理构建（Clean Build Folder） |
| `Cmd+B` | 仅编译，不运行 |
| `Cmd+Shift+H`（双击） | 进入多任务切换 |
| `Cmd+←` / `Cmd+→` | 旋转模拟器 |
| `Cmd+1` / `2` / `3` | 缩放比例 100% / 75% / 50% |
| `Cmd+S` | 截屏 |
| `Cmd+Shift+Y` | 显示/隐藏调试区 |

### 10.5 View Debugger（调试视图层级）

当 UI 错位、元素重叠但看不出问题时：

1. 运行 App 到出问题的页面
2. Xcode 顶部菜单 `Debug → View Debugging → Capture View Hierarchy`（或工具栏的「三个矩形」图标）
3. 3D 视图展示所有视图层级，可拖动旋转
4. 点击任一视图，右侧 Inspector 显示其 Frame、约束、修饰符

---

## 11. 推荐学习资源

### 11.1 Apple 官方

| 资源 | 链接 | 用途 |
| --- | --- | --- |
| **SwiftUI Tutorial**（强烈推荐入门） | https://developer.apple.com/tutorials/swiftui | Apple 官方手把手教程，跟着做 2 天可入门 |
| Apple Developer Documentation | https://developer.apple.com/documentation/ | API 查询权威来源 |
| Swift Language Guide（中文） | https://swiftgg.gitbook.io/swift/ | SwiftGG 翻译的中文版 |
| Human Interface Guidelines | https://developer.apple.com/design/human-interface-guidelines/ | iOS 设计规范 |

### 11.2 免费高质量教程

| 资源 | 链接 | 说明 |
| --- | --- | --- |
| **100 Days of SwiftUI** | https://www.hackingwithswift.com/100/swiftui | Paul Hudson 出品，100 天每天 1 小时，免费，强烈推荐 |
| Hacking with Swift | https://www.hackingwithswift.com/ | 大量免费文章与示例代码 |
| SwiftUI Lab | https://swiftui-lab.com/ | SwiftUI 深入技术文章 |

### 11.3 WWDC 视频

- https://developer.apple.com/videos/
- 每年 6 月 WWDC 一两千场技术视频，搜索关键词：
  - `SwiftUI`（每年都有新特性介绍）
  - `Discover concurrency in Swift`（async/await 入门）
  - `Demystify SwiftUI`（理解 SwiftUI 性能）

### 11.4 中文资源

| 资源 | 链接 | 说明 |
| --- | --- | --- |
| **SwiftGG** | https://swiftgg.gitbook.io/swift/ | Swift 官方文档中文翻译 |
| **objc 中国** | https://objccn.io/ | 高质量 iOS 深度技术文章 |
| 王巍（onevcat）的博客 | https://onevcat.com/ | 《Swifter》作者，Swift 早期布道者 |
| Swift 微客栈 / 老司机技术周报 | 微信公众号 | 持续推送 Swift/SwiftUI 资讯 |

### 11.5 书籍

- 《Swift 编程》（Swift Programming: The Big Nerd Ranch Guide）
- 《Swift 进阶》（Swift Apprentice，Raywenderlich）
- 《SwiftUI 编程思想》（Thinking in SwiftUI）

---

## 12. 问玄东方项目开发路线图

依据 `.trae/specs/scaffold-dongfang-fullstack/tasks.md`，C 端 App 的 iOS 开发分五步走。**强烈建议先通读本指南 + 跟着 100 Days of SwiftUI 做 30 天再开始第 1 步**。

### 第一步：跑通首页（Task 21）

**目标**：完成首页（`home`），用户能看到 Banner、入口卡片、热门寺院/师傅横向滚动。

**对应 Task**：`Task 21: 实现首页（home）`
- SubTask 21.1：Banner 轮播（3 张广告图，自动播放 + 手势滑动）
- SubTask 21.2：找寺院 / 找师傅双入口卡片
- SubTask 21.3：热门服务 4x2 网格（DIY/祈福/供灯/上香/还愿/超度/开光/化太岁）
- SubTask 21.4：热门寺院横向滚动
- SubTask 21.5：热门师傅横向滚动
- SubTask 21.6：接入 ViewModel 调用 `/temples`、`/masters` 接口
- SubTask 21.7：视觉与 `问玄东方App/pages/home.html` 像素级对齐

**前置依赖**：Task 18（工程初始化）+ Task 19（组件库）+ Task 20（网络层）必须先完成。

**关键技能点**：ScrollView 横向滚动、LazyVGrid 网格、TabView 轮播、APIClient 调用。

### 第二步：寺院列表与详情页（Task 22）

**目标**：用户能浏览 6 座寺院、点击进入详情页。

**对应 Task**：`Task 22: 实现寺院模块（temple-list + temple-detail）`
- SubTask 22.1：`temple-list`：教派标签横滑 + 左侧地域筛选 + 寺院卡片列表
- SubTask 22.2：`temple-detail`：Hero 大图 + 4 Tab（基础信息 / 公共服务 / 大师团队 / 文创）
- SubTask 22.3：接入 `/temples`、`/temples/{id}` 接口
- SubTask 22.4：卡片点击跳转、返回导航

**关键技能点**：NavigationStack value-based 导航、Tab 切换、Hero 大图布局。

> **本文档第 9 章已经演示了「寺院列表页」的完整实现**，可作为本步的起点。

### 第三步：师傅列表与主页（Task 23）

**目标**：用户能浏览法师列表、查看法师主页。

**对应 Task**：`Task 23: 实现师傅模块（master-list + master-profile）`
- SubTask 23.1：`master-list`：教派分类标签 + 4 维筛选（寺院 / 职位 / 宗派 / 价格）+ 师傅卡片列表
- SubTask 23.2：`master-profile`：背景区 + 5 Tab（资质 / 预约 / 文创 / 视频 / 咨询）+ “立即咨询 / 预约服务”双入口；即时咨询按法师权威报价独立付费，不要求先预约服务
- SubTask 23.3：接入 `/masters`、`/masters/{id}` 接口

**关键技能点**：复杂筛选状态管理、ZStack 背景层、底部固定操作栏。

### 第四步：预约下单流程（Task 24 + Task 25）

**目标**：打通「寺院 / 师傅 → 选服务 → 选日期时段 → 提交预约」核心闭环。

**对应 Task**：
- `Task 24: 实现预约下单模块（booking）`
  - SubTask 24.1：服务摘要卡 + 服务项单选 + 日期时段选择 + 备注输入
  - SubTask 24.2：价格汇总（服务费 + 随喜功德 + 合计）
  - SubTask 24.3：底部「确认预约并支付」朱砂按钮
  - SubTask 24.4：接入 `POST /bookings` 提交预约
  - SubTask 24.5：预约成功页与状态反馈
- `Task 25: 实现 Tab 容器与导航拓扑`
  - SubTask 25.1：5 Tab 容器（首页 / 对话 / AI 问事 / 商城 / 我的）
  - SubTask 25.2：NavigationStack 路由管理
  - SubTask 25.3：`home → temple-list → temple-detail → booking` 链路
  - SubTask 25.4：`home → master-list → master-profile → booking` 链路
  - SubTask 25.5：`home → ad-landing` 独立返回分支
  - SubTask 25.6：底部 Dock 只在五个 Tab 根页面显示；进入二级及更深页面后隐藏，使用系统返回按钮和屏幕边缘返回手势

**关键技能点**：多步表单状态管理、POST 请求、TabView + NavigationStack 嵌套、路由管理。

> 至此 **MVP-1 核心闭环完成**：用户可浏览寺院 / 师傅并提交预约。下一步可与后端联调（Task 42）。

### 第五步：补齐其他模块（Task 26-31）

| Task | 模块 | 阶段 |
| --- | --- | --- |
| Task 26 | AI 问事（ai-divination） | MVP-2 |
| Task 27 | DIY 手串（diy-bracelet / diy-design / diy-order） | 二期 |
| Task 28 | 7 种服务列表页（service-*） | MVP-2 |
| Task 29 | 对话（chat） | MVP-2 |
| Task 30 | 商城（shop） | 二期 |
| Task 31 | 我的（profile） | MVP-2 |

法师工作台 App（P03）见 `Task 32-36`，复用 C 端设计系统组件库与网络层，可独立成另一条开发线。
法师端同样只在工作台、预约、消息、我的四个根页面显示 Dock；预约详情、对话和其他二级页面隐藏 Dock。

### 路线图小结

```
Task 18 (工程初始化)
    ↓
Task 19 (组件库)  ←─── 复用 Design Token
    ↓
Task 20 (网络层)
    ↓
Task 21 (首页)  ──→  Task 22 (寺院)  ──→  Task 23 (师傅)  ──→  Task 24 (预约)  ──→  Task 25 (导航拓扑)
    │                                                                                       │
    └───────────────────────────────── MVP-1 闭环 ─────────────────────────────────────────┘
                                                                                             ↓
                                                                              Task 26-31 (补齐其他模块)
                                                                                             ↓
                                                                              Task 42 (联调) → Task 43/44 (验收)
```

**建议节奏**：
- 第 1 周：通读本指南 + 100 Days of SwiftUI 前 30 天
- 第 2 周：完成 Task 18-20（工程/组件/网络层）
- 第 3 周：完成 Task 21（首页）
- 第 4 周：完成 Task 22-23（寺院 + 师傅）
- 第 5 周：完成 Task 24-25（预约 + 导航），MVP-1 闭环

---

> 本指南到此结束。如遇问题，先查阅第 11 章学习资源，再回看对应章节代码示例。Happy coding! 🙏
