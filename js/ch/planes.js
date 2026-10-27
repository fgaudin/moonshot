/* Chapter: Plane Changes. Inclination, nodes, the cost of tilting an orbit, combined burns and launch azimuth.
   The one 3D module: the lab draws a rotatable globe. Physics lives in planes.phys.js (Phys_planes). */
(function () {
  'use strict';
  const P = window.Phys_planes;
  const { RE, D2R } = P.C;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const deg = 180 / Math.PI;
  const MU = 398600.4418, RE_KM = 6378.137;
  const RGEO = RE + 35786e3;
  const wrap = (x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  Progress.register('planes', {
    name: N`Plane Changes`, topic: 'planes', glyph: 'node',
    briefing: N`Everything so far happened in one flat plane, {name}. Real orbits are tilted, and the tilt costs propellant. In this module you leave the page: you describe an orbit in three dimensions, tilt it at the cheapest point, write the burn as a PAD with a normal component, and choose the launch azimuth that puts a rocket into the right plane in the first place.`,
    objectives: [
      { id: 'plane', text: N`Change the orbit plane to within 0.1° of the target with a pure plane change at a node` },
      { id: 'cheap', text: N`Reach geostationary orbit from the transfer orbit with a combined burn within 3% of the minimum Δv` },
      { id: 'az', text: N`Find the launch azimuth for the target inclination within 0.5°` },
      { id: 'qual', text: N`Qualify: answer 2 plane-change problems correctly` },
    ],
    debrief: N`You can now tilt an orbit where it is cheapest, write the burn as a PAD, and aim a launch at a plane, {name}. Next comes docking, where the plane must match exactly before anything else can.`,
  });

  /* ---------------- Practice ---------------- */
  const circV = (altKm) => Math.sqrt(MU / (RE_KM + altKm));      // km/s
  const SITES = [
    { name: N`Kourou`, lat: 5.2 }, { name: N`Cape Canaveral`, lat: 28.5 }, { name: N`Vandenberg`, lat: 34.7 }, { name: N`Baikonur`, lat: 45.9 }, { name: N`Plesetsk`, lat: 62.9 },
  ];
  Practice.register('planes', N`Plane changes`, [
    { title: N`Simple plane change`, make() {
      const h = pick([300, 400, 550, 800, 1500]), di = rnd(3, 30, 1), v = circV(h) * 1000, dv = 2 * v * Math.sin(di * D2R / 2);
      return { q: T`A spacecraft is in a circular orbit at <b>${f(h, 0)} km</b>. How much Δv does a pure plane change of <b>${di}°</b> cost at a node? (μ = 398 600 km³/s², R = 6 378 km)`, answer: dv, unit: 'm/s', tol: 0.01,
        hint: T`Speed stays the same, the velocity turns: Δv = 2 v sin(Δi/2). First find the circular speed at r = R + h.`,
        sol: R`\[ v = \sqrt{\frac{\mu}{r}} = ${f(v, 1)}\ \mathrm{m/s},\quad \Delta v = 2v\sin\frac{\Delta i}{2} = 2\times${f(v, 1)}\times\sin ${f(di / 2, 1)}^\circ = ${f(dv, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`PAD normal component`, make() {
      const v = rnd(3000, 7800, 10), di = rnd(4, 40, 1), n = v * Math.sin(di * D2R);
      return { q: T`A circular orbit has a speed of <b>${f(v, 0)} m/s</b>. You tilt it by <b>${di}°</b> with a pure plane change, keeping the speed. What is the size of the normal component of the burn, Δv<sub>N</sub>?`, answer: n, unit: 'm/s', tol: 0.01,
        hint: T`The new velocity has the old speed, turned by Δi. Its component along the old normal direction is v sin Δi.`,
        sol: R`\[ \Delta v_N = v\sin\Delta i = ${f(v, 0)}\times\sin ${di}^\circ = ${f(n, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`PAD prograde component`, make() {
      const v = rnd(3000, 7800, 10), di = rnd(15, 45, 1), p = -v * (1 - Math.cos(di * D2R));
      return { q: T`Same burn, other component. A circular orbit has a speed of <b>${f(v, 0)} m/s</b> and you tilt it by <b>${di}°</b> keeping the speed. What is the prograde component of the burn, Δv<sub>P</sub>, with its sign?`, answer: p, unit: 'm/s', tol: 0.01,
        hint: T`The velocity turns, so its component along the old direction shrinks to v cos Δi. The prograde component is that minus v: negative.`,
        sol: R`\[ \Delta v_P = v\cos\Delta i - v = -v(1-\cos\Delta i) = -${f(v, 0)}\times(1-\cos ${di}^\circ) = ${f(p, 1)}\ \mathrm{m/s} \]` + `<p>${T`Check: √(Δv<sub>N</sub>² + Δv<sub>P</sub>²) = ${f(Math.hypot(p, v * Math.sin(di * D2R)), 1)} m/s = 2v sin(Δi/2).`}</p>` };
    } },
    { title: N`Combined plane and speed change`, make() {
      const v1 = rnd(1500, 1700, 10) / 1000, v2 = 3.0747, di = rnd(20, 30, 1), dv = Math.sqrt(v1 * v1 + v2 * v2 - 2 * v1 * v2 * Math.cos(di * D2R));
      const sep = (v2 - v1) + 2 * v2 * Math.sin(di * D2R / 2);
      return { q: T`A transfer orbit reaches apogee at <b>${f(v1, 3)} km/s</b> with an inclination of ${di}° above the equator. One burn must make it a geostationary orbit: circular, speed <b>3.075 km/s</b>, inclination 0°. What is the Δv of that single combined burn?`, answer: dv * 1000, unit: 'm/s', tol: 0.01,
        hint: T`Law of cosines on the two velocity vectors, with the angle Δi between them.`,
        sol: R`\[ \Delta v = \sqrt{v_1^2 + v_2^2 - 2v_1v_2\cos\Delta i} = \sqrt{${f(v1, 3)}^2 + 3.075^2 - 2\times${f(v1, 3)}\times3.075\cos ${di}^\circ} = ${f(dv * 1000, 0)}\ \mathrm{m/s} \]` + `<p>${T`Doing the two jobs separately would cost ${f(sep * 1000, 0)} m/s.`}</p>` };
    } },
    { title: N`Launch azimuth`, make() {
      const lat = pick([28.5, 34.7, 45.9]), inc = lat + rnd(3, 25, 1), az = Math.asin(Math.cos(inc * D2R) / Math.cos(lat * D2R)) * deg;
      return { q: T`A rocket leaves a site at latitude <b>${f(lat, 1)}°</b> N towards the northeast for an orbit of inclination <b>${f(inc, 0)}°</b>. What is the launch azimuth (from north, clockwise), ignoring the Earth’s rotation?`, answer: az, unit: '°', tol: 0.01,
        hint: T`sin β = cos i / cos φ. Use the arcsine, which gives the northeast solution (below 90°).`,
        sol: R`\[ \sin\beta = \frac{\cos i}{\cos\varphi} = \frac{\cos ${f(inc, 0)}^\circ}{\cos ${f(lat, 1)}^\circ} = ${f(Math.cos(inc * D2R) / Math.cos(lat * D2R), 4)} \Rightarrow \beta = ${f(az, 2)}^\circ \]` };
    } },
    { title: N`Lowest inclination from a site`, make() {
      const s = pick(SITES);
      return { q: T`What is the lowest orbital inclination, in degrees, that a rocket can reach from ${T(s.name)} (latitude ${f(s.lat, 1)}° N) without a plane change in orbit?`, answer: s.lat, unit: '°', tol: 0.01,
        hint: T`The orbit plane passes through the Earth’s centre and the launch site, so the site cannot be farther from the equator than the orbit plane allows.`,
        sol: R`\[ i_{min} = \varphi = ${f(s.lat, 1)}^\circ \quad (\beta = 90^\circ,\ \text{due east}) \]` };
    } },
  ], [
    { q: N`A spacecraft must change its orbital plane. Where in a noncircular orbit is that cheapest?`, opts: [N`At apoapsis (lowest speed), at a node`, N`At periapsis (highest speed)`, N`Anywhere: the cost does not depend on the position`, N`Halfway between the nodes`], a: 0, why: N`Δv = 2v sin(Δi/2) is proportional to the speed at the burn. The burn must also be at a node, where both planes contain the spacecraft. In a transfer orbit whose apoapsis is at a node, both conditions are met.` },
    { q: N`Why must a pure plane change happen at a node?`, opts: [N`Only there do the old and new planes both contain the spacecraft’s position, so the burn can turn the velocity without moving the line of nodes`, N`The nodes are where the speed is lowest`, N`The Earth’s equator helps the burn at a node`, N`Burns off the nodes are impossible`], a: 0, why: N`The new plane must contain the position vector. That holds on the line where the two planes meet, which is the line of nodes. Burning elsewhere tilts the plane about a different axis and also shifts Ω.` },
    { q: N`A rocket is launched due east from 28.5° N. What inclination does the orbit have, ignoring Earth rotation effects on the azimuth?`, opts: [N`28.5°, equal to the latitude`, N`0°`, N`90°`, N`57°`], a: 0, why: N`Due east, β = 90°, so cos i = cos φ sin β = cos φ and i = φ. A launch cannot give a lower inclination than the latitude of the site.` },
  ]);

  /* ---------------- Lab scenarios ---------------- */
  const rpGTO = RE + 185e3, aGTO = (rpGTO + RGEO) / 2, eGTO = (RGEO - rpGTO) / (RGEO + rpGTO);
  const SCEN = {
    trim: { kind: 'pc', label: N`Small correction in low orbit`,
      task: N`A spacecraft in a circular 185 km orbit is 0.6° above the planned inclination. Correct it with a pure plane change: same speed, same shape, same Ω.`,
      el: { a: RE + 185e3, e: 0, i: 33.1 * D2R, O: 70 * D2R, w: 0, nu: 215 * D2R }, target: { i: 32.5 * D2R, O: 70 * D2R, a: RE + 185e3 }, get0: 5400, pure: true },
    geo: { kind: 'pc', label: N`28.5° to the equator`,
      task: N`A spacecraft in a circular geostationary-radius orbit (35 786 km) is inclined 28.5°. Bring it to the equator with a pure plane change. After the burn the lab prices the same job at 300 km.`,
      el: { a: RGEO, e: 0, i: 28.5 * D2R, O: 40 * D2R, w: 0, nu: 300 * D2R }, target: { i: 0, O: 0, a: RGEO }, get0: 40000, pure: true },
    combined: { kind: 'pc', label: N`Transfer orbit to geostationary`,
      task: N`A transfer orbit, 185 km by 35 786 km, inclination 28.5°. Reach a circular equatorial orbit at 35 786 km. Choose where to burn, and how many burns. The cheapest plan does everything in one.`,
      el: { a: aGTO, e: eGTO, i: 28.5 * D2R, O: 40 * D2R, w: Math.PI, nu: 100 * D2R }, target: { i: 0, O: 0, a: RGEO }, get0: 7200, combined: true },
    launch: { kind: 'launch', label: N`Launch azimuth to 32.5°`,
      task: N`Cape Canaveral, latitude 28.5° N. The target orbit is 185 km, inclination 32.5°. Enter the azimuth to fly, from north, measured on the ground, and launch. Insertion speed is the circular speed, 7.79 km/s.`,
      site: { lat: 28.5 * D2R, alt: 185e3, i: 32.5 * D2R, O: 100 * D2R, lon0: 40 * D2R }, get0: 0 },
  };

  App.css('planes', `
    #pl-cv { cursor: grab; touch-action: none; }
    #pl-cv:active { cursor: grabbing; }
    .pl-hint { font: .68rem/1.3 var(--f-mono); color: var(--muted); margin: 0; }
  `);

  App.chapter({
    id: 'planes', phase: N`3D orbits`, title: N`Plane Changes`, lab: N`Plane change`,
    blurb: N`Inclination, nodes and the cost of tilting an orbit: Δv = 2v sin(Δi/2), combined burns and the launch azimuth.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('planes')} · 3D orbits`,
          title: T`Plane Changes`,
          lede: T`Every module so far kept the orbit in one flat plane. Real orbits are tilted, and turning the plane is the most expensive manoeuvre in the book. This module shows where to do it, how to write the burn, and how a launch azimuth fixes the plane before the rocket ever leaves the ground.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`, T`Apollo Operations Handbook`],
        })}
        ${Progress.briefing('planes', { theory: 'theory', lab: 'pl', math: 'refresher', mathLabel: N`Vectors and the law of cosines.` })}

        <section class="section" id="theory">
          <h2><span class="idx">11.1</span>${T`Describing a tilted orbit`}</h2>
          <div class="prose">
            <p>${T`An orbit lies in a plane through the Earth’s centre. Two angles say which plane. Take the equatorial plane as the reference, with the x axis pointing at the vernal equinox (a fixed direction among the stars) and the z axis at the north pole.`}</p>
            <ul>
              <li>${T`The <b>inclination</b> <i>i</i> is the angle between the orbit plane and the equator, from 0° to 180°. Prograde orbits have i < 90°.`}</li>
              <li>${T`The two planes meet along a line, the <b>line of nodes</b>. The point where the spacecraft crosses the equator going north is the <b>ascending node</b> (AN), the opposite point the <b>descending node</b> (DN).`}</li>
              <li>${T`The <b>right ascension of the ascending node</b> Ω is the angle from the x axis to the ascending node, measured along the equator.`}</li>
            </ul>
            <p>${T`Two more angles locate the ellipse in its plane. The <b>argument of periapsis</b> ω runs from the ascending node to the periapsis. The <b>argument of latitude</b> <i>u</i> = ω + ν runs from the ascending node to the spacecraft, so the spacecraft is at an ascending node when u = 0° and at the descending node when u = 180°. For a circular orbit, where periapsis means nothing, u alone is used.`}</p>
            <p>${T`A plane is also a direction. The angular momentum vector is perpendicular to the plane, and its unit vector follows from the two angles:`}</p>
            <div class="eq">\\[ \\hat h = \\begin{pmatrix} \\sin\\Omega\\,\\sin i \\\\ -\\cos\\Omega\\,\\sin i \\\\ \\cos i \\end{pmatrix}, \\qquad \\cos\\theta = \\hat h_1\\cdot\\hat h_2 = \\cos i_1\\cos i_2 + \\sin i_1\\sin i_2\\cos(\\Omega_1-\\Omega_2) \\]</div>
            ${Sym.where([['\\hat h', N`unit vector perpendicular to the orbit plane (direction of the angular momentum)`, ''], ['i', N`inclination: angle between the orbit plane and the equatorial plane`, N`rad or °`], ['\\Omega', N`right ascension of the ascending node: where the orbit crosses the equator going north, measured from the vernal equinox`, N`rad or °`], ['\\theta', N`the angle between two orbit planes`, N`rad or °`]], N`The second formula is the dot product of the two h vectors. When only i changes (same Ω), it reduces to θ = |i₁ − i₂|. To change both i and Ω you need the full θ.`)}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`Inclination matters because the plane stays fixed in space while the Earth turns under it. A spacecraft that is 28.5° inclined passes over latitudes from 28.5° south to 28.5° north and nowhere else. An orbit with a different plane is a different orbit, and reaching it costs Δv.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">11.2</span>${T`The simple plane change`}</h2>
          <div class="prose">
            <p>${T`A plane change turns the velocity vector without changing its length. Two velocity vectors of equal length v, an angle Δi apart, form an isosceles triangle. The Δv is its third side:`}</p>
            <div class="eq">\\[ \\Delta v = 2\\,v\\,\\sin\\frac{\\Delta i}{2} \\]</div>
            ${Sym.where(['dv', 'v', 'di'], N`v is the speed at the burn, the same before and after. Use radians or degrees consistently in the sine.`)}
            <p>${T`Take the geostationary example. At 35 786 km the circular speed is 3 075 m/s, so tilting by 28.5° costs 2 × 3 075 × sin 14.25° = <b>1 514 m/s</b>. At 300 km the speed is 7 730 m/s and the same 28.5° costs <b>3 803 m/s</b>. The plane change is proportional to the speed, so it is cheapest where the spacecraft is slowest: high up, or at the apoapsis of an ellipse.`}</p>
            <p>${T`<b>Why at a node.</b> The new plane must contain the spacecraft’s position, because the spacecraft is not going to jump. The old and the new plane share only one line through the Earth’s centre. For a change of inclination at fixed Ω, that line is the line of nodes. So the burn happens at the ascending or the descending node. Burning elsewhere turns the plane about a different axis, and the node itself moves: Ω changes as well as i.`}</p>
            <p>${T`A small change costs little. The 0.6° correction of the first lab scenario in a 185 km orbit is 2 × 7 793 × sin 0.3° = 82 m/s. Even a degree of tilt is a real amount of propellant in low orbit, which is why launch teams work hard to put the rocket in the right plane from the start.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">11.3</span>${T`The burn as PAD components`}</h2>
          <div class="prose">
            <p>${T`A PAD gives the burn in the maneuver frame of the orbit before the burn: <b>prograde</b> along the velocity, <b>normal</b> along the angular momentum h (perpendicular to the plane), <b>radial</b> outwards. A plane change at a node needs the normal component. It also needs a prograde one:`}</p>
            <div class="eq">\\[ \\Delta v_N = v\\sin\\Delta i, \\qquad \\Delta v_P = -v\\,(1-\\cos\\Delta i), \\qquad \\Delta v_R = 0 \\]</div>
            ${Sym.where([['\\Delta v_N', N`normal component of the burn: along h, out of the old plane`, 'm/s'], ['\\Delta v_P', N`prograde component of the burn: along the old velocity (negative means braking)`, 'm/s'], ['\\Delta v_R', N`radial component: zero for a pure plane change`, 'm/s'], 'v', 'di'], N`The new velocity is v(cos Δi along the old direction, sin Δi along h). Subtract the old velocity v along the old direction and you get the components above.`)}
            <p>${T`The two components make a right triangle with Δv = 2v sin(Δi/2): sin² Δi + (1 − cos Δi)² = 2 − 2 cos Δi = 4 sin²(Δi/2). So the pure plane change is not a purely normal burn. A purely normal burn of v sin Δi would also raise the speed, to √(v² + Δv_N²), and leave an ellipse. In the geostationary example, 28.5° needs a normal component of 1 467 m/s <b>and</b> a prograde one of −373 m/s. A normal burn alone, 1 467 m/s, brings the inclination only from 28.5° to 3.0° and stretches the orbit to a 60 600 km apogee altitude. The small braking component keeps the speed unchanged. For small Δi it is tiny (second order): 0.6° at 7 793 m/s needs only −0.4 m/s.`}</p>
            <p>${T`<b>Normal or antinormal?</b> The sign of the normal component decides whether i grows or shrinks, and it flips between the nodes. At the <b>ascending node</b> a <b>normal</b> burn raises the inclination, an <b>antinormal</b> one lowers it. At the <b>descending node</b> it is the other way round. To reduce i from 28.5° to 0° at the ascending node, you burn antinormal (Δv_N negative). At the descending node the same job is a normal burn. Burning the wrong way doubles the error instead of removing it: 28.5° becomes 57°.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">11.4</span>${T`Plane and speed together`}</h2>
          <div class="prose">
            <p>${T`If the orbit also needs a different speed, do both in one burn. The velocity before the burn has length v₁, the velocity after has length v₂, and the two vectors are an angle Δi apart. The law of cosines gives the Δv:`}</p>
            <div class="eq">\\[ \\Delta v^2 = v_1^2 + v_2^2 - 2\\,v_1 v_2\\cos\\Delta i, \\qquad \\Delta v_P = v_2\\cos\\Delta i - v_1, \\quad \\Delta v_N = \\pm v_2\\sin\\Delta i \\]</div>
            ${Sym.where([['v_1', N`speed before the burn`, 'm/s'], ['v_2', N`speed after the burn`, 'm/s'], 'di'], N`With v₁ = v₂ this is the pure plane change of the previous section. With Δi = 0 it is v₂ − v₁, the ordinary speed change.`)}
            ${Primer.box('trig')}
            <p>${T`<b>Geostationary transfer.</b> A transfer orbit from a 185 km parking orbit reaches apoapsis at 35 786 km with a speed of 1 596 m/s, inclined 28.5°. The target is circular, 3 075 m/s, equatorial. Three plans:`}</p>
            <ul>
              <li>${T`Circularise (1 479 m/s), then change the plane at geostationary speed (1 514 m/s): <b>2 993 m/s</b>.`}</li>
              <li>${T`Change the plane at apoapsis, at 1 596 m/s (785 m/s), then circularise (1 479 m/s): <b>2 264 m/s</b>.`}</li>
              <li>${T`One combined burn at apoapsis: √(1 596² + 3 075² − 2 × 1 596 × 3 075 × cos 28.5°) = <b>1 837 m/s</b>.`}</li>
            </ul>
            <p>${T`The combined burn saves 1 156 m/s compared with the first plan. The reason is geometry: the two vectors v₁ and v₂ do not need to be turned and lengthened one after the other. The straight line between their tips is shorter than the two sides of any detour. The PAD of the combined burn is Δv<sub>P</sub> = 3 075 cos 28.5° − 1 596 = +1 106 m/s and Δv<sub>N</sub> = −3 075 sin 28.5° = −1 467 m/s. Apoapsis is the right place: the plane change part is paid at low speed, and the apoapsis is where the speed has to rise anyway.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">11.5</span>${T`Launch azimuth and launch windows`}</h2>
          <div class="prose">
            <p>${T`The cheapest plane change is the one you never make: launch into the right plane. A rocket leaving a site at latitude φ along an azimuth β (measured from north, clockwise) ends up in an orbit of inclination i. Spherical trigonometry on the triangle formed by the site, the north pole and the point where the orbit crosses the equator gives:`}</p>
            <div class="eq">\\[ \\cos i = \\cos\\varphi\\,\\sin\\beta, \\qquad \\sin\\beta = \\frac{\\cos i}{\\cos\\varphi} \\]</div>
            ${Sym.where([['\\varphi', N`latitude of the launch site`, N`rad or °`], ['\\beta', N`launch azimuth: direction of flight, from north, clockwise (90° is due east)`, N`rad or °`], 'i'], N`The sine has two solutions, β and 180° − β: a northeast launch and a southeast launch give the same inclination. Because sin β ≤ 1, a site can only reach i ≥ φ.`)}
            <p>${T`Two consequences. First, the <b>minimum inclination equals the site latitude</b>, reached by launching due east (β = 90°). From Cape Canaveral, 28.5°, no direct launch gives a lower inclination. Kourou, at 5.2° N, reaches nearly the equator. Second, a larger inclination needs a more northerly azimuth, and the rocket gives up some of the speed that the Earth’s rotation provides.`}</p>
            <p>${T`The formula holds for the velocity in an inertial frame, the one that does not turn with the Earth. The pilot flies relative to the ground, which moves east at v<sub>eq</sub> cos φ (408 m/s at 28.5°, from v<sub>eq</sub> = 465 m/s). Subtract it from the eastward part of the velocity:`}</p>
            <div class="eq">\\[ \\tan\\beta_{rot} = \\frac{v_{orb}\\sin\\beta - v_{eq}\\cos\\varphi}{v_{orb}\\cos\\beta} \\]</div>
            ${Sym.where([['\\beta_{rot}', N`the azimuth to fly relative to the rotating ground`, N`rad or °`], ['v_{orb}', N`inertial speed at insertion (7.79 km/s at 185 km)`, 'm/s'], ['v_{eq}', N`speed of the ground at the equator, 465 m/s`, 'm/s']], N`Numerator: the eastward speed the rocket must add to the ground’s motion. Denominator: the northward speed, which the Earth does not provide.`)}
            <p>${T`Example: from 28.5° N to a 32.5° orbit at 7 793 m/s. Inertial: sin β = cos 32.5° / cos 28.5° = 0.9594, so β = 73.7°. Flown relative to the ground, β<sub>rot</sub> = 72.8°. A pilot who steered 73.7° on the ground would end 0.4° low in inclination, which is about 50 m/s of plane change in low orbit. Apollo launches from Florida were limited to azimuths between 72° and 108°.`}</p>
            <p>${T`<b>Launch windows.</b> The orbit plane is fixed in space and the Earth turns once in 23 h 56 min. The launch site passes under the target plane twice a day: once going north, once going south. Those two moments are the launch windows. At other times, you need a plane change in orbit or a different azimuth with a different inclination. In the example, the two windows are about 4.2 hours apart, and the next pair follows 19.8 hours later (the lab shows the times). The northeast window corresponds to the northbound crossing.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">11.6</span>${T`Lab: plane change`}</h2>
          <div class="prose"><p>${T`Pick a scenario. The globe is three-dimensional: drag it to turn it. Grey is the current orbit, green dashed the target, and the orange ring is what you end up with. In the plane-change scenarios, work out Δi, the speed, the node and the PAD components, then type them in with the burn time and press Execute. The lab flies the burn and compares the result with the target. In the launch scenario, enter the azimuth and press Launch. Only values you type yourself count towards the objectives, and “Show Mission Control’s solution” disables credit for that attempt.`}</p></div>
          <div class="lab tl-lab" id="pl">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Plane change`}</h3><span class="spacer"></span>
              <div class="ctl" style="margin:0"><select id="pl-scen" aria-label="${T`Scenario`}">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
            </div>
            <div class="stage"><canvas id="pl-cv" aria-label="${T`Three-dimensional view of the Earth with the current orbit, the target orbit, the nodes and the spacecraft. Drag to rotate.`}"></canvas><div class="overlay" id="pl-ov"></div><div class="badge" id="pl-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="pl-live"></dl>
              <dl class="readout" id="pl-orb"></dl>
              <dl class="readout" id="pl-res"></dl>
            </div>
            <div class="tl-transport">
              <div class="btn-row"><button class="btn primary" id="pl-play">${T`▸ Play`}</button><button class="btn" id="pl-restart">${T`⟲ Restart`}</button><button class="btn" id="pl-view">${T`Reset view`}</button></div>
              ${UI.slider({ id: 'pl-t', label: T`Time`, min: 0, max: 1, step: 0.0005, value: 0 })}
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Task`}</h4>
                <p class="note" id="pl-task" style="margin:0"></p>
                <p class="pl-hint">${T`Drag the globe to rotate it.`}</p>
                <button class="btn" id="pl-solve">${T`Show Mission Control’s solution`}</button>
              </div>
              ${[0, 1].map((i) => `
              <div class="tl-group pl-burn" data-i="${i}">
                <h4>${T`Burn ${i + 1}`}</h4>
                <div class="ctl"><label for="pl-w${i}"><span>${T`Ignition (TIG)`}</span></label><select id="pl-w${i}">
                  ${i ? `<option value="off">${T`no second burn`}</option>` : ''}
                  <option value="an">${T`at next ascending node`}</option><option value="dn">${T`at next descending node`}</option><option value="apo">${T`at next apoapsis`}</option><option value="peri">${T`at next periapsis`}</option><option value="u">${T`when u reaches…`}</option></select></div>
                <div class="mc-fields">
                  <label>${T`u (°)`}<input type="text" inputmode="decimal" id="pl-u${i}" value="0"></label>
                  <label>${T`prograde (m/s)`}<input type="text" inputmode="decimal" id="pl-p${i}" value="0"></label>
                  <label>${T`normal (m/s)`}<input type="text" inputmode="decimal" id="pl-n${i}" value="0"></label>
                  <label>${T`radial (m/s)`}<input type="text" inputmode="decimal" id="pl-r${i}" value="0"></label>
                </div>
                ${i === 1 ? '' : `<div class="btn-row"><button class="btn primary" id="pl-exec">${T`Execute`}</button></div>`}
              </div>`).join('')}
              <div class="tl-group" id="pl-lgroup">
                <h4>${T`Launch`}</h4>
                <div class="mc-fields"><label>${T`azimuth on the ground (°)`}<input type="text" inputmode="decimal" id="pl-az" value="90"></label></div>
                <div class="btn-row"><button class="btn primary" id="pl-go">${T`Launch`}</button></div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('planes', { math: 'trig', mathLabel: N`Sine, cosine and the law of cosines.` })}`;

      mountLab(page.querySelector('#pl'));
      Practice.embed(page.querySelector('#practice-slot'), 'planes', 3);
    },
  });

  function mountLab(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return 0; const v = Number(s); return isFinite(v) ? v : NaN; };
    const view = UI.canvas($('#pl-cv'), null);
    const cam = { yaw: 0.6, el: 0.5 };
    const km = (x, d = 0) => f(x / 1e3, d);
    let scenKey = 'trim', S = null, res = null, flight = null, tEnd = 1, tNow = 0, playing = false, touched = false, peeked = false, outcome = null;

    // ---------- 3D projection ----------
    const proj = (p) => {
      const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw), x1 = p[0] * c - p[1] * s, y1 = p[0] * s + p[1] * c, ce = Math.cos(cam.el), se = Math.sin(cam.el);
      return [x1, p[2] * ce + y1 * se, -y1 * ce + p[2] * se];
    };
    const ringPts = (el, n = 160) => { const out = []; for (let k = 0; k <= n; k++) out.push(P.rv({ ...el, nu: 2 * Math.PI * k / n }).r); return out; };
    const circle3 = (r, i, O) => ringPts({ a: r, e: 0, i, O, w: 0, nu: 0 });
    // great circle of radius r through lat (a small circle) in the equatorial frame
    const latCircle = (r, lat) => { const out = []; for (let k = 0; k <= 120; k++) { const l = 2 * Math.PI * k / 120; out.push([r * Math.cos(lat) * Math.cos(l), r * Math.cos(lat) * Math.sin(l), r * Math.sin(lat)]); } return out; };

    // ---------- scenario setup ----------
    function setup() {
      const sc = SCEN[scenKey];
      res = null; outcome = null; touched = false; peeked = false; playing = false; tNow = 0;
      root.querySelectorAll('.pl-burn').forEach((g) => { g.hidden = sc.kind !== 'pc'; });
      $('#pl-lgroup').hidden = sc.kind !== 'launch';
      $('#pl-solve').hidden = false;
      $('#pl-w0').value = 'an'; $('#pl-w1').value = 'off';
      for (const i of [0, 1]) { $('#pl-u' + i).value = '0'; $('#pl-p' + i).value = '0'; $('#pl-n' + i).value = '0'; $('#pl-r' + i).value = '0'; }
      $('#pl-az').value = '90';
      $('#pl-task').textContent = T(sc.task);
      if (sc.kind === 'pc') {
        const s0 = P.rv(sc.el), el = P.elements(s0.r, s0.v);
        const dI = Math.abs(sc.el.i - sc.target.i);
        // reference costs for the report after execution
        let opt, alt = null;
        if (sc.combined) {
          const va = P.visViva(sc.el.a * (1 + sc.el.e), sc.el.a), vg = P.circV(RGEO);
          opt = P.combinedDv(va, vg, dI);
          alt = { planeThenCirc: P.planeDv(va, dI) + (vg - va), circThenPlane: (vg - va) + P.planeDv(vg, dI) };
        } else opt = P.planeDv(P.circV(sc.el.a), dI);
        S = { sc, s0, el, opt, alt, dI, T: el.T };
        flight = { s0, res: null }; tEnd = el.T;
      } else {
        const st = sc.site, cr = P.crossings(st.lat, st.i), v = P.circV(RE + st.alt);
        const bi = P.azInertial(st.lat, st.i), neG = P.azRelative(st.lat, bi, v), seG = P.azRelative(st.lat, Math.PI - bi, v);
        const lonN = st.O + cr.north.dl, lonS = st.O + cr.south.dl;
        const dtN = wrap(lonN - st.lon0) / P.C.wE, dtS = wrap(lonS - st.lon0) / P.C.wE;
        const Lt = P.launch(st.lat, lonN, neG, v, st.alt);
        S = { sc, st, v, bi, neG, seG, lonN, lonS, dtN, dtS, T: Lt.el.T, target: Lt, L: null };
        flight = null; tEnd = S.T;
      }
      renderInfo(); renderResult(); syncSlider(); view.redraw();
      setPlay();
    }

    // ---------- the flown path ----------
    const stateAt = (t) => {
      if (S.sc.kind === 'pc') return res ? P.stateAt(res, t) : P.propagate(S.s0, t);
      return S.L ? P.propagate({ r: S.L.r, v: S.L.v }, t) : null;
    };
    const getAt = (t) => S.sc.get0 + t;

    function renderInfo() {
      const sc = S.sc, live = $('#pl-live'), orb = $('#pl-orb');
      const st = stateAt(tNow);
      if (sc.kind === 'pc') {
        const e = P.elements(st.r, st.v), a0 = S.el;
        live.innerHTML = `<dt>GET</dt><dd class="hl">${UI.fmtTime(getAt(tNow))}</dd><dt>${T`Altitude`}</dt><dd>${km(P.vec.norm(st.r) - RE, 0)} km</dd><dt>${T`Speed`}</dt><dd>${f(P.vec.norm(st.v), 1)} m/s</dd><dt>u</dt><dd>${f(e.u * deg, 1)}°</dd><dt>${T`True anomaly ν`}</dt><dd>${f(e.nu * deg, 1)}°</dd>`;
        const o0 = P.elements(S.s0.r, S.s0.v), tg = sc.target;
        orb.innerHTML = `<dt>${T`Orbit before the burn`}</dt><dd></dd><dt>i</dt><dd>${f(a0.i * deg, 2)}°</dd><dt>Ω</dt><dd>${f(a0.O * deg, 2)}°</dd><dt>${T`periapsis × apoapsis`}</dt><dd>${km(o0.rp - RE)} × ${km(o0.ra - RE)} km</dd><dt>${T`period`}</dt><dd>${f(o0.T / 60, 1)} min</dd>
          <dt>${T`Target`}</dt><dd></dd><dt>i</dt><dd>${f(tg.i * deg, 2)}°</dd>${tg.i > 0 ? `<dt>Ω</dt><dd>${f(tg.O * deg, 2)}°</dd>` : ''}<dt>${T`shape`}</dt><dd>${sc.combined ? T`circular, 35 786 km` : T`unchanged`}</dd>`;
        $('#pl-ov').innerHTML = T`i = ${f(P.elements(st.r, st.v).i * deg, 2)}° · Ω = ${f(P.elements(st.r, st.v).O * deg, 1)}°`;
      } else {
        const s = S.st;
        live.innerHTML = `<dt>${T`Site latitude`}</dt><dd class="hl">${f(s.lat * deg, 1)}° N</dd><dt>${T`Target inclination`}</dt><dd>${f(s.i * deg, 1)}°</dd><dt>${T`Insertion speed`}</dt><dd>${f(S.v, 0)} m/s</dd><dt>${T`Ground speed at the site`}</dt><dd>${f(P.vEq * Math.cos(s.lat), 0)} m/s</dd>`;
        orb.innerHTML = `<dt>${T`Launch windows`}</dt><dd></dd><dt>${T`northeast, in`}</dt><dd>${f(S.dtN / 3600, 2)} h</dd><dt>${T`southeast, in`}</dt><dd>${f(S.dtS / 3600, 2)} h</dd><dt>${T`target Ω`}</dt><dd>${f(s.O * deg, 1)}°</dd>`;
        $('#pl-ov').innerHTML = S.L ? T`i = ${f(S.L.el.i * deg, 2)}°` : T`target i = ${f(s.i * deg, 1)}°`;
      }
    }

    function renderResult() {
      const box = $('#pl-res'), b = $('#pl-badge');
      if (!outcome) { box.innerHTML = ''; b.textContent = S.sc.kind === 'pc' ? T`Before the burn` : T`No launch yet`; b.className = 'badge'; return; }
      const o = outcome;
      if (o.error) { box.innerHTML = `<dt>${T`Problem`}</dt><dd class="hl">${o.error}</dd>`; b.textContent = T`Not flown`; b.className = 'badge bad'; return; }
      if (S.sc.kind === 'launch') {
        box.innerHTML = `<dt>${T`Azimuth entered`}</dt><dd>${f(o.az, 2)}°</dd><dt>${T`Resulting inclination`}</dt><dd class="hl">${f(o.inc, 2)}° ${o.okAz ? '✓' : '✗'}</dd><dt>${T`Inertial azimuth`}</dt><dd>${f(o.inert, 2)}°</dd><dt>${T`Azimuth for ${f(S.st.i * deg, 1)}°`}</dt><dd>${f(S.neG * deg, 2)}° / ${f(S.seG * deg, 2)}°</dd><dt>${T`Inclination error`}</dt><dd>${(o.inc - S.st.i * deg >= 0 ? '+' : '−') + f(Math.abs(o.inc - S.st.i * deg), 2)}°</dd>`;
        b.textContent = o.okAz ? T`In the right plane` : T`Off the plane`; b.className = 'badge ' + (o.okAz ? '' : 'bad'); return;
      }
      const fin = o.fin, tg = S.sc.target;
      let html = `<dt>${T`After the burns`}</dt><dd></dd><dt>i</dt><dd class="hl">${f(fin.i * deg, 2)}°</dd>${fin.i > 0.002 ? `<dt>Ω</dt><dd>${f(fin.O * deg, 2)}°</dd>` : ''}<dt>${T`periapsis × apoapsis`}</dt><dd>${km(fin.rp - RE)} × ${km(fin.ra - RE)} km</dd><dt>${T`Angle to the target plane`}</dt><dd class="hl">${f(o.planeErr, 2)}° ${o.planeErr <= 0.1 ? '✓' : '✗'}</dd><dt>${T`Total Δv`}</dt><dd class="hl">${f(o.dv, 0)} m/s</dd><dt>${T`Minimum for this job`}</dt><dd>${f(S.opt, 0)} m/s</dd>`;
      if (S.sc.combined && S.alt) html += `<dt>${T`Plane change at apo, then circularise`}</dt><dd>${f(S.alt.planeThenCirc, 0)} m/s</dd><dt>${T`Circularise, then plane change`}</dt><dd>${f(S.alt.circThenPlane, 0)} m/s</dd>`;
      if (scenKey === 'geo') html += `<dt>${T`Same 28.5° at 300 km`}</dt><dd>${f(P.planeDv(P.circV(RE + 300e3), 28.5 * D2R), 0)} m/s</dd>`;
      box.innerHTML = html;
      const m = [];
      if (o.pure) m.push(o.isPure ? T`The orbit shape is unchanged.` : T`The speed changed: the orbit is no longer the same shape. A pure plane change keeps the speed.`);
      if (S.sc.combined) m.push(o.reached ? T`Geostationary orbit reached.` : T`The orbit is not yet the circular equatorial target.`);
      if (peeked) m.push(T`No objective credit for this attempt.`);
      b.textContent = (S.sc.combined ? (o.reached && o.dv <= 1.03 * S.opt) : (o.planeErr <= 0.1 && (!o.pure || o.isPure))) ? T`Target met` : T`Target not met`;
      b.className = 'badge ' + (b.textContent === T`Target met` ? '' : 'bad');
      if (m.length) box.innerHTML += `<dt></dt><dd class="note" style="text-align:left">${m.join(' ')}</dd>`;
    }

    // ---------- execute ----------
    function execute() {
      if (S.sc.kind !== 'pc') return;
      const burns = [];
      for (const i of [0, 1]) {
        const w = $('#pl-w' + i).value; if (w === 'off') continue;
        const b = { when: w, u: num('#pl-u' + i) * D2R, pro: num('#pl-p' + i), nor: num('#pl-n' + i), rad: num('#pl-r' + i) };
        if (![b.u, b.pro, b.nor, b.rad].every(isFinite)) { outcome = { error: T`Enter numbers in every field.` }; renderResult(); return; }
        if (b.pro === 0 && b.nor === 0 && b.rad === 0) continue;
        burns.push(b);
      }
      if (!burns.length) { outcome = { error: T`Enter at least one non-zero burn component.` }; renderResult(); return; }
      const r = P.execute(S.s0, burns);
      if (r.burns.some((b) => b.error)) { outcome = { error: r.burns.find((b) => b.error).error === 'circular' ? T`A circular orbit has no apoapsis or periapsis. Choose a node, or a value of u.` : T`An equatorial orbit has no nodes.` }; renderResult(); return; }
      res = r;
      const sc = S.sc, fin = r.final, tg = sc.target;
      const planeErr = P.planeAngle(fin.hv, P.normalOf(tg.i, tg.O)) * deg;
      const a0 = S.el.a, isPure = Math.abs(fin.a - a0) / a0 < 0.01 && fin.e < 0.005 + S.el.e;
      const reached = sc.combined && fin.i * deg < 0.2 && fin.e < 0.01 && Math.abs(fin.a - tg.a) < 300e3;
      outcome = { fin, planeErr, dv: r.dvTotal, pure: !!sc.pure, isPure, reached };
      const credit = touched && !peeked;
      if (credit) {
        if (sc.pure && planeErr <= 0.1 && isPure) Progress.done('planes', 'plane');
        if (sc.combined && reached && r.dvTotal <= 1.03 * S.opt) Progress.done('planes', 'cheap');
      }
      const tl = r.legs[r.legs.length - 1].t0, fT = isFinite(fin.T) ? fin.T : 3600;
      tEnd = tl + Math.min(fT, 86400); tNow = 0; playing = !UI.reducedMotion();
      flight = { s0: S.s0, res };
      renderInfo(); renderResult(); syncSlider(); setPlay(); view.redraw();
    }

    function launch() {
      if (S.sc.kind !== 'launch') return;
      const az = num('#pl-az');
      if (!isFinite(az)) { outcome = { error: T`Enter the azimuth in degrees.` }; renderResult(); return; }
      const st = S.st, L = P.launch(st.lat, S.lonN, az * D2R, S.v, st.alt);
      S.L = L;
      const inc = L.el.i * deg, okAz = Math.abs(az - S.neG * deg) <= 0.5 || Math.abs(az - S.seG * deg) <= 0.5;
      outcome = { az, inc, inert: L.az * deg, okAz };
      if (touched && !peeked && okAz) Progress.done('planes', 'az');
      tEnd = L.el.T; tNow = 0; playing = !UI.reducedMotion();
      renderInfo(); renderResult(); syncSlider(); setPlay(); view.redraw();
    }

    function solve() {
      peeked = true;
      const sc = S.sc;
      if (sc.kind === 'launch') { $('#pl-az').value = String(Math.round(S.neG * deg * 100) / 100).replace('.', UI.fmt(0.5, 1)[1]); return; }
      const dI = S.dI, down = sc.el.i > sc.target.i, s = down ? -1 : 1;
      const dec = (x) => UI.fmt(x, 1).replace(/\u202f/g, '');
      if (sc.combined) {
        const va = P.visViva(sc.el.a * (1 + sc.el.e), sc.el.a), vg = P.circV(RGEO), cp = P.pad(va, vg, dI, s);
        $('#pl-w0').value = 'apo'; $('#pl-p0').value = dec(cp.pro); $('#pl-n0').value = dec(cp.nor);
      } else {
        const v = P.circV(sc.el.a), pd = P.pad(v, v, dI, s);
        $('#pl-w0').value = 'an'; $('#pl-p0').value = dec(pd.pro); $('#pl-n0').value = dec(pd.nor);
      }
      $('#pl-w1').value = 'off';
    }

    // ---------- animation ----------
    function syncSlider() { const sl = $('#pl-t'); sl.value = String(Math.min(1, tNow / tEnd)); const o = $('#pl-t-out'); if (o) o.textContent = UI.fmtTime(getAt(tNow)); }
    function setPlay() { $('#pl-play').textContent = playing ? T`❚❚ Pause` : T`▸ Play`; }
    UI.loop((dt) => {
      if (!playing || !S) return;
      tNow += dt * tEnd / 20;
      if (tNow >= tEnd) { tNow = tEnd; playing = false; setPlay(); }
      syncSlider(); renderInfo(); view.redraw();
    });
    $('#pl-play').addEventListener('click', () => { if (!playing && tNow >= tEnd) tNow = 0; playing = !playing; setPlay(); });
    $('#pl-restart').addEventListener('click', () => { tNow = 0; playing = !UI.reducedMotion(); setPlay(); syncSlider(); renderInfo(); view.redraw(); });
    $('#pl-t').addEventListener('input', (e) => { tNow = parseFloat(e.target.value) * tEnd; playing = false; setPlay(); const o = $('#pl-t-out'); if (o) o.textContent = UI.fmtTime(getAt(tNow)); renderInfo(); view.redraw(); });
    $('#pl-view').addEventListener('click', () => { cam.yaw = 0.6; cam.el = 0.5; view.redraw(); });

    // ---------- drag to rotate ----------
    const cv = $('#pl-cv');
    let drag = null;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    cv.addEventListener('pointermove', (e) => { if (!drag) return; cam.yaw += (e.clientX - drag.x) * 0.008; cam.el = Math.max(-1.55, Math.min(1.55, cam.el + (e.clientY - drag.y) * 0.008)); drag = { x: e.clientX, y: e.clientY }; view.redraw(); });
    const end = () => { drag = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

    // ---------- drawing ----------
    view.draw = (ctx, w, h) => {
      if (!S) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 70);
      const sc = S.sc, cx = w / 2, cy = h / 2;
      // rings (3D point lists) with styles
      const lines = [];
      const add = (pts, color, width, dash = []) => lines.push({ pts, color, width, dash });
      let rMax;
      if (sc.kind === 'pc') {
        const e0 = S.el;
        rMax = Math.max(e0.a * (1 + e0.e), sc.target.a) * 1.08;
        add(ringPts(e0), K.muted, 1.8);
        add(circle3(sc.target.a, sc.target.i, sc.target.i > 0 ? sc.target.O : 0), K.good, 1.6, [6, 5]);
        if (res) { const fe = res.final; if (fe.e < 1) add(ringPts({ a: fe.a, e: fe.e, i: fe.i, O: fe.O, w: fe.w, nu: 0 }), K.warn, 2.2); }
      } else {
        rMax = (RE + S.st.alt) * 1.35;
        const Lt = S.target;
        add(ringPts(Lt.el), K.good, 1.6, [6, 5]);
        if (S.L) add(ringPts(S.L.el), K.warn, 2.2);
      }
      const sk = Math.min(w, h) / 2 / rMax * 0.92;
      const X = (q) => cx + sk * q[0], Y = (q) => cy - sk * q[1];
      const dispR = (p) => { const q = proj(p); return [q[0], q[1], q[2]]; };
      // Earth graticule: equator, latitude, meridians
      const earthLines = [];
      earthLines.push({ pts: circle3(RE, 0, 0), color: K.accent, width: 1.6, dash: [] });
      const lat = sc.kind === 'launch' ? S.st.lat : 28.5 * D2R;
      earthLines.push({ pts: latCircle(RE, lat), color: K.warn, width: 1.1, dash: [3, 3] });
      for (const lon of [0, 45, 90, 135]) { const l = lon * D2R, pts = []; for (let k = 0; k <= 120; k++) { const t = 2 * Math.PI * k / 120; pts.push([RE * Math.cos(t) * Math.cos(l), RE * Math.cos(t) * Math.sin(l), RE * Math.sin(t)]); } earthLines.push({ pts, color: K.grid, width: 0.8, dash: [] }); }
      const all = earthLines.concat(lines);
      const strokeLine = (ln, hiddenPass) => {
        ctx.strokeStyle = ln.color; ctx.lineWidth = ln.width; ctx.setLineDash(hiddenPass ? [2, 4] : ln.dash); ctx.globalAlpha = hiddenPass ? 0.35 : 1;
        for (let k = 0; k < ln.pts.length - 1; k++) {
          const a = dispR(ln.pts[k]), b = dispR(ln.pts[k + 1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, md = (a[2] + b[2]) / 2;
          const hid = md < 0 && mx * mx + my * my < RE * RE;
          if (hid !== hiddenPass) continue;
          ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke();
        }
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      };
      all.forEach((ln) => strokeLine(ln, true));
      UI.drawEarth(ctx, cx, cy, RE * sk, K);
      ctx.globalAlpha = 0.55; ctx.fillStyle = K.bg; ctx.beginPath(); ctx.arc(cx, cy, RE * sk, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      all.forEach((ln) => strokeLine(ln, false));
      const visible = (p) => { const q = dispR(p); return !(q[2] < 0 && q[0] * q[0] + q[1] * q[1] < RE * RE); };
      const mark = (p, label, color, shape) => {
        const q = dispR(p), x = X(q), y = Y(q), vis = visible(p);
        ctx.globalAlpha = vis ? 1 : 0.4; ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.beginPath(); if (shape === 'sq') ctx.rect(x - 3.5, y - 3.5, 7, 7); else if (shape === 'tri') { ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.closePath(); } else ctx.arc(x, y, 4, 0, 7);
        shape === 'ring' ? ctx.stroke() : ctx.fill();
        if (label) {
          // first free spot around the mark, so node and burn labels never overlap
          ctx.font = `600 10px ${K.mono}`; ctx.textAlign = 'left';
          const w = ctx.measureText(label).width;
          const spots = [[8, -6], [8, 14], [-8 - w, -6], [-8 - w, 14]].map(([dx, dy]) => [x + dx, y + dy]);
          const free = spots.find(([lx, ly]) => !placed.some((b) => lx < b[0] + b[2] && lx + w > b[0] && ly - 10 < b[1] && ly > b[1] - 10)) || spots[0];
          placed.push([free[0], free[1], w]);
          ctx.fillText(label, free[0], free[1]);
        }
        ctx.globalAlpha = 1;
      };
      const placed = [];
      // axes: north pole and vernal equinox
      const ax = (p, label) => { const a = dispR([0, 0, 0]), b = dispR(p); ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = K.muted; ctx.font = `10px ${K.mono}`; ctx.textAlign = 'center'; ctx.fillText(label, X(b), Y(b) - 5); };
      ax([0, 0, rMax * 0.98], 'N'); ax([rMax * 0.98, 0, 0], '♈');
      if (sc.kind === 'pc') {
        const e0 = S.el;
        const nodeAt = (u) => P.rv({ ...e0, nu: u - e0.w }).r;
        const an = nodeAt(0), dn = nodeAt(Math.PI);
        // line of nodes
        const a = dispR(P.vec.mul(an, -1.05)), b = dispR(P.vec.mul(an, 1.05)); ctx.strokeStyle = K.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke(); ctx.globalAlpha = 1;
        mark(an, 'AN', K.ink, 'tri'); mark(dn, 'DN', K.ink, 'tri');
        if (res) res.burns.forEach((bn, k) => mark(bn.r, T`burn ${k + 1}`, K.bad, 'sq'));
        const st = stateAt(tNow); mark(st.r, '', K.accent, 'dot');
        ctx.fillStyle = K.muted; ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillText(T`grey: current · green: target · orange: result`, 10, h - 12);
      } else {
        const st = S.st, up = [Math.cos(st.lat) * Math.cos(S.lonN), Math.cos(st.lat) * Math.sin(S.lonN), Math.sin(st.lat)];
        mark(P.vec.mul(up, RE), T`launch site`, K.warn, 'sq');
        if (S.L) { const s = stateAt(tNow); mark(s.r, '', K.accent, 'dot'); }
        ctx.fillStyle = K.muted; ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillText(T`green dashed: target plane · orange: your orbit`, 10, h - 12);
      }
    };

    // ---------- wiring ----------
    $('#pl-scen').addEventListener('change', (e) => { scenKey = e.target.value; setup(); });
    root.querySelectorAll('.pl-burn select, .pl-burn input, #pl-az').forEach((el) => el.addEventListener('input', () => { touched = true; }));
    $('#pl-exec').addEventListener('click', execute);
    $('#pl-go').addEventListener('click', launch);
    $('#pl-solve').addEventListener('click', solve);
    root.querySelectorAll('.mc-fields input').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') (S.sc.kind === 'pc' ? execute : launch)(); }));
    $('#pl-scen').value = scenKey;
    setup();
  }
})();
