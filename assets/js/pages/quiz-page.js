import { el, mixedText, hero, button, link, progressBar, announce } from '../components/dom.js';
import { createQuiz } from '../quiz.js';
import { bossPortrait, bossHealth } from '../components/boss.js';
export const BANKS = { alphabet: '字母辨識', vocabulary: '單字意思', sentences: '句型理解', mixed: '綜合練習' };
export function quizPage(ctx) {
  const body = el('section', { class: 'reading' });
  let selectedBank = 'mixed';
  let quiz = null;
  const remainingHp = () => quiz.questions.length - quiz.answers.filter(answer => answer.correct).length;
  const heroHealth = bossHealth();
  const bossLine = el('p', { class: 'boss-dialogue' }, '「準備好了嗎？讓我看看你的韓文實力！」');
  const intro = hero('BOSS ARENA / 練習競技場', '字母龍的知識考驗', '選擇你的練習領域，用 10 題回顧冒險途中學會的韓文。答錯也沒關係，看完解說再前進。');
  intro.classList.add('boss-hero');
  const introCopy = el('div', { class: 'boss-copy' }, ...Array.from(intro.childNodes));
  introCopy.append(heroHealth.node);
  intro.replaceChildren(introCopy, el('div', { class: 'boss-art' }, el('span', { class: 'boss-orbit', 'aria-hidden': 'true' }), bossPortrait(), bossLine));
  function setup() {
    bossLine.textContent = '「準備好了嗎？讓我看看你的韓文實力！」';
    intro.classList.remove('boss-cheer', 'boss-defeated');
    heroHealth.update(10);
    const fieldset = el('fieldset', {}, el('legend', {}, '選擇今天想練習的內容'));
    fieldset.append(el('div', { class: 'quiz-banks' }, Object.entries(BANKS).map(([id, title]) => el('label', { class: 'quiz-bank' }, el('input', { type: 'radio', name: 'bank', value: id, checked: selectedBank === id, onChange: () => { selectedBank = id; } }), el('span', {}, title, el('small', {}, id === 'mixed' ? '三種題庫隨機出題' : `${ctx.data.quizzes.filter(q => q.bank === id).length} 題題庫`))))));
    const error = el('p', { role: 'alert', class: 'notice', hidden: true });
    body.replaceChildren(el('div', { class: 'quiz-brief', 'aria-label': '練習規則' }, el('span', {}, '♥ BOSS 10 滴血'), el('span', {}, '答對 −1 HP'), el('span', {}, '∞ 不限時間')), fieldset, el('p', { class: 'muted' }, '每回合 10 題。答對一題扣怪獸 1 滴血，答錯不扣血；全答對就能擊敗 BOSS！回合結束仍有血量時，可以看完錯題再重新挑戰。完整完成才記錄成績。'), error, button('開始測驗 →', () => {
      try { quiz = createQuiz(ctx.data.quizzes, selectedBank); ctx.quizActive = true; question(); }
      catch (e) { error.hidden = false; error.textContent = e.message; }
    }));
  }
  function question() {
    const q = quiz.current;
    intro.classList.remove('boss-cheer');
    bossLine.textContent = `「第 ${quiz.index + 1} 題，慢慢想，我等你！」`;
    const battleReply = el('p', { class: 'battle-reply' }, bossLine.textContent);
    const health = bossHealth(remainingHp(), quiz.questions.length);
    const damage = el('span', { class: 'boss-damage', hidden: true, 'aria-hidden': 'true' }, '−1 HP');
    const encounter = el('div', { class: 'battle-status' }, el('div', { class: 'battle-avatar' }, bossPortrait(), damage), el('div', { class: 'battle-details' }, el('strong', {}, 'BOSS · 字母龍'), health.node, battleReply));
    let selectedId = null;
    const questionTitle = el('h2', { class: 'quiz-question', tabindex: '-1', id: 'quiz-question' }, mixedText(q.prompt));
    const options = el('div', { class: 'quiz-options', role: 'group', 'aria-labelledby': 'quiz-question' });
    const feedback = el('div', { class: 'quiz-feedback', role: 'status', 'aria-live': 'polite' });
    const submit = button('送出答案', () => {
      if (!selectedId || !quiz.submit(selectedId)) return;
      const answer = q.options.find(o => o.id === q.correctOptionId);
      const correct = selectedId === q.correctOptionId;
      const hp = remainingHp();
      heroHealth.update(hp); health.update(hp);
      damage.hidden = !correct;
      encounter.classList.toggle('boss-hit', correct);
      encounter.classList.toggle('boss-defeated', hp === 0);
      intro.classList.toggle('boss-defeated', hp === 0);
      intro.classList.toggle('boss-cheer', correct);
      bossLine.textContent = hp === 0 ? '「你把我擊敗了！韓文實力真不錯！」' : correct ? `「命中了！我還剩 ${hp} 滴血！」` : '「這次沒命中，看看解說再前進！」';
      battleReply.textContent = bossLine.textContent;
      encounter.classList.toggle('boss-cheer', correct);
      options.querySelectorAll('button').forEach(node => {
        node.disabled = true;
        if (node.dataset.option === q.correctOptionId) { node.classList.add('correct'); node.append(el('span', { class: 'sr-only' }, '（正確答案）')); }
        else if (node.dataset.option === selectedId) node.classList.add('incorrect');
      });
      feedback.className = `quiz-feedback notice ${correct ? 'success' : ''}`;
      feedback.replaceChildren(el('strong', {}, correct ? hp === 0 ? '✓ 最後一擊！BOSS 已被擊敗！' : `✓ 答對了！造成 1 點傷害，BOSS 剩餘 ${hp} 滴血。` : `✕ 這次沒命中，BOSS 仍有 ${hp} 滴血。`), el('p', {}, '正確答案：', mixedText(answer.text)), el('p', {}, mixedText(q.explanation)));
      const next = button(quiz.index === 9 ? '查看結果 →' : '下一題 →', () => { quiz.next(); if (quiz.finished) result(); else question(); });
      submit.replaceWith(next); next.focus();
    });
    submit.disabled = true; submit.classList.add('quiz-submit');
    options.append(...q.options.map((option, index) => el('button', { type: 'button', class: 'quiz-option', 'data-option': option.id, 'aria-pressed': 'false', onClick: event => {
      if (quiz.submitted) return;
      selectedId = option.id;
      options.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.option === selectedId)));
      event.currentTarget.focus(); submit.disabled = false;
    } }, el('span', { class: 'option-letter', 'aria-hidden': 'true' }, String.fromCharCode(65 + index)), mixedText(option.text))));
    body.replaceChildren(encounter, el('div', { class: 'quiz-header' }, el('span', {}, BANKS[quiz.bank]), el('span', {}, `第 ${quiz.index + 1} 題 / 10`)), progressBar(quiz.index, 10, '作答進度'), questionTitle, options, feedback, submit);
    questionTitle.focus({ preventScroll: true });
    body.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function result() {
    ctx.quizActive = false;
    const summary = quiz.result();
    const hp = remainingHp();
    const defeated = hp === 0;
    intro.classList.add('boss-cheer');
    bossLine.textContent = defeated ? '「你把我擊敗了！韓文實力真不錯！」' : `「我還剩 ${hp} 滴血！複習後再來挑戰吧！」`;
    const best = ctx.store.record(quiz.bank, summary);
    const title = el('h2', { tabindex: '-1' }, defeated ? '擊敗 BOSS！10 題全部命中！' : `回合完成！BOSS 還剩 ${hp} 滴血。`);
    const review = el('div', { class: 'stack' });
    quiz.answers.forEach((answer, index) => {
      if (answer.correct) return;
      const q = quiz.questions[index];
      review.append(el('article', { class: 'card review-card' }, el('span', { class: 'number' }, `QUESTION ${String(index + 1).padStart(2, '0')}`), el('h3', {}, mixedText(q.prompt)), el('p', {}, '你的答案：', mixedText(q.options.find(o => o.id === answer.optionId).text)), el('p', {}, '正確答案：', mixedText(q.options.find(o => o.id === q.correctOptionId).text)), el('p', { class: 'muted' }, mixedText(q.explanation))));
    });
    body.replaceChildren(el('div', { class: `card result-card${defeated ? ' boss-victory' : ''}` }, el('p', { class: 'eyebrow' }, defeated ? 'BOSS DEFEATED / 挑戰成功' : 'ROUND COMPLETE / 再接再厲'), title, bossHealth(hp, summary.total).node, el('div', { class: 'result-score' }, String(summary.score)), el('p', {}, `答對 ${summary.correct} / ${summary.total} 題`), el('p', { class: 'muted' }, best ? '✓ 已記錄本題庫的最佳成績' : `本題庫最佳成績：${ctx.store.state.quizBestScores[quiz.bank].score} 分`), el('div', { class: 'actions' }, button('重新測驗 →', () => { setup(); body.querySelector('input').focus(); }), link('我的學習', '#/progress', true))), el('h2', {}, '錯題回顧'), review.childElementCount ? review : el('p', { class: 'notice' }, '這次全部答對！也可以挑戰其他題庫。'));
    title.focus(); announce(`測驗完成，${summary.score} 分，答對 ${summary.correct} 題。${defeated ? '已擊敗 BOSS！' : `BOSS 剩餘 ${hp} 滴血。`}`);
  }
  setup();
  return { title: 'BOSS 練習競技場', nodes: [intro, body] };
}
