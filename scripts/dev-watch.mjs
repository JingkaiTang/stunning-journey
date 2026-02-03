import { spawn } from 'node:child_process';
import chokidar from 'chokidar';

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
}

// Start Astro dev server
const dev = run('npm', ['run', 'dev'], { env: process.env });

const watcher = chokidar.watch(['src/content/writing/**/*', 'src/content/now/**/*'], {
  ignoreInitial: true,
});

let timer = null;
let syncRunning = false;
let syncPending = false;

function startSync() {
  if (!syncPending || syncRunning) return;
  syncPending = false;
  syncRunning = true;
  const child = run('npm', ['run', 'sync:assets'], { env: process.env });
  child.on('exit', () => {
    syncRunning = false;
    if (syncPending) startSync();
  });
}

function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    syncPending = true;
    startSync();
  }, 150);
}

watcher
  .on('add', scheduleSync)
  .on('change', scheduleSync)
  .on('unlink', scheduleSync)
  .on('addDir', scheduleSync)
  .on('unlinkDir', scheduleSync);

process.on('SIGINT', () => {
  watcher.close().catch(() => {});
  dev.kill('SIGINT');
  process.exit(0);
});
