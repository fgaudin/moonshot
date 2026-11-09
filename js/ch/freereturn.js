/* Chapter: Free Return. What a flyby does in Earth's frame, the free return, aiming by timing, midcourse corrections
   by hand and by measured sensitivity, and the three-body reality check.
   Lab: the Earth–Moon simulator of js/ch/moon.js (window.MoonLab) with MCC, the Earth zoom and the model switch. */
(function () {
  'use strict';

  Progress.register('freereturn', {
    name: N`Free Return`, topic: 'freereturn', glyph: 'figure8',
    briefing: N`Three days of coasting towards a target moving at a kilometre per second. Get the trans-lunar burn right and the Moon itself will swing you home if anything breaks. Apollo 13 had already left that path when its oxygen tank exploded; a short burn put it back on, and the Moon brought the crew home. Get it wrong by a tenth of a metre per second and you will need Mission Control. You are in Mission Control today, {name}.`,
    objectives: [
      { id: 'free', text: N`Fly a free return all the way home: play it to entry interface, inside the entry corridor` },
      { id: 'rescue', text: N`Rescue a bad trajectory with a midcourse correction` },
      { id: 'reality', text: N`Fly a free return inside the corridor in the three-body model` },
      { id: 'qual', text: N`Qualify: answer 2 free-return problems correctly` },
    ],
    debrief: N`You navigated to the Moon and back, {name}. Next: planning the descent from lunar orbit to the surface.`,
  });

  const PRESETS = {
    free: { dv: 3160, ang: -132.33, mcc: 0, label: N`Free return` },
    late: { dv: 3160, ang: -132.30, mcc: 0, label: N`TLI half a second late` },
    aim: { dv: 3160, ang: -132.18, mcc: 0, label: N`Aim for a 110 km periselene (start)` },
    real: { dv: 3160, ang: -132.18, mcc: 0.03, model: 'three', label: N`Free return, three-body model` },
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
    .fr-ctl { margin-top: .5rem; } .fr-ro { font: .78rem/1.5 var(--f-mono); color: var(--ink); margin-top: .3rem; } .fr-ro .bad { color: var(--bad); }`);

  // the lab's free return at the entry patch point (patched-conic model): v☾, v∞ and the turn δ, in km/s and degrees
  const VM = 1.0245, VINF = 1.038, VSC = 0.9246, TH = 69.1 * D2, DELTA = 86.0 * D2;
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

  /* ---------------- Figure 4: arriving late moves the aim line (interactive, seen from the Moon) ---------------- */
  const PSI = 129 * D2, B0 = 5541, BMIN = 4339, RMN = 1737.4;
  function svgTiming(dtMin) {
    const W = 380, H = 300, sc = 0.024, F = frame(W, H, 130, 190);
    const u = [Math.cos(Math.PI / 2 - PSI), Math.sin(Math.PI / 2 - PSI)], n = [-u[1], u[0]];
    const d = VM * dtMin * 60, db = d * Math.sin(PSI), b = B0 - db;
    const A = vmul(n, B0 * sc), A2 = vsub(A, [0, d * sc]), Af = vmul(n, b * sc);
    const line = (c, cls) => `<path class="${cls}" d="${F.path([vadd(c, vmul(u, -260)), vadd(c, vmul(u, 260))])}"/>`;
    return { b, d, db, svg: `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-mu-thin f-dash" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="${fx(BMIN * sc)}"/>
        <circle class="f-moon" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="${fx(RMN * sc)}"/>
        ${line(A, 'f-mu-thin f-dash')}${dtMin > 0 ? line(Af, 'f-tr') : ''}${F.head(vadd(Af, vmul(u, 120)), u, 'f-tr-fill')}
        ${F.arrow([0, 0], [0, 58], 'f-mu', 'f-mu-fill')}
        ${d * sc > 10 ? F.arrow(A, A2, 'f-ink-ln', 'f-ink-fill') : ''}
        ${db * sc > 2 ? `<path class="f-ac-ln" d="${F.path([A, Af])}"/>` : ''}
        <path class="f-mu-thin" d="${F.path([[0, 0], Af])}"/>
      </svg>`, labels: F.lbs([
        [[-6, 46], '<i>v</i><sub>☾</sub>', 'm r'], [[0, -RMN * sc - 10], T`Moon`, 'm'],
        [[0, -BMIN * sc + 14], T`impact inside`, 'm'],
        [vadd(A, vadd(vmul(u, 60), vmul(n, 14))), T`on time`, 'm l'],
        [vadd(Af, vmul(u, -110)), dtMin > 0 ? T`${UI.fmt(dtMin, 0)} min late` : '', 'tr r'],
        [vadd(vmul(A2, 1), [8, 0]), d * sc > 10 ? '<i>v</i><sub>☾</sub>Δ<i>t</i>' : '', 'l'],
        [vadd(vmul(vadd(A, Af), 0.5), [8, 10]), db * sc > 6 ? 'Δ<i>b</i>' : '', 'acc l'],
        [vadd(vmul(Af, 0.5), [-8, 4]), '<i>b</i>', 'r'],
      ]) };
  }
  function figTiming() {
    const t = svgTiming(22);
    return `<figure class="fig" style="max-width:30rem" id="fr-timing" role="img" aria-label="${T`Seen from the Moon, which stands still. The transfer arrives along a straight line that misses the Moon by the aim offset b. A slider delays the arrival. In the delay the Moon moves forward by v☾Δt, so seen from the Moon the line moves back by that distance; only the part of the shift across the line changes b. A dashed circle marks the aim offsets that hit the Moon.`}">
      <div class="fig-box">${t.svg}${t.labels}</div>
      <div class="fr-ctl">${UI.slider({ id: 'fr-dt', label: T`arrival delay Δt`, min: 0, max: 40, step: 1, value: 22, unit: 'min' })}</div>
      <div class="fr-ro" id="fr-dt-ro"></div>
      <figcaption>${T`Seen from the Moon, to scale. The dashed line is the arrival on time, aimed 5 541 km from the centre. Arrive Δt later and the Moon has moved v☾Δt forward, so the line has moved back by that distance relative to the Moon. A shift along the line changes nothing; the part across it, v☾Δt sin ψ, is the change of aim offset Δb. Inside the dashed circle the spacecraft hits the Moon.`}</figcaption></figure>`;
  }
  function mountTiming(root) {
    const box = root.querySelector('.fig-box'), ro = root.querySelector('#fr-dt-ro');
    UI.bindControls(root, { 'fr-dt': (x) => UI.fmt(x, 0) }, (v) => {
      const t = svgTiming(v['fr-dt']);
      box.innerHTML = t.svg + t.labels;
      ro.innerHTML = T`The Moon moves ${UI.fmt(t.d, 0)} km · Δb = −${UI.fmt(t.db, 0)} km · b = ${UI.fmt(t.b, 0)} km` + (t.b < BMIN ? ` · <span class="bad">${T`below 4 339 km: impact`}</span>` : '');
    }).update();
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
        [vadd(vmul(vadd(vm, vs), 0.5), [10, 6]), '<i>v</i><sub>∞</sub>', 'acc l'],
        [vadd(vm, vmul([Math.cos((Math.PI / 2 + aV) / 2), Math.sin((Math.PI / 2 + aV) / 2)], 36)), 'ψ', ''],
        [vadd(vs, vmul([Math.cos((aV + aS) / 2 + Math.PI), Math.sin((aV + aS) / 2 + Math.PI)], 42)), 'α', ''],
        [vadd(dvTip, [6, 6]), T`burn Δv`, 'gd l'],
        [vadd(vmul(vadd(along, dvTip), 0.5), [8, -4]), 'Δ<i>v</i> sin α', 'acc l'],
      ])}</div>
      <figcaption>${T`The burn is made along the direction of flight, v<sub>sc</sub>. Only its part across v∞ moves the aim line: Δv sin α. After t<sub>go</sub> that sideways speed has moved the spacecraft by Δv t<sub>go</sub> sin α. The burn is drawn much larger than to scale; the triangle is to scale.`}</figcaption></figure>`;
  }

  /* ---------------- Chapter ---------------- */
  App.chapter({
    id: 'freereturn', phase: N`Translunar coast`, title: N`Free Return`, lab: N`Free return and corrections`,
    blurb: N`What a lunar flyby does seen from Earth, the free return that saved Apollo 13, and how to aim and correct a trajectory that is sensitive to a tenth of a metre per second.`,
    render(page) {
      const mc = Progress.code('moon');
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('freereturn')} · Translunar coast`,
          title: T`Free Return`,
          lede: T`Swing around the Moon on the correct side and it throws you back to Earth without an engine burn. That path brought Apollo 13 home. It is also so sensitive that a fraction of a second of burn timing moves the return by a thousand kilometres, so it is corrected on the way. This module does both with the patched-conic tools of module ${mc}, then checks them against reality.`,
          refs: [T`Sellers · Interplanetary Travel`, T`BMW ch. 7 Lunar Trajectories`],
        })}
        ${Progress.briefing('freereturn', { theory: 'theory', lab: 'fr', math: 'refresher', mathLabel: N`Adding and subtracting vectors.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`What a flyby does`}</h2>
          <div class="prose">
            <p>${T`Module ${mc} ended inside the sphere of influence. At patch 1 the spacecraft enters it at \\(v_{rel}\\) relative to the Moon. The Moon’s hyperbola turns that velocity by δ, and at patch 2, at the same distance from the Moon, it leaves just as fast: same length, new direction. Now go back to the Earth’s point of view. At patch 2, change frames again, the other way: add the Moon’s velocity.`}</p>
            <div class="eq">\\[ \\vec v_{out} = \\vec v_{rel,out} + \\vec v_☾ \\]</div>
            ${Sym.where([['\\vec v_{out}', N`velocity relative to Earth after the flyby`, 'm/s'], ['\\vec v_{rel,out}', N`velocity relative to the Moon at patch 2: as long as at patch 1, turned by δ`, 'm/s'], ['\\vec v_☾', N`the Moon’s orbital velocity, about 1.02 km/s`, 'm/s']])}
            ${Primer.box('vectors', false, 'refresher')}
            ${figFlyby()}
            <p>${T`The two \\(v_{rel}\\) have the same length but point differently, so adding the same \\(\\vec v_☾\\) gives a different velocity relative to Earth. That is the <b>gravity assist</b>: relative to the Moon nothing is gained or lost, relative to the Earth the speed and the direction of the orbit change.`}</p>
            <p>${T`<b>Which side?</b> The Moon’s pull turns \\(v_{rel}\\) toward the Moon. The free return comes in ahead of the Moon, on the side the Moon is moving toward, swings around its far side and leaves behind it. The turn then points \\(v_{rel}\\) backward along the Moon’s path, \\(v_{out}\\) is short, the spacecraft loses energy relative to the Earth and falls back: the free-return figure. Come in behind the Moon and the turn is forward: the spacecraft gains energy and is thrown outward: the slingshot figure. In the lab’s patched-conic model, starting from the scenario <i>Aim for a 110 km periselene</i>, a TLI point 1.18° earlier (17 seconds of burn timing) aims straight at the centre and hits the Moon. At 3° earlier the line is on the other side, at a 3 678 km periselene, and the spacecraft leaves on an escape path from Earth.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`The free return`}</h2>
          <div class="prose">
            <p>${T`A <b>free return</b> is the flyby whose turn sends the spacecraft back to Earth with a perigee inside the <b>entry corridor</b>: the narrow band of perigee heights, about 20 to 65 km in the lab, where the capsule neither skips off the atmosphere nor dives into it too steeply (module ${Progress.code('entry')}). The perigee is measured as if the Earth had no air, the <b>vacuum perigee</b>. In the rotating frame, where the Earth–Moon line stands still, the path traces the famous <b>figure eight</b>. Patched conics can design one: in the lab, a TLI of 3 160 m/s at −132.33° passes 373 km from the Moon and comes back to a 29 km vacuum perigee.`}</p>
            <p>${T`Apollo 8, 10 and 11 flew free-return trajectories, so that a dead main engine would still mean coming home. Apollo 12 onward used <b>hybrid</b> trajectories to reach landing sites the free return could not. They left the free return with a midcourse burn of the Service Propulsion System. On Apollo 13 an oxygen tank exploded 56 hours out, crippling the Service Module and making its engine too risky to use. The crew fired the Lunar Module’s descent engine for 35 seconds to get <i>back</i> on a free return, then burned again two hours after closest approach (PC+2), back on the near side, to speed up the return. Neither burn was needed to turn the spacecraft around: the Moon did that.`}</p>
          </div>
        </section>

        ${Archive.capsule('earthrise')}

        ${Archive.capsule('apollo13')}

        <section class="section">
          <h2><span class="idx">0.3</span>${T`Lab: free return and corrections`}</h2>
          <div class="prose">
            <p>${T`The lab starts in the patched-conic model. The verdict box says at once whether the spacecraft comes home. The two zooms show the pass close to the Moon, where you can see the flyby altitude or the impact, and the return to Earth: the dashed line continues the orbit to its vacuum perigee, and the gauge under it places that perigee against the corridor.`}</p>
            <ol>
              <li>${T`<i>Free return</i>: press <i>Play</i> and follow it home. Watch the hyperbola swing around the far side of the Moon, then the return graze the Earth inside the corridor.`}</li>
              <li>${T`<i>TLI half a second late</i>: the burn position is off by 0.03°. The return perigee drops to 1 300 km below the surface, far too steep for entry. That is how sensitive a free return is.`}</li>
              <li>${T`Press <i>Mission Control: solve MCC</i>. Half a metre per second, 26.7 hours after launch, brings the return back into the corridor. Sections ${App.sec('freereturn', 4)} to ${App.sec('freereturn', 6)} show how to compute such a burn by hand.`}</li>
              <li>${T`Switch the physics model to <i>Three-body (reality)</i> and tick the ghost: same burns, a different flight. Section ${App.sec('freereturn', 7)} explains.`}</li>
            </ol>
          </div>
          ${MoonLab.markup({ id: 'fr', title: N`Free return and corrections`, presets: PRESETS, start: 'free', mcc: true, earthZoom: true, moonSpan: 1.2e7, detail: 'return' })}
          <p class="note">${T`Planar model with the Moon on a circular orbit. Real Apollo trajectories were three-dimensional, with the Moon's 5° orbital inclination and its eccentric orbit, the Sun's pull and Earth's oblateness all included. The physics and the sensitivity are the same.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`Aiming by timing`}</h2>
          <div class="prose">
            <p>${T`Section ${App.sec('moon', 4)} gave the aim offset for a chosen periselene. Take the lab’s scenario <i>Aim for a 110 km periselene</i>, in the patched-conic model. Its TLI sends the spacecraft past the Moon at 883 km, aimed \\(b\\) = 5 541 km from the centre. Lunar orbit insertion wants 110 km, which needs \\(b\\) = 4 496 km (the example of section ${App.sec('moon', 4)}). The aim line must move by \\(\\Delta b\\) = 4 496 − 5 541 = −1 045 km. Two tools can move it: the timing of the TLI burn, and a midcourse correction.`}</p>
            <p>${T`Timing first. Look at the arrival from the Moon, which then stands still: the transfer comes in along a straight line, at \\(v_\\infty\\). Now let the whole transfer arrive later by \\(\\Delta t\\): the same path in space, just later. In that time the Moon has moved \\(v_☾\\,\\Delta t\\) further along its orbit, so seen from the Moon the line has moved back by the same distance. A shift along the line changes nothing. Only the part across the line changes the aim offset:`}</p>
            <div class="eq">\\[ \\Delta b \\approx v_☾\\,\\Delta t\\,\\sin\\psi \\qquad\\Longleftrightarrow\\qquad \\Delta t \\approx \\frac{\\Delta b}{v_☾\\,\\sin\\psi} \\]</div>
            ${Sym.where([['\\Delta b', N`change of the aim offset you want`, 'm'], ['\\Delta t', N`how much later the transfer reaches the Moon’s orbit, relative to the Moon’s schedule`, 's'], ['v_☾', N`the Moon’s orbital speed, 1.02 km/s`, 'm/s'], ['\\psi', N`angle between the Moon’s velocity and \\(v_\\infty\\) (not the angle θ at the sphere boundary, which is measured from \\(v_{sc}\\))`, N`rad or °`]], N`Timing does nothing when \\(v_\\infty\\) lies along the Moon’s path (sin ψ = 0) and works best when it lies across it. For this transfer, arriving later makes b smaller.`)}
            ${figTiming()}
            <p>${T`Here \\(\\psi = 129^\\circ\\), so \\(\\sin\\psi = 0.78\\), and \\(v_☾ = 1.0245\\) km/s. For \\(\\Delta b = -1\\,045\\) km: \\(\\Delta t = 1\\,045/(1.0245\\times0.78) = 1\\,307\\) s. Arrive 22 minutes late, while the Moon covers 1 339 km.`}</p>
            <p>${T`Nobody delays the Moon. You move the TLI point instead. Moving the burn by \\(\\Delta\\phi\\) along the parking orbit turns the whole transfer by \\(\\Delta\\phi\\) about Earth. At the Moon’s distance \\(D\\) that is a sideways shift \\(D\\,\\Delta\\phi\\), the same as the Moon being \\(v_☾\\Delta t\\) away, so \\(\\Delta\\phi = \\omega_☾\\,\\Delta t\\), with \\(\\omega_☾ = v_☾/D = 2.66\\times10^{-6}\\) rad/s. Here \\(\\Delta\\phi = 0.20^\\circ\\). In a 185 km parking orbit the spacecraft covers 0.068° per second, so the burn must start <b>2.9 seconds earlier</b>. Three seconds of burn timing move the periselene by 700 km. That is why TLI windows are counted in seconds.`}</p>
            <p>${T`Check it in the lab. Moving the TLI point by −0.200° gives a periselene of 199 km, not 110 km. The straight-line picture is a first estimate: Earth’s pull curves the path, and the geometry changes a little as you shift it. The simulator moves \\(b\\) by 4 845 km per degree of TLI point where the formula gives 5 234 km, about 8% less. Section ${App.sec('freereturn', 6)} removes that error.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`Midcourse correction by hand`}</h2>
          <div class="prose">
            <p>${T`A burn does the same job as a timing change. A velocity change \\(\\Delta v\\) moves the spacecraft sideways at \\(\\Delta v\\), so after a time \\(t_{go}\\) it is about \\(\\Delta v\\,t_{go}\\) away from where it would have been: the earlier the burn, the longer the lever arm. Again only the part across \\(v_\\infty\\) counts. Midcourse burns are made along the direction of flight, \\(\\vec v_{sc}\\), which makes an angle α with \\(v_\\infty\\):`}</p>
            <div class="eq">\\[ \\Delta b \\approx \\Delta v\\,t_{go}\\,\\sin\\alpha \\qquad\\Longleftrightarrow\\qquad \\Delta v \\approx \\frac{\\Delta b}{t_{go}\\,\\sin\\alpha}, \\qquad \\sin\\alpha = \\frac{v_☾\\,\\sin\\psi}{v_{sc}} \\]</div>
            ${Sym.where([['\\Delta b', N`change of the aim offset you want`, 'm'], ['\\Delta v', N`size of the correction, a burn along the direction of flight`, 'm/s'], ['t_{go}', N`time from the burn to periselene`, 's'], ['\\alpha', N`angle between the burn direction \\(\\vec v_{sc}\\) and \\(v_\\infty\\)`, N`rad or °`], ['\\psi', N`angle between the Moon’s velocity and \\(v_\\infty\\), as in the previous section`, N`rad or °`], ['v_{sc}', N`spacecraft speed relative to Earth near the Moon`, 'm/s']])}
            ${figMCC()}
            <p>${T`Why \\(\\sin\\alpha = v_☾\\sin\\psi/v_{sc}\\)? In the triangle \\(\\vec v_{sc} = \\vec v_☾ + \\vec v_\\infty\\), take the part of each vector across \\(v_\\infty\\). The part of \\(\\vec v_\\infty\\) across itself is zero, so the part of \\(\\vec v_{sc}\\) across \\(v_\\infty\\) equals the part of \\(\\vec v_☾\\) across it: \\(v_{sc}\\sin\\alpha = v_☾\\sin\\psi\\). Use the time to periselene, not the time to the edge of the sphere: the correction keeps tilting the line while the spacecraft crosses the sphere, 15 hours in this transfer.`}</p>
            <p>${T`Take the lab’s MCC time, 26.7 h after launch. Periselene comes at 70.8 h, so \\(t_{go} = 44.1\\) h = 158 700 s. Near the Moon \\(v_{sc} = 923\\) m/s, so \\(\\sin\\alpha = 1\\,024.5\\times0.78/923 = 0.866\\). To change \\(b\\) by −1 045 km: \\(\\Delta v = -1\\,045\\,000/(158\\,700\\times0.866) = -7.6\\) m/s. Each metre per second is worth 137 km of aim offset.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Measure the sensitivity`}</h2>
          <div class="prose">
            <p>${T`Flight controllers did not trust a lever arm worked out by hand. They ran the trajectory twice with two nearby burns and took the difference. In the patched-conic lab, +1 m/s at 26.7 h gives \\(b = 5\\,692\\) km and −1 m/s gives 5 390 km. The sensitivity is (5 692 − 5 390)/2 = 151 km of aim offset per m/s, or 119 km of periselene altitude per m/s. It is 10% above the hand value, the size of the error left by the straight-line picture. Then correct linearly: \\(\\Delta v = -1\\,045/151 = -6.9\\) m/s. Fly it, measure again, and correct the rest. The burn also changes \\(v_\\infty\\) slightly, so recompute the \\(b\\) you need with the new \\(v_\\infty\\) each pass. The same two-run trick works for the TLI point.`}</p>
            <p>${T`The two tables collect the runs, one per fix: either shift the TLI point or burn at 26.7 h, never both. Each row is one way of computing the correction, from the hand formula to the second measured pass, and the last column is the periselene the lab then actually gives. The target is 110 km; the starting point is 883 km.`}</p>
          </div>
          <div style="overflow-x:auto"><table class="data"><caption>${T`Fix 1: move the TLI point`}</caption><thead><tr><th>${T`Method`}</th><th>${T`TLI point shift`}</th><th>${T`Periselene altitude`}</th></tr></thead><tbody>
            <tr><td>${T`Hand geometry`}</td><td>−0.200°</td><td>199 km</td></tr>
            <tr><td>${T`Measured sensitivity, first pass`}</td><td>−0.216°</td><td>144 km</td></tr>
            <tr><td>${T`Second pass`}</td><td>−0.226°</td><td>110 km</td></tr>
          </tbody></table></div>
          <div style="overflow-x:auto"><table class="data"><caption>${T`Fix 2: a midcourse correction at 26.7 h`}</caption><thead><tr><th>${T`Method`}</th><th>${T`MCC at 26.7 h`}</th><th>${T`Periselene altitude`}</th></tr></thead><tbody>
            <tr><td>${T`Hand geometry`}</td><td>−7.60 m/s</td><td>20 km</td></tr>
            <tr><td>${T`Measured sensitivity, first pass`}</td><td>−6.91 m/s</td><td>94 km</td></tr>
            <tr><td>${T`Second pass`}</td><td>−6.76 m/s</td><td>110 km</td></tr>
          </tbody></table></div>
          <div class="prose">
            <p>${T`What this tells you about the model. In a pure patched-conic world the hyperbola relation for \\(b\\) is exact. The timing and lever-arm relations are first-order and good to about 10% here, and measuring the sensitivity removes what is left in two passes.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Plan versus reality`}</h2>
          <div class="prose">
            <p>${T`Everything so far used patched conics. The real spacecraft feels the Earth and the Moon at the same time, most of all near the edge of the sphere, where both pull comparably hard. The lab’s other model integrates that: the planar <b>circular restricted three-body problem</b>, with the Earth and the Moon circling their common barycentre.`}</p>
            <p>${T`Fly the same burns in both models, with the ghost on. The patched-conic free return, TLI at −132.33°, hits the Moon in the three-body model. The three-body free return is the TLI at −132.18° with a 0.03 m/s MCC: it passes 290 km from the Moon and returns to a 34 km perigee, where patched conics predicts 883 km and a perigee 4 500 km below the surface. The two free returns differ by 0.15° of TLI point, about two seconds of burn timing. In the three-body model a TLI error of <b>0.1 m/s</b>, out of 3 160, moves the return perigee by about a thousand kilometres.`}</p>
            <p>${T`So the plan gets the Δv and the timing right and the fine geometry wrong. Apollo’s planners designed with conics, refined the trajectory by numerical integration, and corrected it in flight. The ground tracked the spacecraft by radio Doppler, computed the correction on Mission Control's IBM 360s, and read the burn to the crew. The method was the measured sensitivity of section ${App.sec('freereturn', 6)}, with the better model and the tracking data. The method does not change; only the model that measures the sensitivity does.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('freereturn', { math: 'trig', mathLabel: N`Sine, cosine and the law of cosines.` })}`;

      MoonLab.mount(page.querySelector('#fr'), {
        id: 'fr', presets: PRESETS, mcc: true, earthZoom: true, moonSpan: 1.2e7, detail: 'return', startPaused: true,
        // the first objective needs the flight played through to entry interface (a preset counts: it is the watching step)
        onFlown(s, t, c) { if (c.inCorridor(s) && s.perigee && t >= s.perigee.t) Progress.done('freereturn', 'free'); },
        onResult(s, c) {
          const ok = c.inCorridor(s);
          if ((c.src === 'fr-mcc') && c.wasBad && ok) Progress.done('freereturn', 'rescue');
          if (c.touched && ok && c.model === 'three') Progress.done('freereturn', 'reality');
        },
      });
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
      return { q: T`The Moon moves at 1.0245 km/s. The arrival velocity v∞ makes an angle of <b>${th}°</b> with the Moon’s velocity. By how many minutes must the transfer arrive later (or earlier) to move the aim line by <b>${db} km</b> across the line?`, answer: dt / 60, unit: 'min',
        hint: T`The Moon moves v☾Δt in that time, and only the part across v∞ counts: Δb = v☾ Δt sin ψ.`,
        sol: R`\[ \Delta t = \frac{\Delta b}{v_☾\sin\psi} = \frac{${db}}{1.0245\times\sin ${th}^\circ} = ${fm(dt, 0)}\ \mathrm{s} = ${fm(dt / 60, 1)}\ \mathrm{min} \]` + `<p>${T`As a shift of the TLI point this is ${fm(2.665e-6 * dt / D2, 3)}°, which a spacecraft in a 185 km parking orbit covers in ${fm(2.665e-6 * dt / D2 / 0.06803, 1)} s.`}</p>` };
    } },
    { title: N`Midcourse correction for a miss`, make() {
      const db = pick([40, 80, 120, 200, 300]), tgo = pick([12, 24, 36, 48]), al = pick([50, 60, 75, 90]);
      const dv = db * 1000 / (tgo * 3600 * Math.sin(al * D2));
      return { q: T`Tracking shows the spacecraft will pass <b>${db} km</b> from where you want it at periselene. A burn along the direction of flight, <b>${tgo} h</b> before periselene, makes an angle of <b>${al}°</b> with v∞. What Δv corrects the miss?`, answer: dv, unit: 'm/s',
        hint: T`A burn Δv displaces the spacecraft by about Δv·t_go, and only the part across v∞ counts: Δb = Δv t_go sin α.`,
        sol: R`\[ \Delta v = \frac{\Delta b}{t_{go}\sin\alpha} = \frac{${db}\,000}{${fm(tgo * 3600, 0)}\times\sin ${al}^\circ} = ${fm(dv, 2)}\ \mathrm{m/s} \]` + `<p>${T`The same burn made later would need more: with a shorter lever arm, each m/s moves the periselene less.`}</p>` };
    } },
    { title: N`Departure velocity after a flyby`, make() {
      const vinf = rnd(0.8, 1.1, 0.01), ang = pick([30, 60, 90, 120, 150]);
      const v = Math.sqrt(vinf * vinf + VMOON * VMOON + 2 * vinf * VMOON * Math.cos(ang * D2));
      return { q: T`A spacecraft leaves the Moon’s sphere of influence with v∞ = <b>${fm(vinf, 2)} km/s</b>, pointing <b>${ang}°</b> away from the Moon’s direction of motion. The Moon moves at 1.0245 km/s. How fast does the spacecraft move relative to Earth?`, answer: v, unit: 'km/s',
        hint: T`Add the two vectors: v_out = v∞ + v☾. The angle between them is the given angle, so use the law of cosines with a plus sign.`,
        sol: R`\[ v_{out} = \sqrt{v_\infty^2 + v_☾^2 + 2\,v_\infty\,v_☾\cos\varphi} = \sqrt{${fm(vinf, 2)}^2 + 1.0245^2 + 2\times${fm(vinf, 2)}\times1.0245\cos ${ang}^\circ} = ${fm(v, 3)}\ \mathrm{km/s} \]` + `<p>${T`Pointing backward (angle above 90°) gives a slow departure: the spacecraft falls back toward Earth, as on a free return.`}</p>` };
    } },
  ], []);
})();
