const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/korean-start/';

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  let passed = 0;
  try {
    const cases = [
      { name: 'Google 韓文優先於系統預設聲音，且排除 Google 英文', voices: [{ lang: 'ko-KR', name: 'System Korean', default: true }, { lang: 'en-US', name: 'Google US English' }, { lang: 'ko-KR', name: 'Google 한국의' }], expected: 'Google 한국의', google: true },
      { name: '可透過 voiceURI 識別 Google 語音', voices: [{ lang: 'ko-KR', name: 'System Korean' }, { lang: 'ko_KR', name: '한국어', voiceURI: 'Google Korean' }], expected: '한국어', google: true },
      { name: 'Google 韓文未提供時使用系統預設韓文', voices: [{ lang: 'ko-KR', name: 'Other Korean' }, { lang: 'en-US', name: 'Google English' }, { lang: 'ko-KR', name: 'Default Korean', default: true }], expected: 'Default Korean', google: false },
      { name: '無預設韓文時使用第一個韓文聲音', voices: [{ lang: 'ko', name: 'Available Korean' }], expected: 'Available Korean', google: false },
      { name: '只有 Google 英文時不啟用韓文朗讀', voices: [{ lang: 'en-US', name: 'Google US English' }], expected: null },
      { name: '延遲載入 Google 聲音時更新按鈕與朗讀', voices: [], delayed: [{ lang: 'ko-KR', name: 'Google 한국의' }], expected: 'Google 한국의', google: true }
    ];
    for (const test of cases) {
      const context = await browser.newContext();
      await context.addInitScript(voices => {
        window.testVoices = voices; window.speechCalls = [];
        window.speechSynthesis.getVoices = () => window.testVoices;
        window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
        window.speechSynthesis.cancel = () => window.speechCalls.push('cancel');
        window.speechSynthesis.speak = utterance => window.speechCalls.push({ text: utterance.text, voice: utterance.voice.name, lang: utterance.lang });
      }, test.voices);
      const page = await context.newPage();
      await page.goto(base + '#/vocabulary/food');
      const control = page.getByRole('button', { name: '朗讀：물', exact: true });
      await control.waitFor();
      if (test.delayed) {
        assert(await control.isDisabled());
        await page.evaluate(voices => { window.testVoices = voices; window.speechSynthesis.dispatchEvent(new Event('voiceschanged')); }, test.delayed);
      }
      if (test.expected) {
        assert(await control.isEnabled());
        const note = await page.locator('[data-speech-note]').innerText();
        assert(note.includes(test.expected));
        assert(note.includes(test.google ? '目前使用 Google 韓文語音' : '未提供 Google 韓文語音'));
        await control.click();
        const calls = await page.evaluate(() => window.speechCalls);
        assert.equal(calls.at(-2), 'cancel');
        assert.deepEqual(calls.at(-1), { text: '물', voice: test.expected, lang: 'ko-KR' });
      } else {
        assert(await control.isDisabled());
        assert.match(await page.locator('[data-speech-note]').innerText(), /暫不支援/);
      }
      console.log('PASS ' + test.name); passed++;
      await context.close();
    }
    console.log(`${passed}/${cases.length} speech checks passed (simulated browser voices).`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
