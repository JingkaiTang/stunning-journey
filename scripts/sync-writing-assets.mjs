import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_WRITING_DIR = path.join(ROOT, 'src', 'content', 'writing');
const SRC_NOW_DIR = path.join(ROOT, 'src', 'content', 'now');

const PUBLIC_WRITING_DIR = path.join(ROOT, 'public', 'writing');
const PUBLIC_NOW_DIR = path.join(ROOT, 'public', 'now');

const ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4']);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

function slugFromIndexMd(indexMdPath) {
  // src/content/writing/<slug>/index.md => <slug>
  const rel = path.relative(SRC_WRITING_DIR, indexMdPath);
  const parts = rel.split(path.sep);
  if (parts.length >= 2 && parts[parts.length - 1] === 'index.md') {
    return parts[parts.length - 2];
  }
  // fallback: src/content/writing/<slug>.md
  return path.basename(indexMdPath, path.extname(indexMdPath));
}

async function syncOnePostDir({ postDir, indexName = 'index.md', publicBaseDir, slugFn }) {
  const indexMd = path.join(postDir, indexName);
  if (!(await exists(indexMd))) return;

  const slug = slugFn(indexMd);
  const outDir = path.join(publicBaseDir, slug);
  await ensureDir(outDir);

  const entries = await fs.readdir(postDir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (e.name === 'index.md') continue;

    const ext = path.extname(e.name).toLowerCase();
    if (!ASSET_EXTS.has(ext)) continue;

    const src = path.join(postDir, e.name);
    const dst = path.join(outDir, e.name);
    await fs.copyFile(src, dst);
  }
}

async function main() {
  let total = 0;

  // writing
  if (await exists(SRC_WRITING_DIR)) {
    const top = await fs.readdir(SRC_WRITING_DIR, { withFileTypes: true });
    const postDirs = top.filter((e) => e.isDirectory()).map((e) => path.join(SRC_WRITING_DIR, e.name));
    for (const d of postDirs) {
      await syncOnePostDir({
        postDir: d,
        publicBaseDir: PUBLIC_WRITING_DIR,
        slugFn: slugFromIndexMd,
      });
      total++;
    }
  }

  // now
  if (await exists(SRC_NOW_DIR)) {
    const top = await fs.readdir(SRC_NOW_DIR, { withFileTypes: true });
    const postDirs = top.filter((e) => e.isDirectory()).map((e) => path.join(SRC_NOW_DIR, e.name));

    const slugFromNowIndex = (indexMdPath) => {
      // src/content/now/<id>/index.md => <id>
      const rel = path.relative(SRC_NOW_DIR, indexMdPath);
      const parts = rel.split(path.sep);
      if (parts.length >= 2 && parts[parts.length - 1] === 'index.md') return parts[parts.length - 2];
      return path.basename(indexMdPath, path.extname(indexMdPath));
    };

    for (const d of postDirs) {
      await syncOnePostDir({
        postDir: d,
        publicBaseDir: PUBLIC_NOW_DIR,
        slugFn: slugFromNowIndex,
      });
      total++;
    }
  }

  console.log(`[sync:assets] Synced assets for ${total} post folders -> public/{writing,now}/`);
}

await main();
