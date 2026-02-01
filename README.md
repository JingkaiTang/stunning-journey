# JingkaiTang.github.io

个人站点（Astro + GitHub Pages）。

## 本地开发

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

说明：`npm run build` 会在 `astro build` 之后自动运行 Pagefind，为站内搜索生成索引（输出到 `dist/pagefind/`）。

## 写作

- 写作模板：[`TEMPLATE.md`](./TEMPLATE.md)
- 文章列表：`/writing`
- Tags：`/tags`

## 部署

- 由 GitHub Actions 自动构建并部署到 GitHub Pages。
