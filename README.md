# solid-media

A framework-agnostic Web Component for controlled image and video loading.  
Handles authenticated requests, request deduplication, concurrency control, exponential backoff retry, LRU memory management, and SSR safety.

---

## Features

- Authenticated fetch via custom fetcher injection
- Global concurrency limit (default: 8 concurrent requests)
- In-flight request deduplication
- Exponential backoff retry (3 attempts: 1s / 2s / 4s), skips 4xx errors
- LRU cache with reference counting and `URL.revokeObjectURL` (default: 50 entries)
- Lazy loading via `IntersectionObserver`
- Auto-infers `image` / `video` type from URL extension
- SSR-safe (guards all browser APIs with `typeof window`)
- Zero runtime dependencies
- TypeScript strict mode, full type exports

---

## Installation

```bash
bun add solid-media
```

---

## Usage

### Register the component

The component self-registers when imported in a browser environment:

```ts
import 'solid-media'
```

### Basic

```html
<solid-media src="/images/photo.jpg"></solid-media>
<solid-media src="/videos/clip.mp4" controls muted autoplay loop></solid-media>
```

### With fallback placeholder

```html
<solid-media src="/images/photo.jpg" fallback="/images/placeholder.jpg"></solid-media>
```

### Force type

```html
<solid-media src="/api/asset/42" type="video" controls></solid-media>
```

---

## API

### `core.setFetcher(fn)`

Inject a custom fetcher for authenticated or proxied requests.

```ts
import { core } from 'solid-media'

core.setFetcher(async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
})
```

### `core.on(event, handler)`

Subscribe to lifecycle events.

| Event       | Description                        |
| ----------- | ---------------------------------- |
| `success`   | Resource loaded successfully       |
| `error`     | All retries exhausted              |
| `retry`     | A retry attempt was triggered      |
| `cache_hit` | Resource served from cache         |

```ts
core.on('retry', ({ url, attempt }) => {
  console.warn(`Retrying ${url}, attempt ${attempt}`)
})
```

### Attributes

| Attribute    | Type               | Default   | Description                                      |
| ------------ | ------------------ | --------- | ------------------------------------------------ |
| `src`        | `string`           | —         | Resource URL                                     |
| `type`       | `image` \| `video` | auto      | Force media type; inferred from extension if omitted |
| `fallback`   | `string`           | —         | URL shown during loading and on error            |
| `autoplay`   | boolean attr       | —         | Video only                                       |
| `loop`       | boolean attr       | —         | Video only                                       |
| `muted`      | boolean attr       | —         | Video only                                       |
| `controls`   | boolean attr       | —         | Video only                                       |
| `playsinline`| boolean attr       | —         | Video only                                       |

---

## Build

```bash
bun run build
```

Output is placed in `dist/` as ESM (`.js`), CJS (`.cjs`), and TypeScript declarations (`.d.ts` / `.d.cts`).

---

## License

MIT

---

# solid-media (中文)

框架无关的 Web Component，用于受控的图片和视频加载。  
解决鉴权请求、请求去重、并发控制、指数退避重试、LRU 内存回收以及 SSR 安全问题。

---

## 特性

- 通过自定义 fetcher 注入实现鉴权请求
- 全局并发限制（默认最大 8 个并发请求）
- 同一 URL 的请求自动去重
- 指数退避自动重试（3 次，延迟分别为 1s / 2s / 4s），跳过 4xx 错误
- 带引用计数的 LRU 缓存，自动调用 `URL.revokeObjectURL` 释放内存（默认上限 50 条）
- 基于 `IntersectionObserver` 的懒加载
- 根据 URL 后缀自动推断 `image` / `video` 类型
- SSR 安全（所有浏览器 API 均做 `typeof window` 守卫）
- 零运行时依赖
- TypeScript 严格模式，完整类型导出

---

## 安装

```bash
bun add solid-media
```

---

## 使用

### 注册组件

在浏览器环境中导入后，组件会自动注册：

```ts
import 'solid-media'
```

### 基础用法

```html
<solid-media src="/images/photo.jpg"></solid-media>
<solid-media src="/videos/clip.mp4" controls muted autoplay loop></solid-media>
```

### 带占位图

```html
<solid-media src="/images/photo.jpg" fallback="/images/placeholder.jpg"></solid-media>
```

### 强制指定类型

```html
<solid-media src="/api/asset/42" type="video" controls></solid-media>
```

---

## API

### `core.setFetcher(fn)`

注入自定义 fetcher，用于鉴权或代理请求。

```ts
import { core } from 'solid-media'

core.setFetcher(async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
})
```

### `core.on(event, handler)`

订阅生命周期事件。

| 事件        | 说明                     |
| ----------- | ------------------------ |
| `success`   | 资源加载成功             |
| `error`     | 全部重试耗尽后仍失败     |
| `retry`     | 触发了一次重试           |
| `cache_hit` | 资源命中缓存             |

```ts
core.on('retry', ({ url, attempt }) => {
  console.warn(`正在重试 ${url}，第 ${attempt} 次`)
})
```

### 属性

| 属性         | 类型               | 默认值 | 说明                                          |
| ------------ | ------------------ | ------ | --------------------------------------------- |
| `src`        | `string`           | —      | 资源 URL                                      |
| `type`       | `image` \| `video` | 自动   | 强制指定媒体类型；未提供时根据后缀自动推断    |
| `fallback`   | `string`           | —      | 加载中及加载失败时显示的占位图 URL            |
| `autoplay`   | 布尔属性           | —      | 仅视频                                        |
| `loop`       | 布尔属性           | —      | 仅视频                                        |
| `muted`      | 布尔属性           | —      | 仅视频                                        |
| `controls`   | 布尔属性           | —      | 仅视频                                        |
| `playsinline`| 布尔属性           | —      | 仅视频                                        |

---

## 构建

```bash
bun run build
```

产物输出至 `dist/`，包含 ESM（`.js`）、CJS（`.cjs`）及 TypeScript 声明文件（`.d.ts` / `.d.cts`）。

---

## 许可证

MIT

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
