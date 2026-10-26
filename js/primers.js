/* Ground school: optional math refreshers with small interactive widgets.
   Primer.box(key) drops a collapsed refresher into a chapter; the Math Toolkit page shows them all. */
(function () {
  'use strict';
  const R = String.raw;

  const PRIMERS = {
    vectors: {
      title: N('Vectors: arrows with numbers'),
      used: N('Velocity, force, position, angular momentum'),
      html: [
        N`<p>A <b>vector</b> is a quantity with a size <i>and</i> a direction: an arrow. Velocity is a vector (7.8 km/s, heading east); speed is just its size, a plain number (a <i>scalar</i>).</p>`,
        N`<p><b>Components.</b> In a plane, an arrow is described by how far it goes along \\(x\\) and along \\(y\\): \\(\\vec v = (v_x, v_y)\\). Its length comes from Pythagoras:</p>`,
        R`\[ |\vec v| = v = \sqrt{v_x^2 + v_y^2} \]`,
        N`<p><b>Adding</b> vectors means putting them tip to tail, which is the same as adding the components: \\(\\vec a + \\vec b = (a_x + b_x,\\ a_y + b_y)\\). That is how a rocket burn works: the new velocity is the old velocity plus the Δv arrow.</p>`,
        N`<p><b>Dot product</b>, a number: \\(\\vec a\\cdot\\vec b = a_x b_x + a_y b_y = |\\vec a|\\,|\\vec b|\\cos\\theta\\). It measures how much two arrows point the same way: maximal when parallel, zero when perpendicular, negative when opposed.</p>`,
        N`<p><b>Cross product</b>, a new vector perpendicular to both, of length \\(|\\vec a|\\,|\\vec b|\\sin\\theta\\). Its direction follows the right-hand rule (fingers from \\(\\vec a\\) to \\(\\vec b\\), thumb gives the direction). For two arrows in the screen’s plane it points straight out of or into the screen. Orbits use it for the angular momentum \\(\\vec h = \\vec r \\times \\vec v\\), which points perpendicular to the orbit plane.</p>`,
        N`<p class="try">Try it: drag the two arrow tips.</p>`,
      ],
      widget: 'vectors',
    },
    trig: {
      title: N('Sine, cosine, tangent and radians'),
      used: N('Flight-path angles, plane changes, the law of cosines'),
      html: [
        N`<p>In a right triangle with angle \\(\\theta\\): \\(\\cos\\theta = \\dfrac{\\text{adjacent}}{\\text{hypotenuse}}\\), \\(\\sin\\theta = \\dfrac{\\text{opposite}}{\\text{hypotenuse}}\\), \\(\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}\\). On a circle of radius 1, the point at angle \\(\\theta\\) sits at \\((\\cos\\theta, \\sin\\theta)\\). That is why cos and sin <b>split a vector into components</b>: a velocity \\(v\\) at flight-path angle \\(\\phi\\) has a horizontal part \\(v\\cos\\phi\\) and a vertical part \\(v\\sin\\phi\\).</p>`,
        N`<p><b>Radians.</b> An angle in radians is the arc length on a circle of radius 1. A full turn is \\(2\\pi\\) rad = 360°, so \\(\\pi\\) rad = 180° and 1 rad ≈ 57.3°. Physics formulas expect radians; calculators must be in the right mode.</p>`,
        N`<p><b>Law of cosines</b> (Al-Kashi): in any triangle with sides \\(a\\), \\(b\\) and the angle \\(\\gamma\\) between them, the third side is</p>`,
        R`\[ c^2 = a^2 + b^2 - 2ab\cos\gamma \]`,
        N`<p>With \\(\\gamma = 90°\\) it becomes Pythagoras. It gives the Δv needed to change both the size and the direction of a velocity.</p>`,
        N`<p class="try">Try it: move the angle.</p>`,
      ],
      widget: 'trig',
    },
    powers: {
      title: N('Powers, roots and scientific notation'),
      used: N('Gravity’s inverse square, Kepler’s third law, the sphere of influence'),
      html: [
        N`<p><b>Scientific notation</b> writes huge and tiny numbers as a number times a power of ten: Earth’s mass is \\(5.97\\times10^{24}\\) kg, and \\(G = 6.674\\times10^{-11}\\). Multiplying adds exponents, \\(10^a\\times10^b = 10^{a+b}\\); dividing subtracts them.</p>`,
        N`<p><b>Powers.</b> \\(r^2 = r\\times r\\), \\(r^3 = r\\times r\\times r\\), \\(r^{-2} = 1/r^2\\). <b>Roots are fractional powers</b>: \\(\\sqrt{x} = x^{1/2}\\), \\(\\sqrt[3]{x} = x^{1/3}\\), and \\(x^{2/5}\\) means “take the fifth root, then square”. Calculators have an \\(x^y\\) key for this.</p>`,
        N`<p><b>Inverse square law.</b> Gravity falls off as \\(1/r^2\\): twice as far gives a quarter of the pull, ten times as far gives one hundredth. Remember that \\(r\\) is measured from the <i>centre</i> of the planet.</p>`,
        N`<p class="try">Try it: move away from Earth and watch gravity fade.</p>`,
      ],
      widget: 'powers',
    },
    derivative: {
      title: N('Derivatives: the rate of change'),
      used: N('Velocity, acceleration, mass flow ṁ, the equations of motion'),
      html: [
        N`<p>Throw a ball upward. Its height \\(h\\) changes with time \\(t\\). Over a short interval \\(\\Delta t\\) its <b>average</b> vertical speed is \\(\\Delta h/\\Delta t\\): the slope of the line joining two points of the curve \\(h(t)\\).</p>`,
        N`<p>Make \\(\\Delta t\\) smaller and smaller and the line becomes the <b>tangent</b> to the curve. Its slope is the <b>instantaneous</b> rate of change, the <b>derivative</b>:</p>`,
        N`\\[ \\frac{dh}{dt} = \\lim_{\\Delta t\\to 0}\\frac{\\Delta h}{\\Delta t} \\qquad\\text{also written}\\qquad \\dot h \\]`,
        N`<p>A dot on top always means “per second” (time derivative). Physics stacks them: the rate of change of position is velocity, and the rate of change of velocity is acceleration, \\(\\vec a = \\dot{\\vec v} = \\ddot{\\vec r}\\).</p>`,
        N`<p>You will rarely need to compute derivatives here, but two rules help you read: the derivative of a constant is 0, and \\(\\dfrac{d}{dt}t^n = n\\,t^{n-1}\\). For the ball, \\(h = v_0 t - \\tfrac12 g t^2\\), so \\(\\dot h = v_0 - g t\\): the speed falls by \\(g\\) every second.</p>`,
        N`<p class="try">Try it: shrink Δt and watch the secant (orange) turn into the tangent.</p>`,
      ],
      widget: 'derivative',
    },
    integral: {
      title: N('Integrals: adding up tiny pieces'),
      used: N('Gravity and drag losses, distance from speed, heat load'),
      html: [
        N`<p>At a constant 100 m/s for 10 s you cover 1 000 m: speed × time. But a rocket’s speed keeps changing. So cut the flight into short steps \\(\\Delta t\\), treat the speed as constant during each, and add up the little distances \\(v_i\\,\\Delta t\\).</p>`,
        N`<p>On a graph of \\(v(t)\\), each step is a thin rectangle; the sum is the <b>area under the curve</b>. With ever thinner steps the sum becomes exact: that limit is the <b>integral</b>,</p>`,
        N`\\[ \\text{distance} = \\int_{0}^{T} v(t)\\,dt \\approx \\sum_i v_i\\,\\Delta t \\]`,
        N`<p>Read \\(\\int \\ldots dt\\) as “add up, second by second, over the whole period”. Integration undoes differentiation: integrate velocity and you get position back. The gravity loss \\(\\int g\\sin\\gamma\\,dt\\) is exactly this kind of sum: every second the rocket climbs, gravity takes \\(g\\sin\\gamma\\) metres per second from it.</p>`,
        N`<p class="try">Try it: add more rectangles and watch the sum approach the exact area.</p>`,
      ],
      widget: 'integral',
    },
    log: {
      title: N('Exponentials and logarithms'),
      used: N('The rocket equation, the atmosphere’s density, hover time'),
      html: [
        N`<p>The <b>exponential</b> \\(e^x\\), with \\(e \\approx 2.718\\), describes anything that changes by the same <i>percentage</i> per step. Air density falls by the same fraction for every 7.2 km you climb: \\(\\rho = \\rho_0\\,e^{-h/H}\\).</p>`,
        N`<p>The <b>natural logarithm</b> \\(\\ln\\) undoes it: \\(\\ln(e^x) = x\\). It turns multiplication into addition:</p>`,
        R`\[ \ln(ab) = \ln a + \ln b, \qquad \ln\frac{a}{b} = \ln a - \ln b, \qquad \ln a^n = n\ln a \]`,
        N`<p><b>Why the rocket equation has a log.</b> Burning 10% of your current mass always gives the same Δv, whether the rocket is full or nearly empty. Doubling the mass ratio therefore adds a fixed amount of Δv, \\(c\\ln 2 \\approx 0.69\\,c\\), no matter how big the rocket already is. To gain the same Δv again, you must multiply, not add. That is the “tyranny”.</p>`,
        N`<p class="try">Try it: each doubling of the mass ratio adds the same Δv.</p>`,
      ],
      widget: 'log',
    },
    ellipse: {
      title: N('Ellipses and conic sections'),
      used: N('Every orbit: a, e, periapsis, apoapsis'),
      html: [
        N`<p>Pin two drawing pins in a board, loop a string around them and trace with a pencil keeping the string tight: you draw an <b>ellipse</b>. The pins are the two <b>foci</b>. For every point, the distances to the two foci add up to the same length, \\(2a\\), where \\(a\\) is the <b>semi-major axis</b>.</p>`,
        N`<p>The <b>eccentricity</b> \\(e = c/a\\) says how far the foci are from the centre (\\(c\\)): 0 for a circle, close to 1 for a long thin ellipse. A planet sits at one focus; the other is empty. The closest and farthest points are</p>`,
        R`\[ r_p = a(1-e), \qquad r_a = a(1+e), \qquad b = a\sqrt{1-e^2} \]`,
        N`<p>Circles, ellipses, parabolas and hyperbolas are all <b>conic sections</b>, the curves you get by slicing a cone at different angles. Newton’s gravity produces exactly these four shapes, and nothing else.</p>`,
        N`<p class="try">Try it: change the eccentricity; the two string lengths always add to 2a.</p>`,
      ],
      widget: 'ellipse',
    },
    relative: {
      title: N('Relative velocity and reference frames'),
      used: N('Rendezvous, docking, arriving at the Moon'),
      html: [
        N`<p>A velocity only means something <b>relative to</b> something else. On a train at 300 km/h, a coffee cup is at rest relative to you. In lunar orbit both spacecraft move at about 1.6 km/s relative to the Moon, but what matters for docking is their velocity relative to <i>each other</i>, a few centimetres per second.</p>`,
        R`\[ \vec v_{rel} = \vec v_{chaser} - \vec v_{target} \]`,
        N`<p>Subtracting vectors works component by component, like adding, with a minus sign. Two huge, almost identical arrows give a tiny difference arrow, and that small arrow is the one the pilot flies.</p>`,
        N`<p>Choosing the <b>reference frame</b>, the point of view you measure from, can make a problem simple. Docking is flown in the target’s frame: the target sits still at the origin and only the chaser moves. Arriving at the Moon (Chapter 8) uses the Moon’s frame. The physics is the same; only the description changes. A frame that rotates or accelerates, like the target’s orbiting frame, adds apparent forces such as the Coriolis terms of the Clohessy–Wiltshire equations.</p>`,
        N`<p class="try">Try it: two orbital velocities, almost the same, and the tiny difference (shown ×10 000).</p>`,
      ],
      widget: 'relative',
    },
    iteration: {
      title: N('Solving equations by iteration'),
      used: N('Kepler’s equation, finding free-return trajectories'),
      html: [
        N`<p>Some equations cannot be rearranged to isolate the unknown. Kepler’s equation \\(M = E - e\\sin E\\) is the classic one: given \\(M\\), no formula gives \\(E\\) directly.</p>`,
        N`<p>So guess, check, and improve. <b>Newton’s method</b> writes the problem as \\(f(E) = E - e\\sin E - M = 0\\) and corrects the guess using the slope of \\(f\\):</p>`,
        R`\[ E_{k+1} = E_k - \frac{f(E_k)}{f'(E_k)} = E_k - \frac{E_k - e\sin E_k - M}{1 - e\cos E_k} \]`,
        N`<p>Each step roughly doubles the number of correct digits; three or four steps are enough. The Apollo Guidance Computer, the simulators in this manual and the “solve MCC” button all work this way: guess, measure the error, correct.</p>`,
        N`<p class="try">Try it: watch the guesses converge.</p>`,
      ],
      widget: 'iteration',
    },
  };

  let uid = 0;
  const Primer = {
    PRIMERS,
    // a collapsed refresher box; id lets debriefs and briefings link to it
    box(key, open = false, fixedId = null) {
      const p = PRIMERS[key];
      const id = fixedId || `primer-${key}${open ? '' : '-' + (++uid)}`;
      // prose parts are translated; display TeX without words stays as is
      const html = p.html.map((part) => (/^\\\[/.test(part) && !part.includes('\\text') ? part : T(part))).join('\n        ');
      return `<details class="primer" id="${id}" data-primer="${key}"${open ? ' open' : ''}>
        <summary><span class="primer-tag">${T`Math refresher`}</span><span class="primer-title">${T(p.title)}</span><span class="primer-used">${T`used for: ${T(p.used)}`}</span></summary>
        <div class="primer-body"><div class="prose">\n        ${html}</div><div class="primer-widget"></div></div>
      </details>`;
    },
    // mount widgets lazily, when a box is first opened
    activate(root) {
      root.querySelectorAll('details.primer').forEach((d) => {
        const mount = () => { if (d.dataset.mounted) return; d.dataset.mounted = '1'; WIDGETS[PRIMERS[d.dataset.primer].widget](d.querySelector('.primer-widget')); };
        if (d.open) mount();
        d.addEventListener('toggle', () => { if (d.open) mount(); });
      });
    },
  };

  /* ---------------- widgets ---------------- */
  const sliderRow = (id, label, min, max, step, value) => `<div class="ctl"><label for="${id}"><span>${label}</span><output id="${id}-out"></output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  const wid = () => 'w' + (++uid);
  const frame = (el, controlsHtml) => {
    el.innerHTML = `<div class="pw"><div class="pw-stage"><canvas></canvas></div><div class="pw-side">${controlsHtml}<dl class="readout pw-ro"></dl></div></div>`;
    return { cv: el.querySelector('canvas'), ro: el.querySelector('.pw-ro'), side: el.querySelector('.pw-side') };
  };
  const f = (x, d = 2) => UI.fmt(x, d);

  const WIDGETS = {
    vectors(el) {
      const { cv, ro } = frame(el, `<p class="note" style="margin:0">${T`Drag the tips of <b style="color:var(--accent)">a</b> and <b style="color:var(--trace)">b</b>.`}</p>`);
      const A = { x: 3, y: 1 }, B = { x: 1, y: 2.5 };
      let drag = null, geo = null;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        ctx.clearRect(0, 0, w, h);
        const s = Math.min(w / 9, h / 5.2), ox = w * 0.3, oy = h * 0.82;
        geo = { s, ox, oy };
        const P = (v) => [ox + v.x * s, oy - v.y * s];
        ctx.strokeStyle = K.grid; ctx.lineWidth = 1;
        for (let i = -6; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(ox + i * s, 0); ctx.lineTo(ox + i * s, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, oy - i * s); ctx.lineTo(w, oy - i * s); ctx.stroke(); }
        ctx.strokeStyle = K.line; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
        const S = { x: A.x + B.x, y: A.y + B.y };
        // tip-to-tail ghost
        ctx.setLineDash([4, 4]); UI.arrow(ctx, ...P(A), ...P(S), K.trace, 1.2); ctx.setLineDash([]);
        UI.arrow(ctx, ox, oy, ...P(S), K.good, 2.5);
        UI.arrow(ctx, ox, oy, ...P(A), K.accent, 2.5);
        UI.arrow(ctx, ox, oy, ...P(B), K.trace, 2.5);
        ctx.font = `12px ${K.mono}`;
        ctx.fillStyle = K.accent; ctx.fillText('a', P(A)[0] + 6, P(A)[1] - 6);
        ctx.fillStyle = K.trace; ctx.fillText('b', P(B)[0] + 6, P(B)[1] - 6);
        ctx.fillStyle = K.good; ctx.fillText('a + b', P(S)[0] + 6, P(S)[1] - 6);
        for (const v of [A, B]) { const [x, y] = P(v); ctx.strokeStyle = K.ink; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); }
        const la = Math.hypot(A.x, A.y), lb = Math.hypot(B.x, B.y), dot = A.x * B.x + A.y * B.y, cross = A.x * B.y - A.y * B.x;
        const th = Math.acos(Math.max(-1, Math.min(1, dot / (la * lb || 1)))) * 180 / Math.PI;
        ro.innerHTML = `<dt>a</dt><dd>(${f(A.x, 1)}, ${f(A.y, 1)})</dd><dt>b</dt><dd>(${f(B.x, 1)}, ${f(B.y, 1)})</dd>
          <dt>a + b</dt><dd>(${f(S.x, 1)}, ${f(S.y, 1)})</dd><dt>|a|, |b|</dt><dd>${f(la)}, ${f(lb)}</dd>
          <dt>${T`angle θ`}</dt><dd>${f(th, 1)}°</dd><dt>a · b</dt><dd class="hl">${f(dot)}</dd><dt>${T`a × b (out of screen)`}</dt><dd class="hl">${f(cross)}</dd>`;
      });
      const toV = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - geo.ox) / geo.s, y: -(e.clientY - r.top - geo.oy) / geo.s }; };
      cv.addEventListener('pointerdown', (e) => { const p = toV(e); drag = Math.hypot(p.x - A.x, p.y - A.y) < Math.hypot(p.x - B.x, p.y - B.y) ? A : B; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (!drag) return; const p = toV(e); drag.x = Math.round(p.x * 2) / 2; drag.y = Math.round(p.y * 2) / 2; view.redraw(); });
      cv.addEventListener('pointerup', () => { drag = null; });
    },

    trig(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Angle θ`, 0, 360, 1, 35));
      let th = 35;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok(), R0 = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2, a = th * Math.PI / 180;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = K.line; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.moveTo(cx - R0 - 10, cy); ctx.lineTo(cx + R0 + 10, cy); ctx.moveTo(cx, cy - R0 - 10); ctx.lineTo(cx, cy + R0 + 10); ctx.stroke();
        const px = cx + R0 * Math.cos(a), py = cy - R0 * Math.sin(a);
        ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = K.trace; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
        ctx.strokeStyle = K.accent; ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, -a, true); ctx.stroke();
        ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill();
        ctx.font = `12px ${K.mono}`; ctx.fillStyle = K.trace; ctx.fillText('cos θ', (cx + px) / 2 - 18, cy + (Math.sin(a) > 0 ? 16 : -8));
        ctx.fillStyle = K.accent; ctx.fillText('sin θ', px + 6, (cy + py) / 2);
        ctx.fillStyle = K.muted; ctx.fillText(T`radius 1`, cx - R0, cy - R0 + 4);
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      const upd = () => {
        th = +inp.value; const a = th * Math.PI / 180;
        out.textContent = th + '°';
        ro.innerHTML = `<dt>${T`θ in radians`}</dt><dd>${f(a, 3)} rad</dd><dt>cos θ</dt><dd style="color:var(--trace)">${f(Math.cos(a), 3)}</dd><dt>sin θ</dt><dd style="color:var(--accent)">${f(Math.sin(a), 3)}</dd><dt>tan θ</dt><dd>${Math.abs(Math.cos(a)) < 1e-6 ? '∞' : f(Math.tan(a), 3)}</dd><dt>cos² + sin²</dt><dd>${f(Math.cos(a) ** 2 + Math.sin(a) ** 2, 3)}</dd>`;
        view.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },

    powers(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Distance from Earth’s centre`, 1, 10, 0.05, 2));
      let k = 2;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        ctx.clearRect(0, 0, w, h);
        const s = Math.min((w - 150) / 11, h * 0.3), ox = s + 12, cy = h * 0.42;
        UI.drawEarth(ctx, ox, cy, s, K);
        ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(ox + k * s, cy, 5, 0, 7); ctx.fill();
        ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center';
        for (let i = 1; i <= 10; i++) ctx.fillText(i + 'R', ox + i * s, cy + s + 18);
        // bars: 1/r and 1/r²
        const bw = 26, base = h - 16, H = h * 0.32;
        ctx.textAlign = 'left';
        ctx.fillStyle = K.trace; ctx.fillRect(w - 110, base - H / k, bw, H / k);
        ctx.fillStyle = K.accent; ctx.fillRect(w - 70, base - H / (k * k), bw, H / (k * k));
        ctx.fillStyle = K.muted; ctx.fillText('1/r', w - 108, base - H - 6); ctx.fillText('1/r²', w - 68, base - H - 6);
        ctx.strokeStyle = K.line; ctx.strokeRect(w - 110, base - H, bw, H); ctx.strokeRect(w - 70, base - H, bw, H);
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      const upd = () => {
        k = +inp.value; out.textContent = `${f(k, 2)} R⊕`;
        const r = k * 6378;
        ro.innerHTML = `<dt>r</dt><dd>${f(r, 0)} km</dd><dt>${T`altitude`}</dt><dd>${f(r - 6378, 0)} km</dd><dt>${T`1/r² vs surface`}</dt><dd>1/${f(k * k, 2)}</dd><dt>${T`gravity g`}</dt><dd class="hl">${f(9.807 / (k * k), 3)} m/s²</dd><dt>${T`in scientific notation`}</dt><dd>${UI.dec((r * 1000).toExponential(3).replace('e+', ' × 10^'))} m</dd>`;
        view.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },

    derivative(el) {
      const i1 = wid(), i2 = wid();
      const { cv, ro, side } = frame(el, sliderRow(i1, T`Time t`, 0, 3, 0.05, 0.8) + sliderRow(i2, T`Interval Δt`, 0.01, 1.5, 0.01, 1));
      const v0 = 15, g = 9.81, hf = (t) => v0 * t - 0.5 * g * t * t;
      let t = 0.8, dt = 1;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        const data = []; for (let x = 0; x <= 3.06; x += 0.03) data.push([x, hf(x)]);
        const { X, Y } = UI.chart(ctx, w, h, { series: [{ data, color: K.trace, width: 2, end: false }], xMin: 0, xMax: 3.06, yMin: 0, yMax: 13, xLabel: 't (s)', yLabel: T`height h (m)` });
        const slope = (hf(t + dt) - hf(t)) / dt, tang = v0 - g * t;
        const line = (m, c) => { ctx.beginPath(); ctx.moveTo(X(t - 1), Y(hf(t) - m)); ctx.lineTo(X(t + 2), Y(hf(t) + 2 * m)); ctx.strokeStyle = c; ctx.stroke(); };
        ctx.save(); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); line(tang, K.good); ctx.setLineDash([]); line(slope, K.accent); ctx.restore();
        ctx.fillStyle = K.ink; for (const x of [t, t + dt]) { ctx.beginPath(); ctx.arc(X(x), Y(hf(x)), 4, 0, 7); ctx.fill(); }
        ctx.strokeStyle = K.muted; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(t), Y(hf(t))); ctx.lineTo(X(t + dt), Y(hf(t))); ctx.lineTo(X(t + dt), Y(hf(t + dt))); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.muted; ctx.fillText('Δt', (X(t) + X(t + dt)) / 2 - 6, Y(hf(t)) + 14); ctx.fillText('Δh', X(t + dt) + 5, (Y(hf(t)) + Y(hf(t + dt))) / 2);
      });
      const [a, b] = side.querySelectorAll('input'), [oa, ob] = side.querySelectorAll('output');
      const upd = () => {
        t = +a.value; dt = +b.value; oa.textContent = f(t, 2) + ' s'; ob.textContent = f(dt, 2) + ' s';
        const slope = (hf(t + dt) - hf(t)) / dt, tang = v0 - g * t;
        ro.innerHTML = `<dt>${T`Δh / Δt (secant)`}</dt><dd style="color:var(--accent)">${f(slope, 3)} m/s</dd><dt>${T`dh/dt = v₀ − g t (tangent)`}</dt><dd style="color:var(--good)">${f(tang, 3)} m/s</dd><dt>${T`difference`}</dt><dd>${f(slope - tang, 3)} m/s</dd><dt>${T`meaning`}</dt><dd>${tang > 0.05 ? T`still going up` : tang < -0.05 ? T`falling` : T`top of the arc`}</dd>`;
        view.redraw();
      };
      a.addEventListener('input', upd); b.addEventListener('input', upd); upd();
    },

    integral(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Number of rectangles`, 1, 60, 1, 6));
      // speed of a rocket stage (rocket equation minus gravity), c = 3000 m/s, burns 75% of its mass in 150 s
      const c = 3000, tb = 150, v = (t) => c * Math.log(1 / (1 - 0.75 * t / tb)) - 9.81 * t;
      const exact = (() => { let s = 0; const N = 20000; for (let i = 0; i < N; i++) s += v((i + 0.5) * tb / N) * tb / N; return s; })();
      let n = 6;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        const data = []; for (let x = 0; x <= tb; x += 1) data.push([x, v(x) / 1000]);
        const { X, Y } = UI.chart(ctx, w, h, { series: [{ data, color: K.trace, width: 2, end: false }], xMin: 0, xMax: tb, yMin: 0, xLabel: 't (s)', yLabel: T`speed (km/s)`, xFmt: (x) => x.toFixed(0) });
        const dt = tb / n;
        for (let i = 0; i < n; i++) {
          const vi = v(i * dt) / 1000;
          ctx.fillStyle = K.accent; ctx.globalAlpha = 0.25; ctx.fillRect(X(i * dt), Y(vi), X(dt) - X(0), Y(0) - Y(vi));
          ctx.globalAlpha = 0.8; ctx.strokeStyle = K.accent; ctx.lineWidth = 1; ctx.strokeRect(X(i * dt), Y(vi), X(dt) - X(0), Y(0) - Y(vi)); ctx.globalAlpha = 1;
        }
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      const upd = () => {
        n = +inp.value; out.textContent = n;
        const dt = tb / n; let s = 0; for (let i = 0; i < n; i++) s += v(i * dt) * dt;
        ro.innerHTML = `<dt>${T`Δt per rectangle`}</dt><dd>${f(dt, 1)} s</dd><dt>${T`Σ v·Δt (rectangles)`}</dt><dd class="hl">${f(s / 1000, 1)} km</dd><dt>${T`∫ v dt (exact area)`}</dt><dd>${f(exact / 1000, 1)} km</dd><dt>${T`error`}</dt><dd>${f(100 * (s - exact) / exact, 1)} %</dd><dt>${T`meaning`}</dt><dd>${T`distance flown`}</dd>`;
        view.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },

    log(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Mass ratio m₀/m_f`, 1, 32, 0.1, 8));
      let mr = 8;
      const c = 4129;                                   // LH₂/LOX, Isp 421 s
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        const data = []; for (let x = 1; x <= 32; x += 0.25) data.push([x, c * Math.log(x) / 1000]);
        const { X, Y } = UI.chart(ctx, w, h, { series: [{ data, color: K.trace, width: 2, end: false }], xMin: 1, xMax: 32, yMin: 0, yMax: 15, xLabel: T`mass ratio`, yLabel: T`Δv (km/s), Isp 421 s`, cursor: mr, xFmt: (x) => x.toFixed(0) });
        ctx.font = `10px ${K.mono}`;
        for (const k of [1, 2, 4, 8, 16, 32]) {
          ctx.fillStyle = k <= mr ? K.accent : K.muted; ctx.beginPath(); ctx.arc(X(k), Y(c * Math.log(k) / 1000), 4, 0, 7); ctx.fill();
          if (k > 1) ctx.fillText('×2', X(k) - 8, Y(c * Math.log(k) / 1000) - 8);
        }
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      const upd = () => {
        mr = +inp.value; out.textContent = f(mr, 1);
        ro.innerHTML = `<dt>${T`ln(mass ratio)`}</dt><dd>${f(Math.log(mr), 3)}</dd><dt>Δv = c ln(MR)</dt><dd class="hl">${f(c * Math.log(mr) / 1000, 2)} km/s</dd><dt>${T`each doubling adds`}</dt><dd>c ln 2 = ${f(c * Math.LN2 / 1000, 2)} km/s</dd><dt>${T`propellant share`}</dt><dd>${f(100 * (1 - 1 / mr), 1)} %</dd>`;
        view.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },

    ellipse(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Eccentricity e`, 0, 0.95, 0.01, 0.6));
      let e = 0.6, ang = 1;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        ctx.clearRect(0, 0, w, h);
        const a = Math.min(w * 0.42, h * 0.42 / Math.max(0.3, Math.sqrt(1 - e * e))), b = a * Math.sqrt(1 - e * e), c = a * e, cx = w / 2, cy = h / 2;
        ctx.strokeStyle = K.trace; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, 7); ctx.stroke();
        const px = cx + a * Math.cos(ang), py = cy - b * Math.sin(ang);
        ctx.strokeStyle = K.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - c, cy); ctx.lineTo(px, py); ctx.lineTo(cx + c, cy); ctx.stroke();
        UI.drawEarth(ctx, cx - c, cy, 7, K);
        ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.arc(cx + c, cy, 4, 0, 7); ctx.stroke();
        ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill();
        ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center';
        ctx.fillText(T`periapsis`, cx - a, cy + 16); ctx.fillText(T`apoapsis`, cx + a, cy + 16); ctx.fillText(T`empty focus`, cx + c, cy - 10);
        ctx.strokeStyle = K.line; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(cx - a, cy); ctx.lineTo(cx + a, cy); ctx.stroke(); ctx.setLineDash([]);
        const d1 = Math.hypot(px - (cx - c), py - cy) / a, d2 = Math.hypot(px - (cx + c), py - cy) / a;
        ro.innerHTML = `<dt>${T`a (semi-major axis)`}</dt><dd>1</dd><dt>b = a√(1−e²)</dt><dd>${f(Math.sqrt(1 - e * e), 3)}</dd><dt>r_p = a(1−e)</dt><dd>${f(1 - e, 3)}</dd><dt>r_a = a(1+e)</dt><dd>${f(1 + e, 3)}</dd><dt>${T`string: d₁ + d₂`}</dt><dd class="hl">${f(d1, 3)} + ${f(d2, 3)} = ${f(d1 + d2, 3)}</dd>`;
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      inp.addEventListener('input', () => { e = +inp.value; out.textContent = f(e, 2); view.redraw(); });
      out.textContent = f(e, 2);
      UI.loop((dt) => { if (!el.isConnected || !el.closest('details').open) return; ang += dt * 0.6; view.redraw(); });
    },

    relative(el) {
      const id = wid();
      const { cv, ro, side } = frame(el, sliderRow(id, T`Chaser speed vs target (cm/s)`, -30, 30, 0.5, 8));
      const vt = 1633;                                    // lunar orbit speed at 110 km, m/s
      let dv = 0.08;
      const view = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok();
        ctx.clearRect(0, 0, w, h);
        const ox = 30, s = (w - 120) / vt;
        ctx.font = `11px ${K.mono}`; ctx.textAlign = 'left';
        UI.arrow(ctx, ox, h * 0.28, ox + vt * s, h * 0.28, K.trace, 3);
        ctx.fillStyle = K.trace; ctx.fillText(T`target: ${UI.fmt(vt, 2)} m/s`, ox, h * 0.28 - 10);
        UI.arrow(ctx, ox, h * 0.48, ox + (vt + dv) * s, h * 0.48, K.accent, 3);
        ctx.fillStyle = K.accent; ctx.fillText(T`chaser: ${UI.fmt(vt + dv, 2)} m/s`, ox, h * 0.48 - 10);
        const z = 10000 * s, cx = w / 2;
        ctx.strokeStyle = K.line; ctx.beginPath(); ctx.moveTo(cx, h * 0.68); ctx.lineTo(cx, h * 0.9); ctx.stroke();
        if (Math.abs(dv) > 1e-4) UI.arrow(ctx, cx, h * 0.8, cx + dv * z, h * 0.8, K.good, 3);
        ctx.fillStyle = K.good; ctx.textAlign = 'center'; ctx.fillText(T`relative: ${UI.fmt(dv * 100, 1)} cm/s  (drawn ×10 000)`, cx, h * 0.68 - 6);
      });
      const inp = side.querySelector('input'), out = side.querySelector('output');
      const upd = () => {
        dv = +inp.value / 100; out.textContent = (dv >= 0 ? '+' : '') + UI.fmt(dv * 100, 1);
        ro.innerHTML = `<dt>${T`target speed`}</dt><dd>${UI.fmt(vt, 3)} m/s</dd><dt>${T`chaser speed`}</dt><dd>${UI.fmt(vt + dv, 3)} m/s</dd><dt>${T`relative velocity`}</dt><dd class="hl">${UI.fmt(dv * 100, 1)} cm/s</dd><dt>${T`ratio`}</dt><dd>1 : ${UI.fmt(vt / Math.max(1e-6, Math.abs(dv)), 0)}</dd><dt>${T`meaning`}</dt><dd>${dv > 0.001 ? T`chaser gaining` : dv < -0.001 ? T`chaser falling back` : T`station-keeping`}</dd>`;
        view.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },

    iteration(el) {
      const i1 = wid(), i2 = wid();
      const { ro, side } = frame(el, sliderRow(i1, T`Mean anomaly M`, 0, 360, 1, 100) + sliderRow(i2, T`Eccentricity e`, 0, 0.97, 0.01, 0.7));
      el.querySelector('.pw-stage').innerHTML = '<div class="scroll-x" style="padding:.8rem"><table class="data iter"></table></div>';
      const tab = el.querySelector('table.iter');
      const [a, b] = side.querySelectorAll('input'), [oa, ob] = side.querySelectorAll('output');
      const upd = () => {
        const M = +a.value * Math.PI / 180, e = +b.value;
        oa.textContent = a.value + '°'; ob.textContent = f(e, 2);
        let E = e < 0.8 ? M : Math.PI, rows = '';
        for (let k = 0; k < 7; k++) {
          const fE = E - e * Math.sin(E) - M;
          rows += `<tr><td>${k}</td><td>${f(E * 180 / Math.PI, 6)}°</td><td>${fE === 0 ? '0' : UI.dec(fE.toExponential(2))}</td></tr>`;
          E = E - fE / (1 - e * Math.cos(E));
        }
        tab.innerHTML = `<thead><tr><th>${T`step k`}</th><th>${T`guess E_k`}</th><th>${T`error f(E_k)`}</th></tr></thead><tbody>${rows}</tbody>`;
        const nu = Phys.trueFromEcc(E, e) * 180 / Math.PI;
        ro.innerHTML = `<dt>${T`solution E`}</dt><dd class="hl">${f(E * 180 / Math.PI, 4)}°</dd><dt>${T`true anomaly ν`}</dt><dd>${f((nu + 360) % 360, 2)}°</dd><dt>${T`first guess`}</dt><dd>${e < 0.8 ? 'E₀ = M' : 'E₀ = π'}</dd>`;
      };
      a.addEventListener('input', upd); b.addEventListener('input', upd); upd();
    },
  };

  /* ---------------- the Math Toolkit page ---------------- */
  App.chapter({
    id: 'toolkit', phase: N`Ground school`, title: N`Math Toolkit`,
    blurb: N`Nine short refreshers, from vectors to logarithms, each with something to play with.`,
    render(page) {
      page.innerHTML = `
        ${App.header({ eyebrow: T`Training · Ground school`, title: T`Math Toolkit`, lede: T`Everything the modules assume you remember from school, explained again in plain words. These same refreshers appear, folded, where each notion first matters. Open what you need, skip what you know.` })}
        <div class="toolkit">${Object.keys(PRIMERS).map((k) => Primer.box(k, true)).join('')}</div>`;
    },
  });

  window.Primer = Primer;
})();
