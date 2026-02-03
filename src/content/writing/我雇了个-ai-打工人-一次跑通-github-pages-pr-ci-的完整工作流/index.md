---
title: "我雇了个 AI 打工人：一次跑通 GitHub Pages + PR + CI 的完整工作流"
description: "雇个 AI 搭子，从 0 跑通个人站的开发-评审-部署流水线：过程记录、兴奋点与踩坑吐槽。"
pubDate: "2026-02-03"
tags: ["ai", "openclaw", "github", "github-pages", "workflow"]
draft: true

by:
  role: coauthored
  name: 唐靖凯
  note: "主人提供要点，获麟整理成文"
source:
  kind: original
---
# 我雇了个 AI 打工人：一次跑通 GitHub Pages + PR + CI 的完整工作流

（先写结论/观点，然后再补充论证与步骤。写作结构可随时演进。）

![cover](cover.jpg)

## 结论（先给一句人话）

我以为“让 AI 帮我搞个个人站”顶多是写点代码，结果它把 **开分支 → 提交 → 开 PR → 处理评审 → 合并 → 自动部署** 这套活也一起包了。最爽的不是省时间，而是：

- 你开始相信“流程”真的可以被自动化、被复用
- 你会更愿意写（因为发布成本被压到很低）
- 你也会被它的认真程度气笑：它会提醒你按流程走、还会主动补 TODO

（是的，偶尔也会翻车，比如 Actions 抢不到 runner，或者我在群里催它“继续”。）

## 这次到底做了什么（不严肃但可复现）

### 0. 背景：我为什么突然想折腾这套

- 我想要一个“写作 + 作品集 + Now 碎碎念”一体的站点
- 但是我也知道自己：没有**顺手的发布流程**，写两篇就断更
- 所以这次目标不是“把站点写出来”，而是“把**持续产出**这件事跑通”

### 1. 项目骨架：Astro + GitHub Pages

- 技术栈：Astro 静态站点
- 部署：GitHub Actions → GitHub Pages

AI 做的事：把目录结构、页面、RSS、SEO 这些“基建活”做成一个能持续迭代的 baseline。

### 2. 关键：把流程做成“按钮”

站点写得再漂亮，不如这两个命令实用：

- `npm run publish:writing -- --slug <slug>`：Writing 走分支 + PR + review
- `npm run publish:now -- --slug <slug>`：Now 直推 main（更像发动态）

AI 做的事：把脚本写好、把边界条件补齐（比如工作区必须干净、必须 build 通过）。

### 3. 协作方式：我负责“说人话”，它负责“变成 PR”

典型对话长这样：

- 我：这个页面在 GitHub Pages 下路径不对
- 它：定位原因 → 修复 → 本地 build 验证 → commit → PR → 等 Copilot review → 合并

我最喜欢的点：它会把每一步都写得像 checklist，你只要挑刺就行。

### 4. 踩坑吐槽（真实）

- **GitHub Actions 偶发拿不到 hosted runner**：你代码没错，它也会 0 秒失败。
  - 解决：re-run jobs，别跟自己过不去。
- **流程中断**：有时候我在群里一句“继续”，它才会想起自己还欠一项 TODO。
  - 解决：把规则写进项目的 `AGENTS.md`（自动推进下一项）。

### 5. 最后成果：不是“站点完成”，而是“可持续交付”

我现在能做到：

- 想写文章：开稿 → 补内容 → 一键走 PR
- 想发动态：Now 一键直推
- 想优化：TODO 按条推进（每条都有 PR 和 deploy）

## 你可以抄走的经验（简版）

- 把“发布”变成命令，而不是仪式
- 让 AI 输出 PR，而不是输出建议
- 让 CI 说话：build 不过就别想合并

## 参考

- 本站仓库：JingkaiTang/JingkaiTang.github.io
- OpenClaw（用来把 AI 变成“能动手的打工人”）
