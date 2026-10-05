const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/korean-start/';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage(); const errors = []; const results = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = async (name, fn) => { await fn(); results.push(name); console.log('PASS ' + name); };
  const go = async route => { await page.goto(base + route); await page.locator('main h1').waitFor(); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('korean-learning:v1')));
  await fs.mkdir(path.join(__dirname, '../test-results'), { recursive: true });
  try {
    await check('GitHub Pages 子路徑資源、首頁與邏輯測試', async () => {
      await go('#/home'); assert.match(await page.title(), /韓文起步/); assert.equal(await page.locator('main h1').count(), 1);
      assert.equal(await page.locator('.showcase-card img').count(), 4);
      await page.waitForFunction(() => [...document.querySelectorAll('.boss-portrait')].length === 2 && [...document.querySelectorAll('.boss-portrait')].every(img => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('.boss-invitation a').getAttribute('href'), '#/quiz');
      assert.deepEqual(await page.locator('.region-link').evaluateAll(nodes => nodes.map(n => n.getAttribute('href'))), ['#/alphabet', '#/vocabulary', '#/sentences', '#/grammar', '#/quiz']);
      assert.equal(await page.locator('.mission-copy .button').getAttribute('href'), '#/alphabet/basic-consonants');
      await page.getByRole('link', { name: '探索地圖 ↓', exact: true }).click();
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#learning-route h2')), true);
      assert.equal(new URL(page.url()).hash, '#/home');
      await page.locator('.region-link').first().click(); await page.waitForURL('**/#/alphabet'); await go('#/home');
      const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name)); assert(resources.filter(url => /data\/.*json/.test(url)).every(url => url.includes('/korean-start/')));
      await page.locator('.showcase-card').last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.showcase-card img')].every(img => img.complete && img.naturalWidth > 0));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
      await page.screenshot({ path: 'test-results/home-viewport.png' });
      await page.goto(base + 'tests/index.html'); await page.waitForFunction(() => window.testResults); assert((await page.evaluate(() => window.testResults)).every(r => r.passed));
    });
    await check('所有教材路由、H1、標題與重新整理', async () => {
      const data = await page.evaluate(async () => Object.fromEntries(await Promise.all(['alphabet', 'vocabulary', 'sentences', 'grammar'].map(async k => [k, await (await fetch('../data/' + k + '.json')).json()]))));
      for (const route of ['home', 'alphabet', 'vocabulary', 'sentences', 'grammar', 'quiz', 'progress', 'about', ...Object.entries(data).flatMap(([kind, values]) => values.map(v => `${kind}/${v.id}`))]) { await go('#/' + route); assert.equal(await page.locator('main h1').count(), 1, route); assert(!/找不到/.test(await page.title()), route); }
      await go('#/grammar/eun-neun'); await page.reload(); await page.locator('h1').waitFor(); assert.match(await page.locator('h1').innerText(), /은/);
      await go('#/grammar/missing'); assert.match(await page.locator('h1').innerText(), /找不到/);
    });
    await check('完成進度、文法已讀與收藏重新整理後保留', async () => {
      await go('#/alphabet/basic-consonants'); await page.getByRole('button', { name: '○ 標記為已完成', exact: true }).click();
      await go('#/grammar/eun-neun'); await page.getByRole('button', { name: '○ 標記為已讀', exact: true }).click();
      await go('#/vocabulary/food'); await page.getByRole('button', { name: '收藏 물', exact: true }).click(); await page.reload(); await page.getByRole('button', { name: '取消收藏 물', exact: true }).waitFor();
      const saved = await state(); assert.equal(saved.completedLessonIds.length, 1); assert.equal(saved.readGrammarIds.length, 1); assert.equal(saved.favoriteWordIds.length, 1);
      await go('#/home'); assert.equal(await page.locator('.stat strong').first().innerText(), '7%');
      assert.equal(await page.locator('.map-region').first().locator('.region-count').innerText(), '1 / 5 單元完成');
      assert.notEqual(await page.locator('.mission-copy .button').getAttribute('href'), '#/alphabet/basic-consonants');
    });
    await check('測驗送出、錯題回顧、完整成績與最佳成績', async () => {
      await go('#/quiz'); await page.getByRole('button', { name: '開始測驗 →', exact: true }).click();
      const questions = await page.evaluate(async () => (await fetch('./data/quizzes.json')).json());
      for (let i = 0; i < 10; i++) {
        assert.equal(await page.locator('.battle-status .boss-portrait').count(), 1);
        assert.equal(await page.locator('.battle-status.boss-cheer').count(), 0);
        const prompt = await page.locator('.quiz-question').innerText(); const question = questions.find(q => q.prompt === prompt); assert(question);
        const answerId = i < 8 ? question.correctOptionId : question.options.find(o => o.id !== question.correctOptionId).id;
        await page.locator(`[data-option="${answerId}"]`).click(); await page.getByRole('button', { name: '送出答案', exact: true }).click();
        assert.equal(await page.locator('.quiz-option:disabled').count(), 4);
        assert.equal(await page.locator('.battle-status.boss-cheer').count(), i < 8 ? 1 : 0);
        assert.equal(await page.locator('.battle-reply').innerText(), await page.locator('.boss-dialogue').innerText());
        assert.equal((await state()).quizBestScores.mixed, undefined);
        await page.getByRole('button', { name: i === 9 ? '查看結果 →' : '下一題 →', exact: true }).click();
      }
      assert.equal(await page.locator('.result-score').innerText(), '80'); assert.equal(await page.locator('.review-card').count(), 2); assert.equal((await state()).quizBestScores.mixed.score, 80);
      await page.screenshot({ path: 'test-results/quiz-result.png', fullPage: true });
    });
    await check('離開測驗取消保留原題；上一頁取消還原；確認才離開', async () => {
      await go('#/home'); await page.locator('#desktop-nav a[href="#/quiz"]').click(); await page.getByRole('button', { name: '開始測驗 →' }).click();
      const prompt = await page.locator('.quiz-question').innerText(); await page.locator('.quiz-option').first().click();
      await page.locator('#desktop-nav a[href="#/alphabet"]').click(); await page.getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.locator('.quiz-question').innerText(), prompt); assert.equal(await page.locator('.quiz-option[aria-pressed="true"]').count(), 1);
      await page.evaluate(() => history.back()); await page.locator('#confirm-dialog[open]').waitFor(); await page.getByRole('button', { name: '取消', exact: true }).click(); await page.waitForURL('**/#/quiz'); assert.equal(await page.locator('.quiz-question').innerText(), prompt);
      await page.evaluate(() => history.back()); await page.locator('#confirm-dialog[open]').waitFor(); await page.getByRole('button', { name: '離開測驗', exact: true }).click(); await page.waitForURL('**/#/home'); assert.match(await page.locator('h1').innerText(), /零基礎/);
      await page.evaluate(() => history.forward()); await page.getByRole('button', { name: '開始測驗 →' }).waitFor();
    });
    await check('手機選單焦點、Tab、Esc、遮罩、連結與桌面自動關閉', async () => {
      await page.setViewportSize({ width: 360, height: 800 }); await go('#/home'); await page.locator('#menu-toggle').click();
      assert.equal(await page.evaluate(() => document.activeElement.textContent), '首頁');
      await page.keyboard.press('Shift+Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-close'); await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent), '首頁');
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden'); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-toggle');
      await page.locator('#menu-toggle').click(); await page.mouse.click(5, 400); assert.equal(await page.locator('#mobile-menu[open]').count(), 0);
      await page.locator('#menu-toggle').click(); await page.locator('#mobile-nav a[href="#/grammar"]').click(); assert.equal(await page.locator('#mobile-menu[open]').count(), 0); assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H1');
      await page.locator('#menu-toggle').click(); await page.setViewportSize({ width: 1280, height: 900 }); await page.waitForFunction(() => !document.getElementById('mobile-menu').open);
    });
    await check('360/768/1280 排版無溢出，文法 Grid 為 1/2/3 欄', async () => {
      for (const [width, columns] of [[360, 1], [768, 2], [1280, 3]]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of ['home', 'alphabet/basic-consonants', 'vocabulary', 'sentences', 'grammar', 'grammar/eul-su', 'progress', 'quiz', 'about']) { await go('#/' + route); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`); }
        await go('#/grammar'); assert.equal(await page.locator('.grammar-grid').evaluate(n => getComputedStyle(n).gridTemplateColumns.split(' ').length), columns);
        await page.screenshot({ path: `test-results/grammar-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 360, height: 800 }); await go('#/home');
      await page.locator('.showcase-card').last().scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.showcase-card img')].every(img => img.complete && img.naturalWidth > 0));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
      await page.screenshot({ path: 'test-results/mobile-viewport.png' });
    });
    await check('重設確認、取消保留與僅刪本站資料', async () => {
      await go('#/progress'); await page.evaluate(() => localStorage.setItem('other-app', 'keep'));
      await page.getByRole('button', { name: '重設學習資料', exact: true }).click(); await page.getByRole('button', { name: '取消', exact: true }).click(); assert((await state()).completedLessonIds.length);
      await page.getByRole('button', { name: '重設學習資料', exact: true }).click(); await page.getByRole('button', { name: '重設資料', exact: true }).click(); assert.equal(await state(), null); assert.equal(await page.evaluate(() => localStorage.getItem('other-app')), 'keep');
    });
    await check('損壞儲存資料降級並提示', async () => { await page.evaluate(() => localStorage.setItem('korean-learning:v1', '{oops')); await go('#/home'); await page.reload(); await page.locator('#storage-notice:not([hidden])').waitFor(); assert.match(await page.locator('#storage-notice').innerText(), /無法讀取/); });
    await check('教材載入失敗與重試', async () => {
      await page.route('**/data/grammar.json', route => route.abort()); await page.reload(); await page.getByRole('button', { name: '重新載入教材' }).waitFor(); await page.unroute('**/data/grammar.json'); await page.getByRole('button', { name: '重新載入教材' }).click(); await page.locator('.home-hero').waitFor();
    });
    await check('不支援韓文語音時按鈕停用且有說明', async () => {
      const isolated = await context.newPage(); await isolated.addInitScript(() => { window.speechSynthesis.getVoices = () => []; }); await isolated.goto(base + '#/alphabet/basic-vowels'); await isolated.waitForFunction(() => document.querySelector('[data-speech-note]')?.textContent.includes('暫不支援'));
      assert.equal(await isolated.locator('[data-speak]:not(:disabled)').count(), 0); await isolated.close();
    });
    await check('跳至主要內容不破壞 hash；文法分類可篩選', async () => {
      await go('#/grammar'); await page.locator('.skip-link').focus(); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.activeElement.id), 'main'); assert(page.url().endsWith('#/grammar'));
      await page.getByRole('button', { name: '否定', exact: true }).click(); assert.equal(await page.locator('.grammar-card').count(), 2);
      await page.getByRole('button', { name: '全部', exact: true }).click(); assert.equal(await page.locator('.grammar-card').count(), 30);
    });
    await check('儲存權限受限仍可操作並提示', async () => {
      const isolated = await browser.newContext(); await isolated.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }));
      const denied = await isolated.newPage(); await denied.goto(base + '#/alphabet/basic-consonants'); await denied.getByRole('button', { name: '○ 標記為已完成', exact: true }).click(); assert.match(await denied.locator('#storage-notice').innerText(), /無法存取/); assert.equal(await denied.getByRole('button', { name: '✓ 已完成 · 點擊取消', exact: true }).count(), 1); await isolated.close();
    });
    await check('支援韓文語音時設定語言並取消前次朗讀', async () => {
      const speechContext = await browser.newContext(); await speechContext.addInitScript(() => {
        window.speechCalls = []; window.speechSynthesis.getVoices = () => [{ lang: 'ko-KR', name: 'Test Korean' }];
        window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
        window.speechSynthesis.cancel = () => window.speechCalls.push('cancel');
        window.speechSynthesis.speak = utterance => window.speechCalls.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate });
      });
      const speechPage = await speechContext.newPage(); await speechPage.goto(base + '#/vocabulary/food'); await speechPage.getByRole('button', { name: '朗讀：물', exact: true }).click(); const calls = await speechPage.evaluate(() => window.speechCalls); assert.equal(calls.at(-2), 'cancel'); assert.equal(calls.at(-1).lang, 'ko-KR'); assert.equal(calls.at(-1).text, '물'); await speechContext.close();
    });
    await check('測驗重新整理原生提示可取消', async () => {
      await go('#/quiz'); await page.getByRole('button', { name: '開始測驗 →', exact: true }).click();
      const dialogPromise = page.waitForEvent('dialog'); const reload = page.reload().catch(() => {}); const dialog = await dialogPromise; assert.equal(dialog.type(), 'beforeunload'); await dialog.dismiss(); await reload; assert.equal(await page.locator('.quiz-question').count(), 1);
      await page.locator('#menu-toggle').click(); await page.locator('#mobile-nav a[href="#/home"]').click(); await page.getByRole('button', { name: '離開測驗', exact: true }).click();
    });
    await check('404 頁面從巢狀子路徑導回本站首頁', async () => {
      const notFound = await context.newPage(); await notFound.route('**/korean-start/missing/nested', route => route.fulfill({ status: 404, contentType: 'text/html', path: path.join(__dirname, '../404.html') }));
      await notFound.goto(base + 'missing/nested'); await notFound.waitForURL('**/korean-start/index.html#/home'); await notFound.locator('.home-hero').waitFor(); await notFound.close();
    });
    assert.deepEqual(errors, []); console.log(`${results.length} browser checks passed; no page errors.`);
    await fs.writeFile('test-results/browser-report.json', JSON.stringify({ passed: results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
