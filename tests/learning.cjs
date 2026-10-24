const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/korean-start/';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const go = async route => { await page.goto(base + route); await page.locator('main h1').waitFor(); };
  try {
    await fs.mkdir('test-results', { recursive: true });
    await go('#/home'); assert.equal(await page.locator('.starter-steps li').count(), 3);
    await page.getByRole('link', { name: '開始問候單字練習 →', exact: true }).click();
    const practice = page.locator('.word-practice');
    await practice.locator('.flash-word').waitFor();
    assert.equal(await practice.locator('.flash-word').innerText(), '안녕하세요');
    assert(await practice.locator('.flash-answer').isHidden());
    assert(await practice.getByRole('button', { name: '記住了，下一字 →' }).isHidden());
    for (let i = 0; i < 5; i++) {
      await practice.getByRole('button', { name: '查看中文與例句' }).click();
      assert(await practice.locator('.flash-answer').isVisible());
      await practice.getByRole('button', { name: i === 0 ? '還不熟，再練一次' : '記住了，下一字 →', exact: true }).click();
    }
    assert.match(await practice.innerText(), /1 字想再複習/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('korean-learning:v1')).completedLessonIds.length), 0);
    await practice.getByRole('button', { name: '複習還不熟的字' }).click();
    assert.equal(await practice.locator('.flash-word').innerText(), '안녕하세요');
    assert(await practice.locator('.flash-answer').isHidden());
    await practice.getByRole('button', { name: '查看中文與例句' }).click();
    await practice.getByRole('button', { name: '記住了，下一字 →', exact: true }).click();
    await practice.getByRole('button', { name: '繼續下一組 5 字 →' }).click();
    assert.equal(await practice.locator('.flash-word').innerText(), '괜찮아요');
    console.log('PASS 五字翻卡、解答隱藏、不熟字複習、下一組與獨立完成進度');

    await go('#/vocabulary');
    const library = page.locator('.word-library'); const search = page.getByRole('searchbox');
    assert.equal(await library.locator('.vocabulary-card').count(), 12);
    assert.match(await library.locator('[role="status"]').innerText(), /250 個單字/);
    await library.getByRole('button', { name: '下一頁 →', exact: true }).click();
    assert.match(await library.locator('[role="status"]').innerText(), /第 2/);
    await search.fill('交通卡'); assert.equal(await library.locator('.vocabulary-card').count(), 2);
    assert.match(await library.innerText(), /교통카드/);
    await library.getByRole('button', { name: '收藏 교통카드', exact: true }).click();
    await search.fill(''); await page.getByLabel('只看收藏').check();
    assert.equal(await library.locator('.vocabulary-card').count(), 1);
    await library.getByRole('button', { name: '取消收藏 교통카드', exact: true }).click();
    assert.equal(await library.locator('.vocabulary-card').count(), 0);
    assert.match(await library.locator('[role="status"]').innerText(), /找到 0/);
    await page.getByLabel('只看收藏').uncheck();
    await library.getByRole('button', { name: '食物與飲料', exact: true }).click();
    assert.match(await library.locator('[role="status"]').innerText(), /50 個單字/);
    await search.fill('맛있어요'); assert(await library.locator('.vocabulary-card').count() > 0);
    await search.fill('no-such-word'); assert.equal(await library.locator('.vocabulary-card').count(), 0);
    console.log('PASS 搜尋、分頁、主題與收藏交集、移除收藏與零筆結果');

    for (const width of [320, 360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['#/home', '#/vocabulary/greetings', '#/vocabulary/travel', '#/vocabulary']) {
        await go(route); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}`);
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 }); await go('#/vocabulary/food');
    await page.locator('.word-practice').getByRole('button', { name: '查看中文與例句' }).click();
    await page.screenshot({ path: 'test-results/learning-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: 'test-results/learning-mobile.png', fullPage: true });
    console.log('PASS 320/360/768/1280 首頁、翻卡與單字庫無溢出');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
