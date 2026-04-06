# 项目结构

```
penang_bus/
├── docs/                          # 设计文档
│
├── scripts/
│   └── preprocess-gtfs.ts         # GTFS 静态数据预处理脚本
│
├── proto/
│   └── gtfs-realtime.proto        # GTFS Realtime proto 定义文件
│
├── public/
│   └── data/                      # 预处理后的静态数据（构建产物）
│       ├── routes.json
│       └── route-details/
│           ├── 30000001_0.json
│           ├── 30000001_1.json
│           └── ...
│
├── src/
│   ├── main.tsx                   # 入口文件
│   ├── App.tsx                    # 根组件
│   ├── index.css                  # 全局样式 (Tailwind)
│   │
│   ├── components/
│   │   ├── SearchPanel.tsx        # 搜索面板（搜索框 + 下拉）
│   │   ├── MapView.tsx            # 地图容器
│   │   ├── RouteLayer.tsx         # 线路路径 + 站点标记（地图图层）
│   │   ├── BusMarkers.tsx         # 公交车位置标记（地图图层）
│   │   ├── InfoPanel.tsx          # 信息面板（方向切换 + 站点列表）
│   │   └── DirectionToggle.tsx    # 方向切换组件
│   │
│   ├── hooks/
│   │   ├── useRoutes.ts           # 加载 routes.json
│   │   ├── useRouteDetail.ts      # 加载线路详情
│   │   └── useVehiclePositions.ts # GTFS-RT 轮询 + 解析
│   │
│   ├── services/
│   │   └── gtfsRealtime.ts        # Protobuf 解析逻辑
│   │
│   ├── proto/
│   │   └── gtfs-realtime.json     # 预编译的 proto JSON
│   │
│   └── types/
│       └── index.ts               # TypeScript 类型定义
│
├── .github/
│   └── workflows/
│       ├── deploy.yml             # GitHub Pages 部署
│       └── update-gtfs.yml        # GTFS 数据定期更新
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## 关键依赖

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^5.x",
    "protobufjs": "^7.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "@types/leaflet": "^1.9.x",
    "csv-parse": "^5.x",
    "jszip": "^3.x",
    "tsx": "^4.x"
  }
}
```

## npm scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "preprocess": "tsx scripts/preprocess-gtfs.ts",
    "proto:compile": "npx pbjs -t json proto/gtfs-realtime.proto > src/proto/gtfs-realtime.json"
  }
}
```
