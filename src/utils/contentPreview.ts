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
  return input.data.cover ?? pickFirstImageFromMarkdown(input.body);
}
