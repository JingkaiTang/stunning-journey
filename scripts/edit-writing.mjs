import fs from 'node:fs';

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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoShanghai(date = new Date()) {
  // Return ISO-ish with +08:00 offset, second precision
  const utcMs = date.getTime();
  const shMs = utcMs + 8 * 60 * 60 * 1000;
  const d = new Date(shMs);
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+08:00`;
}

function upsertUpdatedDate(frontmatter) {
  const updated = `updatedDate: ${JSON.stringify(isoShanghai(new Date()))}`;

  // Replace if exists
  if (/^updatedDate:\s*.+$/m.test(frontmatter)) {
    return frontmatter.replace(/^updatedDate:\s*.+$/m, updated);
  }

  // Insert after pubDate if present, otherwise before tags
  if (/^pubDate:\s*.+$/m.test(frontmatter)) {
    return frontmatter.replace(/^pubDate:\s*.+$/m, (m) => `${m}\n${updated}`);
  }

  if (/^tags:\s*/m.test(frontmatter)) {
    return frontmatter.replace(/^tags:\s*/m, `${updated}\n$&`);
  }

  // Fallback: append at end
  return frontmatter.trimEnd() + `\n${updated}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const slug = args.slug && args.slug !== 'true' ? args.slug : null;

  if (!slug) {
    console.error('Missing --slug <slug>.');
    process.exit(2);
  }

  const postPath = `src/content/writing/${slug}/index.md`;
  if (!fs.existsSync(postPath)) {
    console.error(`Writing not found: ${postPath}`);
    process.exit(2);
  }

  const raw = fs.readFileSync(postPath, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) {
    console.error('Frontmatter not found (expected --- ... ---).');
    process.exit(2);
  }

  const fm = m[1];
  const rest = raw.slice(m[0].length);

  const nextFm = upsertUpdatedDate(fm);
  const next = `---\n${nextFm}\n---\n${rest}`;

  fs.writeFileSync(postPath, next, 'utf8');
  console.log(`Updated updatedDate: ${postPath}`);
}

main();
