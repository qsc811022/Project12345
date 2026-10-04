import { loadData, lessonCatalog } from './data.js';
import { createStorage } from './storage.js';
import { createRouter } from './router.js';
import { initMenu } from './menu.js';
import { initSpeech, stopSpeech } from './speech.js';
import { el, hero, link, button, confirmAction } from './components/dom.js';
import { homePage } from './pages/home.js';
import { lessonPage, grammarPage } from './pages/lessons.js';
import { quizPage } from './pages/quiz-page.js';
import { progressPage } from './pages/progress.js';
import { aboutPage } from './pages/about.js';
const main = document.getElementById('main');
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ behavior: 'instant' });
});
const menu = initMenu();
initSpeech();
let ctx;
window.addEventListener('beforeunload', event => { if (ctx?.quizActive) { event.preventDefault(); event.returnValue = ''; } });
async function start() {
  main.replaceChildren(el('p', { class: 'loading', role: 'status' }, '正在準備你的韓文學習手冊…'));
  try {
    const data = await loadData();
    const lessons = lessonCatalog(data);
    const allIds = [...lessons.map(l => l.id), ...data.grammar.map(g => g.id)];
    if (new Set(allIds).size !== allIds.length) throw new Error('教材單元 ID 重複，請修正資料後重試。');
    const store = createStorage({ lessons: lessons.map(l => l.id), grammar: data.grammar.map(g => g.id), words: data.vocabulary.flatMap(t => t.words.map(w => w.id)) }, message => { const notice = document.getElementById('storage-notice'); notice.textContent = message; notice.hidden = false; });
    ctx = { data, store, lessons, quizActive: false, routeForId(id) { return lessons.find(l => l.id === id)?.route || (data.grammar.some(g => g.id === id) ? `#/grammar/${id}` : '#/alphabet/basic-consonants'); } };
    const router = createRouter(route => {
      stopSpeech(); menu.close();
      let page;
      if (['alphabet', 'vocabulary', 'sentences'].includes(route.page)) page = lessonPage(ctx, route.page, route.id);
      else if (route.page === 'grammar') page = grammarPage(ctx, route.id);
      else if (!route.id) {
        if (route.page === 'home') page = homePage(ctx);
        if (route.page === 'quiz') page = quizPage(ctx);
        if (route.page === 'progress') page = progressPage(ctx);
        if (route.page === 'about') page = aboutPage(ctx);
      }
      page ||= { title: '找不到此頁面', nodes: [hero('PAGE NOT FOUND', '找不到此頁面', '這個單元或網址不存在。回到首頁，重新選擇一個學習起點。', [link('返回首頁 →', '#/home')])] };
      main.replaceChildren(...page.nodes); document.title = `${page.title}｜韓文起步`; menu.update(route.page);
      window.scrollTo({ top: 0, behavior: 'instant' }); main.querySelector('h1')?.focus({ preventScroll: true });
    }, async () => {
      if (!ctx.quizActive) return true;
      const leave = await confirmAction('離開這次測驗？', '離開將不保存本次作答，確定離開？', '離開測驗');
      if (leave) ctx.quizActive = false;
      return leave;
    });
    ctx.refresh = router.refresh;
  } catch (error) {
    console.error(error);
    main.replaceChildren(hero('PLEASE TRY AGAIN', '教材暫時沒有載入成功。', '請確認網路連線後再試一次。若在電腦上開啟本機檔案，請改用靜態網站伺服器。', [button('重新載入教材', start)]));
    main.querySelector('h1')?.focus();
  }
}
start();
