/* Chapter: Free Return. What a flyby does in Earth's frame, the free return, aiming by timing, midcourse corrections
   by hand and by measured sensitivity, and the three-body reality check.
   Lab: the Earth–Moon simulator of js/ch/moon.js (window.MoonLab) with MCC, the Earth zoom and the model switch. */
(function () {
  'use strict';

  Progress.register('freereturn', {
    name: N`Free Return`, topic: 'freereturn', glyph: 'figure8',
    briefing: N`Swing around the Moon on the right side and it throws you back to Earth with no engine burn. Apollo 13 had already left that path when its oxygen tank exploded; a short burn put it back on, and the Moon brought the crew home. The path is so sensitive that a fraction of a second of burn timing moves the return by a thousand kilometres, so it is corrected on the way. You are in Mission Control today, and your plan will meet the real, three-body Moon.`,
    objectives: [
      { id: 'free', text: N`Fly a free return all the way home: play it to entry interface, inside the entry corridor` },
      { id: 'rescue', text: N`Rescue a bad trajectory with a midcourse correction` },
      { id: 'reality', text: N`In the three-body model, bring the free return back into the corridor and fly it home to entry interface` },
      { id: 'qual', text: N`Qualify: answer 2 free-return problems correctly` },
    ],
    debrief: N`You navigated to the Moon and back. Next: planning the descent from lunar orbit to the surface.`,
  });

  const PRESETS = {
    free: { dv: 3160, ang: -132.333, mcc: 0, label: N`Free return` },
    late: { dv: 3160, ang: -132.303, mcc: 0, label: N`TLI half a second late` },
    aim: { dv: 3160, ang: -132.18, mcc: 0, label: N`Aim for a 110 km periselene (start)` },
    impact: { dv: 3160, ang: -132.5, mcc: 0, label: N`Lunar impact` },
    sling: { dv: 3170, ang: -135.5, mcc: 0, label: N`Slingshot` },
  };

  /* ---------------- figure helpers (same conventions as js/ch/moon.js, see tools/FIGURES.md) ---------------- */
  const fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%', D2 = Math.PI / 180;
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
  const vunit = (a) => vmul(a, 1 / Math.hypot(...a)), rot = (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)];
  function frame(W, H, ox, oy) {
    const S = (q) => [ox + q[0], oy - q[1]];
    const path = (list) => list.map((q, k) => `${k ? 'L' : 'M'}${fx(S(q)[0])},${fx(S(q)[1])}`).join('');
    const head = (q, dir, cls) => { const a = S(q), t = vunit([dir[0], -dir[1]]), n = [-t[1], t[0]];
      return `<path class="${cls}" d="M${fx(a[0] + 9 * t[0])},${fx(a[1] + 9 * t[1])}L${fx(a[0] + 4.5 * n[0])},${fx(a[1] + 4.5 * n[1])}L${fx(a[0] - 4.5 * n[0])},${fx(a[1] - 4.5 * n[1])}Z"/>`; };
    const arrow = (a, b, cls, fill) => { const c = vsub(b, vmul(vunit(vsub(b, a)), 9)); return `<path class="${cls}" d="${path([a, c])}"/>${head(c, vsub(b, a), fill)}`; };
    const arc = (c, r, a0, a1, cls, n = 30) => `<path class="${cls}" d="${path([...Array(n + 1).keys()].map((k) => vadd(c, [r * Math.cos(a0 + (a1 - a0) * k / n), r * Math.sin(a0 + (a1 - a0) * k / n)])))}"/>`;
    const lbs = (list) => list.map(([q, t, c]) => { const [x, y] = S(q); return `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`; }).join('');
    const dot = (q, cls, r = 3) => `<circle class="${cls}" cx="${fx(S(q)[0])}" cy="${fx(S(q)[1])}" r="${r}"/>`;
    return { S, path, head, arrow, arc, lbs, dot };
  }
  App.css('freereturn-fig', `
    .f-tr-ln-faint { fill: none; stroke: var(--trace); stroke-width: 1.6; opacity: .45; } .f-tr-fill-faint { fill: var(--trace); opacity: .45; }
    .f-gd-ln { fill: none; stroke: var(--good); stroke-width: 2; } .f-gd-fill { fill: var(--good); } .fig .lb.gd { color: var(--good); }
    .f-ac-faint { fill: none; stroke: var(--accent); stroke-width: 1.6; opacity: .4; } .f-ac-fill-faint { fill: var(--accent); opacity: .4; }
    .f-dot { stroke-dasharray: 1.5 4; stroke-linecap: round; stroke-width: 2; }
    .fr-pair { flex-direction: row; flex-wrap: wrap; align-items: flex-start; } .fr-pair .fig { flex: 1 1 30rem; max-width: 34rem; }   /* side by side only when both fit at a readable size */
    .fr-ctl { margin-top: .5rem; display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; } .fr-ctl > :first-child { flex: 1 1 16rem; }
    .fr-twin { display: flex; gap: .6rem; flex-wrap: wrap; } .fr-twin .fig-box { flex: 1 1 15rem; } .f-tr-thin { fill: none; stroke: var(--trace); stroke-width: 1; } .f-mu-wide { fill: none; stroke: var(--muted); stroke-width: 3; opacity: .7; } .fr-play { font-size: .72rem; padding: .15rem .5rem; min-width: 5.5rem; } .fr-ro { font: .78rem/1.5 var(--f-mono); color: var(--ink); margin-top: .3rem; } .fr-ro .bad { color: var(--bad); }`);

  // the lab's free return at the entry patch point (patched-conic model): v☾, v∞ and the turn δ, in km/s and degrees
  const VM = 1.0245, VSC = 0.9245, TH = 69.1 * D2, DELTA = 86.0 * D2;
  const vRelDir = vunit(vsub([VSC * Math.sin(TH), VSC * Math.cos(TH)], [0, VM]));

  /* ---------------- Figure 1: what the flyby does to the velocity relative to Earth, two cases ---------------- */
  // The Moon's sphere of influence with the flyby hyperbola, and at each patch point the triangle v_sc = v☾ + v_rel,
  // to scale (k px per km/s). Same arrival, two sides of the Moon: turned clockwise (free return) or anticlockwise
  // (slingshot) by δ. The hyperbola has the true eccentricity; its periselene is enlarged (true: 3 % of the sphere).
  function figFlybyCase(sling, ext) {   // ext: shared extent [x0, x1] (and optionally y0, y1), so both panels have one scale
    const R = 92, k = 50, e = 1 / Math.sin(DELTA / 2), rp = 0.07 * R, p = rp * (1 + e);
    const nuR = Math.acos((p / R - 1) / e), nuI = Math.acos(-1 / e), sg = sling ? 1 : -1;
    const vm = [0, VM], vin = vsub([VSC * Math.sin(TH), VSC * Math.cos(TH)], vm), vrIn = vin, vrOut = rot(vrIn, sg * DELTA);
    const vsIn = vadd(vm, vrIn), vsOut = vadd(vm, vrOut);
    // perifocal hyperbola (anticlockwise), mirrored for a clockwise turn, turned so its arrival matches v_rel in
    const dIn = [-Math.cos(nuI), sg * Math.sin(nuI)], tw = Math.atan2(vrIn[1], vrIn[0]) - Math.atan2(dIn[1], dIn[0]);
    const hyp = [...Array(61).keys()].map((j) => { const nu = -nuR + 2 * nuR * j / 60, r = p / (1 + e * Math.cos(nu)); return rot([r * Math.cos(nu), sg * r * Math.sin(nu)], tw); });
    const P1 = hyp[0], P2 = hyp[60];
    // the Earth-centred legs outside the sphere, dotted: tangent to v_in / v_out at the patch point, bent toward the
    // Earth (left) as gravity would (dir −1: before patch 1, +1: after patch 2, ending just past the v_out tip). Schematic, like the enlarged periselene.
    const leg = (P, v, dir) => { const u = vunit(v); return [...Array(13).keys()].map((j) => { const t = (dir > 0 ? Math.max(60, Math.hypot(...v) * k + 30) : 75) * j / 12; return vadd(P, [dir * u[0] * t - 0.0016 * t * t, dir * u[1] * t]); }); };
    const tri = (P, vr, vs) => ({ m: vadd(P, vmul(vm, k)), s: vadd(P, vmul(vs, k)) });
    const A = tri(P1, vrIn, vsIn), B = tri(P2, vrOut, vsOut);
    const pts = [[-R, -R], [R, R], A.m, A.s, B.m, B.s, [-R - 60, 0], [-R - 14, -R - 30], ...leg(P1, vsIn, -1), ...leg(P2, vsOut, 1)];
    const pad = 26, x0 = ext ? ext[0] : Math.min(...pts.map((q) => q[0])) - pad, x1 = ext ? ext[1] : Math.max(...pts.map((q) => q[0])) + pad;
    const y0 = ext && ext[2] != null ? ext[2] : Math.min(...pts.map((q) => q[1])) - pad, y1 = ext && ext[3] != null ? ext[3] : Math.max(...pts.map((q) => q[1])) + pad;
    const W = Math.round(x1 - x0), H = Math.round(y1 - y0), F = frame(W, H, -x0, y1);
    const lbl = (q, d, t, c) => [vadd(q, d), t, c];
    const side = (P, T2, t, c, off) => lbl(vmul(vadd(P, T2), 0.5), off, t, c);
    const vsL = sling ? '<i>v</i><sub>out</sub>' : '<i>v</i><sub>out</sub>';
    return { W, H, x0, x1, y0, y1, svg: `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-mu-thin f-dash" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="${R}"/>
        <circle class="f-moon" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="4"/>
        <path class="f-ac-faint" d="${F.path(hyp)}"/>
        <path class="f-tr-ln-faint f-dot" d="${F.path(leg(P1, vsIn, -1))}"/><path class="f-tr-ln-faint f-dot" d="${F.path(leg(P2, vsOut, 1))}"/>
        ${F.arrow(P1, A.m, 'f-mu', 'f-mu-fill')}${F.arrow(A.m, A.s, 'f-ac-ln thin', 'f-ac-fill')}${F.arrow(P1, A.s, 'f-tr', 'f-tr-fill')}
        ${F.arrow(P2, B.m, 'f-mu', 'f-mu-fill')}${F.arrow(B.m, B.s, 'f-ac-ln thin', 'f-ac-fill')}${F.arrow(P2, B.s, 'f-tr', 'f-tr-fill')}
        ${F.dot(P1, 'f-ink-fill', 2.5)}${F.dot(P2, 'f-ink-fill', 2.5)}
        ${F.arrow([-R + 26, -R - 22], [-R - 14, -R - 22], 'f-mu', 'f-mu-fill')}
      </svg>`, labels: { P1, P2, A, B, R, F, side, lbl, vsL } };
  }
  function figFlyby() {
    // a label beside each side of a velocity triangle, pushed away from the triangle's centroid
    const sideLb = (q0, q1, ctr, t, c, d = 10) => {
      const m = vmul(vadd(q0, q1), 0.5), u = vunit(vsub(q1, q0)); let n = [-u[1], u[0]];
      if ((m[0] - ctr[0]) * n[0] + (m[1] - ctr[1]) * n[1] < 0) n = vmul(n, -1);
      return [vadd(m, vmul(n, d + 4 * Math.abs(n[1]))), t, c + (n[0] > 0.35 ? ' l' : n[0] < -0.35 ? ' r' : '')];
    };
    const triLb = (P, T) => { const ctr = vmul(vadd(vadd(P, T.m), T.s), 1 / 3), out = T === 'out';
      return (io) => [sideLb(P, T.m, ctr, '<i>v</i><sub>☾</sub>', 'm'), sideLb(T.m, T.s, ctr, '<i>v</i><sub>rel</sub>', 'acc'), sideLb(P, T.s, ctr, `<i>v</i><sub>${io}</sub>`, 'tr')]; };
    // the patch-point label goes just below the point, or to its right when the velocity label is below-left
    const patchLb = (P, T, t) => (T.s[0] < P[0] ? [vadd(P, [10, -12]), t, 'm l'] : [vadd(P, [0, -18]), t, 'm']);   // right of the point when v_out points left
    const ca = figFlybyCase(false), cb = figFlybyCase(true), ext = [Math.min(ca.x0, cb.x0), Math.max(ca.x1, cb.x1)];   // stacked: same width and scale, each its own height
    const one = (sling) => {
      const c = figFlybyCase(sling, ext), { P1, P2, A, B, R, F } = c.labels;
      const L = [...triLb(P1, A)('in'), ...triLb(P2, B)('out'),
        patchLb(P1, A, T`patch 1`), patchLb(P2, B, T`patch 2`),
        [[-R + 32, -R - 22], T`toward Earth`, 'm l'], [[0, -13], T`Moon`, 'm']];
      return `<figure class="fig sub" role="img" aria-label="${sling ? T`Slingshot: the same arrival, passing behind the Moon. At patch 2 the velocity relative to the Moon has turned forward, and the velocity relative to Earth is long and points outward.` : T`Free return: the spacecraft passes ahead of the Moon and around its far side. At patch 1 the velocity relative to Earth is the Moon’s velocity plus the velocity relative to the Moon. At patch 2 the velocity relative to the Moon has the same length but has turned backward, and the velocity relative to Earth is short and points back toward the Earth.`}">
        <div class="fig-box">${c.svg}${F.lbs(L)}</div>
        <figcaption>${sling ? T`<b>Slingshot.</b> Same arrival, passing behind the Moon: the turn is the other way, \\(v_{rel}\\) leaves pointing forward, and \\(v_{out}\\) is long. The spacecraft gains energy relative to the Earth and is thrown outward.` : T`<b>Free return.</b> Passing ahead of the Moon and around its far side, \\(v_{rel}\\) is turned backward by δ = 86°. Adding \\(v_☾\\) back gives a short \\(v_{out}\\) pointing toward the Earth: the spacecraft falls home.`}</figcaption></figure>`;
    };
    return `<div class="fig-pair fr-pair">${one(false)}${one(true)}</div>
      <p class="note">${T`Both drawn in the Moon’s frame, to scale for the lab’s free return: the dashed circle is the sphere of influence and every arrow uses the same km/s scale. Only the periselene is enlarged, so the hyperbola’s turn is visible. Orange: the Moon-centred hyperbola inside the sphere; dotted blue: the Earth-centred legs before and after.`}</p>`;
  }

  /* ---------------- Figure 4: arriving late, seen from the Earth and from the Moon (animated, interactive) ---------------- */
  // Straight lines, the Moon's pull left out. Two spacecraft fly the same straight path in space, the second Δt later.
  // ψ ≈ 129°, with sin ψ = 0.78 exactly as in the text, so the slider at 1 334 s shows the text's Δb = −1 066 km.
  const PSI = Math.PI - Math.asin(0.78), B0 = 5560, BMIN = 4336, RMN = 1737.4;
  const TW = (() => {
    const u = [Math.sin(PSI), Math.cos(PSI)], n = [-u[1], u[0]];   // v∞ direction, and the side the on-time line passes
    const vr = Math.hypot(VSC * Math.sin(TH), VSC * Math.cos(TH) - VM);   // |v∞| of the triangle of figure 5, km/s
    const vm = [0, VM], vsc = vadd(vm, vmul(u, vr));   // Earth-frame velocities, km/s
    return { u, n, vr, vm, vsc, t0: -6000, t1: 6000, sc: 0.02 };   // times in s: on-time closest approach at t = 0
  })();
  function svgTwin(dtS, t) {   // dtS: delay of the second spacecraft, s; t: time shown, s, or null for the final picture
    const { u, n, vr, vm, vsc, t0, t1, sc } = TW, end = t === null, tn = end ? t1 : t;
    const W = 250, H = 352, k = (q) => vmul(q, sc);
    const FE = frame(W, H, 2400 * sc + 6, 8000 * sc + 24), FM = frame(W, H, 2400 * sc + 6, 9000 * sc + 24);
    const d = VM * dtS, db = d * Math.sin(PSI), b = B0 - db;
    const pA = (s) => vadd(vmul(n, B0), vmul(vsc, s)), pB = (s) => pA(s - dtS);   // Earth frame, Moon at the origin at t = 0
    const mo = (s) => vmul(vm, s);   // the Moon, Earth frame
    const tcA = 0, tcB = (vsc[0] * u[0] + vsc[1] * u[1]) * dtS / vr;   // closest approaches (same moment in both frames)
    const span = (f, a, c, m = 40) => [...Array(m + 1).keys()].map((i) => f(a + (c - a) * i / m));
    const startB = t0 + dtS, showB = tn >= startB;
    const circ = (F, c, r, cls) => `<circle class="${cls}" cx="${fx(F.S(k(c))[0])}" cy="${fx(F.S(k(c))[1])}" r="${fx(r * sc)}"/>`;
    const seg = (F, list, cls) => `<path class="${cls}" d="${F.path(list.map(k))}"/>`;
    const dotK = (F, q, cls, r) => F.dot(k(q), cls, r);
    // seen from the Earth
    const moonNow = mo(tn);
    let e = seg(FE, [[0, -7800], [0, 7600]], 'f-mu-thin f-dash') + FE.head(k([0, 7600]), [0, 1], 'f-mu-fill');
    // where the Moon was at each closest approach, and that distance
    if (tn >= tcA) e += seg(FE, [mo(tcA), pA(tcA)], 'f-mu-thin') + dotK(FE, mo(tcA), 'f-mu-fill', 2.5);
    if (showB && tn >= tcB) e += seg(FE, [mo(tcB), pB(tcB)], 'f-tr-ln-faint') + dotK(FE, mo(tcB), 'f-tr-fill-faint', 2.5);
    e += circ(FE, moonNow, RMN, 'f-moon');
    e += seg(FE, span(pA, t0, tn), 'f-mu-wide');
    if (showB) e += seg(FE, span(pB, startB, tn), 'f-tr');
    e += dotK(FE, pA(tn), 'f-ink-fill', 3.5) + (showB ? dotK(FE, pB(tn), 'f-tr-fill', 3.5) : '');
    const eL = [[[-2400 * sc, 8000 * sc + 12], T`Seen from the Earth`, 'l'], [k([300, -7300]), T`Moon’s path`, 'm l'],
      [vadd(k(pA(t0)), [-2, 12]), T`from Earth`, 'm l'], [vadd(k(moonNow), [0, 0]), T`Moon`, 'm']];
    if (!end) eL.push([vadd(k(pA(tn)), [0, 11]), T`on time`, 'm'], showB ? [vadd(k(pB(tn)), [0, -11]), T`late`, 'tr'] : null);
    else eL.push([vadd(k(pA(800)), [6, -12]), T`one path`, 'tr'], [vadd(k(pA(t1)), [0, 12]), T`on time`, 'm'], [vadd(k(pB(t1)), [4, -12]), T`late`, 'tr']);
    // seen from the Moon
    const rA = (s) => vsub(pA(s), mo(s)), rB = (s) => vsub(pB(s), mo(s));
    let m = circ(FM, [0, 0], BMIN, 'f-mu-thin f-dash') + circ(FM, [0, 0], RMN, 'f-moon') + FM.arrow([0, 0], [0, 50], 'f-mu', 'f-mu-fill');
    if (end) {
      const ext = (c, cls) => seg(FM, [vadd(c, vmul(u, -6500)), vadd(c, vmul(u, 6500))], cls);
      m += ext(vmul(n, B0), 'f-mu-wide f-dash') + ext(vmul(n, b), 'f-tr') + FM.head(k(vadd(vmul(n, b), vmul(u, 5600))), u, 'f-tr-fill');
    } else {
      m += seg(FM, span(rA, t0, tn), 'f-mu-wide');
      if (showB) m += seg(FM, span(rB, startB, tn), 'f-tr');
    }
    if (tn >= tcA && !end) m += seg(FM, [[0, 0], vmul(n, B0)], 'f-mu-thin');
    if (showB && tn >= tcB) m += seg(FM, [[0, 0], vmul(n, b)], end ? 'f-tr-thin' : 'f-tr-ln-faint');
    const A = vmul(n, B0), A2 = vsub(A, [0, d]), Af = vmul(n, b), Q = [-1700, -5500];
    if (end) {
      if (d * sc > 10) m += FM.arrow(k(A), k(A2), 'f-ink-ln', 'f-ink-fill');
      if (db * sc > 2) m += seg(FM, [A, Af], 'f-ac-ln');
      m += FM.arrow(k(Q), vadd(k(Q), [0, 30]), 'f-mu', 'f-mu-fill') + FM.arrow(k(Q), vadd(k(Q), vmul(u, 42)), 'f-tr', 'f-tr-fill')
        + FM.arc(k(Q), 15, Math.PI / 2, Math.PI / 2 - PSI, 'f-ink-ln');
    } else {
      m += dotK(FM, rA(tn), 'f-ink-fill', 3.5) + (showB ? dotK(FM, rB(tn), 'f-tr-fill', 3.5) : '');
    }
    const mL = [[[-2400 * sc, 9000 * sc + 12], T`Seen from the Moon`, 'l'], [k([0, -RMN - 520]), T`Moon`, 'm'], [vadd(k([0, 0]), [-6, 44]), '<i>v</i><sub>☾</sub>', 'm r']];
    if (end) mL.push(
      [vadd(k(A), vadd(vmul(u, 70), vmul(n, 12))), T`on time`, 'm l'],
      [vadd(k(Af), vadd(vmul(u, 30), vmul(n, -16))), dtS > 0 ? T`${UI.fmt(dtS / 60, 1)} min late` : '', 'tr l'],
      [vadd(k(vmul(vadd(A, A2), 0.5)), [7, 0]), d * sc > 10 ? '<i>v</i><sub>☾</sub>Δ<i>t</i>' : '', 'l'],
      [vadd(k(vmul(vadd(A, Af), 0.5)), [-8, 2]), db * sc > 6 ? 'Δ<i>b</i>' : '', 'acc r'],
      [vadd(k(vmul(Af, 0.5)), [-8, 2]), '<i>b</i>', 'tr r'],
      [vadd(k(Q), [-6, 18]), '<i>v</i><sub>☾</sub>', 'm r'], [vadd(k(Q), vadd(vmul(u, 36), [6, -8])), '<i>v</i><sub>∞</sub>', 'tr l'],
      [vadd(k(Q), vmul([Math.cos(Math.PI / 2 - PSI / 2), Math.sin(Math.PI / 2 - PSI / 2)], 25)), 'ψ', '']);
    else mL.push([vadd(k(rA(tn)), [0, 11]), T`on time`, 'm'], showB ? [vadd(k(rB(tn)), [0, -11]), T`late`, 'tr'] : null);
    const box = (F, svg, L) => `<div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${svg}</svg>${F.lbs(L.filter(Boolean))}</div>`;
    return { b, d, db, earth: box(FE, e, eL), moon: box(FM, m, mL) };
  }
  function figTiming() {
    const t = svgTwin(1334, null);
    return `<figure class="fig fr-twin-fig" style="max-width:40rem" id="fr-timing" role="img" aria-label="${T`An animation in two views side by side, at the same scale, with straight paths and the Moon’s pull left out. Two spacecraft fly the same straight path in space, the second one leaving later. Seen from the Earth, the Moon moves up its path and both spacecraft follow one line; the late one passes closer to the Moon. Seen from the Moon, the Moon stands still and each spacecraft comes in along its own straight line in the direction of v∞. The two lines are parallel: the late one is the on-time line moved back by v☾Δt, the distance the Moon travelled in the delay. The gap between them, v☾Δt sin ψ, is the change of aim offset Δb. A time slider moves back and forth through the approach, and a second slider sets the delay.`}">
      <div class="fr-twin">${t.earth}${t.moon}</div>
      <div class="fr-ctl">${UI.slider({ id: 'fr-tt', label: T`time from the on-time closest approach`, min: TW.t0 / 60, max: TW.t1 / 60, step: 1, value: TW.t1 / 60, unit: 'min' })}
        <button class="btn fr-play" type="button">${T`▸ Play`}</button></div>
      <div class="fr-ctl">${UI.slider({ id: 'fr-dt', label: T`arrival delay Δt`, min: 0, max: 2400, step: 1, value: 1334, unit: 's' })}</div>
      <div class="fr-ro" id="fr-dt-ro"></div>
      <figcaption>${T`To scale, straight paths, the Moon’s pull left out. Grey: on time; blue: the same path, Δt later. Thin lines from the Moon’s centre: each closest approach, the same length in both views. At the end, the black arrow is the Moon’s move v☾Δt and the orange gap between the two lines is Δb. Inside the dashed circle the spacecraft would hit the Moon.`}</figcaption></figure>`;
  }
  function mountTiming(root) {
    const twin = root.querySelector('.fr-twin'), ro = root.querySelector('#fr-dt-ro'), btn = root.querySelector('.fr-play');
    const RATE = (TW.t1 - TW.t0) / 8000;   // simulated seconds per millisecond: the whole approach plays in 8 s
    let raf = 0, dt = 1334, tm = TW.t1;
    const draw = () => {
      const r = svgTwin(dt, tm >= TW.t1 ? null : tm); twin.innerHTML = r.earth + r.moon;
      ro.innerHTML = T`The Moon moves ${UI.fmt(r.d, 0)} km · Δb = −${UI.fmt(r.db, 0)} km · b = ${UI.fmt(r.b, 0)} km` + (r.b < BMIN ? ` · <span class="bad">${T`below 4 336 km: impact`}</span>` : '');
    };
    const setBtn = () => { btn.textContent = raf ? T`❚❚ Pause` : T`▸ Play`; };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; setBtn(); };
    const ctl = UI.bindControls(root, { 'fr-dt': (x) => UI.fmt(x, 0), 'fr-tt': (x) => (x > 0 ? '+' : '') + UI.fmt(x, 0) }, (v, src) => {
      if (src === 'fr-tt') stop();   // the reader takes over the timeline
      dt = v['fr-dt']; if (src !== 'anim') tm = v['fr-tt'] * 60;
      draw();
    });
    const play = () => {
      if (tm >= TW.t1) tm = TW.t0;
      let last = performance.now();
      const step = (now) => {
        tm = Math.min(TW.t1, tm + (now - last) * RATE); last = now;
        ctl.set('fr-tt', Math.round(tm / 60)); ctl.update('anim');
        if (tm < TW.t1) raf = requestAnimationFrame(step); else stop();
      };
      raf = requestAnimationFrame(step); setBtn();
    };
    btn.addEventListener('click', () => (raf ? stop() : play()));
    UI.onCleanup(() => cancelAnimationFrame(raf));   // leaving the page stops the animation
    ctl.update();
    if (UI.reducedMotion() || !('IntersectionObserver' in window)) return;
    tm = TW.t0; ctl.set('fr-tt', TW.t0 / 60); ctl.update('anim');
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); if (!raf && tm <= TW.t0) play(); } }, { threshold: 0.6 });
    io.observe(root);
    UI.onCleanup(() => io.disconnect());
  }

  /* ---------------- Figure 4b: moving the TLI point turns the whole transfer (seen from the Earth) ---------------- */
  // Schematic, Earth-centred: the transfer is a conic from perigee (the TLI point) to the Moon's orbit. Starting TLI
  // earlier moves perigee back along the parking orbit by Δφ and turns the whole conic by Δφ, so it reaches the Moon's
  // orbit Δφ further back. Δφ is drawn 12° (really 0.2°).
  function figTLIShift() {
    const W = 470, H = 436, F = frame(W, H, 128, 346);
    const D = 290, rp = 42, ra = 330, e = (ra - rp) / (ra + rp), p = rp * (1 + e), dphi = 12 * D2;
    const nuA = Math.acos((p / D - 1) / e), aA = 64 * D2, w0 = aA - nuA, aM = 33 * D2;   // arrival direction, perigee direction, Moon
    const pol = (a, r) => [r * Math.cos(a), r * Math.sin(a)];
    const conic = (w, n1 = nuA) => [...Array(81).keys()].map((k) => { const nu = n1 * k / 80; return pol(w + nu, p / (1 + e * Math.cos(nu))); });
    const P0 = pol(w0, rp), P1 = pol(w0 - dphi, rp), A0 = pol(aA, D), A1 = pol(aA - dphi, D), M = pol(aM, D);
    const ray = (a, r0, r1) => F.path([pol(a, r0), pol(a, r1)]);
    const orbit = (a0, a1, r) => [...Array(61).keys()].map((k) => pol(a0 + (a1 - a0) * k / 60, r));
    const tang = (a) => [-Math.sin(a), Math.cos(a)];
    return `<figure class="fig" style="max-width:30rem" role="img" aria-label="${T`Seen from the Earth, not to scale. A small parking orbit around the Earth and an arc of the Moon’s orbit. The transfer leaves the parking orbit at the TLI point and climbs to the Moon’s orbit. A second transfer starts a little earlier, at a TLI point moved back by the angle Δφ: it is the same curve turned by Δφ about the Earth, and it reaches the Moon’s orbit Δφ further back, closer to the Moon. Along the Moon’s orbit the two arrival points are D Δφ apart, the same distance the Moon covers in Δt.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path class="f-mu-thin f-dash" d="${F.path(orbit(14 * D2, 100 * D2, D))}"/>${F.head(pol(100 * D2, D), tang(100 * D2), 'f-mu-fill')}
        <circle class="f-mu-thin" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="${rp}"/>
        <path class="f-mu-thin f-dash" d="${ray(aA, 0, D + 18)}"/><path class="f-mu-thin f-dash" d="${ray(aA - dphi, 0, D + 18)}"/>
        <path class="f-mu-thin f-dash" d="${ray(w0, 0, rp + 26)}"/><path class="f-mu-thin f-dash" d="${ray(w0 - dphi, 0, rp + 26)}"/>
        ${F.arc([0, 0], 150, aA - dphi, aA, 'f-ink-ln')}${F.arc([0, 0], rp + 18, w0 - dphi, w0, 'f-ink-ln')}
        <path class="f-mu-wide f-dash" d="${F.path(conic(w0))}"/>
        <path class="f-tr" d="${F.path(conic(w0 - dphi))}"/>${F.head(conic(w0 - dphi)[44], vsub(conic(w0 - dphi)[45], conic(w0 - dphi)[44]), 'f-tr-fill')}
        <path class="f-ac-ln" d="${F.path(orbit(aA - dphi, aA, D))}"/>
        <circle class="f-earth" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="24"/>
        <circle class="f-moon" cx="${fx(F.S(M)[0])}" cy="${fx(F.S(M)[1])}" r="13"/>${F.arrow(vadd(M, vmul(tang(aM), 16)), vadd(M, vmul(tang(aM), 40)), 'f-mu', 'f-mu-fill')}
        ${F.dot(P0, 'f-ink-fill')}${F.dot(P1, 'f-tr-fill')}${F.dot(A0, 'f-ink-fill')}${F.dot(A1, 'f-tr-fill')}
      </svg>${F.lbs([
        [[0, 0], T`Earth`, 'm'], [pol(28 * D2, rp + 6), T`parking orbit`, 'm l'],
        [vadd(P0, [8, -12]), T`TLI on schedule`, 'l'], [vadd(P1, [-2, -20]), T`TLI 3 s earlier`, 'tr r'],
        [vadd(pol(w0 - dphi / 2, rp + 30), [8, -2]), 'Δφ', 'l'], [pol(aA - dphi / 2, 162), 'Δφ', ''],
        [vadd(pol(aA, D), [-2, 14]), T`arrival on schedule`, 'r'], [vadd(A1, [10, 2]), T`arrival, TLI earlier`, 'tr l wrap narrow'],
        [vadd(pol(aA - dphi / 2, D + 16), [10, -4]), '<i>D</i>Δφ = <i>v</i><sub>☾</sub>Δ<i>t</i>', 'acc l'],
        [vadd(M, [16, -14]), T`Moon`, 'm l'], [vadd(M, vadd(vmul(tang(aM), 40), [-8, 2])), '<i>v</i><sub>☾</sub>', 'm r'],
        [pol(96 * D2, D + 16), T`Moon’s orbit`, 'm'],
      ])}</div>
      <figcaption>${T`Seen from the Earth, not to scale: Δφ is drawn 12° instead of 0.2°, and the parking orbit far too big. Starting TLI earlier moves the burn back along the parking orbit by Δφ and turns the whole transfer by Δφ about the Earth (blue). It reaches the Moon’s orbit D Δφ further back, at the same moment, so relative to the Moon it arrives as if it were Δt late at the old point.`}</figcaption></figure>`;
  }

  /* ---------------- Figure 5: a midcourse burn along the flight direction, and the angles α and ψ ---------------- */
  function figMCC() {
    const W = 360, H = 240, k = 140, F = frame(W, H, 70, 214);
    const vm = [0, VM * k], vs = vmul([Math.sin(TH), Math.cos(TH)], VSC * k), dvl = 58, dvTip = vadd(vs, vmul(vunit(vs), dvl));
    const along = vadd(vs, vmul(vRelDir, dvl * (vunit(vs)[0] * vRelDir[0] + vunit(vs)[1] * vRelDir[1])));
    const aV = Math.atan2(vRelDir[1], vRelDir[0]), aS = Math.atan2(vs[1], vs[0]);
    return `<figure class="fig" style="max-width:28rem" role="img" aria-label="${T`The velocity triangle at the Moon drawn to scale: the Moon’s velocity up, the spacecraft’s velocity relative to Earth up and to the right, and the velocity relative to the Moon closing the triangle. The angle ψ is between the Moon’s velocity and v∞, the angle α between the spacecraft’s velocity and v∞. A midcourse burn along the spacecraft’s velocity is drawn at its tip, split into a part along v∞ and a part across it.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path class="f-mu-thin f-dash" d="${F.path([vm, vadd(vm, [0, 22])])}"/>
        ${F.arc(vm, 24, Math.PI / 2, aV, 'f-ink-ln')}${F.arc(vs, 30, aV + Math.PI, aS + Math.PI, 'f-ink-ln')}
        ${F.arrow([0, 0], vm, 'f-mu', 'f-mu-fill')}${F.arrow(vm, vs, 'f-ac-ln thin', 'f-ac-fill')}${F.arrow([0, 0], vs, 'f-tr', 'f-tr-fill')}
        <path class="f-mu-thin f-dash" d="${F.path([vs, vadd(vs, vmul(vRelDir, 70))])}"/>
        <path class="f-mu-thin f-dash" d="${F.path([along, dvTip])}"/>
        ${F.arrow(vs, dvTip, 'f-gd-ln', 'f-gd-fill')}
        <path class="f-ac-ln" d="${F.path([along, dvTip])}"/>
      </svg>${F.lbs([
        [[-8, vm[1] * 0.5], '<i>v</i><sub>☾</sub>', 'm r'],
        [vadd(vmul(vs, 0.5), [6, -12]), '<i>v</i><sub>sc</sub>', 'tr l'],
        [vadd(vmul(vadd(vm, vs), 0.5), [10, 6]), '<i>v</i><sub>∞</sub>', 'tr l'],
        [vadd(vm, vmul([Math.cos((Math.PI / 2 + aV) / 2), Math.sin((Math.PI / 2 + aV) / 2)], 36)), 'ψ', ''],
        [vadd(vs, vmul([Math.cos((aV + aS) / 2 + Math.PI), Math.sin((aV + aS) / 2 + Math.PI)], 42)), 'α', ''],
        [vadd(dvTip, [6, 6]), T`burn Δv`, 'gd l'],
        [vadd(vmul(vadd(along, dvTip), 0.5), [8, -4]), 'Δ<i>v</i> sin α', 'acc l'],
      ])}</div>
      <figcaption>${T`The burn is made along the direction of flight, v<sub>sc</sub>. Only its part across v∞ moves the aim line: Δv sin α. After t<sub>go</sub> that sideways speed has moved the spacecraft by Δv t<sub>go</sub> sin α. The burn is drawn much larger than to scale; the triangle is to scale.`}</figcaption></figure>`;
  }

  /* ---------------- TLI burn position in seconds ----------------
     The text argues in seconds of burn timing, the slider in degrees: show both. In the 185 km parking orbit the
     spacecraft covers about 0.068° per second, so a shift of the burn position is a shift of the ignition time. */
  const TLI_REF = -132.333, PARK_RATE = Math.sqrt(Phys.C.muE / Math.pow(Phys.C.RE + 185e3, 3)) * 180 / Math.PI;   // °/s
  const tliShift = (ang) => { const d = ang - TLI_REF, sec = d / PARK_RATE; return { d, sec }; };
  function mountTimingShift(lab) {
    const el = lab && lab.querySelector('#fr-ang');
    if (!el) return;
    const out = document.createElement('p');
    out.className = 'note'; out.style.margin = '0 0 .4rem';
    el.closest('.ctl').after(out);
    const show = () => {
      const { d, sec } = tliShift(+el.value);
      out.textContent = Math.abs(sec) < 0.005 ? T`On the free return’s burn position (${UI.dec(String(TLI_REF))}°).`
        : T`${d > 0 ? '+' : '−'}${UI.fmt(Math.abs(d), 3)}° from the free return: ignition ${UI.fmt(Math.abs(sec), 2)} s ${sec > 0 ? T`late` : T`early`}.`;
    };
    // presets and the solver set the slider without events: refresh after anything happens in the lab
    const later = () => requestAnimationFrame(show);
    lab.addEventListener('input', later); lab.addEventListener('click', later); lab.addEventListener('change', later);
    show();
  }

  /* ---------------- Chapter ---------------- */
  App.chapter({
    id: 'freereturn', phase: N`Translunar coast`, title: N`Free Return`, lab: N`Free return and corrections`,
    blurb: N`What a lunar flyby does seen from Earth, the free return that brought Apollo 13 home, and how to aim and correct a trajectory that is sensitive to a tenth of a metre per second.`,
    render(page) {
      const mc = Progress.code('moon');
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('freereturn')} · Translunar coast`,
          title: T`Free Return`,
          refs: [T`Sellers · Interplanetary Travel`, T`BMW ch. 7 Lunar Trajectories`],
        })}
        ${Progress.briefing('freereturn', { theory: 'theory', lab: 'fr', math: 'refresher', mathLabel: N`Adding and subtracting vectors.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`What a flyby does`}</h2>
          <div class="prose">
            <p>${T`Module ${mc} ended inside the sphere of influence. The spacecraft crosses into it (patch 1) with a velocity \\(v_{rel}\\) relative to the Moon. The Moon’s hyperbola turns that velocity by an angle δ, and where the spacecraft crosses out again (patch 2), at the same distance from the Moon, it leaves just as fast: same length, new direction. Now go back to the Earth’s point of view. At patch 2, change frames again, the other way: add the Moon’s velocity.`}</p>
            <div class="eq">\\[ \\vec v_{out} = \\vec v_{rel,out} + \\vec v_☾ \\]</div>
            ${Sym.where([['\\vec v_{out}', N`velocity relative to Earth after the flyby`, 'm/s'], ['\\vec v_{rel,out}', N`velocity relative to the Moon at patch 2: as long as at patch 1, turned by δ`, 'm/s'], ['\\vec v_☾', N`the Moon’s orbital velocity, about 1.02 km/s`, 'm/s']])}
            ${Primer.box('vectors', false, 'refresher')}
            ${figFlyby()}
            <p>${T`The two \\(v_{rel}\\) have the same length but point differently, so adding the same \\(\\vec v_☾\\) gives a different velocity relative to Earth. That is the <b>gravity assist</b>: relative to the Moon nothing is gained or lost, relative to the Earth the speed and the direction of the orbit change.`}</p>
            <p>${T`<b>Which side?</b> The Moon’s pull turns \\(v_{rel}\\) toward the Moon. The free return comes in ahead of the Moon, on the side the Moon is moving toward, swings around its far side and leaves behind it. The turn then points \\(v_{rel}\\) backward along the Moon’s path, \\(v_{out}\\) is short, the spacecraft loses energy relative to the Earth and falls back: the free-return figure. Come in behind the Moon and the turn is forward: the spacecraft gains energy and is thrown outward: the slingshot figure. In the lab’s patched-conic model, starting from the scenario <i>Aim for a 110 km periselene</i>, a TLI point 1.19° earlier (17 seconds of burn timing) aims straight at the centre and hits the Moon. At 3° earlier the line is on the other side, at a 3 660 km periselene, and the spacecraft leaves on an escape path from Earth.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`The free return`}</h2>
          <div class="prose">
            <p>${T`A <b>free return</b> is the flyby whose turn sends the spacecraft back to Earth with a perigee inside the <b>entry corridor</b>: the narrow band of perigee heights, about 12 to 65 km (flight-path angles of −7.4° to −5.3° at entry interface, module ${Progress.code('entry')}), where the capsule neither skips off the atmosphere nor dives into it too steeply (module ${Progress.code('entry')}). The perigee is measured as if the Earth had no air, the <b>vacuum perigee</b>. In the rotating frame, where the Earth–Moon line stands still, the path traces the famous <b>figure eight</b>. Patched conics can design one: in the lab, a TLI of 3 160 m/s at −132.333° (the burn position in the parking orbit, measured from the Earth–Moon line as in module ${mc}) passes 369 km from the Moon and comes back to a 52 km vacuum perigee.`}</p>
            <p>${T`Apollo 8, 10 and 11 were launched onto free-return trajectories, so that a dead main engine would still mean coming home. Apollo 12 onward used <b>hybrid</b> trajectories to reach landing sites the free return could not. They left the free return with a midcourse burn of the Service Propulsion System. On Apollo 13 an oxygen tank exploded 56 hours out, crippling the Service Module and making its engine too risky to use. The crew fired the Lunar Module’s descent engine for 35 seconds to get <i>back</i> on a free return, then burned again two hours after closest approach (PC+2), back on the near side, to speed up the return. Neither burn was needed to turn the spacecraft around: the Moon did that.`}</p>
          </div>
        </section>

        ${Archive.capsule('earthrise')}

        ${Archive.capsule('apollo13')}

        <section class="section">
          <h2><span class="idx">0.3</span>${T`Aiming by timing`}</h2>
          <div class="prose">
            <p>${T`This section and the next use one velocity triangle, seen near the Moon. Four names are enough: \\(\\vec v_{sc}\\), the spacecraft’s velocity relative to the Earth; \\(\\vec v_☾\\), the Moon’s velocity; \\(\\vec v_\\infty = \\vec v_{sc} - \\vec v_☾\\), the spacecraft’s velocity relative to the Moon (the \\(v_{rel}\\) of section ${App.sec('freereturn', 1)}); and \\(b\\), the aim offset: how far from the Moon’s centre the straight line along \\(v_\\infty\\) passes. Every correction below is a way to change \\(b\\).`}</p>
            <p>${T`Section ${App.sec('moon', 4)} gave the aim offset for a chosen periselene. Take the lab’s scenario <i>Aim for a 110 km periselene</i>, in the patched-conic model. Its TLI sends the spacecraft past the Moon at 899 km, aimed \\(b\\) = 5 560 km from the centre. Lunar orbit insertion wants 110 km, which needs \\(b\\) = 4 494 km (the example of section ${App.sec('moon', 4)}). The aim line must move by \\(\\Delta b\\) = 4 494 − 5 560 = −1 066 km. Two tools can move it: the timing of the TLI burn, and a midcourse correction.`}</p>
            <p>${T`Timing first. Fly the same path in space, but \\(\\Delta t\\) later. The spacecraft then meets the Moon at a different moment, so it passes at a different distance. The figure below shows it from both sides. Seen from the Earth, the on-time and the late spacecraft follow one line. Seen from the Moon, which then stands still, each comes in along its own straight line, in the direction of its velocity relative to the Moon, \\(v_\\infty\\). Because both bodies move, that line is slanted at an angle \\(\\psi\\) to the Moon’s motion, not at the angle the path makes with the Moon’s orbit seen from the Earth. The on-time line passes \\(b\\) from the Moon’s centre. By the time the late spacecraft arrives, the Moon has moved \\(v_☾\\,\\Delta t\\) further, so seen from the Moon the late line is the on-time line moved back by \\(v_☾\\,\\Delta t\\): the same direction, a parallel line. A shift of \\(v_☾\\,\\Delta t\\) at the angle \\(\\psi\\) to the lines opens a gap of \\(v_☾\\,\\Delta t\\,\\sin\\psi\\) between them, and that gap is the change of aim offset:`}</p>
            <div class="eq">\\[ \\Delta b \\approx v_☾\\,\\Delta t\\,\\sin\\psi \\qquad\\Longleftrightarrow\\qquad \\Delta t \\approx \\frac{\\Delta b}{v_☾\\,\\sin\\psi} \\]</div>
            ${Sym.where([['\\Delta b', N`change of the aim offset you want`, 'm'], ['\\Delta t', N`how much later the transfer reaches the Moon’s orbit, relative to the Moon’s schedule`, 's'], ['v_☾', N`the Moon’s orbital speed, 1.02 km/s`, 'm/s'], ['\\psi', N`angle between the Moon’s velocity and \\(v_\\infty\\) (not the angle θ at the sphere boundary, which is measured from \\(v_{sc}\\))`, N`rad or °`]], N`Timing does nothing when \\(v_\\infty\\) lies along the Moon’s path (sin ψ = 0) and works best when it lies across it. For this transfer, arriving later makes b smaller.`)}
            ${figTiming()}
            <p>${T`For this transfer \\(\\psi = 129^\\circ\\), so \\(\\sin\\psi = 0.78\\), and \\(v_☾ = 1.0245\\) km/s. For \\(\\Delta b = -1\\,066\\) km: \\(\\Delta t = 1\\,066/(1.0245\\times0.78) = 1\\,334\\) s. Arrive 22 minutes late, while the Moon covers 1 367 km. The figure above opens on this delay; set its slider back to 1 334 s to check.`}</p>
            <p>${T`Nobody delays the Moon. You move the TLI point instead. Moving the burn by \\(\\Delta\\phi\\) along the parking orbit turns the whole transfer by \\(\\Delta\\phi\\) about Earth. At the Moon’s distance \\(D\\) that is a sideways shift \\(D\\,\\Delta\\phi\\), the same as the Moon being \\(v_☾\\Delta t\\) away, so \\(\\Delta\\phi = \\omega_☾\\,\\Delta t\\), with \\(\\omega_☾ = v_☾/D = 2.66\\times10^{-6}\\) rad/s. Here \\(\\Delta\\phi = 0.20^\\circ\\). In a 185 km parking orbit the spacecraft covers 0.068° per second, so the burn must start <b>3.0 seconds earlier</b>. Three seconds of burn timing move the periselene by about 700 km. That is why TLI windows are counted in seconds.`}</p>
            ${figTLIShift()}
            <p>${T`Check it in the lab (section ${App.sec('freereturn', 7)}). Moving the TLI point by −0.204° gives a periselene of 199 km, not 110 km. The straight-line picture is a first estimate: Earth’s pull curves the path, and the geometry changes a little as you shift it. The simulator moves \\(b\\) by 4 663 km per degree of TLI point where the formula gives 5 229 km, about 11% less. Section ${App.sec('freereturn', 5)} removes that error.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`Midcourse correction by hand`}</h2>
          <div class="prose">
            <p>${T`A burn does the same job as a timing change. A burn \\(\\Delta v\\) makes the spacecraft drift away from where it would have been, at \\(\\Delta v\\) in the direction of the burn, so after a time \\(t_{go}\\) it is about \\(\\Delta v\\,t_{go}\\) away: the earlier the burn, the longer the lever arm. As with timing, only the part of that drift across \\(v_\\infty\\) moves the arrival line; the part along it only changes when the spacecraft reaches the Moon. In the lab, midcourse burns are made along the direction of flight, \\(\\vec v_{sc}\\), forward (prograde) or backward (retrograde), which makes an angle α with \\(v_\\infty\\):`}</p>
            <div class="eq">\\[ \\Delta b \\approx \\Delta v\\,t_{go}\\,\\sin\\alpha \\qquad\\Longleftrightarrow\\qquad \\Delta v \\approx \\frac{\\Delta b}{t_{go}\\,\\sin\\alpha}, \\qquad \\sin\\alpha = \\frac{v_☾\\,\\sin\\psi}{v_{sc}} \\]</div>
            ${Sym.where([['\\Delta b', N`change of the aim offset you want`, 'm'], ['\\Delta v', N`size of the correction, a burn along the direction of flight: positive prograde, negative retrograde`, 'm/s'], ['t_{go}', N`time from the burn to periselene`, 's'], ['\\alpha', N`angle between the burn direction \\(\\vec v_{sc}\\) and \\(v_\\infty\\)`, N`rad or °`], ['\\psi', N`angle between the Moon’s velocity and \\(v_\\infty\\), as in the previous section`, N`rad or °`], ['v_{sc}', N`spacecraft speed relative to Earth near the Moon`, 'm/s']])}
            ${figMCC()}
            <p>${T`Why \\(\\sin\\alpha = v_☾\\sin\\psi/v_{sc}\\)? In the triangle \\(\\vec v_{sc} = \\vec v_☾ + \\vec v_\\infty\\), take the part of each vector across \\(v_\\infty\\). The part of \\(\\vec v_\\infty\\) across itself is zero, so the part of \\(\\vec v_{sc}\\) across \\(v_\\infty\\) equals the part of \\(\\vec v_☾\\) across it: \\(v_{sc}\\sin\\alpha = v_☾\\sin\\psi\\). Use the time to periselene, not the time to the edge of the sphere: the correction keeps tilting the line while the spacecraft crosses the sphere, 15 hours in this transfer.`}</p>
            <p>${T`Take the lab’s MCC time, 26.7 h after launch. Periselene comes at 70.8 h, so \\(t_{go} = 44.1\\) h = 158 700 s. Near the Moon \\(v_{sc} = 924\\) m/s, so \\(\\sin\\alpha = 1\\,024.5\\times0.78/924 = 0.865\\). To change \\(b\\) by −1 066 km: \\(\\Delta v = -1\\,066\\,000/(158\\,700\\times0.865) = -7.77\\) m/s, a retrograde burn: slowing down makes the spacecraft arrive later and, as in section ${App.sec('freereturn', 3)}, pass closer. Each metre per second is worth 137 km of aim offset.`}</p>
            <p>${T`Real midcourse corrections are not limited to the direction of flight: the spacecraft turns to whatever attitude the burn needs. A burn straight across \\(v_\\infty\\) (sin α = 1) moves the line most per metre per second, here about 15% more than along \\(\\vec v_{sc}\\). The lab keeps a single slider, so its burns are prograde or retrograde only.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`Measure the sensitivity`}</h2>
          <div class="prose">
            <p>${T`Flight controllers did not trust a lever arm worked out by hand. They ran the trajectory twice with two nearby burns and took the difference. In the patched-conic lab, +1 m/s at 26.7 h gives \\(b = 5\\,713\\) km and −1 m/s gives 5 406 km. The sensitivity is (5 713 − 5 406)/2 = 153.5 km of aim offset per m/s, or 121 km of periselene altitude per m/s. It is 12% above the hand value, the size of the error left by the straight-line picture. Then correct linearly: \\(\\Delta v = -1\\,066/153.5 = -6.95\\) m/s. Fly it, measure again, and correct the rest. The burn also changes \\(v_\\infty\\) slightly, so recompute the \\(b\\) you need with the new \\(v_\\infty\\) each pass. The same two-run trick works for the TLI point.`}</p>
            <p>${T`The two tables collect the runs, one per fix: either shift the TLI point or burn at 26.7 h, never both. Each row is one way of computing the correction, from the hand formula to the second measured pass, and the last column is the periselene the lab then actually gives. The target is 110 km; the starting point is 899 km.`}</p>
          </div>
          <div style="overflow-x:auto"><table class="data"><caption>${T`Fix 1: move the TLI point`}</caption><thead><tr><th>${T`Method`}</th><th>${T`TLI point shift`}</th><th>${T`Periselene altitude`}</th></tr></thead><tbody>
            <tr><td>${T`Hand geometry`}</td><td>−0.204°</td><td>199 km</td></tr>
            <tr><td>${T`Measured sensitivity, first pass`}</td><td>−0.229°</td><td>117 km</td></tr>
            <tr><td>${T`Second pass`}</td><td>−0.231°</td><td>110 km</td></tr>
          </tbody></table></div>
          <div style="overflow-x:auto"><table class="data"><caption>${T`Fix 2: a midcourse correction at 26.7 h`}</caption><thead><tr><th>${T`Method`}</th><th>${T`MCC at 26.7 h`}</th><th>${T`Periselene altitude`}</th></tr></thead><tbody>
            <tr><td>${T`Hand geometry`}</td><td>−7.77 m/s</td><td>2 km</td></tr>
            <tr><td>${T`Measured sensitivity, first pass`}</td><td>−6.95 m/s</td><td>92 km</td></tr>
            <tr><td>${T`Second pass`}</td><td>−6.78 m/s</td><td>110 km</td></tr>
          </tbody></table></div>
          <div class="prose">
            <p>${T`What this tells you about the model. In a pure patched-conic world the hyperbola relation for \\(b\\) is exact. The timing and lever-arm relations are first-order and good to about 10–12% here, and measuring the sensitivity removes what is left in two passes.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Plan versus reality`}</h2>
          <div class="prose">
            <p>${T`Everything so far used patched conics, an approximation: one body pulls at a time, the Earth outside the Moon’s sphere of influence and the Moon inside it. The real spacecraft feels the Earth and the Moon at the same time, most of all near the edge of the sphere, where both pull comparably hard. The lab’s other model integrates that: the planar <b>circular restricted three-body problem</b>, with the Earth and the Moon circling their common barycentre.`}</p>
            <p>${T`Fly the same burns in both models, with the ghost on. The patched-conic free return, TLI at −132.333°, hits the Moon in the three-body model. The three-body free return is the TLI at −132.18° with a 0.03 m/s MCC: it passes 290 km from the Moon and returns to a 34 km perigee, where patched conics predicts 899 km and a perigee 4 600 km below the surface. The two free returns differ by 0.15° of TLI point, about two seconds of burn timing. In the three-body model a TLI error of <b>0.1 m/s</b>, out of 3 160, moves the return perigee by about a thousand kilometres.`}</p>
            <p>${T`So the plan gets the Δv and the timing right and the fine geometry wrong. Apollo’s planners designed with conics, refined the trajectory by numerical integration, and corrected it in flight. The ground tracked the spacecraft by radio Doppler, computed the correction on Mission Control's IBM 360s, and read the burn to the crew. The method was the measured sensitivity of section ${App.sec('freereturn', 5)}, with the better model and the tracking data. The method does not change; only the model that measures the sensitivity does.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Lab: free return and corrections`}</h2>
          <div class="prose">
            <p>${T`The lab starts in the patched-conic model. The verdict box says at once whether the spacecraft comes home. The two zooms show the pass close to the Moon, where you can see the flyby altitude or the impact, and the return to Earth: the dashed line continues the orbit to its vacuum perigee, and the gauge under it places that perigee against the corridor.`}</p>
            <ol>
              <li>${T`<i>Free return</i>: press <i>Play</i> and follow it home. Watch the hyperbola swing around the far side of the Moon, then the return graze the Earth inside the corridor.`}</li>
              <li>${T`<i>TLI half a second late</i>: the burn position is off by 0.03°. The return perigee drops to 1 250 km below the surface, far too steep for entry. That is how sensitive a free return is.`}</li>
              <li>${T`Press <i>Mission Control: solve MCC</i>. Less than 0.8 m/s, 26.7 hours after launch, brings the return back into the corridor. Mission Control’s answer earns no credit: load <i>TLI half a second late</i> again and find such a burn yourself with the MCC slider (the arrow keys move it by 5 mm/s). Sections ${App.sec('freereturn', 3)} to ${App.sec('freereturn', 5)} showed how to compute such a burn by hand.`}</li>
              <li>${T`Back to <i>Free return</i>. Switch the physics model to <i>Three-body (reality)</i> and tick the ghost: same burns, a different flight, and it hits the Moon, as section ${App.sec('freereturn', 6)} explained. Fix it: move the TLI burn position until the flight comes home again (it takes about 0.15°), fine-tune with the MCC, and play it to entry interface.`}</li>
            </ol>
          </div>
          ${MoonLab.markup({ id: 'fr', title: N`Free return and corrections`, presets: PRESETS, start: 'free', mcc: true, earthZoom: true, moonSpan: 1.2e7, angRange: [-136, -131], angStep: 0.001, mccMax: 10, detail: 'return' })}
          <p class="note">${T`Planar model with the Moon on a circular orbit. Real Apollo trajectories were three-dimensional, with the Moon's 5° orbital inclination and its eccentric orbit, the Sun's pull and Earth's oblateness all included. The physics and the sensitivity are the same.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('freereturn', { math: 'trig', mathLabel: N`Sine, cosine and the law of cosines.` })}`;

      let needRescue = false;
      MoonLab.mount(page.querySelector('#fr'), {
        id: 'fr', presets: PRESETS, mcc: true, earthZoom: true, moonSpan: 1.2e7, angRange: [-136, -131], angStep: 0.001, mccMax: 10, detail: 'return', startPaused: true,
        // both need the flight played through to entry interface; a preset counts for the first (the watching step),
        // the three-body one needs the candidate's own controls (no preset flies home in that model)
        onFlown(s, t, c) {
          if (!c.inCorridor(s) || !s.perigee || t < s.perigee.t) return;
          Progress.done('freereturn', 'free');
          if (c.model === 'three' && s.touched) Progress.done('freereturn', 'reality');   // the candidate's own fix, flown home
        },
        onResult(s, c) {
          const ok = c.inCorridor(s);
          // rescue: the trajectory was bad before the MCC changes (set by the TLI, a preset or the model), and the candidate's own
          // MCC fixes it (the solver reports its own source, fr-solve, so Mission Control's answer does not count)
          if (c.src !== 'fr-mcc') needRescue = !ok;
          if (c.src === 'fr-mcc' && needRescue && ok) Progress.done('freereturn', 'rescue');
        },
      });
      mountTimingShift(page.querySelector('#fr'));
      mountTiming(page.querySelector('#fr-timing'));
      Practice.embed(page.querySelector('#practice-slot'), 'freereturn', 3);
    },
  });

  /* ---------------- Practice ---------------- */
  const R = String.raw, VMOON = 1.0245;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fm = (x, d = 3) => UI.fmt(x, d);
  Practice.register('freereturn', N`Free return`, [
    { title: N`Timing shift for a given miss`, make() {
      const db = pick([200, 400, 600, 800, 1000, 1200]), th = pick([40, 60, 90, 120, 140]);
      const dt = db / (VMOON * Math.sin(th * D2));
      return { q: T`The Moon moves at 1.0245 km/s. The arrival velocity v∞ makes an angle ψ = <b>${th}°</b> with the Moon’s velocity. By how many minutes must the transfer arrive later (or earlier) to move the aim line by <b>${db} km</b> across the line?`, answer: dt / 60, unit: 'min',
        hint: T`The Moon moves v☾Δt in that time, and only the part across v∞ counts: Δb = v☾ Δt sin ψ.`,
        sol: R`\[ \Delta t = \frac{\Delta b}{v_☾\sin\psi} = \frac{${db}}{1.0245\times\sin ${th}^\circ} = ${fm(dt, 0)}\ \mathrm{s} = ${fm(dt / 60, 1)}\ \mathrm{min} \]` + `<p>${T`As a shift of the TLI point this is ${fm(2.665e-6 * dt / D2, 3)}°, which a spacecraft in a 185 km parking orbit covers in ${fm(2.665e-6 * dt / D2 / 0.06803, 1)} s.`}</p>` };
    } },
    { title: N`Midcourse correction for a miss`, make() {
      const db = pick([40, 80, 120, 200, 300]), tgo = pick([12, 24, 36, 48]), al = pick([50, 60, 75, 90]);
      const dv = db * 1000 / (tgo * 3600 * Math.sin(al * D2));
      return { q: T`Tracking shows the spacecraft will pass <b>${db} km</b> from where you want it at periselene. A burn along the direction of flight (prograde or retrograde), <b>${tgo} h</b> before periselene, makes an angle of <b>${al}°</b> with v∞. What Δv corrects the miss?`, answer: dv, unit: 'm/s',
        hint: T`A burn Δv displaces the spacecraft by about Δv·t_go, and only the part across v∞ counts: Δb = Δv t_go sin α.`,
        sol: R`\[ \Delta v = \frac{\Delta b}{t_{go}\sin\alpha} = \frac{${db}\,000}{${fm(tgo * 3600, 0)}\times\sin ${al}^\circ} = ${fm(dv, 2)}\ \mathrm{m/s} \]` + `<p>${T`The same burn made later would need more: with a shorter lever arm, each m/s moves the periselene less.`}</p>` };
    } },
    { title: N`Departure velocity after a flyby`, make() {
      const vinf = rnd(0.8, 1.1, 0.01), ang = pick([30, 60, 90, 120, 150]);
      const v = Math.sqrt(vinf * vinf + VMOON * VMOON + 2 * vinf * VMOON * Math.cos(ang * D2));
      return { q: T`A spacecraft leaves the Moon’s sphere of influence at v_rel = <b>${fm(vinf, 2)} km/s</b> relative to the Moon, pointing <b>${ang}°</b> away from the Moon’s direction of motion. The Moon moves at 1.0245 km/s. How fast does the spacecraft move relative to Earth?`, answer: v, unit: 'km/s',
        hint: T`Add the two vectors: v_out = v_rel,out + v☾. The angle between them is the given angle, so use the law of cosines with a plus sign.`,
        sol: R`\[ v_{out} = \sqrt{v_{rel}^2 + v_☾^2 + 2\,v_{rel}\,v_☾\cos ${ang}^\circ} = \sqrt{${fm(vinf, 2)}^2 + 1.0245^2 + 2\times${fm(vinf, 2)}\times1.0245\cos ${ang}^\circ} = ${fm(v, 3)}\ \mathrm{km/s} \]` + `<p>${T`Pointing backward (angle above 90°) gives a slow departure: the spacecraft falls back toward Earth, as on a free return.`}</p>` };
    } },
    { title: N`Measured sensitivity`, make() {
      const k = rnd(120, 180, 0.5), b0 = rnd(5100, 6200, 1), c = rnd(-6, 6, 1), want = pick([4336 + 100, 4494, 4600, 4800]);
      const bp = Math.round(b0 + k + c), bm = Math.round(b0 - k + c), kk = (bp - bm) / 2, dv = (want - b0) / kk;
      return { q: T`Mission Control runs the trajectory program three times with a burn along the direction of flight at 26.7 h: with no burn the aim offset is b = <b>${fm(b0, 0)} km</b>, with +1 m/s it is <b>${fm(bp, 0)} km</b>, with −1 m/s it is <b>${fm(bm, 0)} km</b>. You want b = <b>${fm(want, 0)} km</b>. What Δv do you read up to the crew (negative for retrograde)?`, answer: dv, unit: 'm/s',
        hint: T`The sensitivity is the difference of the two runs over the 2 m/s between them. Then Δv = (wanted b − b with no burn) / sensitivity.`,
        sol: R`\[ \frac{\partial b}{\partial v} = \frac{${fm(bp, 0)} - ${fm(bm, 0)}}{2} = ${fm(kk, 1)}\ \mathrm{km\ per\ m/s} \] \[ \Delta v = \frac{${fm(want, 0)} - ${fm(b0, 0)}}{${fm(kk, 1)}} = ${fm(dv, 2)}\ \mathrm{m/s} \]` + `<p>${T`Fly it, measure again, and correct what is left: the relation is only nearly linear.`}</p>` };
    } },
  ], [
    { q: N`A free return and a slingshot arrive at the Moon the same way. What makes the free return come back to Earth?`, opts: [N`It passes ahead of the Moon and around its far side, so the Moon turns its velocity backward and it falls home`, N`It passes behind the Moon, so the Moon throws it forward`, N`It fires the engine behind the Moon to turn around`, N`It passes so close that the Moon’s pull stops it`], a: 0, why: N`Seen from the Moon both are hyperbolas of the same speed; only the turn differs. Turned backward, v_rel is subtracted from v☾ and the spacecraft leaves slowly, falling back toward Earth.` },
    { q: N`The lab’s free return comes back to a 52 km vacuum perigee. What does “vacuum perigee” mean?`, opts: [N`The lowest point the path would reach if the Earth had no atmosphere`, N`The altitude where the air becomes thick enough to slow the capsule`, N`The perigee of the parking orbit before TLI`, N`The lowest point measured by radar during entry`], a: 0, why: N`The air changes the path before it gets there, so the corridor is defined on the airless path: about 12 to 65 km in the lab.` },
    { q: N`The patched-conic free return hits the Moon when flown in the three-body model. Why?`, opts: [N`Patched conics let only one body pull at a time; near the edge of the sphere both pull comparably, and the small differences grow over three days`, N`The three-body model adds the Earth’s atmosphere`, N`Patched conics ignore the Moon’s gravity altogether`, N`The three-body model uses a different TLI speed`], a: 0, why: N`The plan gets the Δv and timing right and the fine geometry wrong. Flight controllers fix the rest with midcourse corrections, measuring the sensitivity in the better model.` },
  ]);
})();
