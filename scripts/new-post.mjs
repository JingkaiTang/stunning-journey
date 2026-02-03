import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = process.cwd();
const WRITING_DIR = path.join(ROOT, 'src', 'content', 'writing');

function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

function normalizeTags(raw) {
  return String(raw || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
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

async function main() {
  const args = parseArgs(process.argv);

  const rl = readline.createInterface({ input, output });

  const title = args.title && args.title !== 'true' ? args.title : await rl.question('Title: ');
  const slugRaw = args.slug && args.slug !== 'true' ? args.slug : await rl.question('Slug (empty = auto): ');
  const tagsRaw = args.tags && args.tags !== 'true' ? args.tags : await rl.question('Tags (comma-separated, optional): ');
  const dateRaw = args.date && args.date !== 'true' ? args.date : await rl.question(`Date (YYYY-MM-DD, default ${todayISO()}): `);

  await rl.close();

  const pubDate = (dateRaw || '').trim() || todayISO();
  const slug = (slugRaw || '').trim() ? slugify(slugRaw) : slugify(title);

  if (!slug) {
    throw new Error('Slug is empty. Provide --slug or a non-empty title.');
  }

  const tags = normalizeTags(tagsRaw);

  const postDir = path.join(WRITING_DIR, slug);
  const mdPath = path.join(postDir, 'index.md');

  if (await exists(mdPath)) {
    throw new Error(`Post already exists: ${path.relative(ROOT, mdPath)}`);
  }

  await ensureDir(postDir);

  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify('')}`,
    `pubDate: ${JSON.stringify(pubDate)}`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    'draft: true',
    '',
    'by:',
    '  role: coauthored',
    '  name: 唐靖凯',
    '  note: "主人提供要点，获麟整理成文"',
    'source:',
    '  kind: original',
    '---',
    '',
  ].join('\n');

  const body = [
    '# ' + title,
    '',
    '（先写结论/观点，然后再补充论证与步骤。写作结构可随时演进。）',
    '',
    '![cover](cover.jpg)',
    '',
    '## 结论',
    '',
    'TODO',
    '',
    '## 过程 / 论证',
    '',
    'TODO',
    '',
    '## 参考',
    '',
    '- TODO',
    '',
  ].join('\n');

  await fs.writeFile(mdPath, fm + body, 'utf8');

  console.log(`Created: ${path.relative(ROOT, mdPath)}`);
  console.log(`Assets dir (put images here): ${path.relative(ROOT, postDir)}/`);
}

await main();
