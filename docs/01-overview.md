# Penang Bus Tracker - 项目概述

## 目标

构建一个纯前端的 Rapid Penang 公交实时位置追踪 Web App，可直接托管在 GitHub Pages 上，无需后端服务。

## 核心功能

1. **地图展示** - 基于 OpenStreetMap 的交互式地图，默认聚焦槟城区域
2. **线路搜索** - 搜索框 + 下拉选择线路，支持方向（direction）切换
3. **线路可视化** - 选中线路后在地图上绘制路线形状（shape）和沿途站点
4. **实时车辆位置** - 在地图上以图标显示当前线路公交车的实时位置，定期刷新

## 数据源

| 数据 | API | 格式 | 频率限制 |
|------|-----|------|----------|
| GTFS Static | `api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-penang` | ZIP (GTFS txt files) | 4 req/min |
| GTFS Realtime | `api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-penang` | Protocol Buffers | 4 req/min |

## 约束

- 纯前端，无后端 / 无数据库
- 可部署到 GitHub Pages（静态托管）
- API 速率限制 4 次/分钟
- 需要处理 CORS（两个 API 均支持跨域访问）
