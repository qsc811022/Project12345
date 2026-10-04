export function parseRoute(hash) {
  const value = hash || '#/home';
  const match = /^#\/([a-z]+)(?:\/([a-z0-9-]+))?$/.exec(value);
  return match ? { page: match[1], id: match[2] || null } : { page: 'not-found', id: null };
}
export function createRouter(render, canLeave) {
  let acceptedHash = location.hash || '#/home';
  let acceptedIndex = 0;
  let pending = false;
  let restoring = false;
  history.replaceState({ routeIndex: 0 }, '', acceptedHash);
  function commit(hash, index) { acceptedHash = hash; acceptedIndex = index; render(parseRoute(hash)); }
  async function navigate(hash) {
    if (pending || hash === acceptedHash) return;
    pending = true;
    try { if (await canLeave()) { history.pushState({ routeIndex: acceptedIndex + 1 }, '', hash); commit(hash, acceptedIndex + 1); } }
    finally { pending = false; }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', async () => {
    if (restoring) { restoring = false; return; }
    const nextHash = location.hash || '#/home';
    if (nextHash === acceptedHash) return;
    if (pending) { history.replaceState({ routeIndex: acceptedIndex }, '', acceptedHash); return; }
    const nextIndex = Number.isInteger(history.state?.routeIndex) ? history.state.routeIndex : acceptedIndex + 1;
    if (!Number.isInteger(history.state?.routeIndex)) history.replaceState({ routeIndex: nextIndex }, '', nextHash);
    pending = true;
    try {
      if (await canLeave()) commit(nextHash, nextIndex);
      else { const delta = acceptedIndex - nextIndex; if (delta) { restoring = true; history.go(delta); } else history.replaceState({ routeIndex: acceptedIndex }, '', acceptedHash); }
    } finally { pending = false; }
  });
  commit(acceptedHash, acceptedIndex);
  return { navigate, refresh: () => render(parseRoute(acceptedHash)) };
}
