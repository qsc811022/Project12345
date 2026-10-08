import { el, ko, link, heading, progressBar } from '../components/dom.js';
import { COURSES, courseCard, grammarCard } from '../components/learning.js';
import { bossInvitation, bossPortrait } from '../components/boss.js';

const REGIONS = [
  ['alphabet', '字母森林', '가', '認識韓文的第一個音', 'mint'],
  ['vocabulary', '單字市集', '말', '收集生活裡的常用詞', 'gold'],
  ['sentences', '對話小鎮', '안녕', '把第一句韓文說出口', 'pink'],
  ['grammar', '文法圖書館', '책', '發現句子裡的小規則', 'lavender'],
  ['quiz', '練習競技場', '★', '用 10 題試試你的實力', 'blue']
];

export function homePage(ctx) {
  const { data, store, lessons } = ctx;
  const state = store.state;
  const wordCount = data.vocabulary.reduce((total, topic) => total + topic.words.length, 0);
  const completed = state.completedLessonIds.length;
  const next = lessons.find(lesson => !state.completedLessonIds.includes(lesson.id));
  const nextRoute = next ? ctx.routeForId(next.id) : '#/quiz';
  const scores = Object.values(state.quizBestScores);
  const hero = el('section', { class: 'page-hero home-hero' },
    el('div', { class: 'hero-copy' },
      el('p', { class: 'eyebrow adventure-label' }, '✦ HANGUL ADVENTURE · 韓文冒險島'),
      el('h1', { class: 'page-title', tabindex: '-1' }, '零基礎也能，', el('br'), el('em', {}, '玩出你的韓文力！')),
      el('p', { class: 'description' }, '穿過字母森林、逛逛單字市集。每天完成一個小任務，讓韓文成為你的新技能。'),
      el('div', { class: 'actions' }, link(completed ? next ? '繼續冒險 →' : '前往練習 →' : '開始冒險 →', nextRoute), link('探索地圖 ↓', '#/home', true)),
      el('p', { class: 'hero-footnote' }, `${lessons.length} 個學習單元 · ${wordCount} 個生活單字 · 依自己的步調探索`)),
    el('div', { class: 'hero-scene' },
      el('span', { class: 'scene-word word-one', lang: 'ko' }, '안녕!'),
      el('img', { class: 'adventure-mascot', src: './assets/images/adventure-mascot.svg', alt: '背著小背包、揮手出發的韓文字母探險夥伴', width: 360, height: 290 }),
      el('span', { class: 'scene-word word-two' }, '一起出發吧！'),
      el('span', { class: 'scene-spark spark-one', 'aria-hidden': 'true' }, '✦'),
      el('span', { class: 'scene-spark spark-two', 'aria-hidden': 'true' }, '✧')));
  hero.querySelector('a[href="#/home"]').addEventListener('click', event => {
    event.preventDefault();
    const target = document.getElementById('learning-route');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target.querySelector('h2').focus({ preventScroll: true });
  });
  const hud = el('section', { class: 'player-hud', 'aria-label': '你的冒險紀錄' },
    el('div', { class: 'player-identity' }, ko('한', 'span', { class: 'player-avatar', 'aria-hidden': 'true' }), el('div', {}, el('strong', {}, completed === lessons.length ? '韓文探索家' : completed ? '成長中的冒險家' : '新手冒險家'), el('span', {}, '每一小步，都算進度'))),
    el('div', { class: 'stats' }, stat(`${Math.round(completed / lessons.length * 100)}%`, '探索進度'), stat(`${completed} / ${lessons.length}`, '完成單元'), stat(String(state.favoriteWordIds.length), '收藏單字'), stat(scores.length ? `${Math.max(...scores.map(s => s.score))}` : '—', '測驗最高分')));
  const map = el('section', { class: 'section adventure-section', id: 'learning-route' },
    heading('WORLD MAP / 探索地圖', '下一站，想去哪裡？', '從字母出發，也可以自由選擇想探索的區域。目前所有教材皆可直接進入。'),
    el('div', { class: 'adventure-board' },
      el('span', { class: 'map-cloud cloud-one', 'aria-hidden': 'true' }),
      el('span', { class: 'map-cloud cloud-two', 'aria-hidden': 'true' }),
      el('div', { class: 'map-trail', 'aria-hidden': 'true' }),
      el('ol', { class: 'map-regions' }, REGIONS.map(([kind, title, icon, description, color], index) => {
        const units = kind === 'quiz' ? [] : data[kind];
        const done = kind === 'grammar' ? state.readGrammarIds.length : units.filter(u => state.completedLessonIds.includes(u.id)).length;
        const count = kind === 'quiz' ? '每回合 10 題' : `${done} / ${units.length} ${kind === 'grammar' ? '則已讀' : '單元完成'}`;
        return el('li', { class: `map-region ${color}` }, el('a', { class: 'region-link', href: `#/${kind}` },
          el('span', { class: 'region-number' }, `AREA 0${index + 1}`),
          el('span', { class: `region-island${kind === 'quiz' ? ' boss-island' : ''}`, 'aria-hidden': 'true' }, kind === 'quiz' ? bossPortrait() : ko(icon, 'span'), el('span', { class: 'island-tree tree-left' }), el('span', { class: 'island-tree tree-right' })),
          el('h3', {}, title), el('p', { class: 'region-description' }, description), el('span', { class: 'region-count' }, done && done === units.length ? '✓ 區域探索完成' : count)));
      }))),
    el('div', { class: 'map-legend' }, el('span', {}, '✦ 自由探索 · 不限時間'), el('a', { href: '#/progress', class: 'text-link' }, '查看冒險紀錄 →')));
  map.querySelector('h2').tabIndex = -1;
  const mission = el('section', { class: 'section mission-section' },
    el('div', { class: 'mission-copy' }, el('p', { class: 'eyebrow' }, 'YOUR NEXT QUEST / 下一個任務'), el('h2', { class: 'section-title' }, next ? next.title : '全區探索完成！'), el('p', { class: 'muted' }, next ? '讀一個單元、聽一遍發音，再標記完成。小小的進步，也值得記下來。' : '15 個單元都留下了你的足跡。到競技場練習，或回頭複習喜歡的內容。'), link(next ? '接受學習任務 →' : '挑戰練習測驗 →', nextRoute)),
    el('div', { class: 'mission-progress' }, el('span', { class: 'quest-icon', 'aria-hidden': 'true' }, '⚑'), el('h3', {}, '你的探索旅程'), progressBar(completed, lessons.length, '學習單元'), el('p', { class: 'muted' }, '讀完教材後，按下「標記為已完成」即可累積。')));
  const courses = el('section', { class: 'section' }, heading('CHOOSE YOUR QUEST / 學習任務', '把新技能放進背包', '每個區域都有 5 個單元，一次探索一小段。'), el('div', { class: 'grid' }, COURSES.map(course => courseCard(course, data, store))));
  const showcases = [['alphabet', '字母練習', '認識形狀，聽見每個字母的聲音。'], ['vocabulary', '單字收集', '收藏喜歡的詞，裝進你的單字背包。'], ['sentences', '對話技能', '用完整的句子，和世界打聲招呼。'], ['quiz', '練習競技場', '不限時間的 10 題練習，答完就能看解說。']];
  const kit = el('section', { class: 'section' }, heading('ADVENTURE KIT / 冒險工具箱', '用你喜歡的方式練習', '聽發音、收單字、練句子，再來一場小測驗。'), el('div', { class: 'grid showcase-grid' }, showcases.map(([path, title, description]) => el('article', { class: 'card showcase-card' }, el('img', { src: `./assets/images/preview-${path}.svg`, alt: `${title}的學習畫面示意`, width: 640, height: 400, loading: 'lazy' }), el('div', { class: 'showcase-body' }, el('h3', {}, title), el('p', {}, description), el('a', { class: 'text-link', href: `#/${path}` }, '前往探索 →'))))));
  const grammar = el('section', { class: 'section' }, heading('SKILL BOOK / 文法技能書', '多學一招，就多懂一句', '從一個規則、兩個例句開始，慢慢累積你的韓文技能。'), el('div', { class: 'grammar-grid' }, data.grammar.slice(0, 6).map(g => grammarCard(g, store))), el('div', { class: 'lesson-end' }, link(`探索全部 ${data.grammar.length} 則文法 →`, '#/grammar', true)));
  const coming = el('aside', { class: 'coming-soon' }, el('span', { class: 'coming-icon', 'aria-hidden': 'true' }, '✧'), el('div', {}, el('strong', {}, '下一段冒險：闖關拿密碼'), el('p', {}, '通關獎勵與密碼解鎖規劃中，敬請期待。現在先收集知識，為冒險暖身！')));
  return { title: '韓文冒險島', nodes: [hero, hud, map, bossInvitation(), mission, courses, kit, grammar, coming] };
}
export function stat(value, label) { return el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label)); }
