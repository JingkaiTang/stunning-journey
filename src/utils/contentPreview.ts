export function pickFirstImageFromMarkdown(md: string): string | null {
  // Markdown image: ![alt](url "title")
  const m1 = md.match(/!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/);
  if (m1?.[1]) return m1[1];

  // HTML image: <img src="...">
  const m2 = md.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (m2?.[1]) return m2[1];

  return null;
}

export function pickCover(input: { data: { cover?: string | undefined }; body: string }): string | null {
  const raw = input.data.cover ?? pickFirstImageFromMarkdown(input.body);
  return raw && raw.trim().length ? raw.trim() : null;
}

export function resolveMaybeRelativeUrl(url: string, basePath: string): string {
  // If it's already absolute (or root-absolute), keep it.
  if (/^(https?:)?\/\//.test(url) || url.startsWith('/') || url.startsWith('data:')) return url;

  // Resolve relative to a base path like "/writing/<slug>/".
  // Use a dummy origin for URL resolution.
  return new URL(url, `https://example.com${basePath}`).pathname;
}
