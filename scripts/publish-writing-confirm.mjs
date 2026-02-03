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
const message = args.message && args.message !== 'true' ? args.message : null;

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

const postDir = `src/content/writing/${slug}`;
const postPath = `${postDir}/index.md`;
if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(2);
}

// Must be clean; we will modify + commit directly to main.
const porcelain = shOut('git', ['status', '--porcelain']);
if (porcelain) {
  console.error('Working tree not clean. Commit/stash your changes first.');
  process.exit(2);
}

let md = fs.readFileSync(postPath, 'utf8');
const isDraft = /\n\s*draft:\s*true\s*\n/i.test(md);
if (!isDraft) {
  console.error('Post is already draft:false (or missing draft flag). This command is only for confirming publish from draft:true -> draft:false.');
  process.exit(2);
}

// Flip to draft:false
md = md.replace(/\n\s*draft:\s*true\s*\n/i, '\n\ndraft: false\n');
fs.writeFileSync(postPath, md, 'utf8');

sh('git', ['checkout', 'main']);
sh('git', ['pull', '--ff-only', 'origin', 'main']);

// Verify build still works
sh('npm', ['run', 'build']);

sh('git', ['add', postDir]);

const msg = message
  ? message
  : title
    ? `Writing: ${title}`
    : `Writing: ${slug}`;

sh('git', ['commit', '-m', msg]);
sh('git', ['push', `ssh://git@ssh.github.com:443/${repo}.git`, 'main']);

console.log(`Published Writing: /writing/${slug}/`);
