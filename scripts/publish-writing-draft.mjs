import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
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

const repo = 'JingkaiTang/JingkaiTang.github.io';
const args = parseArgs(process.argv);

const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const title = args.title && args.title !== 'true' ? args.title : null;

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

// Verify post exists
const postDir = `src/content/writing/${slug}`;
const postPath = `${postDir}/index.md`;
if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(2);
}

// Must be clean; we will commit directly to main.
const porcelain = shOut('git', ['status', '--porcelain']);
if (porcelain) {
  console.error('Working tree not clean. Commit/stash your changes first.');
  process.exit(2);
}

// Ensure draft:true (draft stage)
const md = fs.readFileSync(postPath, 'utf8');
const isDraft = /\n\s*draft:\s*true\s*\n/i.test(md);
if (!isDraft) {
  console.error('This command is for draft stage only. Set draft:true first (final publish must be confirmed manually).');
  process.exit(2);
}

sh('git', ['checkout', 'main']);
sh('git', ['pull', '--ff-only', 'origin', 'main']);

// Make sure build works before publishing
sh('npm', ['run', 'build']);

sh('git', ['add', postDir]);

const msg = title ? `Draft: ${title}` : `Draft: ${slug}`;
sh('git', ['commit', '-m', msg]);

// Push main using ssh over 443
sh('git', ['push', `ssh://git@ssh.github.com:443/${repo}.git`, 'main']);

// Ensure Pages deploy catches up (GitHub Actions may occasionally miss/delay pushes)
sh('node', ['scripts/ensure-pages-deploy.mjs', '--workflow', 'pages.yml', '--branch', 'main']);

console.log(`Draft published (hidden from feed): /writing/${slug}/`);
