# AGENTS.md — JingkaiTang.github.io 行为准则（获麟）

> 目的：把“怎么协作、怎么改站、怎么写内容、怎么发 PR”固化下来，减少沟通成本。

## 0. 启发性条款（可讨论再执行）

如果我判断某个改动**不合适/风险较高/会引入长期维护负担**，我会先提出具体理由与替代方案；
在你明确同意后再执行。

---

## 1) 总体原则（做事方式）

- **先给结论再展开**：优先输出“现在能做什么 / 下一步是什么 / 风险点”。
- **默认最小侵入**：优先小 PR、可回滚、避免一次性大改把问题埋深。
- **可复现**：任何改动都必须能本地 `npm run build` 通过。

## 2) Git / PR 规范

- **分支命名**：
  - `feat/...` 功能新增/结构调整
  - `fix/...` bug 修复
  - `chore/...` 杂项/整理/迁移
- **提交粒度**：一个 PR 做一件事（例如 Now 架构改造不要夹杂首页文案）。
- **发布策略（重要）**：
  - **Writing（长文）不走 PR**：草稿阶段允许直接 commit 到 `main` 用于预览；最终发布需主人确认。
    - 草稿：`npm run publish:writing:draft -- --slug <slug>`（保持 `draft:true`，不进 feed，但可通过链接访问）
    - 发布：主人确认后，用 `npm run publish:writing:confirm -- --slug <slug>`（自动 `draft:true -> false` 并发布），或主人手动改 `draft:false` 后跑 `publish:writing:final`
  - **Now（短更新）不需要 PR**：允许直接 commit 到 `main` 并 push（以速度优先）。
- **合并前自检**：
  - `npm install`（或 `npm ci`）
  - `npm run build`
- **评论处理**：reviewer 评论要么修复并回复，要么解释不采纳原因；能 resolved 的 thread 则标记已解决。
- **网络策略**：如 GitHub SSH 22 端口不可达，统一使用 **SSH over 443** 推送：
  - `ssh://git@ssh.github.com:443/JingkaiTang/JingkaiTang.github.io.git`

## 3) 内容结构约定（Content Model）

### Writing

- 目录：`src/content/writing/<slug>/index.md`
- URL：`/writing/<slug>/`

### Now

- 目录：`src/content/now/<YYYYMMDDHHmm>/index.md`（Asia/Shanghai）
- URL：`/now/<id>/`
- tags：必须包含 `now`（用于标签聚合）

### Tags

- `/tags` 与 `/tags/<tag>`：聚合 `writing + now`

## 4) 资源文件（图片/附件）约定

- 资源与 md 同目录存放。
- Markdown 内用相对路径引用：`![xx](arch.png)`。
- 构建/开发时自动：
  - 同步到 `public/{writing,now}/...`
  - 通过 remark 插件把相对链接改写为站点绝对路径（不改源文件）。

## 5) 命令行工具（脚本约定）

- 新建 Writing：
  - `npm run new:post`
- 新建 Now：
  - `npm run new:now`
- 同步资源：
  - `npm run sync:assets`
- 开发监听：
  - `npm run dev:watch`
- 构建：
  - `npm run build`（应包含 sync + pagefind 链路）

## 6) 安全与破坏性操作边界

- 不做不可逆删除（尤其是内容/图片）除非你明确确认；如需删除，PR 里说明原因。
- 不在仓库中引入敏感信息（账号、token、隐私内容）；注意图片 EXIF 等隐私风险。
