import { el, link } from './dom.js';

export function bossPortrait(className = '') {
  return el('img', { class: `boss-portrait ${className}`, src: './assets/images/boss-dragon.svg', alt: '長著金色犄角和翅膀、抱著魔法書的紫色字母龍 BOSS', width: 440, height: 380 });
}

export function bossHealth(initial = 10, max = 10) {
  const value = el('strong', { class: 'boss-hp-value' });
  const segments = Array.from({ length: max }, () => el('span', { class: 'boss-hp-segment', 'aria-hidden': 'true' }, '♥'));
  const meter = el('div', { class: 'boss-hp-meter', role: 'progressbar', 'aria-label': 'BOSS 剩餘血量', 'aria-valuemin': 0, 'aria-valuemax': max }, segments);
  const node = el('div', { class: 'boss-health' }, el('div', { class: 'boss-hp-caption' }, el('span', {}, '字母龍血量'), value), meter);
  function update(hp) {
    value.textContent = `HP ${hp} / ${max}`;
    meter.setAttribute('aria-valuenow', String(hp));
    meter.setAttribute('aria-valuetext', hp === 0 ? '0 滴血，BOSS 已擊敗' : `剩餘 ${hp} 滴血，共 ${max} 滴`);
    node.classList.toggle('depleted', hp === 0);
    segments.forEach((segment, index) => segment.classList.toggle('empty', index >= hp));
  }
  update(initial);
  return { node, update };
}

export function bossInvitation() {
  return el('section', { class: 'section boss-invitation' },
    el('div', { class: 'boss-art' }, el('span', { class: 'boss-orbit', 'aria-hidden': 'true' }), bossPortrait()),
    el('div', { class: 'boss-copy' }, el('p', { class: 'eyebrow' }, 'BOSS ENCOUNTER / 怪獸登場'),
      el('h2', { class: 'section-title' }, '字母龍，等你來挑戰！'),
      el('p', {}, '字母龍有 10 滴血，答對一題就能扣掉 1 滴！帶上剛學會的知識，10 題全答對就能擊敗牠。答錯也能看解說，下回合再挑戰。'),
      el('div', { class: 'boss-tags' }, el('span', {}, '♥ 10 滴血'), el('span', {}, '答對 −1 HP'), el('span', {}, '不限時間')),
      link('前往 BOSS 競技場 →', '#/quiz')));
}
