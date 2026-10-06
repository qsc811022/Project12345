const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/korean-start/';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const hp = () => page.locator('.battle-status [role="progressbar"]').getAttribute('aria-valuenow');
  try {
    await fs.mkdir('test-results', { recursive: true });
    await page.goto(base + '#/quiz');
    await page.locator('.boss-health').waitFor();
    const questions = await page.evaluate(async () => (await fetch('./data/quizzes.json')).json());
    for (const allCorrect of [true, false]) {
      await page.getByRole('button', { name: '開始測驗 →', exact: true }).click();
      assert.equal(await hp(), '10', '新回合滿血');
      for (let i = 0; i < 10; i++) {
        const prompt = await page.locator('.quiz-question').innerText();
        const question = questions.find(q => q.prompt === prompt);
        const answer = allCorrect ? question.correctOptionId : question.options.find(o => o.id !== question.correctOptionId).id;
        await page.locator(`[data-option="${answer}"]`).click();
        assert.equal(await hp(), String(allCorrect ? 10 - i : 10), '選擇選項不扣血');
        // The stale button reference simulates queued duplicate clicks after replacement.
        await page.locator('.quiz-submit').evaluate(button => { button.click(); button.click(); });
        assert.equal(await hp(), String(allCorrect ? 9 - i : 10), '正確答案僅扣一次；錯誤答案不扣');
        assert.equal(await page.locator('.boss-damage:not([hidden])').count(), allCorrect ? 1 : 0);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '手機作答無溢出');
        if (allCorrect && i === 0) {
          assert.equal(await page.locator('.battle-status .boss-portrait').evaluate(node => getComputedStyle(node).animationName), 'none');
          await page.locator('.battle-status').screenshot({ path: 'test-results/boss-hp-mobile.png' });
          await page.setViewportSize({ width: 1280, height: 900 });
          await page.locator('#desktop-nav a[href="#/home"]').click();
          await page.getByRole('button', { name: '取消', exact: true }).click();
          assert.equal(await hp(), '9', '取消離開保留血量');
          await page.setViewportSize({ width: 320, height: 900 });
        }
        await page.getByRole('button', { name: i === 9 ? '查看結果 →' : '下一題 →', exact: true }).click();
      }
      assert.equal(await page.locator('.result-card [role="progressbar"]').getAttribute('aria-valuenow'), allCorrect ? '0' : '10');
      assert.equal(await page.locator('.boss-victory').count(), allCorrect ? 1 : 0);
      assert.equal(await page.locator('.result-score').innerText(), allCorrect ? '100' : '0');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('korean-learning:v1')).quizBestScores.mixed.score), 100, '重玩低分不覆寫最佳成績');
      if (allCorrect) {
        await page.locator('.result-card').screenshot({ path: 'test-results/boss-victory-mobile.png' });
        await page.getByRole('button', { name: '重新測驗 →', exact: true }).click();
        assert.equal(await page.locator('.boss-hero [role="progressbar"]').getAttribute('aria-valuenow'), '10');
        assert.equal(await page.locator('.boss-defeated').count(), 0);
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS BOSS HP: correct/wrong, duplicate submit, cancelled exit, victory, replay reset, best score, reduced motion, 320/360px');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
