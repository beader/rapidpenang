# 实时数据获取与解析

## 概述

GTFS Realtime Vehicle Position API 返回 Protocol Buffers 格式的数据，需要在浏览器端解析。

## Protobuf 解析方案

使用 `protobuf.js` 库加载 GTFS Realtime 的 `.proto` 定义文件，在浏览器端解析二进制响应。

### 依赖

```
protobufjs  — Protobuf 解析库
```

### Proto 定义

将 GTFS Realtime 的 `gtfs-realtime.proto` 文件预编译为 JSON 模块（构建时处理），避免运行时加载 `.proto` 文件。

```bash
npx pbjs -t json gtfs-realtime.proto > src/proto/gtfs-realtime.json
```

### 解析流程

```typescript
// 1. Fetch 二进制数据
const response = await fetch(GTFS_RT_URL);
const buffer = await response.arrayBuffer();

// 2. 解析 Protobuf
const root = protobuf.Root.fromJSON(protoJson);
const FeedMessage = root.lookupType('transit_realtime.FeedMessage');
const feed = FeedMessage.decode(new Uint8Array(buffer));

// 3. 提取车辆位置
const vehicles = feed.entity.map(entity => ({
  vehicleId: entity.vehicle.vehicle.id,
  routeShortName: entity.vehicle.trip.routeId,
  tripId: entity.vehicle.trip.tripId,
  directionId: entity.vehicle.trip.directionId,
  lat: entity.vehicle.position.latitude,
  lon: entity.vehicle.position.longitude,
  bearing: entity.vehicle.position.bearing,
  speed: entity.vehicle.position.speed,
  timestamp: entity.vehicle.timestamp,
}));

// 4. 按当前选中线路过滤
const filtered = vehicles.filter(v => v.routeShortName === selectedRoute.shortName);
```

## 轮询策略

```
API 频率限制: 4 requests / minute
选择间隔:    15 秒（= 4 次/分钟，刚好用满配额）
```

### 轮询管理

```typescript
// 使用 React useEffect + setInterval
useEffect(() => {
  if (!selectedRoute) return;

  const fetchPositions = async () => { /* ... */ };

  fetchPositions(); // 立即执行一次
  const timer = setInterval(fetchPositions, 15_000);

  return () => clearInterval(timer);
}, [selectedRoute]);
```

### 注意事项

1. **切换线路时不需要重新请求** — 每次请求返回所有线路的车辆位置，客户端过滤即可
2. **无选中线路时停止轮询** — 节省 API 配额
3. **错误处理** — 请求失败时不重试，等待下一个 15 秒周期
4. **Tab 不可见时暂停** — 使用 `document.visibilitychange` 事件，页面不可见时暂停轮询

### 数据刷新指示

在 UI 上显示：
- 上次更新时间（相对时间："5秒前"）
- 下次刷新倒计时进度条
- 请求失败时显示警告图标

## 车辆位置映射

实时数据中的 `route_id` 对应静态数据的 `route_short_name`：

```
Realtime: route_id = "101"
Static:   route_short_name = "101", route_id = "30000001"
```

这意味着过滤时使用 `shortName` 字段匹配。

## 处理未匹配的线路

实时数据中可能出现静态数据中不存在的线路（如 `T110B`, `T810B` 等临时线路）。这些线路：
- 在搜索列表中不显示（没有路线形状数据）
- 如果用户选中的线路恰好有这些临时线路的车辆，也能正常显示车辆位置
