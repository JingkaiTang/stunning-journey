import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  }
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

const repo = 'JingkaiTang/JingkaiTang.github.io';
const args = parseArgs(process.argv);

const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const title = args.title && args.title !== 'true' ? args.title : null;
const draftOk = args.draftOk === 'true' || args['draft-ok'] === 'true';

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

const branch = `feat/post-${slug}`;

// Ensure clean working tree
const porcelain = shOut('git', ['status', '--porcelain']);
if (porcelain) {
  console.error('Working tree not clean. Commit/stash your changes first.');
  process.exit(2);
}

// Verify post exists
const postPath = `src/content/writing/${slug}/index.md`;
if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(2);
}

// Optional: ensure not draft
if (!draftOk) {
  const t = fs.readFileSync(postPath, 'utf8');
  const isDraft = /\n\s*draft:\s*true\s*\n/i.test(t);
  if (isDraft) {
    console.error('Post is still draft:true. Pass --draft-ok to override.');
    process.exit(2);
  }
}

sh('git', ['fetch', 'origin', 'main']);
sh('git', ['checkout', '-b', branch, 'origin/main']);

// Make sure assets are synced + build works before publishing
sh('npm', ['run', 'build']);

sh('git', ['add', postPath]);
// also add any assets under the folder
sh('git', ['add', `src/content/writing/${slug}/`]);

const msg = title ? `Writing: ${title}` : `Writing: ${slug}`;
sh('git', ['commit', '-m', msg]);

// Push using ssh over 443 (port 22 may be blocked)
sh('git', [
  'push',
  '-u',
  `ssh://git@ssh.github.com:443/${repo}.git`,
  branch,
]);

// Create PR
const prTitle = title ? title : `Writing: ${slug}`;
const body = `Auto-published by scripts/publish-writing.mjs\n\n- slug: ${slug}\n- build: npm run build (includes sync:assets + pagefind)`;

sh('gh', [
  'pr',
  'create',
  '--repo',
  repo,
  '--head',
  branch,
  '--base',
  'main',
  '--title',
  prTitle,
  '--body',
  body,
]);
