#!/usr/bin/env node
// @ts-nocheck

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

function hr(title) {
  console.log(`\n=== ${title} ===`);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes;
  let idx = -1;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx++;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[idx]}`;
}

async function listFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFiles(p)));
      continue;
    }
    if (e.isFile()) {
      const stat = await fs.stat(p);
      out.push({ path: p, size: stat.size });
    }
  }
  return out;
}

async function fileSize(p) {
  const stat = await fs.stat(p);
  return stat.size;
}

async function printFileSize(label, p) {
  if (!(await exists(p))) {
    console.log(`${label}: not found (${path.relative(ROOT, p)})`);
    return;
  }
  const size = await fileSize(p);
  const raw = await fs.readFile(p);
  const gz = zlib.gzipSync(raw).length;
  console.log(`${label}: ${formatBytes(size)} (${size} bytes)`);
  console.log(`${label} (gzip): ${formatBytes(gz)} (${gz} bytes)`);
}

function printTop(title, files, topN) {
  hr(title);
  const rows = files
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, topN)
    .map((f) => `${formatBytes(f.size)}\t${path.relative(ROOT, f.path)}`);
  console.log(rows.join('\n'));
}

try {
  hr('Build');
  execSync('npm run build', { stdio: 'inherit' });

  hr('dist total');
  if (!(await exists(DIST_DIR))) {
    console.log('dist/ not found');
    process.exit(1);
  }

  const distFiles = await listFiles(DIST_DIR);
  const total = distFiles.reduce((sum, f) => sum + f.size, 0);
  console.log(`${formatBytes(total)} (${total} bytes)`);

  printTop('largest files (dist)', distFiles, 25);

  hr('styles.css size (raw/gzip)');
  await printFileSize('styles.css', path.join(DIST_DIR, 'styles.css'));

  hr('quick-search module size (raw/gzip)');
  await printFileSize('quick-search.mjs', path.join(DIST_DIR, 'quick-search.mjs'));

  hr('pagefind assets size (raw)');
  const pagefindDir = path.join(DIST_DIR, 'pagefind');
  if (await exists(pagefindDir)) {
    const pagefindFiles = await listFiles(pagefindDir);
    const pagefindTotal = pagefindFiles.reduce((sum, f) => sum + f.size, 0);
    console.log(`${formatBytes(pagefindTotal)} (${pagefindTotal} bytes)`);
    printTop('largest files (pagefind)', pagefindFiles, 15);
  } else {
    console.log('dist/pagefind not found');
  }
} catch (e) {
  console.error('\n[audit-size] failed');
  console.error(e?.message ?? e);
  process.exit(1);
}
