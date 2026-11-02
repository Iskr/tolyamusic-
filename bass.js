// «Собери бас» — бас как ритмический инструмент.
// Ноты баса заданы заранее, игрок решает только КОГДА бас звучит.
// Уровни и раунды — данные (LEVELS). Новый тип задания = новое значение round.type + его отрисовка.
// Оценка — не «правильно/неправильно», а набор параметров groove (analyze) + цели уровня (GOALS).
(function () {
  const en = () => window.TM_LANG === 'en';
  const tx = (ru, e) => (en() ? e : ru);
  const mod = (n, m) => ((n % m) + m) % m;
  const STEPS = 8; // восьмые в такте
  const STEP_LBL = ['1', '&', '2', '&', '3', '&', '4', '&'];

  // ---------- барабаны ----------
  const DR = {
    basic: { kick: [0, 4], snare: [2, 6] },
    push: { kick: [0, 3, 4], snare: [2, 6] },
    late: { kick: [0, 5], snare: [2, 6] },
    pickup: { kick: [0, 4, 7], snare: [2, 6] },
  };
  const P = (s) => s.split('').map((c) => c === 'x');

  // ---------- уровни ----------
  // round.type: build — поставь ноты; choose — выбери лучший из готовых; fix — исправь готовый бас.
  // goals — ключи из GOALS, по ним считается результат раунда.
  const LEVELS = [
    {
      id: 'kick', title: { ru: 'Бас + kick', en: 'Bass + kick' },
      intro: { ru: 'Поставь бас туда же, где звучит бочка.', en: 'Put the bass exactly where the kick is.' },
      goals: ['coverAll', 'onlyKick'],
      rounds: [
        { type: 'build', drums: 'basic', bars: ['Am', 'F'] },
        { type: 'build', drums: 'push', bars: ['Dm', 'B♭'] },
      ],
    },
    {
      id: 'move', title: { ru: 'Добавь движение', en: 'Add movement' },
      intro: { ru: 'Держись за kick, но поставь одну-две ноты между ударами.', en: 'Stick to the kick, but add one or two notes between the hits.' },
      goals: ['coverMost', 'move12', 'notDense'],
      rounds: [
        { type: 'build', drums: 'basic', bars: ['Em', 'C'] },
        { type: 'build', drums: 'late', bars: ['Am', 'G'] },
      ],
    },
    {
      id: 'synco', title: { ru: 'Синкопа', en: 'Syncopation' },
      intro: { ru: 'Поставь бас на «и» — между основными ударами.', en: 'Put the bass on the “and”s — between the main hits.' },
      goals: ['synco', 'notDense'],
      rounds: [
        { type: 'build', drums: 'basic', bars: ['Dm', 'F'] },
        { type: 'build', drums: 'pickup', bars: ['Am', 'F'] },
      ],
    },
    {
      id: 'choose', title: { ru: 'Найди лучший groove', en: 'Find the best groove' },
      intro: { ru: 'Послушай три готовых баса и выбери самый живой groove.', en: 'Listen to three ready-made bass lines and pick the liveliest groove.' },
      rounds: [
        {
          type: 'choose', drums: 'basic', bars: ['Am', 'F'],
          options: [
            { id: 'A', pat: 'x...x...', pts: 50, ru: 'A полностью дублирует kick: устойчиво, но статично.', en: 'A doubles the kick exactly: steady, but static.' },
            { id: 'B', pat: 'x..xx...', pts: 100, ru: 'B держится за kick и делает синкопу на «2 и» — бас толкает третью долю, groove двигается.', en: 'B sticks to the kick and adds a syncopation on “2 and” — it pushes into beat 3 and the groove moves.' },
            { id: 'C', pat: 'xxxxxxxx', pts: 0, ru: 'C играет на каждом шаге: бас забивает пространство, kick и snare тонут.', en: 'C plays on every step: the bass fills all the space and the drums get buried.' },
          ],
        },
        {
          type: 'choose', drums: 'push', bars: ['Dm', 'G'],
          options: [
            { id: 'A', pat: '..x...x.', pts: 30, ru: 'A играет только со snare — необычный акцент, но без опоры на «раз» и kick.', en: 'A plays only with the snare — an unusual accent, but with no anchor on beat 1 or the kick.' },
            { id: 'B', pat: 'x..xx..x', pts: 100, ru: 'B идёт с kick и добавляет подход на «4 и» к следующему такту — живой, читаемый groove.', en: 'B follows the kick and adds a pickup on “4 and” into the next bar — lively and clear.' },
            { id: 'C', pat: 'x.......', pts: 30, ru: 'C — одна нота на такт: опора есть, но groove звучит пусто.', en: 'C — one note per bar: there’s an anchor, but the groove sounds empty.' },
          ],
        },
      ],
    },
    {
      id: 'fix', title: { ru: 'Исправь плохой бас', en: 'Fix a bad bass line' },
      intro: { ru: 'Бас уже стоит, но звучит неудачно. Убери или перенеси ноты.', en: 'The bass is already there but it doesn’t work. Remove or move notes.' },
      goals: ['noSnare', 'notDense', 'hasOne', 'coverMost'],
      rounds: [
        { type: 'fix', drums: 'basic', bars: ['Am', 'F'], start: 'xxxx.xxx' },
        { type: 'fix', drums: 'push', bars: ['Em', 'C'], start: '.xx...x.' },
      ],
    },
  ];
  const ROADMAP = { ru: 'Скоро: паузы и «воздух», 16-е доли, бас против хэта, целая линия на 2 такта.', en: 'Coming next: rests and space, 16th notes, bass against the hats, a full two-bar line.' };

  // ---------- теория ----------
  function chordPcs(sym) {
    const TM = window.TM;
    const m = /^([A-G])([#♯b♭]?)(.*)$/.exec(sym);
    const root = TM.N(m[1] + (m[2] || ''));
    return { root: TM.pc(root), name: TM.name(root), pcs: TM.chordNotes(root, m[3] || '').map(TM.pc) };
  }
  const midi = (pc) => 40 + mod(pc - 4, 12); // E2…D♯3

  function compileRound(r) {
    const d = DR[r.drums];
    const K = Array.from({ length: STEPS }, (_, i) => d.kick.includes(i));
    const S = Array.from({ length: STEPS }, (_, i) => d.snare.includes(i));
    const chords = r.bars.map(chordPcs);
    return {
      type: r.type, K, S, bars: r.bars, chords, notes: chords.map((c) => c.name).join(' → '),
      start: r.start ? P(r.start) : Array(STEPS).fill(false),
      options: r.options ? r.options.map((o) => ({ ...o, P: P(o.pat), text: en() ? o.en : o.ru })) : null,
    };
  }
  function build(li) {
    const L = LEVELS[li];
    return { i: li, L, title: en() ? L.title.en : L.title.ru, intro: en() ? L.intro.en : L.intro.ru, rounds: L.rounds.map(compileRound) };
  }

  // ---------- анализ groove ----------
  const lbl = (i) => (i % 2 ? (en() ? STEP_LBL[i - 1] + ' and' : STEP_LBL[i - 1] + ' и') : STEP_LBL[i]);
  const list = (ix) => ix.map(lbl).join(', ');
  function analyze(pat, R) {
    const ix = (f) => pat.map((v, i) => (f(v, i) ? i : -1)).filter((i) => i >= 0);
    const on = ix((v) => v);
    const kN = R.K.filter(Boolean).length;
    const onK = on.filter((i) => R.K[i]);
    const missK = R.K.map((v, i) => (v && !pat[i] ? i : -1)).filter((i) => i >= 0);
    const offK = on.filter((i) => !R.K[i]);
    const onS = on.filter((i) => R.S[i]);
    const between = on.filter((i) => !R.K[i] && !R.S[i]);
    const off = on.filter((i) => i % 2 === 1);
    // синкопа-подход: нота на «и», следующий шаг пуст и на нём удар барабана
    const antic = off.filter((i) => !pat[(i + 1) % STEPS] && (R.K[(i + 1) % STEPS] || R.S[(i + 1) % STEPS]));
    let maxRest = 0;
    if (on.length) for (let i = 0; i < STEPS; i++) { let r = 0; while (r < STEPS && !pat[(i + r) % STEPS]) r++; maxRest = Math.max(maxRest, r); }
    else maxRest = STEPS;
    return { n: on.length, kN, onK: onK.length, cover: kN ? onK.length / kN : 0, missK, offK, onS, between, off, antic, maxRest, one: !!pat[0] };
  }

  const GOALS = {
    coverAll: { test: (m) => m.cover === 1, ok: () => tx('Каждый удар kick поддержан басом.', 'Every kick hit is backed by the bass.'), miss: (m) => tx('Kick без баса: ' + list(m.missK) + '.', 'Kick without bass: ' + list(m.missK) + '.') },
    onlyKick: { test: (m) => m.offK.length === 0, ok: () => tx('Лишних нот нет — бас и kick звучат как один инструмент.', 'No extra notes — bass and kick sound like one instrument.'), miss: (m) => tx('Ноты мимо kick (' + list(m.offK) + ') уже создают своё движение. В этом уровне попробуй точное совпадение.', 'Notes off the kick (' + list(m.offK) + ') already create their own movement. In this level, try an exact match.') },
    coverMost: { test: (m) => m.cover >= 0.5, ok: () => tx('Бас опирается на kick.', 'The bass leans on the kick.'), miss: () => tx('Бас почти не совпадает с kick — groove теряет низ.', 'The bass hardly meets the kick — the groove loses its bottom.') },
    move12: { test: (m) => m.between.length >= 1 && m.between.length <= 2, ok: (m) => tx('Нота между ударами (' + list(m.between) + ') даёт басу собственный рисунок.', 'The note between hits (' + list(m.between) + ') gives the bass its own pattern.'), miss: (m) => (m.between.length ? tx('Между ударами ' + m.between.length + ' нот — движение расплывается. Оставь одну-две.', m.between.length + ' notes between hits — the movement blurs. Keep one or two.') : tx('Пока бас только повторяет барабаны. Поставь одну ноту между ударами.', 'So far the bass only copies the drums. Add one note between the hits.')) },
    synco: { test: (m) => m.off.length >= 2, ok: (m) => tx('Ноты на «и» (' + list(m.off) + ') раскачивают groove.', 'Notes on the “and” (' + list(m.off) + ') make the groove swing.'), miss: (m) => tx('На «и» ' + (m.off.length ? 'только одна нота' : 'нет нот') + '. Синкопа появляется, когда бас звучит между счётами.', (m.off.length ? 'Only one note' : 'No notes') + ' on the “and”. Syncopation happens when the bass plays between the counts.') },
    notDense: { test: (m) => m.n <= 5, ok: () => '', miss: (m) => tx(m.n + ' нот из 8 — рисунок забивает пространство.', m.n + ' notes out of 8 — the pattern fills all the space.') },
    noSnare: { test: (m) => m.onS.length === 0, ok: () => tx('Бас не спорит со snare.', 'The bass doesn’t fight the snare.'), miss: (m) => tx('Бас совпадает со snare (' + list(m.onS) + ') — акцент уходит на слабые доли.', 'The bass lands with the snare (' + list(m.onS) + ') — the accent shifts to the weak beats.') },
    hasOne: { test: (m) => m.one, ok: () => tx('Есть опора на «раз».', 'There’s an anchor on beat 1.'), miss: () => tx('Нет ноты на «раз» — groove теряет опору.', 'No note on beat 1 — the groove loses its anchor.') },
  };

  // Описательные наблюдения: что делает рисунок со звучанием (не оценка)
  function notes(m, R) {
    const out = [];
    if (m.n >= 7) out.push(['warn', tx('Бас играет почти на каждом шаге. Ритмический рисунок становится менее выразительным.', 'The bass plays on almost every step. The rhythm loses its shape.')]);
    if (m.n === 1) out.push(['warn', tx('Одна нота на такт: groove звучит пусто.', 'One note per bar: the groove sounds empty.')]);
    if (m.n && m.cover === 1 && !m.offK.length) out.push(['info', tx('Бас дублирует kick: плотный, устойчивый groove.', 'The bass doubles the kick: a tight, steady groove.')]);
    if (m.antic.length) { const i = m.antic[0], tgt = R.S[(i + 1) % STEPS] ? 'snare' : 'kick'; out.push(['good', tx('Синкопа на «' + lbl(i) + '» перед ' + tgt + ' создаёт движение.', 'The syncopation on “' + lbl(i) + '” before the ' + tgt + ' creates movement.')]); }
    if (m.onS.length >= 2 && m.cover < 1) out.push(['info', tx('Бас идёт вместе со snare — необычный акцент, groove смещается.', 'The bass moves with the snare — an unusual accent that shifts the groove.')]);
    if (m.n >= 2 && m.maxRest >= 3) out.push(['good', tx('Пауза в ' + m.maxRest + ' шага — groove дышит.', 'A ' + m.maxRest + '-step rest — the groove breathes.')]);
    return out;
  }
  const VERDICT = {
    great: { ru: 'Отличный groove', en: 'Great groove', c: ['#f4a582', '#1e1b16'] },
    ok: { ru: 'Работает', en: 'It works', c: ['#efc7a6', '#1e1b16'] },
    try: { ru: 'Попробуй иначе', en: 'Try another way', c: ['#6b5d4b', '#fcf7f1'] },
  };
  function chips(m) {
    return en()
      ? ['Kick ' + m.onK + '/' + m.kN, 'Notes ' + m.n, 'Between ' + m.between.length, 'On “and” ' + m.off.length, 'Rest ' + m.maxRest]
      : ['Kick ' + m.onK + '/' + m.kN, 'Нот ' + m.n, 'Между ' + m.between.length, 'На «и» ' + m.off.length, 'Пауза ' + m.maxRest];
  }
  function evaluate(lv, R, pat) {
    const m = analyze(pat, R);
    if (!m.n) return { v: 'try', label: en() ? VERDICT.try.en : VERDICT.try.ru, color: VERDICT.try.c, pts: 0, lines: [['warn', tx('Баса нет — нажми на шаги в строке Bass.', 'No bass yet — tap the steps in the Bass row.')]], chips: chips(m) };
    const res = (lv.L.goals || []).map((k) => ({ k, ok: GOALS[k].test(m) }));
    const passed = res.filter((r) => r.ok).length;
    // слишком плотно или слишком пусто — groove страдает при любых целях уровня
    const pts = Math.max(0, (res.length ? Math.round((100 * passed) / res.length) : 0) - (m.n >= 7 ? 35 : 0) - (m.n === 1 ? 20 : 0));
    const v = pts >= 90 ? 'great' : pts >= 50 ? 'ok' : 'try';
    const lines = [];
    res.filter((r) => !r.ok).forEach((r) => lines.push(['warn', GOALS[r.k].miss(m)]));
    res.filter((r) => r.ok).forEach((r) => { const t = GOALS[r.k].ok(m); if (t) lines.push(['good', t]); });
    notes(m, R).forEach(([tone, t]) => { if (lines.length < 4 && !lines.some((l) => l[1] === t)) lines.push([tone, t]); });
    return { v, label: en() ? VERDICT[v].en : VERDICT[v].ru, color: VERDICT[v].c, pts, lines: lines.slice(0, 4), chips: chips(m) };
  }
  function evalChoice(R, id) {
    const o = R.options.find((x) => x.id === id), best = R.options.reduce((a, b) => (b.pts > a.pts ? b : a));
    const v = o.pts >= 100 ? 'great' : o.pts >= 50 ? 'ok' : 'try';
    const lines = [[o.pts >= 100 ? 'good' : 'info', o.text]];
    if (o !== best) lines.push(['good', tx('Самый живой вариант — ', 'The liveliest one is ') + best.text]);
    R.options.filter((x) => x !== o && x !== best).forEach((x) => lines.push(['info', x.text]));
    return { v, label: en() ? VERDICT[v].en : VERDICT[v].ru, color: VERDICT[v].c, pts: o.pts, lines, chips: chips(analyze(o.P, R)) };
  }
  function summary(lv, results) {
    const total = results.reduce((a, r) => a + (r ? r.pts : 0), 0), max = lv.rounds.length * 100;
    const out = [tx('Уровень «' + lv.title + '»: ' + total + ' из ' + max + '.', 'Level “' + lv.title + '”: ' + total + ' of ' + max + '.')];
    results.forEach((r, i) => r && out.push(tx('Раунд ' + (i + 1) + ' · ', 'Round ' + (i + 1) + ' · ') + r.label + ' — ' + r.lines[0][1]));
    return { total, max, lines: out, great: results.filter((r) => r && r.v === 'great').length };
  }

  window.TM_BASS = { LEVELS, ROADMAP, STEPS, STEP_LBL, build, analyze, evaluate, evalChoice, summary, midi, VERDICT };

  // EN для статичного текста страницы
  Object.assign((window.TM_DICT = window.TM_DICT || {}), {
    'СОБЕРИ БАС': 'BUILD THE BASS', 'Решай, когда звучит бас: вместе с бочкой, между ударами или в синкопу.': 'Decide when the bass plays: with the kick, between hits or syncopated.',
    'бас · groove': 'bass · groove', '≈ 2 мин': '≈ 2 min', 'Семь игр. Каждая что-то тренирует.': 'Seven games. Each one trains something.',
    '▶ Слушать': '▶ Listen', '■ Стоп': '■ Stop', 'Дальше →': 'Next →', 'Итог →': 'Results →', '✓ Проверить': '✓ Check', '✓ Выбрать': '✓ Choose', '↻ Сбросить': '↻ Reset',
    'Следующий уровень →': 'Next level →', 'РАУНД': 'ROUND', 'ОЧКИ УРОВНЯ': 'LEVEL POINTS', 'ОТЛИЧНЫХ GROOVE': 'GREAT GROOVES',
    'Изменено — проверь ещё раз': 'Changed — check again', 'Выбери вариант A, B или C': 'Pick option A, B or C',
    '5 уровней · 2 раунда': '5 levels · 2 rounds', 'Сначала включи луп, потом ставь ноты — изменения слышны сразу.': 'Start the loop first, then place notes — you hear changes right away.',
    'Звучат барабаны и аккорды. Высота баса уже задана — ты решаешь только, КОГДА он играет.': 'Drums and chords play. The bass pitch is already set — you only decide WHEN it plays.',
    'Нажимай шаги в строке Bass. Луп не останавливается: изменения слышны со следующего шага.': 'Tap steps in the Bass row. The loop keeps going: changes are heard from the next step.',
    '«Проверить» разбирает groove: связь с kick, плотность, паузы, синкопы. Ошибок нет — есть эффект решения.': '“Check” breaks down the groove: link to the kick, density, rests, syncopation. No mistakes — just the effect of each choice.',
    'В зачёт идёт первая проверка раунда. Потом можно экспериментировать сколько угодно.': 'The first check of each round counts. After that, experiment as much as you like.',
    // мобильная оболочка
    'Поверни телефон горизонтально': 'Turn your phone sideways', 'Так игровое поле и кнопки помещаются на одном экране.': 'That way the game and all controls fit on one screen.',
    'Если экран не поворачивается — выключи блокировку ориентации.': 'If the screen doesn’t rotate, turn off orientation lock.', '⛶ Во весь экран': '⛶ Full screen', 'Закрыть игру': 'Close game',
    'Правила': 'Rules', 'Понятно': 'Got it', 'Все игры': 'All games', 'СТАРТ': 'START', 'Ещё раз': 'Play again',
    '↻ Послушать': '↻ Listen', '♪ Играет…': '♪ Playing…', 'Готово': 'Done', 'БОСС': 'BOSS', 'Какая нота получится?': 'Which note do you land on?',
    'Слушай: ритм прозвучит два раза.': 'Listen: the rhythm plays twice.',
    'Жми зоны, где был удар. Повторное нажатие убирает удар.': 'Tap where you heard a hit. Tap again to remove it.',
    'Пунктир — сюда нужен удар, красным — лишний. За исправление половина очков.': 'Dashed — a hit belongs here, red — an extra hit. Fixes earn half points.',
    'Пунктир — пропущенный удар, красным — лишний.': 'Dashed — a missed hit, red — an extra one.',
    'Найди ноту, которой нет в гамме или аккорде. 12 заданий.': 'Find the note that isn’t in the scale or chord. 12 tasks.',
    'Услышь ритм и отметь удары на сетке. 6 раундов.': 'Hear the rhythm and mark the hits on the grid. 6 rounds.',
    'Скоростная «Лишняя нота»: 60 секунд, чем быстрее ответ, тем больше очков.': 'Speed version of Wrong Note: 60 seconds, faster answers score more.',
    'Собирай аккорды на клавиатуре и узнавай их по нотам.': 'Build chords on the keyboard and name them from their notes.',
    'Послушай два фрагмента и выбери тот, что подходит под условие.': 'Listen to two clips and pick the one that fits the question.',
    'Высота баса задана — решай, когда он играет: с бочкой, между ударами или в синкопу.': 'The bass pitch is set — you decide when it plays: with the kick, between hits or syncopated.',
    'Один набор на всех: ноты, ритмы и гармония. ТОП-3 дня.': 'One set for everyone: notes, rhythms and harmony. Daily top 3.',
    'Сетка — один такт: четыре четверти по четыре шага. Счёт «1 e & a, 2 e & a…»: цифра — сильная доля, «&» — полусильная, «e» и «a» — слабые.': 'The grid is one bar: four beats of four steps. Count “1 e & a, 2 e & a…”: the number is the strong beat, “&” the half-strong one, “e” and “a” are weak.',
    'На компьютере шаги подписаны «четверть.часть»: 2.3 — третий шаг второй четверти. Подробнее — в памятке под сеткой.': 'On a computer the steps are labelled “beat.step”: 2.3 is the third step of beat two. More in the cheat sheet under the grid.',
    'Нажми «Выбрать», когда определишься.': 'Tap “Choose” when you’ve decided.', 'Нажимай шаги в строке Bass — изменения слышны сразу.': 'Tap steps in the Bass row — you hear changes right away.',
    'Выйти из раунда': 'Leave round', 'Работает. Послушай и другие варианты.': 'It works. Try other options too.', 'Попробуй иначе — послушай разницу.': 'Try another way — listen to the difference.',
    'Новый groove. Включи луп и слушай.': 'New groove. Start the loop and listen.', 'БОСС · +2000': 'BOSS · +2000', 'Жми зоны, где был удар. Повторное нажатие убирает удар.': 'Tap where you heard a hit. Tap again to remove it.',
    '▶ Играть на весь экран': '▶ Play full screen', 'На телефоне игра открывается на весь экран — держи его горизонтально.': 'On a phone the game opens full screen — hold it sideways.',
  });
  (window.TM_RULES = window.TM_RULES || []).push([/^Уровень (\d) · (.+)$/, (m) => 'Level ' + m[1] + ' · ' + m[2]], [/^Раунд (\d)\/(\d)$/, (m) => 'Round ' + m[1] + '/' + m[2]]);
})();
