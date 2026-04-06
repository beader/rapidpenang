# 数据预处理流程

## 概述

通过 Node.js 脚本在构建时将 GTFS Static ZIP 转换为前端友好的 JSON 文件。

## 脚本: `scripts/preprocess-gtfs.ts`

### 处理步骤

```
1. 下载 GTFS Static ZIP
       ↓
2. 解压并解析 CSV 文件
       ↓
3. 构建关联关系
       ↓
4. 输出优化的 JSON 文件
       ↓
5. 写入 public/data/
```

### 详细流程

#### Step 1: 下载 ZIP

```
GET https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-penang
→ 重定向到 S3: openapi-malaysia-transport.s3.ap-southeast-1.amazonaws.com/...
→ 下载 gtfs_rapid_bus_penang.zip
```

#### Step 2: 解析 CSV

使用 `csv-parse` 库解析以下文件：
- `routes.txt` → Map<route_id, Route>
- `trips.txt` → Map<trip_id, Trip>
- `stops.txt` → Map<stop_id, Stop>
- `shapes.txt` → Map<shape_id, ShapePoint[]>
- `stop_times.txt` → Map<trip_id, StopTime[]>

#### Step 3: 构建关联关系

对每条线路的每个方向：

1. 找到该 route_id + direction_id 的所有 trips
2. 取第一个 trip 作为代表（同方向的 trips 共用相同的 stops 和 shape）
3. 从 stop_times 中提取该 trip 的有序站点列表
4. 关联 shape 坐标数据
5. 提取 headsign

#### Step 4: 输出 JSON

**`public/data/routes.json`**
```json
[
  {
    "routeId": "30000001",
    "shortName": "101",
    "directions": [
      { "directionId": 0, "headsign": "JETI - TELUK BAHANG" },
      { "directionId": 1, "headsign": "TLK.BAHANG-JETI" }
    ]
  }
]
```

**`public/data/route-details/30000001_0.json`**
```json
{
  "routeId": "30000001",
  "shortName": "101",
  "directionId": 0,
  "headsign": "JETI - TELUK BAHANG",
  "stops": [
    { "stopId": "12002114", "stopName": "Pengkalan Weld", "stopCode": "IHB2114", "lat": 5.4134, "lon": 100.3398, "sequence": 1 },
    ...
  ],
  "shape": [[5.45785, 100.21487], [5.45795, 100.2149], ...]
}
```

### 数据优化

1. **坐标精度**：保留 5 位小数（约 1.1 米精度），减少 JSON 体积
2. **去重 shape**：同一 shape_id 只输出一次
3. **站点去重**：从 stop_times 中为每个 route+direction 选一个代表 trip 提取站点序列
4. **排序**：routes 按 shortName 自然排序，站点按 sequence 排序

## GitHub Actions 自动更新

```yaml
# .github/workflows/update-gtfs.yml
name: Update GTFS Data

on:
  schedule:
    - cron: '0 2 * * *'    # 每天 UTC 02:00（马来西亚上午10点）
  workflow_dispatch:        # 支持手动触发

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run preprocess
      - name: Check for changes
        id: changes
        run: |
          git diff --quiet public/data/ || echo "changed=true" >> $GITHUB_OUTPUT
      - name: Commit and deploy
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add public/data/
          git commit -m "chore: update GTFS static data"
          git push
```

部署使用另一个 workflow 或在同一 workflow 中触发 GitHub Pages 部署。
