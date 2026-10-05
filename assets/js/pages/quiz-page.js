import { el, mixedText, hero, button, link, progressBar, announce } from '../components/dom.js';
import { createQuiz } from '../quiz.js';
export const BANKS = { alphabet: '字母辨識', vocabulary: '單字意思', sentences: '句型理解', mixed: '綜合練習' };
export function quizPage(ctx) {
  const body = el('section', { class: 'reading' });
  let selectedBank = 'mixed';
  let quiz = null;
  function setup() {
    const fieldset = el('fieldset', {}, el('legend', {}, '選擇今天想練習的內容'));
    fieldset.append(el('div', { class: 'quiz-banks' }, Object.entries(BANKS).map(([id, title]) => el('label', { class: 'quiz-bank' }, el('input', { type: 'radio', name: 'bank', value: id, checked: selectedBank === id, onChange: () => { selectedBank = id; } }), el('span', {}, title, el('small', {}, id === 'mixed' ? '三種題庫隨機出題' : `${ctx.data.quizzes.filter(q => q.bank === id).length} 題題庫`))))));
    const error = el('p', { role: 'alert', class: 'notice', hidden: true });
    body.replaceChildren(el('div', { class: 'quiz-brief', 'aria-label': '練習規則' }, el('span', {}, '⚑ 每回合 10 題'), el('span', {}, '∞ 不限時間'), el('span', {}, '✦ 完成後記錄最佳成績')), fieldset, el('p', { class: 'muted' }, '每回合 10 題，不限時間。送出答案後會有解說，完整完成才記錄成績。'), error, button('開始測驗 →', () => {
      try { quiz = createQuiz(ctx.data.quizzes, selectedBank); ctx.quizActive = true; question(); }
      catch (e) { error.hidden = false; error.textContent = e.message; }
    }));
  }
  function question() {
    const q = quiz.current;
    let selectedId = null;
    const questionTitle = el('h2', { class: 'quiz-question', tabindex: '-1', id: 'quiz-question' }, mixedText(q.prompt));
    const options = el('div', { class: 'quiz-options', role: 'group', 'aria-labelledby': 'quiz-question' });
    const feedback = el('div', { class: 'quiz-feedback', role: 'status', 'aria-live': 'polite' });
    const submit = button('送出答案', () => {
      if (!selectedId || !quiz.submit(selectedId)) return;
      const answer = q.options.find(o => o.id === q.correctOptionId);
      const correct = selectedId === q.correctOptionId;
      options.querySelectorAll('button').forEach(node => {
        node.disabled = true;
        if (node.dataset.option === q.correctOptionId) { node.classList.add('correct'); node.append(el('span', { class: 'sr-only' }, '（正確答案）')); }
        else if (node.dataset.option === selectedId) node.classList.add('incorrect');
      });
      feedback.className = `quiz-feedback notice ${correct ? 'success' : ''}`;
      feedback.replaceChildren(el('strong', {}, correct ? '✓ 答對了！' : '✕ 再記住一次就好。'), el('p', {}, '正確答案：', mixedText(answer.text)), el('p', {}, mixedText(q.explanation)));
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
    body.replaceChildren(el('div', { class: 'quiz-header' }, el('span', {}, BANKS[quiz.bank]), el('span', {}, `第 ${quiz.index + 1} 題 / 10`)), progressBar(quiz.index, 10, '作答進度'), questionTitle, options, feedback, submit);
    questionTitle.focus();
  }
  function result() {
    ctx.quizActive = false;
    const summary = quiz.result();
    const best = ctx.store.record(quiz.bank, summary);
    const title = el('h2', { tabindex: '-1' }, '回合完成！又累積了一點實力。');
    const review = el('div', { class: 'stack' });
    quiz.answers.forEach((answer, index) => {
      if (answer.correct) return;
      const q = quiz.questions[index];
      review.append(el('article', { class: 'card review-card' }, el('span', { class: 'number' }, `QUESTION ${String(index + 1).padStart(2, '0')}`), el('h3', {}, mixedText(q.prompt)), el('p', {}, '你的答案：', mixedText(q.options.find(o => o.id === answer.optionId).text)), el('p', {}, '正確答案：', mixedText(q.options.find(o => o.id === q.correctOptionId).text)), el('p', { class: 'muted' }, mixedText(q.explanation))));
    });
    body.replaceChildren(el('div', { class: 'card result-card' }, el('p', { class: 'eyebrow' }, 'PRACTICE COMPLETE'), title, el('div', { class: 'result-score' }, String(summary.score)), el('p', {}, `答對 ${summary.correct} / ${summary.total} 題`), el('p', { class: 'muted' }, best ? '✓ 已記錄本題庫的最佳成績' : `本題庫最佳成績：${ctx.store.state.quizBestScores[quiz.bank].score} 分`), el('div', { class: 'actions' }, button('重新測驗 →', () => { setup(); body.querySelector('input').focus(); }), link('我的學習', '#/progress', true))), el('h2', {}, '錯題回顧'), review.childElementCount ? review : el('p', { class: 'notice' }, '這次全部答對！也可以挑戰其他題庫。'));
    title.focus(); announce(`測驗完成，${summary.score} 分，答對 ${summary.correct} 題。`);
  }
  setup();
  return { title: '練習競技場', nodes: [hero('PRACTICE ARENA / 練習競技場', '準備好，來一回合！', '選擇你的練習領域，用 10 題回顧冒險途中學會的韓文。答錯也沒關係，看完解說再前進。'), body] };
}
