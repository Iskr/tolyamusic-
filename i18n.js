// Локализация RU/EN. Русский — исходный текст страницы; для EN текст подменяется по словарю.
(function () {
  if (window.__tmI18n) return;
  window.__tmI18n = true;
  const KEY = 'tm_lang';
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (!lang) lang = /^ru|^uk|^be|^kk/i.test(navigator.language || '') ? 'ru' : 'en';
  window.TM_LANG = lang;
  const D = (window.TM_DICT = window.TM_DICT || {});
  const R = (window.TM_RULES = window.TM_RULES || []);
  const TG = '#contact';

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  function tr(s) {
    const k = norm(s);
    if (!k || !/[А-Яа-яЁё₽]/.test(k)) return null;
    if (D[k] != null) return D[k];
    for (const [re, fn] of R) { const m = k.match(re); if (m) { const v = typeof fn === 'function' ? fn(m) : k.replace(re, fn); if (v != null) return v; } }
    if (k.includes(' · ')) {
      const parts = k.split(' · ');
      const out = parts.map((p) => (/[А-Яа-яЁё]/.test(p) ? tr(p) : p));
      if (out.every((x) => x != null)) return out.join(' · ');
    }
    return null;
  }
  function doText(n) {
    const v = n.nodeValue;
    const out = tr(v);
    if (out == null) return;
    const lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
    const nv = lead + out + tail;
    if (nv !== v) n.nodeValue = nv;
  }
  function doEl(el) {
    for (const a of ['alt', 'placeholder', 'title', 'aria-label']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) { const o = tr(v); if (o != null && o !== v) el.setAttribute(a, o); }
    }
    if (el.tagName === 'A' && /yookassa\.ru/.test(el.getAttribute('href') || '')) {
      el.setAttribute('href', TG);
      el.removeAttribute('target');
      if (/[А-Яа-я]/.test(el.textContent) || el.textContent.trim() === 'Pay') el.textContent = 'Contact me';
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    doEl(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const p = n.parentNode; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue; doText(n); }
      else doEl(n);
    }
  }
  function switcher() {
    const header = document.querySelector('header');
    if (!header || header.querySelector('[data-lang-switch]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-lang-switch', '');
    b.textContent = lang === 'ru' ? 'EN' : 'RU';
    b.title = lang === 'ru' ? 'English version' : 'Русская версия';
    b.style.cssText = 'padding:8px 12px;border:1px solid currentColor;border-radius:100px;background:transparent;color:inherit;font:500 12px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;cursor:pointer;opacity:.8';
    b.onclick = () => { try { localStorage.setItem(KEY, lang === 'ru' ? 'en' : 'ru'); } catch (e) {} location.reload(); };
    const cta = header.lastElementChild;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:10px';
    header.insertBefore(wrap, cta);
    wrap.appendChild(b);
    wrap.appendChild(cta);
  }
  let queued = false;
  const pending = new Set();
  function flush() { queued = false; pending.forEach(walk); pending.clear(); switcher(); }
  function start() {
    switcher();
    if (lang !== 'en') return;
    document.documentElement.lang = 'en';
    walk(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') pending.add(m.target);
        else if (m.type === 'attributes') pending.add(m.target);
        else m.addedNodes.forEach((n) => pending.add(n));
      }
      if (!queued) { queued = true; requestAnimationFrame(flush); }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['alt', 'placeholder', 'title', 'href'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  let tries = 0;
  const iv = setInterval(() => { switcher(); if (document.querySelector('[data-lang-switch]') || ++tries > 40) clearInterval(iv); }, 150);
})();
