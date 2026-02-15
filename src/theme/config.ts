export type ThemeNavItem = {
  href: string;
  label: string;
  external?: boolean;
};

export const THEME_BRAND = 'JINGKAI//TANG';

export const THEME_NAV_ITEMS: ThemeNavItem[] = [
  { href: '/writing', label: '文章' },
  { href: '/now', label: 'Now' },
  { href: '/tags/ai/', label: 'AI' },
  { href: '/tags/game/', label: '游戏' },
  { href: '/tags/life/', label: '生活' },
  { href: '/search', label: 'Search' },
  { href: '/rss.xml', label: 'RSS' },
  { href: 'https://github.com/JingkaiTang', label: 'GitHub', external: true },
];
