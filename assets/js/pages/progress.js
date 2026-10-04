import { el, hero, heading, progressBar, link, button, emptyState, confirmAction, announce, mixedText } from '../components/dom.js';
import { vocabularyCard } from '../components/learning.js';
import { stat } from './home.js';
import { BANKS } from './quiz-page.js';
import { speechNote } from '../speech.js';
export function progressPage(ctx) {
  const { store, data, lessons } = ctx;
  const state = store.state;
  const summary = el('section', { class: 'section progress-summary' }, el('div', { class: 'stats' }, stat(`${Math.round(state.completedLessonIds.length / 15 * 100)}%`, '總學習進度'), stat(`${state.completedLessonIds.length} / 15`, '完成單元'), stat(`${state.readGrammarIds.length} / ${data.grammar.length}`, '已讀文法'), stat(String(state.favoriteWordIds.length), '收藏單字')), progressBar(state.completedLessonIds.length, 15), el('p', { class: 'muted' }, '完成標記代表已閱讀；測驗成績與文法已讀另外記錄。'), link('繼續學習 →', ctx.routeForId(state.lastLessonId)));
  const lessonSection = el('section', { class: 'section' }, heading('01 / LESSONS', '留下每一小步。', '隨時回到熟悉的單元，或選擇下一個起點。'), el('div', { class: 'grid' }, [['alphabet', '韓文字母'], ['vocabulary', '主題單字'], ['sentences', '基礎句型']].map(([kind, title]) => el('div', { class: 'card' }, el('h3', {}, title), el('ul', { class: 'progress-list' }, lessons.filter(l => l.kind === kind).map(l => el('li', {}, el('a', { href: l.route }, l.title, el('span', { class: state.completedLessonIds.includes(l.id) ? 'completed' : 'muted' }, state.completedLessonIds.includes(l.id) ? '✓ 已完成' : '未完成 →')))))))));
  const grammarRead = data.grammar.filter(g => state.readGrammarIds.includes(g.id));
  lessonSection.append(el('div', { class: 'lesson-end' }, el('h3', {}, `已讀文法 · ${grammarRead.length} 則`), grammarRead.length ? el('ul', { class: 'progress-list' }, grammarRead.map(g => el('li', {}, el('a', { href: `#/grammar/${g.id}` }, mixedText(g.titleKo), el('span', { class: 'completed' }, '✓ 已讀'))))) : el('p', { class: 'muted' }, '目前還沒有已讀文法。'), link('前往文法索引 →', '#/grammar', true)));
  const scoreCards = Object.entries(state.quizBestScores).map(([bank, score]) => el('article', { class: 'card' }, el('p', { class: 'eyebrow' }, BANKS[bank]), stat(`${score.score} 分`, `答對 ${score.correct} / ${score.total} 題`), el('p', { class: 'muted' }, new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeZone: 'Asia/Taipei' }).format(new Date(score.completedAt)))));
  const scores = el('section', { class: 'section' }, heading('02 / YOUR PERSONAL BEST', '和自己的上一次相比。', '每個題庫保留你的最佳成績。'), scoreCards.length ? el('div', { class: 'grid' }, scoreCards) : emptyState('第一次練習，從這裡開始。', '完成一回合測驗後，就會留下第一筆成績。', link('開始測驗 →', '#/quiz')));
  const favorites = el('section', { class: 'section' }, heading('03 / SAVED WORDS', '想再讀一次的單字。', '把還不熟悉或特別喜歡的字，留在這裡。'), speechNote());
  const favoriteList = el('div');
  function drawFavorites() {
    const words = data.vocabulary.flatMap(t => t.words).filter(w => store.state.favoriteWordIds.includes(w.id));
    const previousFocus = document.activeElement?.getAttribute('aria-label');
    favoriteList.replaceChildren(words.length ? el('div', { class: 'grid' }, words.map(w => vocabularyCard(w, store, () => { drawFavorites(); summary.querySelectorAll('.stat strong')[3].textContent = String(store.state.favoriteWordIds.length); }))) : emptyState('你的單字收藏還是空的。', '在單字卡上點一下「收藏」，就能在這裡複習。', link('探索主題單字 →', '#/vocabulary')));
    if (previousFocus?.startsWith('取消收藏')) (favoriteList.querySelector('button.favorite') || favoriteList.querySelector('a'))?.focus();
  }
  drawFavorites(); favorites.append(favoriteList);
  const reset = el('section', { class: 'section' }, heading('04 / LOCAL TO THIS BROWSER', '關於你的學習紀錄', '資料只保存在目前裝置、瀏覽器與網站來源。清除網站資料後會消失，不會跨裝置同步。'), button('重設學習資料', async () => {
    if (await confirmAction('重新開始學習？', '這會清除本網站的完成狀態、已讀文法、收藏與測驗成績，無法復原。', '重設資料')) { store.reset(); ctx.refresh(); announce('學習資料已重設。'); }
  }, true));
  return { title: '我的學習', nodes: [hero('MY LEARNING / YOUR OWN PACE', '你的每一步，都在這裡。', '不需要和別人比較。今天比昨天多認識一個字，就很好。'), summary, lessonSection, scores, favorites, reset] };
}
