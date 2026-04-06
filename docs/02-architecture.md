# 技术架构

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                  GitHub Pages                        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ index.html│  │ app JS   │  │ data/ (预处理JSON) │ │
│  └──────────┘  └──────────┘  └───────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
         │                            │
         │ 浏览器端                    │ 构建时
         ▼                            ▼
┌─────────────────┐         ┌──────────────────────┐
│  GTFS Realtime   │         │  GTFS Static API     │
│  Vehicle Position│         │  (ZIP → 预处理脚本)   │
│  (每15秒轮询)    │         │                      │
└─────────────────┘         └──────────────────────┘
```

## 两层数据策略

### 静态数据 — 构建时预处理

GTFS Static ZIP 包含 ~26MB 原始数据，其中 `stop_times.txt` 就有 24MB。直接在浏览器端解析 ZIP 不现实（慢且浪费流量）。

**方案：构建时预处理（Build-time Preprocessing）**

- 用 Node.js 脚本下载 GTFS Static ZIP，解析并转换为优化的 JSON 文件
- 将处理后的 JSON 文件放在 `public/data/` 目录下，随应用一起部署
- 通过 GitHub Actions 定期（每天一次）自动更新静态数据

预处理输出文件：

| 文件 | 内容 | 预估大小 |
|------|------|----------|
| `routes.json` | 所有线路基本信息 | ~3 KB |
| `shapes/{shape_id}.json` | 每条 shape 的坐标点序列 | 各 ~5-30 KB |
| `route-details/{route_id}.json` | 每条线路的方向、站点、shape 引用 | 各 ~2-10 KB |

### 实时数据 — 浏览器端轮询

- 浏览器直接请求 GTFS Realtime API
- 使用 `protobuf.js` 在客户端解析 Protocol Buffers 响应
- 每 **15 秒**轮询一次（符合 4 req/min 限制）
- 仅在用户选中某条线路时才过滤显示对应车辆

## 技术栈

| 层面 | 选型 | 理由 |
|------|------|------|
| 构建工具 | **Vite** | 快速、零配置、支持 GitHub Pages 部署 |
| UI 框架 | **React + TypeScript** | 组件化管理状态，类型安全 |
| 地图 | **Leaflet + react-leaflet** | 免费、开源、轻量，使用 OpenStreetMap 瓦片 |
| Protobuf 解析 | **protobuf.js** | 浏览器端解析 GTFS-RT Protocol Buffers |
| 样式 | **Tailwind CSS** | 快速构建 UI，无需额外 CSS 文件 |
| 数据预处理 | **Node.js 脚本** | 解析 GTFS ZIP 并生成优化 JSON |
| CI/CD | **GitHub Actions** | 自动更新静态数据 + 部署到 GitHub Pages |

## 为什么不在浏览器端解析 GTFS Static

1. **ZIP 文件约 5MB**（压缩后），解压后 26MB — 加载慢，浪费移动端流量
2. `stop_times.txt` 有 31 万行，浏览器端解析 CSV 性能差
3. 每次打开页面都要重新下载和解析
4. API 有速率限制，多个用户同时访问容易触发限流

预处理后的 JSON 文件总大小约 **200-500 KB**（gzip 后更小），首屏加载只需拉取 `routes.json`（~3KB），选择线路后按需加载对应线路详情。
