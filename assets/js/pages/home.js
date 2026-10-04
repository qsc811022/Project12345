import { el, ko, link, button, heading, progressBar } from '../components/dom.js';
import { COURSES, courseCard, grammarCard, infoCard } from '../components/learning.js';
export function homePage(ctx) {
  const { data, store, lessons } = ctx;
  const state = store.state;
  const hasRecord = state.lastLessonId || state.completedLessonIds.length || state.readGrammarIds.length || state.favoriteWordIds.length || Object.keys(state.quizBestScores).length;
  const route = ctx.routeForId(state.lastLessonId);
  const hero = el('section', { class: 'page-hero home-hero' }, el('div', {}, el('p', { class: 'eyebrow' }, 'YOUR FIRST STEP INTO KOREAN'), el('h1', { class: 'page-title', tabindex: '-1' }, '韓文零基礎，', el('br'), '從', el('em', {}, '第一個字母'), el('br'), '開始學起。'), el('p', { class: 'description' }, '不需要一次學會所有。從字母、單字到日常對話，跟著清楚的中文解說，找到自己的學習步調。'), el('div', { class: 'actions' }, link('開始學習 →', '#/alphabet/basic-consonants'), hasRecord ? link('繼續學習 ↗', route, true) : button('查看學習路線 ↓', () => { const target = document.getElementById('learning-route'); target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); target.querySelector('h2').focus({ preventScroll: true }); }, true)), el('p', { class: 'hero-footnote' }, '繁體中文解說　／　免費學習　／　按自己的步調')), el('div', { class: 'letter-composition', 'aria-label': '韓文字 한 由 ㅎ、ㅏ、ㄴ 組成' }, ko('한', 'div', { class: 'large-hangul', 'aria-hidden': 'true' }), ko('ㅎ + ㅏ + ㄴ', 'div', { class: 'letter-equation', 'aria-hidden': 'true' }), el('div', { class: 'caption' }, 'ONE LETTER. A NEW BEGINNING.')));
  const nodes = [hero];
  if (hasRecord) {
    const scores = Object.values(state.quizBestScores);
    const recent = lessons.find(l => l.id === state.lastLessonId)?.title || data.grammar.find(g => g.id === state.lastLessonId)?.titleKo || '從基本子音開始';
    nodes.push(el('section', { class: 'section progress-summary' }, heading('WELCOME BACK', '每一小步，都算數。', `最近學習：${recent}`), el('div', { class: 'stats' }, stat(`${Math.round(state.completedLessonIds.length / 15 * 100)}%`, '總學習進度'), stat(`${state.completedLessonIds.length} / 15`, '完成單元'), stat(String(state.readGrammarIds.length), '已讀文法'), stat(scores.length ? `${Math.max(...scores.map(s => s.score))} 分` : '—', '測驗最高分')), progressBar(state.completedLessonIds.length, 15), link('查看我的學習 →', '#/progress', true)));
  }
  const steps = [ ['alphabet', '韓文字母', '認識字形，再練習組字'], ['vocabulary', '主題單字', '收集生活中的常用詞'], ['sentences', '基礎句型', '試著說出完整的一句話'], ['grammar', '入門文法', '理解句子背後的規則'], ['quiz', '練習測驗', '看看自己學會了多少'] ];
  const routeSection = el('section', { class: 'section', id: 'learning-route' }, heading('01 / YOUR LEARNING PATH', '一條清楚的學習路線。', '循序漸進，也可以從你感興趣的地方開始。'), el('div', { class: 'route-steps' }, steps.map(([path, title, description], i) => el('a', { class: 'route-step', href: `#/${path}` }, el('span', { class: 'number' }, `0${i + 1}`), el('div', {}, el('h3', {}, title), el('p', {}, description)), el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→')))));
  routeSection.querySelector('h2').tabIndex = -1;
  nodes.push(routeSection, el('section', { class: 'section' }, heading('02 / START LEARNING', '目前開放的學習單元', '開始前可先確認程度、學習內容與預估時間。'), el('div', { class: 'grid' }, COURSES.map(course => courseCard(course, data, store)))));
  const showcases = [['alphabet', '韓文字母', '從基本子音與母音開始。'], ['vocabulary', '單字卡', '一句例句，讓新單字有了情境。'], ['sentences', '基礎句型', '學會在生活裡用得上的一句話。'], ['quiz', '練習與回顧', '用即時解說，理解每一次作答。']];
  const showcaseCards = showcases.map(([path, title, description], i) =>
    el('article', { class: 'card showcase-card' },
      el('img', { src: `./assets/images/preview-${path}.svg`, alt: `${title}的介面示意圖`, width: 640, height: 400, loading: 'lazy' }),
      el('div', { class: 'showcase-body' },
        el('span', { class: 'number' }, `0${i + 1}`), el('h3', {}, title), el('p', {}, description),
        el('a', { class: 'text-link', href: `#/${path}` }, '開始學習 →'))));
  nodes.push(el('section', { class: 'section' },
    heading('03 / A LOOK INSIDE', '學習頁面會長這樣', '簡單看看你在網站中會使用到的學習功能。'),
    el('div', { class: 'grid showcase-grid' }, showcaseCards)));
  nodes.push(el('section', { class: 'section' }, heading('04 / GRAMMAR NOTES', '把文法，慢慢讀懂。', '不用一次記住全部。從一個助詞、一個表達開始。'), el('div', { class: 'grammar-grid' }, data.grammar.slice(0, 6).map(g => grammarCard(g, store))), el('div', { class: 'lesson-end' }, link(`查看全部 ${data.grammar.length} 則文法 →`, '#/grammar', true))));
  nodes.push(el('section', { class: 'section' }, heading('05 / ABOUT THIS GUIDE', '為剛開始的你而寫。', '從零出發的學習手冊，也是隨時可以回來複習的小角落。'), infoCard()));
  return { title: '從第一個字母開始', nodes };
}
export function stat(value, label) { return el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label)); }
