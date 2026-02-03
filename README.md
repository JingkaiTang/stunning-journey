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

## 性能/体积审计

```bash
# 构建 + 输出 dist 体积 Top 列表（含 gzip 粗略统计）
npm run audit:size
```

补充：代码高亮目前依赖 Astro 的构建期处理（无额外前端 runtime JS）。如果未来引入 Shiki/Prism 主题 CSS 或客户端高亮，再把该部分纳入 audit:size 的关注项。

说明：如果项目启用了 Pagefind，那么 `npm run build` 会在 `astro build` 之后自动运行 Pagefind，为站内搜索生成索引（输出到 `dist/pagefind/`）。

## 部署

- GitHub Actions 自动构建并部署到 GitHub Pages。

## 写作

- 写作模板：[`TEMPLATE.md`](./TEMPLATE.md)
- Writing 列表：`/writing`
- Tags：`/tags`
- Now：`/now`

### 文章与资源同目录（推荐）

每篇文章一个目录：

```text
src/content/writing/
  <slug>/
    index.md
    cover.jpg
    arch.png
```

在 `index.md` 中直接用相对路径引用：

```md
![cover](cover.jpg)
![arch](arch.png)
```

构建时会自动：
- 将资源复制到 `public/writing/<slug>/...`
- 将 Markdown 中的相对图片链接改写为 `/writing/<slug>/...`（通过 remark 插件，不改你的源文件）

### 命令行工具

```bash
# 新建 Writing 文章目录（index.md + 基础 frontmatter）
npm run new:post
npm run new:post -- --title "标题" --slug my-post --tags "ai,tooling" --date 2026-02-02

# 新建 Now（独立 collection，默认 slug=YYYYMMDDHHmmss，Asia/Shanghai）
npm run new:now
npm run new:now -- --title "今天做了什么" --tags "openclaw,setup"

# 可选：把标题附到 slug 后（URL 更长但更可读）
npm run new:now -- --title "今天做了什么" --tags "openclaw,setup" --withTitle

# 同步文章/Now 资源到 public（构建/开发前可单独跑）
npm run sync:assets

# 开发：启动 dev server + 监听 content 目录变化自动同步资源
npm run dev:watch
```

---

## TODO

> 不包含评论系统（giscus/utterances 等）——该项先不做。

1. [x] 首页与全站 Layout 统一（统一导航、SEO/OG、head 注入、样式）
2. [x] 搜索质量：Pagefind 只索引正文（`data-pagefind-body`）并忽略导航/页脚（`data-pagefind-ignore`）
3. [x] OG/Meta 完整化：文章页 `og:type=article`、更稳的 `og:image/description` 等
4. [x] 站点基建：`sitemap.xml` + `robots.txt`
5. [x] 404 体验：增强 404 页面（返回上一页/直接搜索入口等）
6. [x] 自动化：`new:post / new:now / sync:assets / dev:watch`
7. [x] 发布命令：Writing 一键开分支/commit/push/开 PR（`npm run publish:writing -- --slug <slug>`）
8. [x] 发布命令：Now 一键 commit+push main（不走 PR，`npm run publish:now -- --slug <slug>`）
9. [x] 快捷搜索：Cmd/Ctrl+K 弹窗搜索
10. [x] 性能优化：字体加载优化（移除 CSS @import，改为 preconnect + link）
11. [x] 性能优化：代码高亮体积（当前为构建期渲染，无额外运行时 JS；后续若引入主题再审计）
12. [x] 性能优化：CSS/JS 体积审计工具（`npm run audit:size`）
13. [x] 性能优化：图片加载（decoding=async + fetchpriority）
14. [x] 性能优化：减少页面 HTML 体积（Quick Search 样式/脚本外置并缓存）
15. [ ] 增加 `astro check` 并在 CI 中执行（新增 `npm run check` 或直接在 workflow 里跑）
16. [ ] 固定 Node 与包管理器版本（`engines` / `packageManager` + `.nvmrc` 或 `.tool-versions`）
17. [ ] `sync:assets` 增加 `--clean` 可选清理逻辑（仅清理对应 slug 目录，执行前需确认）
18. [ ] `dev:watch` 增加并发保护/去抖，避免频繁触发 `sync:assets`
19. [ ] 标签规范化（统一小写/去空格）以减少 `AI/ai` 等重复标签
20. [ ] `new-now` 的 slug 冲突处理（毫秒/随机后缀或检测后自动改名）
21. [ ] `audit-size` 跨平台兼容或在 README 标注 *nix 依赖
22. [ ] 明确 `legacy/index.html` 用途或移除（删除需确认）
