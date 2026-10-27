/* Symbol dictionary: Greek-letter tooltips and the "where:" legends under equations.
   Written for readers who know algebra and vectors but are rusty on calculus notation. */
(function () {
  'use strict';

  /* ---------- Greek letters and special signs (tooltips) ---------- */
  const GREEK = {
    alpha: { ch: 'α', name: N('alpha'), say: N('AL-fa'), use: N('an angle: the steering angle between thrust and velocity (ascent), or the lead angle (rendezvous)') },
    beta: { ch: 'β', name: N('beta'), say: N('BAY-ta'), use: N('ballistic coefficient m/(C_D·A), in kg/m² (entry)') },
    gamma: { ch: 'γ', name: N('gamma'), say: N('GAM-a'), use: N('flight-path angle in ascent and entry: angle of the velocity above the local horizontal (negative when descending)') },
    Gamma: { ch: 'Γ', name: N('capital gamma'), say: N('GAM-a'), use: N('not used in this course') },
    delta: { ch: 'δ', name: N('delta'), say: N('DEL-ta'), use: N('a small change') },
    Delta: { ch: 'Δ', name: N('capital delta'), say: N('DEL-ta'), use: N('“change in”: Δv is a change of velocity in m/s, Δi a change of inclination') },
    varepsilon: { ch: 'ε', name: N('epsilon'), say: N('EP-si-lon'), use: N('specific mechanical energy: orbital energy per kilogram, in J/kg (= m²/s²)') },
    epsilon: { ch: 'ϵ', name: N('epsilon'), say: N('EP-si-lon'), use: N('specific mechanical energy, in J/kg') },
    eta: { ch: 'η', name: N('eta'), say: N('AY-ta'), use: N('efficiency (not used here)') },
    theta: { ch: 'θ', name: N('theta'), say: N('THAY-ta'), use: N('a generic angle') },
    lambda: { ch: 'λ', name: N('lambda'), say: N('LAM-da'), use: N('longitude or wavelength (not used here)') },
    mu: { ch: 'μ', name: N('mu'), say: N('“mew”'), use: N('gravitational parameter μ = G·M of the central body, in m³/s² (Earth: 3.986 × 10¹⁴)') },
    nu: { ch: 'ν', name: N('nu'), say: N('“new”'), use: N('true anomaly: the angle from periapsis to the spacecraft, seen from the planet’s centre') },
    pi: { ch: 'π', name: N('pi'), say: N('“pie”'), use: N('3.14159…; π radians = 180°, half a turn') },
    rho: { ch: 'ρ', name: N('rho'), say: N('“row”'), use: N('air density, in kg/m³ (1.225 at sea level)') },
    sigma: { ch: 'σ', name: N('sigma'), say: N('SIG-ma'), use: N('bank angle of the capsule during entry (0° = lift up, 180° = lift down)') },
    Sigma: { ch: 'Σ', name: N('capital sigma'), say: N('SIG-ma'), use: N('“sum of”: add the terms together, one per value of the index below it') },
    sum: { ch: 'Σ', name: N('capital sigma (sum)'), say: N('SIG-ma'), use: N('“sum of”: add up the expression for every value of the index written below it (e.g. each stage k)') },
    tau: { ch: 'τ', name: N('tau'), say: N('“taw”'), use: N('a time constant (not used here)') },
    phi: { ch: 'φ', name: N('phi'), say: N('“fye” or “fee”'), use: N('flight-path angle in the orbit chapters (BMW convention); latitude in the Earth-rotation formula') },
    varphi: { ch: 'ϕ', name: N('phi'), say: N('“fye” or “fee”'), use: N('flight-path angle, or latitude') },
    omega: { ch: 'ω', name: N('omega'), say: N('oh-MAY-ga'), use: N('angular velocity, in rad/s: how fast something turns (ω⊕ = Earth’s rotation)') },
    Omega: { ch: 'Ω', name: N('capital omega'), say: N('oh-MAY-ga'), use: N('right ascension of the ascending node: where the orbit plane crosses the equator') },
    infty: { ch: '∞', name: N('infinity'), say: '', use: N('v∞ is the speed left over “at infinity”, far from the body: the hyperbolic excess speed') },
    oplus: { ch: '⊕', name: N('Earth symbol'), say: '', use: N('astronomical symbol for Earth: R⊕ is Earth’s radius, μ⊕ its gravitational parameter') },
    moon: { ch: '☾', name: N('Moon symbol'), say: '', use: N('astronomical symbol for the Moon: g☾ is lunar gravity, μ☾ its gravitational parameter') },
    int: { ch: '∫', name: N('integral sign'), say: '', use: N('“add up over time”: ∫ x dt is the total of x accumulated second by second, like summing x × (small time step) along the whole flight') },
  };
  const BY_CHAR = {};
  for (const [k, g] of Object.entries(GREEK)) if (!BY_CHAR[g.ch]) BY_CHAR[g.ch] = k;
  BY_CHAR['ϕ'] = 'varphi'; BY_CHAR['ε'] = 'varepsilon'; BY_CHAR['Σ'] = 'Sigma';

  /* ---------- Variables for "where:" legends: [TeX, meaning, unit] ---------- */
  const SYM = {
    // mechanics
    F: ['F', N('force'), N('N (newton = kg·m/s²)')],
    vecF: ['\\vec F', N('force vector (the arrow says it has a direction)'), 'N'],
    m: ['m', N('mass of the object (small body, e.g. the spacecraft)'), 'kg'],
    vecv: ['\\vec v', N('velocity vector: speed and direction'), 'm/s'],
    veca: ['\\vec a', N('acceleration vector: how fast the velocity changes, per second'), 'm/s²'],
    ddt: ['\\frac{d}{dt}', N('“rate of change per second” of what follows (a derivative). d(mv)/dt = how fast momentum changes'), ''],
    t: ['t', N('time'), 's'],
    G: ['G', N('universal gravitational constant, 6.674 × 10⁻¹¹'), 'N·m²/kg²'],
    M: ['M', N('mass of the large body (Earth: 5.972 × 10²⁴ kg)'), 'kg'],
    Fg: ['F_g', N('gravitational force between the two bodies'), 'N'],
    r: ['r', N('distance from the centre of the planet (radius + altitude, not the altitude alone)'), 'm'],
    mu: ['\\mu', N('gravitational parameter G·M of the central body. Earth: 3.986 × 10¹⁴, Moon: 4.903 × 10¹²'), 'm³/s²'],
    muE: ['\\mu_\\oplus', N('Earth’s gravitational parameter, 3.986 × 10¹⁴ m³/s² (398 600 km³/s²)'), 'm³/s²'],
    muM: ['\\mu_☾', N('the Moon’s gravitational parameter, 4.903 × 10¹² m³/s² (4 903 km³/s²)'), 'm³/s²'],
    gr: ['g(r)', N('gravitational acceleration at distance r from the centre'), 'm/s²'],
    g: ['g', N('local gravitational acceleration μ/r² (9.81 m/s² at the surface, less higher up)'), 'm/s²'],
    g0: ['g_0', N('standard gravity at Earth’s surface, 9.806 65 (a fixed constant, even on the Moon)'), 'm/s²'],
    gM: ['g_☾', N('gravity on the Moon’s surface, 1.62'), 'm/s²'],
    RE: ['R_\\oplus', N('Earth’s radius, 6 378 km'), 'm'],
    v: ['v', N('speed (length of the velocity vector)'), 'm/s'],
    vcirc: ['v_{\\text{circ}}', N('circular orbital speed at distance r'), 'm/s'],
    vesc: ['v_{\\text{esc}}', N('escape speed at distance r'), 'm/s'],
    ke: ['\\tfrac12 v^2', N('kinetic energy per kilogram'), 'J/kg'],
    pe: ['\\mu/r', N('depth of the gravity well at r: the energy per kilogram needed to climb out of it'), 'J/kg'],
    vecr: ['\\vec r', N('position vector from the planet’s centre to the spacecraft'), 'm'],
    rddot: ['\\ddot{\\vec r}', N('acceleration of the spacecraft. Two dots = rate of change of the rate of change of position (second derivative over time)'), 'm/s²'],
    // orbits
    eps: ['\\varepsilon', N('specific mechanical energy: kinetic + potential energy per kilogram. Negative = bound orbit'), 'J/kg = m²/s²'],
    vech: ['\\vec h', N('specific angular momentum vector, perpendicular to the orbit plane'), 'm²/s'],
    h: ['h', N('specific angular momentum (length of h⃗): r·v·cos φ, constant along the orbit'), 'm²/s'],
    cross: ['\\times', N('cross product: a vector perpendicular to both, with length r·v·sin(angle between them)'), ''],
    phi: ['\\phi', N('flight-path angle: angle of the velocity above the local horizontal (0 at periapsis and apoapsis)'), N('rad or °')],
    p: ['p', N('semi-latus rectum (“parameter”): the distance r when ν = 90°; sets the orbit’s width'), 'm'],
    e: ['e', N('eccentricity (no unit): 0 circle, between 0 and 1 ellipse, 1 parabola, above 1 hyperbola'), '—'],
    nu: ['\\nu', N('true anomaly: angle from periapsis to the spacecraft, seen from the planet’s centre'), N('rad or °')],
    a: ['a', N('semi-major axis: half the longest diameter of the ellipse. Sets the energy and the period'), 'm'],
    rp: ['r_p', N('periapsis radius: closest distance to the centre (perigee for Earth)'), 'm'],
    ra: ['r_a', N('apoapsis radius: farthest distance from the centre (apogee for Earth)'), 'm'],
    T: ['T', N('orbital period: time for one full orbit'), 's'],
    n: ['n', N('mean motion: the average angular rate 2π/T'), 'rad/s'],
    Mm: ['M', N('mean anomaly: an imaginary angle that grows at a perfectly steady rate (here M is not a mass)'), 'rad'],
    tp: ['t_p', N('time when the spacecraft passed periapsis'), 's'],
    E: ['E', N('eccentric anomaly: angle measured from the ellipse’s centre on a circle of radius a (a helper angle)'), 'rad'],
    tan: ['\\tan', N('tangent function (calculator: tan; set to radians or degrees consistently)'), ''],
    // rockets
    Fth: ['F', N('thrust force of the engine'), 'N'],
    mdot: ['\\dot m', N('mass flow rate: kilograms of propellant burned per second. A dot on top means “per second”'), 'kg/s'],
    ve: ['v_e', N('exhaust gas speed at the nozzle exit, relative to the rocket'), 'm/s'],
    pexit: ['p_e', N('pressure of the exhaust at the nozzle exit'), 'Pa'],
    pa: ['p_a', N('pressure of the surrounding air (101 325 Pa at sea level, 0 in vacuum)'), 'Pa'],
    Ae: ['A_e', N('area of the nozzle exit'), 'm²'],
    isp: ['I_{sp}', N('specific impulse: seconds that 1 kg of propellant can push with 1 kg-force. Higher is better'), 's'],
    c: ['c', N('effective exhaust velocity F/ṁ = I_sp·g₀'), 'm/s'],
    dv: ['\\Delta v', N('velocity change the burn can give (“delta-v”)'), 'm/s'],
    ln: ['\\ln', N('natural logarithm (the “ln” key). ln 1 = 0, ln 2 ≈ 0.69, ln 10 ≈ 2.30: it grows very slowly'), ''],
    m0: ['m_0', N('initial mass, tanks full'), 'kg'],
    mf: ['m_f', N('final mass, propellant used up'), 'kg'],
    sumk: ['\\sum_k', N('add up the expression for each stage k = 1, 2, 3…'), ''],
    m0k: ['m_{0,k}', N('mass when stage k ignites, including all stages above it and the payload'), 'kg'],
    mfk: ['m_{f,k}', N('mass when stage k burns out, before it is dropped'), 'kg'],
    ispk: ['I_{sp,k}', N('specific impulse of stage k'), 's'],
    twr: ['\\mathrm{TWR}', N('thrust-to-weight ratio: engine thrust divided by the vehicle’s weight (no unit). Above 1 the rocket can rise'), '—'],
    avert: ['a_{\\text{vertical}}', N('upward acceleration when the rocket is pointing straight up'), 'm/s²'],
    tb: ['t_b', N('burn time: how long the stage fires before its tanks are empty'), 's'],
    // ascent
    vorbit: ['v_{orbit}', N('speed needed in the target orbit (7.79 km/s at 185 km)'), 'm/s'],
    integral: ['\\int \\ldots dt', N('“add up over the whole ascent”: each second of flight adds (the expression) × 1 s to the total'), ''],
    gamma: ['\\gamma', N('flight-path angle: 90° climbing straight up, 0° flying horizontally'), N('rad or °')],
    D: ['D', N('aerodynamic drag force'), 'N'],
    alpha: ['\\alpha', N('angle between where the engine points and where the rocket is going'), N('rad or °')],
    vrot: ['v_{rotation}', N('speed given for free by Earth’s rotation (408 m/s at Cape Canaveral, launching east)'), 'm/s'],
    gammadot: ['\\dot\\gamma', N('how fast the flight-path angle changes, per second (the path curving down)'), 'rad/s'],
    // manoeuvres
    at: ['a_t', N('semi-major axis of the transfer ellipse'), 'm'],
    r1: ['r_1', N('radius of the starting circular orbit (from the centre)'), 'm'],
    r2: ['r_2', N('radius of the final circular orbit'), 'm'],
    dv1: ['\\Delta v_1', N('first burn: leave the starting orbit onto the transfer ellipse'), 'm/s'],
    dv2: ['\\Delta v_2', N('second burn: from the transfer ellipse into the final orbit'), 'm/s'],
    tof: ['\\mathrm{TOF}', N('time of flight: duration of the transfer (half a transfer orbit)'), 's'],
    pi: ['\\pi', N('3.14159…; half a turn in radians (180°)'), ''],
    dvplane: ['\\Delta v_{plane}', N('cost of tilting the orbit'), 'm/s'],
    di: ['\\Delta i', N('change of inclination: angle between the old and new orbit planes'), N('rad or °')],
    vi: ['v_i', N('speed before the burn'), 'm/s'],
    vf: ['v_f', N('speed after the burn'), 'm/s'],
    alead: ['\\alpha_{lead}', N('lead angle: how far ahead the target must be when the chaser starts its transfer'), N('rad or °')],
    wtgt: ['\\omega_{tgt}', N('angular velocity of the target on its orbit, √(μ/r₂³)'), 'rad/s'],
    // moon
    rsoi: ['r_{SOI}', N('radius of the sphere of influence: the zone where the smaller body’s gravity dominates'), 'm'],
    Dem: ['D', N('distance between the two bodies (Earth–Moon: 384 400 km)'), 'm'],
    mM: ['m_☾', N('mass of the Moon (7.35 × 10²² kg)'), 'kg'],
    mE: ['m_\\oplus', N('mass of the Earth (5.97 × 10²⁴ kg). The ratio is 0.0123'), 'kg'],
    vp: ['v_p', N('speed at periapsis'), 'm/s'],
    rpT: ['r_p', N('perigee radius = parking orbit radius (6 378 + 185 = 6 563 km)'), 'm'],
    raT: ['r_a', N('apogee radius, out at the Moon’s distance (≈ 384 400 km)'), 'm'],
    dvtli: ['\\Delta v_{TLI}', N('trans-lunar injection burn'), 'm/s'],
    vinf: ['v_\\infty', N('hyperbolic excess speed: speed relative to the Moon on arrival, before its gravity speeds you up'), 'm/s'],
    rpM: ['r_p', N('periselene radius: closest distance to the Moon’s centre'), 'm'],
    dvloi: ['\\Delta v_{LOI}', N('lunar orbit insertion burn (braking)'), 'm/s'],
    // landing
    thover: ['t_{hover}', N('how long the lander can hover'), 's'],
    m0h: ['m_0', N('mass when hovering starts'), 'kg'],
    mprop: ['m_{prop}', N('propellant available for hovering'), 'kg'],
    // entry
    vdot: ['\\dot v', N('how fast the speed changes, per second (negative = slowing down)'), 'm/s²'],
    rho: ['\\rho', N('air density at the current altitude'), 'kg/m³'],
    beta: ['\\beta', N('ballistic coefficient m/(C_D·A): heavy and slim = high β, light and broad = low β'), 'kg/m²'],
    gammaE: ['\\gamma', N('flight-path angle, negative when descending'), N('rad or °')],
    LD: ['L/D', N('lift-to-drag ratio (Apollo: 0.3)'), '—'],
    sigma: ['\\sigma', N('bank angle: 0° lift points up, 180° lift points down'), N('rad or °')],
    hdot: ['\\dot h', N('climb rate (negative = descending)'), 'm/s'],
    amax: ['a_{max}', N('peak deceleration'), 'm/s²'],
    vE: ['v_E', N('speed at entry interface (122 km)'), 'm/s'],
    gE: ['\\gamma_E', N('flight-path angle at entry interface; |γ_E| means its absolute value (drop the minus sign)'), N('rad or °')],
    euler: ['e', N('Euler’s number 2.718… (here e is NOT the eccentricity)'), '—'],
    H: ['H', N('scale height: air density drops by a factor e every H (7.2 km)'), 'm'],
    rhostar: ['\\rho^*', N('air density where deceleration peaks'), 'kg/m³'],
    qdot: ['\\dot q', N('heat flux: heating power per square metre of heat shield'), 'W/m²'],
    k: ['k', N('empirical constant for Earth’s air, 1.74 × 10⁻⁴'), 'SI'],
    rn: ['r_n', N('nose radius of the heat shield (Apollo: 4.7 m)'), 'm'],
  };

  const Sym = { GREEK, SYM };

  /* "where:" legend. Items are SYM keys or custom [tex, meaning, unit] triples. Meanings, word units and the
     note are English (marked with N) and translated here, at render time. Symbolic units (m/s, kg…) are only
     translated when the dictionary has them, so they do not pollute I18N.missing. */
  const unitT = (u) => (window.I18N && I18N.lang !== 'en' && Object.prototype.hasOwnProperty.call(I18N.dicts[I18N.lang] || {}, u) ? T(u) : u);
  Sym.where = (items, note) => {
    const rows = items.map((it) => (typeof it === 'string' ? SYM[it] : it)).filter(Boolean);
    return `<dl class="where"><span class="where-h">${T`where`}</span>${rows.map(([tex, txt, unit]) =>
      `<dt>\\(${tex}\\)</dt><dd>${T(txt)}${unit ? ` <span class="unit">${unitT(unit)}</span>` : ''}</dd>`).join('')}${note ? `<p class="where-note">${Array.isArray(note) ? T(...note) : T(note)}</p>` : ''}</dl>`;
  };

  /* ---------- TeX pre-filter: wrap Greek letters so MathJax tags them with a class ---------- */
  const TEX_RE = /\\(alpha|beta|gamma|Gamma|delta|Delta|varepsilon|epsilon|eta|theta|lambda|mu|nu|pi|rho|sigma|Sigma|sum|tau|phi|varphi|omega|Omega|infty|oplus|int)(?![a-zA-Z])/g;
  Sym.texFilter = (tex) => (window.I18N && I18N.decimalComma() ? tex.replace(/(\d),(\d)/g, '$1{,}$2') : tex).replace(TEX_RE, (m0, name) => `{\\class{gk-${name}}{\\${name}}}`).replace(/☾/g, '{\\class{gk-moon}{☾}}');

  /* ---------- HTML text: wrap Greek characters in <abbr data-gk> ---------- */
  const CHARS = Object.keys(BY_CHAR).join('');
  const CHAR_RE = new RegExp(`[${CHARS}]`, 'g');
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'MJX-CONTAINER', 'ABBR', 'CANVAS', 'BUTTON']);
  function wrapText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        CHAR_RE.lastIndex = 0;
        if (!CHAR_RE.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentNode; p && p !== root.parentNode; p = p.parentNode) if (SKIP.has(p.nodeName) || p.classList?.contains('where') && p.nodeName === 'DT') return NodeFilter.FILTER_REJECT;
        // unprocessed TeX is left to MathJax
        if (/\\\(|\\\[/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      let last = 0;
      n.nodeValue.replace(CHAR_RE, (ch, i) => {
        if (i > last) frag.appendChild(document.createTextNode(n.nodeValue.slice(last, i)));
        const a = document.createElement('abbr');
        a.className = 'gk'; a.dataset.gk = BY_CHAR[ch]; a.textContent = ch;
        frag.appendChild(a);
        last = i + 1;
        return ch;
      });
      if (last < n.nodeValue.length) frag.appendChild(document.createTextNode(n.nodeValue.slice(last)));
      n.parentNode.replaceChild(frag, n);
    }
  }
  Sym.observe = (root) => {
    wrapText(root);
    const mo = new MutationObserver((muts) => {
      mo.disconnect();
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1) wrapText(n);
        else if (n.nodeType === 3 && n.parentNode) wrapText(n.parentNode);
      }
      mo.observe(root, { childList: true, subtree: true });
    });
    mo.observe(root, { childList: true, subtree: true });
  };

  /* SVG only catches the pointer on a glyph's painted strokes, so give each tagged letter an
     invisible padded rectangle covering its bounding box. Units are MathJax's (1000 per em). */
  Sym.hitAreas = (root) => {
    root.querySelectorAll('mjx-container g[class*="gk-"]:not([data-hit])').forEach((g) => {
      let b;
      try { b = g.getBBox(); } catch (e) { return; }
      if (!b.width && !b.height) return;
      const pad = 220;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', b.x - pad); r.setAttribute('y', b.y - pad);
      r.setAttribute('width', b.width + 2 * pad); r.setAttribute('height', b.height + 2 * pad);
      r.setAttribute('style', 'fill: transparent; stroke: none; pointer-events: all');
      g.insertBefore(r, g.firstChild);
      g.dataset.hit = '1';
    });
  };

  /* ---------- the tooltip ---------- */
  let tip = null, current = null;
  const keyOf = (el) => {
    if (el.dataset && el.dataset.gk) return el.dataset.gk;
    const c = el.getAttribute && el.getAttribute('class');
    const m = c && c.match(/gk-(\w+)/);
    return m && m[1];
  };
  const findTarget = (t) => (t && t.closest ? t.closest('abbr.gk, [class*="gk-"]') : null);
  function show(el) {
    const k = keyOf(el), g = GREEK[k];
    if (!g) return;
    if (!tip) { tip = document.createElement('div'); tip.className = 'gk-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.innerHTML = `<b>${g.ch}</b> <span class="nm">${T(g.name)}</span>${g.say ? ` <span class="say">${T(g.say)}</span>` : ''}<br>${T(g.use)}`;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const tw = Math.min(300, window.innerWidth - 24);
    tip.style.maxWidth = tw + 'px';
    const x = Math.max(12, Math.min(window.innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
    tip.style.left = x + 'px';
    const below = r.bottom + 8;
    tip.style.top = (below + 90 > window.innerHeight ? Math.max(8, r.top - tip.offsetHeight - 8) : below) + 'px';
    current = el;
  }
  function hide() { if (tip) tip.hidden = true; current = null; }
  document.addEventListener('pointerover', (e) => {
    // equations that were hidden when typeset (closed refreshers, solutions) get their hit areas on first approach
    const mc = e.target.closest && e.target.closest('mjx-container');
    if (mc && mc.querySelector('g[class*="gk-"]:not([data-hit])')) Sym.hitAreas(mc);
    if (e.pointerType === 'touch') return;
    const t = findTarget(e.target); if (t) show(t); else if (current) hide();
  });
  document.addEventListener('click', (e) => { const t = findTarget(e.target); if (t) { if (current === t) hide(); else show(t); } else if (current) hide(); });
  window.addEventListener('scroll', hide, { passive: true });

  window.Sym = Sym;
})();
