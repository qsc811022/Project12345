import { el, link } from './dom.js';

export function bossPortrait(className = '') {
  return el('img', { class: `boss-portrait ${className}`, src: './assets/images/boss-dragon.svg', alt: '長著金色犄角和翅膀、抱著魔法書的紫色字母龍 BOSS', width: 440, height: 380 });
}

export function bossInvitation() {
  return el('section', { class: 'section boss-invitation' },
    el('div', { class: 'boss-art' }, el('span', { class: 'boss-orbit', 'aria-hidden': 'true' }), bossPortrait()),
    el('div', { class: 'boss-copy' }, el('p', { class: 'eyebrow' }, 'BOSS ENCOUNTER / 怪獸登場'),
      el('h2', { class: 'section-title' }, '字母龍，等你來挑戰！'),
      el('p', {}, '這隻守著魔法書的怪獸，最喜歡考冒險家的韓文。帶上剛學會的知識，來一場 10 題的練習對決。'),
      el('div', { class: 'boss-tags' }, el('span', {}, '10 題練習'), el('span', {}, '不限時間'), el('span', {}, '答題後有解說')),
      link('前往 BOSS 競技場 →', '#/quiz')));
}
