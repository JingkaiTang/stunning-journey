// @ts-check
import { defineConfig } from 'astro/config';
import { remarkRewriteLocalAssets } from './scripts/remark-rewrite-local-assets.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://jingkaitang.github.io',
  markdown: {
    remarkPlugins: [remarkRewriteLocalAssets],
  },
});
