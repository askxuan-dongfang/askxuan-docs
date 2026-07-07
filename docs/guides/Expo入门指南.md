# 问玄东方 · Expo（React Native）开发入门指南

> 面向零基础读者的 Expo + React Native + TypeScript 开发指南。
> 项目「问玄东方」是佛道教文化服务平台，禅意国潮深色风格。
> 后端为 Go + go-zero 微服务，移动端采用 Expo（替代原生 Swift 方案）。
> 阅读本文后，你将能独立完成从环境搭建、第一个页面、到 EAS 云端构建出包的完整流程。

---

## 目录

1. [环境准备](#1-环境准备)
2. [React 核心概念](#2-react-核心概念)
3. [React Native 核心](#3-react-native-核心)
4. [Expo 工具链](#4-expo-工具链)
5. [创建第一个页面实战](#5-创建第一个页面实战)
6. [导航（expo-router）](#6-导航expo-router)
7. [状态管理](#7-状态管理)
8. [网络层与后端联调](#8-网络层与后端联调)
9. [设计系统接入](#9-设计系统接入)
10. [EAS Build 云端构建](#10-eas-build-云端构建)
11. [EAS Update 热更新](#11-eas-update-热更新)
12. [调试技巧](#12-调试技巧)
13. [推荐学习资源](#13-推荐学习资源)
14. [问玄东方项目开发路线图](#14-问玄东方项目开发路线图)

---

## 1. 环境准备

### 1.1 系统要求

Expo 支持三大操作系统开发：

| 系统 | 支持情况 | 说明 |
| --- | --- | --- |
| macOS | ⭐ 最佳 | 可同时运行 iOS 模拟器与 Android 模拟器；EAS 云端构建也最顺 |
| Windows | 良好 | 可运行 Android 模拟器；iOS 需依赖 EAS 云端构建 |
| Linux | 良好 | 同 Windows；iOS 依赖 EAS 云端构建 |

本指南以 Mac（macOS 27）为主，Windows/Linux 操作类似。

### 1.2 安装 Node.js 20 LTS（推荐 nvm）

React Native 需要 Node.js 运行时。推荐使用 `nvm`（Node Version Manager）管理多版本。

```bash
# 1. 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. 重新加载 shell 配置（或重开终端）
source ~/.zshrc

# 3. 安装并使用 Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# 4. 验证
node -v   # 应输出 v20.x.x
npm -v    # 应输出 10.x.x
```

### 1.3 安装 Expo CLI

Expo CLI 既可全局安装，也可直接用 `npx` 临时调用（推荐后者，避免版本过期）。

```bash
# 方式一：全局安装（可选）
npm install -g expo-cli

# 方式二：直接用 npx（推荐，永远使用最新版）
npx expo --version
```

### 1.4 注册 Expo 账号

用户已注册 Expo Dev 平台，跳过。如未注册：

1. 访问 https://expo.dev/signup
2. 用邮箱注册（建议用工作邮箱，便于团队协作）
3. 记住账号密码，后续 EAS 登录要用

### 1.5 安装 Expo Go App（手机端）

Expo Go 是 Expo 官方提供的「预览器」App，扫码即可在手机上运行你正在开发的工程，免去编译步骤。

- **iOS**：在 App Store 搜索「Expo Go」安装
- **Android**：在 Google Play 搜索「Expo Go」安装；或访问 https://expo.dev/go 下载 APK

> iOS 模拟器和 Android 模拟器内也可安装 Expo Go，但真机扫码体验最直观。

### 1.6 安装 EAS CLI

EAS（Expo Application Services）是 Expo 的云端构建/发布/热更新服务。

```bash
# 全局安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 验证
eas --version
eas whoami   # 应输出你的 Expo 用户名
```

### 1.7 可选：安装 Xcode（iOS 模拟器）

```bash
# 从 Mac App Store 安装 Xcode（约 12GB，耗时较长）
# 安装完成后，启动一次 Xcode 同意协议，并安装 Command Line Tools
xcode-select --install
```

安装后即可用 iOS 模拟器预览（无需真机）：

```bash
npx expo start --ios
```

### 1.8 可选：安装 Android Studio（Android 模拟器）

1. 下载安装 Android Studio：https://developer.android.com/studio
2. 启动后通过 SDK Manager 安装 Android SDK
3. 通过 Virtual Device Manager 创建一个模拟器（推荐 Pixel 7 + API 34）
4. 配置环境变量（写入 `~/.zshrc`）：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

启动预览：

```bash
npx expo start --android
```

### 1.9 可选：安装 Watchman（Mac，提升文件监听性能）

Watchman 是 Facebook 出品的文件监听工具，能显著提升 React Native 开发时热重载的稳定性。

```bash
brew install watchman
watchman --version
```

### 1.10 验证安装

打开终端，依次执行以下命令，全部能输出版本号即环境就绪：

```bash
node -v              # v20.x.x
npm -v               # 10.x.x
npx expo --version   # expo-cli 版本
eas --version        # eas-cli 版本
```

---

## 2. React 核心概念

React Native 基于 React，所以先理解 React 的核心概念。本节所有代码均为 React 通用语法，不涉及原生组件。

### 2.1 JSX 语法

JSX 是 JavaScript 的语法扩展，让你在 JS 里写类似 HTML 的标签。

```jsx
// JSX：直接在 JS 里写标签
const element = <h1>你好，问玄东方</h1>;

// 等价的不用 JSX 的写法（了解即可，实际开发都用 JSX）
const element2 = React.createElement('h1', null, '你好，问玄东方');

// JSX 中可以用大括号 {} 嵌入任何 JS 表达式
const name = '禅意';
const greeting = <h1>欢迎来到{name}世界</h1>;
```

### 2.2 函数组件（Function Component）

组件是 React 的基本单元。函数组件就是一个返回 JSX 的函数。

```tsx
// 最简单的函数组件
function Welcome() {
  return <Text>欢迎来到问玄东方</Text>;
}

// 箭头函数写法（更常见）
const Welcome = () => {
  return <Text>欢迎来到问玄东方</Text>;
};

// 使用组件（注意首字母必须大写）
<Welcome />
```

### 2.3 Props（父子传参）

Props 是父组件传给子组件的数据，只读。

```tsx
// 子组件：接收 props
type TempleCardProps = {
  name: string;
  region: string;
};

const TempleCard = (props: TempleCardProps) => {
  return (
    <View>
      <Text>寺院：{props.name}</Text>
      <Text>地区：{props.region}</Text>
    </View>
  );
};

// 父组件：传递 props
const App = () => {
  return <TempleCard name="灵隐寺" region="浙江杭州" />;
};
```

解构赋值写法更简洁：

```tsx
const TempleCard = ({ name, region }: TempleCardProps) => {
  return (
    <View>
      <Text>寺院：{name}</Text>
      <Text>地区：{region}</Text>
    </View>
  );
};
```

### 2.4 State（useState Hook）

State 是组件内部的、可变的数据。用 `useState` 创建。

```tsx
import { useState } from 'react';

const Counter = () => {
  // count 是当前值，setCount 是更新函数，0 是初始值
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>当前计数：{count}</Text>
      <TouchableOpacity onPress={() => setCount(count + 1)}>
        <Text>点我 +1</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**关键点**：调用 `setCount` 后，React 会用新值重新渲染组件。**不要直接修改** `count = count + 1`，必须用 `setCount`。

### 2.5 副作用（useEffect Hook）

`useEffect` 用于处理「副作用」：数据请求、订阅、定时器、手动 DOM 操作等。

```tsx
import { useState, useEffect } from 'react';

const TempleList = () => {
  const [temples, setTemples] = useState([]);

  // 第二个参数 [] 表示只在组件首次挂载时执行一次
  useEffect(() => {
    // 模拟接口请求
    fetch('https://api.example.com/temples')
      .then((res) => res.json())
      .then((data) => setTemples(data));
  }, []);

  return (
    <View>
      {temples.map((t) => (
        <Text key={t.id}>{t.name}</Text>
      ))}
    </View>
  );
};
```

依赖数组的三种情况：

```tsx
useEffect(() => { /* ... */ });          // 每次渲染都执行（少用）
useEffect(() => { /* ... */ }, []);      // 仅首次挂载执行（常用于请求数据）
useEffect(() => { /* ... */ }, [count]); // count 变化时执行
```

### 2.6 列表渲染（map + key）

用 `map` 遍历数组生成一组元素，**每个元素必须加 `key`**（用唯一 id）。

```tsx
const temples = [
  { id: 1, name: '灵隐寺' },
  { id: 2, name: '法门寺' },
  { id: 3, name: '少林寺' },
];

const TempleList = () => {
  return (
    <View>
      {temples.map((temple) => (
        <Text key={temple.id}>{temple.name}</Text>
      ))}
    </View>
  );
};
```

> React Native 中列表推荐用 `FlatList`（见第 3 节），但 `map` 在小列表中也很常用。

### 2.7 条件渲染（&& / 三元）

```tsx
const Profile = ({ isLoggedIn, userName }) => {
  return (
    <View>
      {/* 写法一：逻辑与 && */}
      {isLoggedIn && <Text>欢迎回来，{userName}</Text>}

      {/* 写法二：三元表达式 */}
      {isLoggedIn ? (
        <Text>已登录</Text>
      ) : (
        <Text>请登录</Text>
      )}
    </View>
  );
};
```

### 2.8 事件处理（onPress / onChangeText）

React Native 中按钮点击是 `onPress`，输入框变化是 `onChangeText`（注意与 Web 的 `onChange` 不同）。

```tsx
const Login = () => {
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    console.log('登录手机号：', phone);
  };

  return (
    <View>
      <TextInput
        placeholder="请输入手机号"
        value={phone}
        onChangeText={setPhone}  {/* 直接传 setPhone 函数 */}
      />
      <TouchableOpacity onPress={handleLogin}>
        <Text>登录</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2.9 自定义 Hook 基础

自定义 Hook 是以 `use` 开头的函数，用于复用带状态的逻辑。

```tsx
import { useState, useEffect } from 'react';

// 自定义 Hook：封装「请求寺院列表」的逻辑
const useTemples = () => {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.example.com/temples')
      .then((res) => res.json())
      .then((data) => {
        setTemples(data);
        setLoading(false);
      });
  }, []);

  return { temples, loading };  // 返回需要的数据
};

// 使用
const HomeScreen = () => {
  const { temples, loading } = useTemples();  // 复用逻辑

  if (loading) return <Text>加载中...</Text>;
  return (
    <View>
      {temples.map((t) => (
        <Text key={t.id}>{t.name}</Text>
      ))}
    </View>
  );
};
```

---

## 3. React Native 核心

### 3.1 与 React 的区别

React Native 与 Web React 的唯一区别：**不用 HTML 标签（div/span/p），改用原生组件（View/Text/ScrollView）**。

| Web (HTML) | React Native | 用途 |
| --- | --- | --- |
| `<div>` | `<View>` | 容器 |
| `<span>` / `<p>` | `<Text>` | 文本（RN 中所有文字必须在 Text 内） |
| `<img>` | `<Image>` | 图片 |
| `<input>` | `<TextInput>` | 输入框 |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` | 可点击区域 |
| `<ul>/<li>` | `<FlatList>` | 长列表 |
| `<div style="overflow:scroll">` | `<ScrollView>` | 滚动容器 |

### 3.2 核心组件

```tsx
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
} from 'react-native';

const Demo = () => {
  const data = [
    { id: '1', title: '禅修' },
    { id: '2', title: '法事' },
    { id: '3', title: '开光' },
  ];

  return (
    {/* SafeAreaView：避开刘海/状态栏 */}
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1210' }}>
      {/* ScrollView：内容可滚动 */}
      <ScrollView>
        <Text style={{ fontSize: 24, color: '#C8A96E' }}>问玄东方</Text>

        {/* Image：必须指定宽高 */}
        <Image
          source={{ uri: 'https://example.com/banner.jpg' }}
          style={{ width: '100%', height: 160 }}
        />

        {/* TextInput：输入框 */}
        <TextInput
          placeholder="搜索寺院"
          style={{ borderWidth: 1, borderColor: '#C8A96E', padding: 8 }}
        />

        {/* FlatList：高性能长列表 */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text>{item.title}</Text>}
        />

        {/* TouchableOpacity：点击透明度变化 */}
        <TouchableOpacity onPress={() => console.log('pressed')}>
          <Text>点我</Text>
        </TouchableOpacity>

        {/* Pressable：更灵活的点击组件（新推荐） */}
        <Pressable onPress={() => console.log('pressed')}>
          <Text>也可以点我</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### 3.3 样式：StyleSheet.create

RN 样式类似 CSS，但用驼峰命名（`backgroundColor` 而非 `background-color`），且**无后代选择器、无级联**。

```tsx
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1210',   // 驼峰命名
    paddingHorizontal: 16,        // 内边距
  },
  title: {
    fontSize: 20,
    color: '#C8A96E',
    fontWeight: 'bold',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#2A1E1A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 110, 0.15)',
  },
});

const App = () => (
  <View style={styles.container}>
    <Text style={styles.title}>问玄东方</Text>
    <View style={styles.card}>
      <Text>禅意卡片</Text>
    </View>
  </View>
);
```

### 3.4 Flexbox 布局

RN 默认 `flexDirection: 'column'`（Web 默认是 `row`）。常用属性：

```tsx
const styles = StyleSheet.create({
  // 水平排列，两端对齐，垂直居中
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',  // 主轴对齐：flex-start/center/end/space-between/space-around
    alignItems: 'center',             // 交叉轴对齐：flex-start/center/flex-end/stretch
    padding: 16,
  },
  // 占满剩余空间
  flex1: {
    flex: 1,
  },
  // 固定比例
  left: { flex: 1 },
  right: { flex: 2 },   // 右侧占左侧两倍
});
```

```tsx
<View style={styles.row}>
  <Text style={styles.left}>左侧</Text>
  <Text style={styles.right}>右侧</Text>
</View>
```

### 3.5 平台判断：Platform.OS

```tsx
import { Platform, View, Text } from 'react-native';

const App = () => (
  <View>
    <Text>当前平台：{Platform.OS}</Text>
    {/* Platform.OS 返回 'ios' 或 'android' */}
    {Platform.OS === 'ios' && <Text>iOS 专属内容</Text>}
  </View>
);

// 也可以用 Platform.select 简化
const padding = Platform.select({
  ios: 30,      // iOS 顶部多留白
  android: 20,
});
```

### 3.6 常用第三方库

| 库 | 用途 | 安装 |
| --- | --- | --- |
| `react-native-safe-area-context` | 安全区域（刘海/底部横条） | `npx expo install react-native-safe-area-context` |
| `expo-linear-gradient` | 线性渐变 | `npx expo install expo-linear-gradient` |
| `expo-blur` | 毛玻璃效果 | `npx expo install expo-blur` |
| `@expo/vector-icons` | 图标库（Ionicons/MaterialIcons 等） | 内置，无需安装 |
| `expo-secure-store` | 加密存储（JWT 等） | `npx expo install expo-secure-store` |
| `expo-image` | 高性能图片组件 | `npx expo install expo-image` |

> **重要**：在 Expo 工程中安装第三方库时，**用 `npx expo install xxx`** 而非 `npm install`，前者会自动安装与当前 Expo SDK 兼容的版本。

---

## 4. Expo 工具链

### 4.1 app.config.ts / app.json 配置

Expo 工程根目录下的 `app.config.ts`（或 `app.json`）是工程主配置文件。推荐用 `.ts` 以便动态读取环境变量。

```ts
// app.config.ts
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '问玄东方',
  slug: 'dongfang',
  scheme: 'dongfang',               // 深链接协议
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',       // 深色风格
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#1C1210',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dongfang.customer',
  },
  android: {
    package: 'com.dongfang.customer',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1C1210',
    },
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  extra: {
    // 环境变量在此透传
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
```

### 4.2 环境变量：EXPO_PUBLIC_* 前缀

Expo 中**以 `EXPO_PUBLIC_` 开头**的环境变量会被暴露到客户端代码中。

创建 `.env` 文件：

```bash
# .env（本地开发，不要提交到 git）
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080/api/v1
```

在代码中读取：

```ts
// src/config/env.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
console.log('当前 API 地址：', API_BASE_URL);
```

> 真机调试时，IP 必须是电脑的局域网 IP（如 `192.168.1.100`），不能用 `localhost`（手机访问不到电脑的 localhost）。

### 4.3 Expo SDK 版本与升级

Expo SDK 约每季度发布一个大版本。升级命令：

```bash
# 升级到最新 SDK
npx expo install expo@latest

# 自动升级所有依赖到兼容版本
npx expo install --fix

# 查看当前 SDK 版本
npx expo --version
```

> 升级前请先 `git commit`，以便回滚。大版本升级（如 SDK 50 → 51）建议阅读官方升级指南：https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

### 4.4 expo-router（基于文件的路由）

`expo-router` 类似 Next.js，**文件即路由**。`app/` 目录下的文件自动成为路由。

```
app/
├── _layout.tsx          → 根布局
├── index.tsx            → 首页 /
├── (tabs)/
│   ├── _layout.tsx      → Tab 布局
│   ├── home.tsx         → /home
│   ├── shop.tsx         → /shop
│   └── profile.tsx      → /profile
├── temple/
│   ├── [id].tsx         → /temple/:id（动态路由）
│   └── list.tsx         → /temple/list
└── +not-found.tsx       → 404 页
```

### 4.5 Expo Go vs 开发构建（Development Build）

| 方式 | 说明 | 适用场景 |
| --- | --- | --- |
| **Expo Go** | 官方预览器 App，扫码即运行 | 纯 JS 开发、学习、原型；不支持需要自定义原生代码的库 |
| **Development Build** | 自定义构建的开发版 App，含原生模块 | 使用了需要原生代码的库（如某些推送、蓝牙库） |
| **Preview/Production Build** | 接近最终的安装包 | 测试分发、上架 |

> 问玄东方项目前期用 Expo Go 即可，等需要接入支付/推送等原生模块时再切 Development Build。

### 4.6 项目结构约定

```
askXuan-frontend/apps/mobile-customer/        # Expo 工程根目录
├── app/                     # 路由目录（expo-router）
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
├── src/                     # 业务代码
│   ├── api/                 # 接口封装
│   ├── components/          # 通用组件（DFCard 等）
│   ├── hooks/               # 自定义 Hook
│   ├── theme/               # 设计令牌、样式
│   ├── types/               # TypeScript 类型
│   └── utils/               # 工具函数
├── assets/                  # 静态资源（图标、splash）
├── app.config.ts            # Expo 配置
├── package.json
├── tsconfig.json
└── .env
```

---

## 5. 创建第一个页面实战

本节从零创建一个「寺院列表页」，完整跑通：路由 → 类型 → API → 页面渲染 → 设计令牌。

### 5.1 创建工程（若尚未创建）

```bash
# 在 DongFang 仓库根目录下创建 Expo 工程
cd /Users/gaofeng/develop/DongFang

# 用 expo-router + TypeScript 模板创建
npx create-expo-app@latest askXuan-frontend/apps/mobile-customer --template tabs

cd askXuan-frontend/apps/mobile-customer
```

### 5.2 安装依赖

```bash
# 安装 axios 用于网络请求
npx expo install axios

# 安装 TanStack Query（服务端状态管理）
npx expo install @tanstack/react-query

# 安装安全区域与渐变库
npx expo install react-native-safe-area-context expo-linear-gradient expo-blur expo-secure-store

# 安装 expo-router（模板通常已带）
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

### 5.3 配置环境变量

```bash
# askXuan-frontend/apps/mobile-customer/.env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080/api/v1
```

> 把 `192.168.1.100` 改成你电脑的实际局域网 IP（终端执行 `ifconfig | grep "inet "` 查看）。

### 5.4 创建 src/types/index.ts（Temple 类型）

```ts
// askXuan-frontend/apps/mobile-customer/src/types/index.ts

// 寺院实体（与 Go 后端 temple-service 的 Temple 类型对应）
export interface Temple {
  id: string;
  name: string;
  region: string;
  type: string;          // 寺院类型：佛寺/道观
  sect: string;          // 宗派：禅宗/净土宗/正一道等
  coverImage: string;
  rating: number;
}

// 列表响应（Go 后端统一格式 { code, message, data }）
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 寺院列表响应 data 部分
export interface TempleListData {
  total: number;
  list: Temple[];
}
```

### 5.5 创建 src/api/client.ts（axios 封装）

```ts
// askXuan-frontend/apps/mobile-customer/src/api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// 从环境变量读取后端地址
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：注入 JWT
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // JWT 存储用 expo-securestore（见第 8 节）
    // 这里先用 localStorage 临时占位，第 8 节会替换为 SecureStore
    const token = ''; // TODO: 从 SecureStore 读取
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：解包 Go 后端统一格式 { code, message, data }
client.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    // 后端约定：code === 0 表示成功
    if (body && body.code === 0) {
      return body.data;          // 直接返回 data 字段
    }
    // 业务错误
    return Promise.reject(new Error(body?.message || '请求失败'));
  },
  (error) => {
    // HTTP 错误
    if (error.response?.status === 401) {
      // TODO: 跳转登录页
      console.warn('未授权，请重新登录');
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 5.6 创建 src/api/temple.ts（getTemples 函数）

```ts
// askXuan-frontend/apps/mobile-customer/src/api/temple.ts
import client from './client';
import type { Temple, TempleListData } from '../types';

// 寺院列表请求参数
export interface ListTemplesParams {
  sect?: string;     // 宗派筛选
  page?: number;
  size?: number;
}

// 获取寺院列表
export const getTemples = (params: ListTemplesParams = {}): Promise<TempleListData> => {
  return client.get('/temple', {
    params: {
      sect: params.sect,
      page: params.page ?? 1,
      size: params.size ?? 20,
    },
  }) as unknown as Promise<TempleListData>;
};

// 获取寺院详情
export const getTempleById = (id: string): Promise<Temple> => {
  return client.get(`/temple/${id}`) as unknown as Promise<Temple>;
};
```

### 5.7 创建 src/theme/tokens.ts（设计令牌）

```ts
// askXuan-frontend/apps/mobile-customer/src/theme/tokens.ts
// 从 askXuan-frontend/packages/design-tokens/tokens.json 同步而来

export const colors = {
  // 背景
  bgPrimary: '#1C1210',
  bgSecondary: '#2A1E1A',
  bgTertiary: '#3A2C25',
  bgElevated: '#44342C',
  // 品牌色（朱砂）
  brand: '#C45A3C',
  brandLight: '#D4735A',
  brandDark: '#A64830',
  // 强调色（琉璃金）
  accent: '#C8A96E',
  accentLight: '#D4BC8A',
  accentDark: '#A88A50',
  // 文字
  textPrimary: '#F0E6DA',
  textSecondary: '#C5B097',
  textTertiary: '#8A7A6A',
  // 边框
  borderDefault: 'rgba(200, 169, 110, 0.15)',
  borderStrong: 'rgba(200, 169, 110, 0.3)',
  borderDivider: 'rgba(200, 169, 110, 0.08)',
  // 状态
  success: '#5B8C5A',
  warning: '#D4A843',
  error: '#C45A3C',
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const spacing = {
  navTop: 44,
  navBottom: 60,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
```

### 5.8 创建 app/(tabs)/home.tsx（首页 Tab + 寺院列表）

```tsx
// askXuan-frontend/apps/mobile-customer/app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getTemples } from '../../src/api/temple';
import { colors, radius, spacing } from '../../src/theme/tokens';
import type { Temple } from '../../src/types';

export default function HomeScreen() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载寺院列表
  const loadTemples = useCallback(async () => {
    try {
      setError(null);
      const data = await getTemples({ page: 1, size: 20 });
      setTemples(data.list);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTemples();
  }, [loadTemples]);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadTemples();
  };

  // 渲染单张寺院卡片
  const renderCard = ({ item }: { item: Temple }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/temple/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.region} · {item.sect}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.cardType}>{item.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 加载中
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>正在加载寺院...</Text>
      </View>
    );
  }

  // 错误态
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadTemples}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>问玄东方</Text>
        <Text style={styles.headerSubtitle}>禅意 · 国潮 · 修心</Text>
      </View>

      {/* 寺院列表 */}
      <FlatList
        data={temples}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>暂无寺院数据</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDivider,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.accent,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    color: colors.warning,
  },
  cardType: {
    fontSize: 12,
    color: colors.textTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});
```

### 5.9 启动预览

```bash
# 在工程目录下启动 Expo Dev Server
cd askXuan-frontend/apps/mobile-customer
npx expo start

# 终端会显示一个二维码
# 打开手机上的 Expo Go App，扫描二维码即可看到页面
```

其他启动方式：

```bash
npx expo start --ios        # 在 iOS 模拟器中打开
npx expo start --android    # 在 Android 模拟器中打开
npx expo start --tunnel     # 通过隧道（不同 WiFi 也能连）
```

---

## 6. 导航（expo-router）

### 6.1 文件即路由约定

```
app/
├── index.tsx          → 路径 /
├── (tabs)/
│   ├── _layout.tsx    → Tab 容器布局
│   ├── home.tsx       → /home（Tab 项）
│   ├── shop.tsx       → /shop（Tab 项）
│   └── profile.tsx    → /profile（Tab 项）
├── temple/
│   ├── [id].tsx       → /temple/:id（动态路由）
│   └── list.tsx       → /temple/list
└── +not-found.tsx     → 404
```

- `(tabs)` 目录用括号包裹表示「路由分组」，不会出现在 URL 中
- `_layout.tsx` 是该目录的布局组件
- `[id].tsx` 用方括号表示动态参数

### 6.2 Tab 布局：app/(tabs)/_layout.tsx

```tsx
// askXuan-frontend/apps/mobile-customer/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.borderDivider,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: '商城',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 6.3 Stack 布局：动态路由 app/temple/[id].tsx

```tsx
// askXuan-frontend/apps/mobile-customer/app/temple/[id].tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function TempleDetailScreen() {
  // 读取动态路由参数
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: '寺院详情' }} />
      <View>
        <Text>寺院 ID：{id}</Text>
      </View>
    </>
  );
}
```

### 6.4 跳转与传参

```tsx
import { router } from 'expo-router';

// 跳转到动态路由
router.push('/temple/1');

// 跳转到普通页面
router.push('/temple/list');

// 跳转到 Tab
router.push('/home');

// 返回上一页
router.back();

// 替换当前页（无法返回）
router.replace('/login');

// 传参（动态路由方式）
router.push({ pathname: '/temple/[id]', params: { id: '1' } });
```

读取参数：

```tsx
import { useLocalSearchParams } from 'expo-router';

const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
```

---

## 7. 状态管理

### 7.1 本地状态：useState / useReducer

简单状态用 `useState`，复杂状态逻辑用 `useReducer`：

```tsx
import { useReducer } from 'react';

// 定义状态与动作
type State = { count: number };
type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      return state;
  }
}

const Counter = () => {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <View>
      <Text>{state.count}</Text>
      <TouchableOpacity onPress={() => dispatch({ type: 'increment' })}>
        <Text>+1</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 7.2 全局状态：Zustand（推荐）

Zustand 是轻量全局状态库，API 极简。

```bash
npm install zustand
```

```tsx
// src/store/userStore.ts
import { create } from 'zustand';

interface UserState {
  userId: string | null;
  token: string | null;
  setAuth: (userId: string, token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  token: null,
  setAuth: (userId, token) => set({ userId, token }),
  logout: () => set({ userId: null, token: null }),
}));
```

使用：

```tsx
import { useUserStore } from '../store/userStore';

const Profile = () => {
  // 选择需要的字段，避免不必要的重渲染
  const userId = useUserStore((s) => s.userId);
  const logout = useUserStore((s) => s.logout);

  return (
    <View>
      <Text>用户ID：{userId}</Text>
      <TouchableOpacity onPress={logout}>
        <Text>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 7.3 服务端状态：TanStack Query（推荐）

TanStack Query（React Query）自动处理缓存、重试、失效、加载/错误状态，是替代手动 `useEffect + fetch` 的最佳方案。

```bash
npx expo install @tanstack/react-query
```

在根布局注入 Provider：

```tsx
// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,                  // 失败重试 2 次
      staleTime: 1000 * 60 * 5, // 5 分钟内不重复请求
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

使用 `useQuery` 调用接口：

```tsx
// src/hooks/useTemples.ts
import { useQuery } from '@tanstack/react-query';
import { getTemples } from '../api/temple';

export const useTemples = (sect?: string) => {
  return useQuery({
    queryKey: ['temples', sect],   // 缓存键
    queryFn: () => getTemples({ sect, page: 1, size: 20 }),
  });
};
```

在页面中使用：

```tsx
import { useTemples } from '../hooks/useTemples';

const HomeScreen = () => {
  const { data, isLoading, error, refetch } = useTemples();

  if (isLoading) return <Text>加载中...</Text>;
  if (error) return <Text>加载失败</Text>;

  return (
    <FlatList
      data={data?.list || []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text>{item.name}</Text>}
      onRefresh={refetch}
      refreshing={false}
    />
  );
};
```

> **推荐组合**：Zustand 管本地全局状态（如登录态、用户信息），TanStack Query 管服务端数据（如寺院列表、订单）。

---

## 8. 网络层与后端联调

### 8.1 axios 完整封装（含 JWT 注入与统一错误处理）

```ts
// src/api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：从 SecureStore 读取 JWT 并注入
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：解包 Go 后端统一格式 { code, message, data }
client.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    if (body && body.code === 0) {
      return body.data;          // 解包 data
    }
    // 业务错误
    if (body?.code === 401) {
      // token 失效，清理并跳登录
      SecureStore.deleteItemAsync('jwt');
      router.replace('/login');
    }
    return Promise.reject(new Error(body?.message || '请求失败'));
  },
  (error) => {
    // HTTP 层错误
    const status = error.response?.status;
    if (status === 401) {
      SecureStore.deleteItemAsync('jwt');
      router.replace('/login');
    } else if (status === 500) {
      console.error('服务器错误：', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 8.2 JWT 存储：expo-securestore

iOS 用 Keychain，Android 用 Keystore，安全存储敏感数据。

```tsx
import * as SecureStore from 'expo-securestore';

// 登录成功后保存 token
await SecureStore.setItemAsync('jwt', 'eyJhbGciOiJIUzI1NiIs...');

// 读取 token
const token = await SecureStore.getItemAsync('jwt');

// 删除 token
await SecureStore.deleteItemAsync('jwt');
```

> 不要用 `AsyncStorage` 存 JWT，它是明文存储，不安全。

### 8.3 环境变量切换

创建多个 `.env` 文件，按场景切换：

```bash
# .env（本地开发，Mock Server）
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

# .env.realdevice（真机调试，指向电脑局域网 IP）
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080/api/v1

# 生产环境用 EAS 环境变量注入（见第 10 节 eas.json）
```

启动时指定环境文件：

```bash
# 用默认 .env
npx expo start

# 真机调试用（先复制 .env.realdevice 为 .env，再启动）
cp .env.realdevice .env && npx expo start
```

| 场景 | BaseURL | 说明 |
| --- | --- | --- |
| 本地开发（Mock Server） | `http://localhost:3001/api/v1` | 仅 iOS 模拟器可用（模拟器内 localhost 指向宿主机） |
| 真机调试 | `http://192.168.x.x:8080/api/v1` | 手机与电脑同 WiFi，用电脑局域网 IP |
| 生产 | EAS 环境变量注入 | 通过 `eas.json` 的 `env` 字段配置 |

### 8.4 Go 后端 API 响应格式

go-zero 微服务经网关返回统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "list": [
      {
        "id": "1",
        "name": "灵隐寺",
        "region": "浙江杭州",
        "type": "佛寺",
        "sect": "禅宗",
        "coverImage": "https://cdn.dongfang.com/temple/lingyin.jpg",
        "rating": 4.8
      }
    ]
  }
}
```

约定：`code === 0` 表示成功，非 0 表示业务错误。axios 响应拦截器已自动解包 `data` 字段，业务代码直接拿到数据。

### 8.5 TanStack Query 调用示例

```tsx
// src/hooks/useTemple.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemples, getTempleById } from '../api/temple';

// 列表
export const useTemples = (sect?: string) =>
  useQuery({
    queryKey: ['temples', sect],
    queryFn: () => getTemples({ sect }),
  });

// 详情
export const useTempleDetail = (id: string) =>
  useQuery({
    queryKey: ['temple', id],
    queryFn: () => getTempleById(id),
    enabled: !!id,             // id 存在才请求
  });
```

---

## 9. 设计系统接入

### 9.1 从 tokens.json 生成 src/theme/tokens.ts

第 5.7 节已展示 `tokens.ts` 内容，其来源是 `askXuan-frontend/packages/design-tokens/tokens.json`。可手动同步，也可写脚本自动生成：

```bash
# 可选：写一个同步脚本 scripts/sync-tokens.ts
# 读取 askXuan-frontend/packages/design-tokens/tokens.json，输出为 src/theme/tokens.ts
```

核心颜色速查：

| 用途 | Token | 色值 |
| --- | --- | --- |
| 主背景 | `colors.bgPrimary` | `#1C1210` |
| 卡片背景 | `colors.bgSecondary` | `#2A1E1A` |
| 朱砂（品牌） | `colors.brand` | `#C45A3C` |
| 琉璃金（强调） | `colors.accent` | `#C8A96E` |
| 主文字 | `colors.textPrimary` | `#F0E6DA` |
| 次文字 | `colors.textSecondary` | `#C5B097` |
| 金色边框 | `colors.borderDefault` | `rgba(200,169,110,0.15)` |

### 9.2 通用组件实现

#### 9.2.1 DFCard（卡片）

```tsx
// src/components/DFCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

interface DFCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  bordered?: boolean;
}

export const DFCard = ({ children, style, bordered = true }: DFCardProps) => (
  <View style={[styles.card, bordered && styles.bordered, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,   // #2A1E1A
    borderRadius: radius.lg,               // 12px
    padding: spacing.md,                   // 12px
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.borderDefault,     // 金色半透明边框
  },
});
```

#### 9.2.2 DFPrimaryButton（朱砂渐变按钮）

```tsx
// src/components/DFPrimaryButton.tsx
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme/tokens';

interface DFPrimaryButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const DFPrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
}: DFPrimaryButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.85}
    style={styles.touchable}
  >
    <LinearGradient
      colors={[colors.brandLight, colors.brand, colors.brandDark]}  // 朱砂渐变
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, disabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  touchable: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

#### 9.2.3 DFTopNavBar（毛玻璃导航栏）

```tsx
// src/components/DFTopNavBar.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

interface DFTopNavBarProps {
  title: string;
  right?: React.ReactNode;
}

export const DFTopNavBar = ({ title, right }: DFTopNavBarProps) => {
  const insets = useSafeAreaInsets();   // 安全区域高度
  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <BlurView
        intensity={80}
        tint="dark"
        style={styles.blur}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {right}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  blur: {
    backgroundColor: 'rgba(28, 18, 16, 0.6)',  // 半透明深色叠加
  },
  content: {
    height: spacing.navTop,                    // 44px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accent,
  },
});
```

#### 9.2.4 DFBannerCarousel（轮播图）

```tsx
// src/components/DFBannerCarousel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, radius } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Banner {
  id: string;
  image: string;
}

interface DFBannerCarouselProps {
  data: Banner[];
  autoPlay?: boolean;
  interval?: number;     // 毫秒
}

export const DFBannerCarousel = ({
  data,
  autoPlay = true,
  interval = 4000,
}: DFBannerCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // 自动播放
  useEffect(() => {
    if (!autoPlay || data.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % data.length;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, interval);
    return () => clearInterval(timer);
  }, [activeIndex, autoPlay, data.length, interval]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {data.map((banner) => (
          <View key={banner.id} style={styles.slide}>
            {/* 实际用 Image 组件加载 banner.image */}
          </View>
        ))}
      </ScrollView>
      {/* 指示点 */}
      <View style={styles.dots}>
        {data.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    height: 160,
    backgroundColor: colors.bgSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 16,
  },
});
```

### 9.3 安全区域：useSafeAreaInsets

`react-native-safe-area-context` 提供 `useSafeAreaInsets`，用于避开刘海、状态栏、底部横条。

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Screen = () => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,       // 避开状态栏
        paddingBottom: insets.bottom, // 避开底部横条
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Text>内容</Text>
    </View>
  );
};
```

更简单的方式是用 `SafeAreaView` 组件：

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
  <Text>自动避开刘海与底部</Text>
</SafeAreaView>
```

---

## 10. EAS Build 云端构建

EAS Build 是 Expo 提供的云端构建服务，可在云端编译出 iOS / Android 安装包，无需本地配置复杂环境。

### 10.1 eas.json 配置

在工程根目录创建 `eas.json`：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://192.168.1.100:8080/api/v1"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api-staging.dongfang.com/api/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.dongfang.com/api/v1"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

三个 profile 区别：

| Profile | 用途 | 分发方式 |
| --- | --- | --- |
| `development` | 开发构建（含开发菜单） | 内部安装（Ad Hoc） |
| `preview` | 测试包 | 内部安装（Ad Hoc / 链接分发） |
| `production` | 上架包 | 商店分发 |

### 10.2 关联 Expo 账号

```bash
eas login
eas whoami               # 确认登录
eas init --id <project-id>  # 关联工程到 Expo 项目（首次）
```

### 10.3 iOS 构建前提：Apple Developer 账号

iOS 构建需要 Apple Developer 账号（$99/年）：

1. 注册 https://developer.apple.com/programs/
2. 在 Expo 后台（https://expo.dev/accounts）关联 Apple 账号：
   - 进入项目 → Settings → Credentials
   - 按提示填入 Apple ID、Team ID、App Store Connect API Key
3. EAS 会自动管理证书与描述文件，无需手动操作 Xcode

### 10.4 构建 iOS 包

```bash
# 构建预览包（Ad Hoc，可分发给测试设备）
eas build -p ios --profile preview

# 构建生产包（用于上架）
eas build -p ios --profile production
```

构建过程（约 10-20 分钟）：
1. EAS 上传工程到 Expo 云端
2. 云端 Mac 执行 `xcodebuild` 编译
3. 自动签名（用你配的 Apple 证书）
4. 生成 `.ipa` 文件
5. 提供下载链接

安装预览包：在 Expo 后台找到构建记录，扫码或点击链接即可在手机安装。

### 10.5 构建 Android 包

```bash
# 构建 APK（可直接安装）
eas build -p android --profile preview

# 构建 AAB（用于上架 Google Play）
eas build -p android --profile production
```

Android 构建无需付费账号，Google Play 开发者账号（$25 一次性）仅在上架时需要。

### 10.6 提交商店

```bash
# 提交到 App Store（需先构建 production 包）
eas submit -p ios --profile production --latest

# 提交到 Google Play
eas submit -p android --profile production --latest
```

提交后：
- iOS：登录 App Store Connect 填写审核信息、选择构建版本、提交审核
- Android：Google Play 控制台选择构建版本、发布

### 10.7 查看构建产物

登录 https://expo.dev → 进入项目 → Builds，可看到所有构建记录、状态、下载链接、安装二维码。

---

## 11. EAS Update 热更新

EAS Update 让你在不重新发版的情况下，推送 JS Bundle 更新到用户手机。适合修复 Bug、改文案、换 Banner 等小改动。

### 11.1 配置

```bash
# 首次配置热更新
eas update:configure

# 此命令会：
# 1. 在 app.config.ts 中生成 update.url 和 update.enabled
# 2. 在 eas.json 中为各 profile 生成 channel（更新通道）
```

配置完成后，`eas.json` 各 profile 会带 `channel` 字段：

```json
{
  "build": {
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### 11.2 推送更新

```bash
# 推送更新到 preview 通道
eas update --branch preview --message "修复首页 Banner 显示问题"

# 推送到 production 通道
eas update --branch production --message "hotfix: 修复登录崩溃"
```

推送后，已安装该通道对应构建版本的用户，**下次冷启动 App 时会自动下载并应用更新**（无需重新下载安装包）。

### 11.3 通道（channel）与分支（branch）

| 概念 | 说明 |
| --- | --- |
| **channel** | 构建时绑定的通道，一个构建版本对应一个 channel |
| **branch** | 更新推送的目标分支，需与 channel 名称对应 |

约定：`preview` 通道的构建只接收 `preview` 分支的更新；`production` 通道只接收 `production` 分支更新。

### 11.4 苹果 4.7 审核条款合规

苹果 App Store 审核 4.7 条款规定：**热更新不能改变 App 的主要用途，不能下载可执行代码**。EAS Update 推送的是 JS Bundle，符合规定，但需注意：

✅ **允许**：
- 修复 Bug
- 调整文案、颜色、布局
- 更换 Banner、活动图
- 新增页面（用现有组件）

❌ **禁止**：
- 把「寺院预约」App 改成「游戏」App（改变主要用途）
- 推送新的原生模块代码（需走商店审核）
- 通过热更新规避审核（如审核时隐藏功能、上线后打开）

> 合规建议：每次热更新都保留「变更说明」，万一被苹果抽查可提供解释。

---

## 12. 调试技巧

### 12.1 Expo DevTools（浏览器）

启动 Dev Server 后，终端会显示一个本地 URL（如 `http://localhost:8081`），在浏览器打开即可看到 Expo DevTools 界面，包含：
- 二维码
- 日志输出
- 已连接设备列表
- 启动模拟器按钮

### 12.2 React DevTools

```bash
# 安装 React DevTools（独立版）
npm install -g react-devtools

# 启动
react-devtools
```

会打开一个独立窗口，可 inspect 组件树、查看 props/state。

### 12.3 console.log / console.warn

```tsx
console.log('调试信息：', data);
console.warn('警告：token 已过期');
console.error('错误：', error);
```

这些输出会显示在：
- 终端（运行 `npx expo start` 的窗口）
- Expo DevTools 浏览器界面
- 真机 Expo Go 摇一摇后的「Logs」面板

### 12.4 Expo Go 摇一摇打开开发者菜单

真机用力摇一摇手机，会弹出开发者菜单：

- **Reload**：重新加载 JS Bundle
- **Open React DevTools**
- **Toggle Element Inspector**：检查组件层级与样式
- **Toggle Performance Monitor**：显示 FPS/RAM
- **Go to Home**

### 12.5 Error Boundary

用类组件捕获子树渲染错误，避免白屏：

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary 捕获：', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
          <Text style={{ color: colors.error, marginBottom: 16 }}>页面渲染出错</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text style={{ color: colors.accent }}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
```

在根布局包裹：

```tsx
// app/_layout.tsx
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 12.6 真机调试要点

1. 电脑与手机连同一个 WiFi
2. 电脑关闭防火墙或开放 8081 端口
3. 用电脑局域网 IP（`ifconfig` 查看），不要用 `localhost`
4. 启动时加 `--tunnel` 可跨网段连接（依赖 ngrok，速度较慢）
5. 后端 Go 服务也要监听 `0.0.0.0` 而非 `127.0.0.1`

---

## 13. 推荐学习资源

### 官方文档（英文，权威）

- **Expo 官方文档**：https://docs.expo.dev ⭐ 必读
- **React Native 官方文档**：https://reactnative.dev ⭐ 必读
- **expo-router 文档**：https://docs.expo.dev/router/introduction
- **React 官方教程**：https://react.dev ⭐ 学习 React 核心概念
- **React Navigation**（备选导航库）：https://reactnavigation.org
- **TanStack Query 文档**：https://tanstack.com/query/latest
- **Zustand GitHub**：https://github.com/pmndrs/zustand

### 中文资源

- **React Native 中文网**：https://reactnative.cn
- **Expo 中文社区**：https://expo.wiki
- **React 中文文档**：https://zh-hans.react.dev

### 视频教程（按需）

- Expo 官方 YouTube 频道：https://www.youtube.com/@ExpoDevelopers
- React Native 官方 YouTube：搜索「React Native」最新教程

### 项目内参考

- **设计稿**：`/Users/gaofeng/develop/DongFang/问玄东方App/pages/`（HTML 原型，视觉参考）
- **设计令牌**：`askXuan-frontend/packages/design-tokens/tokens.json`
- **架构 Spec**：`.trae/specs/pivot-to-go-and-mobile-strategy/spec.md`
- **Mock Server**：`askXuan-frontend/packages/mock-server/`

---

## 14. 问玄东方项目开发路线图

按以下顺序推进，每步完成后与 Go 后端联调验证。Go 服务对应 spec 中 Task 4-7（auth/temple/master/booking 等服务）。

### 第一步：跑通首页（Banner + 入口卡片 + 横向滚动）

**对应**：tasks.md Task 13

**目标**：实现 `app/(tabs)/home.tsx`，包含：
- 顶部毛玻璃导航栏（DFTopNavBar）
- Banner 轮播（DFBannerCarousel，3 张活动图）
- 4 个入口卡片（寺院 / 师傅 / 法事 / 商城），横向 ScrollView
- 推荐寺院列表（FlatList）

**联调**：
- 后端 `marketing-service`（Task 7）提供 `/api/v1/marketing/banners`
- 后端 `temple-service`（Task 5）提供 `/api/v1/temples`

**验收**：Expo Go 扫码可见首页，深色禅意风格与设计稿一致。

### 第二步：寺院列表与详情

**对应**：tasks.md Task 14

**目标**：
- `app/temple/list.tsx`：寺院列表页，支持宗派筛选、下拉刷新、上拉加载
- `app/temple/[id].tsx`：寺院详情页，含封面、简介、法师列表、预约入口

**联调**：
- `temple-service`（Task 5）提供列表 `/api/v1/temples` 与详情 `/api/v1/temples/:id`

**验收**：从首页点寺院卡片可进入详情，筛选与分页正常。

### 第三步：师傅列表与主页

**对应**：tasks.md Task 15

**目标**：
- `app/master/list.tsx`：法师列表
- `app/master/[id].tsx`：法师主页，含简介、排班、可预约时段

**联调**：
- `master-service`（Task 6）提供 `/api/v1/masters`

**验收**：法师列表与主页数据正确，可跳转到预约页。

### 第四步：预约下单

**对应**：tasks.md Task 16

**目标**：
- `app/booking/create.tsx`：选择法事类型、时段、法师，提交预约
- `app/booking/list.tsx`：我的预约列表，含状态流转（待支付/已支付/已完成）

**联调**：
- `booking-service`（Task 6）提供预约增删查改
- `auth-service`（Task 4）提供 JWT 鉴权
- `payment-service`（Task 7）提供支付（初期可 Mock）

**验收**：登录后可下单，预约状态正确流转。

### 第五步：导航整合

**对应**：tasks.md Task 17

**目标**：
- 完善 `app/(tabs)/_layout.tsx` 四个 Tab：首页 / 寺院 / 商城 / 我的
- 整合 `app/_layout.tsx` 根 Stack，处理登录态跳转（未登录跳 `/login`）
- 实现 `app/profile.tsx` 个人中心

**联调**：
- `user-service`（Task 4）提供用户资料
- `auth-service`（Task 4）提供登录/登出

**验收**：完整导航流畅，登录态拦截正确。

### 第六步：EAS 云端构建出包

**对应**：tasks.md Task 18

**目标**：
- 配置 `eas.json`（development/preview/production）
- 关联 Apple Developer 账号
- 执行 `eas build -p ios --profile preview` 出 iOS 测试包
- 执行 `eas build -p android --profile preview` 出 Android 测试包
- 用 TestFlight 或 Ad Hoc 分发给团队测试

**验收**：测试设备可安装并运行完整 App。

---

### 每步与 Go 后端联调清单

| 移动端步骤 | 对应 Go 服务 | Task | 联调接口 |
| --- | --- | --- | --- |
| 首页 | marketing-service / temple-service | 7 / 5 | `/api/v1/marketing/banners`、`/api/v1/temples` |
| 寺院 | temple-service | 5 | `/api/v1/temples`、`/api/v1/temples/:id` |
| 师傅 | master-service | 6 | `/api/v1/masters`、`/api/v1/masters/:id` |
| 预约 | booking-service / auth-service / payment-service | 6 / 4 / 7 | `/api/v1/bookings`、`/api/v1/auth/login` |
| 导航整合 | user-service / auth-service | 4 | `/api/v1/users/profile` |
| EAS 构建 | — | — | 用生产环境 BaseURL |

> **联调要点**：
> 1. Go 网关默认在 `http://localhost:8080`，所有接口前缀 `/api/v1`
> 2. 真机调试时 Go 服务需监听 `0.0.0.0:8080`，移动端用电脑 IP
> 3. JWT 通过 `Authorization: Bearer <token>` 头部传递
> 4. 后端响应统一格式 `{ code, message, data }`，前端拦截器已解包
> 5. 联调时可用 Mock Server（`askXuan-frontend/packages/mock-server/`）替代真实后端，加速前端开发

---

## 附录：常用命令速查

```bash
# 创建工程
npx create-expo-app@latest askXuan-frontend/apps/mobile-customer --template tabs

# 启动开发服务器
npx expo start
npx expo start --ios          # iOS 模拟器
npx expo start --android      # Android 模拟器
npx expo start --tunnel       # 跨网段

# 安装依赖（用 expo install 自动匹配 SDK 版本）
npx expo install axios @tanstack/react-query

# 升级 SDK
npx expo install expo@latest
npx expo install --fix

# EAS 构建
eas login
eas build -p ios --profile preview
eas build -p android --profile preview
eas submit -p ios --profile production --latest

# EAS 热更新
eas update --branch preview --message "fix home banner"

# 调试工具
react-devtools                # React DevTools
npx react-native start        # 备用启动方式
```

---

> 本指南随项目演进持续更新。遇到问题先查官方文档，再查本项目的设计稿与 Spec。
> 祝你顺利构建出禅意国潮的「问玄东方」App。🙏
