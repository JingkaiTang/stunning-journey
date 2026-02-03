import { spawnSync } from 'node:child_process';

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  }
  return String(r.stdout).trim();
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
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

const workflow = args.workflow && args.workflow !== 'true' ? args.workflow : 'pages.yml';
const branch = args.branch && args.branch !== 'true' ? args.branch : 'main';
const wait = args.wait === 'true' || args.w === 'true';

// main HEAD sha
const headSha = shOut('gh', ['api', `repos/${repo}/commits/${branch}`, '--jq', '.sha']);

// latest workflow run head sha
const latest = shOut('gh', [
  'api',
  `repos/${repo}/actions/workflows/${workflow}/runs?branch=${branch}&per_page=1`,
  '--jq',
  '.workflow_runs[0] | {id, head_sha, status, conclusion, html_url}',
]);

let latestJson;
try {
  latestJson = JSON.parse(latest);
} catch {
  latestJson = null;
}

const latestSha = latestJson?.head_sha;
const latestId = latestJson?.id;

if (latestSha === headSha) {
  console.log(`[ensure-pages-deploy] OK: latest workflow run already matches ${branch}@${headSha}`);
  if (latestId) console.log(`[ensure-pages-deploy] run: ${latestJson.html_url ?? `https://github.com/${repo}/actions/runs/${latestId}`}`);
  process.exit(0);
}

console.log(`[ensure-pages-deploy] MISMATCH: ${branch}@${headSha} is not deployed by latest run (latest head_sha=${latestSha ?? 'null'})`);
console.log('[ensure-pages-deploy] Triggering workflow_dispatch to deploy latest main...');

sh('gh', ['workflow', 'run', 'Deploy to GitHub Pages', '--repo', repo, '--ref', branch]);

// Try to fetch the newest run id
try {
  const newId = shOut('gh', [
    'api',
    `repos/${repo}/actions/workflows/${workflow}/runs?branch=${branch}&per_page=1`,
    '--jq',
    '.workflow_runs[0].id',
  ]);
  console.log(`[ensure-pages-deploy] triggered run: https://github.com/${repo}/actions/runs/${newId}`);
  if (wait) {
    sh('gh', ['run', 'watch', String(newId), '--repo', repo]);
  }
} catch (e) {
  console.log('[ensure-pages-deploy] triggered, but failed to fetch run id (non-fatal).');
}
