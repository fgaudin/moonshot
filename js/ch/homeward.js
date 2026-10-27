/* Chapter: Planning the Return. Trans-Earth injection from lunar orbit, patched conics in reverse.
   Lab: trans-Earth planner. Physics lives in homeward.phys.js (Phys_homeward). */
(function () {
  'use strict';
  const { C } = Phys;
  const Ph = window.Phys_homeward;
  const muE = C.muE, muM = C.muM, RE = C.RE, RM = C.RM, D = C.DEM;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const deg = 180 / Math.PI;

  Progress.register('homeward', {
    name: N`Planning the Return`, topic: 'homeward', glyph: 'transfer',
    briefing: N`The landing is done, {name}, and the hardest burn of the flight is still ahead. There is no second chance at trans-Earth injection: the engine fires once, behind the Moon, out of radio contact. In this module you work the patched conics backwards, from the Earth entry corridor to the burn in lunar orbit. You choose the speed, the place and the revolution, and you learn how little room for error the corridor leaves.`,
    objectives: [
      { id: 'dv', text: N`Nominal return: execute a trans-Earth injection with the Δv from your own hand calculation (within 10 m/s)` },
      { id: 'corr', text: N`Aim a return burn yourself, without Mission Control’s solver, so the entry angle falls inside the corridor` },
      { id: 'rev', text: N`Pick the lunar revolution that puts splashdown inside the requested window, in the corridor` },
      { id: 'mcc', text: N`Fix a dispersed burn with a midcourse correction of 4 m/s or less so the entry angle is back in the corridor` },
      { id: 'qual', text: N`Qualify: answer 2 trans-Earth problems correctly` },
    ],
    debrief: N`You can now turn an entry corridor into a burn in lunar orbit, and you know why the burn is so exact and why the way home needs a correction, {name}. Next comes the other end of the trip: the entry itself.`,
  });

  /* ---------------- Practice ---------------- */
  const hand = (alt, rpAlt) => Ph.handMinEnergy(alt * 1e3, rpAlt * 1e3);
  const registerPractice = () => Practice.register('homeward', N`Trans-Earth return`, [
    { title: N`The Moon’s orbital speed`, make() {
      const d = rnd(356, 406, 2) * 1e3, v = Math.sqrt(muE / (d * 1e3));
      return { q: T`The Moon circles the Earth on a nearly circular orbit at a distance of <b>${f(d, 0)} km</b>. What is its orbital speed? (Earth: μ = 398 600 km³/s²)`, answer: v, unit: 'm/s', tol: 0.01,
        hint: T`Circular speed: v = √(μ/r). Use metres: μ = 3.986 × 10¹⁴ m³/s².`,
        sol: R`\[ v_\mathrm{Moon} = \sqrt{\frac{\mu_\oplus}{D}} = \sqrt{\frac{3.986\times10^{14}}{${f(d * 1e3 / 1e6, 1)}\times10^{6}}} = ${f(v, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Apogee speed of the return ellipse`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp);
      return { q: T`A spacecraft returns on an Earth ellipse with its apogee at the Moon’s distance (384 400 km) and a vacuum perigee at an altitude of <b>${f(hp, 0)} km</b> (R⊕ = 6 378 km). What is its speed at apogee?`, answer: h.va, unit: 'm/s', tol: 0.01,
        hint: T`Semi-major axis a = (r<sub>a</sub> + r<sub>p</sub>)/2, then vis-viva: v² = μ(2/r − 1/a). Or use angular momentum: v<sub>a</sub> = v<sub>p</sub> r<sub>p</sub>/r<sub>a</sub>.`,
        sol: R`\[ r_p = ${f((RE + hp * 1e3) / 1e3, 0)}\ \mathrm{km},\quad a = \frac{r_a + r_p}{2} = ${f(h.a / 1e3, 0)}\ \mathrm{km} \]
          \[ v_a = \sqrt{\mu_\oplus\left(\frac{2}{r_a} - \frac{1}{a}\right)} = ${f(h.va, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Excess speed at the Moon`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp);
      return { q: T`The return ellipse has its apogee at the Moon’s distance and a vacuum perigee at <b>${f(hp, 0)} km</b> altitude. The Moon moves at ${f(h.vM, 1)} m/s. At the Moon, the spacecraft must move at the ellipse’s apogee speed, in the same direction. What is its hyperbolic excess speed v<sub>∞</sub> relative to the Moon?`, answer: h.vinf, unit: 'm/s', tol: 0.01,
        hint: T`Apogee speed first (vis-viva). The excess speed is the vector difference of the two velocities; they are parallel, so it is a plain subtraction. The Moon is faster: you leave the Moon backwards.`,
        sol: R`\[ v_a = ${f(h.va, 1)}\ \mathrm{m/s},\qquad v_\infty = v_\mathrm{Moon} - v_a = ${f(h.vM, 1)} - ${f(h.va, 1)} = ${f(h.vinf, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Trans-Earth injection Δv`, make() {
      const alt = rnd(80, 150, 10), vinf = rnd(780, 1300, 10), r = RM + alt * 1e3, vc = Math.sqrt(muM / r), vh = Math.sqrt(vinf * vinf + 2 * muM / r);
      return { q: T`A spacecraft circles the Moon at <b>${f(alt, 0)} km</b> altitude (R☾ = 1 737 km, μ☾ = 4 903 km³/s²). To come home it needs a hyperbolic excess speed of <b>${f(vinf, 0)} m/s</b>. What Δv must the trans-Earth injection burn give?`, answer: vh - vc, unit: 'm/s', tol: 0.01,
        hint: T`Speed at the burn on the hyperbola: v² = v<sub>∞</sub>² + 2μ/r. Subtract the circular speed √(μ/r).`,
        sol: R`\[ r = ${f(r / 1e3, 0)}\ \mathrm{km},\quad v_c = \sqrt{\frac{\mu_☾}{r}} = ${f(vc, 1)}\ \mathrm{m/s},\quad v_{hyp} = \sqrt{v_\infty^2 + \frac{2\mu_☾}{r}} = ${f(vh, 1)}\ \mathrm{m/s} \]
          \[ \Delta v = v_{hyp} - v_c = ${f(vh - vc, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Return time on the ellipse`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp), th = h.tof / 3600;
      return { q: T`A spacecraft returns on an Earth ellipse with its apogee at the Moon’s distance (384 400 km) and a vacuum perigee at <b>${f(hp, 0)} km</b> altitude. How many hours does it take from apogee to perigee? (Half the period.)`, answer: th, unit: 'h', tol: 0.01,
        hint: T`Half the period: T/2 = π √(a³/μ), with a = (r<sub>a</sub> + r<sub>p</sub>)/2. Convert seconds to hours at the end.`,
        sol: R`\[ a = ${f(h.a / 1e3, 0)}\ \mathrm{km},\quad \frac{T}{2} = \pi\sqrt{\frac{a^3}{\mu_\oplus}} = ${f(h.tof, 0)}\ \mathrm{s} = ${f(th, 1)}\ \mathrm{h} \]` };
    } },
  ], [
    { q: N`Why is the trans-Earth injection burn done on the far side of the Moon?`, opts: [N`The ejection direction is set by the geometry: the spacecraft must leave the Moon backwards, against its orbital motion, which is the far-side direction. Radio contact is lost there anyway.`, N`The Moon’s gravity is weaker on the far side`, N`The engine works better out of sight of the Earth`, N`The far side is where the Earth’s gravity pulls the spacecraft out of lunar orbit`], a: 0, why: N`The Moon moves around the Earth. To fall towards the Earth, the spacecraft must be slower than the Moon in the Earth frame, so it must leave against the Moon’s motion. Seen from the Moon, that is the direction of the far side. The occultation by the Moon is a consequence, not the reason.` },
    { q: N`The entry corridor is about 2° wide. A trans-Earth burn error of 1 m/s moves the perigee altitude by about 150 km. What does that tell you?`, opts: [N`One burn cannot be accurate enough: the crew relies on midcourse corrections to fine-tune the perigee during the way home`, N`The burn must be repeated until the error is zero`, N`The corridor is irrelevant until the atmosphere is reached`, N`The error is harmless, because the atmosphere corrects it`], a: 0, why: N`The corridor is about 55 km tall in perigee altitude. A burn error of a metre per second is several times that. Tracking measures the real trajectory after the burn, and small midcourse burns, a few metres per second, correct the rest.` },
    { q: N`A spacecraft is in lunar orbit and misses the planned burn by one revolution (about 2 hours). With the same burn, what changes?`, opts: [N`Splashdown comes about 2 hours later, and the Earth has turned about 30°, so the landing longitude shifts by that much`, N`The entry angle changes by 30°`, N`The trip takes 2 hours longer, but splashdown is at the same place`, N`Nothing changes: the revolution is irrelevant`], a: 0, why: N`The geometry of the burn relative to the Moon and the Earth is the same, so the trajectory is the same. Only the clock moves. The Earth turns 15° per hour, so splashdown shifts by about 30° of longitude per lunar revolution.` },
  ]);
  registerPractice();

  /* ---------------- Lab scenarios ---------------- */
  const PHI_NOM = Ph.solvePhi({ alt: 110e3, dv: 1000 })[0];
  const SCEN = {
    nominal: { label: N`Nominal return, 110 km orbit`, alt: 110e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false,
      task: N`Minimum-energy return: the apogee of the return ellipse is at the Moon’s distance and the vacuum perigee is 40 km. Work out the Δv by hand (the working panel shows the method, but then the Δv objective is not credited), type it in, then find the burn position that brings the entry angle into the corridor.` },
    fast: { label: N`Faster return (costlier)`, alt: 110e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false,
      task: N`Mission rules: splashdown within 52 hours of the burn. A faster return costs more Δv. Find a Δv that meets the rule, then the burn position that keeps the entry in the corridor.` },
    landing: { label: N`Choose the revolution`, alt: 110e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false, target: 69.5 * 3600, window: 3600,
      task: N`Recovery ships will be on station for splashdown at 69.5 hours after the marker (the moment the spacecraft crosses the Earth-facing point of its orbit), plus or minus 1 hour. The burn Δv is fixed at 1000 m/s. Find the burn position, then the revolution that meets the window.` },
    disp: { label: N`Dispersed burn: correct it`, alt: 110e3, dv: 1000, phi: +PHI_NOM.toFixed(3), rev: 1, err: -0.7, mcc: true,
      task: N`The planned burn is loaded. The engine cuts off 0.7 m/s early (Mission Control will tell you after tracking). Execute, read the perigee, then enter a midcourse correction at a time you choose, of 4 m/s or less, to bring the entry angle back into the corridor.` },
  };
  const hrs = (s) => f(s / 3600, 1);

  App.chapter({
    id: 'homeward', phase: N`Trans-Earth`, title: N`Planning the Return`, lab: N`Trans-Earth planner`,
    blurb: N`One burn behind the Moon, a corridor 2° wide at the other end. Work backwards from the entry to the engine.`,
    render(page) {
      const h = Ph.handMinEnergy(110e3, 40e3);
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('homeward')} · Trans-Earth`,
          title: T`Planning the Return`,
          lede: T`Going to the Moon was the easy direction: the target was big. Coming back, the target is a slot of about 55 km in perigee altitude, 384 000 km away. This module works the patched conics backwards: from the entry corridor, to the Earth ellipse, to the Moon’s sphere of influence, to a single burn in lunar orbit.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`, T`Apollo Operations Handbook`],
        })}
        ${Progress.briefing('homeward', { theory: 'theory', lab: 'hw', math: 'refresher', mathLabel: N`Subtracting velocity vectors.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`Start at the end: the return ellipse`}</h2>
          <div class="prose">
            <p>${T`Planning the way out went forwards: from the parking orbit to the Moon. For the return, start at the Earth. The entry module (${Progress.code('entry')}) fixes what the spacecraft must do on arrival: reach the entry interface at 122 km with a flight-path angle of about −6.5°, inside a corridor from −5.3° to −7.4°. Because the speed there is nearly fixed by the energy, that angle is set by the <b>perigee</b> the spacecraft would have in vacuum. A vacuum perigee between about 12 and 65 km altitude is inside the corridor. The middle, 40 km, gives −6.4°.`}</p>
            <p>${T`Now choose the shape of the Earth orbit. The spacecraft starts at the Moon’s distance. The cheapest return is an ellipse with its <b>apogee at the Moon’s distance</b> and its perigee at 40 km altitude. It is a transfer ellipse, like the Hohmann transfer of module ${Progress.code('maneuvers')}, run downwards.`}</p>
            <div class="eq">\\[ a = \\frac{D + r_p}{2}, \\qquad v_a = \\sqrt{\\mu_\\oplus\\left(\\frac{2}{D} - \\frac{1}{a}\\right)}, \\qquad t_\\mathrm{flight} = \\pi\\sqrt{\\frac{a^3}{\\mu_\\oplus}} \\]</div>
            ${Sym.where(['a', 'Dem', ['r_p', N`perigee radius: Earth’s radius plus the vacuum perigee altitude (6 378 + 40 = 6 418 km)`, 'm'], ['v_a', N`speed of the spacecraft at the Moon’s distance, at apogee`, 'm/s'], 'muE', ['t_{flight}', N`time from apogee to perigee: half the period`, 's']], N`Half the period, because the spacecraft flies only from apogee to perigee.`)}
            <p>${T`The numbers: a = ${f(h.a / 1e3, 0)} km, v<sub>a</sub> = ${f(h.va, 1)} m/s, and a flight time of ${f(h.tof / 3600, 1)} hours, five days. The spacecraft is slow at apogee because it is high up, and it has to be: the Earth’s gravity is the only thing that brings it down.`}</p>
            ${Primer.box('ellipse')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`From the Earth’s view to the Moon’s view`}</h2>
          <div class="prose">
            <p>${T`The spacecraft must have ${f(h.va, 1)} m/s relative to the Earth at the Moon’s distance. But the Moon itself moves at v<sub>M</sub> = √(μ⊕/D) = ${f(h.vM, 1)} m/s (the real mean is 1.02 km/s). Subtract the two velocity vectors to get the velocity relative to the Moon. They are parallel, so it is a plain subtraction:`}</p>
            <div class="eq">\\[ v_\\infty = v_M - v_a = ${f(h.vM, 1)} - ${f(h.va, 1)} = ${f(h.vinf, 1)}\\ \\mathrm{m/s} \\]</div>
            ${Sym.where(['vinf', ['v_M', N`orbital speed of the Moon around the Earth, √(μ⊕/D)`, 'm/s'], ['v_a', N`speed the spacecraft needs relative to the Earth`, 'm/s']], [N`The Moon is faster than the spacecraft needs to be, so v∞ points backwards: the spacecraft leaves the Moon against the Moon’s own motion. This is the patched-conic idea of module {$0}, in reverse: there the spacecraft arrived with a v∞, here it departs with one.`, Progress.code('moon')])}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`This is the key to the whole module. To fall towards the Earth, the spacecraft must be slower than the Moon in the Earth frame. So it must leave the Moon in the direction opposite to the Moon’s motion.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`The burn: Δv and the ejection angle`}</h2>
          <div class="prose">
            <p>${T`The spacecraft sits in a circular lunar orbit of radius r (110 km altitude: r = ${f((RM + 110e3) / 1e3, 0)} km). It must leave the Moon’s gravity with a speed v<sub>∞</sub> to spare. Energy conservation on the departure hyperbola gives the speed needed at the burn, and the burn is the difference with the circular speed:`}</p>
            <div class="eq">\\[ v_{hyp} = \\sqrt{v_\\infty^2 + \\frac{2\\mu_☾}{r}}, \\qquad \\Delta v = v_{hyp} - v_c, \\qquad v_c = \\sqrt{\\frac{\\mu_☾}{r}} \\]</div>
            ${Sym.where(['vinf', 'muM', ['r', N`radius of the lunar orbit: Moon’s radius plus altitude`, 'm'], ['v_{hyp}', N`speed on the departure hyperbola at the burn point`, 'm/s'], 'vcirc', 'dv'], N`The same energy argument as for the escape speed: 2μ/r is the square of the escape speed. A hyperbolic excess speed adds to it.`)}
            <p>${T`The numbers: v<sub>c</sub> = ${f(h.vc, 1)} m/s, v<sub>hyp</sub> = ${f(h.vhyp, 1)} m/s, and <b>Δv = ${f(h.dv, 0)} m/s</b>. The real flights used about 1 km/s because they came home in about 2.5 days instead of five: a faster return needs more speed at the Moon and so a bigger burn. The lab lets you trade the two.`}</p>
            <p>${T`The burn is a prograde push at one point of the orbit, and the hyperbola then bends away. Where must the burn be? The departure hyperbola leaves along an asymptote. Its angle from the burn point (periselene) is the true anomaly at infinity, where r → ∞ in the orbit equation:`}</p>
            <div class="eq">\\[ e = 1 + \\frac{r\\,v_\\infty^2}{\\mu_☾}, \\qquad \\cos\\theta_\\infty = -\\frac{1}{e}, \\qquad \\varphi \\approx \\theta_\\infty - 90^\\circ \\]</div>
            ${Sym.where(['e', ['\\theta_\\infty', N`angle between the burn point and the asymptote direction, seen from the Moon’s centre`, N`rad or °`], ['\\varphi', N`burn position: how far before the far-side midpoint (the point opposite the Earth) the burn takes place, along the orbit`, N`°`]], N`At the burn the spacecraft moves 90° ahead of its position vector. The asymptote is θ∞ ahead of the position, so it is θ∞ − 90° ahead of the velocity. We want the asymptote to point against the Moon’s motion, which is the direction of the spacecraft’s motion at the far-side midpoint. So the burn comes θ∞ − 90° before that point.`)}
            <p>${T`For the example e = ${f(h.e, 3)}, θ∞ = ${f(h.thInf * deg, 1)}° and φ ≈ ${f(h.phi, 1)}°. The burn takes place on the <b>far side</b> of the Moon. This was true on every Apollo flight: the spacecraft was behind the Moon, out of radio contact, when the engine fired, and the first sign that it had worked was the signal returning on the other side. The first crew to live it was Apollo 8, on Christmas Day 1968.`}</p>
            <p>${T`The hand calculation has limits. It assumes the spacecraft leaves from the Moon’s centre and ignores that it needs about 13 to 18 hours to get out of the Moon’s sphere of influence, during which the Moon moves by about 8° to 10° around the Earth. For a fast return (Δv about 1 000 m/s) the hand position is within a few degrees of the simulated one. For the slow, minimum-energy return the difference is about 30°, and the simulated flight is shorter than five days, because the spacecraft is already well inside the Moon’s distance when it leaves the sphere. Use the hand numbers to get close, then let the simulation finish the job.`}</p>
          </div>
        </section>

        ${Archive.capsule('receding')}

        <section class="section">
          <h2><span class="idx">0.4</span>${T`Which revolution? Time and longitude`}</h2>
          <div class="prose">
            <p>${T`A spacecraft in a 110 km lunar orbit goes round in ${f(Ph.lunarOrbit(110e3).P / 60, 1)} minutes. Seen from the Earth, the Moon turns slowly, so the far-side midpoint comes round again after ${f(Ph.lunarOrbit(110e3).Psyn / 60, 1)} minutes. The burn position φ comes round once per such revolution. Every revolution is a new launch window, about 2 hours later.`}</p>
            <p>${T`If the burn is made one revolution later, the geometry between the spacecraft, the Moon and the Earth is repeated. The trajectory is the same, and only the clock moves: the flight takes just as long and arrives at the same place in space, 2 hours later. The Earth turns 15° per hour, so each revolution shifts the splashdown by about 30° of longitude. Mission Control chooses the revolution to put splashdown where the recovery ships are and in daylight.`}</p>
            <div class="eq">\\[ t_\\mathrm{splash} = t_\\mathrm{TEI} + t_\\mathrm{flight}, \\qquad t_\\mathrm{TEI} = \\frac{180^\\circ - \\varphi + 360^\\circ(k-1)}{360^\\circ}\\,P_\\mathrm{syn} \\]</div>
            ${Sym.where([['k', N`revolution number: 1, 2, 3… counted from the marker (the Earth-facing point of the orbit)`, ''], ['P_{syn}', N`time between two far-side midpoints: the lunar orbit period as seen from the Earth line`, 's'], ['t_{TEI}', N`time of the burn after the marker`, 's']], N`One more revolution adds exactly P_syn to the time of the burn, and nothing else changes.`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`The corridor and how steep the sensitivities are`}</h2>
          <div class="prose">
            <p>${T`The corridor is about 55 km in perigee altitude: a flight-path angle of −5.3° at its shallow edge (perigee about 65 km), −7.4° at its steep edge (perigee about 12 km). Shallower and the spacecraft skims the atmosphere and skips back out to space. Steeper and the deceleration is too high. Each kilometre of perigee changes the entry angle by about 0.04°.`}</p>
            <p>${T`Now see how the burn controls the perigee. In the lab model, 1 m/s of error in the burn Δv moves the perigee by about 150 km. One degree of burn position, which is about 20 seconds of timing, moves it by about 1 270 km. The corridor is 55 km: the burn must be right to a fraction of a metre per second and a second or so. No engine and no clock is that good. The way home therefore includes <b>midcourse corrections</b>, the subject of the Apollo navigation in module ${Progress.code('moon')} on the way out as well: tracking measures where the spacecraft really goes, and a burn of a few metres per second, long after the main burn, moves the perigee back into the slot.`}</p>
            <p>${T`The earlier the correction, the less speed it needs, because a small change has more time to grow. In the lab, a correction 24 hours after the burn gives about 50 km of perigee per m/s; 48 hours after, about 25 km per m/s.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Free return and Apollo 13`}</h2>
          <div class="prose">
            <p>${T`A <b>free-return</b> trajectory swings around the Moon and comes back to the Earth with no burn at all: the spacecraft returns on its own if the engine fails. The early Apollo flights flew it after the burn that sent them to the Moon. Later flights gave up part of that guarantee to reach other landing sites. The burn after the oxygen tank failure on Apollo 13 in April 1970 shows the other side. The crew had to use the lunar module’s descent engine, about two hours after passing the Moon, to speed the return up. The spacecraft splashed down on 17 April 1970, in the corridor, after a trip that included a number of small midcourse corrections.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Lab: the trans-Earth planner`}</h2>
          <div class="prose"><p>${T`Pick a scenario. Choose the Δv of the burn, its position φ in lunar orbit, and the revolution. The plan runs through the patched-conic simulation as you type: the Earth–Moon view shows the whole trajectory, the lunar view shows the burn. The results show the vacuum perigee, the entry angle, the flight time and the verdict. Where a scenario allows a midcourse correction, enter its time and Δv. Objectives are checked when you press <b>Execute</b>. “Solve φ” hands the burn position to Mission Control, and the corridor objective is then not credited.`}</p></div>
          <div class="lab tl-lab" id="hw">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Trans-Earth planner`}</h3><span class="spacer"></span>
              <div class="seg" id="hw-view" role="group" aria-label="${T`View`}"><button data-v="em" aria-pressed="true">${T`Earth–Moon`}</button><button data-v="moon" aria-pressed="false">${T`Lunar orbit`}</button></div>
            </div>
            <div class="stage"><canvas id="hw-cv" aria-label="${T`Trans-Earth trajectory: the lunar orbit with the burn point, and the path from the Moon to the Earth`}"></canvas><div class="overlay" id="hw-ov"></div><div class="badge" id="hw-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="hw-res"></dl>
              <p class="note" id="hw-note" style="margin:0"></p>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="hw-scen"><span>${T`Scenario`}</span></label><select id="hw-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="hw-task" style="margin:0"></p>
              </div>
              <div class="tl-group">
                <h4>${T`Trans-Earth injection`}</h4>
                <div class="mc-fields">
                  <label><span>${T`burn Δv (m/s)`}</span><input type="text" inputmode="decimal" id="hw-dv" autocomplete="off"></label>
                  <label><span>${T`burn position φ (°)`}</span><input type="text" inputmode="decimal" id="hw-phi" autocomplete="off"></label>
                  <label><span>${T`revolution k`}</span><input type="text" inputmode="numeric" id="hw-rev" autocomplete="off"></label>
                </div>
                <div class="btn-row"><button class="btn primary" id="hw-go">${T`Execute`}</button><button class="btn" id="hw-solve">${T`Solve φ`}</button><button class="btn" id="hw-work">${T`Show the working`}</button></div>
                <dl class="readout" id="hw-steps"></dl>
              </div>
              <div class="tl-group">
                <h4>${T`Midcourse correction`}</h4>
                <div class="mc-fields">
                  <label><span>${T`time after burn (h)`}</span><input type="text" inputmode="decimal" id="hw-mt" autocomplete="off"></label>
                  <label><span>${T`correction Δv (m/s)`}</span><input type="text" inputmode="decimal" id="hw-mdv" autocomplete="off"></label>
                </div>
                <p class="note" id="hw-mnote" style="margin:0"></p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('homeward', { math: 'vectors', mathLabel: N`Subtracting velocity vectors.` })}`;

      mountPlanner(page.querySelector('#hw'));
      Practice.embed(page.querySelector('#practice-slot'), 'homeward', 3);
    },
  });

  function mountPlanner(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    const set = (id, v) => { $(id).value = UI.dec(String(v)); };
    const view = UI.canvas($('#hw-cv'), null);
    let scenKey = 'nominal', sc = SCEN.nominal, res = null, mode = 'em', peeked = false, assisted = false, bad = false;

    function load() {
      sc = SCEN[scenKey];
      set('#hw-dv', sc.dv); set('#hw-phi', sc.phi); set('#hw-rev', sc.rev); set('#hw-mt', 24); set('#hw-mdv', 0);
      ['#hw-mt', '#hw-mdv'].forEach((id) => { $(id).disabled = !sc.mcc; });
      peeked = false; assisted = false;
      $('#hw-task').textContent = T(sc.task);
      $('#hw-steps').innerHTML = `<dt></dt><dd class="note" style="text-align:left">${T`The working appears here. Using it disables the Δv objective for this scenario.`}</dd>`;
      $('#hw-mnote').textContent = sc.mcc ? T`Positive Δv is sideways, in the direction of motion around the Earth: it raises the perigee. Only possible after the spacecraft has left the Moon’s sphere of influence.` : T`This scenario has no midcourse correction.`;
      run(false);
    }

    function inputs() {
      const dv = num('#hw-dv'), phi = num('#hw-phi'), rev = Math.round(num('#hw-rev'));
      const mt = sc.mcc ? num('#hw-mt') : NaN, mdv = sc.mcc ? num('#hw-mdv') : 0;
      return { dv, phi, rev, mt, mdv };
    }

    function run(execute) {
      const q = inputs();
      bad = !(isFinite(q.dv) && isFinite(q.phi) && q.rev >= 1 && q.rev <= 20);
      if (bad) { res = null; render(q); view.redraw(); return; }
      const opts = { alt: sc.alt, dv: q.dv, phi: q.phi, rev: q.rev, dvErr: sc.err };
      if (sc.mcc && isFinite(q.mt) && isFinite(q.mdv) && q.mdv !== 0) opts.mcc = { dt: q.mt * 3600, dv: q.mdv };
      res = Ph.fly(opts);
      res.opts = opts;
      render(q);
      view.redraw();
      if (execute) credit(q);
    }

    function credit(q) {
      const r = res, ref = Ph.handMinEnergy(sc.alt, 40e3);
      if (scenKey === 'nominal' && !peeked && Math.abs(q.dv - ref.dv) <= 10) Progress.done('homeward', 'dv');
      if (scenKey !== 'disp' && !assisted && !r.mccT && r.outcome === 'corridor') Progress.done('homeward', 'corr');
      if (scenKey === 'landing' && r.outcome === 'corridor' && r.tEI != null && Math.abs(r.tEI - sc.target) <= sc.window) Progress.done('homeward', 'rev');
      if (scenKey === 'disp' && r.mccT && Math.abs(q.mdv) <= 4 && r.outcome === 'corridor') Progress.done('homeward', 'mcc');
    }

    const VERDICT = {
      corridor: [N`In the corridor`, 'good'], shallow: [N`Skip out: too shallow`, 'warn'], steep: [N`Too steep`, 'bad'],
      miss: [N`Perigee above the atmosphere: no entry`, 'warn'], escape: [N`Does not return`, 'bad'], captured: [N`Stays in lunar orbit: Δv too low`, 'bad'],
    };

    function render(q) {
      const dl = $('#hw-res'), b = $('#hw-badge');
      if (!res) { dl.innerHTML = ''; b.textContent = T`Enter numbers`; b.className = 'badge'; $('#hw-note').textContent = T`Enter the Δv, the burn position and the revolution as numbers (revolution 1 to 20).`; $('#hw-ov').textContent = ''; return; }
      const r = res, v = VERDICT[r.outcome], sensDv = Ph.sensitivity({ ...r.opts, dvErr: 0, mcc: undefined }, 'dv', 0.1), sensPhi = Ph.sensitivity({ ...r.opts, dvErr: 0, mcc: undefined }, 'phi', 0.005);
      const far = Math.abs(((q.phi + 180 + 360 * 100) % 360) - 180) < r.lo.losPhi * deg;
      const rows = [
        [T`Burn at`, UI.fmtTime(r.t0)], [T`Earth contact at the burn`, far ? T`lost (far side)` : T`in contact`],
        [T`Moon departure speed v∞`, r.hyp ? `${f(r.vinf, 0)} m/s` : '—'],
        [T`Vacuum perigee altitude`, r.periAlt != null ? `${f(r.periAlt / 1e3, 0)} km` : '—'],
        [T`Entry angle`, r.gamma != null ? `${f(r.gamma, 2)}°` : '—'], [T`Entry speed`, r.vEI ? `${f(r.vEI / 1e3, 2)} km/s` : '—'],
        [T`Flight time`, r.tof != null ? `${hrs(r.tof)} h` : '—'], [T`Splashdown after marker`, r.tEI != null ? `${hrs(r.tEI)} h` : '—'],
      ];
      dl.innerHTML = rows.map(([k, x], i) => `<dt>${k}</dt><dd${i === 3 || i === 4 ? ' class="hl"' : ''}>${x}</dd>`).join('') +
        `<dt class="sub" style="grid-column:1/-1">${T`Sensitivity of the perigee`}</dt><dt>${T`per m/s of burn Δv`}</dt><dd>${f(sensDv, 0)} km</dd><dt>${T`per 0.01° of position`}</dt><dd>${f(sensPhi * 0.01, 1)} km</dd>`;
      b.textContent = T(v[0]); b.className = 'badge ' + v[1];
      const notes = [];
      if (sc.target != null && r.tEI != null) { const d = (r.tEI - sc.target) / 3600; notes.push(T`Requested splashdown: ${hrs(sc.target)} h ± ${hrs(sc.window)} h. Yours is ${f(Math.abs(d), 1)} h ${d >= 0 ? T`late` : T`early`}.`); }
      if (scenKey === 'fast' && r.tof != null) notes.push(r.tof <= 52 * 3600 ? T`Mission rule met: ${hrs(r.tof)} h is within 52 h.` : T`Mission rule: 52 h. This return takes ${hrs(r.tof)} h.`);
      if (r.outcome === 'shallow' || r.outcome === 'miss') notes.push(T`Perigee too high: raise the burn Δv slightly, or shift φ, or correct on the way.`);
      if (r.outcome === 'steep') notes.push(T`Perigee too low: the entry is too steep.`);
      if (q.mt != null && isFinite(q.mt) && sc.mcc && q.mdv && !r.mccT) notes.push(T`The correction is not executed: it must come after the spacecraft leaves the Moon’s sphere of influence (about ${hrs(r.tSOI - r.t0)} h after the burn) and before entry.`);
      if (r.mccT) notes.push(T`Correction executed ${hrs(r.mccT - r.t0)} h after the burn.`);
      if (sc.mcc && !q.mdv && r.outcome !== 'corridor' && res.mccT == null) {
        const s = Ph.sensitivity({ ...r.opts, mcc: { dt: Math.max(q.mt, 0) * 3600 || 86400, dv: 0 } }, 'mcc', 0.1);
        notes.push(T`Tracking: perigee ${f(r.periAlt / 1e3, 0)} km against 40 km wanted. A correction at ${f(q.mt, 0)} h moves the perigee by about ${f(s, 0)} km per m/s.`);
      }
      $('#hw-note').textContent = notes.join(' ');
      $('#hw-ov').textContent = `${T`Moon’s speed`} ${f(Ph.VM, 0)} m/s`;
    }

    function showWorking() {
      peeked = true;
      const h = Ph.handMinEnergy(sc.alt, 40e3), q = inputs(), g = isFinite(q.dv) ? Ph.handGivenDv(sc.alt, q.dv) : null;
      const rows = [
        [T`return ellipse a`, `${f(h.a / 1e3, 0)} km`], [T`apogee speed v_a`, `${f(h.va, 1)} m/s`], [T`Moon’s speed v_M`, `${f(h.vM, 1)} m/s`], [T`excess speed v∞`, `${f(h.vinf, 1)} m/s`],
        [T`circular speed v_c`, `${f(h.vc, 1)} m/s`], [T`speed on hyperbola`, `${f(h.vhyp, 1)} m/s`], ['Δv', `${f(h.dv, 1)} m/s`], ['e', f(h.e, 3)], ['θ∞', `${f(h.thInf * deg, 1)}°`], [T`φ ≈ θ∞ − 90°`, `${f(h.phi, 1)}°`], [T`flight time`, `${f(h.tof / 3600, 1)} h`],
      ];
      if (g) rows.push([T`hand φ at your Δv`, `${f(g.phi, 1)}°`], [T`hand flight time at your Δv`, `${f(g.tof / 3600, 1)} h`]);
      $('#hw-steps').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    }

    function solve() {
      const q = inputs();
      if (!isFinite(q.dv)) return;
      const roots = Ph.solvePhi({ alt: sc.alt, dv: q.dv });
      if (!roots.length) { $('#hw-note').textContent = T`No burn position gives a perigee of 40 km with this Δv.`; return; }
      set('#hw-phi', roots[0].toFixed(3)); assisted = true; run(false);
    }

    // ---- drawing ----
    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 80);
      if (!res) return;
      if (mode === 'em') drawEM(ctx, w, h, K); else drawMoon(ctx, w, h, K);
    };
    function drawEM(ctx, w, h, K) {
      const r = res, cx = w * 0.42, cy = h / 2, s = Math.min(w * 0.58, h / 2 - 14) / (Ph.D * 1.02);
      const P = (x, y) => [cx + x * s, cy - y * s];
      ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(cx, cy, Ph.D * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      UI.drawEarth(ctx, cx, cy, Math.max(4, Ph.RE * s * 4), K);
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillStyle = K.muted;
      ctx.fillText(T`Earth`, cx + 8, cy + 16);
      const m0 = Ph.moonPos(r.t0), m1 = r.tEI != null ? Ph.moonPos(r.tEI) : null;
      const mp = P(...m0);
      UI.drawMoon(ctx, mp[0], mp[1], Math.max(3.5, Ph.RM * s * 4), K);
      ctx.fillStyle = K.muted; ctx.fillText(T`Moon at burn`, mp[0] + 8, mp[1] - 8);
      if (m1) { const q = P(...m1); ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.stroke(); ctx.fillStyle = K.muted; ctx.fillText(T`Moon at entry`, q[0] + 8, q[1] + 12); }
      const pts = Ph.samples(r, 400);
      if (pts.length) {
        ctx.lineWidth = 2;
        let prev = null;
        for (const p of pts) {
          const c = P(p.x, p.y);
          if (prev) { ctx.strokeStyle = p.phase === 'M' ? K.accent : p.phase === 'E2' ? K.trace2 : K.trace; ctx.beginPath(); ctx.moveTo(...prev); ctx.lineTo(...c); ctx.stroke(); }
          prev = c;
        }
      }
      if (r.mccState) { const c = P(r.mccState[0], r.mccState[1]); ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, 7); ctx.fill(); ctx.fillText('MCC', c[0] + 6, c[1] - 6); }
      ctx.fillStyle = K.muted; ctx.textAlign = 'center';
      ctx.fillText(T`Earth and Moon not to scale; the path is drawn to scale`, w / 2, h - 10);
    }
    function drawMoon(ctx, w, h, K) {
      const r = res, lo = r.lo, cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 / (5 * RM) * 1.0;
      const rot = -Ph.W * r.t0, cs = Math.cos(rot), sn = Math.sin(rot);
      const P = (x, y) => [cx + (x * cs - y * sn) * s, cy - (x * sn + y * cs) * s];
      UI.drawMoon(ctx, cx, cy, RM * s, K);
      // Earth direction and far-side midpoint
      ctx.strokeStyle = K.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - RM * s * 4.8, cy); ctx.lineTo(cx + RM * s * 4.8, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`far side`, cx + RM * s * 3.4, cy - 6); ctx.textAlign = 'right'; ctx.fillText(T`towards Earth`, cx - RM * s * 3.4 + 40, cy - 6);
      // orbit; the part out of contact with the Earth is drawn thicker
      ctx.lineWidth = 1.4; ctx.strokeStyle = K.trace;
      ctx.beginPath(); ctx.arc(cx, cy, lo.r * s, 0, 7); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = K.muted; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(cx, cy, lo.r * s, -lo.losPhi, lo.losPhi); ctx.stroke(); ctx.globalAlpha = 1;
      // burn point: angle φ before far-side midpoint (orbit runs clockwise on this plane, so before = counter-clockwise from +x)
      const ph = (res.opts.phi) / deg, bx = cx + lo.r * s * Math.cos(ph), by = cy - lo.r * s * Math.sin(ph);
      ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillText(`TEI φ = ${f(res.opts.phi, 2)}°`, bx + 8, by - 8);
      // hyperbola
      if (r.legM) {
        const L = r.legM; ctx.strokeStyle = K.accent; ctx.lineWidth = 2; ctx.beginPath();
        let first = true;
        for (let i = 0; i <= 160; i++) {
          const nu = L.nu0 + (L.nu1 - L.nu0) * i / 160, st = Ph.stateAt(L.c, nu), c = P(st[0], st[1]);
          if (Math.hypot(c[0] - cx, c[1] - cy) > Math.hypot(w, h)) break;
          if (first) { ctx.moveTo(...c); first = false; } else ctx.lineTo(...c);
        }
        ctx.stroke();
        // Moon’s velocity direction (screen up on the far side) and the asymptote hint
        UI.arrow(ctx, cx + RM * s * 3, cy + 6, cx + RM * s * 3, cy + 6 + 46, K.muted, 1.4);
        ctx.fillStyle = K.muted; ctx.textAlign = 'left'; const lt = T`against the Moon’s motion`; ctx.fillText(lt, Math.min(cx + RM * s * 3 + 8, w - ctx.measureText(lt).width - 6), cy + 46);
      }
      ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.fillText(T`Thick arc: out of contact with the Earth`, w / 2, h - 10);
    }

    // ---- wiring ----
    $('#hw-scen').addEventListener('change', (e) => { scenKey = e.target.value; load(); });
    $('#hw-go').addEventListener('click', () => run(true));
    $('#hw-solve').addEventListener('click', solve);
    $('#hw-work').addEventListener('click', showWorking);
    root.querySelectorAll('#hw-dv, #hw-phi, #hw-rev, #hw-mt, #hw-mdv').forEach((el) => {
      el.addEventListener('input', () => { if (el.id === 'hw-phi') assisted = false; run(false); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(true); });
    });
    UI.seg(root, '#hw-view', (v) => { mode = v; view.redraw(); });
    $('#hw-scen').value = scenKey;
    load();
  }
})();
