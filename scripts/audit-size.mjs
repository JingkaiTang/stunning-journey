#!/usr/bin/env node
// @ts-check

import { execSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trimEnd();
}

function hr(title) {
  console.log(`\n=== ${title} ===`);
}

try {
  hr('Build');
  execSync('npm run build', { stdio: 'inherit' });

  hr('dist total');
  console.log(sh('du -sh dist'));

  hr('largest files (dist)');
  // show top 25 by size
  console.log(sh("du -ah dist | sort -hr | head -n 25"));

  hr('styles.css size (raw/gzip)');
  console.log(sh("ls -lh dist/styles.css"));
  console.log(sh("gzip -c dist/styles.css | wc -c | awk '{print $1 " + '" bytes"' + "}'"));

  hr('quick-search module size (raw/gzip)');
  if (sh("test -f dist/quick-search.mjs && echo yes || echo no").includes('yes')) {
    console.log(sh('ls -lh dist/quick-search.mjs'));
    console.log(sh("gzip -c dist/quick-search.mjs | wc -c | awk '{print $1 " + '" bytes"' + "}'"));
  } else {
    console.log('dist/quick-search.mjs not found (expected for static output? check build config)');
  }

  hr('pagefind assets size (raw)');
  if (sh("test -d dist/pagefind && echo yes || echo no").includes('yes')) {
    console.log(sh("du -sh dist/pagefind"));
    console.log(sh("du -ah dist/pagefind | sort -hr | head -n 15"));
  } else {
    console.log('dist/pagefind not found');
  }
} catch (e) {
  console.error('\n[audit-size] failed');
  console.error(e?.message ?? e);
  process.exit(1);
}
