import { el, ko, link, heading, progressBar } from '../components/dom.js';
import { bossInvitation, bossPortrait } from '../components/boss.js';
import { speakButton, speechNote } from '../speech.js';

const REGIONS = [
  ['alphabet', '韓文字母', '가', '認識子音、母音，練習把字母組成一個字。', 'mint'],
  ['vocabulary', '生活單字', '말', '從問候、飲食到旅行，每次練習 5 個字。', 'gold'],
  ['sentences', '日常對話', '안녕', '學會自我介紹、點餐、購物與問路。', 'pink'],
  ['grammar', '文法解說', '책', '用中文說明句子的規則，搭配韓文例句。', 'lavender'],
  ['quiz', '10 題小測驗', '★', '選擇練習主題，答完看解說與錯題回顧。', 'blue']
];

export function homePage(ctx) {
  const { data, store, lessons } = ctx;
  const state = store.state;
  const completed = state.completedLessonIds.length;
  const next = lessons.find(lesson => !state.completedLessonIds.includes(lesson.id));
  const nextRoute = next ? ctx.routeForId(next.id) : '#/quiz';
  const wordCount = data.vocabulary.reduce((total, topic) => total + topic.words.length, 0);
  const scores = Object.values(state.quizBestScores);
  const hero = el('section', { class: 'page-hero home-hero' },
    el('div', { class: 'hero-copy' },
      el('p', { class: 'eyebrow adventure-label' }, '給繁體中文使用者的韓語入門練習'),
      el('h1', { class: 'page-title', tabindex: '-1' }, '零基礎學韓語，', el('br'), el('em', {}, '從「你好」開始。')),
      el('p', { class: 'description' }, '看中文解說、聽韓文發音，再用翻卡和小測驗練習。從認識字母到生活對話，一步一步學會。'),
      el('div', { class: 'actions hero-actions' }, link(completed ? next ? '繼續學習下一個單元 →' : '開始複習測驗 →' : '從韓文字母開始 →', nextRoute), el('a', { class: 'text-link', href: '#/home' }, '先看看可以學什麼 ↓')),
      el('p', { class: 'hero-reassurance' }, '免費學習 · 不用註冊 · 沒有倒數計時'),
      el('p', { class: 'hero-footnote' }, `${lessons.length} 個學習單元 · ${wordCount} 個生活單字 · 進度保存在目前瀏覽器`)),
    el('div', { class: 'hero-example' },
      el('div', { class: 'example-intro' }, el('img', { src: './assets/images/adventure-mascot.svg', alt: '', width: 64, height: 56 }), el('p', {}, '你會這樣學韓文')),
      el('div', { class: 'hero-example-card' }, el('span', { class: 'badge' }, '第一句問候'), ko('안녕하세요', 'p', { class: 'example-korean' }), el('p', { class: 'example-translation' }, '您好 / 你好'), el('p', { class: 'muted' }, '見面打招呼時使用，是有禮貌的說法。'), speakButton('안녕하세요')),
      speechNote(), el('p', { class: 'example-caption' }, '看韓文 → 聽發音 → 理解意思 → 動手練習')));
  hero.querySelector('a[href="#/home"]').addEventListener('click', event => {
    event.preventDefault();
    const target = document.getElementById('learning-route');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target.querySelector('h2').focus({ preventScroll: true });
  });
  const guide = el('section', { class: 'section quick-start', 'aria-labelledby': 'quick-start-title' },
    el('div', { class: 'section-heading' }, el('p', { class: 'eyebrow' }, '第一次來，建議這樣學'), el('h2', { class: 'section-title', id: 'quick-start-title' }, '跟著三個步驟，開始你的韓語練習'), el('p', { class: 'muted' }, '從字母開始；已經會讀韓文，也可以直接練單字。')),
    el('ol', { class: 'starter-steps' },
      el('li', {}, el('span', { class: 'step-number' }, '步驟 1'), el('h3', {}, '先學會讀韓文'), el('p', {}, '認識字母的形狀與聲音，看看它們怎麼組成一個字。'), link('認識韓文字母 →', '#/alphabet', true)),
      el('li', {}, el('span', { class: 'step-number' }, '步驟 2'), el('h3', {}, '一次練習 5 個單字'), el('p', {}, '先聽發音、想想意思，再翻開中文。還不熟的字可以重練。'), link('開始問候單字練習 →', '#/vocabulary/greetings', true)),
      el('li', {}, el('span', { class: 'step-number' }, '步驟 3'), el('h3', {}, '用小測驗確認學會了沒'), el('p', {}, '每次 10 題，答完就有解說。答錯也沒關係，可以再試一次。'), link('開始 10 題小測驗 →', '#/quiz', true))));
  const map = el('section', { class: 'section adventure-section', id: 'learning-route' },
    heading('依照你的需要選擇', '這裡可以學什麼？', '所有教材都能直接開啟。選一個你想學的內容就可以開始。'),
    el('div', { class: 'adventure-board' },
      el('ol', { class: 'map-regions' }, REGIONS.map(([kind, title, icon, description, color], index) => {
        const units = kind === 'quiz' ? [] : data[kind];
        const done = kind === 'grammar' ? state.readGrammarIds.length : units.filter(u => state.completedLessonIds.includes(u.id)).length;
        const count = kind === 'quiz' ? '每回 10 題 · 不限時間' : `${done} / ${units.length} ${kind === 'grammar' ? '則已讀' : '單元完成'}`;
        return el('li', { class: `map-region ${color}` }, el('a', { class: 'region-link', href: `#/${kind}` },
          el('span', { class: 'region-number' }, kind === 'alphabet' ? '新手建議從這裡開始' : `學習內容 ${index + 1}`),
          el('span', { class: `region-island${kind === 'quiz' ? ' boss-island' : ''}`, 'aria-hidden': 'true' }, kind === 'quiz' ? bossPortrait() : ko(icon, 'span')),
          el('h3', {}, title), el('p', { class: 'region-description' }, description), el('span', { class: 'region-count' }, done && done === units.length ? '✓ 已全部完成' : count), el('span', { class: 'region-action' }, '查看內容 →')));
      }))),
    el('div', { class: 'map-legend' }, el('span', {}, '可以自由選擇主題，也能隨時回來複習。'), el('a', { href: '#/progress', class: 'text-link' }, '查看我的學習進度 →')));
  map.querySelector('h2').tabIndex = -1;
  const hud = el('section', { class: 'player-hud', 'aria-label': '你的學習紀錄' },
    el('div', { class: 'player-identity' }, ko('한', 'span', { class: 'player-avatar', 'aria-hidden': 'true' }), el('div', {}, el('strong', {}, completed ? '你已經累積的進步' : '從第一個單元，累積你的進步'), el('span', {}, '讀完單元後，記得按「標記為已完成」'))),
    el('div', { class: 'stats' }, stat(`${Math.round(completed / lessons.length * 100)}%`, '學習進度'), stat(`${completed} / ${lessons.length}`, '完成單元'), stat(String(state.favoriteWordIds.length), '收藏單字'), stat(scores.length ? `${Math.max(...scores.map(s => s.score))}` : '尚未測驗', '測驗最高分')));
  const mission = el('section', { class: 'section mission-section' },
    el('div', { class: 'mission-copy' }, el('p', { class: 'eyebrow' }, completed ? '接著學這個' : '你的第一個學習單元'), el('h2', { class: 'section-title' }, next ? next.title : '你已完成全部學習單元！'), el('p', { class: 'muted' }, next ? '打開教材，先看解說，再聽發音。讀完後按「標記為已完成」，下次回來就知道學到哪裡。' : '到小測驗確認學習成果，也可以回頭複習不熟的內容。'), link(next ? '開啟這個單元 →' : '開始複習測驗 →', nextRoute)),
    el('div', { class: 'mission-progress' }, el('h3', {}, '已完成的學習單元'), progressBar(completed, lessons.length, '單元完成進度'), el('p', { class: 'muted' }, '進度會自動保存在目前瀏覽器。')));
  return { title: '零基礎韓語學習', nodes: [hero, ...(completed ? [mission] : []), guide, map, hud, ...(!completed ? [mission] : []), bossInvitation()] };
}
export function stat(value, label) { return el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label)); }
