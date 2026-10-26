/* Astronaut Candidate Program: training modules, objectives, patches, briefings and debriefs.
   Progress lives in this browser only (localStorage). */
(function () {
  'use strict';

  // One training module per chapter. {name} is replaced by the candidate's callsign.
  const MODULES = {
    newton: {
      code: 'TM-1', name: 'Falling Around the World', topic: 'newton', glyph: 'cannon',
      briefing: 'Welcome to your first module, {name}. Before you touch a rocket you need to understand why things fall, and why an orbit is simply a fall that never hits the ground. Newton worked it out with a cannon on an impossibly tall mountain. Today you get to fire it.',
      objectives: [
        { id: 'orbit', text: 'Fire a cannonball into orbit around the Earth' },
        { id: 'escape', text: 'Fire one fast enough to escape Earth for good' },
        { id: 'qual', text: 'Qualify: answer 2 Newton & gravity problems correctly' },
      ],
      debrief: 'Good shooting, {name}. You now know the two numbers that rule spaceflight: circular speed and escape speed. Next you learn to read the shape of any orbit.',
    },
    orbits: {
      code: 'TM-2', name: 'Reading the Ellipse', topic: 'orbits', glyph: 'ellipse',
      briefing: 'In flight, Houston will read you numbers like “one-eleven by three-twelve”. A navigator must see the orbit in those numbers: its size, its shape, where you are on it and when you will be somewhere else. This module teaches you to.',
      objectives: [
        { id: 'circle', text: 'Design a circular orbit (eccentricity below 0.01) by hand' },
        { id: 'high', text: 'Design an orbit whose apogee reaches geostationary altitude (35 786 km)' },
        { id: 'qual', text: 'Qualify: answer 2 orbit problems correctly' },
      ],
      debrief: 'You read orbits like a flight dynamics officer now, {name}. Time to meet the machine that puts you on one.',
    },
    rockets: {
      code: 'TM-3', name: 'The Rocket Equation', topic: 'rockets', glyph: 'rocket',
      briefing: 'Every engineer on the program respects one equation more than any other. It explains why your rocket is 110 metres tall to send a 5-tonne capsule home, and why it falls apart into stages on the way up. Learn it well, {name}. It decides what is possible.',
      objectives: [
        { id: 'single', text: 'See for yourself why a single-stage Saturn V cannot reach orbit' },
        { id: 'grounded', text: 'Build a rocket too heavy for its first stage to leave the pad' },
        { id: 'heavy', text: 'Design a launcher that reaches the Moon (≥ 12.5 km/s) with at least 50 t, and still lifts off with TWR ≥ 1.1' },
        { id: 'qual', text: 'Qualify: answer 2 rocket-equation problems correctly' },
      ],
      debrief: 'You can size a rocket on the back of an envelope, {name}. Now ride one.',
    },
    ascent: {
      code: 'TM-4', name: 'Riding the Saturn V', topic: 'ascent', glyph: 'ascent',
      briefing: 'Eleven minutes and forty seconds. That is how long the ride to orbit lasts, and every second of it is a trade between climbing out of the air and turning sideways to build speed. You will fly the pitch-over yourself. Expect to lose a few rockets, {name}; that is what simulators are for.',
      objectives: [
        { id: 'fail', text: 'Lose a vehicle: find a pitch-over that ends in disaster' },
        { id: 'orbit', text: 'Fly your own launch into a stable parking orbit (perigee ≥ 150 km)' },
        { id: 'qual', text: 'Qualify: answer 2 launch problems correctly' },
      ],
      debrief: 'Parking orbit achieved, {name}. From here on, every change of path is a burn you plan.',
    },
    maneuvers: {
      code: 'TM-5', name: 'Changing Orbits', topic: 'maneuvers', glyph: 'transfer',
      briefing: 'In orbit, intuition lies. Speed up and you end up slower; to catch someone ahead, you brake. Your lunar module pilot will one day have to find the command module in lunar orbit with no second chance. Plan your transfers carefully, {name}.',
      objectives: [
        { id: 'geo', text: 'Plan LEO → GEO including the 28.5° plane change for under 4.3 km/s' },
        { id: 'lor', text: 'Plan the LM ascent-stage rendezvous with the CSM in lunar orbit' },
        { id: 'qual', text: 'Qualify: answer 2 manoeuvre problems correctly' },
      ],
      debrief: 'Transfers and rendezvous are second nature now, {name}. Next stop: the Moon.',
    },
    docking: {
      code: 'TM-6', name: 'Two Ships, One Line', topic: 'docking', glyph: 'docking',
      briefing: 'Three hours after launch, coasting away from Earth, your spacecraft must turn around and dock with the lunar module stowed on top of the spent rocket stage. After the landing you will do it again in lunar orbit, with no second chance. Your instinct says: point the noses at each other and push. Space will teach you otherwise, {name}.',
      objectives: [
        { id: 'tde', text: 'Complete transposition and docking with the LM' },
        { id: 'soft', text: 'Dock gently: contact at 10 cm/s or less' },
        { id: 'paradox', text: 'Live the Gemini 4 paradox: thrust straight at a target ahead and miss it' },
        { id: 'lunar', text: 'Dock with the ascent stage in lunar orbit' },
        { id: 'blind', text: 'Real mode: dock using only the COAS and the numbers for the last 30 m' },
        { id: 'qual', text: 'Qualify: answer 2 docking problems correctly' },
      ],
      debrief: 'Hard dock, {name}. You can now join two spacecraft into one. Next: the long coast to the Moon.',
    },
    moon: {
      code: 'TM-7', name: 'Translunar Navigation', topic: 'moon', glyph: 'figure8',
      briefing: 'Three days of coasting towards a target moving at a kilometre per second. Get the trans-lunar burn right and the Moon itself will swing you home if anything breaks, as it did for Apollo 13. Get it wrong by a tenth of a metre per second and you will need Mission Control. You are in Mission Control today, {name}.',
      objectives: [
        { id: 'free', text: 'Fly a free return that comes home inside the entry corridor' },
        { id: 'rescue', text: 'Rescue a bad trajectory with a midcourse correction' },
        { id: 'loi', text: 'Brake into lunar orbit with an LOI burn' },
        { id: 'qual', text: 'Qualify: answer 2 lunar trajectory problems correctly' },
      ],
      debrief: 'You navigated to the Moon and back, {name}. Now the hardest five hundred metres of the whole mission.',
    },
    landing: {
      code: 'TM-8', name: 'The Last 500 Metres', topic: 'landing', glyph: 'lander',
      briefing: 'The computer has brought you to low gate, but the landing site is a boulder field. You have the stick, sixty-odd seconds of propellant to spare and an alarm on the panel. Stay calm, {name}. Fly it like Neil did.',
      objectives: [
        { id: 'land', text: 'Land the Lunar Module safely' },
        { id: 'pad', text: 'Land on the pad with at least 30 s of hover propellant left' },
        { id: 'qual', text: 'Qualify: answer 2 landing problems correctly' },
      ],
      debrief: 'Contact light, {name}. One last test: getting home alive.',
    },
    entry: {
      code: 'TM-9', name: 'Threading the Corridor', topic: 'entry', glyph: 'capsule',
      briefing: 'You come home at 11 kilometres per second into a corridor two degrees wide. Too shallow and you skip off into space; too steep and the deceleration crushes you. The only control you have is which way the capsule’s lift points. Find the corridor, {name}.',
      objectives: [
        { id: 'skip', text: 'Find the overshoot boundary: make a capsule skip out' },
        { id: 'safe', text: 'Fly a lunar-return entry captured with a peak below 8 g' },
        { id: 'qual', text: 'Qualify: answer 2 re-entry problems correctly' },
      ],
      debrief: 'Splashdown, {name}. Welcome home.',
    },
  };
  const ORDER = Object.keys(MODULES);

  const load = () => UI.store.get('progress', { name: '', done: {} });
  let state = load();
  const save = () => UI.store.set('progress', state);
  const fill = (s) => s.replace(/\{name\}/g, Progress.callsign());

  const Progress = {
    MODULES, ORDER,
    callsign: () => (state.name ? state.name : 'Candidate'),
    setCallsign(n) { state.name = String(n || '').trim().slice(0, 24); save(); },
    isDone: (mod, id) => !!state.done[`${mod}.${id}`],
    count(mod) { const m = MODULES[mod]; return m ? m.objectives.filter((o) => Progress.isDone(mod, o.id)).length : 0; },
    complete(mod) { const m = MODULES[mod]; return !!m && Progress.count(mod) === m.objectives.length; },
    totals() { let d = 0, n = 0; for (const k of ORDER) { d += Progress.count(k); n += MODULES[k].objectives.length; } return { d, n, patches: ORDER.filter(Progress.complete).length }; },
    nextModule() { return ORDER.find((k) => !Progress.complete(k)) || null; },
    reset() { state = { name: state.name, done: {} }; save(); },

    // Mark an objective done. Safe to call repeatedly.
    done(mod, id) {
      const key = `${mod}.${id}`;
      if (state.done[key] || !MODULES[mod]) return;
      state.done[key] = Date.now(); save();
      const o = MODULES[mod].objectives.find((x) => x.id === id);
      toast(`<span><b>Objective complete</b>${o ? o.text : id}</span>`, 'obj');
      refreshChecklists();
      if (Progress.complete(mod)) {
        setTimeout(() => toast(`${patchSVG(mod, true, 54)}<span><b>Patch earned: ${MODULES[mod].code}</b>${MODULES[mod].name}</span>`, 'patch'), 700);
        if (Progress.totals().patches === ORDER.length) setTimeout(() => toast('<span><b>Training complete</b>You are GO for launch. See your certificate on the home page.</span>', 'patch'), 1600);
      }
    },
    // qualification objectives come from practice scores
    checkQual() {
      const s = UI.store.get('stats', {});
      for (const k of ORDER) if ((s[MODULES[k].topic]?.right || 0) >= 2) Progress.done(k, 'qual');
    },
  };

  /* ---------- toasts ---------- */
  let tray = null;
  function toast(html, kind) {
    if (!tray) { tray = document.createElement('div'); tray.className = 'toasts'; tray.setAttribute('aria-live', 'polite'); document.body.appendChild(tray); }
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = html;
    tray.appendChild(t);
    setTimeout(() => t.classList.add('out'), kind === 'patch' ? 5200 : 3800);
    setTimeout(() => t.remove(), kind === 'patch' ? 5800 : 4400);
  }
  Progress.toast = toast;

  /* ---------- patches (generated SVG) ---------- */
  const GLYPHS = {
    cannon: '<circle cx="0" cy="6" r="12" class="pg-fill"/><path d="M0 -6 C 14 -6 22 4 20 14 C 18 26 -18 26 -20 14 C -22 2 -12 -6 0 -6" class="pg-line"/><circle cx="0" cy="-6" r="2.4" class="pg-dot"/>',
    ellipse: '<ellipse cx="0" cy="4" rx="22" ry="13" class="pg-line"/><circle cx="-11" cy="4" r="5" class="pg-fill"/><circle cx="20" cy="-3" r="2.4" class="pg-dot"/>',
    rocket: '<path d="M0 -20 C 6 -12 6 4 5 14 L -5 14 C -6 4 -6 -12 0 -20 Z" class="pg-fill"/><path d="M-5 6 L-10 16 L-5 14 M5 6 L10 16 L5 14" class="pg-line"/><path d="M-3 16 L0 25 L3 16" class="pg-dot"/>',
    ascent: '<path d="M-24 22 A 60 60 0 0 1 24 22" class="pg-line" opacity=".4"/><path d="M-14 18 C -12 0 0 -12 22 -14" class="pg-line"/><circle cx="22" cy="-14" r="2.6" class="pg-dot"/>',
    transfer: '<circle cx="0" cy="4" r="9" class="pg-line"/><circle cx="0" cy="4" r="20" class="pg-line" opacity=".5"/><path d="M9 4 A 14.5 12 0 0 1 -20 4" class="pg-line pg-acc"/><circle cx="0" cy="4" r="3" class="pg-fill"/>',
    figure8: '<path d="M-18 4 C -8 -12 8 -12 14 0 C 20 12 24 12 24 4 C 24 -4 20 -4 14 8 C 8 20 -8 20 -18 4" class="pg-line"/><circle cx="-18" cy="4" r="5" class="pg-fill"/><circle cx="22" cy="4" r="3" class="pg-dot"/>',
    lander: '<rect x="-7" y="-10" width="14" height="9" class="pg-fill"/><rect x="-9" y="-1" width="18" height="7" class="pg-dot"/><path d="M-9 6 L-15 16 M9 6 L15 16 M-18 16 L-12 16 M12 16 L18 16" class="pg-line"/><path d="M-24 18 L24 18" class="pg-line" opacity=".5"/>',
    docking: '<path d="M-26 0 L-8 0 L-4 -6 L-4 6 L-8 0" class="pg-fill"/><rect x="-24" y="-7" width="16" height="14" class="pg-fill"/><path d="M-4 0 L2 0" class="pg-line pg-acc"/><path d="M4 -9 L4 9 M4 -6 L10 -6 M4 6 L10 6" class="pg-line"/><rect x="10" y="-9" width="14" height="18" class="pg-dot"/>',
    capsule: '<path d="M-6 -14 L6 -14 L14 8 L-14 8 Z" class="pg-fill"/><path d="M-16 12 A 30 12 0 0 0 16 12" class="pg-line pg-acc"/><path d="M-12 18 A 26 12 0 0 0 12 18" class="pg-line pg-acc" opacity=".6"/>',
  };
  function patchSVG(mod, earned, size = 96) {
    const m = MODULES[mod];
    const idx = ORDER.indexOf(mod) + 1;
    return `<svg class="patch ${earned ? 'earned' : 'locked'}" viewBox="-50 -50 100 100" width="${size}" height="${size}" role="img" aria-label="${m.code} ${m.name} patch${earned ? '' : ' (not yet earned)'}">
      <circle r="47" class="pt-bg"/><circle r="47" class="pt-ring"/><circle r="40" class="pt-inner"/>
      <g transform="translate(0,-4) scale(1.05)">${GLYPHS[m.glyph]}</g>
      <text y="-27" class="pt-code">${m.code}</text>
      <text y="36" class="pt-num">${'★'.repeat(Math.min(3, Math.ceil(idx / 3)))}</text>
    </svg>`;
  }
  Progress.patchSVG = patchSVG;

  /* ---------- briefing and debrief panels ---------- */
  function checklist(mod) {
    return MODULES[mod].objectives.map((o) => `<li data-obj="${mod}.${o.id}" class="${Progress.isDone(mod, o.id) ? 'done' : ''}"><span class="box" aria-hidden="true"></span>${o.text}</li>`).join('');
  }
  function refreshChecklists() {
    if (window.App && App.refreshRail) App.refreshRail();
    document.querySelectorAll('[data-obj]').forEach((li) => {
      const [m, id] = li.dataset.obj.split('.');
      li.classList.toggle('done', Progress.isDone(m, id));
    });
    document.querySelectorAll('[data-patch-of]').forEach((el) => {
      const m = el.dataset.patchOf; el.innerHTML = patchSVG(m, Progress.complete(m), +el.dataset.size || 72);
    });
  }

  Progress.briefing = (mod, opts = {}) => {
    const m = MODULES[mod];
    if (!m) return '';
    const choices = [
      opts.theory && `<a class="choice" href="#${opts.theory}" data-jump="${opts.theory}"><b>Read the theory first</b><span>The steady route: equations, history, then the simulator.</span></a>`,
      opts.lab && `<a class="choice" href="#${opts.lab}" data-jump="${opts.lab}"><b>Straight to the simulator</b><span>Learn by doing, then come back for the why.</span></a>`,
      opts.math && `<a class="choice" href="#${opts.math}" data-jump="${opts.math}" data-open="1"><b>Refresh the math first</b><span>${opts.mathLabel || 'A quick ground-school refresher.'}</span></a>`,
    ].filter(Boolean).join('');
    return `
      <aside class="briefing" aria-label="Mission briefing">
        <div class="brief-head">
          <span class="avatar" aria-hidden="true">V</span>
          <div><span class="eyebrow">Training module ${m.code} · briefing</span><b class="brief-title">${m.name}</b></div>
          <div class="brief-patch" data-patch-of="${mod}" data-size="64">${patchSVG(mod, Progress.complete(mod), 64)}</div>
        </div>
        <p class="brief-text">${fill(m.briefing)}</p>
        <p class="brief-sign">Vega, Chief Flight Instructor</p>
        <h3 class="brief-h">Objectives</h3>
        <ul class="objectives">${checklist(mod)}</ul>
        ${choices ? `<h3 class="brief-h">How do you want to start?</h3><div class="choices">${choices}</div>` : ''}
      </aside>`;
  };

  Progress.debrief = (mod, opts = {}) => {
    const m = MODULES[mod], i = ORDER.indexOf(mod), next = ORDER[i + 1];
    const nc = next && App.chapters[next];
    return `
      <aside class="debrief" aria-label="Debrief">
        <span class="eyebrow">${m.code} · debrief</span>
        <p class="brief-text">${fill(m.debrief)}</p>
        <ul class="objectives compact">${checklist(mod)}</ul>
        <h3 class="brief-h">Where to now?</h3>
        <div class="choices">
          ${nc ? `<a class="choice primary" href="#${next}"><b>Report to ${MODULES[next].code}: ${MODULES[next].name}</b><span>${nc.blurb || ''}</span></a>` : `<a class="choice primary" href="#home"><b>Return to base</b><span>Collect your certificate on the home page.</span></a>`}
          <a class="choice" href="#practice" data-topic="${m.topic}"><b>Sit the qualification exam</b><span>Problems on ${Practice.TOPICS[m.topic]}, fresh numbers every time.</span></a>
          ${opts.math ? `<a class="choice" href="#toolkit" data-primer="${opts.math}"><b>Back to ground school</b><span>${opts.mathLabel || 'Review the math behind this module.'}</span></a>` : ''}
        </div>
      </aside>`;
  };

  // in-page jumps from briefing choices; topic preselection for the exam; primer deep links
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a.choice');
    if (!a) return;
    if (a.dataset.jump) {
      e.preventDefault();
      const el = document.getElementById(a.dataset.jump);
      if (!el) return;
      if (a.dataset.open && el.tagName === 'DETAILS') el.open = true;
      el.scrollIntoView({ behavior: UI.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    if (a.dataset.topic) UI.store.set('ptopic', a.dataset.topic);
    if (a.dataset.primer) App.pendingFocus = 'primer-' + a.dataset.primer;
  });

  window.Progress = Progress;
})();
