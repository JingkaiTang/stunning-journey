#!/usr/bin/env node
/**
 * Daily mood Now generator + publisher.
 *
 * Goal: at 00:00 Asia/Shanghai, reflect on yesterday's work mood and (optionally)
 * publish a Now entry with a fitting Huolin image.
 *
 * Usage:
 *   node scripts/daily-mood-now.mjs [--force] [--dry-run]
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const REPO = 'JingkaiTang/JingkaiTang.github.io';
const BANK_DIR = path.join(ROOT, '.huolin_image_bank');
const NOW_DIR = path.join(ROOT, 'src', 'content', 'now');

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function shOut(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  return String(r.stdout).trim();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = val;
  }
  return out;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoShanghai(date) {
  // Return ISO-ish with +08:00 offset
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+08:00`;
}

function ymdShanghai(date) {
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}${mm}${dd}`;
}

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function ensureUniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (await exists(path.join(NOW_DIR, slug, 'index.md'))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function yesterdayRangeShanghai(now = new Date()) {
  // Compute [yesterday 00:00, today 00:00) in Shanghai, expressed as Date in UTC timeline.
  const utcMs = now.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const sh = new Date(shMs);

  const y = sh.getUTCFullYear();
  const m = sh.getUTCMonth();
  const d = sh.getUTCDate();

  const todayStartSh = Date.UTC(y, m, d, 0, 0, 0);
  const yestStartSh = Date.UTC(y, m, d - 1, 0, 0, 0);

  // Convert Shanghai-local-midnight timestamps back to UTC timeline by subtracting offset.
  const todayStartUtcMs = todayStartSh - 8 * 60 * 60 * 1000;
  const yestStartUtcMs = yestStartSh - 8 * 60 * 60 * 1000;

  return {
    since: new Date(yestStartUtcMs),
    until: new Date(todayStartUtcMs),
    ymd: ymdShanghai(new Date(yestStartUtcMs)),
  };
}

function pickMood({ commitCount, hasWorkflow, hasWriting, hasNow }) {
  // Heuristic: keep it simple and predictable.
  if (commitCount === 0 && !hasWorkflow && !hasWriting && !hasNow) {
    return {
      mood: '躺平充电',
      image: 'huolin-lazy-sleep-in-bed.jpg',
      tags: ['now', 'mood', 'life'],
      title: '昨日心情：躺平充电',
      oneLiner: '昨天没太多推进——那就把它当成一次认真充电。',
    };
  }

  if (hasWorkflow || (commitCount >= 3 && (hasWriting || hasNow))) {
    return {
      mood: '专注干活',
      image: 'huolin-working-at-laptop.jpg',
      tags: ['now', 'mood', 'workflow', 'tooling'],
      title: '昨日心情：专注干活',
      oneLiner: '昨天的状态：一口气把流程和细节推过了几个坎。',
    };
  }

  if (commitCount >= 1 && (hasWriting || hasNow)) {
    return {
      mood: '小有进展',
      image: 'huolin-sleepy-subway.jpg',
      tags: ['now', 'mood', 'life'],
      title: '昨日心情：小有进展',
      oneLiner: '昨天推进了一点点，但很真实。',
    };
  }

  return {
    mood: '复盘面对现实',
    image: 'huolin-on-bodyfat-scale.jpg',
    tags: ['now', 'mood', 'life'],
    title: '昨日心情：复盘面对现实',
    oneLiner: '昨天不一定很顺，但至少把问题看清了。',
  };
}

function shouldSkip({ commitCount, force }) {
  // If nothing happened, allow skipping.
  if (force) return false;
  if (commitCount === 0) {
    // 60% skip to respect "想不想发" when the day is blank.
    return Math.random() < 0.6;
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv);
  const force = args.force === 'true';
  const dryRun = args['dry-run'] === 'true' || args.dryRun === 'true';

  // Ensure bank exists
  if (!fs.existsSync(BANK_DIR)) {
    console.error(`Missing image bank: ${path.relative(ROOT, BANK_DIR)}`);
    process.exit(2);
  }

  // Must be clean; we will commit directly to main.
  const porcelain = shOut('git', ['status', '--porcelain']);
  if (porcelain) {
    console.error('Working tree not clean. Commit/stash your changes first.');
    process.exit(2);
  }

  sh('git', ['checkout', 'main']);
  sh('git', ['pull', '--ff-only', 'origin', 'main']);

  const { since, until, ymd } = yesterdayRangeShanghai(new Date());
  const sinceIso = since.toISOString();
  const untilIso = until.toISOString();

  const log = shOut('git', ['log', `--since=${sinceIso}`, `--until=${untilIso}`, '--pretty=%s']);
  const subjects = log ? log.split('\n').filter(Boolean) : [];
  const commitCount = subjects.length;

  const hasWorkflow = subjects.some((s) => /workflow|ci|actions|deploy|pages/i.test(s));
  const hasWriting = subjects.some((s) => /writing/i.test(s));
  const hasNow = subjects.some((s) => /^now:/i.test(s));

  if (shouldSkip({ commitCount, force })) {
    console.log(`[daily-mood] Skip posting (commitCount=${commitCount}).`);
    return;
  }

  const choice = pickMood({ commitCount, hasWorkflow, hasWriting, hasNow });

  const title = choice.title;
  const slugBase = `${ymd}000000-` + slugify(title);
  const slug = await ensureUniqueSlug(slugBase);
  const postDir = path.join(NOW_DIR, slug);

  await ensureDir(postDir);

  const srcImg = path.join(BANK_DIR, choice.image);
  const dstImg = path.join(postDir, 'cover.jpg');
  if (!fs.existsSync(srcImg)) {
    console.error(`Image not found in bank: ${choice.image}`);
    process.exit(2);
  }

  if (!dryRun) {
    await fsp.copyFile(srcImg, dstImg);
  }

  const pubDate = isoShanghai(new Date());
  const fm = [
    '---',
    `title: ${JSON.stringify(`Now: ${title}`)}`,
    `description: ${JSON.stringify(choice.oneLiner)}`,
    `pubDate: ${JSON.stringify(pubDate)}`,
    `tags: [${choice.tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    'draft: false',
    '',
    'by:',
    '  role: assistant',
    '  name: 获麟',
    '  note: "每日 0 点自动复盘（可跳过）"',
    'source:',
    '  kind: original',
    '---',
    '',
  ].join('\n');

  // Tiny, consistent body.
  const body = [
    '![cover](cover.jpg)',
    '',
    `一句话：${choice.oneLiner}`,
    '',
    '获麟说（甩甩尾巴）：',
    `> 昨天的心情大概是「${choice.mood}」。`,
    `> （按惯例：我只吐槽事，不吐槽人。）`,
    '',
    '## 昨日小结',
    '',
    `- git 提交数：${commitCount}`,
    `- 关键词：${commitCount ? subjects.slice(0, 3).join(' / ') : '（空白日）'}`,
    '',
    '## 今日一小步',
    '',
    '- 选一个最小的 TODO 推一下；推不动就先把阻塞写出来。',
  ].join('\n');

  const mdPath = path.join(postDir, 'index.md');

  if (dryRun) {
    console.log('[daily-mood] Dry run. Would create:', path.relative(ROOT, mdPath));
    console.log('[daily-mood] Image:', choice.image);
    return;
  }

  await fsp.writeFile(mdPath, fm + body, 'utf8');

  // Build + commit + push
  sh('npm', ['run', 'build']);

  sh('git', ['add', `src/content/now/${slug}/`]);

  const msg = `Now: ${title}`;
  sh('git', ['commit', '-m', msg]);

  sh('git', ['push', `ssh://git@ssh.github.com:443/${REPO}.git`, 'main']);

  // Ensure Pages deploy catches up
  sh('node', ['scripts/ensure-pages-deploy.mjs', '--workflow', 'pages.yml', '--branch', 'main']);

  console.log(`Published Now: /now/${slug}/`);
}

await main();
