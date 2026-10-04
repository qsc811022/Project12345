import { el, ko, mixedText, button, link, announce, progressBar } from './dom.js';
import { speakButton } from '../speech.js';
export function favoriteButton(word, store, onChange) {
  const node = button('', () => { store.toggle('favoriteWordIds', word.id); update(); announce(store.state.favoriteWordIds.includes(word.id) ? '已收藏單字' : '已取消收藏'); onChange?.(); }, true);
  node.classList.add('small', 'favorite');
  function update() { const active = store.state.favoriteWordIds.includes(word.id); node.textContent = active ? '★ 已收藏' : '☆ 收藏'; node.setAttribute('aria-pressed', String(active)); node.setAttribute('aria-label', `${active ? '取消收藏' : '收藏'} ${word.korean}`); }
  update(); return node;
}
export function vocabularyCard(word, store, onChange) {
  return el('article', { class: 'card vocabulary-card' }, el('p', { class: 'eyebrow' }, 'VOCABULARY'), ko(word.korean, 'h2'), el('p', { class: 'meaning' }, word.meaningZh), el('div', { class: 'example-block' }, ko(word.exampleKo, 'p'), el('p', { class: 'muted' }, word.exampleZh)), el('div', { class: 'actions' }, speakButton(word.korean), favoriteButton(word, store, onChange)));
}
export function sentenceCard(sentence) {
  return el('article', { class: 'card sentence-card' }, el('div', { class: 'card-top' }, el('span', { class: 'number' }, sentence.situation), el('span', { class: 'badge' }, mixedText(sentence.politeness))), ko(sentence.korean, 'h2'), el('p', { class: 'translation' }, sentence.translationZh), el('p', { class: 'muted' }, mixedText(sentence.explanation)), speakButton(sentence.korean));
}
export function grammarCard(grammar, store) {
  const read = store.state.readGrammarIds.includes(grammar.id);
  return el('a', { class: 'card grammar-card', href: `#/grammar/${grammar.id}` }, el('span', { class: 'category' }, grammar.category), read && el('span', { class: 'read-mark' }, el('span', { 'aria-hidden': 'true' }, '✓'), el('span', { class: 'sr-only' }, '已讀')), ko(grammar.titleKo, 'h3'), el('p', {}, grammar.meaningZh));
}
export function completeControl(id, store, grammar = false) {
  const key = grammar ? 'readGrammarIds' : 'completedLessonIds';
  const control = button('', () => { store.toggle(key, id); update(); announce(store.state[key].includes(id) ? grammar ? '已標記文法為已讀' : '已標記單元完成' : '已取消標記'); });
  const update = () => { const done = store.state[key].includes(id); control.classList.toggle('done', done); control.textContent = done ? '✓ 已' + (grammar ? '讀' : '完成') + ' · 點擊取消' : '○ 標記為已' + (grammar ? '讀' : '完成'); control.setAttribute('aria-pressed', String(done)); };
  update();
  return el('div', { class: 'lesson-end' }, el('p', { class: 'muted' }, grammar ? '讀懂這則文法了嗎？已讀紀錄會獨立保存。' : '依自己的步調學習，讀完後留下今天的一小步。'), el('div', { class: 'actions' }, control, !grammar && link('練習測驗 →', '#/quiz', true)));
}
export function infoCard() {
  return el('div', { class: 'card info-card' }, el('div', {}, el('p', { class: 'eyebrow' }, '教材設計'), el('div', { class: 'info-profile' }, ko('한', 'span', { class: 'info-icon', 'aria-hidden': 'true' }), el('div', {}, el('h3', {}, '為第一步，準備好的教材。'), el('p', { class: 'muted' }, '以繁體中文解說，', el('br'), '從字母、單字到生活中的句型。')))), el('div', { class: 'info-guide' }, el('p', { class: 'eyebrow' }, 'LEARNING GUIDE'), el('h3', {}, '慢慢學，也能走得很遠。'), el('p', { class: 'muted' }, '認識本站的學習方式與教材規劃。'), link('查看說明 →', '#/about', true)));
}
export const COURSES = [
  { kind: 'alphabet', title: '韓文字母入門', time: 32, art: ['ㄱ', 'ㅏ', '가'], style: '', description: '從字母形狀，到讀出第一個音節。' },
  { kind: 'vocabulary', title: '日常單字', time: 80, art: ['사과', '커피'], style: 'words', description: '五個生活主題，累積你的常用詞。' },
  { kind: 'sentences', title: '基礎句型', time: 25, art: ['안녕하세요?'], style: 'sentences', description: '把認識的單字，放進真實對話。' }
];
export function courseCard(course, data, store) {
  const units = data[course.kind];
  const done = units.filter(u => store.state.completedLessonIds.includes(u.id)).length;
  const closed = course.available === false;
  const status = closed ? '即將推出' : done === units.length ? '已完成' : done ? '學習中' : '開放中';
  const next = units.find(u => !store.state.completedLessonIds.includes(u.id)) || units[0];
  return el('article', { class: 'card course-card' }, el('div', { class: `course-art ${course.style}`, 'aria-hidden': 'true' }, course.art.map(value => ko(value))), el('div', { class: 'course-body' }, el('div', { class: 'card-top' }, el('h3', {}, course.title), el('span', { class: `badge ${done === units.length ? 'complete' : ''}` }, status)), el('p', { class: 'meta' }, `零基礎 · 約 ${course.time} 分鐘 · ${units.length} 個單元`), el('p', { class: 'muted' }, course.description), progressBar(done, units.length, '單元完成'), !closed && link(done === units.length ? '再次複習 ↗' : done ? '繼續學習 ↗' : '開始學習 ↗', `#/${course.kind}/${next.id}`, true)));
}
