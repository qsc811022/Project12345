import { el, announce } from './components/dom.js';
let voice = null;
let ready = false;
let initialized = false;
const available = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
export function isGoogleVoice(candidate) {
  return /\bgoogle\b/i.test(`${candidate?.name || ''} ${candidate?.voiceURI || ''}`);
}
export function selectKoreanVoice(voices) {
  const korean = voices.filter(candidate => /^ko(?:[-_]|$)/i.test(candidate.lang));
  return korean.find(isGoogleVoice) || korean.find(candidate => candidate.default) || korean[0] || null;
}
function voiceDescription() {
  if (!voice) return ready ? '此裝置暫不支援韓文朗讀。你仍可閱讀教材並完成練習。' : '正在檢查裝置的韓文語音…';
  const name = voice.name || '裝置韓文語音';
  return isGoogleVoice(voice)
    ? `目前使用 Google 韓文語音：${name}。點擊「朗讀」聽聽看。`
    : `此瀏覽器未提供 Google 韓文語音，目前使用：${name}。`;
}
function buttonTitle() {
  return voice ? `朗讀韓文 · ${voice.name || '裝置韓文語音'}` : ready ? '此裝置暫不支援韓文朗讀' : '正在檢查韓文語音';
}
function refresh() {
  voice = available() ? selectKoreanVoice(window.speechSynthesis.getVoices()) : null;
  document.querySelectorAll('[data-speak]').forEach(node => { node.disabled = !voice; node.title = buttonTitle(); });
  document.querySelectorAll('[data-speech-note]').forEach(node => { node.textContent = voiceDescription(); });
}
export function initSpeech() {
  if (initialized) return;
  initialized = true;
  if (!available()) { ready = true; refresh(); return; }
  window.speechSynthesis.addEventListener('voiceschanged', () => { ready = true; refresh(); });
  if (window.speechSynthesis.getVoices().length) ready = true;
  refresh();
  setTimeout(() => { ready = true; refresh(); }, 1800);
}
export function speakButton(text) {
  return el('button', { class: 'button small secondary', type: 'button', 'data-speak': '', disabled: !voice, 'aria-label': `朗讀：${text}`, title: buttonTitle(), onClick: () => {
    refresh();
    if (!voice || !available()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'ko-KR'; utterance.voice = voice; utterance.rate = .85;
    utterance.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error)) announce('這次朗讀未能播放，請再試一次。'); };
    window.speechSynthesis.speak(utterance);
  } }, '▷ 朗讀');
}
export function speechNote() { return el('p', { class: 'speech-note', 'data-speech-note': '', role: 'status' }, voiceDescription()); }
export function stopSpeech() { if (available()) window.speechSynthesis.cancel(); }
