// Cmd/Ctrl+K Quick Search (Pagefind UI)
// This module is loaded site-wide (cached) while Pagefind UI assets are loaded lazily on first open.

const dialog = document.getElementById('quick-search');
const rootSelector = '#quick-search-root';
const closeBtn = dialog?.querySelector('.quick-search__close');

const BASE_URL = (document.body?.dataset?.baseUrl || '/').trim();

let initPromise = null;

function isMac() {
  const platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.platform ||
    navigator.userAgent ||
    '';
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

function ensurePagefindUI() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // CSS
    const cssHref = `${BASE_URL}pagefind/pagefind-ui.css`;
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }

    // JS (non-ESM)
    const uiUrl = `${BASE_URL}pagefind/pagefind-ui.js`;
    if (!window.PagefindUI) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = uiUrl;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${uiUrl}`));
        document.head.appendChild(s);
      });
    }

    const UI = window.PagefindUI;
    if (!UI) throw new Error('PagefindUI not found on window after loading script');

    const mount = document.querySelector(rootSelector);
    if (!mount) return;
    mount.textContent = '';

    new UI({
      element: rootSelector,
      showSubResults: true,
    });
  })();

  return initPromise;
}

async function openQuickSearch() {
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();

  try {
    await ensurePagefindUI();
    const input = dialog.querySelector('.pagefind-ui__search-input');
    input?.focus();
  } catch (e) {
    console.error('[quick-search] init failed', e);
  }
}

function closeQuickSearch() {
  if (!dialog) return;
  if (dialog.open) dialog.close();
}

// Global hotkeys

document.addEventListener('keydown', (e) => {
  const key = e.key?.toLowerCase();
  const want = key === 'k' && (e.metaKey || e.ctrlKey);
  if (want) {
    e.preventDefault();
    openQuickSearch();
  }
  if (key === 'escape' && dialog?.open) {
    closeQuickSearch();
  }
});

closeBtn?.addEventListener('click', closeQuickSearch);
dialog?.addEventListener('click', (e) => {
  // click backdrop to close
  if (e.target === dialog) closeQuickSearch();
});

// Platform hint
const hint = dialog?.querySelector('.quick-search__hint');
if (hint) hint.textContent = `${isMac() ? 'Cmd' : 'Ctrl'}+K · Esc 关闭`;
