/* Chapter: Going to the Moon. Sphere of influence, patched conics, TLI, v∞, the hyperbola at the Moon, LOI.
   Lab: the Earth–Moon simulator, patched conics only. The lab code (MoonLab) is shared with js/ch/freereturn.js,
   which adds midcourse corrections, the Earth zoom and the three-body model. */
(function () {
  'use strict';
  const { C, EM } = Phys;
  const R_SOI = Phys.R_SOI;

  const PRESETS = {
    flyby: { dv: 3160, ang: -132.18, loi: false, label: N`Fly past the Moon` },
    capture: { dv: 3160, ang: -132.41, loi: true, loiDv: 900, label: N`Capture into lunar orbit` },
    impact: { dv: 3160, ang: -132.5, loi: false, label: N`Lunar impact` },
    miss: { dv: 3120, ang: -132, loi: false, label: N`Missed the Moon` },
  };

  /* ---------------- Figure 1: the sphere of influence and the two patched conics ---------------- */
  App.css('moon-fig', `
    .f-moon { fill: var(--moon); fill-opacity: .35; stroke: var(--muted); stroke-width: 1; }
    .f-soi { fill: var(--moon); fill-opacity: .07; stroke: var(--muted); stroke-width: 1.2; stroke-dasharray: 5 4; }
    .f-tr-fill { fill: var(--trace); } .f-mu-thin { fill: none; stroke: var(--muted); stroke-width: .9; }
    .f-ghost { fill: none; stroke: var(--trace); stroke-width: 1.4; stroke-dasharray: 3 4; opacity: .55; }
    .f-inset { fill: var(--panel); stroke: var(--line); stroke-width: 1; }`);
  function figSOI() {
    const Dm = 300, rS = 62, rE = 13, rMn = 8, d = Math.PI / 180;
    const fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%';
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
    const unit = (a) => mul(a, 1 / Math.hypot(...a)), cross = (a, b) => a[0] * b[1] - a[1] * b[0], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    const rot = (q, a) => [q[0] * Math.cos(a) - q[1] * Math.sin(a), q[0] * Math.sin(a) + q[1] * Math.cos(a)];
    const span = (f, a, b, n = 90) => [...Array(n + 1).keys()].map((k) => f(a + (b - a) * k / n));
    // units: Earth's μ = 1, distances in figure units. Conic 1: Earth-centred ellipse, perigee rp1, reaching the sphere at
    // P (118° round the sphere) after a true anomaly nuP; picked so that the moving sphere first touches the path at P
    const M = [Dm, 0], P = add(M, [rS * Math.cos(118 * d), rS * Math.sin(118 * d)]), rP = Math.hypot(...P), nuP = 163.5 * d, rp1 = 20;
    const e1 = (rP - rp1) / (rp1 - rP * Math.cos(nuP)), p1 = rp1 * (1 + e1), w1 = Math.atan2(P[1], P[0]) - nuP, a1 = p1 / (1 - e1 * e1);
    const ell = (nu) => { const r = p1 / (1 + e1 * Math.cos(nu)); return [r * Math.cos(w1 + nu), r * Math.sin(w1 + nu)]; };
    // timing (Kepler): the Moon moves nM per unit time and sweeps nM·tP while the spacecraft climbs to P
    const tOf = (nu) => { const E = 2 * Math.atan(Math.sqrt((1 - e1) / (1 + e1)) * Math.tan(nu / 2)); return Math.sqrt(a1 ** 3) * (E - e1 * Math.sin(E)); };
    const nM = Math.sqrt(1 / Dm ** 3), tP = tOf(nuP), sweep = nM * tP, moonAt = (a) => [Dm * Math.cos(a), Dm * Math.sin(a)];
    // true velocities at P: v along the ellipse, the Moon's v☾ perpendicular to the Earth–Moon line, v_rel = v − v☾
    const vP = Math.sqrt(2 / rP - 1 / a1), fpa = Math.atan2(e1 * Math.sin(nuP), 1 + e1 * Math.cos(nuP)), thP = w1 + nuP;
    const v = mul([Math.cos(thP + Math.PI / 2 - fpa), Math.sin(thP + Math.PI / 2 - fpa)], vP), vM = [0, Math.sqrt(1 / Dm)], vr = sub(v, vM), vrel = Math.hypot(...vr);
    // conic 2: Moon-centred hyperbola from P with v_rel; the Moon's μ (exaggerated, about 3.6% of the Earth's) gives periselene rp2
    const r2 = sub(P, M), h = cross(r2, vr), rp2 = 16;
    const rpOf = (m) => { const E = vrel * vrel / 2 - m / rS, e = Math.sqrt(Math.max(0, 1 + 2 * E * h * h / (m * m))); return h * h / m / (1 + e); };
    let lo = 1e-6, hi = 0.999 * vrel * vrel * rS / 2; for (let k = 0; k < 100; k++) { const m = Math.sqrt(lo * hi); if (rpOf(m) > rp2) lo = m; else hi = m; }
    const mu = lo, sg = Math.sign(h), ev = mul(sub(mul(r2, vrel * vrel - mu / rS), mul(vr, dot(r2, vr))), 1 / mu);
    const e2 = Math.hypot(...ev), w2 = Math.atan2(ev[1], ev[0]), p2 = h * h / mu, nu2 = Math.acos((p2 / rS - 1) / e2), aH = p2 / (e2 * e2 - 1);
    const hypRel = (nu) => { const r = p2 / (1 + e2 * Math.cos(nu)); return [r * Math.cos(w2 + sg * nu), r * Math.sin(w2 + sg * nu)]; };
    const hyp = (nu) => add(M, hypRel(nu)), tH = (nu) => { const F = 2 * Math.atanh(Math.sqrt((e2 - 1) / (e2 + 1)) * Math.tan(nu / 2)); return Math.sqrt(aH ** 3 / mu) * (e2 * Math.sinh(F) - F); };
    const tB = tH(nu2) - tH(-nu2), sweepB = nM * tB;
    // the same Moon leg seen from the Earth: the Moon keeps moving and carries the hyperbola with it
    const posB = (nu) => add(moonAt(nM * (tH(nu) - tH(-nu2))), hypRel(nu));
    const X = hyp(nu2), peri = hyp(0), mid = hyp(-nu2 * 0.55);
    const moonArc = span(moonAt, -sweep - 5 * d, sweepB + 14 * d, 80), rDir = 25 * d;
    // fit the frame: turn the scene by the angle rho that gives the smallest height
    const keyPts = [...span(ell, 0, 175 * d), ...span(hyp, -nu2, nu2), ...span(posB, -nu2, nu2, 40), ...moonArc, [-rE - 30, -rE - 10], [-rE - 30, rE + 10],
      ...[-sweep, 0, sweepB].flatMap((a) => span((t) => add(moonAt(a), [rS * Math.cos(t), rS * Math.sin(t)]), 0, 2 * Math.PI, 24))];
    let rho = 0, best = Infinity;
    for (let a = -20; a <= 30; a++) { const ys = keyPts.map((q) => rot(q, a * d)[1]), hgt = Math.max(...ys) - Math.min(...ys); if (hgt < best) { best = hgt; rho = a * d; } }
    const box = keyPts.map((q) => rot(q, rho)), xs = box.map((q) => q[0]), ys = box.map((q) => q[1]), mg = 14;
    const ex = mg - Math.min(...xs), ey = mg + 18 + Math.max(...ys), W = Math.ceil(Math.max(...xs) - Math.min(...xs) + 2 * mg + 40), H = Math.ceil(Math.max(...ys) - Math.min(...ys) + 2 * mg + 18);
    const S = (q) => { const r = rot(q, rho); return [ex + r[0], ey - r[1]]; }, pts = (list, f = S) => list.map((q, k) => `${k ? 'L' : 'M'}${fx(f(q)[0])},${fx(f(q)[1])}`).join('');
    const head = (q, dir, cls, f = S) => {
      const a = f(q), b = f(add(q, mul(unit(dir), 1))), t = unit(sub(b, a)), n = [-t[1], t[0]];
      return `<path class="${cls}" d="M${fx(a[0] + 9 * t[0])},${fx(a[1] + 9 * t[1])}L${fx(a[0] + 4.5 * n[0])},${fx(a[1] + 4.5 * n[1])}L${fx(a[0] - 4.5 * n[0])},${fx(a[1] - 4.5 * n[1])}Z"/>`; };
    const dirAt = (f, nu, dn) => sub(f(nu + dn), f(nu));
    // inset, top left under the Replay button: the vector triangle at patch 1, to scale, v_sc = v☾ + v_rel
    const k = 56, O = [0, 0], Om = mul(unit(vM), k), Ov = mul(v, k / vM[1]), iTop = 52 + Math.max(...[O, Om, Ov].map((q) => rot(q, rho)[1]));
    const I = (q) => { const r = rot(q, rho); return [74 + r[0], iTop - r[1]]; };
    const arrow = (a, b, cls, fill) => { const c = sub(b, mul(unit(sub(b, a)), 9)); return `<path class="${cls}" d="${pts([a, c], I)}"/>${head(c, sub(b, a), fill, I)}`; };
    const ib = [O, Om, Ov].map(I), ix = ib.map((q) => q[0]), iy = ib.map((q) => q[1]);
    const lbs = (list) => list.map(([[x, y], t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
    // animation data (SVG coordinates): time in units of tP, spacecraft position, Moon offset from its patch-1 position
    const off = (a) => sub(S(moonAt(a)), S(M)).map((n) => +fx(n));
    const anim = {
      tB: +(tB / tP).toFixed(4),
      A: span((nu) => nu, 0, nuP, 160).map((nu) => { const t = tOf(nu) / tP; return [+(t).toFixed(4), ...S(ell(nu)).map((n) => +fx(n)), ...off(-sweep * (1 - t))]; }),
      B: span((nu) => nu, -nu2, nu2, 120).map((nu) => { const t = (tH(nu) - tH(-nu2)) / tP; return [+(1 + t).toFixed(4), ...S(posB(nu)).map((n) => +fx(n)), ...off(nM * tP * t)]; }),
      P: S(P).map((n) => +fx(n)),
    };
    return `<figure class="fig soi-fig" style="max-width:40rem" data-anim='${JSON.stringify(anim)}' role="img" aria-label="${T`An animation in two views. Seen from the Earth: the Moon moves up along its orbit with its sphere of influence, a dashed circle. An Earth-centred ellipse leaves a low orbit and climbs slowly; the Moon catches up and the spacecraft enters the sphere at patch 1. Inside, the spacecraft follows a hyperbola around the Moon while the Moon carries it along, and its path relative to the Earth bends smoothly. Then the Moon is frozen at patch 1 and the hyperbola is drawn as seen from the Moon: it swings behind the Moon at periselene and leaves the sphere at patch 2, making a corner with the ellipse at patch 1. The dashed continuation of the ellipse shows where the spacecraft would go if only Earth pulled. An inset shows the velocities at patch 1: the spacecraft’s velocity relative to Earth is the Moon’s velocity plus the velocity relative to the Moon, v_rel.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path class="f-mu-thin f-dash" d="${pts(moonArc)}"/>${head(moonAt(-19 * d), dirAt(moonAt, -19 * d, 0.01), 'f-mu-fill')}
        <g class="soi-moon"><circle class="f-soi" cx="${fx(S(M)[0])}" cy="${fx(S(M)[1])}" r="${rS}"/>
          <path class="f-ac-ln soi-ride" d="${pts(span(hyp, -nu2, nu2, 120))}"/>
          <circle class="f-moon" cx="${fx(S(M)[0])}" cy="${fx(S(M)[1])}" r="${rMn}"/></g>
        <circle class="f-mu-thin f-dash" cx="${fx(ex)}" cy="${fx(ey)}" r="${rp1}"/>
        <path class="f-ac-ln soi-trail2" d="${pts(span(posB, -nu2, nu2, 120))}"/>
        <g class="soi-end">
          <path class="f-mu-thin" d="${pts([M, add(M, [rS * Math.cos(rDir), rS * Math.sin(rDir)])])}"/>
          <path class="f-ghost" d="${pts(span(ell, nuP, 175 * d, 30))}"/>
          ${head(ell(nuP * 0.6), dirAt(ell, nuP * 0.6, 0.01), 'f-tr-fill')}
          <path class="f-ac-ln" d="${pts(span(hyp, -nu2, nu2, 120))}"/>${head(mid, dirAt(hyp, -nu2 * 0.55, 0.01), 'f-ac-fill')}${head(X, dirAt(hyp, nu2, 0.01), 'f-ac-fill')}
          <path class="f-mu-thin f-dash" d="${pts([M, peri])}"/>
          <circle class="f-ink-fill" cx="${fx(S(X)[0])}" cy="${fx(S(X)[1])}" r="3"/>
          <circle class="f-ac-fill" cx="${fx(S(peri)[0])}" cy="${fx(S(peri)[1])}" r="2.5"/>
          <rect class="f-inset" x="${fx(Math.min(...ix) - 46)}" y="${fx(Math.min(...iy) - 14)}" width="${fx(Math.max(...ix) - Math.min(...ix) + 96)}" height="${fx(Math.max(...iy) - Math.min(...iy) + 32)}" rx="6"/>
          ${arrow(O, Om, 'f-mu', 'f-mu-fill')}${arrow(Om, Ov, 'f-ac-ln thin', 'f-ac-fill')}${arrow(O, Ov, 'f-tr', 'f-tr-fill')}
        </g>
        <path class="f-tr soi-trail" d="${pts(span(ell, 0, nuP))}"/>
        <circle class="f-earth" cx="${fx(ex)}" cy="${fx(ey)}" r="${rE}"/>
        <circle class="f-tr-fill" cx="${fx(S(ell(0))[0])}" cy="${fx(S(ell(0))[1])}" r="3"/>
        <circle class="f-ink-fill soi-sc" cx="${fx(S(P)[0])}" cy="${fx(S(P)[1])}" r="3.5"/>
      </svg>${lbs([
        [S([rp1 + 5, 6]), T`Earth`, 'm l'],
        [S(add(moonAt(-40 * d), [-8, 0])), T`Moon’s orbit`, 'm r'],
        [S([-rp1 - 5, -rp1 + 2]), 'TLI', 'tr r'],
        [S(add(ell(nuP * 0.72), [8, -10])), T`Earth-centred ellipse`, 'tr l'],
      ])}<span class="lb m l soi-status" style="left:${pct(8, W)};top:${pct(H - 10, H)}">${T`Moon frozen at patch 1: seen from the Moon`}</span><div class="soi-end">${lbs([
        [S(add(M, [0, -rMn - 10])), T`Moon`, 'm'],
        [S(add(M, [rS * Math.cos(rDir) * 0.6 + 2, rS * Math.sin(rDir) * 0.6 + 9])), '<i>r</i><sub>SOI</sub>', 'm'],
        [S(add(ell(173 * d), [-8, 4])), T`Earth only`, 'tr r'],
        [S(add(P, [-6, 10])), T`patch 1 (entry)`, 'r'],
        [S(add(peri, [6, 0])), T`periselene`, 'acc l'],
        [S(add(X, [32, -38])), T`Moon-centred hyperbola`, 'acc r'],
        [S(add(X, [-9, 0])), T`patch 2 (exit)`, 'r'],
        [I(add(mul(Om, 0.5), [-12, 0])), '<i>v</i><sub>☾</sub>', 'm r'], [I(add(Ov, [6, 2])), '<i>v</i><sub>sc</sub>', 'tr l'],
        [I(add(mul(add(Om, Ov), 0.5), [8, 6])), '<i>v</i><sub>rel</sub>', 'acc l'],
        [[Math.min(...ix) - 40, Math.max(...iy) + 10], T`at patch 1`, 'm l'],
      ])}</div><button class="btn soi-replay" type="button" hidden>${T`▸ Replay`}</button></div>
      <figcaption>${T`Not to scale: the Earth, the Moon and the parking orbit are drawn far too large, and the Moon’s pull is exaggerated so that the bend shows. The animation first shows the trip as seen from the Earth. The spacecraft climbs on conic 1 (blue), a two-body orbit around the Earth alone, and the Moon catches up: the path meets the sphere at patch 1 and not before. Inside, conic 2 (orange), a two-body orbit around the Moon alone, takes over while the Moon carries it along, so relative to the Earth the path bends smoothly, with no corner. The final picture freezes the Moon at patch 1 and draws the hyperbola as seen from the Moon. The corner at patch 1 is only that change of viewpoint, the velocity changing frame: v<sub>rel</sub> = v<sub>sc</sub> − v☾. At patch 2 the opposite change, v<sub>sc</sub> = v<sub>rel</sub> + v☾, starts a new Earth-centred conic, the return leg. Without the Moon the spacecraft would follow the dashed ellipse.`}</figcaption></figure>`;
  }

  // play figure 13.1 once when it scrolls into view: seen from the Earth (the Moon catches up, then carries the spacecraft
  // round), then the frozen-Moon picture
  App.css('moon-fig-anim', `
    .soi-fig .soi-end, .soi-fig .soi-trail2, .soi-fig .soi-ride { transition: opacity .7s; }
    .soi-fig .soi-trail2 { opacity: 0; } .soi-fig .soi-ride { opacity: 0; }
    .soi-fig.playing .soi-end { opacity: 0; transition: none; }
    .soi-fig.playing .soi-trail2 { opacity: 1; transition: none; }
    .soi-fig.playing.in-b .soi-ride { opacity: .3; }
    .soi-fig .soi-replay { position: absolute; left: .3rem; top: .3rem; font-size: .72rem; padding: .15rem .5rem; }`);
  function mountSOI(root) {
    const fig = root.querySelector('.soi-fig'); if (!fig) return;
    const A = JSON.parse(fig.dataset.anim), $ = (s) => fig.querySelector(s);
    const trail = $('.soi-trail'), trail2 = $('.soi-trail2'), sc = $('.soi-sc'), moon = $('.soi-moon'), btn = $('.soi-replay'), status = $('.soi-status');
    const MS = 6000, SLOW = 1.8, tEnd = 1 + A.tB, HOLD = 1500;   // MS: playback time for the climb to patch 1; the leg inside the sphere plays SLOW times slower
    const seenEarth = T`Seen from the Earth: the Moon moves`, seenMoon = T`Moon frozen at patch 1: seen from the Moon`;
    let raf = 0, t0 = 0;
    const path = (list) => list.map((q, k) => `${k ? 'L' : 'M'}${q[1]},${q[2]}`).join('');
    const lerp = (list, t) => { let i = 1; while (i < list.length - 1 && list[i][0] < t) i++; const a = list[i - 1], b = list[i], u = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 1; return [i, a.map((x, j) => x + (b[j] - x) * u)]; };
    function frame(t) {   // t: mission time in units of the climb to patch 1 (0 = TLI, 1 = patch 1, tEnd = patch 2)
      const inB = t > 1, [i, q] = lerp(inB ? A.B : A.A, t);
      if (!inB) { trail.setAttribute('d', path(A.A.slice(0, i)) + `L${q[1].toFixed(1)},${q[2].toFixed(1)}`); trail2.setAttribute('d', ''); }
      else { trail.setAttribute('d', path(A.A)); trail2.setAttribute('d', path(A.B.slice(0, i)) + `L${q[1].toFixed(1)},${q[2].toFixed(1)}`); }
      sc.setAttribute('cx', q[1].toFixed(1)); sc.setAttribute('cy', q[2].toFixed(1));
      moon.setAttribute('transform', `translate(${q[3].toFixed(1)} ${q[4].toFixed(1)})`);
      fig.classList.toggle('in-b', inB);
    }
    function finish() {   // the frozen-Moon picture
      fig.classList.remove('playing', 'in-b'); moon.removeAttribute('transform');
      trail.setAttribute('d', path(A.A)); trail2.setAttribute('d', path(A.B));
      sc.setAttribute('cx', A.P[0]); sc.setAttribute('cy', A.P[1]); status.textContent = seenMoon; btn.hidden = false;
    }
    function play() {
      cancelAnimationFrame(raf); fig.classList.add('playing'); btn.hidden = true; status.textContent = seenEarth; t0 = performance.now();
      const step = (now) => {
        const ms = now - t0, t = Math.min(tEnd, ms <= MS ? ms / MS : 1 + (ms - MS) / (MS * SLOW)); frame(t);
        if (ms < MS + A.tB * MS * SLOW + HOLD) raf = requestAnimationFrame(step); else finish();
      };
      raf = requestAnimationFrame(step);
    }
    btn.addEventListener('click', play);
    if (UI.reducedMotion() || !('IntersectionObserver' in window)) { btn.hidden = false; return; }
    fig.classList.add('playing'); status.textContent = seenEarth; frame(0);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.6 });
    io.observe(fig);
  }

  /* shared helpers for the static figures below */
  const fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
  const vunit = (a) => vmul(a, 1 / Math.hypot(...a));
  // a figure frame: maths coordinates (y up) around an origin, labels as HTML spans
  function frame(W, H, ox, oy) {
    const S = (q) => [ox + q[0], oy - q[1]];
    const path = (list) => list.map((q, k) => `${k ? 'L' : 'M'}${fx(S(q)[0])},${fx(S(q)[1])}`).join('');
    const head = (q, dir, cls) => { const a = S(q), t = vunit([dir[0], -dir[1]]), n = [-t[1], t[0]];
      return `<path class="${cls}" d="M${fx(a[0] + 9 * t[0])},${fx(a[1] + 9 * t[1])}L${fx(a[0] + 4.5 * n[0])},${fx(a[1] + 4.5 * n[1])}L${fx(a[0] - 4.5 * n[0])},${fx(a[1] - 4.5 * n[1])}Z"/>`; };
    // a vector: the tip lands exactly on b
    const arrow = (a, b, cls, fill) => { const c = vsub(b, vmul(vunit(vsub(b, a)), 9)); return `<path class="${cls}" d="${path([a, c])}"/>${head(c, vsub(b, a), fill)}`; };
    const arc = (c, r, a0, a1, cls, n = 30) => `<path class="${cls}" d="${path([...Array(n + 1).keys()].map((k) => vadd(c, [r * Math.cos(a0 + (a1 - a0) * k / n), r * Math.sin(a0 + (a1 - a0) * k / n)])))}"/>`;
    const lbs = (list) => list.map(([q, t, c]) => { const [x, y] = S(q); return `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`; }).join('');
    const dot = (q, cls, r = 3) => `<circle class="${cls}" cx="${fx(S(q)[0])}" cy="${fx(S(q)[1])}" r="${r}"/>`;
    return { S, path, head, arrow, arc, lbs, dot };
  }
  const D2 = Math.PI / 180;

  /* ---------------- Figure 3: the velocity triangle at the sphere boundary (to scale, lab numbers) ---------------- */
  function figVrel() {
    const W = 340, H = 220, k = 140, F = frame(W, H, 118, 196);
    const vm = [0, 1.0245 * k], th = 69.1 * D2, vs = vmul([Math.sin(th), Math.cos(th)], 0.9246 * k);
    return `<figure class="fig" style="max-width:24rem" role="img" aria-label="${T`A velocity triangle drawn to scale. From one point, the Moon’s velocity points up and the spacecraft’s velocity relative to Earth points up and to the right, 69° away from it. The third side, from the tip of the Moon’s velocity to the tip of the spacecraft’s, is the velocity relative to the Moon.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${F.arc([0, 0], 34, Math.PI / 2, Math.PI / 2 - th, 'f-ink-ln')}
        ${F.arrow([0, 0], vm, 'f-mu', 'f-mu-fill')}${F.arrow(vm, vs, 'f-ac-ln thin', 'f-ac-fill')}${F.arrow([0, 0], vs, 'f-tr', 'f-tr-fill')}
        ${F.dot([0, 0], 'f-ink-fill', 2.5)}
      </svg>${F.lbs([
        [[-8, vm[1] * 0.55], '<i>v</i><sub>☾</sub> = 1.02 km/s', 'm r'],
        [vadd(vmul(vs, 0.55), [6, -12]), '<i>v</i><sub>sc</sub> = 0.92 km/s', 'tr l'],
        [vadd(vmul(vadd(vm, vs), 0.5), [10, 6]), '<i>v</i><sub>rel</sub> = 1.11 km/s', 'acc l'],
        [[Math.cos(Math.PI / 2 - th / 2) * 47, Math.sin(Math.PI / 2 - th / 2) * 47], 'θ', ''],
      ])}</div>
      <figcaption>${T`To scale, for the lab’s transfer at the entry patch point. The velocity relative to the Moon is the third side of the triangle: v<sub>sc</sub> = v☾ + v<sub>rel</sub>. The law of cosines gives its length from the two other sides and the angle θ between them.`}</figcaption></figure>`;
  }

  /* ---------------- Figure: the angles that give θ at the entry point (not to scale, sphere enlarged) ---------------- */
  function figTheta() {
    const W = 460, H = 340, F = frame(W, H, 34, 214), D = 300, rS = 110, lam = 43.4 * D2, phi = 76.8 * D2, L = 112;
    const M = [D, 0], P = vadd(M, [-rS * Math.cos(lam), rS * Math.sin(lam)]), gam = Math.atan2(P[1], P[0]);
    const dir = (a) => [Math.cos(a), Math.sin(a)], aH = gam + Math.PI / 2, aV = aH - phi, aM = Math.PI / 2, aPM = Math.atan2(P[1], P[0] - D);
    const Vs = vadd(P, vmul(dir(aV), L)), Vm = vadd(P, vmul(dir(aM), L * 0.95));
    const mid = (c, r, a0, a1) => vadd(c, vmul(dir((a0 + a1) / 2), r));
    return `<figure class="fig" style="max-width:32rem" role="img" aria-label="${T`The Earth on the left, the Moon on the right inside its sphere of influence, drawn far too large. The entry point sits on the sphere, ahead of the Moon. At the Moon, the angle λ1 separates the line to the Earth from the line to the entry point. At the Earth, the angle γ1 separates the line to the Moon from the line to the entry point, of length r1. At the entry point the local horizontal is perpendicular to r1. The spacecraft’s velocity leans φ1 above it; the Moon’s velocity, perpendicular to the Earth–Moon line, is turned γ1 from the horizontal. The angle between the two velocities is θ = φ1 − γ1.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-soi" cx="${fx(F.S(M)[0])}" cy="${fx(F.S(M)[1])}" r="${rS}"/>
        <path class="f-mu-thin" d="${F.path([[0, 0], M])}"/><path class="f-mu-thin" d="${F.path([M, P])}"/>
        <path class="f-ink-ln" d="${F.path([[0, 0], P])}"/>
        <path class="f-mu-thin f-dash" d="${F.path([P, vadd(P, vmul(dir(gam), 46))])}"/>
        <path class="f-mu-thin f-dash" d="${F.path([vadd(P, vmul(dir(aH), -40)), vadd(P, vmul(dir(aH), 100))])}"/>
        ${F.arc([0, 0], 70, 0, gam, 'f-ink-ln')}${F.arc(M, 26, aPM, Math.PI, 'f-ink-ln')}
        ${F.arc(P, 84, aV, aH, 'f-tr', 40)}${F.arc(P, 50, aV, aM, 'f-ac-ln', 30)}${F.arc(P, 50, aM, aH, 'f-ink-ln', 12)}
        ${F.arrow(M, vadd(M, [0, 46]), 'f-mu', 'f-mu-fill')}
        ${F.arrow(P, Vm, 'f-mu', 'f-mu-fill')}${F.arrow(P, Vs, 'f-tr', 'f-tr-fill')}
        <circle class="f-earth" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="13"/><circle class="f-moon" cx="${fx(F.S(M)[0])}" cy="${fx(F.S(M)[1])}" r="8"/>
        ${F.dot(P, 'f-ink-fill', 3.5)}
      </svg>${F.lbs([
        [[0, -24], T`Earth`, 'm'], [vadd(M, [0, -20]), T`Moon`, 'm'], [vadd(M, [0, -rS - 12]), T`sphere of influence`, 'm'],
        [[D * 0.5, -10], '<i>D</i>', 'm'], [vadd(vmul(vadd(M, P), 0.5), [8, -4]), '<i>r</i><sub>SOI</sub>', 'm l'],
        [vadd(vmul(P, 0.5), [-4, 12]), '<i>r</i><sub>1</sub>', 'r'],
        [vadd(dir(gam / 2), [84 * Math.cos(gam / 2) - 1, 84 * Math.sin(gam / 2) - 1]), 'γ<sub>1</sub>', ''],
        [mid(M, 40, aPM, Math.PI), 'λ<sub>1</sub>', ''],
        [vadd(P, [-12, 6]), T`entry point`, 'r'],
        [vadd(M, [6, 40]), '<i>v</i><sub>☾</sub>', 'm l'], [vadd(Vm, [0, 10]), '<i>v</i><sub>☾</sub>', 'm'], [vadd(Vs, [8, 0]), '<i>v</i><sub>sc</sub>', 'tr l'],
        [vadd(P, vmul(dir(aH), 104)), T`local horizontal`, 'm r'],
        [mid(P, 97, aV, aH), 'φ<sub>1</sub>', 'tr'], [mid(P, 62, aV, aM), 'θ', 'acc'], [vadd(P, vmul(dir((aM + aH) / 2), 63)), 'γ<sub>1</sub>', ''],
      ])}</div>
      <figcaption>${T`Not to scale: the sphere is drawn far too large, which exaggerates γ<sub>1</sub> (7.7° in the lab). The Moon’s velocity is perpendicular to the Earth–Moon line, the local horizontal perpendicular to r<sub>1</sub>, so at the entry point the two are γ<sub>1</sub> apart. φ<sub>1</sub> is measured from the horizontal, θ from the Moon’s velocity: θ = φ<sub>1</sub> − γ<sub>1</sub>.`}</figcaption></figure>`;
  }

  /* ---------------- Figure 4: the hyperbola at the Moon, aim offset b, periselene, turn angle ---------------- */
  function figHyperbola() {
    const W = 380, H = 320, F = frame(W, H, 200, 160), a = 40, e = 1.6, p = a * (e * e - 1);
    const nuInf = Math.acos(-1 / e), Cc = [a * e, 0], dIn = [Math.cos(nuInf), Math.sin(nuInf)], dOut = [Math.cos(nuInf), -Math.sin(nuInf)];
    const hyp = (nu) => { const r = p / (1 + e * Math.cos(nu)); return [r * Math.cos(nu), r * Math.sin(nu)]; };
    const nuMax = Math.acos((p / 150 - 1) / e), pts = [...Array(121).keys()].map((k) => hyp(nuMax - 2 * nuMax * k / 120));
    const foot = vadd(Cc, vmul(dIn, -(Cc[0] * dIn[0]))), rp = hyp(0), fwd = vmul(dIn, -1);
    const dirAt = (nu) => vsub(hyp(nu - 0.01), hyp(nu));
    const aIn = Math.atan2(fwd[1], fwd[0]), aOut = Math.atan2(dOut[1], dOut[0]);
    return `<figure class="fig" style="max-width:30rem" role="img" aria-label="${T`The Moon with a hyperbola passing to its right. A dashed straight line shows the path the spacecraft would follow without the Moon’s gravity; its distance from the Moon’s centre is the aim offset b. The real path bends around the Moon, passes closest at the periselene radius r_p, which is smaller than b, and leaves along a second direction. The angle between the arrival and departure directions is the turn angle δ.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path class="f-mu-thin f-dash" d="${F.path([vadd(Cc, vmul(dIn, 205)), vadd(Cc, vmul(dIn, -150))])}"/>
        <path class="f-mu-thin f-dash" d="${F.path([Cc, vadd(Cc, vmul(dOut, 205))])}"/>
        ${F.arc(Cc, 30, aIn, aOut, 'f-ink-ln')}
        <path class="f-ink-ln" d="${F.path([[0, 0], foot])}"/><path class="f-ink-ln" d="${F.path([[0, 0], rp])}"/>
        <path class="f-ac-ln" d="${F.path(pts)}"/>${F.head(hyp(1.45), dirAt(1.45), 'f-ac-fill')}${F.head(hyp(-1.75), dirAt(-1.75), 'f-ac-fill')}
        <circle class="f-moon" cx="${fx(F.S([0, 0])[0])}" cy="${fx(F.S([0, 0])[1])}" r="8"/>
        ${F.dot(rp, 'f-ac-fill', 3)}
      </svg>${F.lbs([
        [[0, -18], T`Moon`, 'm'],
        [vadd(vmul(foot, 0.5), [-8, 6]), '<i>b</i>', 'r'],
        [vadd(vmul(rp, 0.6), [0, -10]), '<i>r</i><sub>p</sub>', ''],
        [vadd(rp, [8, 0]), T`periselene`, 'acc l'],
        [vadd(Cc, [0, -44]), 'δ', ''],
        [vadd(Cc, vmul(dIn, 190)), T`aim line, without gravity`, 'm l'],
        [vadd(hyp(nuMax - 0.05), [-8, 0]), T`arrives at v∞`, 'acc r'],
        [vadd(hyp(-nuMax + 0.05), [-8, 0]), T`leaves at v∞`, 'acc r'],
      ])}</div>
      <figcaption>${T`Seen from the Moon, not to scale. Without gravity the spacecraft would follow the dashed line, which misses the Moon’s centre by b, the aim offset. Gravity bends the path into a hyperbola that passes closer, at r<sub>p</sub>, and turns the direction of flight by δ. The spacecraft leaves as fast as it arrived.`}</figcaption></figure>`;
  }

  /* ---------------- The Earth–Moon lab (patched conics; optional MCC, three-body model and Earth zoom) ---------------- */
  App.css('moon-lab', `
    .ml-ctl output { white-space: nowrap; min-width: 11ch; text-align: right; font-variant-numeric: tabular-nums; }
    .ml-verdict { min-height: 5.2rem; border: 1px solid var(--line); border-left: 4px solid var(--muted); border-radius: 6px; padding: .55rem .7rem; background: var(--panel); }
    .ml-verdict b { display: block; font: 600 .84rem/1.3 var(--f-mono); }
    .ml-verdict span { display: block; font: .74rem/1.4 var(--f-mono); color: var(--muted); margin-top: .25rem; }
    .ml-verdict.good { border-left-color: var(--good); } .ml-verdict.good b { color: var(--good); }
    .ml-verdict.bad { border-left-color: var(--bad); } .ml-verdict.bad b { color: var(--bad); }
    .ml-verdict.warn { border-left-color: var(--warn); } .ml-verdict.warn b { color: var(--warn); }
    .tl-side .ml-zoom canvas { height: auto; aspect-ratio: 4 / 3; border-radius: 6px; background: var(--sunk); }
    .tl-lab.ml-two .tl-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (max-width: 860px) { .tl-lab.ml-two .tl-groups { grid-template-columns: minmax(0, 1fr); } }`);

  const MCC_MAX = 1;   // m/s: the MCC slider spans ±MCC_MAX, fine enough to hit a 45 km corridor by hand
  const MoonLab = {
    /* cfg: { id, title, presets, start: preset key, loi, mcc (also enables the model switch), earthZoom, detail: 'moon' | 'return',
             moonSpan: fixed width of the Moon zoom in m (else it follows the spacecraft), startPaused: open paused at launch } */
    markup(cfg) {
      const id = cfg.id, st = cfg.presets[cfg.start];
      const flight = `<div class="tl-group ml-ctl"><h4>${T`Flight`}</h4>
          <div class="ctl"><label for="${id}-preset"><span>${T`Scenario`}</span></label><select id="${id}-preset">${Object.entries(cfg.presets).map(([k, q]) => `<option value="${k}"${k === cfg.start ? ' selected' : ''}>${T(q.label)}</option>`).join('')}</select></div>
          ${UI.slider({ id: `${id}-dv`, label: T`TLI Δv`, min: cfg.dvRange ? cfg.dvRange[0] : 3000, max: cfg.dvRange ? cfg.dvRange[1] : 3250, step: 1, value: st.dv, unit: 'm/s' })}
          ${UI.slider({ id: `${id}-ang`, label: T`TLI burn position (from Earth–Moon line)`, min: cfg.angRange ? cfg.angRange[0] : -150, max: cfg.angRange ? cfg.angRange[1] : -110, step: 0.01, value: st.ang, unit: '°' })}
          ${cfg.loi ? `<label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="${id}-loi"${st.loi ? ' checked' : ''}> ${T`Fire LOI at periselene (retrograde)`}</label>
          ${UI.slider({ id: `${id}-loidv`, label: T`LOI Δv`, min: 800, max: 960, step: 1, value: st.loiDv || 900, unit: 'm/s' })}` : ''}
        </div>`;
      const mc = cfg.mcc ? `<div class="tl-group ml-ctl"><h4>${T`Mission Control`}</h4>
          ${UI.slider({ id: `${id}-mcc`, label: T`MCC at GET 26:42 (along-track)`, min: -MCC_MAX, max: MCC_MAX, step: 0.005, value: st.mcc || 0, unit: 'm/s' })}
          <button class="btn" id="${id}-solve">${T`Mission Control: solve MCC for 40 km entry`}</button>
          <div class="ctl"><span class="mono note">${T`Physics model`}</span><div class="seg" id="${id}-model" role="group" aria-label="${T`Physics model`}"><button data-v="patched" aria-pressed="true">${T`Patched conics (plan)`}</button><button data-v="three" aria-pressed="false">${T`Three-body (reality)`}</button></div></div>
          <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="${id}-ghost"> ${T`Show the other model as a ghost`}</label>
        </div>` : '';
      return `<div class="lab tl-lab${cfg.mcc ? '' : ' ml-two'}" id="${id}">
          <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T(cfg.title)}</h3><span class="spacer"></span>
            <div class="seg" id="${id}-view" role="group" aria-label="${T`Reference frame`}"><button data-v="inertial" aria-pressed="false">${T`Inertial`}</button><button data-v="rotating" aria-pressed="true">${T`Rotating`}</button></div>
          </div>
          <div class="stage"><canvas id="${id}-cv" aria-label="${T`Spacecraft trajectory between Earth and Moon`}"></canvas><div class="overlay" id="${id}-ov"></div></div>
          <div class="tl-side">
            <div class="ml-verdict" id="${id}-verdict" aria-live="polite"></div>
            <div class="mini ml-zoom"><h4 id="${id}-zt" data-at="${cfg.moonSpan ? 'moon' : 'soi'}">${cfg.moonSpan ? T`Zoom: close to the Moon` : T`Zoom: the Moon’s sphere of influence`}</h4><canvas id="${id}-zm" aria-label="${cfg.moonSpan ? T`Fixed close-up of the Moon, showing how far above the surface the spacecraft passes, or where it hits` : T`Close-up that follows the spacecraft: centred on the Earth near the Earth, on the Moon near the Moon`}"></canvas></div>
            ${cfg.earthZoom ? `<div class="mini ml-zoom"><h4>${T`Zoom: the return to Earth`}</h4><canvas id="${id}-ze" aria-label="${T`Close-up of the return to Earth, with a gauge comparing the return perigee with the entry corridor`}"></canvas></div>` : ''}
          </div>
          <div class="tl-transport">
            <div class="btn-row"><button class="btn primary" id="${id}-play">${T`▸ Play`}</button><button class="btn" id="${id}-restart">${T`⟲ Restart`}</button></div>
            ${UI.slider({ id: `${id}-t`, label: T`Mission time`, min: 0, max: 1, step: 0.0005, value: 0 })}
          </div>
          <div class="tl-groups">${flight}${mc}<div class="tl-group"><h4>${T`Outcome`}</h4><dl class="readout" id="${id}-sum"></dl></div></div>
        </div>`;
    },

    mount(root, cfg) {
      const id = cfg.id, $ = (k) => root.querySelector(`#${id}-${k}`), val = (v, k) => v[`${id}-${k}`];
      const simFor = (m) => (m === 'three' ? Phys.simulateTLI : Phys.simulatePatched);
      let model = 'patched', sim = null, other = null, frameName = 'rotating', idx = 0, tNow = 0, warp = 0, slowNote = '', playing = !UI.reducedMotion() && !cfg.startPaused;
      let atStart = !!cfg.startPaused;   // first view: paused at launch, waiting for Play
      const tEnd = () => sim.pts[sim.pts.length - 1].t;
      // the lunar orbit after LOI: lowest and highest altitude (cached on the run)
      const lunarOrbit = (s) => { if (!s.loiT) return null; if (s.orbitAlt === undefined) { const r = s.pts.filter((q) => q.t > s.loiT).map((q) => q.rM - C.RM); s.orbitAlt = r.length ? [Math.min(...r), Math.max(...r)] : null; } return s.orbitAlt; };
      function seek(t, flown = true) {   // flown: false when the view only jumps to the end after a recompute
        tNow = Math.max(0, Math.min(tEnd(), t));
        let lo = 0, hi = sim.pts.length - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (sim.pts[mid].t <= tNow) lo = mid; else hi = mid - 1; }
        idx = lo;
        if (flown && cfg.onFlown && sim) cfg.onFlown(sim, tNow, { lunarOrbit, inCorridor });
      }
      // objectives count only after the candidate has changed a control themselves (not a preset)
      let touched = false;
      root.addEventListener('input', () => { touched = true; }, true);
      root.addEventListener('change', (e) => { touched = e.target.id !== `${id}-preset`; }, true);
      const inCorridor = (s) => s.outcome === 'entry' && s.retAlt >= 20e3 && s.retAlt <= 65e3 && s.minM.alt < 20000e3;
      const view = UI.canvas($('cv'), null), zm = UI.canvas($('zm'), null), ze = cfg.earthZoom ? UI.canvas($('ze'), null) : null;
      const zooms = [zm, ze].filter(Boolean);
      const MCC_T = 26.7 * 3600;
      let vMinH = 0;   // tallest verdict so far
      const simOpts = (v) => ({ dv: val(v, 'dv'), burnAngle: val(v, 'ang'), mcc: cfg.mcc ? { t: MCC_T, dv: val(v, 'mcc') } : null, loi: cfg.loi && val(v, 'loi') ? { dv: val(v, 'loidv') } : null });
      const fmts = { [`${id}-dv`]: (x) => UI.fmt(x, 0), [`${id}-ang`]: (x) => x.toFixed(2), [`${id}-loidv`]: (x) => UI.fmt(x, 0), [`${id}-mcc`]: (x) => (x > 0 ? '+' : '') + x.toFixed(3), [`${id}-t`]: () => (sim ? 'GET ' + UI.fmtTime(tNow) : '') };
      const ctl = UI.bindControls(root, fmts, (v, src) => {
        if (src === `${id}-t`) { seek(val(v, 't') * tEnd()); playing = false; setPlayLabel(); draw(); zooms.forEach((z) => z.redraw()); return; }
        const wasBad = sim && !inCorridor(sim);
        sim = simFor(model)(simOpts(v)); sim.touched = touched;
        const gh = $('ghost');
        other = gh && gh.checked ? simFor(model === 'patched' ? 'three' : 'patched')(simOpts(v)) : null;
        if (cfg.onResult) cfg.onResult(sim, { model, touched, src, wasBad, inCorridor });
        seek(playing || atStart ? 0 : Infinity, false); atStart = false;
        summarize(); draw(); zooms.forEach((z) => z.redraw());
      });
      ['loi', 'ghost'].forEach((k) => { const el = $(k); if (el) el.addEventListener('change', () => ctl.update()); });
      const setModel = (m) => { model = m; root.querySelectorAll(`#${id}-model button`).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === m))); };
      if (cfg.mcc) UI.seg(root, `#${id}-model`, (m) => { model = m; playing = true; setPlayLabel(); ctl.update(); });
      $('preset').addEventListener('change', (e) => {
        const q = cfg.presets[e.target.value];
        ctl.set(`${id}-dv`, q.dv); ctl.set(`${id}-ang`, q.ang);
        if (cfg.mcc) { ctl.set(`${id}-mcc`, q.mcc || 0); setModel(q.model || 'patched'); }
        if (cfg.loi) { $('loi').checked = !!q.loi; if (q.loiDv) ctl.set(`${id}-loidv`, q.loiDv); }
        playing = true; setPlayLabel(); ctl.update();
      });
      if (cfg.mcc) $('solve').addEventListener('click', (e) => {
        const btn = e.currentTarget, v = ctl.read();
        btn.textContent = T`Computing…`;
        setTimeout(() => {
          const dv = Phys.solveMCC({ ...simOpts(v), mcc: { t: MCC_T, dv: 0 } }, 40000, MCC_MAX, simFor(model));
          if (dv == null) { btn.textContent = T`No fix within ±1 m/s: adjust TLI`; return; }
          btn.textContent = T`RTCC solution: ${dv >= 0 ? '+' : ''}${UI.dec(dv.toFixed(3))} m/s. Solve again`;
          ctl.set(`${id}-mcc`, (Math.round(dv / 0.005) * 0.005).toFixed(3)); tNow = 0; playing = true; setPlayLabel(); touched = true; ctl.update(`${id}-mcc`);
        }, 30);
      });
      UI.seg(root, `#${id}-view`, (f) => { frameName = f; draw(); });
      const playBtn = $('play');
      const setPlayLabel = () => { playBtn.textContent = playing ? T`❚❚ Pause` : T`▸ Play`; };
      playBtn.addEventListener('click', () => { if (tNow >= tEnd()) seek(0); playing = !playing; setPlayLabel(); });
      $('restart').addEventListener('click', () => { seek(0); playing = true; setPlayLabel(); });
      setPlayLabel();

      const km0 = (m) => UI.fmt(m / 1000, 0);
      function verdict(s) {
        const ret = s.retAlt, near = s.minM.alt < 20000e3;
        if (s.outcome === 'impact') return ['bad', T`Lunar impact`, T`The aim line passed too close to the Moon’s centre.`];
        if (s.outcome === 'lunarOrbit') { const o = lunarOrbit(s); return ['good', T`Captured in lunar orbit`, o ? T`Orbit ${km0(o[0])} × ${km0(o[1])} km above the Moon` : '']; }
        if (cfg.detail === 'moon') {
          if (!near) return ['warn', T`Missed the Moon`, T`Closest approach ${km0(s.minM.alt)} km: the Moon was not there when the spacecraft arrived.`];
          return [s.minM.alt >= 50e3 && s.minM.alt <= 2000e3 ? 'good' : 'warn', T`Flew past the Moon`, T`Periselene ${km0(s.minM.alt)} km above the surface. Without a braking burn the spacecraft leaves the sphere again.`];
        }
        if (s.outcome === 'entry' || s.outcome === 'impactE') {
          if (ret >= 20e3 && ret <= 65e3) return near ? ['good', T`Free return: inside the entry corridor`, T`Return perigee ${km0(ret)} km, inside the 20 to 65 km corridor.`] : ['warn', T`Returns to the corridor, but missed the Moon`, T`Return perigee ${km0(ret)} km.`];
          if (ret < 20e3) return ['bad', T`Returns too steep for entry`, T`Return perigee ${km0(ret)} km, below the 20 to 65 km corridor: the capsule would dive into the air too steeply.`];
          return ['warn', T`Returns too shallow: skip-out`, T`Return perigee ${km0(ret)} km, above the 20 to 65 km corridor: the capsule would skip off the atmosphere.`];
        }
        if (s.outcome === 'escape' || s.outcome === 'flung') return ['warn', T`Slingshot: flung into deep space`, T`The Moon added energy: the spacecraft passed it on the wrong side for a return.`];
        if (isFinite(ret) && ret > 65e3) return ['warn', T`Returns, but misses the atmosphere`, T`Return perigee ${km0(ret)} km: far above the 20 to 65 km corridor.`];
        return ['warn', T`Still coasting after 10 days`, ''];
      }
      function summarize() {
        const s = sim, [cls, title, detail] = verdict(s), vEl = $('verdict');
        vEl.className = 'ml-verdict ' + cls; vEl.innerHTML = `<b>${title}</b>${detail ? `<span>${detail}</span>` : ''}`;
        // the box only grows, so a shorter verdict never shifts the controls under the pointer
        vEl.style.minHeight = ''; vMinH = Math.max(vEl.offsetHeight, vMinH); vEl.style.minHeight = vMinH + 'px';
        const km = (m) => (isFinite(m) ? T`${km0(m)} km alt.` : '—'), v = ctl.read();
        const lines = [[T`Speed after TLI`, `${UI.fmt(s.v0 / 1000, 3)} km/s`]];
        if (cfg.mcc && Math.abs(val(v, 'mcc')) > 0) lines.push([T`MCC burn`, `${UI.dec(val(v, 'mcc').toFixed(3))} m/s`]);
        lines.push([T`Closest lunar approach`, s.minM.alt < 0 ? T`impact` : km(s.minM.alt)], [T`Closest approach at GET`, UI.fmtTime(s.minM.t)]);
        const pc = s.model === 'patched' ? s : other && other.model === 'patched' ? other : null;
        if (pc && pc.conic.soiIn && (s.model === 'patched' || cfg.detail === 'moon')) {
          const c = pc.conic.soiIn;
          lines.push([T`v∞ entering the Moon's SOI`, `${UI.fmt(c.vinf, 0)} m/s`]);
          if (cfg.detail === 'moon') lines.push([T`Hyperbola eccentricity`, UI.fmt(c.e, 3)], [T`Turn angle δ`, c.turn != null ? UI.fmt(c.turn / D2, 1) + '°' : '—']);
          lines.push([T`Aim offset b`, `${UI.fmt(c.rp * Math.sqrt(1 + 2 * C.muM / (c.rp * c.vinf * c.vinf)) / 1000, 0)} km`]);
          lines.push([T`Impact if b below`, `${UI.fmt(C.RM * Math.sqrt(1 + 2 * C.muM / (C.RM * c.vinf * c.vinf)) / 1000, 0)} km`]);
        }
        if (s.loiT) { lines.push([T`LOI fired at GET`, UI.fmtTime(s.loiT)]); const o = lunarOrbit(s); if (o) lines.push([T`Lunar orbit`, `${km0(o[0])} × ${km0(o[1])} km`]); }
        if (cfg.detail === 'return' && (s.outcome === 'entry' || s.outcome === 'impactE')) {
          lines.push([T`Return perigee (vacuum)`, km(s.retAlt)]);
          if (s.perigee) lines.push([T`Entry interface at GET`, UI.fmtTime(s.perigee.t)], [T`Entry speed`, `${UI.fmt(s.perigee.v / 1000, 2)} km/s`]);
        }
        let extra = '';
        if (other) extra = `<dt class="sub">${other.model === 'patched' ? T`Ghost: patched conics (plan)` : T`Ghost: three-body (reality)`}</dt>
            <dt>${T`Closest lunar approach`}</dt><dd>${other.minM.alt < 0 ? T`impact` : km(other.minM.alt)}</dd>
            <dt>${T`Return perigee (vacuum)`}</dt><dd>${other.outcome === 'entry' || isFinite(other.retAlt) && other.retAlt < 4e8 ? km(other.retAlt) : '—'}</dd>`;
        $('sum').innerHTML = lines.map(([a, c]) => `<dt>${a}</dt><dd>${c}</dd>`).join('') + extra;
      }

      function draw() { view.redraw(); const o = $('t'); o.value = tNow / tEnd(); $('t-out').textContent = 'GET ' + UI.fmtTime(tNow); }

      // transform a sample into the chosen frame; [x, y] in metres, origin Earth
      function tf(p, which = 'sc') {
        const px = which === 'sc' ? p.x : which === 'moon' ? p.mx : p.ex, py = which === 'sc' ? p.y : which === 'moon' ? p.my : p.ey;
        if (frameName === 'inertial') return [px - p.ex, py - p.ey];
        const th = EM.w * p.t, dx = px - p.ex, dy = py - p.ey;
        return [dx * Math.cos(th) + dy * Math.sin(th), -dx * Math.sin(th) + dy * Math.cos(th)];
      }
      const speedAt = (i) => { const q = sim.pts[Math.min(i + 1, sim.pts.length - 1)], o = sim.pts[Math.max(0, i - 1)], dt = q.t - o.t || 1;
        return Math.hypot((q.x - q.ex) - (o.x - o.ex), (q.y - q.ey) - (o.y - o.ey)) / dt; };
      // a trajectory in each conic's colour (patched: Earth legs blue, Moon hyperbola orange), only where inside(p)
      function trace(ctx, s, P, upto, K, inside = () => true) {
        const pts = s.pts; let run = false, ph = null;
        const col = (p) => (s.model === 'patched' ? (p.phase === 'M' ? K.accent : K.trace) : K.accent);
        ctx.lineWidth = 2.2; ctx.beginPath();
        for (let i = 0; i <= upto; i++) {
          const p = pts[i], ok = inside(p);
          if (!ok) { if (run) { ctx.stroke(); ctx.beginPath(); } run = false; continue; }
          const [x, y] = P(p);
          if (run && p.phase !== ph) { ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); }
          else if (!run) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          ctx.strokeStyle = col(p); run = true; ph = p.phase;
        }
        if (run) ctx.stroke();
      }
      function ghost(ctx, s, P, inside = () => true) {
        const K = UI.tok(); ctx.setLineDash([4, 5]); ctx.strokeStyle = K.muted; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.75; ctx.beginPath(); let run = false;
        for (const q of s.pts) { if (!inside(q)) { run = false; continue; } const [x, y] = P(q); run ? ctx.lineTo(x, y) : ctx.moveTo(x, y); run = true; }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }

      view.draw = (ctx, w, h) => {
        if (!sim) return;
        const K = UI.tok(), pts = sim.pts, cur = pts[idx];
        ctx.clearRect(0, 0, w, h); UI.stars(ctx, w, h, K);
        let maxR = C.DEM * 1.12;
        for (const p of pts) { const [x, y] = tf(p); maxR = Math.max(maxR, Math.min(Math.hypot(x, y), 1.2e9)); }
        let s = Math.min((w - 40) / (maxR * 1.25), (h - 40) / (maxR * 1.25));
        if (frameName === 'inertial') s = Math.min((w - 40) / (2 * maxR * 1.05), (h - 50) / (2 * maxR * 1.05));
        const cx = frameName === 'rotating' ? w / 2 - C.DEM * s * 0.45 : w / 2, cy = h / 2;
        if (frameName === 'rotating' && maxR < C.DEM * 1.5) s = Math.min((w - 60) / (C.DEM * 1.45), (h - 40) / (C.DEM * 0.9));
        const P = ([x, y]) => [cx + x * s, cy - y * s];
        ctx.strokeStyle = K.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
        if (frameName === 'inertial') { ctx.beginPath(); ctx.arc(cx, cy, C.DEM * s, 0, 7); ctx.stroke(); }
        const [mx, my] = P(tf(cur, 'moon'));
        ctx.beginPath(); ctx.arc(mx, my, R_SOI * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = K.muted; ctx.font = `10px ${K.mono}`; ctx.textAlign = 'center';
        ctx.fillText(T`Moon SOI`, mx, my - R_SOI * s - 5);
        if (other) ghost(ctx, other, (q) => P(tf(q)));
        ctx.globalAlpha = 0.3; trace(ctx, sim, (q) => P(tf(q)), pts.length - 1, K); ctx.globalAlpha = 1;
        trace(ctx, sim, (q) => P(tf(q)), idx, K);
        const [ex, ey] = P(tf(cur, 'earth')); UI.drawEarth(ctx, ex, ey, Math.max(4, C.RE * s), K);
        ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.fillText(T`EARTH`, ex, ey + Math.max(4, C.RE * s) + 13);
        UI.drawMoon(ctx, mx, my, Math.max(3, C.RM * s), K); ctx.fillStyle = K.muted; ctx.fillText(T`MOON`, mx, my + Math.max(3, C.RM * s) + 13);
        for (const p of pts.filter((q) => q.burn && q.burn !== 'SOI')) {
          const [lx, ly] = P(tf(p)); ctx.strokeStyle = K.good; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, 6, 0, 7); ctx.stroke();
          ctx.fillStyle = K.good; ctx.textAlign = 'left'; ctx.fillText(p.burn, lx + 9, ly - 6);
        }
        const [sx, sy] = P(tf(cur));
        ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
        ctx.strokeStyle = K.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 7); ctx.stroke();
        $('ov').innerHTML = `${sim.model === 'patched' ? T`patched conics: Earth only (blue), then Moon only inside its SOI (orange)` : T`three-body: Earth and Moon pull at the same time`}<br>${frameName === 'rotating' ? T`rotating frame: Earth–Moon line fixed` : T`inertial frame, Earth-centred`}<br>${T`${km0(cur.rE)} km from Earth · ${km0(cur.rM)} km from the Moon · ${UI.fmt(speedAt(idx) / 1000, 2)} km/s`}${playing && warp ? `<br>${T`playback ×${UI.fmt(warp, 0)}`}${slowNote ? ' · ' + slowNote : ''}` : ''}`;
      };

      // contextual zoom, following the spacecraft: Earth-centred near Earth, else Moon-centred and tightening as it
      // closes in (the patch point, then the flyby or the lunar orbit). Not rotating, so the patched legs are true conics.
      const zEase = { at: null, span: 0, t: 0 };
      const zoomOf = (p) => {
        // a fixed close-up (free return: the flyby altitude or the impact matters, not the approach)
        if (cfg.moonSpan) return { at: 'moon', span: cfg.moonSpan };
        if (p.rE < 6e7 && p.rM > R_SOI) return { at: 'earth', span: Math.max(2.5e7, 2.6 * p.rE) };
        // in lunar orbit after LOI the distance stays small: frame the whole orbit, its high point at the edge
        const o = sim.loiT && p.t >= sim.loiT ? lunarOrbit(sim) : null;
        if (o) return { at: 'moon', span: 3 * (C.RM + o[1]) };
        // the zoom stops tightening 10 000 km from the Moon's centre, so a fast flyby does not pump it in and out
        return { at: p.rM < 0.5 * R_SOI ? 'moon' : 'soi', span: Math.min(2.5 * R_SOI, 2.6 * Math.max(p.rM, 1e7)) };
      };
      const zTitle = { earth: N`Zoom: near Earth`, soi: N`Zoom: the Moon’s sphere of influence`, moon: N`Zoom: close to the Moon` };
      zm.draw = (ctx, w, h) => {
        if (!sim) return;
        const cur = sim.pts[idx], z = zoomOf(cur), onMoon = z.at !== 'earth', now = performance.now();
        // ease the scale toward its target while playing (time constant 0.3 s); snap on a change of centre or when paused
        if (playing && zEase.span && (zEase.at === 'earth') === (z.at === 'earth')) z.span = zEase.span + (z.span - zEase.span) * (1 - Math.exp(-(now - zEase.t) / 300));
        zEase.at = z.at; zEase.span = z.span; zEase.t = now;
        const ht = $('zt'); if (ht && ht.dataset.at !== z.at) { ht.dataset.at = z.at; ht.textContent = T(zTitle[z.at]); }
        const K = UI.tok(), s = Math.min(w, h) / z.span, cx = w / 2, cy = h / 2;
        const rel = (p) => (onMoon ? [p.x - p.mx, p.y - p.my] : [p.x - p.ex, p.y - p.ey]), P = (p) => { const [x, y] = rel(p); return [cx + x * s, cy - y * s]; };
        const inside = (p) => { const [x, y] = rel(p); return Math.abs(x) * s < w * 0.8 && Math.abs(y) * s < h * 0.8; };
        ctx.clearRect(0, 0, w, h);
        ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left';
        ctx.fillText(onMoon ? T`Moon-centred, not rotating` : T`Earth-centred, not rotating`, 6, 13);
        const soiShown = onMoon && R_SOI * s < 0.6 * Math.max(w, h);
        ctx.fillText(soiShown ? T`dashed: sphere of influence, ${UI.fmt(R_SOI / 1e6 * 1000, 0)} km` : T`${UI.fmt(z.span * w / Math.min(w, h) / 1e6 * 1000, 0)} km across`, 6, h - 6);
        if (soiShown) { ctx.strokeStyle = K.muted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R_SOI * s, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
        if (other) ghost(ctx, other, P, inside);
        ctx.globalAlpha = 0.3; trace(ctx, sim, P, sim.pts.length - 1, K, inside); ctx.globalAlpha = 1;
        trace(ctx, sim, P, idx, K, inside);
        if (onMoon) {
          // the Moon's velocity (the Earth→Moon direction turned +90°: the Moon orbits counter-clockwise) and the direction of the Earth
          const dE = vunit([cur.ex - cur.mx, cur.ey - cur.my]), dV = [dE[1], -dE[0]], rm = Math.max(4, C.RM * s);
          UI.drawMoon(ctx, cx, cy, rm, K);
          UI.arrow(ctx, cx + dV[0] * (rm + 8), cy - dV[1] * (rm + 8), cx + dV[0] * (rm + 30), cy - dV[1] * (rm + 30), K.muted, 1.4);
          ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.fillText('v☾', cx + dV[0] * (rm + 40), cy - dV[1] * (rm + 40) + 3);
          const ea = Math.min(R_SOI * s * 1.12, 0.46 * Math.min(w, h)); UI.arrow(ctx, cx + dE[0] * (ea - 14), cy - dE[1] * (ea - 14), cx + dE[0] * ea, cy - dE[1] * ea, K.earth, 1.5);
          ctx.fillStyle = K.earth; ctx.fillText(T`to Earth`, cx + dE[0] * (ea + 8), cy - dE[1] * (ea + 8) + 4);
          if (sim.minM.alt > 0 && sim.minM.alt < R_SOI) { ctx.fillStyle = K.accent; ctx.textAlign = 'left'; ctx.fillText(T`periselene ${km0(sim.minM.alt)} km`, 6, 27); }
        } else {
          UI.drawEarth(ctx, cx, cy, Math.max(4, C.RE * s), K);
        }
        if (inside(cur)) { const [sx, sy] = P(cur); ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, 7); ctx.fill(); }
      };

      // zoom on the return: Earth-centred, with the vacuum conic continued to its perigee, and a corridor gauge
      if (ze) ze.draw = (ctx, w, h) => {
        if (!sim) return;
        const K = UI.tok(), gh = 40, span = 52000e3, s = w / span, cx = w / 2, cy = (h - gh) / 2;
        const rel = (p) => [p.x - p.ex, p.y - p.ey], P = ([x, y]) => [cx + x * s, cy - y * s];
        ctx.clearRect(0, 0, w, h); ctx.font = `10px ${K.mono}`;
        const back = sim.outcome === 'entry' || sim.outcome === 'impactE' || (isFinite(sim.retAlt) && sim.retAlt < 1e8 && sim.minM.alt < 20000e3);
        UI.drawEarth(ctx, cx, cy, C.RE * s, K);
        ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`Earth-centred, ${UI.fmt(span / 1e6 * 1000, 0)} km wide`, 6, 13);
        if (!back) { ctx.textAlign = 'center'; ctx.fillStyle = K.muted; ctx.fillText(T`no return to Earth`, cx, cy - C.RE * s - 12); return; }
        // last part of the flight: after the farthest point from Earth
        let far = 0; sim.pts.forEach((q, i) => { if (q.rE > sim.pts[far].rE) far = i; });
        const win = (q) => { const [x, y] = rel(q); return Math.abs(x) < span * 0.6 && Math.abs(y) < span * 0.6; };
        ctx.strokeStyle = K.trace; ctx.lineWidth = 2; ctx.beginPath(); let run = false;
        for (let i = far; i <= idx; i++) { const q = sim.pts[i]; if (!win(q)) { run = false; continue; } const [x, y] = P(rel(q)); run ? ctx.lineTo(x, y) : ctx.moveTo(x, y); run = true; }
        ctx.stroke();
        ctx.globalAlpha = 0.3; ctx.beginPath(); run = false;
        for (let i = far; i < sim.pts.length; i++) { const q = sim.pts[i]; if (!win(q)) { run = false; continue; } const [x, y] = P(rel(q)); run ? ctx.lineTo(x, y) : ctx.moveTo(x, y); run = true; }
        ctx.stroke(); ctx.globalAlpha = 1;
        // the last sample can be recorded twice: take the previous distinct one for the velocity
        const n = sim.pts.length, a = sim.pts[n - 1];
        let j = n - 2; while (j > 0 && a.t - sim.pts[j].t < 1) j--;
        const b = sim.pts[j];
        if ((sim.outcome === 'entry' || sim.outcome === 'impactE') && b) {
          // vacuum conic from the last state, continued to perigee (dashed): where the orbit would go without air
          const r = rel(a), dt = a.t - b.t || 1, v = [(r[0] - rel(b)[0]) / dt, (r[1] - rel(b)[1]) / dt], mu = C.muE;
          const rr = Math.hypot(...r), vv = v[0] * v[0] + v[1] * v[1], hh = r[0] * v[1] - r[1] * v[0], rv = r[0] * v[0] + r[1] * v[1];
          const ev = [((vv - mu / rr) * r[0] - rv * v[0]) / mu, ((vv - mu / rr) * r[1] - rv * v[1]) / mu], e = Math.hypot(...ev), p = hh * hh / mu, sg = Math.sign(hh);
          const w0 = Math.atan2(ev[1], ev[0]), nu0 = Math.atan2(sg * (ev[0] * r[1] - ev[1] * r[0]), ev[0] * r[0] + ev[1] * r[1]);
          if (e > 1e-6 && nu0 < 0) {
            ctx.setLineDash([4, 3]); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.6; ctx.beginPath();
            for (let k = 0; k <= 40; k++) { const nu = nu0 * (1 - k / 40), rn = p / (1 + e * Math.cos(nu)), th = w0 + sg * nu, [x, y] = P([rn * Math.cos(th), rn * Math.sin(th)]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.stroke(); ctx.setLineDash([]);
            const rp = p / (1 + e), [qx, qy] = P([rp * Math.cos(w0), rp * Math.sin(w0)]);
            ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(qx, qy, 3, 0, 7); ctx.fill();
          }
        }
        // corridor gauge: too steep | corridor | too shallow, log scales outside the corridor
        const alt = sim.retAlt / 1000, gx = 8, gw = w - 16, gy = h - gh + 8, z1 = gw * 0.36, z2 = gw * 0.28;
        const xOf = (x) => (x < 20 ? gx + z1 * (1 - Math.min(1, Math.log10(1 + 20 - x) / Math.log10(3021))) : x <= 65 ? gx + z1 + z2 * (x - 20) / 45 : gx + z1 + z2 + (gw - z1 - z2) * Math.min(1, Math.log10(1 + x - 65) / Math.log10(3001)));
        ctx.globalAlpha = 0.25; ctx.fillStyle = K.bad; ctx.fillRect(gx, gy, z1, 10); ctx.fillStyle = K.good; ctx.fillRect(gx + z1, gy, z2, 10); ctx.fillStyle = K.warn; ctx.fillRect(gx + z1 + z2, gy, gw - z1 - z2, 10); ctx.globalAlpha = 1;
        ctx.fillStyle = K.muted; ctx.textAlign = 'center';
        ctx.fillText(T`too steep`, gx + z1 / 2, gy + 24); ctx.fillText(T`20–65 km`, gx + z1 + z2 / 2, gy + 24); ctx.fillText(T`too shallow`, gx + z1 + z2 + (gw - z1 - z2) / 2, gy + 24);
        const mxg = xOf(alt); ctx.fillStyle = K.ink; ctx.beginPath(); ctx.moveTo(mxg, gy + 11); ctx.lineTo(mxg - 5, gy - 3); ctx.lineTo(mxg + 5, gy - 3); ctx.closePath(); ctx.fill();
        // the label is centred on the marker but kept inside the canvas
        const txt = T`vacuum perigee ${UI.fmt(alt, 0)} km`, tw = ctx.measureText(txt).width;
        ctx.textAlign = 'left'; ctx.fillStyle = K.ink; ctx.fillText(txt, Math.max(4, Math.min(w - 4 - tw, mxg - tw / 2)), gy - 6);
      };

      // playback runs in mission time: the whole flight in about 25 s, slowed down near Earth and the Moon
      let acc = 0;
      UI.loop((dt) => {
        if (!sim || !playing) return;
        const p = sim.pts[idx], fE = p.rE / 6e7, fM = p.rM / 1.5e7, f = Math.max(0.04, Math.min(1, fE, fM));
        warp = tEnd() / 25 * f;
        slowNote = f < 0.9 ? (fM < fE ? T`slowed down near the Moon` : T`slowed down near Earth`) : '';
        seek(tNow + dt * warp);
        if (tNow >= tEnd()) { playing = false; setPlayLabel(); }
        draw();
        acc += dt; if (acc > 0.05) { zooms.forEach((z) => z.redraw()); acc = 0; }
      });
      ctl.update();
    },
  };
  window.MoonLab = MoonLab;

  /* ---------------- Chapter ---------------- */
  App.chapter({
    id: 'moon', phase: N`TLI → LOI`, title: N`Going to the Moon`, lab: N`Earth–Moon trajectory`,
    blurb: N`The sphere of influence, patched conics, v∞ and the hyperbola at the Moon: plan the trip, aim it and brake into lunar orbit.`,
    render(page) {
      const soi = R_SOI / 1000;
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('moon')} · Trans-lunar injection to lunar orbit`,
          title: T`Going to the Moon`,
          lede: T`A target three days away, moving at 1 km/s, and two bodies pulling at once. No formula solves that exactly. Apollo’s planners cut the trip into pieces that each have a simple solution: an orbit around the Earth, then an orbit around the Moon. This module builds that method, patched conics, and flies it.`,
          refs: [T`Sellers · Interplanetary Travel`, T`BMW ch. 7 Lunar Trajectories`, T`BMW ch. 8 Interplanetary Trajectories`],
        })}
        ${Progress.briefing('moon', { theory: 'theory', lab: 'tl', math: 'refresher', mathLabel: N`Powers and roots.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`The sphere of influence and patched conics`}</h2>
          <div class="prose">
            <p>${T`Near the Moon, its gravity dominates the spacecraft’s motion relative to it; farther out, Earth’s does. Laplace defined the boundary as the <b>sphere of influence</b>:`}</p>
            <div class="eq">\\[ r_{SOI} = D\\left(\\frac{m_☾}{m_\\oplus}\\right)^{2/5} = 384\\,400\\ \\mathrm{km}\\times(0.0123)^{0.4} \\approx ${UI.fmt(soi, 0)}\\ \\mathrm{km} \\]</div>
            ${Sym.where(['rsoi', 'Dem', 'mM', 'mE'])}
            ${Primer.box('powers', false, 'refresher')}
            <p>${T`The <b>patched-conic</b> method treats the flight as two two-body problems. Outbound it is an Earth-centred ellipse. At the sphere boundary, subtract the Moon’s velocity (≈ 1.02 km/s) to get the spacecraft’s velocity relative to the Moon. Inside the sphere the path is a Moon-centred hyperbola. Its periselene is set by where the outbound ellipse crosses the boundary, which makes the method very sensitive, but it gives Δv and flight times to within a few percent.`}</p>
            ${figSOI()}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`Trans-lunar injection`}</h2>
          <div class="prose">
            <p>${T`From the 185 km parking orbit, the S-IVB re-ignited over the Pacific about 2 h 44 min after launch and burned for 5 min 47 s. The first estimate is a Hohmann-like ellipse with apogee at the Moon’s distance:`}</p>
            <div class="eq">\\[ v_p = \\sqrt{\\mu_\\oplus\\left(\\frac{2}{r_p} - \\frac{2}{r_p + r_a}\\right)} = 10.93\\ \\mathrm{km/s} \\]</div>
            <div class="eq">\\[ \\Delta v_{TLI} = v_p - \\sqrt{\\frac{\\mu_\\oplus}{r_p}} = 10.93 - 7.79 = 3.14\\ \\mathrm{km/s} \\]</div>
            ${Sym.where(['vp', 'muE', 'rpT', 'raT', 'dvtli'])}
            <p>${T`A minimum-energy ellipse would take five days to reach apogee. Burning slightly more, about 3.15–3.18 km/s, shortens the trip to three days at little cost. Apollo 11’s TLI was about 3.18 km/s; the simulator below needs 3.16 km/s because its model of the Earth–Moon system is simpler.`}</p>
            <p>${T`The <b>phase angle</b> also matters. The Moon goes once round the Earth in 27.3 days, so it moves 360° / 27.3 ≈ 13.2° per day. During a three-day trip it covers about 3 × 13.2° = 40°. The burn must put the apogee where the Moon <i>will be</i> on arrival, about 40° ahead of where it is at the burn.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`Speed relative to the Moon: v∞`}</h2>
          <div class="prose">
            <p>${T`At the edge of the sphere the planner changes frames. The Earth-centred orbit gives the spacecraft’s velocity relative to the Earth, \\(\\vec v_{sc}\\). The Moon itself moves at \\(\\vec v_☾\\). The velocity relative to the Moon is the difference of the two vectors:`}</p>
            <div class="eq">\\[ \\vec v_{rel} = \\vec v_{sc} - \\vec v_☾, \\qquad v_{rel}^2 = v_{sc}^2 + v_☾^2 - 2\\,v_{sc}\\,v_☾\\cos\\theta \\]</div>
            ${Sym.where([['\\vec v_{rel}', N`velocity relative to the Moon at the edge of its sphere of influence`, 'm/s'], ['\\vec v_{sc}', N`spacecraft velocity relative to Earth at the sphere of influence`, 'm/s'], ['\\vec v_☾', N`the Moon’s orbital velocity, about 1.02 km/s`, 'm/s'], ['\\theta', N`angle between \\(\\vec v_{sc}\\) and \\(\\vec v_☾\\)`, N`rad or °`]], N`The second form is the law of cosines applied to the vector subtraction.`)}
            ${figVrel()}
            <p>${T`<b>Finding θ.</b> The Earth-centred conic gives the spacecraft’s speed and direction at the point where it crosses the sphere. That point is the planner’s choice, an input like the TLI speed: its angle \\(\\lambda_1\\) at the Moon, measured from the Moon–Earth line. Everything else follows from it. How to choose it is explained in section ${App.sec('moon', 4)}. Three steps give θ:`}</p>
            <ol>
              <li>${T`The triangle Earth–Moon–entry point gives the distance from Earth \\(r_1\\) and the angle \\(\\gamma_1\\) at the Earth between the spacecraft and the Moon (law of cosines, then law of sines).`}</li>
              <li>${T`The conic gives the speed \\(v_{sc}\\) at \\(r_1\\) (energy) and the flight-path angle \\(\\phi_1\\), how far the velocity leans outward from the local horizontal (angular momentum; at TLI the velocity is horizontal, \\(h = r_0 v_0\\)).`}</li>
              <li>${T`The Moon’s velocity is perpendicular to the Earth–Moon line, the local horizontal is perpendicular to the Earth–spacecraft line: the two directions differ by \\(\\gamma_1\\). The spacecraft enters the sphere ahead of the Moon, so \\(\\theta = \\phi_1 - \\gamma_1\\).`}</li>
            </ol>
            ${figTheta()}
            <div class="eq">\\[ r_1^2 = D^2 + r_{SOI}^2 - 2\\,D\\,r_{SOI}\\cos\\lambda_1, \\qquad \\sin\\gamma_1 = \\frac{r_{SOI}}{r_1}\\sin\\lambda_1 \\]</div>
            <div class="eq">\\[ v_{sc}^2 = v_0^2 - \\frac{2\\mu_\\oplus}{r_0} + \\frac{2\\mu_\\oplus}{r_1}, \\qquad \\cos\\phi_1 = \\frac{r_0\\,v_0}{r_1\\,v_{sc}}, \\qquad \\theta = \\phi_1 - \\gamma_1 \\]</div>
            ${Sym.where([['\\lambda_1', N`angle at the Moon between the Moon–Earth line and the entry point on the sphere`, N`rad or °`], ['r_1', N`distance from the Earth’s centre to the entry point`, 'm'], ['\\gamma_1', N`angle at the Earth between the spacecraft and the Moon`, N`rad or °`], 'Dem', 'rsoi', ['r_0, v_0', N`radius and speed just after TLI, at perigee`, N`m, m/s`], 'muE', ['\\phi_1', N`flight-path angle at the entry point, measured from the local horizontal`, N`rad or °`]], N`\\(\\lambda_1\\) is chosen; \\(r_1\\), \\(\\gamma_1\\), \\(v_{sc}\\) and \\(\\phi_1\\) are derived from it.`)}
            <p>${T`In the lab’s transfer: TLI leaves \\(r_0\\) = 6 563 km at \\(v_0\\) = 10.953 km/s and reaches the sphere at \\(\\lambda_1\\) = 43.4°, read from the simulated flight. Then \\(r_1\\) = 339 374 km, \\(\\gamma_1\\) = 7.7°, \\(v_{sc}\\) = 0.924 km/s and \\(\\phi_1\\) = 76.8°, so θ = 76.8° − 7.7° = 69.1° from the Moon’s direction of motion. Then \\(v_{rel} = \\sqrt{0.924^2 + 1.0245^2 - 2\\times0.924\\times1.0245\\times\\cos 69.1^\\circ}\\) = 1.108 km/s. The spacecraft is slower than the Moon, but it moves in a different direction, so relative to the Moon it is fast.`}</p>
            <p>${T`Inside the sphere the Moon’s gravity speeds the spacecraft up as it falls in and slows it down as it climbs out. Energy conservation relative to the Moon gives its speed at any distance \\(r\\) from the Moon’s centre:`}</p>
            <div class="eq">\\[ v^2 = v_\\infty^2 + \\frac{2\\mu_☾}{r} \\]</div>
            ${Sym.where([['v', N`speed relative to the Moon at distance \\(r\\)`, 'm/s'], 'vinf', 'muM', ['r', N`distance from the Moon’s centre`, 'm']], N`It holds at every point of the hyperbola.`)}
            <p>${T`At the edge of the sphere, \\(r = r_{SOI}\\) and the speed relative to the Moon is the \\(v_{rel}\\) just computed. Put them in and solve for \\(v_\\infty\\):`}</p>
            <div class="eq">\\[ v_{rel}^2 = v_\\infty^2 + \\frac{2\\mu_☾}{r_{SOI}} \\qquad\\Longrightarrow\\qquad v_\\infty = \\sqrt{v_{rel}^2 - \\frac{2\\mu_☾}{r_{SOI}}} \\]</div>
            ${Sym.where([['v_{rel}', N`speed relative to the Moon at the edge of its sphere of influence`, 'm/s'], 'vinf', 'muM', 'rsoi'])}
            <p>${T`As \\(r\\) grows, the term \\(2\\mu_☾/r\\) shrinks toward zero and \\(v\\) tends to \\(v_\\infty\\): the speed the spacecraft would have infinitely far from the Moon, what is left once the Moon’s gravity has taken its share. It is called the <b>hyperbolic excess speed</b>. In the lab: \\(v_\\infty = \\sqrt{1.108^2 - 2\\times4\\,902.8/66\\,183}\\) = 1.04 km/s, the 1 038 m/s the lab prints. Many textbooks skip this step and call \\(v_{rel}\\) the excess speed directly; at the Moon that is 7% too high.`}</p>
            <p>${T`Gravity never stops pulling, so why does the speed not keep falling to zero? It does keep falling, forever, but toward \\(v_\\infty\\), not toward zero. The pull weakens as \\(1/r^2\\), so carrying a kilogram from distance \\(r\\) out to infinity takes a finite energy, \\(\\mu/r\\): the escape energy of module ${Progress.code('newton')}. A spacecraft with more kinetic energy than that never runs out. It keeps the surplus, \\(\\tfrac12 v_\\infty^2\\) per kilogram, and its path is a hyperbola. With less, it falls back on an ellipse. Arriving from the Earth, a spacecraft always has a surplus relative to the Moon, so without a braking burn it leaves the sphere again.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`The hyperbola at the Moon`}</h2>
          <div class="prose">
            <p>${T`Inside the sphere the path is a hyperbola with the Moon at its focus. Two numbers fix it: \\(v_\\infty\\) and the periselene radius \\(r_p\\), the closest distance to the Moon’s centre. Its shape decides how far the Moon turns the direction of flight:`}</p>
            <div class="eq">\\[ e = 1 + \\frac{r_p\\,v_\\infty^2}{\\mu_☾}, \\qquad \\delta = 2\\arcsin\\frac{1}{e} \\]</div>
            ${Sym.where(['e', ['r_p', N`periselene radius, from the Moon’s centre`, 'm'], 'vinf', 'muM', ['\\delta', N`turn angle: how far the velocity relative to the Moon is rotated during the flyby`, N`rad or °`]], N`A close pass (small r_p) gives a small e and a large turn; a fast or distant pass barely bends.`)}
            ${figHyperbola()}
            <p>${T`Relative to the Moon, the spacecraft leaves exactly as fast as it arrived: only the direction has turned, by δ. What that turn does to the orbit around the Earth is the subject of module ${Progress.code('freereturn')}.`}</p>
            <p>${T`<b>Where to aim.</b> A transfer aimed at the Moon’s centre hits the Moon. To pass at a chosen periselene you must aim to one side. The <b>impact parameter</b> \\(b\\), or aim offset, is the distance between the Moon’s centre and the straight line the spacecraft would follow if the Moon had no gravity: the dashed line in the figure.`}</p>
            <p>${T`Two conservation laws give \\(b\\). Far from the Moon the spacecraft moves at \\(v_\\infty\\) along a line that misses the centre by \\(b\\), so its angular momentum about the Moon is \\(b\\,v_\\infty\\) per kilogram. At periselene the velocity is perpendicular to the radius, so it is \\(r_p\\,v_p\\). Angular momentum is conserved, so the two are equal. Energy is conserved as well and gives \\(v_p\\), from the relation of section ${App.sec('moon', 3)}. Put them together:`}</p>
            <div class="eq">\\[ b\\,v_\\infty = r_p\\,v_p, \\qquad v_p^2 = v_\\infty^2 + \\frac{2\\mu_☾}{r_p} \\qquad\\Longrightarrow\\qquad b = r_p\\sqrt{1 + \\frac{2\\mu_☾}{r_p\\,v_\\infty^2}} \\]</div>
            ${Sym.where([['b', N`impact parameter: distance from the Moon’s centre to the arrival line, before the Moon’s gravity bends it`, 'm'], 'rpM', 'vinf', 'vp', 'muM'], N`The square root is larger than 1. Gravity pulls the path inward, so you must aim wider than the periselene you want.`)}
            <p>${T`Example. Apollo aimed for a periselene about 110 km above the surface, the height of the lunar parking orbit (Apollo 11 entered a 111 × 313 km orbit). With the lab’s \\(v_\\infty = 1\\,038\\) m/s: \\(r_p = 1\\,737.4 + 110 = 1\\,847.4\\) km, \\(2\\mu_☾/(r_p v_\\infty^2) = 4.92\\) and \\(b = 1\\,847.4\\times\\sqrt{5.92} = 4\\,496\\) km. To pass 1 847 km from the centre, aim 4 496 km from it.`}</p>
            <p>${T`Put \\(r_p = R_☾\\) and the same formula gives the narrowest aim that still misses: below \\(b\\) = 4 339 km the spacecraft hits the Moon. That is 2.5 lunar radii. The ratio is not a rule: it is \\(\\sqrt{1 + 2\\mu_☾/(R_☾ v_\\infty^2)}\\), which depends on \\(v_\\infty\\). It does say something useful. Gravity bends into the surface paths that would have missed it, so the Moon catches everything aimed within 2.5 of its radii. A slower arrival makes it an even bigger target; a very fast one shrinks it toward its real size. The lab prints both numbers as <i>Aim offset b</i> and <i>Impact if b below</i>.`}</p>
            <p>${T`<b>Closing the loop.</b> You cannot pick \\(b\\) and work backward: \\(b\\) depends on how the outbound ellipse crosses the sphere, so it comes out of the whole Earth-side calculation. It is the target. The knob is the arrival point \\(\\lambda_1\\) of section ${App.sec('moon', 3)}, or the TLI that produces it:`}</p>
            <ol>
              <li>${T`From the periselene you want, the formula above gives the \\(b\\) you need (4 496 km for 110 km).`}</li>
              <li>${T`Choose \\(\\lambda_1\\) and compute forward: \\(r_1\\), \\(\\gamma_1\\), \\(\\phi_1\\), θ, \\(v_{rel}\\), \\(v_\\infty\\), and the \\(b\\) this trajectory gives. The time from TLI to the sphere also tells you where the Moon must be at TLI, so where to burn.`}</li>
              <li>${T`Compare with the target, adjust \\(\\lambda_1\\) and repeat until they match. Even \\(v_\\infty\\) changes a little with \\(\\lambda_1\\), which is why this is a loop and not a single formula.`}</li>
            </ol>
            <p>${T`Planners solve this loop numerically, nudging the departure until the arrival converges on the target. The lab lets you run it by hand the other way round: the TLI burn position is the knob, and <i>Aim offset b</i> under <i>Outcome</i> shows where it lands.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`Lunar orbit insertion`}</h2>
          <div class="prose">
            <p>${T`Relative to the Moon, an arriving spacecraft is on a hyperbola with excess speed \\(v_\\infty \\approx 0.8\\)–\\(1\\) km/s. To be captured it must burn retrograde at periselene, behind the Moon and out of radio contact with Earth:`}</p>
            <div class="eq">${T`\\[ v_{p} = \\sqrt{v_\\infty^2 + \\frac{2\\mu_☾}{r_p}}, \\qquad \\Delta v_{LOI} = v_p - v_{\\text{target orbit}} \\]`}</div>
            ${Sym.where(['vp', 'vinf', 'muM', 'rpM', 'dvloi'])}
            <p>${T`Apollo 11’s LOI-1 burned the SPS for 5 min 57 s (889 m/s) into a 111 × 313 km orbit. LOI-2 circularized it two orbits later. Because the burn happened behind the Moon, mission control learned whether it had worked only when the spacecraft reappeared on schedule, or did not.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Lab: fly to the Moon`}</h2>
          <div class="prose">
            <p>${T`The lab flies the plan: patched conics, one body at a time. The large view shows the whole trip. The zoom beside it follows the spacecraft without turning: centred on the Earth just after TLI, then on the Moon, closer and closer as the spacecraft falls in. There you see the switch from the Earth conic (blue) to the Moon conic (orange) at the edge of the sphere, and the hyperbola swinging around the Moon.`}</p>
            <ol>
              <li>${T`Scenario <i>Fly past the Moon</i>. Play it and watch the zoom: the blue line ends at the sphere and the orange hyperbola takes over. Read v∞, the periselene and the aim offset b under <i>Outcome</i>, and compare them with sections ${App.sec('moon', 3)} and ${App.sec('moon', 4)}.`}</li>
              <li>${T`Move the TLI burn position by a few hundredths of a degree. The periselene moves by hundreds of kilometres: the timing of one burn aims the whole transfer. Module ${Progress.code('freereturn')} explains why. Aim for Apollo’s band, a periselene between 100 and 300 km, and play the flight to periselene.`}</li>
              <li>${T`Scenario <i>Capture into lunar orbit</i>: the LOI burn at periselene brakes the spacecraft into orbit, but its low point is only about 80 km up. Lower the LOI Δv until it is no longer captured. Then match Apollo 11’s first lunar orbit, 111 × 313 km: adjust the aim and the LOI Δv for a low point between 100 and 130 km and a high point between 280 and 340 km, and play it through the burn. The high point moves about 5 km for every m/s of LOI.`}</li>
            </ol>
          </div>
          ${MoonLab.markup({ id: 'tl', title: N`Earth–Moon trajectory`, presets: PRESETS, start: 'flyby', loi: true, detail: 'moon', dvRange: [3120, 3200], angRange: [-132.8, -131.8] })}
          <p class="note">${T`Planar model with the Moon on a circular orbit. Real Apollo trajectories were three-dimensional, with the Moon's 5° orbital inclination and its eccentric orbit, the Sun's pull and Earth's oblateness all included. The method is the same.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('moon', { math: 'powers', mathLabel: N`Powers, roots and scientific notation.` })}`;

      MoonLab.mount(page.querySelector('#tl'), {
        id: 'tl', presets: PRESETS, loi: true, detail: 'moon',
        // objectives: the candidate's own aim, and the flight played (or scrubbed) past the event
        onFlown(s, t, c) {
          if (!s.touched || s.model !== 'patched') return;
          if (s.outcome !== 'impact' && s.minM.alt >= 100e3 && s.minM.alt <= 300e3 && t >= s.minM.t) Progress.done('moon', 'reach');
          const o = s.outcome === 'lunarOrbit' && c.lunarOrbit(s);
          if (o && o[0] >= 100e3 && o[0] <= 130e3 && o[1] >= 280e3 && o[1] <= 340e3 && t >= s.loiT) Progress.done('moon', 'loi');   // Apollo 11's LOI-1: 111 × 313 km
        },
      });
      mountSOI(page);
      Practice.embed(page.querySelector('#practice-slot'), 'moon', 3);
    },
  });

  // practice for the section "The hyperbola at the Moon" (same topic and label as js/practice.js)
  const MUM = 4902.8, RMOON = 1737.4;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fm = (x, d = 3) => UI.fmt(x, d);
  const R = String.raw;
  Practice.register('moon', N`Lunar trajectories`, [
    { title: N`Aim offset for a periselene`, make() {
      const vinf = rnd(0.8, 1.1, 0.01), h = pick([60, 110, 150, 300]);
      const rp = RMOON + h, k = 2 * MUM / (rp * vinf * vinf), b = rp * Math.sqrt(1 + k);
      return { q: T`A spacecraft arrives at the Moon with v∞ = <b>${fm(vinf, 2)} km/s</b>. You want it to pass at a periselene altitude of <b>${h} km</b>. How far from the Moon’s centre must the arrival line be aimed (the impact parameter b)?`, answer: b, unit: 'km',
        hint: T`Radius first: r_p = R☾ + altitude. Then b = r_p √(1 + 2μ☾/(r_p v∞²)), with μ☾ = 4902.8 km³/s².`,
        sol: R`\[ r_p = ${fm(RMOON, 1)} + ${h} = ${fm(rp, 1)}\ \mathrm{km},\qquad \frac{2\mu_☾}{r_p v_\infty^2} = \frac{2\times 4902.8}{${fm(rp, 1)}\times ${fm(vinf, 2)}^2} = ${fm(k, 3)} \] \[ b = r_p\sqrt{1 + \frac{2\mu_☾}{r_p v_\infty^2}} = ${fm(rp, 1)}\times\sqrt{${fm(1 + k, 3)}} = ${fm(b, 0)}\ \mathrm{km} \]` + `<p>${T`You aim wider than the periselene you want, because the Moon’s gravity pulls the path inward.`}</p>` };
    } },
    { title: N`Excess speed from the boundary speed`, make() {
      const vrel = rnd(0.95, 1.25, 0.01), vinf = Math.sqrt(vrel * vrel - 2 * MUM / 66183);
      return { q: T`At the edge of the Moon’s sphere of influence (66 183 km from its centre) the spacecraft moves at <b>${fm(vrel, 2)} km/s</b> relative to the Moon. What is its hyperbolic excess speed v∞?`, answer: vinf, unit: 'km/s',
        hint: T`Energy relative to the Moon: v² = v∞² + 2μ☾/r, with μ☾ = 4902.8 km³/s².`,
        sol: R`\[ v_\infty = \sqrt{v_{rel}^2 - \frac{2\mu_☾}{r_{SOI}}} = \sqrt{${fm(vrel, 2)}^2 - \frac{2\times4902.8}{66183}} = ${fm(vinf, 3)}\ \mathrm{km/s} \]` };
    } },
  ], [
    { q: N`A spacecraft coasts into the Moon’s sphere of influence and nobody fires the engine. What happens?`, opts: [N`It is captured into an orbit around the Moon`, N`It swings around the Moon on a hyperbola and leaves the sphere as fast as it arrived`, N`It falls straight onto the Moon`, N`It stops at the edge of the sphere, where the two pulls balance`], a: 1, why: N`Arriving from the Earth it always has a surplus of energy relative to the Moon, v∞ > 0. The hyperbola only turns its direction. Capture needs a braking burn at periselene, the LOI.` },
    { q: N`To pass 110 km above the Moon, where do you aim the arrival line?`, opts: [N`At the Moon’s centre: gravity does the rest`, N`Exactly 110 km above the surface`, N`Well outside the periselene you want, about 4 500 km from the centre`, N`Inside the Moon, because gravity pushes the path outward`], a: 2, why: N`Gravity bends the path inward, so the aim offset b is larger than the periselene radius: b = r_p √(1 + 2μ☾/(r_p v∞²)), about 2.4 times r_p here.` },
  ]);
})();
