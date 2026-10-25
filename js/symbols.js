/* Symbol dictionary: Greek-letter tooltips and the "where:" legends under equations.
   Written for readers who know algebra and vectors but are rusty on calculus notation. */
(function () {
  'use strict';

  /* ---------- Greek letters and special signs (tooltips) ---------- */
  const GREEK = {
    alpha: { ch: 'α', name: 'alpha', say: 'AL-fa', use: 'an angle: the steering angle between thrust and velocity (ascent), or the lead angle (rendezvous)' },
    beta: { ch: 'β', name: 'beta', say: 'BAY-ta', use: 'ballistic coefficient m/(C_D·A), in kg/m² (entry)' },
    gamma: { ch: 'γ', name: 'gamma', say: 'GAM-a', use: 'flight-path angle in ascent and entry: angle of the velocity above the local horizontal (negative when descending)' },
    Gamma: { ch: 'Γ', name: 'capital gamma', say: 'GAM-a', use: 'not used in this course' },
    delta: { ch: 'δ', name: 'delta', say: 'DEL-ta', use: 'a small change' },
    Delta: { ch: 'Δ', name: 'capital delta', say: 'DEL-ta', use: '“change in”: Δv is a change of velocity in m/s, Δi a change of inclination' },
    varepsilon: { ch: 'ε', name: 'epsilon', say: 'EP-si-lon', use: 'specific mechanical energy: orbital energy per kilogram, in J/kg (= m²/s²)' },
    epsilon: { ch: 'ϵ', name: 'epsilon', say: 'EP-si-lon', use: 'specific mechanical energy, in J/kg' },
    eta: { ch: 'η', name: 'eta', say: 'AY-ta', use: 'efficiency (not used here)' },
    theta: { ch: 'θ', name: 'theta', say: 'THAY-ta', use: 'a generic angle' },
    lambda: { ch: 'λ', name: 'lambda', say: 'LAM-da', use: 'longitude or wavelength (not used here)' },
    mu: { ch: 'μ', name: 'mu', say: '“mew”', use: 'gravitational parameter μ = G·M of the central body, in m³/s² (Earth: 3.986 × 10¹⁴)' },
    nu: { ch: 'ν', name: 'nu', say: '“new”', use: 'true anomaly: the angle from periapsis to the spacecraft, seen from the planet’s centre' },
    pi: { ch: 'π', name: 'pi', say: '“pie”', use: '3.14159…; π radians = 180°, half a turn' },
    rho: { ch: 'ρ', name: 'rho', say: '“row”', use: 'air density, in kg/m³ (1.225 at sea level)' },
    sigma: { ch: 'σ', name: 'sigma', say: 'SIG-ma', use: 'bank angle of the capsule during entry (0° = lift up, 180° = lift down)' },
    Sigma: { ch: 'Σ', name: 'capital sigma', say: 'SIG-ma', use: '“sum of”: add the terms together, one per value of the index below it' },
    sum: { ch: 'Σ', name: 'capital sigma (sum)', say: 'SIG-ma', use: '“sum of”: add up the expression for every value of the index written below it (e.g. each stage k)' },
    tau: { ch: 'τ', name: 'tau', say: '“taw”', use: 'a time constant (not used here)' },
    phi: { ch: 'φ', name: 'phi', say: '“fye” or “fee”', use: 'flight-path angle in the orbit chapters (BMW convention); latitude in the Earth-rotation formula' },
    varphi: { ch: 'ϕ', name: 'phi', say: '“fye” or “fee”', use: 'flight-path angle, or latitude' },
    omega: { ch: 'ω', name: 'omega', say: 'oh-MAY-ga', use: 'angular velocity, in rad/s: how fast something turns (ω⊕ = Earth’s rotation)' },
    Omega: { ch: 'Ω', name: 'capital omega', say: 'oh-MAY-ga', use: 'right ascension of the ascending node: where the orbit plane crosses the equator' },
    infty: { ch: '∞', name: 'infinity', say: '', use: 'v∞ is the speed left over “at infinity”, far from the body: the hyperbolic excess speed' },
    oplus: { ch: '⊕', name: 'Earth symbol', say: '', use: 'astronomical symbol for Earth: R⊕ is Earth’s radius, μ⊕ its gravitational parameter' },
    moon: { ch: '☾', name: 'Moon symbol', say: '', use: 'astronomical symbol for the Moon: g☾ is lunar gravity, μ☾ its gravitational parameter' },
    int: { ch: '∫', name: 'integral sign', say: '', use: '“add up over time”: ∫ x dt is the total of x accumulated second by second, like summing x × (small time step) along the whole flight' },
  };
  const BY_CHAR = {};
  for (const [k, g] of Object.entries(GREEK)) if (!BY_CHAR[g.ch]) BY_CHAR[g.ch] = k;
  BY_CHAR['ϕ'] = 'varphi'; BY_CHAR['ε'] = 'varepsilon'; BY_CHAR['Σ'] = 'Sigma';

  /* ---------- Variables for "where:" legends: [TeX, meaning, unit] ---------- */
  const SYM = {
    // mechanics
    F: ['F', 'force', 'N (newton = kg·m/s²)'],
    vecF: ['\\vec F', 'force vector (the arrow says it has a direction)', 'N'],
    m: ['m', 'mass of the object (small body, e.g. the spacecraft)', 'kg'],
    vecv: ['\\vec v', 'velocity vector: speed and direction', 'm/s'],
    veca: ['\\vec a', 'acceleration vector: how fast the velocity changes, per second', 'm/s²'],
    ddt: ['\\frac{d}{dt}', '“rate of change per second” of what follows (a derivative). d(mv)/dt = how fast momentum changes', ''],
    t: ['t', 'time', 's'],
    G: ['G', 'universal gravitational constant, 6.674 × 10⁻¹¹', 'N·m²/kg²'],
    M: ['M', 'mass of the large body (Earth: 5.972 × 10²⁴ kg)', 'kg'],
    Fg: ['F_g', 'gravitational force between the two bodies', 'N'],
    r: ['r', 'distance from the centre of the planet (radius + altitude, not the altitude alone)', 'm'],
    mu: ['\\mu', 'gravitational parameter G·M of the central body. Earth: 3.986 × 10¹⁴, Moon: 4.903 × 10¹²', 'm³/s²'],
    muE: ['\\mu_\\oplus', 'Earth’s gravitational parameter, 3.986 × 10¹⁴ m³/s² (398 600 km³/s²)', 'm³/s²'],
    muM: ['\\mu_☾', 'the Moon’s gravitational parameter, 4.903 × 10¹² m³/s² (4 903 km³/s²)', 'm³/s²'],
    gr: ['g(r)', 'gravitational acceleration at distance r from the centre', 'm/s²'],
    g: ['g', 'local gravitational acceleration μ/r² (9.81 m/s² at the surface, less higher up)', 'm/s²'],
    g0: ['g_0', 'standard gravity at Earth’s surface, 9.806 65 (a fixed constant, even on the Moon)', 'm/s²'],
    gM: ['g_☾', 'gravity on the Moon’s surface, 1.62', 'm/s²'],
    RE: ['R_\\oplus', 'Earth’s radius, 6 378 km', 'm'],
    v: ['v', 'speed (length of the velocity vector)', 'm/s'],
    vcirc: ['v_{\\text{circ}}', 'circular orbital speed at distance r', 'm/s'],
    vesc: ['v_{\\text{esc}}', 'escape speed at distance r', 'm/s'],
    ke: ['\\tfrac12 v^2', 'kinetic energy per kilogram', 'J/kg'],
    pe: ['\\mu/r', 'depth of the gravity well at r: the energy per kilogram needed to climb out of it', 'J/kg'],
    vecr: ['\\vec r', 'position vector from the planet’s centre to the spacecraft', 'm'],
    rddot: ['\\ddot{\\vec r}', 'acceleration of the spacecraft. Two dots = rate of change of the rate of change of position (second derivative over time)', 'm/s²'],
    // orbits
    eps: ['\\varepsilon', 'specific mechanical energy: kinetic + potential energy per kilogram. Negative = bound orbit', 'J/kg = m²/s²'],
    vech: ['\\vec h', 'specific angular momentum vector, perpendicular to the orbit plane', 'm²/s'],
    h: ['h', 'specific angular momentum (length of h⃗): r·v·cos φ, constant along the orbit', 'm²/s'],
    cross: ['\\times', 'cross product: a vector perpendicular to both, with length r·v·sin(angle between them)', ''],
    phi: ['\\phi', 'flight-path angle: angle of the velocity above the local horizontal (0 at periapsis and apoapsis)', 'rad or °'],
    p: ['p', 'semi-latus rectum (“parameter”): the distance r when ν = 90°; sets the orbit’s width', 'm'],
    e: ['e', 'eccentricity (no unit): 0 circle, between 0 and 1 ellipse, 1 parabola, above 1 hyperbola', '—'],
    nu: ['\\nu', 'true anomaly: angle from periapsis to the spacecraft, seen from the planet’s centre', 'rad or °'],
    a: ['a', 'semi-major axis: half the longest diameter of the ellipse. Sets the energy and the period', 'm'],
    rp: ['r_p', 'periapsis radius: closest distance to the centre (perigee for Earth)', 'm'],
    ra: ['r_a', 'apoapsis radius: farthest distance from the centre (apogee for Earth)', 'm'],
    T: ['T', 'orbital period: time for one full orbit', 's'],
    n: ['n', 'mean motion: the average angular rate 2π/T', 'rad/s'],
    Mm: ['M', 'mean anomaly: an imaginary angle that grows at a perfectly steady rate (here M is not a mass)', 'rad'],
    tp: ['t_p', 'time when the spacecraft passed periapsis', 's'],
    E: ['E', 'eccentric anomaly: angle measured from the ellipse’s centre on a circle of radius a (a helper angle)', 'rad'],
    tan: ['\\tan', 'tangent function (calculator: tan; set to radians or degrees consistently)', ''],
    // rockets
    Fth: ['F', 'thrust force of the engine', 'N'],
    mdot: ['\\dot m', 'mass flow rate: kilograms of propellant burned per second. A dot on top means “per second”', 'kg/s'],
    ve: ['v_e', 'exhaust gas speed at the nozzle exit, relative to the rocket', 'm/s'],
    pexit: ['p_e', 'pressure of the exhaust at the nozzle exit', 'Pa'],
    pa: ['p_a', 'pressure of the surrounding air (101 325 Pa at sea level, 0 in vacuum)', 'Pa'],
    Ae: ['A_e', 'area of the nozzle exit', 'm²'],
    isp: ['I_{sp}', 'specific impulse: seconds that 1 kg of propellant can push with 1 kg-force. Higher is better', 's'],
    c: ['c', 'effective exhaust velocity F/ṁ = I_sp·g₀', 'm/s'],
    dv: ['\\Delta v', 'velocity change the burn can give (“delta-v”)', 'm/s'],
    ln: ['\\ln', 'natural logarithm (the “ln” key). ln 1 = 0, ln 2 ≈ 0.69, ln 10 ≈ 2.30: it grows very slowly', ''],
    m0: ['m_0', 'initial mass, tanks full', 'kg'],
    mf: ['m_f', 'final mass, propellant used up', 'kg'],
    sumk: ['\\sum_k', 'add up the expression for each stage k = 1, 2, 3…', ''],
    m0k: ['m_{0,k}', 'mass when stage k ignites, including all stages above it and the payload', 'kg'],
    mfk: ['m_{f,k}', 'mass when stage k burns out, before it is dropped', 'kg'],
    ispk: ['I_{sp,k}', 'specific impulse of stage k', 's'],
    // ascent
    vorbit: ['v_{orbit}', 'speed needed in the target orbit (7.79 km/s at 185 km)', 'm/s'],
    integral: ['\\int \\ldots dt', '“add up over the whole ascent”: each second of flight adds (the expression) × 1 s to the total', ''],
    gamma: ['\\gamma', 'flight-path angle: 90° climbing straight up, 0° flying horizontally', 'rad or °'],
    D: ['D', 'aerodynamic drag force', 'N'],
    alpha: ['\\alpha', 'angle between where the engine points and where the rocket is going', 'rad or °'],
    vrot: ['v_{rotation}', 'speed given for free by Earth’s rotation (408 m/s at Cape Canaveral, launching east)', 'm/s'],
    gammadot: ['\\dot\\gamma', 'how fast the flight-path angle changes, per second (the path curving down)', 'rad/s'],
    // manoeuvres
    at: ['a_t', 'semi-major axis of the transfer ellipse', 'm'],
    r1: ['r_1', 'radius of the starting circular orbit (from the centre)', 'm'],
    r2: ['r_2', 'radius of the final circular orbit', 'm'],
    dv1: ['\\Delta v_1', 'first burn: leave the starting orbit onto the transfer ellipse', 'm/s'],
    dv2: ['\\Delta v_2', 'second burn: from the transfer ellipse into the final orbit', 'm/s'],
    tof: ['\\mathrm{TOF}', 'time of flight: duration of the transfer (half a transfer orbit)', 's'],
    pi: ['\\pi', '3.14159…; half a turn in radians (180°)', ''],
    dvplane: ['\\Delta v_{plane}', 'cost of tilting the orbit', 'm/s'],
    di: ['\\Delta i', 'change of inclination: angle between the old and new orbit planes', 'rad or °'],
    vi: ['v_i', 'speed before the burn', 'm/s'],
    vf: ['v_f', 'speed after the burn', 'm/s'],
    alead: ['\\alpha_{lead}', 'lead angle: how far ahead the target must be when the chaser starts its transfer', 'rad or °'],
    wtgt: ['\\omega_{tgt}', 'angular velocity of the target on its orbit, √(μ/r₂³)', 'rad/s'],
    // moon
    rsoi: ['r_{SOI}', 'radius of the sphere of influence: the zone where the smaller body’s gravity dominates', 'm'],
    Dem: ['D', 'distance between the two bodies (Earth–Moon: 384 400 km)', 'm'],
    mM: ['m_☾', 'mass of the Moon (7.35 × 10²² kg)', 'kg'],
    mE: ['m_\\oplus', 'mass of the Earth (5.97 × 10²⁴ kg). The ratio is 0.0123', 'kg'],
    vp: ['v_p', 'speed at periapsis', 'm/s'],
    rpT: ['r_p', 'perigee radius = parking orbit radius (6 378 + 185 = 6 563 km)', 'm'],
    raT: ['r_a', 'apogee radius, out at the Moon’s distance (≈ 384 400 km)', 'm'],
    dvtli: ['\\Delta v_{TLI}', 'trans-lunar injection burn', 'm/s'],
    vinf: ['v_\\infty', 'hyperbolic excess speed: speed relative to the Moon on arrival, before its gravity speeds you up', 'm/s'],
    rpM: ['r_p', 'periselene radius: closest distance to the Moon’s centre', 'm'],
    dvloi: ['\\Delta v_{LOI}', 'lunar orbit insertion burn (braking)', 'm/s'],
    // landing
    thover: ['t_{hover}', 'how long the lander can hover', 's'],
    m0h: ['m_0', 'mass when hovering starts', 'kg'],
    mprop: ['m_{prop}', 'propellant available for hovering', 'kg'],
    // entry
    vdot: ['\\dot v', 'how fast the speed changes, per second (negative = slowing down)', 'm/s²'],
    rho: ['\\rho', 'air density at the current altitude', 'kg/m³'],
    beta: ['\\beta', 'ballistic coefficient m/(C_D·A): heavy and slim = high β, light and broad = low β', 'kg/m²'],
    gammaE: ['\\gamma', 'flight-path angle, negative when descending', 'rad or °'],
    LD: ['L/D', 'lift-to-drag ratio (Apollo: 0.3)', '—'],
    sigma: ['\\sigma', 'bank angle: 0° lift points up, 180° lift points down', 'rad or °'],
    hdot: ['\\dot h', 'climb rate (negative = descending)', 'm/s'],
    amax: ['a_{max}', 'peak deceleration', 'm/s²'],
    vE: ['v_E', 'speed at entry interface (122 km)', 'm/s'],
    gE: ['\\gamma_E', 'flight-path angle at entry interface; |γ_E| means its absolute value (drop the minus sign)', 'rad or °'],
    euler: ['e', 'Euler’s number 2.718… (here e is NOT the eccentricity)', '—'],
    H: ['H', 'scale height: air density drops by a factor e every H (7.2 km)', 'm'],
    rhostar: ['\\rho^*', 'air density where deceleration peaks', 'kg/m³'],
    qdot: ['\\dot q', 'heat flux: heating power per square metre of heat shield', 'W/m²'],
    k: ['k', 'empirical constant for Earth’s air, 1.74 × 10⁻⁴', 'SI'],
    rn: ['r_n', 'nose radius of the heat shield (Apollo: 4.7 m)', 'm'],
  };

  const Sym = { GREEK, SYM };

  /* "where:" legend. Items are SYM keys or custom [tex, meaning, unit] triples. */
  Sym.where = (items, note) => {
    const rows = items.map((it) => (typeof it === 'string' ? SYM[it] : it)).filter(Boolean);
    return `<dl class="where"><span class="where-h">where</span>${rows.map(([tex, txt, unit]) =>
      `<dt>\\(${tex}\\)</dt><dd>${txt}${unit ? ` <span class="unit">${unit}</span>` : ''}</dd>`).join('')}${note ? `<p class="where-note">${note}</p>` : ''}</dl>`;
  };

  /* ---------- TeX pre-filter: wrap Greek letters so MathJax tags them with a class ---------- */
  const TEX_RE = /\\(alpha|beta|gamma|Gamma|delta|Delta|varepsilon|epsilon|eta|theta|lambda|mu|nu|pi|rho|sigma|Sigma|sum|tau|phi|varphi|omega|Omega|infty|oplus|int)(?![a-zA-Z])/g;
  Sym.texFilter = (tex) => tex.replace(TEX_RE, (m0, name) => `{\\class{gk-${name}}{\\${name}}}`).replace(/☾/g, '{\\class{gk-moon}{☾}}');

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
    tip.innerHTML = `<b>${g.ch}</b> <span class="nm">${g.name}</span>${g.say ? ` <span class="say">${g.say}</span>` : ''}<br>${g.use}`;
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
  document.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const t = findTarget(e.target); if (t) show(t); else if (current) hide(); });
  document.addEventListener('click', (e) => { const t = findTarget(e.target); if (t) { if (current === t) hide(); else show(t); } else if (current) hide(); });
  window.addEventListener('scroll', hide, { passive: true });

  window.Sym = Sym;
})();
