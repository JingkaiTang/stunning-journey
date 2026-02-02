import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_WRITING_DIR = path.join(ROOT, 'src', 'content', 'writing');
const PUBLIC_WRITING_DIR = path.join(ROOT, 'public', 'writing');

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

async function syncOnePostDir(postDir) {
  const indexMd = path.join(postDir, 'index.md');
  if (!(await exists(indexMd))) return;

  const slug = slugFromIndexMd(indexMd);
  const outDir = path.join(PUBLIC_WRITING_DIR, slug);
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
  if (!(await exists(SRC_WRITING_DIR))) {
    console.warn(`[sync:assets] No writing dir: ${SRC_WRITING_DIR}`);
    return;
  }

  // Only treat directories with index.md as posts.
  const top = await fs.readdir(SRC_WRITING_DIR, { withFileTypes: true });
  const postDirs = top.filter((e) => e.isDirectory()).map((e) => path.join(SRC_WRITING_DIR, e.name));

  for (const d of postDirs) {
    await syncOnePostDir(d);
  }

  // Also support legacy flat files: src/content/writing/*.md + src/content/writing/<slug>/* assets not supported.
  // (No-op here on purpose.)

  console.log(`[sync:assets] Synced assets for ${postDirs.length} post folders -> public/writing/`);
}

await main();
