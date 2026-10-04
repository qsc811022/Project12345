import { isValidQuestion } from './data.js';
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createQuiz(questions, bank, random = Math.random) {
  if (!['alphabet', 'vocabulary', 'sentences', 'mixed'].includes(bank)) throw new Error('請選擇有效題庫。');
  const candidates = questions.filter(q => bank === 'mixed' || q.bank === bank);
  if (candidates.length < 10 || candidates.some(q => !isValidQuestion(q)) || new Set(candidates.map(q => q.id)).size !== candidates.length) throw new Error('這個題庫暫時沒有足夠的有效題目，請選擇其他題庫。');
  const selected = shuffle(candidates, random).slice(0, 10).map(q => ({ ...q, options: shuffle(q.options, random) }));
  const answers = [];
  let index = 0;
  let finished = false;
  return {
    bank, questions: selected, answers,
    get index() { return index; },
    get current() { return selected[index]; },
    get submitted() { return answers.length > index; },
    get finished() { return finished; },
    submit(optionId) {
      if (finished || answers.length > index || !selected[index].options.some(o => o.id === optionId)) return false;
      answers.push({ questionId: selected[index].id, optionId, correct: optionId === selected[index].correctOptionId }); return true;
    },
    next() { if (answers.length <= index || finished) return false; if (index === 9) finished = true; else index++; return true; },
    result(now = new Date()) {
      if (!finished) return null;
      const correct = answers.filter(a => a.correct).length;
      return { score: Math.round(correct / selected.length * 100), correct, total: selected.length, completedAt: now.toISOString() };
    }
  };
}
