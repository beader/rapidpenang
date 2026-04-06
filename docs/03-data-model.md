# 数据模型

## GTFS Static 原始数据结构

API 返回一个 ZIP 文件，包含以下 GTFS 标准文件：

| 文件 | 行数 | 说明 |
|------|------|------|
| `agency.txt` | 1 | 运营商信息 (Rapid Penang) |
| `calendar.txt` | 3 | 服务日历（工作日/周五/周末） |
| `routes.txt` | 47 | 线路定义 |
| `trips.txt` | 5,976 | 车次定义 |
| `stops.txt` | 1,925 | 站点定义 |
| `shapes.txt` | 40,702 | 线路几何形状坐标点 |
| `stop_times.txt` | 311,153 | 到站时间表 |

### 关键字段

**routes.txt**
```
route_id        — 内部 ID（如 30000001）
route_short_name — 线路名（如 101, 401, CAT）⚠️ 实时数据用这个字段匹配
route_long_name  — 与 route_short_name 相同
route_type       — 固定为 3（公交）
```

**trips.txt**
```
route_id      — 关联 routes.txt
service_id    — 关联 calendar.txt
trip_id       — 车次唯一 ID
trip_headsign — 方向描述（如 "JETI - TELUK BAHANG"）
direction_id  — 0 或 1
shape_id      — 关联 shapes.txt
```

**stops.txt**
```
stop_id   — 站点 ID
stop_code — 站点编码
stop_name — 站点名称
stop_lat  — 纬度
stop_lon  — 经度
```

**shapes.txt**
```
shape_id            — 关联 trips.txt
shape_pt_lat        — 纬度
shape_pt_lon        — 经度
shape_pt_sequence   — 坐标顺序
shape_dist_traveled — 累计距离
```

**stop_times.txt**
```
trip_id             — 关联 trips.txt
arrival_time        — 到达时间
departure_time      — 出发时间
stop_id             — 关联 stops.txt
stop_sequence       — 站点顺序
stop_headsign       — 方向描述
shape_dist_traveled — 累计距离（用于将站点映射到 shape 上）
```

## GTFS Realtime 数据结构

API 返回 Protocol Buffers 格式，GTFS Realtime `FeedMessage`。

```
FeedMessage
├── header
│   ├── gtfs_realtime_version: "2.0"
│   └── timestamp: 1775482769 (Unix timestamp)
└── entity[] (约 99 个车辆)
    ├── id: "0"
    └── vehicle
        ├── trip
        │   ├── route_id: "101"        ⚠️ 对应 static 的 route_short_name
        │   ├── trip_id: "260327010023S9"
        │   └── direction_id: 0
        ├── vehicle
        │   ├── id: "PLL7535"
        │   └── license_plate: "PLL7535"
        ├── position
        │   ├── latitude: 5.4587
        │   ├── longitude: 100.2162
        │   ├── bearing: 0.0          (行驶方向角度)
        │   └── speed: 0.0            (速度 m/s)
        ├── timestamp: 1775482748
        └── occupancy_status: 0
```

### 关键匹配关系

```
Realtime.vehicle.trip.route_id  ←→  Static.routes.route_short_name
Realtime.vehicle.trip.trip_id   ←→  Static.trips.trip_id（约 67% 匹配率）
Realtime.vehicle.trip.direction_id ←→ Static.trips.direction_id
```

> **注意**：实时数据中的 `route_id` 实际对应静态数据中的 `route_short_name`，而非 `route_id`。
> 实时数据中可能出现静态数据中不存在的线路（如 T 开头的临时线路）。

## 预处理后的数据模型

### routes.json

```typescript
interface RouteSummary {
  routeId: string;        // 静态 route_id（如 "30000001"）
  shortName: string;      // route_short_name（如 "101"）
  directions: {
    directionId: number;  // 0 或 1
    headsign: string;     // 如 "JETI - TELUK BAHANG"
    shapeId: string;      // 关联 shape 文件
  }[];
}

// routes.json = RouteSummary[]
```

### route-details/{route_id}_{direction_id}.json

```typescript
interface RouteDetail {
  routeId: string;
  shortName: string;
  directionId: number;
  headsign: string;
  shapeId: string;
  stops: {
    stopId: string;
    stopName: string;
    stopCode: string;
    lat: number;
    lon: number;
    sequence: number;
  }[];
  shape: [number, number][];  // [lat, lon] 坐标数组
}
```

### 实时车辆位置（浏览器端解析后）

```typescript
interface VehiclePosition {
  vehicleId: string;
  routeShortName: string;
  tripId: string;
  directionId: number;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
  timestamp: number;
}
```
