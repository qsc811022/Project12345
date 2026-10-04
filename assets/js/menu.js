import { el } from './components/dom.js';
export const NAV = [['home', '首頁'], ['alphabet', '韓文字母'], ['vocabulary', '主題單字'], ['sentences', '基礎句型'], ['grammar', '文法索引'], ['quiz', '測驗'], ['progress', '我的學習'], ['about', '關於教材']];
export function initMenu() {
  const dialog = document.getElementById('mobile-menu');
  const toggle = document.getElementById('menu-toggle');
  for (const navId of ['desktop-nav', 'mobile-nav']) document.getElementById(navId).replaceChildren(...NAV.map(([path, label]) => el('a', { href: `#/${path}`, class: 'nav-link' }, label)));
  function close() { if (!dialog.open) return; dialog.close(); document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  toggle.addEventListener('click', () => { dialog.showModal(); document.body.classList.add('menu-open'); toggle.setAttribute('aria-expanded', 'true'); dialog.querySelector('a').focus(); });
  document.getElementById('menu-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => {
    if (event.target.closest('a')) close();
    else if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) close(); }
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const nodes = [...dialog.querySelectorAll('a, button')]; const first = nodes[0]; const last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  matchMedia('(min-width: 1024px)').addEventListener('change', event => { if (event.matches) close(); });
  return { close, update(path) { document.querySelectorAll('.nav-link').forEach(a => { if (a.hash === `#/${path}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); } };
}
