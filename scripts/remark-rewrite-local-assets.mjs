import path from 'node:path';

function normalizeSlugFromFile(filePath) {
  // Expect: .../src/content/writing/<slug>/index.md
  const parts = filePath.split(path.sep);
  const writingIdx = parts.lastIndexOf('writing');
  if (writingIdx >= 0 && parts[parts.length - 1] === 'index.md' && parts.length >= writingIdx + 3) {
    return parts[writingIdx + 1];
  }

  // Fallback: .../src/content/writing/<slug>.md
  const base = path.basename(filePath, path.extname(filePath));
  if (base) return base;

  return null;
}

function isRelativeUrl(url) {
  return typeof url === 'string' && url.length > 0 && !url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('#');
}

export function remarkRewriteLocalAssets() {
  return function transformer(tree, file) {
    const filePath = file?.path ? String(file.path) : '';
    const slug = filePath ? normalizeSlugFromFile(filePath) : null;
    if (!slug) return;

    /** @type {import('unist').Node[]} */
    const stack = [tree];

    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;

      // rewrite markdown images: ![alt](url)
      if (node.type === 'image' && isRelativeUrl(node.url)) {
        node.url = `/writing/${slug}/${node.url}`;
      }

      // rewrite links that look like local assets too
      if (node.type === 'link' && isRelativeUrl(node.url)) {
        // Don't rewrite links to other pages like ../something (we only rewrite same-folder files)
        if (!node.url.startsWith('../') && !node.url.startsWith('./')) {
          node.url = `/writing/${slug}/${node.url}`;
        }
      }

      const children = node.children;
      if (Array.isArray(children)) {
        for (const c of children) stack.push(c);
      }
    }
  };
}
