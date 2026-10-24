import { el, ko, button, link, progressBar } from './dom.js';
import { favoriteButton, vocabularyCard } from './learning.js';
import { speakButton } from '../speech.js';

export function wordPractice(words, store) {
  const root = el('section', { class: 'word-practice', 'aria-label': '每次五字練習' });
  let start = 0;
  let index = 0;
  let revealed = false;
  let review = [];
  let round = words.slice(0, 5);
  function draw(focus = false) {
    if (index === round.length) {
      root.replaceChildren(el('p', { class: 'eyebrow' }, '小任務完成'), el('h2', { tabindex: '-1' }, '又多認識幾個韓文了！'),
        el('p', { role: 'status' }, `這輪練習 ${round.length} 字，${review.length} 字想再複習。練習不會自動標記整個單元完成。`),
        el('div', { class: 'actions' }, review.length > 0 && button('複習還不熟的字', () => { round = [...review]; review = []; index = 0; revealed = false; draw(true); }),
          button(start + 5 < words.length ? '繼續下一組 5 字 →' : '從第一組再練習', () => { start = start + 5 < words.length ? start + 5 : 0; round = words.slice(start, start + 5); review = []; index = 0; revealed = false; draw(true); }, true),
          link('到競技場挑戰 10 題 →', '#/quiz', true)));
    } else {
      const word = round[index];
      const answer = el('div', { class: 'flash-answer', id: 'flash-answer', hidden: !revealed }, el('p', { class: 'meaning' }, word.meaningZh), el('div', { class: 'example-block' }, ko(word.exampleKo, 'p'), el('p', { class: 'muted' }, word.exampleZh)));
      const flip = button('查看中文與例句', () => {
        revealed = true; answer.hidden = false; flip.hidden = true; ratings.hidden = false;
        ratings.querySelector('button').focus();
      });
      flip.setAttribute('aria-controls', 'flash-answer');
      const rate = again => { if (again) review.push(word); index++; revealed = false; draw(true); };
      const ratings = el('div', { class: 'actions flash-ratings', hidden: !revealed }, button('還不熟，再練一次', () => rate(true), true), button('記住了，下一字 →', () => rate(false)));
      root.replaceChildren(el('p', { class: 'eyebrow' }, '每次 5 字 · 不限時間'), progressBar(index, round.length, '本輪練習'),
        el('h2', { class: 'flash-word', lang: 'ko', tabindex: '-1' }, word.korean), el('p', { class: 'muted' }, '先聽發音、想想意思，再打開中文。'),
        el('div', { class: 'actions flash-tools' }, speakButton(word.korean), favoriteButton(word, store)), answer, flip, ratings);
    }
    if (focus) root.querySelector('h2').focus({ preventScroll: true });
  }
  draw(); return root;
}

export function wordLibrary(topics, store) {
  const root = el('div', { class: 'word-library' });
  const content = el('div', { class: 'grid' });
  const status = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });
  let selected = 'all'; let page = 0;
  const search = el('input', { id: 'word-search', type: 'search', placeholder: '試試「謝謝」或「감사」', autocomplete: 'off' });
  const favorites = el('input', { type: 'checkbox' });
  const filters = el('div', { class: 'filters', role: 'group', 'aria-label': '單字主題篩選' });
  const pager = el('div', { class: 'actions word-pager' });
  function draw() {
    const query = search.value.trim().normalize('NFC').toLocaleLowerCase();
    const words = topics.filter(t => selected === 'all' || t.id === selected).flatMap(t => t.words).filter(w =>
      (!favorites.checked || store.state.favoriteWordIds.includes(w.id)) && [w.korean, w.meaningZh, w.exampleKo, w.exampleZh].some(text => text.normalize('NFC').toLocaleLowerCase().includes(query)));
    const pages = Math.max(1, Math.ceil(words.length / 12)); page = Math.min(page, pages - 1);
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === selected)));
    status.textContent = `找到 ${words.length} 個單字${words.length ? ` · 第 ${page + 1} / ${pages} 頁` : '，換個關鍵字或取消篩選試試。'}`;
    content.replaceChildren(...words.slice(page * 12, page * 12 + 12).map(w => vocabularyCard(w, store, () => { if (favorites.checked) draw(); })));
    const move = delta => { page += delta; draw(); status.tabIndex = -1; status.focus(); };
    const prev = button('← 上一頁', () => move(-1), true); prev.disabled = page === 0;
    const next = button('下一頁 →', () => move(1), true); next.disabled = page >= pages - 1;
    pager.replaceChildren(prev, el('span', {}, `${page + 1} / ${pages}`), next); pager.hidden = !words.length;
  }
  search.addEventListener('input', () => { page = 0; draw(); });
  favorites.addEventListener('change', () => { page = 0; draw(); });
  filters.append(...[['all', '全部'], ...topics.map(t => [t.id, t.title])].map(([id, title]) => el('button', { type: 'button', class: 'filter', 'data-filter': id, onClick: () => { selected = id; page = 0; draw(); } }, title)));
  root.append(el('div', { class: 'word-search' }, el('label', { for: 'word-search' }, '搜尋韓文或中文'), search, el('label', { class: 'favorite-filter' }, favorites, '只看收藏')), filters, status, content, pager);
  draw(); return root;
}
