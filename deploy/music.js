// Общая музыкальная логика для NOTE RUSH, CHORD RUSH, FAKE NOTE, KILL THE WRONG NOTE и др.
(function () {
  const LETTERS = 'CDEFGAB';
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const mod = (n, m) => ((n % m) + m) % m;

  // Интервалы: [ступеней по буквам, полутонов]
  const IV = {
    P1: [0, 0], m2: [1, 1], M2: [1, 2], m3: [2, 3], M3: [2, 4], P4: [3, 5], A4: [3, 6], d5: [4, 6],
    P5: [4, 7], A5: [4, 8], m6: [5, 8], M6: [5, 9], d7: [6, 9], m7: [6, 10], M7: [6, 11], P8: [7, 12], M9: [1, 14],
  };
  const IV_RU = {
    m2: 'Малая секунда', M2: 'Тон', m3: 'Малая терция', M3: 'Большая терция', P4: 'Чистая кварта', A4: 'Тритон',
    P5: 'Квинта', m6: 'Малая секста', M6: 'Большая секста', m7: 'Малая септима', M7: 'Большая септима', P8: 'Октава',
  };

  const N = (s) => {
    const li = LETTERS.indexOf(s[0].toUpperCase());
    let acc = 0;
    for (const ch of s.slice(1)) acc += ch === '#' || ch === '♯' ? 1 : ch === 'b' || ch === '♭' ? -1 : 0;
    return { li, acc };
  };
  const pc = (n) => mod(NAT[n.li] + n.acc, 12);
  const name = (n) => LETTERS[n.li] + (n.acc > 0 ? '♯'.repeat(n.acc) : '♭'.repeat(-n.acc));
  const same = (a, b) => a.li === b.li && a.acc === b.acc;
  const enh = (a, b) => pc(a) === pc(b);

  function transpose(n, iv, dir = 1) {
    const [st, se] = IV[iv];
    const li = mod(n.li + dir * st, 7);
    const target = mod(pc(n) + dir * se, 12);
    return { li, acc: mod(target - NAT[li] + 6, 12) - 6 };
  }
  const build = (root, ivs) => ivs.map((iv) => transpose(root, iv));
  const simple = (notes) => notes.every((n) => Math.abs(n.acc) <= 1);

  const SCALES = {
    major: { ivs: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'], ru: 'major', lvl: 1 },
    minor: { ivs: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'], ru: 'minor', lvl: 2 },
    harm: { ivs: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'], ru: 'harmonic minor', lvl: 3 },
  };
  // Правдоподобные ошибки для гамм: альтерации ступеней из соседних тональностей (#4, b7, #5, b3, b6…)
  const SCALE_TRAPS = { major: [[3, 1], [6, -1], [4, 1], [2, -1], [5, -1], [0, 1], [1, -1]], minor: [[5, 1], [6, 1], [2, 1], [1, -1], [3, 1]], harm: [[6, -1], [5, 1], [2, 1], [3, 1], [1, -1]] };

  const CHORDS = {
    '': { ivs: ['P1', 'M3', 'P5'], ru: 'мажорное трезвучие', lvl: 1 },
    m: { ivs: ['P1', 'm3', 'P5'], ru: 'минорное трезвучие', lvl: 1 },
    dim: { ivs: ['P1', 'm3', 'd5'], ru: 'уменьшённое трезвучие', lvl: 2 },
    aug: { ivs: ['P1', 'M3', 'A5'], ru: 'увеличенное трезвучие', lvl: 2 },
    sus4: { ivs: ['P1', 'P4', 'P5'], ru: 'sus4', lvl: 2 },
    maj7: { ivs: ['P1', 'M3', 'P5', 'M7'], ru: 'большой мажорный септаккорд', lvl: 3 },
    m7: { ivs: ['P1', 'm3', 'P5', 'm7'], ru: 'малый минорный септаккорд', lvl: 3 },
    '7': { ivs: ['P1', 'M3', 'P5', 'm7'], ru: 'доминантсептаккорд', lvl: 3 },
    'm7♭5': { ivs: ['P1', 'm3', 'd5', 'm7'], ru: 'полууменьшённый септаккорд', lvl: 3 },
    dim7: { ivs: ['P1', 'm3', 'd5', 'd7'], ru: 'уменьшённый септаккорд', lvl: 4 },
    maj9: { ivs: ['P1', 'M3', 'P5', 'M7', 'M9'], ru: 'maj9', lvl: 4 },
    m9: { ivs: ['P1', 'm3', 'P5', 'm7', 'M9'], ru: 'm9', lvl: 4 },
    '9': { ivs: ['P1', 'M3', 'P5', 'm7', 'M9'], ru: 'доминантнонаккорд', lvl: 4 },
    '6': { ivs: ['P1', 'M3', 'P5', 'M6'], ru: 'секстаккорд (6)', lvl: 4 },
  };
  const ROOTS = [
    ['C', 'G', 'F', 'D', 'A', 'B♭', 'E'],
    ['E♭', 'B', 'A♭'],
    ['F♯', 'D♭'],
  ];
  const rootsFor = (lvl) => ROOTS.slice(0, Math.min(3, lvl)).flat().map(N);

  // RNG: детерминированный для Daily Challenge
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const chordSym = (root, q) => name(root) + q;
  const chordNotes = (root, q) => build(root, CHORDS[q].ivs);
  const pcSet = (notes) => new Set(notes.map(pc));
  const setEq = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

  // Ложные ноты для аккорда: альтерации тонов аккорда + нетерцовые ступени — только если звук не входит в аккорд
  function chordTraps(root, notes) {
    const pcs = pcSet(notes);
    const out = [];
    const add = (n) => { if (Math.abs(n.acc) <= 1 && !pcs.has(pc(n)) && !out.some((o) => same(o, n))) out.push(n); };
    notes.slice(1).forEach((n) => { add({ li: n.li, acc: n.acc + 1 }); add({ li: n.li, acc: n.acc - 1 }); });
    ['P4', 'M6', 'M2', 'A4'].forEach((iv) => add(transpose(root, iv)));
    return out;
  }

  // FAKE NOTE / KILL: найти ноту, не принадлежащую гамме или аккорду
  function wrongNoteTask(level, r, opts = {}) {
    r = r || Math.random;
    for (let tries = 0; tries < 40; tries++) {
      const roots = rootsFor(level);
      const useScale = opts.chordsOnly ? false : level <= 1 ? r() < 0.5 : level === 3 ? r() < 0.3 : r() < 0.35;
      let notes, label, kind, wrong, insertAt, replace = false, set;
      if (useScale) {
        const keys = Object.keys(SCALES).filter((k) => SCALES[k].lvl <= level);
        const k = pick(r, keys);
        const root = k === 'major' ? pick(r, roots) : pick(r, ['A', 'E', 'D', 'G', 'C', 'B', 'F', 'F♯'].map(N));
        notes = build(root, SCALES[k].ivs);
        if (!simple(notes)) continue;
        const traps = SCALE_TRAPS[k].map(([deg, d]) => ({ li: notes[deg].li, acc: notes[deg].acc + d }))
          .filter((n) => Math.abs(n.acc) <= 1 && !pcSet(notes).has(pc(n)));
        if (!traps.length) continue;
        wrong = pick(r, traps.slice(0, level <= 1 ? 3 : traps.length));
        label = name(root) + ' ' + SCALES[k].ru;
        kind = 'Гамма';
        set = notes;
      } else {
        const lvlQ = Object.keys(CHORDS).filter((q) => CHORDS[q].lvl <= level && CHORDS[q].lvl >= Math.max(1, level - 1));
        const q = pick(r, lvlQ);
        const root = pick(r, roots);
        notes = chordNotes(root, q);
        if (!simple(notes)) continue;
        const traps = chordTraps(root, notes);
        if (!traps.length) continue;
        wrong = pick(r, traps);
        label = chordSym(root, q);
        kind = 'Аккорд';
        set = notes;
        replace = notes.length === 4 && r() < 0.5;
      }
      let shown = set.slice();
      if (replace) {
        // заменяем тон с той же буквой (как D F A C# вместо Dm7)
        const idx = shown.findIndex((n) => n.li === wrong.li);
        if (idx > 0) shown[idx] = wrong; else shown.splice(1 + Math.floor(r() * shown.length), 0, wrong);
      } else {
        insertAt = 1 + Math.floor(r() * shown.length);
        shown.splice(insertAt, 0, wrong);
      }
      if (opts.shuffle) shown = shuffle(r, shown);
      const pcs = pcSet(set);
      return {
        type: 'pick', kind, label,
        question: (opts.verb || (kind === 'Гамма' ? 'Какая нота лишняя в' : 'Какая нота не относится к')) + ' ' + label + '?',
        options: shown.map((n) => ({ name: name(n), pc: pc(n), correct: !pcs.has(pc(n)) })), // проверка по высоте звука, не по тексту
        explain: name(wrong) + ' не входит в ' + label + ': ' + set.map(name).join(' '),
        level,
      };
    }
    return wrongNoteTask(1, r, opts);
  }

  // CHORD RUSH (обратный вопрос): какой это аккорд?
  function chordNameTask(level, r) {
    r = r || Math.random;
    for (let tries = 0; tries < 40; tries++) {
      const qs = Object.keys(CHORDS).filter((q) => CHORDS[q].lvl <= level && CHORDS[q].lvl >= Math.max(1, level - 1));
      const q = pick(r, qs);
      const root = pick(r, rootsFor(level));
      const notes = chordNotes(root, q);
      if (!simple(notes)) continue;
      const target = pcSet(notes);
      const alts = Object.keys(CHORDS).filter((x) => x !== q && Math.abs(CHORDS[x].ivs.length - notes.length) <= 1);
      const opts = [{ root, q }];
      for (const x of shuffle(r, alts)) {
        const c = { root, q: x };
        if (!setEq(pcSet(chordNotes(root, x)), target) && simple(chordNotes(root, x))) opts.push(c);
        if (opts.length === 4) break;
      }
      if (opts.length < 4) continue;
      return {
        type: 'pick', kind: 'Аккорд', label: notes.map(name).join(' – '), question: 'Какой это аккорд?', wide: true,
        options: shuffle(r, opts).map((o) => ({ name: chordSym(o.root, o.q), correct: setEq(pcSet(chordNotes(o.root, o.q)), target) })),
        explain: chordSym(root, q) + ' — ' + CHORDS[q].ru + ': ' + CHORDS[q].ivs.map((iv) => IV[iv][1]).join('–') + ' полутонов',
        level,
      };
    }
    return chordNameTask(1, r);
  }

  // CHORD RUSH (прямой вопрос): собери аккорд из 12 звуков. Проверка по набору высот (энгармонизмы равны)
  function chordBuildTask(level, r, prevSym) {
    r = r || Math.random;
    for (let tries = 0; tries < 40; tries++) {
      const qs = Object.keys(CHORDS).filter((q) => CHORDS[q].lvl <= level && CHORDS[q].lvl >= Math.max(1, level - 1));
      const q = pick(r, qs);
      const root = pick(r, rootsFor(level));
      const notes = chordNotes(root, q);
      if (!simple(notes)) continue;
      const sym = chordSym(root, q);
      if (sym === prevSym) continue;
      return {
        type: 'build', kind: 'Аккорд', label: sym, sub: CHORDS[q].ru, question: 'Собери ' + sym,
        target: [...pcSet(notes)], notes: notes.map(name),
        explain: sym + ' = ' + notes.map(name).join(' – ') + ' · формула ' + CHORDS[q].ivs.map((iv) => IV[iv][1]).join('–'),
        level,
      };
    }
    return chordBuildTask(1, r);
  }

  // BOSS: цепочка интервалов
  function intervalChainTask(r) {
    r = r || Math.random;
    const ivs = ['P5', 'P4', 'M3', 'm3', 'M2', 'm6', 'M6', 'm7'];
    for (;;) {
      let n = pick(r, ['C', 'D', 'E', 'F', 'G', 'A', 'B♭'].map(N));
      const start = n, steps = [];
      let ok = true;
      for (let i = 0; i < 3; i++) {
        const iv = pick(r, ivs), dir = r() < 0.5 ? 1 : -1;
        n = transpose(n, iv, dir);
        if (Math.abs(n.acc) > 1) { ok = false; break; }
        steps.push(IV_RU[iv] + (dir > 0 ? ' вверх.' : ' вниз.'));
      }
      if (!ok) continue;
      return { type: 'boss', steps: ['Начни с ' + name(start) + '.', ...steps], answerPc: pc(n), answerName: name(n) };
    }
  }

  // Ритм: 16 шагов, строится из долей, разрешённых уровнем
  const CELLS = {
    1: ['x...', 'x...', '....'],
    2: ['x...', 'x.x.', 'x.x.'],
    3: ['x.x.', 'xxxx', 'x.xx', 'xx.x', 'xxx.'],
    4: ['..x.', '.x.x', 'x..x', '.xx.', 'x.xx', '...x'],
  };
  const PHRASES = ['x..x..x.x..x..x.', 'x..x..x...x.x...', 'x..x..x...x..x..', '..x...x...x.x.x.', 'x.x..x.x..x..x..', '.x..x..x..x..x..', 'x..x...x..x.x...'];
  function rhythmTask(level, r, prev) {
    r = r || Math.random;
    for (let t = 0; t < 50; t++) {
      let s;
      if (level >= 5 && r() < 0.6) s = pick(r, PHRASES);
      else {
        const pool = [];
        for (let l = 1; l <= Math.min(4, level); l++) pool.push(...CELLS[l]);
        const beats = [0, 1, 2, 3].map((b) => (b === 0 && level <= 3 ? pick(r, CELLS[Math.min(level, 3)].filter((c) => c[0] === 'x')) : pick(r, pool)));
        s = beats.join('');
      }
      const p = s.split('').map((c) => c === 'x');
      const hits = p.filter(Boolean).length;
      if (hits < 2 || hits > 10) continue;
      if (prev && prev.join() === p.join()) continue;
      return p;
    }
    return 'x...x...x...x...'.split('').map((c) => c === 'x');
  }

  const PC_NAMES = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const midi = (n, oct = 4) => 12 * (oct + 1) + pc(n);

  window.TM = {
    N, pc, name, transpose, build, enh, same, IV, IV_RU, SCALES, CHORDS, chordNotes, chordSym, pcSet, setEq,
    rng, hash, pick, shuffle, wrongNoteTask, chordNameTask, chordBuildTask, intervalChainTask, rhythmTask, PC_NAMES, midi,
  };
})();
