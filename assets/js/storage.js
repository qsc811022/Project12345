export const STORAGE_KEY = 'korean-learning:v1';
export const emptyState = () => ({ schemaVersion: 1, completedLessonIds: [], readGrammarIds: [], favoriteWordIds: [], quizBestScores: {}, lastLessonId: null });
const banks = ['alphabet', 'vocabulary', 'sentences', 'mixed'];
export function validScore(value) {
  return value && Number.isInteger(value.score) && Number.isInteger(value.correct) && value.total === 10
    && value.correct >= 0 && value.correct <= 10 && value.score === value.correct * 10
    && typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt));
}
export function sanitizeState(raw, catalog) {
  if (!raw || typeof raw !== 'object' || raw.schemaVersion !== 1) throw new Error('儲存格式不相容。');
  const state = emptyState();
  for (const [key, ids] of [['completedLessonIds', catalog.lessons], ['readGrammarIds', catalog.grammar], ['favoriteWordIds', catalog.words]]) {
    if (!Array.isArray(raw[key])) throw new Error('儲存資料不完整。');
    state[key] = [...new Set(raw[key].filter(id => ids.includes(id)))];
  }
  if (!raw.quizBestScores || typeof raw.quizBestScores !== 'object' || Array.isArray(raw.quizBestScores)) throw new Error('成績格式無效。');
  for (const bank of banks) if (validScore(raw.quizBestScores[bank])) state.quizBestScores[bank] = { ...raw.quizBestScores[bank] };
  if ([...catalog.lessons, ...catalog.grammar].includes(raw.lastLessonId)) state.lastLessonId = raw.lastLessonId;
  return state;
}
export function updateBestScore(state, bank, result) {
  if (!banks.includes(bank) || !validScore(result)) return false;
  if (!state.quizBestScores[bank] || result.score > state.quizBestScores[bank].score) {
    state.quizBestScores[bank] = { ...result }; return true;
  }
  return false;
}
export function createStorage(catalog, notify = () => {}, getBackend = () => window.localStorage) {
  let state = emptyState();
  let backend;
  try {
    backend = getBackend();
    const saved = backend.getItem(STORAGE_KEY);
    if (saved !== null) {
      try { state = sanitizeState(JSON.parse(saved), catalog); }
      catch { notify('已儲存的資料無法讀取，已使用預設狀態。你可以繼續學習。'); }
    }
  } catch { backend = null; notify('目前無法存取瀏覽器儲存空間，進度只會保留在這次開啟期間。'); }
  const save = () => {
    if (!backend) return;
    try { backend.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { backend = null; notify('目前無法保存進度，操作只會保留在這次開啟期間。'); }
  };
  return {
    get state() { return state; },
    toggle(key, id) {
      const allowed = { completedLessonIds: catalog.lessons, readGrammarIds: catalog.grammar, favoriteWordIds: catalog.words };
      if (!allowed[key]?.includes(id)) return false;
      const on = !state[key].includes(id);
      state[key] = on ? [...state[key], id] : state[key].filter(value => value !== id);
      save(); return on;
    },
    visit(id) { if ([...catalog.lessons, ...catalog.grammar].includes(id)) { state.lastLessonId = id; save(); } },
    record(bank, result) { const updated = updateBestScore(state, bank, result); if (updated) save(); return updated; },
    reset() {
      state = emptyState();
      if (backend) try { backend.removeItem(STORAGE_KEY); } catch { notify('本次進度已清除，但無法刪除瀏覽器內的舊資料。請從瀏覽器設定清除本站資料。'); }
    }
  };
}
