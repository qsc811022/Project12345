const FILES = ['alphabet', 'vocabulary', 'sentences', 'grammar', 'quizzes'];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = value => typeof value === 'string' && value.trim().length > 0;
const fields = (value, keys) => value && typeof value === 'object' && keys.every(key => text(value[key]));
const list = value => Array.isArray(value) && value.length > 0;
export function isValidQuestion(q) {
  return fields(q, ['id', 'bank', 'prompt', 'correctOptionId', 'explanation']) && idPattern.test(q.id)
    && ['alphabet', 'vocabulary', 'sentences'].includes(q.bank) && list(q.options) && q.options.length >= 2
    && q.options.every(o => fields(o, ['id', 'text']) && idPattern.test(o.id))
    && new Set(q.options.map(o => o.id)).size === q.options.length
    && new Set(q.options.map(o => o.text)).size === q.options.length
    && q.options.some(o => o.id === q.correctOptionId);
}
export function validateDataset(kind, raw, warn = console.warn) {
  if (!Array.isArray(raw)) throw new Error(`${kind} 的資料格式不是陣列。`);
  const ids = new Set();
  const unique = value => fields(value, ['id']) && idPattern.test(value.id) && !ids.has(value.id);
  const children = (items, keys, parentKey, parentId) => list(items) && items.every(item => fields(item, ['id', ...keys]) && idPattern.test(item.id) && (!parentKey || item[parentKey] === parentId)) && new Set(items.map(i => i.id)).size === items.length;
  return raw.filter(item => {
    let valid = unique(item);
    if (valid && kind === 'alphabet') valid = fields(item, ['title', 'description']) && Number.isFinite(item.estimatedMinutes) && item.estimatedMinutes > 0 && children(item.items, ['character', 'type', 'explanation', 'example']);
    if (valid && kind === 'vocabulary') valid = fields(item, ['title', 'description']) && children(item.words, ['topicId', 'korean', 'meaningZh', 'exampleKo', 'exampleZh'], 'topicId', item.id);
    if (valid && kind === 'sentences') valid = fields(item, ['title']) && children(item.sentences, ['categoryId', 'korean', 'translationZh', 'situation', 'explanation', 'politeness'], 'categoryId', item.id);
    if (valid && kind === 'grammar') valid = fields(item, ['titleKo', 'meaningZh', 'category', 'attachRule', 'explanation']) && list(item.examples) && item.examples.length >= 2 && item.examples.every(e => fields(e, ['ko', 'zh']));
    if (valid && kind === 'quizzes') valid = isValidQuestion(item);
    const nested = item?.items || item?.words || item?.sentences || [];
    if (valid) valid = nested.every(child => !ids.has(child.id) && child.id !== item.id);
    if (!valid) { warn(`略過 ${kind} 中無效或重複的教材項目：${item?.id || '(無 ID)'}`); return false; }
    ids.add(item.id); nested.forEach(child => ids.add(child.id));
    return true;
  });
}
export async function loadData() {
  const entries = await Promise.all(FILES.map(async name => {
    const response = await fetch(new URL(`../../data/${name}.json`, import.meta.url));
    if (!response.ok) throw new Error(`無法讀取 ${name}（${response.status}）。`);
    const data = validateDataset(name, await response.json());
    if (!data.length && name !== 'quizzes') throw new Error(`${name} 沒有可用教材。`);
    return [name, data];
  }));
  return Object.fromEntries(entries);
}
export function lessonCatalog(data) {
  return ['alphabet', 'vocabulary', 'sentences'].flatMap(kind => data[kind].map(unit => ({ id: unit.id, title: unit.title, kind, route: `#/${kind}/${unit.id}` })));
}
