import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = process.cwd();
const NOW_DIR = path.join(ROOT, 'src', 'content', 'now');

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function nowIdShanghai(date = new Date()) {
  // Asia/Shanghai UTC+8, format: YYYYMMDDHHmm
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  return `${yyyy}${mm}${dd}${hh}${mi}`;
}

function isoShanghai(date = new Date()) {
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

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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

async function main() {
  const args = parseArgs(process.argv);
  const rl = readline.createInterface({ input, output });

  const title = args.title && args.title !== 'true' ? args.title : await rl.question('Now title: ');
  const tagsRaw = args.tags && args.tags !== 'true' ? args.tags : await rl.question('Tags (comma-separated, optional): ');
  await rl.close();

  const id = nowIdShanghai(new Date());
  const suffix = slugify(title);
  const slug = suffix ? `${id}-${suffix}` : id;

  const postDir = path.join(NOW_DIR, slug);
  const mdPath = path.join(postDir, 'index.md');

  if (await exists(mdPath)) {
    throw new Error(`Now already exists: ${path.relative(ROOT, mdPath)}`);
  }

  const tags = (tagsRaw || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Force include "now"
  if (!tags.includes('now')) tags.unshift('now');

  await ensureDir(postDir);

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
    '  note: "根据主人需求生成 / 编辑"',
    'source:',
    '  kind: original',
    '---',
    '',
  ].join('\n');

  const body = [
    `一句话：${title}`,
    '',
    '## 这次做了什么',
    '',
    '- TODO',
    '- TODO',
    '- TODO',
    '',
    '## 下一步',
    '',
    'TODO',
    '',
  ].join('\n');

  await fs.writeFile(mdPath, fm + body, 'utf8');

  console.log(`Created: ${path.relative(ROOT, mdPath)}`);
  console.log(`Assets dir: ${path.relative(ROOT, postDir)}/`);
}

await main();
