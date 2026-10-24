import { el, ko, mixedText, hero, link, progressBar } from '../components/dom.js';
import { completeControl, vocabularyCard, sentenceCard, grammarCard } from '../components/learning.js';
import { speakButton, speechNote } from '../speech.js';
import { wordPractice, wordLibrary } from '../components/word-practice.js';
const pageInfo = {
  alphabet: ['第一步：認識韓文字母', '韓文字母怎麼讀？', '建議從第一單元開始。先看字形與說明，再按「朗讀」聽發音。讀完單元後，按下「標記為已完成」記錄進度。', ['ㄱ ㄴ ㄷ', 'ㅏ ㅓ ㅗ', 'ㄲ ㅘ ㅢ', 'ㅎ + ㅏ + ㄴ', '받침']],
  vocabulary: ['第二步：累積生活單字', '選一個主題，開始練單字', '點選下方主題，每次翻卡練習 5 個字。也可以往下搜尋單字，把想複習的內容收藏起來。', ['안녕', '밥', '오늘', '여행', '일상']],
  sentences: ['把單字用在對話裡', '這些情境，韓文怎麼說？', '選擇打招呼、自我介紹、點餐、購物或問路。每個句型都有中文翻譯、使用情境和朗讀按鈕。', ['안녕', '저는', '주세요', '얼마', '어디']]
};
export function lessonPage(ctx, kind, id) {
  const { data, store } = ctx;
  const [eyebrow, title, description, symbols] = pageInfo[kind];
  if (id) {
    const unit = data[kind].find(u => u.id === id);
    if (!unit) return null;
    store.visit(id);
    const body = el('section', { class: 'section' }, el('a', { class: 'back-link', href: `#/${kind}` }, '← 返回單元列表'), speechNote());
    if (kind === 'alphabet') body.append(el('div', { class: 'letter-grid' }, unit.items.map(item => el('article', { class: 'card letter-card' }, el('span', { class: 'badge' }, item.type), ko(item.character, 'h2'), el('p', { class: 'explanation' }, mixedText(item.explanation)), el('p', { class: 'example' }, mixedText(item.example)), speakButton(item.example.split('（')[0].split(' → ')[0])))));
    if (kind === 'vocabulary') body.append(wordPractice(unit.words, store), el('h2', { class: 'section-title' }, '本單元單字庫'), el('p', { class: 'muted' }, '練習後可以搜尋、收藏單字；學完整個主題，再到頁面下方標記完成。'), wordLibrary([unit], store));
    if (kind === 'sentences') body.append(el('div', { class: 'stack' }, unit.sentences.map(sentenceCard)));
    body.append(completeControl(id, store));
    const units = data[kind]; const next = units[units.indexOf(unit) + 1];
    if (next) body.append(el('div', { class: 'lesson-end' }, link(`下一單元：${next.title} →`, `#/${kind}/${next.id}`, true)));
    return { title: unit.title, nodes: [hero(eyebrow, unit.title, unit.description || description), body] };
  }
  const done = data[kind].filter(u => store.state.completedLessonIds.includes(u.id)).length;
  const body = el('section', { class: 'section' });
  body.append(el('div', { class: 'grid' }, data[kind].map((unit, i) => {
    const complete = store.state.completedLessonIds.includes(unit.id);
    const count = kind === 'alphabet' ? `${unit.items.length} 個學習項目 · ${unit.estimatedMinutes} 分鐘` : kind === 'vocabulary' ? `${unit.words.length} 個單字` : `${unit.sentences.length} 個句型`;
    return el('a', { class: 'card', href: `#/${kind}/${unit.id}` }, el('div', { class: 'card-top' }, el('span', { class: 'number' }, `UNIT 0${i + 1}`), complete && el('span', { class: 'badge complete' }, '✓ 已完成')), ko(symbols[i], 'div', { class: 'lesson-symbol', 'aria-hidden': 'true' }), el('h2', { style: 'font-size:1.25rem' }, unit.title), el('p', { class: 'muted' }, count), el('p', {}, '進入單元 →'));
  })));
  if (kind === 'vocabulary') body.append(el('div', { class: 'lesson-end' }, el('h2', { class: 'section-title' }, '找找想學的單字'), el('p', { class: 'muted' }, '選上方主題，開始每次 5 字練習；也可以在這裡搜尋與收藏。'), speechNote(), wordLibrary(data.vocabulary, store)));
  if (kind === 'sentences') {
    const content = el('div', {}); let selected = 'all';
    const filters = el('div', { class: 'filters', role: 'group', 'aria-label': '教材分類篩選' });
    const filterRows = [['all', '全部'], ...data[kind].map(u => [u.id, u.title])];
    const draw = () => {
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === selected)));
      const units = data[kind].filter(u => selected === 'all' || u.id === selected);
      content.replaceChildren(el('div', { class: kind === 'vocabulary' ? 'grid' : 'stack' }, units.flatMap(u => kind === 'vocabulary' ? u.words.map(w => vocabularyCard(w, store)) : u.sentences.map(sentenceCard))));
    };
    filters.append(...filterRows.map(([value, label]) => el('button', { class: 'filter', type: 'button', 'data-filter': value, 'aria-pressed': value === selected ? 'true' : 'false', onClick: () => { selected = value; draw(); } }, label)));
    body.append(el('div', { class: 'lesson-end' }, el('h2', { class: 'section-title' }, kind === 'vocabulary' ? '單字隨手讀' : '句型隨手讀'), el('p', { class: 'muted' }, '先看看內容，完成紀錄請進入上方對應單元。'), speechNote(), filters, content)); draw();
  }
  return { title: title.replace('，', ''), nodes: [hero(eyebrow, title, description, [progressBar(done, data[kind].length)]), body] };
}
export function grammarPage(ctx, id) {
  const { data, store } = ctx;
  if (id) {
    const grammar = data.grammar.find(g => g.id === id);
    if (!grammar) return null;
    store.visit(id);
    const index = data.grammar.indexOf(grammar);
    return { title: grammar.titleKo, nodes: [hero(`GRAMMAR NOTES / ${String(index + 1).padStart(2, '0')}`, grammar.titleKo, grammar.meaningZh), el('article', { class: 'reading grammar-detail' }, el('a', { class: 'back-link', href: '#/grammar' }, '← 返回文法索引'), el('span', { class: 'badge' }, grammar.category), el('h2', {}, '怎麼接續？'), el('p', {}, mixedText(grammar.attachRule)), el('h2', {}, '什麼時候使用？'), el('p', {}, mixedText(grammar.explanation)), el('h2', {}, '放進句子裡看看'), speechNote(), grammar.examples.map(example => el('div', { class: 'example-block' }, ko(example.ko, 'p'), el('p', { class: 'muted' }, example.zh), speakButton(example.ko))), grammar.note && el('aside', { class: 'notice' }, el('strong', {}, '小提醒　'), mixedText(grammar.note)), completeControl(id, store, true), el('nav', { class: 'grammar-pagination', 'aria-label': '相鄰文法' }, index > 0 && link(`← ${data.grammar[index - 1].titleKo}`, `#/grammar/${data.grammar[index - 1].id}`, true), index < data.grammar.length - 1 && link(`${data.grammar[index + 1].titleKo} →`, `#/grammar/${data.grammar[index + 1].id}`, true)))] };
  }
  const grid = el('div', { class: 'grammar-grid' }); const count = el('p', { class: 'muted', role: 'status' });
  const filters = el('div', { class: 'filters', role: 'group', 'aria-label': '文法分類篩選' });
  const categories = ['全部', ...new Set(data.grammar.map(g => g.category))];
  function filter(category) {
    const items = data.grammar.filter(g => category === '全部' || g.category === category);
    grid.replaceChildren(...items.map(g => grammarCard(g, store))); count.textContent = `共 ${items.length} 則文法 · 已讀 ${items.filter(g => store.state.readGrammarIds.includes(g.id)).length} 則`;
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === category)));
  }
  filters.append(...categories.map(category => el('button', { class: 'filter', onClick: () => filter(category) }, category))); filter('全部');
  return { title: '文法索引', nodes: [hero('GRAMMAR / ONE RULE AT A TIME', '把文法，慢慢讀懂。', '不只記住規則，也理解它如何出現在生活裡。從一則你感興趣的文法開始。'), el('section', { class: 'section' }, filters, count, grid)] };
}
