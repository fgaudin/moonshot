/* Chapter — Mission Control: positions, flight plan, voice protocol, PADs, Δv budgets and margins, error budgets, aborts.
   Lab: the mission planning desk (Δv budget builder, PAD worksheet and readback drill, abort decision). */
(function () {
  'use strict';
  const M = window.Phys_mcc;
  const f = (x, d = 1) => UI.fmt(x, d);
  const P = M.parseNum;

  /* ---------------- Progress and practice ---------------- */
  Progress.register('mcc', {
    name: N`Mission Control`, topic: 'mcc', glyph: 'node',
    briefing: N`Every maneuver you flew in this course was computed by someone, checked by someone else and read to a crew over a radio. Today you sit on both sides of that loop, {name}. You will build a Δv budget with honest margins, fill in the PADs, and decide an abort with the clock running.`,
    objectives: [
      { id: 'margin', text: N`Fix the heavier-payload budget: at least 5 % margin on every stage` },
      { id: 'rss', text: N`Combine four independent error sources by root-sum-square` },
      { id: 'pad', text: N`Read back a PAD without a single error` },
      { id: 'abort', text: N`Choose the right abort option` },
      { id: 'qual', text: N`Qualify: answer 2 Mission Control problems correctly` },
    ],
    debrief: N`You can now run a mission from the ground and fly it from the cockpit, {name}. That closes the training modules. The toolkit and the simulator exercises come next, where a Mission Control team computes the burns and voices them to a pilot.`,
  });

  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const R = String.raw;
  const G0 = M.g0, GM = M.gMoon;

  Practice.register('mcc', N`Mission Control`, [
    { title: N`Margin as a percentage`, make() {
      const plan = rnd(800, 2200, 10), rem = plan * rnd(110, 135, 1) / 100 | 0, s3 = rnd(30, 90, 5);
      const m = 100 * (rem - s3) / plan;
      return { q: T`A stage must deliver a planned <b>${plan} m/s</b>. After its last burn the propellant left would give <b>${rem} m/s</b>, and the 3σ dispersion of its burns is <b>${s3} m/s</b>. What is the margin, as a percentage of the planned Δv?`,
        answer: m, unit: '%', tol: 0.02,
        hint: T`Subtract the dispersion from the reserve first. Then divide by the planned Δv, not by the reserve.`,
        sol: R`\[ \text{margin} = 100\,\frac{\Delta v_{rem}-3\sigma}{\Delta v_{plan}} = 100\,\frac{${rem}-${s3}}{${plan}} = ${f(m, 1)}\ \% \]` };
    } },
    { title: N`Root-sum-square of error sources`, make() {
      const e = [rnd(8, 40, 1) / 10, rnd(5, 30, 1) / 10, rnd(5, 25, 1) / 10, rnd(3, 20, 1) / 10];
      const rss = M.rss(e), lin = e.reduce((a, b) => a + b, 0);
      return { q: T`Four independent 1σ errors act on the same burn: navigation <b>${f(e[0], 1)} m/s</b>, cutoff <b>${f(e[1], 1)} m/s</b>, pointing <b>${f(e[2], 1)} m/s</b>, timing <b>${f(e[3], 1)} m/s</b>. What is the combined 1σ error?`,
        answer: rss, unit: 'm/s', tol: 0.015,
        hint: T`Independent errors add as squares, not as lengths. Square each, add, take the root.`,
        sol: R`\[ \sigma = \sqrt{${f(e[0], 1)}^2+${f(e[1], 1)}^2+${f(e[2], 1)}^2+${f(e[3], 1)}^2} = ${f(rss, 2)}\ \mathrm{m/s} \]` + `<p>${T`Adding them linearly would give ${f(lin, 1)} m/s, which is too pessimistic: independent errors seldom all line up.`}</p>` };
    } },
    { title: N`Δv remaining from the masses`, make() {
      const isp = pick([311, 314]), dry = rnd(5000, 12000, 100), prop = rnd(1500, 9000, 100);
      const m = dry + prop, dv = isp * G0 * Math.log(m / dry);
      return { q: T`A stage with I<sub>sp</sub> = <b>${isp} s</b> has a mass of <b>${f(m, 0)} kg</b> (all of the spacecraft it pushes) and <b>${f(prop, 0)} kg</b> of usable propellant left. How much Δv remains?`,
        answer: dv, unit: 'm/s', tol: 0.01,
        hint: T`The mass after burning everything is the current mass minus the propellant. Then use the rocket equation.`,
        sol: R`\[ \Delta v = I_{sp}\,g_0\ln\frac{m_0}{m_0-m_{prop}} = ${isp}\times 9.807\times\ln\frac{${f(m, 0)}}{${f(dry, 0)}} = ${f(dv, 0)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Margin as hover time`, make() {
      const mg = rnd(20, 90, 5);
      const t = mg / GM;
      return { q: T`A lunar lander finishes its descent with a Δv margin of <b>${mg} m/s</b> in hand. Hovering costs about g☾ = 1.62 m/s of Δv every second. How many seconds of hover does the margin buy?`,
        answer: t, unit: 's', tol: 0.015,
        hint: T`While hovering, thrust equals weight, so the engine spends Δv at the rate g☾. Divide the margin by that rate.`,
        sol: R`\[ t = \frac{\Delta v_{margin}}{g_☾} = \frac{${mg}}{1.62} = ${f(t, 0)}\ \mathrm{s} \]` };
    } },
    { title: N`Position error from a velocity error`, make() {
      const dv = rnd(2, 9, 1) / 10, h = pick([24, 36, 48, 60, 72]);
      const km = dv * h * 3600 / 1000;
      return { q: T`An error of <b>${f(dv, 1)} m/s</b> is left in the velocity after the burn that sends a spacecraft to the Moon. To first order, how far off is its position after <b>${h} h</b> of coasting?`,
        answer: km, unit: 'km', tol: 0.015,
        hint: T`A small velocity error grows linearly with time: distance = speed error × time. Convert the hours to seconds.`,
        sol: R`\[ \delta r = \delta v\,t = ${f(dv, 1)}\times ${f(h * 3600, 0)}\ \mathrm{s} = ${f(km, 0)}\ \mathrm{km} \]` + `<p>${T`Gravity bends this estimate, but it gives the right size. It is why midcourse corrections exist: a 0.3 m/s error is cheap to fix early and costly late.`}</p>` };
    } },
    { title: N`PAD total Δv and attitude`, make() {
      const p = rnd(-400, 400, 5), n = rnd(-40, 40, 5), r = rnd(5, 60, 5);
      const tot = M.padTotal(p, n, r), a = M.padAlpha(p, r);
      return { q: T`A maneuver PAD gives Δv<sub>P</sub> = <b>${p} m/s</b>, Δv<sub>N</sub> = <b>${n} m/s</b>, Δv<sub>R</sub> = <b>${r} m/s</b>. What is the total Δv to be read back?`,
        answer: tot, unit: 'm/s', tol: 0.005,
        hint: T`Pythagoras in three dimensions.`,
        sol: R`\[ |\Delta v| = \sqrt{${p}^2+${n}^2+${r}^2} = ${f(tot, 1)}\ \mathrm{m/s} \]` + `<p>${T`The in-plane attitude is α = arctan(Δv<sub>R</sub>/Δv<sub>P</sub>) = ${f(a, 1)}° (measured from prograde towards radial).`}</p>` };
    } },
  ], [
    { q: N`In Apollo, which Mission Control position owned the return trajectory, the abort options and the entry targets?`,
      opts: [N`CAPCOM`, N`FIDO`, N`RETRO`, N`EECOM`], a: 2,
      why: N`RETRO, the Retrofire Officer, computed the way home and the aborts. FIDO planned the outbound trajectory and the burns that shape it, and CAPCOM only voiced the result to the crew. EECOM watched the spacecraft’s power and life-support systems.` },
    { q: N`Why does the crew read every PAD back to the CAPCOM?`,
      opts: [N`The loop is too noisy to hear a PAD otherwise`, N`A single wrong digit can become a burn in the wrong direction, and the readback proves that what was heard is what was sent`, N`It is a tradition without a technical reason`, N`The flight computer cannot store numbers that were not spoken`], a: 1,
      why: N`Voice links drop and mishear numbers. A readback closes the loop: the sender hears what the receiver wrote and corrects it before the crew loads anything into the computer.` },
    { q: N`Two independent errors, 3 m/s and 4 m/s, act on a burn. What is their combined size?`,
      opts: [N`7 m/s`, N`5 m/s`, N`3.5 m/s`, N`1 m/s`], a: 1,
      why: N`Independent errors add as squares: √(3² + 4²) = 5 m/s. A straight sum (7 m/s) assumes they always push the same way, which is the worst case, not the typical one.` },
  ]);

  /* ---------------- Lab data ---------------- */
  const MAN_NAMES = {
    boost1: N`S-IC boost`, boost2: N`S-II boost`, insert: N`S-IVB orbit insertion`, tli: N`TLI`, mcc1: N`MCC outbound`, loi: N`LOI`, doi: N`DOI`,
    pdi: N`Powered descent`, lasc: N`Lunar ascent`, tei: N`TEI`, mcc2: N`MCC homebound`,
  };
  const PHASES = { ascent: N`ascent`, translunar: N`translunar`, lunar: N`lunar`, transearth: N`transearth` };
  const SCEN = {
    nominal: { label: N`Nominal lunar mission`, cargo: 0,
      task: N`An Apollo-like stack on its nominal plan. Study the table: which stage has the thinnest margin and why? Then try to break it: raise the margin rule, switch to a linear sum of errors, or let the CSM fly the descent orbit insertion.` },
    heavy: { label: N`Heavier payload`, cargo: 1000,
      task: N`The science team adds 1 000 kg to the descent stage. The descent stage no longer has 5 % margin. Fix the budget with your own changes: load more descent propellant (mind the tank capacity and the other stages), lighten the payload, or both.` },
  };
  // stage names come from mcc.phys.js (no DOM there); marked here for translation
  N`CSM · SPS`; N`LM descent · DPS`; N`LM ascent · APS`;
  const ENGINES = { SPS: N`SPS (CSM)`, DPS: N`DPS (LM descent)`, APS: N`APS (LM ascent)`, RCS: N`RCS (thrusters)` };

  // PAD forms. kind: text, get, num, eng. d: decimals shown.
  const FLD = {
    purpose: { label: N`Purpose`, kind: 'text' },
    tig: { label: N`TIG (GET h:mm:ss)`, kind: 'get' },
    dvp: { label: N`Δv prograde (m/s)`, kind: 'num', d: 1 },
    dvn: { label: N`Δv normal (m/s)`, kind: 'num', d: 1 },
    dvr: { label: N`Δv radial (m/s)`, kind: 'num', d: 1 },
    dv: { label: N`Δv total (m/s)`, kind: 'num', d: 1 },
    alpha: { label: N`Attitude α (°)`, kind: 'num', d: 1 },
    beta: { label: N`Attitude β (°)`, kind: 'num', d: 1 },
    m0: { label: N`Mass at ignition (kg)`, kind: 'num', d: 0, calc: true },
    eng: { label: N`Engine`, kind: 'eng', calc: true },
    tb: { label: N`Burn time (s)`, kind: 'num', d: 1 },
    result: { label: N`Expected orbit after the burn`, kind: 'text' },
    gei: { label: N`Entry angle γ at entry interface (°)`, kind: 'num', d: 2 },
    eitime: { label: N`Entry interface (GET h:mm:ss)`, kind: 'get' },
    vei: { label: N`Velocity at entry interface (m/s)`, kind: 'num', d: 0 },
    range: { label: N`Range to splashdown (km)`, kind: 'num', d: 0 },
    gmax: { label: N`Peak load (g)`, kind: 'num', d: 1 },
    lat: { label: N`Splashdown latitude (°, north +)`, kind: 'num', d: 1 },
    lon: { label: N`Splashdown longitude (°, east +)`, kind: 'num', d: 1 },
  };
  const PADS = {
    man: { name: N`Maneuver PAD`, keys: ['purpose', 'tig', 'dvp', 'dvn', 'dvr', 'dv', 'alpha', 'beta', 'm0', 'eng', 'tb', 'result'], rb: ['tig', 'dvp', 'dvn', 'dvr', 'dv', 'alpha', 'beta', 'tb'], calc: true },
    tei: { name: N`TEI PAD`, keys: ['purpose', 'tig', 'dvp', 'dvn', 'dvr', 'dv', 'alpha', 'beta', 'm0', 'eng', 'tb', 'gei'], rb: ['tig', 'dvp', 'dvn', 'dvr', 'dv', 'alpha', 'beta', 'tb', 'gei'], calc: true },
    ent: { name: N`Entry PAD`, keys: ['eitime', 'gei', 'vei', 'range', 'gmax', 'lat', 'lon'], rb: ['eitime', 'gei', 'vei', 'range', 'gmax', 'lat', 'lon'], calc: false },
  };
  const PURPOSES = [N`Midcourse correction`, N`Lunar orbit insertion`, N`Descent orbit insertion`, N`Plane change`, N`Circularization`];

  const fmtFld = (k, v) => (FLD[k].kind === 'get' ? M.fmtGET(v) : FLD[k].kind === 'num' ? f(v, FLD[k].d) : String(v));
  const near = (typed, v, d) => Math.abs(typed - v) <= 0.5 * Math.pow(10, -d) + 1e-9;

  function genPad(kind) {
    if (kind === 'ent') {
      return { eitime: rnd(142, 196, 1) * 3600 + rnd(0, 59) * 60 + rnd(0, 59), gei: -rnd(595, 705, 5) / 100, vei: rnd(11000, 11100, 1), range: rnd(2000, 2800, 10), gmax: rnd(55, 70, 1) / 10, lat: rnd(-300, 250, 5) / 10, lon: -rnd(1550, 1750, 5) / 10 };
    }
    const dvp = rnd(-3000, 4000, 1) / 10, dvn = rnd(-300, 300, 1) / 10, dvr = rnd(-500, 500, 1) / 10;
    const dv = Math.round(M.padTotal(dvp, dvn, dvr) * 10) / 10, m0 = rnd(15000, 30000, 100);
    const v = { purpose: kind === 'tei' ? 'TEI' : T(pick(PURPOSES)), tig: rnd(20, 90, 1) * 3600 + rnd(0, 59) * 60 + rnd(0, 59), dvp, dvn, dvr, dv,
      alpha: Math.round(M.padAlpha(dvp, dvr) * 10) / 10, beta: Math.round(M.padBeta(dvp, dvn, dvr) * 10) / 10, m0, eng: 'SPS',
      tb: Math.round(M.burnTime(314, m0, dv, 91200) * 10) / 10 };
    if (kind === 'tei') v.gei = -rnd(595, 705, 5) / 100;
    return v;
  }

  function sheetHTML(kind, vals) {
    const p = PADS[kind];
    const rows = p.keys.map((k) => {
      const v = vals ? vals[k] : '';
      return `<tr><th>${T(FLD[k].label)}</th><td>${v ? String(v).replace(/</g, '&lt;') : '&nbsp;'}</td></tr>`;
    }).join('');
    return `<div class="mcc-sheet"><h2>${T(p.name)}</h2>
      <table><tr><th>${T`Copied by`}</th><td>&nbsp;</td></tr><tr><th>${T`Voiced by (CAPCOM)`}</th><td>&nbsp;</td></tr><tr><th>${T`Time received (GET)`}</th><td>&nbsp;</td></tr>${rows}<tr><th>${T`Readback correct`}</th><td>&#9744; ${T`yes`}</td></tr></table>
      <p>${T`Moonshot training · PAD worksheet`}</p></div>`;
  }
  function printSheet(kind, vals) {
    const el = document.createElement('div');
    el.id = 'mcc-printarea'; el.innerHTML = sheetHTML(kind, vals);
    document.body.appendChild(el);
    document.body.classList.add('mcc-printing');
    const done = () => { document.body.classList.remove('mcc-printing'); el.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } finally { setTimeout(done, 1500); }
  }

  App.css('mcc', `
    .mcc-pane { grid-column: 1 / -1; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .mcc-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: .7rem 1rem; align-items: end; }
    .mcc-scroll { overflow-x: auto; }
    .mcc-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.2rem; align-items: start; }
    .mcc-pane table.data input { width: 5.6rem; }
    .mcc-pane td.ok, .mcc-ok { color: var(--good); font-weight: 600; }
    .mcc-pane td.no, .mcc-no { color: var(--bad); font-weight: 600; }
    .mcc-verdict { font: 600 .9rem/1 var(--f-mono); padding: .4rem .7rem; border: 1px solid; border-radius: 4px; letter-spacing: .08em; }
    .mcc-form { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .6rem .8rem; }
    .mcc-form label { display: flex; flex-direction: column; gap: .25rem; font: 500 .72rem/1.2 var(--f-mono); color: var(--muted); }
    .mcc-form input, .mcc-form select { width: 100%; }
    .mcc-form .mark { font: 600 .72rem/1.3 var(--f-mono); min-height: 1em; }
    .mcc-padbox { border: 1px dashed var(--line); border-radius: 6px; padding: .7rem .9rem; background: var(--bg); }
    .mcc-padbox dl { display: grid; grid-template-columns: auto 1fr; gap: .15rem .8rem; margin: .4rem 0 0; font: .82rem/1.5 var(--f-mono); }
    .mcc-padbox dt { color: var(--muted); } .mcc-padbox dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .mcc-pane h4 { margin: 0; font: 600 .7rem/1 var(--f-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
    .mcc-opts { display: flex; flex-direction: column; gap: .5rem; }
    .mcc-opts label.opt { display: flex; gap: .6rem; align-items: flex-start; padding: .5rem .6rem; border: 1px solid var(--line); border-radius: 6px; cursor: pointer; }
    .mcc-opts label.opt:has(input:checked) { border-color: var(--accent); }
    @media (max-width: 800px) { .mcc-cols { grid-template-columns: minmax(0, 1fr); } .mcc-pane { padding: .8rem; } }
    #mcc-printarea { display: none; }
    @media print {
      body.mcc-printing > *:not(#mcc-printarea) { display: none !important; }
      body.mcc-printing { background: #fff !important; }
      body.mcc-printing #mcc-printarea { display: block; color: #000; background: #fff; font: 12pt/1.4 Georgia, serif; padding: 1cm; }
      #mcc-printarea h2 { font-size: 18pt; margin: 0 0 .6cm; border-bottom: 2px solid #000; padding-bottom: .2cm; }
      #mcc-printarea table { width: 100%; border-collapse: collapse; }
      #mcc-printarea th, #mcc-printarea td { border: 1px solid #000; padding: .28cm .3cm; text-align: left; height: .9cm; }
      #mcc-printarea th { width: 45%; font-weight: 600; }
      #mcc-printarea p { font-size: 9pt; margin-top: .6cm; }
    }
  `);

  /* ---------------- Chapter ---------------- */
  const POS = [
    ['FLIGHT', N`Flight Director`, N`Leads the team, polls the room and makes every go/no-go decision. Owns the mission rules.`, N`Runs the polls. In an exercise, the instructor.`],
    ['CAPCOM', N`Spacecraft Communicator`, N`The one voice to the crew, in Apollo always an astronaut. Voices PADs and takes the readback.`, N`Reads PADs to the pilot and checks the readback.`],
    ['FIDO', N`Flight Dynamics Officer`, N`Plans and tracks the trajectory and works out the maneuvers that shape it.`, N`Computes TLI, midcourse, LOI, DOI, descent and lunar-ascent burns.`],
    ['GUIDO', N`Guidance Officer`, N`Watches the onboard guidance, navigation and computer systems and the state they hold.`, N`Checks the state vector and the program loaded in the onboard computer.`],
    ['RETRO', N`Retrofire Officer`, N`Plans the return to Earth: abort options, the way home and the entry targets.`, N`Computes TEI, homebound midcourse, the entry PAD and every abort option.`],
    ['BOOSTER', N`Booster Systems Engineer`, N`Watches the Saturn V launch vehicle during ascent.`, N`Reports on the launch vehicle’s health during ascent.`],
    ['EECOM', N`Electrical, Environmental and Consumables Manager`, N`Watches the command and service module’s power, cooling and life-support systems.`, N`Gives the consumables hours that limit an abort.`],
    ['GNC', N`Guidance, Navigation and Control`, N`Watches the command and service module’s guidance and control hardware, including the main engine and thrusters.`, N`Calls the CSM engine go or no-go.`],
    ['CONTROL', N`LM Control`, N`Watches the lunar module’s guidance, control and propulsion.`, N`Calls the LM engines go or no-go.`],
    ['TELMU', N`LM Telemetry, Electrical, EVA`, N`Watches the lunar module’s electrical and environmental systems.`, N`Gives the LM consumables.`],
    ['INCO', N`Instrumentation and Communications Officer`, N`Runs the radio link: telemetry, commands and voice.`, N`Predicts coverage and the loss of signal.`],
    ['FAO', N`Flight Activities Officer`, N`Owns the flight plan, the crew timeline and the checklists.`, N`Keeps the timeline of events by GET.`],
    ['SURGEON', N`Flight Surgeon`, N`Watches the crew’s health and gives the medical go or no-go.`, N`Medical input to the go/no-go polls.`],
  ];

  App.chapter({
    id: 'mcc', phase: N`Capstone`, title: N`Mission Control`, lab: N`Mission planning desk`,
    blurb: N`Who computes what, how numbers reach the crew, and how a mission plan carries its margins.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('mcc')} · Capstone`,
          title: T`Mission Control`,
          lede: T`A spacecraft flies by physics, but a mission flies by people, procedures and margins. This capstone shows how a team on the ground runs a lunar mission: who computes what, how the numbers travel to the crew, how big the errors are and how much reserve covers them.`,
          refs: [T`Sellers · Understanding Space`, T`Apollo Operations Handbook`, T`NASA Apollo Flight Journal and mission reports`],
        })}
        ${Progress.briefing('mcc', { theory: 'theory', lab: 'mcc-lab', math: 'refresher', mathLabel: N`Exponentials and logarithms, and combining errors.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`The room and its positions`}</h2>
          <div class="prose">
            <p>${T`During Apollo, the flight was run from the Mission Operations Control Room in Houston. Each console owned a part of the vehicle or the trajectory and watched it with the help of a back room of specialists. The Flight Director sat above them all. Every position answered with a single word, <b>go</b> or <b>no-go</b>, and the Flight Director decided.`}</p>
          </div>
          <div class="mcc-scroll"><table class="data notation"><thead><tr><th>${T`Call sign`}</th><th>${T`Position`}</th><th>${T`What it does`}</th><th>${T`In this course`}</th></tr></thead><tbody>
            ${POS.map((p) => `<tr><td><b>${p[0]}</b></td><td>${T(p[1])}</td><td>${T(p[2])}</td><td>${T(p[3])}</td></tr>`).join('')}
          </tbody></table></div>
          <div class="prose">
            <p>${T`The split that matters most for you: <b>FIDO</b> computes the trajectory and its burns, <b>RETRO</b> computes the return and the aborts, and <b>GUIDO</b> makes sure the numbers the crew loads match the state the onboard computer actually holds. One team computes, another checks, and <b>CAPCOM</b> is the only link to the crew.`}</p>
          </div>
        </section>

        ${Archive.capsule('flightDirectors')}

        <section class="section">
          <h2><span class="idx">0.2</span>${T`The flight plan and the clock`}</h2>
          <div class="prose">
            <p>${T`Everything on the timeline is a <b>GET</b>, ground elapsed time: hours, minutes and seconds since liftoff. A PAD says “TIG 075:49:50”, not a calendar time, so everybody, on the ground and in the spacecraft, counts the same clock. The flight plan lists the events in order, each with its GET: engine burns, midcourse windows, sleep periods, go/no-go points. The Flight Activities Officer keeps it.`}</p>
            <p>${T`The plan also follows <b>coverage</b>. Antennas on Earth see the spacecraft only part of the time. Near the Moon the limit is simple geometry: when the spacecraft goes behind the Moon, the signal stops (<b>loss of signal</b>, LOS) and returns when it comes out (<b>acquisition</b>, AOS). In lunar orbit that is a large fraction of every two-hour orbit. The Apollo crews flew LOI and TEI on the far side, out of contact. The ground could not help, so the PAD had to be complete and read back before the loss of signal, and the result was known only at acquisition.`}</p>
            <p>${T`Planners use this: they place a burn where it can be monitored, or, when it cannot be, they prepare a backup that works without the ground.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`Voice protocol`}</h2>
          <div class="prose">
            <p>${T`Voices are organised in <b>loops</b>. The air-to-ground loop connects the crew and CAPCOM only. The flight director loop connects the Flight Director with every console. Each console also has private loops with its back room. Nobody calls the crew except CAPCOM, so the crew hears one voice with one style, even when twenty people are working the problem.`}</p>
            <ul>
              <li>${T`<b>Call signs.</b> The ground is “Houston”. Each spacecraft has its own name (Apollo 11 flew <i>Columbia</i> and <i>Eagle</i>), so a call is never ambiguous when two spacecraft share a loop.`}</li>
              <li>${T`<b>Readback.</b> Every set of numbers is read back by the receiver, digit by digit. The sender confirms or corrects. Nothing goes into the computer before this.`}</li>
              <li>${T`<b>Go/no-go polls.</b> Before a critical event such as powered descent, the Flight Director calls each position in turn. Each answers “go” or “no-go” and gives a reason for a no-go. The decision belongs to the Flight Director, and a mission rule that forbids an action cannot be argued away in the heat of the moment.`}</li>
              <li>${T`<b>Short and standard.</b> Numbers in a fixed order, a fixed vocabulary, no guesses. A mission rule is useful because it is stated in the same words every time.`}</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`PADs and readback`}</h2>
          <div class="prose">
            <p>${T`A <b>PAD</b> is a standard form that CAPCOM reads to the crew and the crew copies by hand. Module ${Progress.code('burns')} introduced the maneuver PAD. In this course it contains:`}</p>
            <ul>
              <li>${T`the <b>purpose</b> of the burn, so the crew can check the numbers against the plan;`}</li>
              <li>${T`<b>TIG</b> on GET;`}</li>
              <li>${T`<b>Δv</b> as prograde, normal and radial components, exactly the frame of module ${Progress.code('burns')}, and the total;`}</li>
              <li>${T`the <b>attitude</b> (α in the orbit plane from prograde towards radial, β out of the plane towards normal) and the <b>burn time</b>;`}</li>
              <li>${T`the <b>result</b>: the orbit the crew should see after the burn, apoapsis and periapsis, to check the burn.`}</li>
            </ul>
            <p>${T`The <b>TEI PAD</b> adds the entry angle the burn is aimed at. The <b>entry PAD</b> gives the entry interface time, the flight-path angle and velocity there, the range to the target and the splashdown point. Real Apollo PADs used feet per second and gimbal angles, and carried more lines. The content is the same: when, how much, which way, how long, and what you should see.`}</p>
            <p>${T`The crew copies, reads back, then <b>checks the PAD for sense</b> before loading it: is the total consistent with the three components? Is the burn time plausible for this Δv and this vehicle? Does the result match the purpose? This is the arithmetic you practise in the lab.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`Δv budget and margins`}</h2>
          <div class="prose">
            <p>${T`A mission plan starts as a list of burns with a Δv each, and each burn is assigned to a stage. The rocket equation of module ${Progress.code('rockets')} tells how much Δv each stage can give for the mass it pushes:`}</p>
            <div class="eq">\\[ \\Delta v_{rem} = I_{sp}\\,g_0\\,\\ln\\frac{m_0}{m_0 - m_{prop}} \\]</div>
            ${Sym.where(['dv', 'isp', 'g0', 'm0', ['m_{prop}', N`propellant still in the tanks after the stage’s last planned burn`, 'kg']], N`Here m₀ is everything the stage still pushes: its own dry mass, the propellant and whatever else is attached.`)}
            ${Primer.box('log', false, 'refresher')}
            <p>${T`Not all of that reserve is spare. The burns will not be flown exactly, so part of the reserve is already spoken for. The <b>margin</b> is what is left after you pay for the dispersions, compared with what the stage must deliver:`}</p>
            <div class="eq">\\[ \\text{margin} = 100\\,\\frac{\\Delta v_{rem} - 3\\sigma}{\\Delta v_{plan}}\\ \\% \\]</div>
            ${Sym.where([['\\Delta v_{plan}', N`Δv the stage must deliver in the plan`, 'm/s'], ['3\\sigma', N`combined dispersion of the stage’s burns: the value that actual burns stay within 99.7 % of the time`, 'm/s']], N`Mission rules fix the least margin allowed. The lab asks for 5 %, a training figure.`)}
            <p>${T`<b>Margin as time.</b> A Δv margin means little to a pilot, so Mission Control also states it as time. A lander hovering over the Moon spends about g☾ of Δv every second:`}</p>
            <div class="eq">\\[ t_{hover} \\approx \\frac{\\Delta v_{margin}}{g_☾} \\]</div>
            ${Sym.where(['gM', ['t_{hover}', N`how long the margin lets the lander hover or search for a site`, 's']], N`Apollo 11 touched down after Mission Control’s “30 seconds” call, which counted down to the land-or-abort limit, not to empty tanks. The budget decided how long a pilot could look for a landing site.`)}
            <p>${T`On a coasting leg the margin is a burn time at the engine’s thrust, or hours of oxygen and power.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Error budgets and midcourse corrections`}</h2>
          <div class="prose">
            <p>${T`Three families of error act on every burn:`}</p>
            <ul>
              <li>${T`<b>Navigation:</b> how well the ground knows the position and velocity before the burn.`}</li>
              <li>${T`<b>Execution:</b> cutoff (the engine shuts down a little early or late, so the Δv is wrong in size) and <b>pointing</b> (the thrust is a little off the planned direction). A pointing error of θ on a Δv of 1 000 m/s puts 1 000·sin θ of it sideways: 17 m/s for 1°.`}</li>
              <li>${T`<b>Timing:</b> a burn started late by Δt moves the point of the orbit where it happens. A spacecraft at 7.8 km/s covers 7.8 km every second.`}</li>
            </ul>
            <p>${T`The sources are independent: the radar noise does not know about the engine’s tail-off. Independent errors do not add as lengths, because they seldom all push the same way. They add as <b>squares</b>, a combination called the root-sum-square:`}</p>
            <div class="eq">\\[ \\sigma = \\sqrt{\\sigma_1^2 + \\sigma_2^2 + \\dots + \\sigma_n^2}, \\qquad 3\\sigma = 3\\times\\sigma \\]</div>
            ${Sym.where([['\\sigma_i', N`the 1σ (one standard deviation) size of each independent error, in the same unit`, 'm/s'], ['\\sigma', N`combined 1σ error. Multiply by 3 for the 3σ planning value`, 'm/s']], N`Read: square each error, add the squares, take the square root. 3 and 4 give 5, not 7. If two errors are not independent, the straight sum is the safe bound.`)}
            <p>${T`Errors do not stay small. A velocity error δv left after a burn grows with the time the spacecraft coasts, to first order:`}</p>
            <div class="eq">\\[ \\delta r \\approx \\delta v\\,t \\]</div>
            ${Sym.where([['\\delta v', N`velocity error left after the burn`, 'm/s'], ['\\delta r', N`resulting position error after the coast`, 'm'], 't'], N`A 1 m/s error after TLI, three days from the Moon, is a few hundred kilometres. Gravity changes the exact figure but not its size.`)}
            <p>${T`This is why there are <b>midcourse corrections</b>. Their Δv is a few metres per second, cheap compared with the burns before, and it buys back an error that would otherwise grow for days. Apollo planned four windows on the way out; they flew them only when tracking showed they were needed (Apollo 11 flew one, MCC-2). The earlier a correction, the smaller it can be, but the less the ground knows about the error. This trade is the heart of module ${Progress.code('navigation')}.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Mission rules and aborts`}</h2>
          <div class="prose">
            <p>${T`The worst moment to decide what is acceptable is when something has just broken. <b>Mission rules</b> are written before flight, by the people who will fly and run it: which failure is a no-go for which event, which failure forces an abort, how much margin must remain. In real time, the Flight Director applies the rule and spends the time thinking about what the rule did not foresee.`}</p>
            <p>${T`An abort is a plan prepared in advance for every phase:`}</p>
            <ul>
              <li>${T`<b>On the pad and in ascent.</b> The Apollo launch escape tower pulled the command module away from the rocket in the first minutes. Later in ascent, the abort modes used the service module’s engine, in the end to reach an orbit rather than to return at once.`}</li>
              <li>${T`<b>Free return.</b> After TLI the early Apollo flights flew a trajectory that swings around the Moon and returns to Earth with no engine burn at all. Later flights chose a trajectory with access to more landing sites and gave up part of that guarantee; module ${Progress.code('homeward')} covers the free return.`}</li>
              <li>${T`<b>Direct abort.</b> A burn right away that turns the spacecraft around. It is quick, but it needs a large Δv from a healthy main engine.`}</li>
              <li>${T`<b>Lifeboat.</b> On Apollo 13 an oxygen tank failed after TLI, and the service module could no longer be used. The crew moved into the lunar module, and its descent engine did the burns that brought them home. The plan survived because a consumables margin existed for the lunar module.`}</li>
            </ul>
            <p>${T`The choice among abort options is arithmetic with three checks: is the engine you need healthy, is the Δv available larger than the Δv required plus its dispersion, and do the consumables outlast the trip with a reserve? The fastest option that passes all three wins. You practise it in the lab.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.8</span>${T`Three ways to run the mission`}</h2>
          <div class="prose">
            <p>${T`In the course exercises you operate the same mission in three modes. They differ in who computes and who carries the workload.`}</p>
          </div>
          <div class="mcc-scroll"><table class="data notation"><thead><tr><th>${T`Mode`}</th><th>${T`Who computes`}</th><th>${T`PAD flow`}</th><th>${T`Crew workload`}</th></tr></thead><tbody>
            <tr><td><b>${T`Solo`}</b></td><td>${T`The crew, alone.`}</td><td>${T`None: you compute, enter and fly your own burns.`}</td><td>${T`Highest: navigation, computation and flying together.`}</td></tr>
            <tr><td><b>${T`Apollo`}</b></td><td>${T`Mission Control computes; the crew checks.`}</td><td>${T`MC computes, CAPCOM voices, the crew copies, reads back, checks for sense, then enters.`}</td><td>${T`Moderate: the crew calculates a quick check and flies.`}</td></tr>
            <tr><td><b>${T`MC-only`}</b></td><td>${T`Mission Control, entirely.`}</td><td>${T`MC computes and voices; the crew copies, reads back and executes.`}</td><td>${T`Lowest on computation. The crew still reads back, and a wrong PAD is flown as written.`}</td></tr>
          </tbody></table></div>
          <div class="prose"><p>${T`In every mode the flow ends in the same place: numbers in the computer, attitude held, engine on at TIG. What changes is whether anyone else has seen the numbers before you do.`}</p></div>
        </section>

        <section class="section">
          <h2><span class="idx">0.9</span>${T`Lab: the mission planning desk`}</h2>
          <div class="prose"><p>${T`Three tabs. The <b>Δv budget</b> holds an Apollo-like lunar mission with its stages, masses and three-sigma dispersions. Change anything and the margins follow. The <b>PAD worksheet</b> is a form for maneuver, TEI and entry PADs, which you can fill in, check and print, with a readback drill. The <b>Abort decision</b> asks you to choose among options with the clock running. The figures are rounded training values, close to Apollo but not exact.`}</p></div>
          <div class="lab tl-lab" id="mcc-lab">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Mission planning desk`}</h3><span class="spacer"></span>
              <div class="seg" id="mcc-tabs" role="group" aria-label="${T`Desk`}">
                <button data-v="budget" aria-pressed="true">${T`Δv budget`}</button><button data-v="pad" aria-pressed="false">${T`PAD worksheet`}</button><button data-v="abort" aria-pressed="false">${T`Abort decision`}</button>
              </div>
            </div>
            <div class="mcc-pane" data-pane="budget">${budgetPane()}</div>
            <div class="mcc-pane" data-pane="pad" hidden>${padPane()}</div>
            <div class="mcc-pane" data-pane="abort" hidden>${abortPane()}</div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('mcc', { math: 'log', mathLabel: N`Exponentials and logarithms.` })}`;

      const root = page.querySelector('#mcc-lab');
      UI.seg(root, '#mcc-tabs', (v) => root.querySelectorAll('.mcc-pane').forEach((p) => { p.hidden = p.dataset.pane !== v; }));
      mountBudget(root.querySelector('[data-pane=budget]'));
      mountPad(root.querySelector('[data-pane=pad]'));
      mountAbort(root.querySelector('[data-pane=abort]'));
      Practice.embed(page.querySelector('#practice-slot'), 'mcc', 3);
    },
  });

  /* ---------------- Tab 1: budget ---------------- */
  function budgetPane() {
    const rows = M.STAGE_ORDER.map((id) => {
      const s = M.STAGES[id];
      return `<tr data-id="${id}"><td><b>${T(s.name)}</b></td>
        <td><input type="text" inputmode="decimal" data-k="dry" aria-label="${T(s.name)}: ${T`dry mass (kg)`}"></td>
        <td><input type="text" inputmode="decimal" data-k="prop" aria-label="${T(s.name)}: ${T`propellant (kg)`}"></td>
        <td><input type="text" inputmode="decimal" data-k="isp" aria-label="${T(s.name)}: Isp"></td>
        <td data-o="cap"></td><td data-o="plan"></td><td data-o="rem"></td><td data-o="s3"></td><td data-o="mdv"></td><td data-o="mpct"></td><td data-o="v"></td></tr>`;
    }).join('');
    const mv = M.maneuvers('dps').map((m) => `<tr data-m="${m.id}"><td>${T(MAN_NAMES[m.id])}</td><td>${T(PHASES[m.phase])}</td><td data-o="st"></td><td data-o="dv"></td><td data-o="use"></td><td data-o="s3"></td></tr>`).join('');
    return `
      <div class="mcc-controls">
        <div class="ctl"><label for="mcc-scen"><span>${T`Scenario`}</span></label><select id="mcc-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
        <div class="ctl"><label for="mcc-cargo"><span>${T`Payload on the descent stage (kg)`}</span></label><input type="text" inputmode="decimal" id="mcc-cargo"></div>
        <div class="ctl"><label for="mcc-doi"><span>${T`Descent orbit insertion flown by`}</span></label><select id="mcc-doi"><option value="dps">${T`LM descent engine`}</option><option value="sps">${T`CSM, LM docked`}</option></select></div>
        <div class="ctl"><label for="mcc-comb"><span>${T`Combining the dispersions`}</span></label><select id="mcc-comb"><option value="rss">${T`root-sum-square`}</option><option value="linear">${T`straight sum (worst case)`}</option></select></div>
        <div class="ctl"><label for="mcc-rule"><span>${T`Margin rule (%)`}</span></label><input type="text" inputmode="decimal" id="mcc-rule"></div>
        <button class="btn" id="mcc-reset">${T`Reset scenario`}</button>
      </div>
      <p class="note" id="mcc-task" style="margin:0"></p>
      <div style="display:flex;flex-direction:column;gap:.5rem;min-width:0"><h4>${T`Stages and margins`}</h4>
          <div class="mcc-scroll"><table class="data"><thead><tr><th>${T`Stage`}</th><th>${T`dry (kg)`}</th><th>${T`propellant (kg)`}</th><th>Isp (s)</th><th>${T`tank (kg)`}</th><th>${T`plan Δv`}</th><th>${T`remaining Δv`}</th><th>3σ</th><th>${T`margin (m/s)`}</th><th>${T`margin (%)`}</th><th></th></tr></thead><tbody id="mcc-stages">${rows}</tbody></table></div>
        </div>
      <div class="mcc-cols">
        <div style="display:flex;flex-direction:column;gap:.8rem;min-width:0">
          <h4>${T`Verdict`}</h4>
          <div id="mcc-verdict"></div>
          <dl class="readout" id="mcc-read"></dl>
        </div>
        <div style="display:flex;flex-direction:column;gap:.8rem;min-width:0">
          <h4>${T`Check: combine four errors`}</h4>
          <p class="note" id="mcc-rss-q" style="margin:0"></p>
          <div class="ctl"><label for="mcc-rss-a"><span>${T`Combined 1σ (m/s)`}</span></label><input type="text" inputmode="decimal" id="mcc-rss-a"></div>
          <div class="btn-row"><button class="btn primary" id="mcc-rss-go">${T`Check`}</button><button class="btn" id="mcc-rss-new">${T`New case`}</button></div>
          <p class="note" id="mcc-rss-res" style="margin:0" aria-live="polite"></p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem"><h4>${T`Maneuvers`}</h4>
        <div class="mcc-scroll"><table class="data"><thead><tr><th>${T`Maneuver`}</th><th>${T`Phase`}</th><th>${T`Stage`}</th><th>Δv (m/s)</th><th>${T`propellant (kg)`}</th><th>3σ (m/s)</th></tr></thead><tbody id="mcc-mv">${mv}</tbody></table></div>
      </div>`;
  }

  function mountBudget(root) {
    const $ = (s) => root.querySelector(s);
    let st, cargo, doiBy, comb, rule, touched = false, scen = 'nominal';
    const clone = () => JSON.parse(JSON.stringify(M.STAGES));
    function load(k) {
      scen = k; st = clone(); cargo = SCEN[k].cargo; doiBy = 'dps'; comb = 'rss'; rule = 5; touched = false;
      for (const tr of root.querySelectorAll('#mcc-stages tr')) for (const inp of tr.querySelectorAll('input')) inp.value = UI.dec(String(st[tr.dataset.id][inp.dataset.k]));
      $('#mcc-cargo').value = UI.dec(String(cargo)); $('#mcc-doi').value = doiBy; $('#mcc-comb').value = comb; $('#mcc-rule').value = UI.dec(String(rule));
      $('#mcc-task').textContent = T(SCEN[k].task);
      update();
    }
    function readInputs() {
      for (const tr of root.querySelectorAll('#mcc-stages tr')) for (const inp of tr.querySelectorAll('input')) { const v = P(inp.value); if (isFinite(v) && v > 0) st[tr.dataset.id][inp.dataset.k] = v; }
      const c = P($('#mcc-cargo').value); if (isFinite(c) && c >= 0) cargo = c;
      const r = P($('#mcc-rule').value); if (isFinite(r)) rule = r;
      doiBy = $('#mcc-doi').value; comb = $('#mcc-comb').value;
    }
    function update() {
      const b = M.budget({ stages: st, cargo, doiBy, combine: comb });
      const goes = {};
      let worst = null;
      for (const tr of root.querySelectorAll('#mcc-stages tr')) {
        const id = tr.dataset.id, s = b.stages[id], o = (k) => tr.querySelector(`[data-o=${k}]`);
        o('cap').textContent = f(M.STAGES[id].cap, 0);
        o('plan').textContent = f(s.planned, 0);
        const reserve = !s.depletion && s.planned > 0;
        o('rem').textContent = reserve ? f(s.dvRem, 0) : '—';
        o('s3').textContent = s.s3 ? f(s.s3, 1) : '—';
        o('mdv').textContent = reserve ? f(s.marginDv, 0) : '—';
        o('mpct').textContent = reserve ? f(s.marginPct, 1) : '—';
        const over = st[id].prop > M.STAGES[id].cap + 1e-6;
        const ok = reserve && s.marginPct >= rule - 1e-9 && !over;
        if (reserve) { goes[id] = ok; if (!worst || s.marginPct < worst.marginPct) worst = s; }
        const v = o('v');
        v.textContent = !reserve ? T`depleted` : over ? T`over tank` : ok ? 'GO' : 'NO-GO';
        v.className = reserve ? (ok ? 'ok' : 'no') : '';
      }
      for (const tr of root.querySelectorAll('#mcc-mv tr')) {
        const r = b.rows.find((x) => x.id === tr.dataset.m);
        tr.querySelector('[data-o=st]').textContent = T(M.STAGES[r.stage].name);
        tr.querySelector('[data-o=dv]').textContent = f(r.dv, 0);
        tr.querySelector('[data-o=use]').textContent = f(r.used, 0);
        tr.querySelector('[data-o=s3]').textContent = r.s3 ? f(r.s3, 0) : '—';
      }
      const all = Object.values(goes).every(Boolean);
      const ver = $('#mcc-verdict');
      ver.innerHTML = `<span class="mcc-verdict ${all ? 'mcc-ok' : 'mcc-no'}">${all ? T`GO: every stage meets ${f(rule, 1)} %` : T`NO-GO: a stage is below ${f(rule, 1)} %`}</span>`;
      const d = b.stages.dps, sp = b.stages.sps, ap = b.stages.aps;
      const hov = Math.max(0, M.hoverFromDv(d.marginDv));
      const bt = (s, eng) => Math.max(0, M.burnTime(st[s].isp, b.stages[s].mEnd, Math.max(0, b.stages[s].marginDv), M.ENGINES[eng].F));
      const rssAll = M.rss(b.rows.map((r) => r.s3));
      $('#mcc-read').innerHTML = `
        <dt>${T`Thinnest margin`}</dt><dd class="hl">${worst ? T(M.STAGES[worst.id].name) + ' ' + f(worst.marginPct, 1) + ' %' : '—'}</dd>
        <dt>${T`Descent margin as hover`}</dt><dd>${f(hov, 0)} s</dd>
        <dt>${T`CSM margin as SPS burn`}</dt><dd>${f(bt('sps', 'SPS'), 0)} s</dd>
        <dt>${T`Ascent margin as APS burn`}</dt><dd>${f(bt('aps', 'APS'), 0)} s</dd>
        <dt>${T`Whole-mission 3σ (RSS)`}</dt><dd>${f(rssAll, 0)} m/s</dd>
        <dt>${T`Ascent Δv (fixed)`}</dt><dd>${f(b.ascentDv, 0)} m/s</dd>`;
      // objective: the heavier payload, fixed by the candidate, with at least 5 % on every stage
      if (touched && scen === 'heavy') {
        const okAll = M.STAGE_ORDER.filter((id) => !b.stages[id].depletion && b.stages[id].planned > 0).every((id) => b.stages[id].marginPct >= 5 && st[id].prop <= M.STAGES[id].cap + 1e-6);
        if (okAll) Progress.done('mcc', 'margin');
      }
    }
    root.querySelectorAll('input[type=text], select').forEach((el) => {
      if (el.id === 'mcc-scen' || el.id === 'mcc-rss-a') return;
      el.addEventListener('input', () => { touched = true; readInputs(); update(); });
      el.addEventListener('change', () => { touched = true; readInputs(); update(); });
    });
    $('#mcc-scen').addEventListener('change', (e) => load(e.target.value));
    $('#mcc-reset').addEventListener('click', () => load(scen));

    // RSS check
    let src = null;
    const NAMES = [N`navigation`, N`cutoff`, N`pointing`, N`timing`];
    function newCase() {
      src = [0, 1, 2, 3].map(() => rnd(5, 40, 1) / 10);
      $('#mcc-rss-q').innerHTML = T`Independent 1σ errors on one burn: ${NAMES.map((n, i) => `${T(n)} ${f(src[i], 1)}`).join(', ')} (m/s).`;
      $('#mcc-rss-a').value = ''; $('#mcc-rss-res').textContent = '';
    }
    $('#mcc-rss-new').addEventListener('click', newCase);
    $('#mcc-rss-go').addEventListener('click', () => {
      const a = P($('#mcc-rss-a').value), tr = M.rss(src), lin = M.linear(src), res = $('#mcc-rss-res');
      if (!isFinite(a)) { res.textContent = T`Type a number first.`; return; }
      if (Math.abs(a - tr) <= 0.01 * tr + 0.005) { res.textContent = T`Correct: ${f(tr, 2)} m/s.`; res.className = 'note mcc-ok'; Progress.done('mcc', 'rss'); }
      else {
        res.className = 'note mcc-no';
        res.textContent = Math.abs(a - lin) <= 0.02 * lin ? T`That is the straight sum, ${f(lin, 1)} m/s. Independent errors add as squares.` : T`Not yet. Square each error, add them, take the square root.`;
      }
    });
    newCase();
    load('nominal');
  }

  /* ---------------- Tab 2: PAD ---------------- */
  function padPane() {
    return `
      <div class="mcc-controls">
        <div class="ctl"><label>${T`PAD type`}</label><div class="seg" id="mcc-padkind" role="group" aria-label="${T`PAD type`}">
          ${Object.entries(PADS).map(([k, p], i) => `<button data-v="${k}" aria-pressed="${i === 0}">${T(p.name)}</button>`).join('')}</div></div>
      </div>
      <div class="mcc-cols">
        <div style="display:flex;flex-direction:column;gap:.7rem;min-width:0"><h4>${T`Worksheet`}</h4>
          <p class="note" style="margin:0">${T`Fill in the form. Decimal commas are accepted. The check recomputes the total, the attitude and the burn time from your three components, the mass and the engine.`}</p>
          <div class="mcc-form" id="mcc-wf"></div>
          <div class="btn-row"><button class="btn primary" id="mcc-wcheck">${T`Check my arithmetic`}</button><button class="btn" id="mcc-wprint">${T`Print worksheet`}</button><button class="btn" id="mcc-wblank">${T`Print blank PAD`}</button></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.7rem;min-width:0"><h4>${T`Readback drill`}</h4>
          <p class="note" style="margin:0">${T`CAPCOM voices a PAD. Read it back into the form below, field by field. Every number must match.`}</p>
          <div class="mcc-padbox" id="mcc-given"></div>
          <div class="btn-row"><button class="btn" id="mcc-new">${T`New PAD`}</button><button class="btn" id="mcc-hide">${T`Hide the PAD`}</button></div>
          <div class="mcc-form" id="mcc-rf"></div>
          <div class="btn-row"><button class="btn primary" id="mcc-rcheck">${T`Check readback`}</button></div>
          <p class="note" id="mcc-rres" style="margin:0" aria-live="polite"></p>
        </div>
      </div>`;
  }

  function mountPad(root) {
    const $ = (s) => root.querySelector(s);
    let kind = 'man', given = null;
    const input = (id, k) => {
      const fl = FLD[k];
      if (fl.kind === 'eng') return `<label><span>${T(fl.label)}</span><select id="${id}-${k}">${Object.entries(ENGINES).map(([e, n]) => `<option value="${e}">${T(n)}</option>`).join('')}</select><span class="mark" id="${id}-${k}-m"></span></label>`;
      return `<label><span>${T(fl.label)}</span><input type="text" inputmode="${fl.kind === 'num' ? 'decimal' : 'text'}" id="${id}-${k}" autocomplete="off"><span class="mark" id="${id}-${k}-m"></span></label>`;
    };
    const wvals = {};
    function build() {
      // keep the typed values when switching between PAD types
      root.querySelectorAll('#mcc-wf [id]').forEach((el) => { if (el.matches('input,select')) wvals[el.id.replace('w-', '')] = el.value; });
      $('#mcc-wf').innerHTML = PADS[kind].keys.map((k) => input('w', k)).join('');
      for (const k of PADS[kind].keys) { const el = $('#w-' + k); if (el && wvals[k] != null) el.value = wvals[k]; }
      $('#mcc-rf').innerHTML = PADS[kind].rb.map((k) => input('r', k)).join('');
      $('#mcc-wcheck').hidden = !PADS[kind].calc;
      newPad();
    }
    function newPad() {
      given = genPad(kind);
      $('#mcc-given').innerHTML = `<b class="note">${T(PADS[kind].name)}</b><dl>${PADS[kind].rb.map((k) => `<dt>${T(FLD[k].label)}</dt><dd>${fmtFld(k, given[k])}</dd>`).join('')}</dl>`;
      $('#mcc-given').hidden = false; $('#mcc-hide').textContent = T`Hide the PAD`;
      $('#mcc-rres').textContent = '';
      root.querySelectorAll('#mcc-rf input').forEach((el) => { el.value = ''; $('#' + el.id + '-m').textContent = ''; });
    }
    UI.seg(root, '#mcc-padkind', (v) => { kind = v; build(); });
    $('#mcc-new').addEventListener('click', newPad);
    $('#mcc-hide').addEventListener('click', () => { const h = !$('#mcc-given').hidden; $('#mcc-given').hidden = h; $('#mcc-hide').textContent = h ? T`Show the PAD` : T`Hide the PAD`; });

    $('#mcc-rcheck').addEventListener('click', () => {
      let bad = 0, empty = 0;
      for (const k of PADS[kind].rb) {
        const el = $('#r-' + k), mk = $('#r-' + k + '-m'), fl = FLD[k];
        const raw = el.value.trim();
        if (!raw) { empty++; mk.textContent = ''; continue; }
        const ok = fl.kind === 'get' ? M.parseGET(raw) === given[k] : near(P(raw), given[k], fl.d);
        mk.textContent = ok ? '✓' : '✗'; mk.className = 'mark ' + (ok ? 'mcc-ok' : 'mcc-no');
        if (!ok) bad++;
      }
      const res = $('#mcc-rres');
      if (empty) res.textContent = T`${empty} field(s) still empty.`;
      else if (bad) res.textContent = T`${bad} field(s) differ from the PAD. CAPCOM would say: say again.`;
      else { res.textContent = T`Readback correct.`; Progress.done('mcc', 'pad'); }
    });

    $('#mcc-wcheck').addEventListener('click', () => {
      const num = (k) => P($('#w-' + k).value);
      const p = num('dvp'), n = num('dvn'), r = num('dvr'), m0 = num('m0'), e = $('#w-eng').value;
      const mark = (k, ok, exp, d) => { const mk = $('#w-' + k + '-m'); mk.textContent = ok ? '✓' : T`✗ expected ${f(exp, d)}`; mk.className = 'mark ' + (ok ? 'mcc-ok' : 'mcc-no'); };
      if (![p, n, r].every(isFinite)) { $('#w-dv-m').textContent = T`Enter the three components first.`; return; }
      const tot = M.padTotal(p, n, r), al = M.padAlpha(p, r), be = M.padBeta(p, n, r);
      mark('dv', near(num('dv'), tot, 1) || Math.abs(num('dv') - tot) <= 0.0015 * tot, tot, 1);
      mark('alpha', Math.abs(num('alpha') - al) <= 0.15, al, 1);
      mark('beta', Math.abs(num('beta') - be) <= 0.15, be, 1);
      if (isFinite(m0) && m0 > 0) { const en = M.ENGINES[e], tb = M.burnTime(en.isp, m0, tot, en.F); mark('tb', Math.abs(num('tb') - tb) <= 0.01 * tb + 0.1, tb, 1); }
      else $('#w-tb-m').textContent = T`Enter the mass first.`;
    });
    const wsVals = () => { const v = {}; for (const k of PADS[kind].keys) { const el = $('#w-' + k); v[k] = el ? (el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : el.value) : ''; } return v; };
    $('#mcc-wprint').addEventListener('click', () => printSheet(kind, wsVals()));
    $('#mcc-wblank').addEventListener('click', () => printSheet(kind, null));
    build();
  }

  /* ---------------- Tab 3: abort ---------------- */
  const ABORT_CASES = {
    a: { label: N`Service module engine failed`, spsGo: false, cons: 125,
      text: N`Two days after TLI, a tank failure takes out the service module’s main engine. The crew is alive and the lunar module is intact. Life support in the lunar module, used as a lifeboat, lasts about 125 hours.` },
    b: { label: N`Everything healthy, one failure`, spsGo: true, cons: 200,
      text: N`Two days after TLI, a fault in a navigation system forces an abort decision. Both main engines are healthy and the consumables are generous at about 200 hours.` },
  };
  const OPTS = [
    { id: 'A', label: N`Direct abort now with the service module engine`, engine: 'SPS', dv: 1050, s3: 25, hours: 62 },
    { id: 'B', label: N`Direct abort now with the lunar descent engine`, engine: 'DPS', dv: 1050, s3: 25, hours: 62 },
    { id: 'C', label: N`Stay on the free return, trim it with the descent engine`, engine: 'DPS', dv: 10, s3: 5, hours: 118 },
    { id: 'D', label: N`Free return plus a speed-up burn with the descent engine after closest approach`, engine: 'DPS', dv: 260, s3: 12, hours: 86 },
  ];
  const STACK = 43830;   // CSM + LM together
  function abortEngines(c) {
    return { SPS: { go: c.spsGo, dvAvail: M.dv(314, STACK, 18400) }, DPS: { go: true, dvAvail: M.dv(311, STACK, 8200) } };
  }
  function abortPane() {
    return `
      <div class="mcc-controls"><div class="ctl"><label for="mcc-acase"><span>${T`Situation`}</span></label><select id="mcc-acase">${Object.entries(ABORT_CASES).map(([k, c]) => `<option value="${k}">${T(c.label)}</option>`).join('')}</select></div></div>
      <p class="note" id="mcc-atext" style="margin:0"></p>
      <div class="mcc-cols">
        <div style="display:flex;flex-direction:column;gap:.6rem;min-width:0"><h4>${T`Status`}</h4><dl class="readout" id="mcc-astat"></dl>
          <p class="note" style="margin:0">${T`Rule: the fastest option wins, provided the engine is go, the Δv available covers the burn plus its 3σ, and the trip fits within the consumables minus a 10 % reserve.`}</p></div>
        <div style="display:flex;flex-direction:column;gap:.6rem;min-width:0"><h4>${T`Options`}</h4><div class="mcc-opts" id="mcc-aopts"></div>
          <div class="btn-row"><button class="btn primary" id="mcc-acommit">${T`Commit to this abort`}</button></div>
          <p class="note" id="mcc-ares" style="margin:0" aria-live="polite"></p></div>
      </div>
      <div class="mcc-scroll" id="mcc-atab"></div>`;
  }
  function mountAbort(root) {
    const $ = (s) => root.querySelector(s);
    let cs = 'a';
    function show() {
      const c = ABORT_CASES[cs], en = abortEngines(c);
      $('#mcc-atext').textContent = T(c.text);
      $('#mcc-astat').innerHTML = `
        <dt>SPS</dt><dd class="${c.spsGo ? 'mcc-ok' : 'mcc-no'}">${c.spsGo ? 'GO' : 'NO-GO'}</dd>
        <dt>${T`Δv available, SPS`}</dt><dd>${f(en.SPS.dvAvail, 0)} m/s</dd>
        <dt>DPS</dt><dd class="mcc-ok">GO</dd>
        <dt>${T`Δv available, DPS`}</dt><dd>${f(en.DPS.dvAvail, 0)} m/s</dd>
        <dt>${T`Consumables`}</dt><dd>${c.cons} h</dd>`;
      $('#mcc-aopts').innerHTML = OPTS.map((o) => `<label class="opt"><input type="radio" name="mcc-ao" value="${o.id}"><span><b>${o.id}.</b> ${T(o.label)}<br><span class="note">${T`Δv ${f(o.dv, 0)} m/s, 3σ ${f(o.s3, 0)} m/s, ${o.hours} h to splashdown`}</span></span></label>`).join('');
      $('#mcc-ares').textContent = ''; $('#mcc-atab').innerHTML = '';
    }
    $('#mcc-acase').addEventListener('change', (e) => { cs = e.target.value; show(); });
    $('#mcc-acommit').addEventListener('click', () => {
      const sel = root.querySelector('input[name=mcc-ao]:checked');
      const res = $('#mcc-ares');
      if (!sel) { res.textContent = T`Pick an option first.`; return; }
      const c = ABORT_CASES[cs], en = abortEngines(c), reserve = 0.1;
      const best = M.bestOption(OPTS, en, c.cons, reserve), idx = OPTS.findIndex((o) => o.id === sel.value);
      const rows = OPTS.map((o, i) => { const s = M.screen(o, en, c.cons, reserve);
        return `<tr><td>${o.id}</td><td class="${s.engineGo ? 'ok' : 'no'}">${s.engineGo ? 'GO' : 'NO-GO'}</td><td class="${s.dvMargin >= 0 ? 'ok' : 'no'}">${f(s.dvMargin, 0)}</td><td class="${s.tMargin >= 0 ? 'ok' : 'no'}">${f(s.tMargin, 0)}</td><td>${o.hours}</td><td>${s.ok ? (i === best ? T`passes, fastest` : T`passes`) : T`fails`}</td></tr>`; }).join('');
      $('#mcc-atab').innerHTML = `<table class="data"><thead><tr><th>${T`Option`}</th><th>${T`engine`}</th><th>${T`Δv margin (m/s)`}</th><th>${T`time margin (h)`}</th><th>${T`trip (h)`}</th><th>${T`result`}</th></tr></thead><tbody>${rows}</tbody></table>`;
      if (idx === best) { res.className = 'note mcc-ok'; res.textContent = T`Right choice: option ${OPTS[best].id} is the fastest that passes all three checks.`; Progress.done('mcc', 'abort'); }
      else { res.className = 'note mcc-no'; res.textContent = T`Not the best choice. Read the table: look for the failed checks and for a faster option that passes.`; }
    });
    show();
  }
})();
