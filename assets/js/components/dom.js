export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child !== null && child !== undefined && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const ko = (value, tag = 'span', attrs = {}) => el(tag, { lang: 'ko', ...attrs }, value);
export function mixedText(value) {
  const fragment = document.createDocumentFragment();
  for (const part of value.split(/([\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]+(?:[ /·]+[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]+)*)/g)) fragment.append(/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(part) ? ko(part) : document.createTextNode(part));
  return fragment;
}
export const link = (label, href, secondary = false) => el('a', { class: `button${secondary ? ' secondary' : ''}`, href }, mixedText(label));
export const button = (label, onClick, secondary = false) => el('button', { type: 'button', class: `button${secondary ? ' secondary' : ''}`, onClick }, label);
export const announce = text => { document.getElementById('announcer').textContent = text; };
export function hero(eyebrow, title, description, children = []) {
  return el('section', { class: 'page-hero' }, el('p', { class: 'eyebrow' }, eyebrow), el('h1', { class: 'page-title', tabindex: '-1' }, mixedText(title)), el('p', { class: 'description' }, mixedText(description)), ...children);
}
export function heading(number, title, description) { return el('div', { class: 'section-heading' }, el('p', { class: 'eyebrow' }, number), el('h2', { class: 'section-title' }, title), description && el('p', { class: 'muted' }, mixedText(description))); }
export function progressBar(done, total, label = '完成進度') {
  const percent = total ? Math.round(done / total * 100) : 0;
  const fill = el('div', { class: 'progress-fill' }); fill.style.width = `${percent}%`;
  return el('div', {}, el('div', { class: 'progress-caption' }, el('span', {}, label), el('span', {}, `${done} / ${total}`)), el('div', { class: 'progress-track', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done) }, fill));
}
export function emptyState(title, description, action) { return el('div', { class: 'empty-state' }, el('h2', {}, title), el('p', { class: 'muted' }, description), action); }
export function confirmAction(title, message, confirmLabel = '確定') {
  const dialog = document.getElementById('confirm-dialog');
  const previous = document.activeElement;
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-description').textContent = message;
  const yes = document.getElementById('dialog-confirm');
  const no = document.getElementById('dialog-cancel');
  yes.textContent = confirmLabel;
  return new Promise(resolve => {
    const abort = new AbortController();
    let decided = false;
    const finish = value => {
      if (decided) return;
      decided = true; abort.abort(); dialog.close(); document.body.classList.remove('dialog-open');
      if (previous?.isConnected) previous.focus(); resolve(value);
    };
    yes.addEventListener('click', () => finish(true), { signal: abort.signal });
    no.addEventListener('click', () => finish(false), { signal: abort.signal });
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); }, { signal: abort.signal });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) finish(false); } }, { signal: abort.signal });
    document.body.classList.add('dialog-open'); dialog.showModal(); no.focus();
  });
}
