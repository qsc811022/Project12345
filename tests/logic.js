import { validateDataset, isValidQuestion, lessonCatalog } from '../assets/js/data.js';
import { createQuiz, shuffle } from '../assets/js/quiz.js';
import { emptyState, sanitizeState, updateBestScore, createStorage, STORAGE_KEY } from '../assets/js/storage.js';
import { parseRoute } from '../assets/js/router.js';
export function runChecks(data) {
  const results = [];
  const assert = (condition, message = '條件不符合') => { if (!condition) throw new Error(message); };
  const throws = fn => { let failed = false; try { fn(); } catch { failed = true; } assert(failed, '應拒絕無效輸入'); };
  const check = (name, fn) => { try { fn(); results.push({ name, passed: true }); } catch (e) { results.push({ name, passed: false, message: e.message }); } };
  const catalog = { lessons: lessonCatalog(data).map(l => l.id), grammar: data.grammar.map(g => g.id), words: data.vocabulary.flatMap(t => t.words.map(w => w.id)) };
  const result = { score: 80, correct: 8, total: 10, completedAt: '2026-10-04T10:00:00.000Z' };
  check('教材所有資料契約有效，ID 不重複', () => { for (const [kind, items] of Object.entries(data)) { const warnings = []; assert(validateDataset(kind, items, m => warnings.push(m)).length === items.length); assert(!warnings.length); } });
  check('教材數量：15 單元、40 字母、50 單字、15 句型、30 文法', () => {
    assert(catalog.lessons.length === 15); assert(new Set([...catalog.lessons, ...catalog.grammar]).size === 45);
    assert(data.alphabet.slice(0, 3).flatMap(l => l.items).length === 40);
    assert(data.vocabulary.length === 5 && data.vocabulary.every(t => t.words.length >= 10));
    assert(data.sentences.length === 5 && data.sentences.every(c => c.sentences.length >= 3));
    assert(data.grammar.length >= 30 && data.grammar.every(g => g.examples.length >= 2));
    assert(['alphabet', 'vocabulary', 'sentences'].every(b => data.quizzes.filter(q => q.bank === b).length >= 15));
  });
  check('無效欄位、重複 ID 與錯誤父層 ID 會被略過', () => {
    assert(validateDataset('quizzes', [data.quizzes[0], data.quizzes[0], { id: 'bad' }], () => {}).length === 1);
    const changed = structuredClone(data.vocabulary[0]); changed.words[0].topicId = 'wrong';
    assert(validateDataset('vocabulary', [changed], () => {}).length === 0);
    const alpha = structuredClone(data.alphabet[0]); alpha.items.push({ ...alpha.items[0] });
    assert(validateDataset('alphabet', [alpha], () => {}).length === 0);
  });
  check('每個題庫每回抽 10 題且不重複', () => {
    for (const bank of ['alphabet', 'vocabulary', 'sentences', 'mixed']) for (let i = 0; i < 20; i++) { const q = createQuiz(data.quizzes, bank); assert(q.questions.length === 10 && new Set(q.questions.map(x => x.id)).size === 10); assert(bank === 'mixed' || q.questions.every(q => q.bank === bank)); }
  });
  check('選項打亂後仍依 ID 判定，原始題庫不被修改', () => {
    const snapshot = JSON.stringify(data.quizzes); const quiz = createQuiz(data.quizzes, 'alphabet', () => 0);
    assert(quiz.current.options[0].id !== quiz.current.correctOptionId);
    assert(quiz.submit(quiz.current.correctOptionId)); assert(quiz.answers[0].correct); assert(JSON.stringify(data.quizzes) === snapshot);
    assert(shuffle([1, 2, 3], () => 0).join(',') === '2,3,1');
  });
  check('重複提交與無效選項不計分，未答題不能前進', () => {
    const quiz = createQuiz(data.quizzes, 'mixed'); assert(!quiz.next()); assert(!quiz.submit('missing')); assert(quiz.submit(quiz.current.correctOptionId)); assert(!quiz.submit(quiz.current.correctOptionId)); assert(quiz.answers.length === 1);
  });
  check('未完成無成績；完成 8/10 計 80 分，不能再次提交', () => {
    const quiz = createQuiz(data.quizzes, 'mixed'); assert(quiz.result() === null);
    for (let i = 0; i < 10; i++) { quiz.submit(i < 8 ? quiz.current.correctOptionId : quiz.current.options.find(o => o.id !== quiz.current.correctOptionId).id); quiz.next(); }
    assert(quiz.finished); assert(quiz.result().score === 80 && quiz.result().correct === 8); assert(!quiz.submit(quiz.current.correctOptionId)); assert(!quiz.next());
  });
  check('題庫不足、資料無效、題目重複均不啟動測驗', () => {
    throws(() => createQuiz(data.quizzes.slice(0, 9), 'alphabet'));
    throws(() => createQuiz([...data.quizzes, data.quizzes[0]], 'alphabet'));
    const invalid = { ...data.quizzes[0], correctOptionId: 'missing' }; assert(!isValidQuestion(invalid)); throws(() => createQuiz([invalid, ...data.quizzes.slice(1)], 'mixed'));
  });
  check('最佳成績只在分數提高時更新', () => {
    const state = emptyState(); assert(updateBestScore(state, 'mixed', result)); assert(!updateBestScore(state, 'mixed', { ...result, score: 70, correct: 7 })); assert(!updateBestScore(state, 'mixed', { ...result, completedAt: '2026-10-05T00:00:00Z' })); assert(state.quizBestScores.mixed.completedAt === result.completedAt); assert(updateBestScore(state, 'mixed', { ...result, score: 100, correct: 10 }));
  });
  check('清除失效 ID、收藏去重，文法不混入單元', () => {
    const raw = emptyState(); raw.completedLessonIds = [catalog.lessons[0], catalog.lessons[0], catalog.grammar[0], 'missing']; raw.favoriteWordIds = [catalog.words[0], catalog.words[0], 'missing']; raw.lastLessonId = 'missing';
    const clean = sanitizeState(raw, catalog); assert(clean.completedLessonIds.length === 1 && clean.favoriteWordIds.length === 1 && clean.lastLessonId === null);
  });
  check('無效成績不載入；損壞或不相容的狀態被拒絕', () => {
    const raw = emptyState(); raw.quizBestScores = { mixed: { ...result, score: 95 }, alphabet: result }; const clean = sanitizeState(raw, catalog); assert(!clean.quizBestScores.mixed && clean.quizBestScores.alphabet.score === 80);
    throws(() => sanitizeState({ schemaVersion: 2 }, catalog)); throws(() => sanitizeState({ ...emptyState(), favoriteWordIds: null }, catalog));
  });
  check('損壞 JSON 復原且提示；完成、收藏與文法可持久化', () => {
    const map = new Map([[STORAGE_KEY, '{broken']]); const notices = []; const backend = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
    const store = createStorage(catalog, m => notices.push(m), () => backend); assert(notices.length === 1); store.toggle('completedLessonIds', catalog.lessons[0]); store.toggle('readGrammarIds', catalog.grammar[0]); store.toggle('favoriteWordIds', catalog.words[0]); store.visit(catalog.grammar[0]);
    const reloaded = createStorage(catalog, () => {}, () => backend); assert(reloaded.state.completedLessonIds.length === 1 && reloaded.state.readGrammarIds.length === 1 && reloaded.state.favoriteWordIds.length === 1 && reloaded.state.lastLessonId === catalog.grammar[0]);
  });
  check('儲存被拒絕時退回記憶體並提示', () => {
    const notices = []; const store = createStorage(catalog, m => notices.push(m), () => { throw new Error('denied'); }); store.toggle('favoriteWordIds', catalog.words[0]); assert(store.state.favoriteWordIds.length === 1 && notices.length === 1);
    const full = createStorage(catalog, m => notices.push(m), () => ({ getItem: () => null, setItem: () => { throw new Error('full'); } })); full.toggle('completedLessonIds', catalog.lessons[0]); assert(full.state.completedLessonIds.length === 1 && notices.length === 2);
  });
  check('重設只刪除本站 key', () => {
    const map = new Map([['other-app', 'keep']]); const backend = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
    const store = createStorage(catalog, () => {}, () => backend); store.toggle('favoriteWordIds', catalog.words[0]); store.reset(); assert(!map.has(STORAGE_KEY)); assert(map.get('other-app') === 'keep'); assert(!store.state.favoriteWordIds.length);
  });
  check('空 hash、深層路由與無效路由解析', () => { assert(parseRoute('').page === 'home'); assert(parseRoute('#/alphabet/basic-consonants').id === 'basic-consonants'); assert(parseRoute('#/grammar/one/two').page === 'not-found'); });
  return results;
}
