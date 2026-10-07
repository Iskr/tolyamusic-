// <tolya-cat mood="idle|listen|correct|wrong|combo|boss|bosswin|over" pulse="n" loop="1">
// Оригинальный маскот: покадровые позы (PNG без фона) + motion-слой.
(function () {
  if (customElements.get('tolya-cat')) return;
  const INK = '#1e1b16', PEACH = '#f4a582';
  const POSES = { f1: 'img/cat-f1.png', f2: 'img/cat-f2.png', f3: 'img/cat-f3.png', f4: 'img/cat-f4.png', w2: 'img/cat-w2.png', w3: 'img/cat-w3.png', w4: 'img/cat-w4.png', c2: 'img/cat-c2.png', c3: 'img/cat-c3.png', c4: 'img/cat-c4.png', b1: 'img/cat-b1.png', b2: 'img/cat-b2.png', b3: 'img/cat-b3.png', b4: 'img/cat-b4.png' };
  const SEQ = {
    correct: [['f2', 160], ['f3', 0]],
    over: [['f3', 700], ['f4', 0]],
    wrong: [['w2', 320], ['w3', 460], ['w4', 0]],
    combo: [['c2', 260], ['c3', 340], ['c4', 0]],
    bosswin: [['c3', 300], ['c4', 0]],
    boss: [['b1', 380], ['b2', 380], ['b3', 380], ['b4', 0]],
  };
  const POSE_OF = { idle: 'f1', listen: 'f1', wink: 'f2' };
  const LOOP_POSE = { idle: 'f1', wink: 'f2', correct: 'f3', cheer: 'f4' };
  const LOOP = [['idle', 4200], ['wink', 380], ['idle', 2600], ['correct', 2800], ['cheer', 2600], ['idle', 3600], ['wink', 380], ['idle', 1800]];
  const CSS = `
:host{display:block;width:100%;height:100%;position:relative}
.wrap{position:absolute;inset:0;overflow:hidden;border-radius:inherit}
.cam{position:absolute;inset:0;transform-origin:50% 88%;will-change:transform}
.pose{position:absolute;inset:0;opacity:0;transform-origin:50% 92%}
.pose img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 100%;user-select:none;-webkit-user-drag:none;transform-origin:50% 92%}
.wrap.old{background:transparent}
.pose.op img{object-fit:contain;object-position:50% 50%}
.pose[data-p=b3] img,.pose[data-p=b4] img{object-fit:cover;object-position:50% 50%}
.pose[data-p=f3] img{transform:scale(.97)}
.pose[data-p=f4] img{transform:scale(.88) translateY(-1%)}
.pose.on{opacity:1}
.pose.on.in{animation:squash .34s cubic-bezier(.3,1.4,.5,1)}
.wrap.lp .pose{transition:opacity .32s ease}
.wrap.lp.rd{background:#fcf7f1}
.wrap.lp .pose.on.in{animation:soft .7s cubic-bezier(.25,.8,.35,1)}
.wrap.lp.s-idle .cam{animation:breathe 4.8s ease-in-out infinite}
.wrap.lp.s-correct .cam{animation:leanSoft 1.1s cubic-bezier(.3,.9,.4,1)}
.wrap.lp.s-cheer .cam{animation:jumpSoft 1.1s cubic-bezier(.3,.8,.4,1)}
@keyframes soft{0%{transform:scale(1.015,.985)}100%{transform:none}}
@keyframes leanSoft{0%{transform:none}40%{transform:rotate(-1.2deg) translateX(-2px)}100%{transform:none}}
@keyframes jumpSoft{0%{transform:scale(1.02,.98)}40%{transform:translateY(-3.5%)}75%{transform:translateY(0) scale(1.01,.99)}100%{transform:none}}
.flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.flash.go{animation:flash .26s ease-out}
.vig{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 55%,rgba(224,121,79,0) 52%,rgba(224,121,79,.55) 100%)}
svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.v{display:none}
.s-listen .notes,.s-cheer .notes,.s-correct .spark,.s-over .spark,.s-cheer .spark,
.s-cheer .lines,.s-listen .eq{display:inline}
.s-idle .cam,.s-wink .cam{animation:breathe 3.2s ease-in-out infinite}
.s-listen .cam{animation:nod .545s ease-out infinite}
.s-correct .cam,.s-over .cam{animation:lean .6s cubic-bezier(.3,1.3,.5,1)}
.s-cheer .cam{animation:jump .62s cubic-bezier(.3,.9,.4,1)}
.s-combo .cam{animation:hop .45s ease-in-out .6s infinite}
.s-wrong .cam{animation:shake .45s ease-out .78s}
.s-boss .cam{animation:punch .32s ease-out 1.14s infinite}
.s-bosswin .cam{animation:jump .62s cubic-bezier(.3,.9,.4,1) .3s 2}
.n{animation:note 1.8s ease-in infinite}.n2{animation-delay:.6s}.n3{animation-delay:1.2s}
.sp{transform-box:fill-box;transform-origin:center;animation:spark .8s ease-out both}.sp2{animation-delay:.1s}.sp3{animation-delay:.2s}.sp4{animation-delay:.3s}
.bolt{animation:flick .25s steps(2) infinite}.bolt2{animation-delay:.12s}
.q{transform-box:fill-box;transform-origin:center bottom;animation:qm .45s ease-out both}
.ln{stroke-dasharray:26 400;animation:zip .45s linear infinite}
.ln:nth-child(2n){animation-delay:.15s}.ln:nth-child(3n){animation-delay:.3s}
.s-boss .ln{animation-duration:.3s}
.bar{transform-box:fill-box;transform-origin:bottom;animation:eq .545s ease-in-out infinite}
.s-combo .bar{animation-duration:.45s}.s-boss .bar{animation-duration:.32s}
@keyframes squash{0%{transform:scale(1.06,.92)}45%{transform:scale(.97,1.04)}100%{transform:none}}
@keyframes flash{0%{opacity:.5}100%{opacity:0}}
@keyframes desat{0%{filter:saturate(.35) brightness(.97)}100%{filter:none}}
@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.008,1.018) translateY(-1px)}}
@keyframes nod{0%{transform:scale(1.015,.975)}40%,100%{transform:none}}
@keyframes lean{0%{transform:none}35%{transform:rotate(-2.5deg) translateX(-4px) scale(1.03)}100%{transform:none}}
@keyframes jump{0%{transform:scale(1.05,.93)}30%{transform:translateY(-9%) scale(.97,1.04)}62%{transform:translateY(0) scale(1.04,.95)}82%{transform:scale(.99,1.01)}100%{transform:none}}
@keyframes hop{0%,100%{transform:scale(1.04,.95)}45%{transform:translateY(-5%) scale(.98,1.03) rotate(1.2deg)}}
@keyframes shake{0%,100%{transform:scale(1.07) translateX(0)}15%{transform:scale(1.07) translateX(-8px) rotate(-.8deg)}35%{transform:scale(1.07) translateX(7px) rotate(.8deg)}55%{transform:scale(1.07) translateX(-4px)}75%{transform:scale(1.07) translateX(2px)}}
@keyframes punch{0%{transform:scale(1.13) rotate(.6deg)}45%,100%{transform:scale(1.07) rotate(-.4deg)}}
@keyframes vig{0%{opacity:1}100%{opacity:.25}}
@keyframes note{0%{transform:translateY(12px);opacity:0}20%{opacity:1}100%{transform:translateY(-46px);opacity:0}}
@keyframes spark{0%{transform:scale(0) rotate(0)}50%{transform:scale(1.25) rotate(45deg)}100%{transform:scale(0) rotate(90deg)}}
@keyframes flick{0%{opacity:1}50%{opacity:.3}}
@keyframes qm{0%{transform:translateY(10px) scale(.5);opacity:0}60%{transform:translateY(-2px) scale(1.1);opacity:1}100%{transform:none;opacity:1}}
@keyframes zip{0%{stroke-dashoffset:60}100%{stroke-dashoffset:-140}}
@keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
`;
  const note = `<ellipse cx="0" cy="0" rx="7" ry="5.2" transform="rotate(-20)" fill="${INK}"/><rect x="5" y="-28" width="2.8" height="27" fill="${INK}"/><path d="M7.8 -28 Q18 -23 15 -11 Q13 -18 7.8 -19 Z" fill="${INK}"/>`;
  const star = `d="M0 -12 L2.8 -2.8 L12 0 L2.8 2.8 L0 12 L-2.8 2.8 L-12 0 L-2.8 -2.8 Z" fill="${PEACH}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`;
  const bolt = `d="M2 -22 L-10 3 L-1 3 L-6 22 L10 -6 L1 -6 L7 -22 Z" fill="#f2b544" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"`;
  const lines = [[-10, 60, 50, 110], [-10, 200, 44, 196], [-10, 330, 50, 288], [355, 50, 296, 104], [355, 190, 300, 192], [355, 320, 296, 284]]
    .map(([x1, y1, x2, y2]) => `<line class="ln" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const bars = Array.from({ length: 23 }, (_, i) => `<rect class="bar" style="animation-delay:-${((i * 0.071) % 0.5).toFixed(2)}s" x="${6 + i * 14.6}" y="366" width="9" height="${18 + ((i * 7) % 11)}" rx="2" fill="${PEACH}" stroke="${INK}" stroke-width="1.2"/>`).join('');
  const FX = `<svg viewBox="0 0 345 392" preserveAspectRatio="xMidYMax meet">
<g class="v eq">${bars}</g>
<g class="v lines">${lines}</g>
<g class="v notes">
  <g transform="translate(300 110)"><g class="n n1">${note}</g></g>
  <g transform="translate(36 180)"><g class="n n2">${note}</g></g>
  <g transform="translate(292 236)"><g class="n n3">${note}</g></g>
</g>
<g class="v qm"><g transform="translate(278 92)"><text class="q" x="0" y="0" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="54" fill="#e0794f" stroke="${INK}" stroke-width="1.6">?</text></g></g>
<g class="v spark">
  <g transform="translate(44 70)"><path class="sp" ${star}/></g>
  <g transform="translate(304 90)"><path class="sp sp2" ${star}/></g>
  <g transform="translate(34 236)"><path class="sp sp3" ${star}/></g>
  <g transform="translate(312 246)"><path class="sp sp4" ${star}/></g>
</g>
<g class="v bolts">
  <g transform="translate(30 120)"><path class="bolt" ${bolt}/></g>
  <g transform="translate(316 140)"><path class="bolt bolt2" ${bolt}/></g>
  <g transform="translate(40 300) scale(.8)"><path class="bolt bolt2" ${bolt}/></g>
  <g transform="translate(306 300) scale(.8)"><path class="bolt" ${bolt}/></g>
</g>
</svg>`;

  class TolyaCat extends HTMLElement {
    static get observedAttributes() { return ['mood', 'pulse', 'loop']; }
    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      const poses = Object.keys(POSES).map((k) => `<div class="pose${k.length > 2 ? ' op' : ''}" data-p="${k}"><img src="${POSES[k]}" alt=""${k === 'f1' ? '' : ' loading="lazy"'} draggable="false"/></div>`).join('');
      this._root.innerHTML = `<style>${CSS}</style><div class="wrap s-idle"><div class="cam">${poses}</div><div class="vig"></div><div class="flash"></div>${FX}</div>`;
      this._wrap = this._root.querySelector('.wrap');
      this._flash = this._root.querySelector('.flash');
      this._poses = [...this._root.querySelectorAll('.pose')];
      this._pose = null; this._state = null;
      this._f1 = this._root.querySelector('[data-p=f1] img');
      this._f1.addEventListener('load', () => this._ready());
    }
    _ready() {
      if (this._isReady || !this.isConnected || !this._f1.complete || !this._f1.naturalWidth) return;
      this._isReady = true;
      this._wrap.classList.add('rd');
      requestAnimationFrame(() => this.dispatchEvent(new CustomEvent('catready', { bubbles: true, composed: true })));
    }
    connectedCallback() { this._apply(); this._ready(); }
    disconnectedCallback() { clearTimeout(this._lt); clearTimeout(this._wt); }
    get mood() { return this.getAttribute('mood') || 'idle'; }
    set mood(v) { this.setAttribute('mood', String(v)); }
    get pulse() { return this.getAttribute('pulse'); }
    set pulse(v) { this.setAttribute('pulse', String(v)); }
    get loop() { return this.getAttribute('loop'); }
    set loop(v) { if (v && v !== 'false') this.setAttribute('loop', '1'); else this.removeAttribute('loop'); }
    attributeChangedCallback() { this._apply(); }
    _apply() {
      if (!this._wrap) return;
      clearTimeout(this._lt); clearTimeout(this._wt);
      const m = this.mood;
      this._looping = this.hasAttribute('loop');
      if (this._looping) { this._li = 0; return this._runLoop(); }
      if (SEQ[m]) return this._seq(m);
      this._show(m, true);
      if (m === 'idle' || m === 'listen') this._winkLater();
    }
    _seq(m) {
      const steps = SEQ[m];
      let i = 0;
      const step = () => {
        const [p, ms] = steps[i];
        this._show(m, i === 0, i > 0, p);
        i++;
        if (ms && i < steps.length) this._lt = setTimeout(step, ms);
      };
      step();
    }
    _runLoop() {
      const [st, ms] = LOOP[this._li % LOOP.length];
      this._show(st, st !== 'wink' && !(st === 'idle' && this._state === 'wink'));
      this._li++;
      this._lt = setTimeout(() => this._runLoop(), ms);
    }
    _winkLater() {
      this._wt = setTimeout(() => {
        const keep = this._state;
        this._show('wink', false, true);
        this._wt = setTimeout(() => { this._show(keep, false, true); this._winkLater(); }, 240);
      }, 2600 + Math.random() * 2400);
    }
    _show(state, restart, poseOnly, forcePose) {
      const p = forcePose || (this._looping ? LOOP_POSE[state] || 'f1' : POSE_OF[state] || 'f1');
      if (!poseOnly) {
        const baseCls = 'wrap' + (this._looping ? ' lp' : ' old') + (this._isReady ? ' rd' : '');
        if (restart || this._state !== state) { this._wrap.className = baseCls; void this._wrap.offsetWidth; }
        this._wrap.className = baseCls + ' s-' + (state === 'wink' ? 'idle' : state);
      }
      const changed = this._pose !== p;
      this._poses.forEach((el) => {
        const on = el.dataset.p === p;
        el.classList.toggle('on', on);
        if (on && changed && state !== 'wink' && this._state !== 'wink') { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
      });
      const big = !this._looping && changed && this._pose && !poseOnly;
      if (big) { this._flash.classList.remove('go'); void this._flash.offsetWidth; this._flash.classList.add('go'); }
      this._pose = p;
      if (!poseOnly) this._state = state;
    }
  }
  customElements.define('tolya-cat', TolyaCat);
})();
