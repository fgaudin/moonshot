/* Astronaut Candidate Program: training modules, objectives, patches, briefings and debriefs.
   Progress lives in this browser only (localStorage). */
(function () {
  'use strict';

  // One training module per chapter. {name} is replaced by the candidate's callsign.
  // Texts are marked with N and translated with T where they are displayed.
  const MODULES = {
    newton: {
      name: N`Falling Around the World`, topic: 'newton', glyph: 'cannon',
      briefing: N`Welcome to your first module, {name}. NASA calls its trainees ASCANs, short for astronaut candidates, and that is what you are until every patch is earned. Isaac Newton published the physics of spaceflight in 1687: every trajectory in this manual, Apollo’s included, is his second law applied to his law of gravitation. He explained why an orbit is a fall that never hits the ground with a cannon on an impossibly tall mountain. Today you get to fire it.`,
      objectives: [
        { id: 'orbit', text: N`Fire a cannonball into orbit around the Earth` },
        { id: 'escape', text: N`Fire one fast enough to escape Earth for good` },
        { id: 'qual', text: N`Qualify: answer 2 Newton & gravity problems correctly` },
      ],
      debrief: N`Good shooting. You now know the two numbers that rule spaceflight: circular speed and escape speed. Next you learn to read the shape of any orbit.`,
    },
    orbits: {
      name: N`Reading the Ellipse`, topic: 'orbits', glyph: 'ellipse',
      briefing: N`In flight, Houston will read you numbers like “one-eleven by three-twelve”. A navigator must see the orbit in them. The two-body problem has an exact answer, the conic sections: energy fixes the orbit’s size, angular momentum its shape, and Kepler’s equation tells you where you will be and when.`,
      objectives: [
        { id: 'circle', text: N`Design a circular orbit (eccentricity below 0.01) by hand` },
        { id: 'high', text: N`Design an orbit whose apogee reaches geostationary altitude (35 786 km, where a circular orbit keeps pace with the Earth’s rotation)` },
        { id: 'qual', text: N`Qualify: answer 2 orbit problems correctly` },
      ],
      debrief: N`You read orbits like a flight dynamics officer now. Next: finding your own orbit from the instruments on board.`,
    },
    rockets: {
      name: N`The Rocket Equation`, topic: 'rockets', glyph: 'rocket',
      briefing: N`A rocket is a machine for throwing mass backward very fast, and one equation rules it. It explains why your rocket is 110 metres tall to send a 5-tonne capsule home, and why it falls apart into stages on the way up. Every engineer on the program respects it more than any other. Learn it well: it decides what is possible.`,
      objectives: [
        { id: 'single', text: N`See for yourself why a single-stage Saturn V cannot reach orbit` },
        { id: 'grounded', text: N`Build a rocket too heavy for its first stage to leave the pad` },
        { id: 'heavy', text: N`Design a launcher that reaches the Moon (≥ 12.5 km/s) with at least 50 t, and still lifts off with TWR ≥ 1.1` },
        { id: 'qual', text: N`Qualify: answer 2 rocket-equation problems correctly` },
      ],
      debrief: N`You can size a rocket on the back of an envelope. Before you ride one, you need to know the air it climbs through.`,
    },
    ascent: {
      name: N`Riding the Saturn V`, topic: 'ascent', glyph: 'ascent',
      briefing: N`Orbit is a matter of speed: 185 km up, 7.8 km/s sideways. The ride takes eleven minutes and forty seconds, and every second of it trades climbing out of the air against turning sideways to build speed. You will fly the pitch-over yourself. Expect to lose a few rockets, {name}; that is what simulators are for.`,
      objectives: [
        { id: 'fail', text: N`Lose a vehicle: find a pitch-over that ends in disaster` },
        { id: 'orbit', text: N`Fly your own launch into a stable parking orbit (perigee ≥ 150 km)` },
        { id: 'qual', text: N`Qualify: answer 2 launch problems correctly` },
      ],
      debrief: N`Parking orbit achieved. Next you write the pitch program of a new launcher yourself.`,
    },
    maneuvers: {
      name: N`Changing Orbits`, topic: 'maneuvers', glyph: 'transfer',
      briefing: N`A burn changes your velocity at one point, and the whole orbit through that point changes with it. In orbit, intuition lies: speed up and you end up slower; to catch someone ahead, you brake. One day your lunar module pilot will have to find the command module in lunar orbit, with no second chance. Plan your transfers carefully.`,
      objectives: [
        { id: 'geo', text: N`Compute by hand the total Δv of a transfer from low Earth orbit (LEO) to geostationary orbit (GEO), including the 28.5° plane change, for a plan under 4.4 km/s` },
        { id: 'lor', text: N`Compute by hand the phase angle for the LM ascent-stage rendezvous with the CSM in lunar orbit` },
        { id: 'qual', text: N`Qualify: answer 2 manoeuvre problems correctly` },
      ],
      debrief: N`Transfers and rendezvous are second nature now. Next: turning a transfer into numbers a crew can fly.`,
    },
    burns: {
      name: N`When, How Much, Which Way`, topic: 'burns', glyph: 'node',
      briefing: N`Mission Control computes, the crew executes. Between them travels a short list of numbers, read up by the capsule communicator and keyed in by the crew: when to ignite, how much velocity to add in which direction, and how long the engine runs. Get one of them wrong and the flight goes wrong. You will work both ends of that loop.`,
      objectives: [
        { id: 'circ', text: N`Circularize a 200 × 1 000 km orbit at 1 000 km` },
        { id: 'hohmann', text: N`Fly a two-burn Hohmann transfer to a circular 2 000 km orbit` },
        { id: 'radial', text: N`Fly a radial burn of at least 500 m/s and see what it does to the orbit` },
        { id: 'long', text: N`With the small 8 kN stage, reach an apoapsis of 5 000 km (± 100 km) in one burn` },
        { id: 'qual', text: N`Qualify: answer 2 burn-planning problems correctly` },
      ],
      debrief: N`You can plan a burn and fly it. From here on, every burn of the mission is just another PAD. Next: when to fire it.`,
    },
    docking: {
      name: N`Two Ships, One Line`, topic: 'docking', glyph: 'docking',
      briefing: N`Rendezvous brings two spacecraft within a few hundred metres. Docking closes the last gap. Three hours after launch, your spacecraft must turn around and dock with the lunar module stowed on top of the spent rocket stage; after the landing you do it again in lunar orbit, with no second chance. Your instinct says: point the noses at each other and push. Orbital mechanics still has a say.`,
      objectives: [
        { id: 'tde', text: N`Complete transposition and docking with the LM` },
        { id: 'soft', text: N`Dock gently: contact at 10 cm/s or less` },
        { id: 'paradox', text: N`Live the Gemini 4 paradox: thrust straight at a target ahead and miss it` },
        { id: 'lunar', text: N`Dock with the ascent stage in lunar orbit` },
        { id: 'blind', text: N`Real mode: dock using only the COAS and the numbers for the last 30 m` },
        { id: 'terminal', text: N`Terminal phase: fly from 2 km to 100 m without exceeding the braking gates` },
        { id: 'qual', text: N`Qualify: answer 2 docking problems correctly` },
      ],
      debrief: N`Hard dock. You can now join two spacecraft into one. Next: the long coast to the Moon.`,
    },
    moon: {
      name: N`Translunar Navigation`, topic: 'moon', glyph: 'soi',
      briefing: N`A target three days away, moving at a kilometre per second, and two bodies pulling on you at once. No formula solves that exactly. Apollo’s planners cut the trip into pieces that each have a simple answer: an orbit around the Earth, a switch at the edge of the Moon’s sphere of influence, an orbit around the Moon. Plan the trip that way, aim it, and brake into lunar orbit.`,
      objectives: [
        { id: 'reach', text: N`Aim the TLI yourself to pass the Moon at an Apollo-like periselene, 100 to 300 km, and fly it to periselene` },
        { id: 'loi', text: N`Match Apollo 11’s first lunar orbit: brake into an orbit with its low point at 100–130 km and its high point at 280–340 km, and fly it through the LOI burn` },
        { id: 'qual', text: N`Qualify: answer 2 lunar trajectory problems correctly` },
      ],
      debrief: N`You can plan a trip to the Moon, aim it and brake into orbit. Next: the trajectory that brings you home on its own if the engine dies.`,
    },
    landing: {
      name: N`The Last 500 Metres`, topic: 'landing', glyph: 'lander',
      briefing: N`Twelve and a half minutes from 15 km and 1.7 km/s to standstill, paid for with 2 km/s of Δv. The computer has brought you down to 500 m, but the landing site is a boulder field. You have the stick, about two minutes of propellant and an alarm on the panel. Stay calm, {name}. Fly it like Neil did.`,
      objectives: [
        { id: 'land', text: N`Land the Lunar Module safely` },
        { id: 'pad', text: N`Land on the pad with at least 30 s of hover propellant left` },
        { id: 'qual', text: N`Qualify: answer 2 landing problems correctly` },
      ],
      debrief: N`Contact light. Next: the long way home, starting with the burn that leaves lunar orbit.`,
    },
    entry: {
      name: N`Threading the Corridor`, topic: 'entry', glyph: 'capsule',
      briefing: N`You come home at 11 km/s carrying 60 megajoules per kilogram, about fourteen and a half times the energy of the same mass of TNT, and the atmosphere has about ten minutes to absorb it. The corridor is two degrees wide: too shallow and you skip back into space, too steep and the deceleration crushes you. Your only control is which way the capsule’s lift points.`,
      objectives: [
        { id: 'skip', text: N`Find the overshoot boundary: make a capsule skip out` },
        { id: 'safe', text: N`Fly a lunar-return entry captured with a peak below 8 g` },
        { id: 'site', text: N`Deorbit from Earth orbit and splash down within 50 km of the recovery ship, with your own burn and lead angle` },
        { id: 'qual', text: N`Qualify: answer 2 re-entry problems correctly` },
      ],
      debrief: N`Splashdown. Welcome home, {name}. One module left: the team on the ground that flew the mission with you.`,
    },
  };
  // module order follows the app's chapter order; codes (TM-n) are computed from it
  const ORDER = [];
  const rebuild = () => { ORDER.length = 0; Object.keys(MODULES).sort((a, b) => App.ORDER.indexOf(a) - App.ORDER.indexOf(b)).forEach((k) => ORDER.push(k)); };
  const withCode = (id) => Object.defineProperty(MODULES[id], 'code', { get: () => 'TM-' + (ORDER.indexOf(id) + 1), configurable: true, enumerable: true });
  Object.keys(MODULES).forEach(withCode);
  rebuild();

  const load = () => UI.store.get('progress', { name: '', done: {} });
  let state = load();
  const save = () => UI.store.set('progress', state);
  const fill = (s) => T(s).replace(/\{name\}/g, Progress.callsign());

  const Progress = {
    MODULES, ORDER,
    code: (id) => (MODULES[id] ? MODULES[id].code : ''),
    // modules defined in their own chapter file: Progress.register('id', { name, topic, glyph, briefing, objectives, debrief })
    register(id, def) { MODULES[id] = def; withCode(id); rebuild(); },
    // the callsign is injected into innerHTML (briefings, certificate): '<' and '>' are never kept
    // without a callsign: ASCAN, NASA's name for an astronaut candidate (explained in the TM-1 briefing and the glossary)
    callsign: () => (state.name ? String(state.name).replace(/[<>]/g, '') : 'ASCAN'),
    hasCallsign: () => !!state.name,
    setCallsign(n) { state.name = String(n || '').replace(/[<>]/g, '').trim().slice(0, 24); save(); },
    isDone: (mod, id) => !!state.done[`${mod}.${id}`],
    count(mod) { const m = MODULES[mod]; return m ? m.objectives.filter((o) => Progress.isDone(mod, o.id)).length : 0; },
    complete(mod) { const m = MODULES[mod]; return !!m && Progress.count(mod) === m.objectives.length; },
    totals() { let d = 0, n = 0; for (const k of ORDER) { d += Progress.count(k); n += MODULES[k].objectives.length; } return { d, n, patches: ORDER.filter(Progress.complete).length }; },
    nextModule() { return ORDER.find((k) => !Progress.complete(k)) || null; },
    // when training was completed: the time of the last objective earned (each is stored with Date.now()), or null
    // while a module is unfinished. It moves only if objectives are reset and earned again.
    completedAt() {
      if (Progress.totals().patches !== ORDER.length) return null;
      let t = 0; for (const k of ORDER) for (const o of MODULES[k].objectives) t = Math.max(t, +state.done[`${k}.${o.id}`] || 0);
      return t > 1e12 ? new Date(t) : null;   // a stored true/1 (no timestamp) is not a date
    },
    // qualification objectives are recomputed from practice scores at every start, so those go too
    reset() { state = { name: state.name, done: {} }; save(); UI.store.set('stats', {}); },
    // one module only: its objectives and the practice score of its topic, which would re-earn the qualification
    resetModule(mod) {
      for (const k of Object.keys(state.done)) if (k.startsWith(mod + '.')) delete state.done[k];
      pending.forEach((t, k) => { if (k.startsWith(mod + '.')) { clearTimeout(t); pending.delete(k); } });
      save();
      const s = UI.store.get('stats', {}); delete s[MODULES[mod].topic]; UI.store.set('stats', s);
      refreshChecklists();
    },

    // Mark an objective done. Safe to call repeatedly. Lab objectives are confirmed only after HOLD ms with no
    // lab control touched (see the listener below), so sweeping a slider through a solution does not earn it:
    // the candidate has to stop on it. Repeated calls keep the running timer; 'qual' (practice) is immediate.
    done(mod, id) {
      const key = `${mod}.${id}`;
      if (state.done[key] || !MODULES[mod]) return;
      if (id !== 'qual') {
        if (!pending.has(key)) pending.set(key, setTimeout(() => { pending.delete(key); award(mod, id); }, HOLD));
        return;
      }
      award(mod, id);
    },
    // qualification objectives come from practice scores
    checkQual() {
      const s = UI.store.get('stats', {});
      for (const k of ORDER) if ((s[MODULES[k].topic]?.right || 0) >= 2) Progress.done(k, 'qual');
    },
  };

  const HOLD = 3000, pending = new Map();
  // touching a lab control cancels every pending objective; the lab's handler, which runs after this capture
  // listener, re-reports those that still hold and they start a fresh HOLD. Playback controls (.tl-transport)
  // only move through time, so they cancel nothing.
  const cancelPending = (e) => {
    const el = e.target;
    if (!pending.size || !el.closest || !el.closest('.lab') || el.closest('.tl-transport')) return;
    // a slider's 'change' (on release) repeats the value of its last 'input', which the lab already handled
    if (e.type === 'input' ? !el.matches('input[type=range]') : !el.matches('select, input[type=checkbox], input[type=radio]')) return;
    pending.forEach((t) => clearTimeout(t)); pending.clear();
  };
  document.addEventListener('input', cancelPending, true);
  document.addEventListener('change', cancelPending, true);

  function award(mod, id) {
    const key = `${mod}.${id}`;
    if (state.done[key]) return;
    state.done[key] = Date.now(); save();
    const o = MODULES[mod].objectives.find((x) => x.id === id);
    toast(`<span><b>${T`Objective complete`}</b>${o ? T(o.text) : id}</span>`, 'obj');
    refreshChecklists();
    if (Progress.complete(mod)) {
      setTimeout(() => toast(`${patchSVG(mod, true, 54)}<span><b>${T`Patch earned: ${MODULES[mod].code}`}</b>${T(MODULES[mod].name)}</span>`, 'patch'), 700);
      if (Progress.totals().patches === ORDER.length) setTimeout(() => toast(`<span><b>${T`Training complete`}</b>${T`You are GO for launch. See your certificate on the home page.`}</span>`, 'patch'), 1600);
    }
  }

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
    // Newton's cannon: a mountain on a curved planet; the cannonball lands far round, almost past the horizon
    cannon: '<g transform="translate(0,-5) scale(1.3)"><circle cx="0" cy="12" r="12" class="pg-fill"/><path d="M-4.5 1.2 L0 -7 L4.5 1.2 Z" class="pg-light"/><path d="M0 -7 C 14 -9 21 4 11.6 15.1" class="pg-line pg-acc" style="stroke-width:1.8"/><circle cx="15.3" cy="8.3" r="2.3" class="pg-dot"/></g>',
    ellipse: '<ellipse cx="0" cy="4" rx="22" ry="13" class="pg-line"/><circle cx="-11" cy="4" r="5" class="pg-fill"/><circle cx="20" cy="-3" r="2.4" class="pg-dot"/>',
    rocket: '<path d="M0 -20 C 6 -12 6 4 5 14 L -5 14 C -6 4 -6 -12 0 -20 Z" class="pg-fill"/><path d="M-5 6 L-10 16 L-5 14 M5 6 L10 16 L5 14" class="pg-line"/><path d="M-3 16 L0 25 L3 16" class="pg-dot"/>',
    ascent: '<path d="M-24 22 A 60 60 0 0 1 24 22" class="pg-line" opacity=".4"/><path d="M-14 18 C -12 0 0 -12 22 -14" class="pg-line"/><circle cx="22" cy="-14" r="2.6" class="pg-dot"/>',
    transfer: '<circle cx="0" cy="4" r="9" class="pg-line"/><circle cx="0" cy="4" r="20" class="pg-line" opacity=".5"/><path d="M9 4 A 14.5 12 0 0 1 -20 4" class="pg-line pg-acc"/><circle cx="0" cy="4" r="3" class="pg-fill"/>',
    // a Moon inside its dashed sphere of influence, an arc arriving from the Earth
    soi: '<circle cx="-19" cy="10" r="6" class="pg-fill"/><circle cx="12" cy="-4" r="13" class="pg-line" stroke-dasharray="3 3" opacity=".7"/><path d="M-13 7 C -6 -6 2 -12 8 -15" class="pg-line"/><path d="M8 -15 C 18 -10 20 2 10 6" class="pg-line pg-acc"/><circle cx="12" cy="-4" r="3.5" class="pg-dot"/>',
    figure8: '<path d="M-18 4 C -8 -12 8 -12 14 0 C 20 12 24 12 24 4 C 24 -4 20 -4 14 8 C 8 20 -8 20 -18 4" class="pg-line"/><circle cx="-18" cy="4" r="5" class="pg-fill"/><circle cx="22" cy="4" r="3" class="pg-dot"/>',
    lander: '<rect x="-7" y="-10" width="14" height="9" class="pg-fill"/><rect x="-9" y="-1" width="18" height="7" class="pg-dot"/><path d="M-9 6 L-15 16 M9 6 L15 16 M-18 16 L-12 16 M12 16 L18 16" class="pg-line"/><path d="M-24 18 L24 18" class="pg-line" opacity=".5"/>',
    node: '<circle cx="0" cy="4" r="17" class="pg-line"/><circle cx="0" cy="4" r="5" class="pg-fill"/><path d="M17 4 L17 -14" class="pg-line pg-acc"/><path d="M13 -10 L17 -16 L21 -10" class="pg-line pg-acc"/><circle cx="17" cy="4" r="3" class="pg-dot"/>',
    docking: '<path d="M-26 0 L-8 0 L-4 -6 L-4 6 L-8 0" class="pg-fill"/><rect x="-24" y="-7" width="16" height="14" class="pg-fill"/><path d="M-4 0 L2 0" class="pg-line pg-acc"/><path d="M4 -9 L4 9 M4 -6 L10 -6 M4 6 L10 6" class="pg-line"/><rect x="10" y="-9" width="14" height="18" class="pg-dot"/>',
    capsule: '<path d="M-6 -14 L6 -14 L14 8 L-14 8 Z" class="pg-fill"/><path d="M-16 12 A 30 12 0 0 0 16 12" class="pg-line pg-acc"/><path d="M-12 18 A 26 12 0 0 0 12 18" class="pg-line pg-acc" opacity=".6"/>',
    // tracking dish, its signal, and the spacecraft with its velocity
    tracking: '<path d="M-24 4 Q -16 20 -2 12 Z" class="pg-fill"/><path d="M-13 12 L-13 19 M-19 19 L-7 19" class="pg-line"/><path d="M-6 2 A 10 10 0 0 1 2 -6 M-2 7 A 17 17 0 0 1 8 -11" class="pg-line" opacity=".6"/><path d="M14 -12 L24 -5" class="pg-line pg-acc"/><circle cx="14" cy="-12" r="3" class="pg-dot"/>',
    // a vertical flight through thinning layers of air
    sounding: '<path d="M-24 17 L24 17" class="pg-line"/><path d="M-22 9 L22 9" class="pg-line" opacity=".65"/><path d="M-19 1 L19 1" class="pg-line" opacity=".45"/><path d="M-15 -7 L15 -7" class="pg-line" opacity=".28"/><path d="M0 17 L0 -12" class="pg-line pg-acc"/><circle cx="0" cy="-15" r="3" class="pg-dot"/>',
    // a two-stage rocket pitched over, its path bending
    launcher: '<path d="M-22 20 C -18 4 -8 -6 6 -12" class="pg-line" opacity=".5"/><g transform="rotate(55 8 -6)"><path d="M8 -22 C 12 -17 12 -6 11 4 L 5 4 C 4 -6 4 -17 8 -22 Z" class="pg-fill"/><path d="M5 -8 L11 -8" class="pg-line"/><path d="M6 4 L8 10 L10 4" class="pg-dot"/></g>',
    // a clock face whose hands open the phase angle
    clock: '<circle cx="0" cy="4" r="18" class="pg-line"/><path d="M0 -14 L0 -11 M18 4 L15 4 M0 22 L0 19 M-18 4 L-15 4" class="pg-line"/><path d="M0 4 L0 -10 M0 4 L11 -5" class="pg-line"/><path d="M0 -8 A 12 12 0 0 1 8 -5" class="pg-line pg-acc"/><circle cx="0" cy="4" r="2.6" class="pg-fill"/>',
    // two orbital planes crossing at the node
    planes: '<ellipse cx="0" cy="4" rx="22" ry="8" class="pg-line" opacity=".5"/><ellipse cx="0" cy="4" rx="22" ry="8" transform="rotate(-25 0 4)" class="pg-line pg-acc"/><circle cx="0" cy="4" r="5" class="pg-fill"/><circle cx="18.8" cy="-0.2" r="3" class="pg-dot"/>',
    // the braking arc from orbit down to a marked site
    descent: '<path d="M-24 -14 C -4 -14 8 -4 13 13" class="pg-line pg-acc"/><path d="M-24 18 L24 18" class="pg-line" opacity=".5"/><path d="M9 10 L17 18 M17 10 L9 18" class="pg-line"/><circle cx="-22" cy="-14" r="3" class="pg-dot"/>',
    // from the Moon back to the Earth
    homeward: '<circle cx="-13" cy="12" r="10" class="pg-fill"/><circle cx="17" cy="-13" r="4.5" class="pg-dot"/><path d="M13 -9 C 10 2 4 9 -2 10" class="pg-line pg-acc"/><path d="M2 5 L-2 10 L4 12" class="pg-line pg-acc"/>',
    // a row of consoles in the control room
    console: '<rect x="-23" y="-13" width="13" height="10" class="pg-line"/><rect x="-6.5" y="-13" width="13" height="10" class="pg-line pg-acc"/><rect x="10" y="-13" width="13" height="10" class="pg-line"/><path d="M-25 3 L25 3 L20 14 L-20 14 Z" class="pg-fill"/><circle cx="0" cy="8.5" r="2" class="pg-dot"/>',
  };
  function patchSVG(mod, earned, size = 96) {
    const m = MODULES[mod];
    return `<svg class="patch ${earned ? 'earned' : 'locked'}" viewBox="-50 -50 100 100" width="${size}" height="${size}" role="img" aria-label="${earned ? T`${m.code} ${T(m.name)} patch` : T`${m.code} ${T(m.name)} patch (not yet earned)`}">
      <circle r="47" class="pt-bg"/><circle r="47" class="pt-ring"/><circle r="40" class="pt-inner"/>
      <g transform="translate(0,2) scale(1.05)">${GLYPHS[m.glyph]}</g>
      <text y="-27" class="pt-code">${m.code}</text>
    </svg>`;
  }
  Progress.patchSVG = patchSVG;

  /* ---------- briefing and debrief panels ---------- */
  function checklist(mod) {
    return MODULES[mod].objectives.map((o) => `<li data-obj="${mod}.${o.id}" class="${Progress.isDone(mod, o.id) ? 'done' : ''}"><span class="box" aria-hidden="true"></span><span>${T(o.text)}</span></li>`).join('');
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
    document.querySelectorAll('[data-reset-obj]').forEach((b) => { b.hidden = !Progress.count(b.dataset.resetObj); });
    document.querySelectorAll('[data-count-of]').forEach((el) => { const m = el.dataset.countOf; el.textContent = `${Progress.count(m)}/${MODULES[m].objectives.length}`; });
  }

  Progress.briefing = (mod, opts = {}) => {
    const m = MODULES[mod];
    if (!m) return '';
    const choices = [
      opts.theory && `<a class="choice" href="#${opts.theory}" data-jump="${opts.theory}"><b>${T`Read the theory first`}</b><span>${T`The steady route: equations, history, then the simulator.`}</span></a>`,
      opts.lab && `<a class="choice" href="#${opts.lab}" data-jump="${opts.lab}"><b>${T`Straight to the simulator`}</b><span>${T`Learn by doing, then come back for the why.`}</span></a>`,
      opts.math && `<a class="choice" href="#${opts.math}" data-jump="${opts.math}" data-open="1"><b>${T`Refresh the math first`}</b><span>${opts.mathLabel ? T(opts.mathLabel) : T`A quick ground-school refresher.`}</span></a>`,
    ].filter(Boolean).join('');
    return `
      <aside class="briefing" id="briefing" aria-label="${T`Mission briefing`}">
        <div class="brief-head">
          <span class="avatar" aria-hidden="true">V</span>
          <div><span class="eyebrow">${Progress.hasCallsign() ? T`Briefing for ${Progress.callsign()}` : T`Briefing`}</span><b class="brief-title">${T(m.name)}</b></div>
          <div class="brief-patch" data-patch-of="${mod}" data-size="64">${patchSVG(mod, Progress.complete(mod), 64)}</div>
        </div>
        <p class="brief-text">${fill(m.briefing)}</p>
        <p class="brief-sign">${T`Vega, Chief Flight Instructor`}</p>
        <h3 class="brief-h">${T`Objectives`}</h3>
        <ul class="objectives">${checklist(mod)}</ul>
        <button class="obj-reset" data-reset-obj="${mod}" ${Progress.count(mod) ? '' : 'hidden'}>${T`Reset the objectives of this module`}</button>
        ${choices ? `<h3 class="brief-h">${T`How do you want to start?`}</h3><div class="choices">${choices}</div>` : ''}
      </aside>
      ${dock(mod)}`;
  };

  /* Objectives dock: a corner button on every module page that opens the checklist, so a candidate deep in a lab
     can read what is asked without scrolling back to the briefing. Hidden while the briefing's own list is in view. */
  function dock(mod) {
    const m = MODULES[mod];
    return `<div class="obj-dock away" data-dock="${mod}">
        <div class="obj-dock-panel" id="obj-dock-panel" role="dialog" aria-label="${T`Objectives`}" hidden>
          <div class="obj-dock-head"><b>${T`Objectives`} · ${m.code}</b><button class="obj-dock-x" type="button" aria-label="${T`Close`}">×</button></div>
          <ul class="objectives">${checklist(mod)}</ul>
          <a class="obj-dock-back" href="#briefing" data-dock-back="1">${T`Back to the briefing`}</a>
        </div>
        <button class="obj-dock-btn" type="button" aria-expanded="false" aria-controls="obj-dock-panel">${T`Objectives`} <span class="obj-dock-n" data-count-of="${mod}">${Progress.count(mod)}/${m.objectives.length}</span></button>
      </div>`;
  }
  const dockOpen = (d, open) => {
    d.querySelector('.obj-dock-panel').hidden = !open;
    d.querySelector('.obj-dock-btn').setAttribute('aria-expanded', String(open));
  };
  document.addEventListener('click', (e) => {
    const d = e.target.closest && e.target.closest('.obj-dock');
    if (!d) return;
    if (e.target.closest('.obj-dock-btn')) dockOpen(d, d.querySelector('.obj-dock-panel').hidden);
    else if (e.target.closest('.obj-dock-x')) dockOpen(d, false);
    else if (e.target.closest('[data-dock-back]')) {
      e.preventDefault(); dockOpen(d, false);
      const b = document.getElementById('briefing');
      if (b) b.scrollIntoView({ behavior: UI.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.obj-dock').forEach((d) => { if (!d.querySelector('.obj-dock-panel').hidden) { dockOpen(d, false); d.querySelector('.obj-dock-btn').focus(); } });
  });
  // show the button only once the briefing's checklist has scrolled out of view (an open panel stays)
  const dockPlace = () => {
    const d = document.querySelector('.obj-dock');
    if (!d) return;
    const list = document.querySelector('#briefing .objectives'), r = list && list.getBoundingClientRect();
    const inView = r && r.bottom > 0 && r.top < innerHeight;
    d.classList.toggle('away', !!inView && d.querySelector('.obj-dock-panel').hidden);
  };
  window.addEventListener('scroll', dockPlace, { passive: true });
  window.addEventListener('resize', dockPlace);
  Progress.dockPlace = dockPlace;

  Progress.debrief = (mod, opts = {}) => {
    const m = MODULES[mod], i = ORDER.indexOf(mod), next = ORDER[i + 1];
    const nc = next && App.chapters[next];
    return `
      <aside class="debrief" aria-label="${T`Debrief`}">
        <span class="eyebrow">${Progress.hasCallsign() ? T`${m.code} · debrief for ${Progress.callsign()}` : T`${m.code} · debrief`}</span>
        <p class="brief-text">${fill(m.debrief)}</p>
        <ul class="objectives compact">${checklist(mod)}</ul>
        <h3 class="brief-h">${T`Where to now?`}</h3>
        <div class="choices">
          ${nc ? `<a class="choice primary" href="#${next}"><b>${T`Report to ${MODULES[next].code}: ${T(MODULES[next].name)}`}</b><span>${T(nc.blurb || '')}</span></a>` : `<a class="choice primary" href="#home"><b>${T`Return to base`}</b><span>${T`Collect your certificate on the home page.`}</span></a>`}
          <a class="choice" href="#practice" data-topic="${m.topic}"><b>${T`Sit the qualification exam`}</b><span>${T`Problems on ${T(Practice.TOPICS[m.topic])}, fresh numbers every time.`}</span></a>
          ${opts.math ? `<a class="choice" href="#toolkit" data-primer="${opts.math}"><b>${T`Back to ground school`}</b><span>${opts.mathLabel ? T(opts.mathLabel) : T`Review the math behind this module.`}</span></a>` : ''}
        </div>
      </aside>`;
  };

  // module reset asks for a second click, like the full reset on the home page
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-reset-obj]');
    if (!b) return;
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = T`Click again to clear these objectives and the practice score of this module`; return; }
    delete b.dataset.armed; b.textContent = T`Reset the objectives of this module`;
    Progress.resetModule(b.dataset.resetObj);
  });

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
