# 部署方案

## GitHub Pages 部署

### Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  base: '/penang-bus/',  // GitHub Pages 仓库名
  // ...
});
```

### GitHub Actions 部署 Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

## 完整的数据更新 + 部署流程

```
          ┌──────────────────┐
          │ 每日定时触发       │
          │ (GitHub Actions)  │
          └────────┬─────────┘
                   ↓
          ┌──────────────────┐
          │ 下载 GTFS Static │
          │ 预处理为 JSON     │
          └────────┬─────────┘
                   ↓
          ┌──────────────────┐
          │ 有数据变化？       │
          └──┬──────────┬────┘
           是↓          ↓否
  ┌──────────────┐  ┌────────┐
  │ 提交 + 推送   │  │ 结束   │
  │ public/data/ │  └────────┘
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │ 触发部署      │
  │ workflow      │
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │ 构建 + 部署   │
  │ GitHub Pages │
  └──────────────┘
```

## 注意事项

1. **SPA 路由**: 本项目为单页面应用，GitHub Pages 默认不支持 SPA 路由。但由于本应用不使用路由（只有一个页面），所以不需要额外处理。

2. **CORS**: 两个 API 端点均支持 CORS，可以从 GitHub Pages 域名直接请求。

3. **缓存策略**:
   - 静态 JSON 数据：依赖 GitHub Pages 默认缓存策略（约 10 分钟）
   - GTFS-RT 数据：每次请求都是最新的，不缓存

4. **Base Path**: 如果仓库名不是 `penang-bus`，需要在 `vite.config.ts` 中修改 `base` 配置。
