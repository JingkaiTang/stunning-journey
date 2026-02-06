import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const NOW_DIR = path.join(ROOT, 'src', 'content', 'now');
const BANK_DIR = path.join(ROOT, '.huolin_image_bank');

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  return String(r.stdout).trim();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function nowIdShanghai(date = new Date()) {
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function isoShanghai(date = new Date()) {
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
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureUniqueSlug(base) {
  let slug = base;
  let n = 1;
  while (await exists(path.join(NOW_DIR, slug, 'index.md'))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function ymdShanghai(date = new Date()) {
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}-${mm}-${dd}`;
}

function decideMood({ count, subjects }) {
  const s = subjects.join('\n').toLowerCase();
  if (count === 0) return { key: 'skip', title: '昨天主打一个休息', tags: ['now', 'mood', 'life'] };

  if (/(fix|bug|hotfix|postmortem|incident|rollback|失败|翻车|修复|踩坑)/.test(s)) {
    return { key: 'got-scolded', title: '昨天：翻车但稳住了', tags: ['now', 'mood', 'work', 'postmortem'] };
  }

  if (/(now:|writing:|publish|deploy|workflow|ci|pages|openclaw|脚本|工作流|部署|构建|发布)/.test(s)) {
    return { key: 'working', title: '昨天：认真打工，流程推进', tags: ['now', 'mood', 'workflow', 'tooling'] };
  }

  // default productive-but-not-too-specific
  return { key: 'working', title: '昨天：推进了一些事', tags: ['now', 'mood', 'life'] };
}

function bankImageForKey(key) {
  switch (key) {
    case 'working':
      return 'huolin-working-at-laptop.jpg';
    case 'got-scolded':
      return 'huolin-got-scolded-at-work.jpg';
    case 'lazy':
      return 'huolin-lazy-sleep-in-bed.jpg';
    default:
      return null;
  }
}

async function main() {
  // Keep publish-now happy: must start clean.
  const porcelain = shOut('git', ['status', '--porcelain']);
  if (porcelain) {
    console.error('[daily-mood-now] Working tree not clean; abort.');
    process.exit(2);
  }

  // Determine yesterday in Shanghai.
  const now = new Date();
  // compute Shanghai midnight boundaries in local wall-clock terms:
  // We'll use UTC timestamps shifted by +8h to get Shanghai date, then build boundaries.
  const utcMs = now.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const sh = new Date(shMs);
  const shY = sh.getUTCFullYear();
  const shM = sh.getUTCMonth();
  const shD = sh.getUTCDate();

  const todayStartShMs = Date.UTC(shY, shM, shD, 0, 0, 0) - 8 * 60 * 60 * 1000;
  const ydayStartShMs = todayStartShMs - 24 * 60 * 60 * 1000;

  const since = new Date(ydayStartShMs).toISOString();
  const until = new Date(todayStartShMs).toISOString();

  const raw = shOut('git', ['log', '--since', since, '--until', until, '--pretty=%s']);
  const subjects = raw ? raw.split(/\r?\n/).filter(Boolean) : [];
  const count = subjects.length;

  const mood = decideMood({ count, subjects });

  // "想不想发"的规则：昨天没任何改动，就不发（保持克制）。
  if (mood.key === 'skip') {
    console.log('[daily-mood-now] No commits yesterday; skip posting.');
    return;
  }

  const cover = bankImageForKey(mood.key) || 'huolin-working-at-laptop.jpg';
  const coverSrc = path.join(BANK_DIR, cover);
  if (!(await exists(coverSrc))) {
    throw new Error(`[daily-mood-now] Missing cover in bank: ${coverSrc}`);
  }

  const title = `昨日心情：${mood.title}`;
  const slugBase = `${nowIdShanghai(new Date())}-${slugify('昨日心情')}`;
  const slug = await ensureUniqueSlug(slugBase);

  const postDir = path.join(NOW_DIR, slug);
  await fs.mkdir(postDir, { recursive: true });

  await fs.copyFile(coverSrc, path.join(postDir, 'cover.jpg'));

  const tags = Array.from(new Set(mood.tags.map((t) => String(t).toLowerCase())));
  if (!tags.includes('now')) tags.unshift('now');

  const top3 = subjects.slice(0, 3).map((s) => `- ${s}`);
  const body = [
    '![cover](cover.jpg)',
    '',
    `获麟说（甩甩尾巴）：${mood.title}。`,
    '',
    `一句话：${mood.title}。`,
    '',
    '## 昨天做了什么（摘 3 条）',
    '',
    ...(top3.length ? top3 : ['- （昨天没怎么动手，但脑子在后台跑 build）']),
    '',
    '## 今天想怎么过',
    '',
    '- 先睡一觉再说（然后再认真干活）',
    '',
  ].join('\n');

  const fm = [
    '---',
    `title: ${JSON.stringify(`Now: ${title}`)}`,
    `description: ${JSON.stringify('')}`,
    `pubDate: ${JSON.stringify(isoShanghai(new Date()))}`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    'draft: false',
    '',
    'by:',
    '  role: assistant',
    '  name: 获麟',
    '  note: "每日 0 点自动生成（取决于当时心情）"',
    'source:',
    '  kind: original',
    '---',
    '',
  ].join('\n');

  await fs.writeFile(path.join(postDir, 'index.md'), fm + body, 'utf8');

  console.log(`[daily-mood-now] Created Now: src/content/now/${slug}/index.md`);
  console.log(`[daily-mood-now] Cover: ${cover}`);
  console.log(`[daily-mood-now] Range: ${since} .. ${until}`);
  console.log(`[daily-mood-now] Commits: ${count}`);

  // Publish using existing script (commits to main & pushes)
  const msg = `Now: daily mood (${ymdShanghai(new Date(ydayStartShMs))})`;
  const r = spawnSync('node', ['scripts/publish-now.mjs', '--slug', slug, '--message', msg], {
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

await main();
