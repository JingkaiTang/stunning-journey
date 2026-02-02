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

说明：如果项目启用了 Pagefind，那么 `npm run build` 会在 `astro build` 之后自动运行 Pagefind，为站内搜索生成索引（输出到 `dist/pagefind/`）。

## 部署

- GitHub Actions 自动构建并部署到 GitHub Pages。

## 写作

- 写作模板：[`TEMPLATE.md`](./TEMPLATE.md)
- Writing 列表：`/writing`
- Tags：`/tags`
- Now：`/now`

---

## TODO（路线图）

> 不包含评论系统（giscus/utterances 等）——该项先不做。

### P0（必须做，避免体验坑）

- [ ] 首页与全站 Layout 统一：`src/pages/index.astro` 也使用 `BaseLayout`（统一导航、SEO/OG、head 注入、样式）
- [ ] 部署链路确认：Actions/Pages 每次构建稳定产出（含 Pagefind 索引生成）
- [ ] 搜索质量：为主内容区域添加 `data-pagefind-body`，避免索引导航/页脚；优化搜索结果摘要

### P1（强烈建议：SEO / 分享 / 可访问性）

- [ ] OG/Meta 完整化：文章页 `og:type=article`、更稳的 `og:image/description` 等
- [ ] 站点基建：`sitemap.xml` + `robots.txt`
- [ ] 404 体验：增强 404 页面（返回上一页/直接搜索入口等）

### P2（内容生产与长期维护）

- [ ] 写作工作流固化：README/单页说明“新建文章→预览→发布”
- [ ] 自动化：新增 `npm run new:post`（生成 md/frontmatter/slug/date）
- [ ] 内容结构：补齐 Games / Life 页面的可持续更新结构（索引/清单/年度总结等）
- [ ] Now 维护约定：保持“最新在上”的排序与固定格式

### P3（可选增强）

- [ ] 快捷搜索：Cmd/Ctrl+K 弹窗搜索
- [ ] 性能优化：字体/图片策略、代码高亮体积、CSS/JS 体积审计
