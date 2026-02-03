import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoWithOffset(dateStr, hh, mm, ss) {
  // dateStr: YYYY-MM-DD
  return `${dateStr}T${pad2(hh)}:${pad2(mm)}:${pad2(ss)}+08:00`;
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

const args = parseArgs(process.argv);
const dry = args.dry === 'true' || args['dry-run'] === 'true';

const collections = [
  { name: 'writing', dir: path.join(ROOT, 'src', 'content', 'writing') },
];

for (const c of collections) {
  const files = fs
    .readdirSync(c.dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(c.dir, d.name, 'index.md'))
    .filter((p) => fs.existsSync(p));

  // group by YYYY-MM-DD
  const byDay = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) continue;
    const fm = m[1];

    // match pubDate: 2026-02-01 OR pubDate: "2026-02-01"
    const pm = fm.match(/^pubDate:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$/m);
    if (!pm) continue;
    const dateStr = pm[1];

    // skip if already has time in raw (T)
    if (fm.includes('pubDate:') && fm.match(/^pubDate:\s*"?\d{4}-\d{2}-\d{2}T/m)) {
      continue;
    }

    if (!byDay.has(dateStr)) byDay.set(dateStr, []);
    byDay.get(dateStr).push({ file, raw, fm, dateStr });
  }

  for (const [dateStr, items] of byDay.entries()) {
    // deterministic order: by slug folder name
    items.sort((a, b) => a.file.localeCompare(b.file));

    // allocate times within the day: 12:00:00 + i*5 minutes
    items.forEach((it, idx) => {
      const baseMinutes = 12 * 60;
      const minutes = baseMinutes + idx * 5;
      const hh = Math.floor(minutes / 60);
      const mm = minutes % 60;
      const ss = idx % 60;
      const newPub = isoWithOffset(dateStr, hh, mm, ss);

      const nextFm = it.fm.replace(
        /^pubDate:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$/m,
        `pubDate: ${JSON.stringify(newPub)}`
      );

      const head = it.raw.match(/^---\n([\s\S]*?)\n---\n?/)[0];
      const rest = it.raw.slice(head.length);
      const next = `---\n${nextFm}\n---\n${rest}`;

      const rel = path.relative(ROOT, it.file);
      if (dry) {
        console.log(`[dry] ${rel}: pubDate ${dateStr} -> ${newPub}`);
      } else {
        fs.writeFileSync(it.file, next, 'utf8');
        console.log(`${rel}: pubDate ${dateStr} -> ${newPub}`);
      }
    });
  }
}

if (dry) {
  console.log('\nDone (dry-run). Re-run without --dry to write files.');
}
