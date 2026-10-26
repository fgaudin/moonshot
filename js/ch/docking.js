/* Chapter — Docking: relative motion, Clohessy–Wiltshire, probe and drogue. Lab: docking simulator with a COAS sight. */
(function () {
  'use strict';

  // Scenarios. Positions in the target's orbital (Hill) frame: x along-track (+ ahead), z radial (+ away from the planet).
  // sT: the target's docking port faces +x (1) or −x (−1).
  const SCEN = {
    tde: { label: N`Transposition & docking (translunar coast)`, n: 0, m: 28800, F: 890, sT: 1, target: N`LM in the S-IVB adapter`,
      s: { x: 24, z: 0.6, vx: 0.12, vz: -0.01, th: 0 },
      brief: N`The CSM has just separated from the S-IVB and is drifting away, nose pointing away from the LM. Turn around, stop the drift, line up on the LM’s docking axis and close in gently.` },
    lunar: { label: N`Lunar orbit docking (after ascent)`, n: 8.82e-4, m: 16800, F: 890, sT: 1, target: N`Eagle, LM ascent stage`,
      s: { x: 95, z: -7, vx: -0.6, vz: 0.05, th: Math.PI + 0.07 },
      brief: N`Final approach in a 110 km lunar orbit. You are 95 m out and slightly below the docking axis, closing too fast. Orbital mechanics bends your path: watch the predicted trajectory.` },
    gemini: { label: N`The Gemini 4 lesson (low Earth orbit)`, n: 1.186e-3, m: 3600, F: 445, sT: -1, target: N`Titan II upper stage`,
      s: { x: -180, z: 0, vx: 0, vz: 0, th: 0 },
      brief: N`June 1965. Your booster’s upper stage floats 180 m ahead in the same orbit. Do what Jim McDivitt did: point at it and thrust forward. Use time warp ×20 and watch where you go.` },
  };
  const LT = 2.5, LC = 5.5;                    // target CoM → port, chaser CoM → probe tip (m)
  const EYE = 3.5;                             // COAS eye point, behind the probe tip (m)
  const TGT_R = 0.25, STANDOFF = 0.45, CROSS_ARM = 0.15;   // docking target disc radius, cross stand-off and arm (m)
  const ENV = { vmin: 0.03, vmax: 0.3, lat: 0.3, ang: 10, latRate: 0.15 };   // probe capture envelope

  App.chapter({
    id: 'docking', phase: N`Docking`, title: N`Docking`, lab: N`Docking simulator`,
    blurb: N`Two ships, one line: match attitude, position and velocity to within centimetres per second.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module TM-6 · Docking`,
          title: T`Docking`,
          lede: T`Rendezvous brings two spacecraft within a few hundred metres. Docking closes the last gap, a slow, precise dance where every push lasts forever and orbital mechanics still has a say.`,
          refs: [T`Sellers · Maneuvering in Space (rendezvous)`, T`BMW ch. 3 Basic Orbital Maneuvers`, T`Apollo Operations Handbook, CSM docking system`],
        })}
        ${Progress.briefing('docking', { theory: 'theory', lab: 'dk', math: 'refresher', mathLabel: N`Vectors and relative velocity.` })}

        <section class="section" id="theory">
          <h2><span class="idx">6.1</span>${T`What docking really is`}</h2>
          <div class="prose">
            <p>${T`A natural first picture: point the two docking axes at each other, then push them together. That is the right start, and it is one third of the job. Docking means bringing <b>three</b> things to zero at the same time:`}</p>
            <ol>
              <li>${T`<b>Attitude.</b> The two docking axes must be exactly opposite, nose to nose, and rolled so the latches and alignment marks match.`}</li>
              <li>${T`<b>Position.</b> The chaser must be <i>on</i> the target’s axis, not merely parallel to it. Two axes can be perfectly opposite yet a metre apart sideways, like two cars in neighbouring lanes.`}</li>
              <li>${T`<b>Velocity.</b> The relative velocity must shrink to a slow crawl straight along that axis, with no sideways drift and no rotation left.`}</li>
            </ol>
            <div class="eq">${T`\\[ \\hat a_c\\cdot\\hat a_t = -1, \\qquad d_\\perp = 0, \\qquad \\vec v_{rel} = -v_{close}\\,\\hat a_t \\ \\text{ with } 0.03 < v_{close} < 0.3\\ \\mathrm{m/s} \\]`}</div>
            ${Sym.where([['\\hat a_c', N`unit vector along the chaser’s docking axis (a hat means length 1: a pure direction)`, '—'], ['\\hat a_t', N`unit vector along the target’s docking axis, pointing out of its port`, '—'], ['\\cdot', N`dot product: for unit vectors it equals the cosine of the angle between them. −1 means exactly opposite (180°)`, ''], ['d_\\perp', N`sideways distance between the chaser’s probe and the target’s axis`, 'm'], ['\\vec v_{rel}', N`velocity of the chaser relative to the target`, 'm/s'], ['v_{close}', N`closing speed along the axis: walking pace is 1.4 m/s; docking is 10 to 50 times slower`, 'm/s']], N`Apollo’s probe could capture within about 0.3 m and 10° of misalignment, at 3 to 30 cm/s.`)}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`Crews tackle them in a fixed order. <b>Rotate first</b>: turning costs little propellant and changes nothing else. Then <b>null the sideways drift and slide onto the axis</b>. Only then <b>close in</b>, slowing down at each “braking gate” as the range shrinks: a common rule is a closing speed of about 1% of the range per second when far out, down to a few centimetres per second at contact.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.2</span>${T`Newton’s first law, for real`}</h2>
          <div class="prose">
            <p>${T`Everything you know about driving or walking involves friction: let go of the controls and you stop. In space nothing stops you. A thruster pulse changes your velocity, and that velocity stays until another pulse cancels it. Pilots fly <i>velocities</i>, not positions: a pulse to start moving, a coast, an opposite pulse to stop.`}</p>
            <div class="eq">\\[ \\Delta v = \\frac{F\\,t}{m} \\]</div>
            ${Sym.where(['dv', ['F', N`thrust of the thrusters firing (two 445 N Apollo RCS thrusters = 890 N)`, 'N'], ['t', N`how long they fire`, 's'], ['m', N`spacecraft mass (CSM ≈ 28.8 t on the way out)`, 'kg']], N`One second of translation on the full CSM changes the velocity by only 3 cm/s. Docking is a game of short taps.`)}
            ${Primer.box('relative')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.3</span>${T`Orbital mechanics up close`}</h2>
          <div class="prose">
            <p>${T`Seen from the target, the chaser does not move in straight lines. Both ships orbit the planet, and a small difference in height means a difference in orbital speed. In the target’s frame, the <b>Clohessy–Wiltshire</b> (Hill) equations describe the relative motion for small separations:`}</p>
            <div class="eq">\\[ \\ddot x = -2n\\,\\dot z + a_x, \\qquad \\ddot z = 3n^2 z + 2n\\,\\dot x + a_z \\]</div>
            ${Sym.where([['x', N`distance along the orbit (along-track, the “V-bar”), positive ahead of the target`, 'm'], ['z', N`distance away from the planet (radial, the “R-bar”), positive above the target`, 'm'], ['\\dot x,\\ \\dot z', N`relative velocities (one dot: per second)`, 'm/s'], ['\\ddot x,\\ \\ddot z', N`relative accelerations (two dots)`, 'm/s²'], 'n', ['a_x,\\ a_z', N`acceleration from your own thrusters`, 'm/s²']], N`The extra terms are the orbital effects: 2n·ż and 2n·ẋ couple the two directions (a Coriolis effect), 3n²z pushes you away from the target’s altitude.`)}
            <p>${T`<b>The Gemini 4 paradox.</b> In June 1965 Jim McDivitt tried to fly his Gemini capsule up to the spent upper stage of his Titan rocket, a few hundred metres ahead. He pointed at it and thrust forward. Thrusting forward raised his orbit, a higher orbit is slower, and the target pulled away. The harder he pushed, the worse it got, and he gave up to save propellant. The fix, used ever since: to catch something ahead, you briefly <i>slow down</i> and drop to a lower, faster orbit (Chapter 5).`}</p>
            <p>${T`The orbital terms grow with \\(n\\) and with time. Over a one-minute final approach in lunar orbit, \\(n t \\approx 0.05\\) rad, so paths look almost straight. Over a 15-minute approach from 1 km out they curve a lot. That is why long-range approaches are planned as orbital manoeuvres and the final 30 m are flown by hand, almost like flying in free space.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.4</span>${T`Lab: dock`}</h2>
          <div class="prose"><p>${T`Top-down view in the target’s frame, real RCS numbers. The dashed line predicts your path if you stop firing. The <b>COAS</b> inset is the view through the Crewman Optical Alignment Sight in the CSM window: when you are on the axis and aligned, the docking target’s stand-off cross sits in the middle of the target disc behind it. A cross offset from the ring means your angle is off (parallax); the whole target off-centre means you are off the axis.`}</p>
          <p class="mono note">${T`Keys: ↑/↓ or W/S thrust forward/back · ←/→ or A/D translate left/right · Q/E rotate · hold Shift for fine thrust · F cycles thruster mode · H cycles rotation mode · V toggles real mode · 1/2/3 time warp · R restart. Buttons work on touch screens (hold to fire).`}</p>
          <p>${T`<b>Real mode</b> hides the map: you fly from the COAS and the numbers alone, as the crews did. The target’s face grows as you approach and narrows when you come in at an angle. Watch the stand-off cross against the target disc behind it, and the degree marks on the reticle.`}</p></div>
          <div class="lab" id="dk">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Docking simulator`}</h3><span class="spacer"></span>
              <select id="dk-scen" aria-label="${T`Scenario`}">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select>
              <div class="seg" id="dk-warp" role="group" aria-label="${T`Time warp`}"><button data-v="1" aria-pressed="true">×1</button><button data-v="5" aria-pressed="false">×5</button><button data-v="20" aria-pressed="false">×20</button></div>
              <button class="btn primary" id="dk-start">${T`▸ Start`}</button></div>
            <div class="stage" style="min-height:480px" tabindex="0" id="dk-stage" aria-label="${T`Docking simulation. Use the keyboard or the buttons.`}"><canvas id="dk-cv"></canvas><div class="overlay" id="dk-ov"></div><div class="badge" id="dk-badge">${T`Ready`}</div></div>
            <div class="controls">
              <p class="note" id="dk-brief" style="margin:0"></p>
              <div class="ctl"><span class="mono note">${T`Thrusters`}</span><div class="seg" id="dk-thr" role="group" aria-label="${T`Thruster mode`}"><button data-v="full" aria-pressed="true" title="${T`Two jets, 890 N`}">${T`Full`}</button><button data-v="fine" aria-pressed="false" title="${T`Quarter thrust, slow rotation`}">${T`Fine ¼`}</button><button data-v="pulse" aria-pressed="false" title="${T`Each tap gives 1 cm/s`}">${T`Pulse`}</button></div></div>
              <div class="ctl"><span class="mono note">${T`Rotation`}</span><div class="seg" id="dk-rot" role="group" aria-label="${T`Rotation control mode`}"><button data-v="hold" aria-pressed="true" title="${T`Rate command: releasing the stick stops the rotation`}">${T`Attitude hold`}</button><button data-v="drift" aria-pressed="false" title="${T`Jets fire only while held; the rotation persists`}">${T`Free drift`}</button><button data-v="minimp" aria-pressed="false" title="${T`Each tap adds ±0.1°/s`}">${T`Min impulse`}</button></div></div>
              <div class="ctl"><span class="mono note">${T`View`}</span><div class="seg" id="dk-view" role="group" aria-label="${T`View`}"><button data-v="map" aria-pressed="true">${T`Map + COAS`}</button><button data-v="coas" aria-pressed="false">${T`Real mode: COAS only`}</button></div></div>
              <dl class="readout" id="dk-ro"></dl>
              <div class="dk-pad" role="group" aria-label="${T`Thruster controls`}">
                <button class="btn" data-k="rotL" aria-label="${T`Rotate left`}">⟲</button><button class="btn" data-k="fwd" aria-label="${T`Thrust forward`}">▲</button><button class="btn" data-k="rotR" aria-label="${T`Rotate right`}">⟳</button>
                <button class="btn" data-k="left" aria-label="${T`Translate left`}">◀</button><button class="btn" data-k="back" aria-label="${T`Thrust back`}">▼</button><button class="btn" data-k="right" aria-label="${T`Translate right`}">▶</button>
              </div>
              <p class="note" id="dk-msg" style="margin:0;min-height:3em;font-family:var(--f-mono);font-size:.8rem" aria-live="polite"></p>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.5</span>${T`The hardware: probe, drogue and latches`}</h2>
          <div class="prose">
            <p>${T`The CSM carried a <b>probe</b> on its nose; the LM had a funnel-shaped <b>drogue</b> in its top hatch. The drogue guided the probe tip into a socket, where three small <b>capture latches</b> snapped shut: soft dock. A nitrogen-powered retraction then pulled the two ships together, and <b>twelve hard latches</b> around the tunnel rim locked them into one pressurised structure. The crew then removed the probe and drogue to open a tunnel between the two cabins.`}</p>
            <p>${T`Sixteen <b>RCS thrusters</b> of 445 N each, in four quads around the service module, provided both rotation and translation. The commander used two hand controllers: the rotation controller (right hand) and the translation controller (left hand).`}</p>
            <p>${T`The autopilot offered several <b>rotation control modes</b>, all in the simulator. In <b>attitude hold</b> (rate command), the stick commands a rotation rate; release it and the jets fire the other way to stop the turn and hold the new attitude. In <b>free drift</b>, the jets fire only while the stick is deflected; the spacecraft keeps turning until you stop it, and nothing fires to hold attitude, which saves propellant during long coasts. <b>Minimum impulse</b> gives the smallest possible pulse per tap, for fine corrections.`}</p>
            <div class="eq">${T`\\[ \\text{cost of a turn} \\;\\propto\\; |\\Delta\\omega_{start}| + |\\Delta\\omega_{stop}| = 2\\,\\omega \\]`}</div>
            ${Sym.where([['\\omega', N`rotation rate during the turn`, N`rad/s or °/s`], ['\\Delta\\omega', N`change of rotation rate produced by the jets (like Δv, for rotation)`, '°/s']], N`Going from one attitude to another, at rest at both ends, always costs a start and an equal stop, whoever does the braking. A slower turn costs less but takes longer: turning 180° at 2°/s takes 90 s and costs 4°/s of Δω; at 0.5°/s it takes 6 minutes and costs only 1°/s.`)}
          </div>
        </section>

        ${Archive.capsule('dockingSystem')}

        <section class="section">
          <h2><span class="idx">6.6</span>${T`Apollo’s two dockings`}</h2>
          <div class="prose">
            <p>${T`<b>Transposition, docking and extraction</b>, about three hours after launch on the way to the Moon. The CSM separated from the S-IVB, drifted away, turned 180°, came back and docked with the LM still stowed in the adapter atop the S-IVB, then pulled it out. On Apollo 14 the probe refused to latch five times in a row; the sixth attempt, with a firmer push, captured. Without it there would have been no landing.`}</p>
            <p>${T`<b>Lunar orbit docking</b>, after the LM’s ascent from the surface and its rendezvous. On most missions the command module pilot flew the final docking with the LM holding attitude. Apollo 11’s crew was reunited at GET 128:03, about four hours after liftoff from Tranquility Base.`}</p>
          </div>
        </section>

        ${Archive.capsule('eagleReturns')}

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('docking', { math: 'relative', mathLabel: N`Relative velocity and reference frames.` })}`;

      mountDocking(page.querySelector('#dk'));
      Practice.embed(page.querySelector('#practice-slot'), 'docking', 2);
    },
  });

  function mountDocking(root) {
    let scen = SCEN.tde, S = null, running = false, ended = false, warp = 1, keys = {}, path = [], msgTimer = 0;
    let thrMode = 'full', viewMode = 'map', rotMode = 'hold';
    const MIN_IMP = 0.1 * Math.PI / 180;                               // rad/s per tap in minimum-impulse mode
    const PULSE = 0.01;                                                // m/s per tap in pulse mode
    const fine = () => thrMode !== 'full' || keys.shift;
    const view = UI.canvas(root.querySelector('#dk-cv'), null);
    const stage = root.querySelector('#dk-stage');
    const startBtn = root.querySelector('#dk-start');
    const say = (t) => { root.querySelector('#dk-msg').textContent = t; };
    const badge = (t, c) => { const b = root.querySelector('#dk-badge'); b.textContent = t; b.className = 'badge ' + (c || ''); };
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    function reset() {
      const s = scen.s;
      S = { x: s.x, z: s.z, vx: s.vx, vz: s.vz, th: s.th, om: 0, t: 0, dv: 0, fwdDv: 0, fuel: 0, prevAlong: Infinity, fire: {}, flash: {}, mapRange: Infinity, rotDv: 0 };
      path = []; ended = false; keys = {};
      root.querySelector('#dk-brief').textContent = T(scen.brief);
      badge(T`Ready`, ''); say(T`Target: ${T(scen.target)}.`);
    }

    // geometry helpers
    const portPos = () => ({ x: scen.sT * LT, z: 0 });
    const tip = (s = S) => ({ x: s.x + LC * Math.cos(s.th), z: s.z + LC * Math.sin(s.th) });
    const thReq = () => (scen.sT > 0 ? Math.PI : 0);
    function rel() {
      const p = portPos(), t = tip();
      const along = (t.x - p.x) * scen.sT;                            // distance in front of the port, along its axis
      const vtx = S.vx - S.om * LC * Math.sin(S.th), vtz = S.vz + S.om * LC * Math.cos(S.th);
      return { along, lat: t.z, close: -vtx * scen.sT, latRate: vtz, angErr: wrap(S.th - thReq()) * 180 / Math.PI };
    }

    function accel(s, ab, al) {
      const n = scen.n;
      const ax = ab * Math.cos(s.th) - al * Math.sin(s.th), az = ab * Math.sin(s.th) + al * Math.cos(s.th);
      return [ax - 2 * n * s.vz, az + 3 * n * n * s.z + 2 * n * s.vx, ax, az];
    }

    function step(dt) {
      // pulse mode: translation only through discrete taps (see pulse()); fine mode: a quarter of the thrust
      const a = thrMode === 'pulse' ? 0 : scen.F / scen.m * (fine() ? 0.25 : 1);
      const ab = ((keys.fwd ? 1 : 0) - (keys.back ? 1 : 0)) * a, al = ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * a;
      S.fire = { fwd: (keys.fwd && a > 0) || S.flash.fwd > S.t, back: (keys.back && a > 0) || S.flash.back > S.t, left: (keys.left && a > 0) || S.flash.left > S.t, right: (keys.right && a > 0) || S.flash.right > S.t };
      const [ax, az] = accel(S, ab, al);
      S.vx += ax * dt; S.vz += az * dt; S.x += S.vx * dt; S.z += S.vz * dt;
      const thrusting = Math.abs(ab) + Math.abs(al);
      S.dv += thrusting * dt;
      if (ab > 0) S.fwdDv += ab * dt;
      // rotation: rate command, 2°/s, reached with 2°/s² of angular acceleration
      // rotation. Attitude hold: the stick commands a rate, release brings it back to zero.
      // Free drift: the jets accelerate only while the stick is held; the rate then persists.
      // Minimum impulse: taps only (see rotTap()), the rate persists.
      const dir = (keys.rotL ? 1 : 0) - (keys.rotR ? 1 : 0), alpha = (fine() ? 0.5 : 2) * Math.PI / 180;
      let dw = 0;
      if (rotMode === 'hold') {
        const wCmd = dir * (fine() ? 0.5 : 2) * Math.PI / 180;
        dw = Math.max(-alpha * dt, Math.min(alpha * dt, wCmd - S.om));
      } else if (rotMode === 'drift') dw = dir * alpha * dt;
      S.om += dw; S.th += S.om * dt;
      S.rotDv += Math.abs(dw) * 180 / Math.PI;
      // propellant: two 445 N thrusters per translation axis, Isp 280 s; rotation pulses are small
      S.fuel += (thrusting > 0 ? scen.F * (fine() ? 0.25 : 1) / (280 * 9.80665) : 0) * dt + Math.abs(dw) * 30;
      S.t += dt;
      contact();
      if (scen.n && S.fwdDv > 0.3 && Math.abs(S.z) > 8 && scen === SCEN.gemini) {
        Progress.done('docking', 'paradox');
        if (!S.paradoxSaid) { S.paradoxSaid = true; say(T`You thrust straight at the target, and climbed above it. A higher orbit is slower: it is pulling away from you. That is the Gemini 4 paradox.`); }
      }
      if (Math.hypot(S.x, S.z) > 450) { running = false; ended = true; badge(T`Lost visual contact: abort`, 'bad'); say(T`More than 450 m away. Restart and try again.`); }
    }

    // minimum impulse: one rotation tap changes the rate by ±0.1°/s, and it stays
    function rotTap(k) {
      if (!running) return;
      const dw = (k === 'rotL' ? 1 : -1) * MIN_IMP;
      S.om += dw; S.rotDv += MIN_IMP * 180 / Math.PI; S.fuel += Math.abs(dw) * 30;
    }

    // one RCS tap: an instant 1 cm/s along a body axis
    function pulse(k) {
      if (!running || !['fwd', 'back', 'left', 'right'].includes(k)) return;
      const bx = k === 'fwd' ? 1 : k === 'back' ? -1 : 0, bz = k === 'left' ? 1 : k === 'right' ? -1 : 0;
      S.vx += PULSE * (bx * Math.cos(S.th) - bz * Math.sin(S.th));
      S.vz += PULSE * (bx * Math.sin(S.th) + bz * Math.cos(S.th));
      S.dv += PULSE; S.fuel += scen.m * PULSE / (280 * 9.80665);
      if (k === 'fwd') S.fwdDv += PULSE;
      S.flash[k] = S.t + 0.3 * warp;
    }

    function contact() {
      const r = rel();
      const crossed = S.prevAlong > 0 && r.along <= 0;
      S.prevAlong = r.along;
      // bodies colliding outside the port
      if (Math.hypot(S.x, S.z) < LT + 2.2 && !crossed && r.along > 0.5) {
        running = false; ended = true; badge(T`Collision`, 'bad'); say(T`The two hulls touched outside the docking port. Restart and line up on the axis before closing in.`); return;
      }
      if (!crossed || Math.abs(r.lat) > 2.1) return;
      const fast = r.close > ENV.vmax, slow = r.close < ENV.vmin;
      const misaligned = Math.abs(r.lat) > ENV.lat || Math.abs(r.angErr) > ENV.ang || Math.abs(r.latRate) > ENV.latRate;
      if (fast) {
        running = false; ended = true; badge(T`Too hard: ${UI.fmt(r.close * 100, 0)} cm/s`, 'bad');
        say(T`Contact at ${UI.fmt(r.close * 100, 0)} cm/s. The probe is designed for at most ${Math.round(ENV.vmax * 100)} cm/s: structural damage. Restart and brake earlier.`);
        return;
      }
      if (slow || misaligned) {
        // bounce back off the drogue
        const p = portPos(), t = tip();
        S.x += (p.x + scen.sT * 0.06) - t.x;                           // put the probe tip back 6 cm in front of the port
        S.vx = -S.vx * 0.4; S.vz += (Math.random() - 0.5) * 0.02;
        S.prevAlong = 0.06;
        say(slow ? T`Touch… but too slow: the capture latches did not trip (they need at least 3 cm/s). Back off a little and come in again.`
          : T`The probe glanced off the drogue: ${Math.abs(r.lat) > ENV.lat ? T`${UI.fmt(Math.abs(r.lat), 2)} m off the axis` : Math.abs(r.angErr) > ENV.ang ? T`${UI.fmt(Math.abs(r.angErr), 1)}° misaligned` : T`drifting sideways`}. Back off, realign, try again.`);
        return;
      }
      // capture
      running = false; ended = true;
      S.vx = 0; S.vz = 0; S.om = 0;
      badge(T`Capture!`, 'good');
      say(T`Capture at ${UI.fmt(r.close * 100, 1)} cm/s, ${UI.fmt(Math.abs(r.lat) * 100, 0)} cm off axis, ${UI.fmt(Math.abs(r.angErr), 1)}° misaligned. Capture latches engaged…`);
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => { say(T`Retracting the probe… twelve hard latches fired. Hard dock: the two ships are one.`); badge(T`Hard dock`, 'good'); }, 2200);
      UI.onCleanup(() => clearTimeout(msgTimer));
      if (scen === SCEN.tde) Progress.done('docking', 'tde');
      if (scen === SCEN.lunar) Progress.done('docking', 'lunar');
      if (viewMode === 'coas' && S.mapRange >= 30) Progress.done('docking', 'blind');
      if (r.close <= 0.1) Progress.done('docking', 'soft');
    }

    // prediction: coast without thrust
    function predict() {
      const p = { ...S }, pts = [];
      const tEnd = scen.n ? 900 : 120, dt = scen.n ? 3 : 1;
      for (let t = 0; t <= tEnd; t += dt) {
        pts.push([p.x, p.z]);
        const [ax, az] = accel(p, 0, 0);
        p.vx += ax * dt; p.vz += az * dt; p.x += p.vx * dt; p.z += p.vz * dt;
      }
      return pts;
    }

    view.draw = (ctx, w, h) => {
      if (!S) return;
      const tk = UI.tok();
      ctx.clearRect(0, 0, w, h);
      if (viewMode === 'coas') { drawCOAS(ctx, 0, 0, w, h, tk, true); return; }
      const range = Math.hypot(S.x, S.z);
      const span = Math.max(26, Math.min(700, range * 2.4 + 12));
      const s = Math.min(w, h * 1.4) / span;
      const cx = w * 0.5 - (S.x * 0.45) * s, cy = h * 0.5 + (S.z * 0.45) * s;
      const P = (x, z) => [cx + x * s, cy - z * s];
      // grid
      const step = UI.niceStep(span, 8);
      ctx.strokeStyle = tk.grid; ctx.lineWidth = 1;
      for (let g = Math.floor((-cx / s) / step) * step; g < (w - cx) / s; g += step) { const [x] = P(g, 0); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let g = Math.floor(((cy - h) / s) / step) * step; g < cy / s; g += step) { const [, y] = P(0, g); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.font = `10px ${tk.mono}`; ctx.fillStyle = tk.muted; ctx.textAlign = 'left';
      ctx.fillText(T`grid ${step} m · ${scen.n ? T`V-bar → along the orbit` : T`free space (no orbital effects)`}`, 10, h - 10);
      if (scen.n) { ctx.textAlign = 'right'; ctx.fillText(`${scen === SCEN.lunar ? T`Moon` : T`Earth`} ↓  (R-bar)`, w - 10, h - 10); }
      // approach corridor (±10°)
      const port = portPos();
      const [px, py] = P(port.x, port.z);
      ctx.fillStyle = tk.good; ctx.globalAlpha = 0.07;
      const L = span * 1.5, c = Math.tan(10 * Math.PI / 180);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(...P(port.x + scen.sT * L, L * c)); ctx.lineTo(...P(port.x + scen.sT * L, -L * c)); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = tk.good; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(...P(port.x + scen.sT * L, 0)); ctx.stroke(); ctx.setLineDash([]);
      // predicted coast
      const pr = predict();
      ctx.strokeStyle = tk.accent; ctx.globalAlpha = 0.6; ctx.setLineDash([4, 5]); ctx.beginPath();
      pr.forEach(([x, z], i) => { const [X, Y] = P(x, z); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      // flown path
      if (path.length > 1) { ctx.strokeStyle = tk.trace; ctx.globalAlpha = 0.5; ctx.beginPath(); path.forEach(([x, z], i) => { const [X, Y] = P(x, z); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.globalAlpha = 1; }
      // target body and drogue
      ctx.fillStyle = tk.moon; ctx.strokeStyle = tk.ink; ctx.lineWidth = 1;
      const [tx0, ty0] = P(-2.2, 2.1), [tx1, ty1] = P(2.2, -2.1);
      ctx.fillRect(tx0, ty0, tx1 - tx0, ty1 - ty0); ctx.strokeRect(tx0, ty0, tx1 - tx0, ty1 - ty0);
      ctx.fillStyle = tk.accent; ctx.beginPath(); ctx.moveTo(...P(port.x, 0.8)); ctx.lineTo(...P(port.x - scen.sT * 0.3, 0.35)); ctx.lineTo(...P(port.x - scen.sT * 0.3, -0.35)); ctx.lineTo(...P(port.x, -0.8)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tk.muted; ctx.textAlign = 'center'; const [lx, ly] = P(0, -2.1); ctx.fillText(T(scen.target), lx, ly + 14);
      // chaser (CSM silhouette, body frame: +x = nose)
      const body = [[-5.5, -1.95], [1.5, -1.95], [4.5, -0.6], [4.5, 0.6], [1.5, 1.95], [-5.5, 1.95]];
      const B = (bx, bz) => P(S.x + bx * Math.cos(S.th) - bz * Math.sin(S.th), S.z + bx * Math.sin(S.th) + bz * Math.cos(S.th));
      ctx.fillStyle = tk.panel; ctx.strokeStyle = tk.ink; ctx.lineWidth = 1.5; ctx.beginPath();
      body.forEach(([bx, bz], i) => { const [X, Y] = B(bx, bz); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = tk.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...B(4.5, 0)); ctx.lineTo(...B(LC, 0)); ctx.stroke();
      // thruster plumes (opposite to the push)
      const plume = (bx, bz, dx, dz) => { ctx.strokeStyle = tk.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...B(bx, bz)); ctx.lineTo(...B(bx + dx, bz + dz)); ctx.stroke(); };
      if (S.fire.fwd) { plume(-3, 2.1, -1.4, 0); plume(-3, -2.1, -1.4, 0); }
      if (S.fire.back) { plume(-1, 2.1, 1.4, 0); plume(-1, -2.1, 1.4, 0); }
      if (S.fire.left) plume(-2, -2.1, 0, -1.4);
      if (S.fire.right) plume(-2, 2.1, 0, 1.4);
      // relative velocity arrow (1 m/s = 120 px)
      const [cxp, cyp] = P(S.x, S.z), vlen = Math.hypot(S.vx, S.vz);
      if (vlen > 0.003) UI.arrow(ctx, cxp, cyp, cxp + S.vx * 120, cyp - S.vz * 120, tk.trace, 1.6);
      const W = Math.min(230, w * 0.38);
      drawCOAS(ctx, w - W - 10, 10, W, W * 0.7, tk, false);
    };

    // Crewman Optical Alignment Sight: what the pilot sees along the nose.
    // Planar model: everything lies on the sight's horizontal line; sizes come from angular size.
    function drawCOAS(ctx, x0, y0, W, H, tk, big) {
      const cx = x0 + W / 2, cy = y0 + H / 2;
      const fov = big ? 24 : 34;                                   // horizontal field of view, degrees
      const K = W / (fov * Math.PI / 180);                         // pixels per radian
      ctx.fillStyle = '#05080d'; ctx.fillRect(x0, y0, W, H);
      // the sight sits in the CM window, EYE metres behind the probe tip, looking along the docking axis
      const fx = Math.cos(S.th), fz = Math.sin(S.th), lx = -Math.sin(S.th), lz = Math.cos(S.th);
      const t = { x: S.x + (LC - EYE) * fx, z: S.z + (LC - EYE) * fz };
      const project = (px, pz) => { const dx = px - t.x, dz = pz - t.z, f = dx * fx + dz * fz, l = dx * lx + dz * lz; return f > 0.2 ? { x: cx - K * Math.atan2(l, f), f } : null; };
      const port = portPos();
      const ring = project(port.x, port.z), cross = project(port.x + scen.sT * STANDOFF, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.clip();
      if (ring && (ring.x < x0 - 10 || ring.x > x0 + W + 10)) {
        const left = ring.x < x0;
        ctx.font = `${big ? 14 : 10}px ${tk.mono}`; ctx.fillStyle = '#ffd278'; ctx.textAlign = left ? 'left' : 'right';
        ctx.fillText(left ? T`◀ target` : T`target ▶`, left ? x0 + 8 : x0 + W - 8, cy - 10);
      } else if (ring) {
        // target face: its two edges projected separately, so an oblique view foreshortens it
        const faceX = scen.sT * 2.2, e1 = project(faceX, 2.1), e2 = project(faceX, -2.1);
        if (big && e1 && e2) {
          const half = K * Math.atan(2.1 / ring.f);
          ctx.fillStyle = '#4a4f57'; ctx.strokeStyle = '#8b9099'; ctx.lineWidth = 1.5;
          const xa = Math.min(e1.x, e2.x), xb = Math.max(e1.x, e2.x);
          ctx.fillRect(xa, cy - half, xb - xa, 2 * half); ctx.strokeRect(xa, cy - half, xb - xa, 2 * half);
        }
        const r = Math.max(2, K * Math.atan(TGT_R / ring.f));
        ctx.strokeStyle = '#c9d2df'; ctx.lineWidth = big ? 2.5 : 1.5; ctx.beginPath(); ctx.arc(ring.x, cy, r, 0, 7);
        ctx.fillStyle = big ? '#2a2e35' : 'rgba(201,210,223,.15)'; ctx.fill(); ctx.stroke();
        if (cross) {
          const a = Math.max(3, K * Math.atan(CROSS_ARM / cross.f));
          ctx.strokeStyle = '#5fd39a'; ctx.lineWidth = big ? 3 : 2; ctx.beginPath(); ctx.moveTo(cross.x - a, cy); ctx.lineTo(cross.x + a, cy); ctx.moveTo(cross.x, cy - a); ctx.lineTo(cross.x, cy + a); ctx.stroke();
        }
      } else { ctx.font = `${big ? 14 : 10}px ${tk.mono}`; ctx.fillStyle = '#c9d2df'; ctx.textAlign = 'center'; ctx.fillText(T`target behind you: rotate`, cx, cy + 24); }
      ctx.restore();
      // reticle, drawn over the scene, with degree marks
      ctx.strokeStyle = 'rgba(255,210,120,.6)'; ctx.fillStyle = 'rgba(255,210,120,.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + W, cy); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + H); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, K * (big ? 2 : 5) * Math.PI / 180, 0, 7); ctx.stroke();
      if (big) {
        ctx.font = `11px ${tk.mono}`; ctx.textAlign = 'center';
        for (let d = -10; d <= 10; d++) {
          if (!d) continue;
          const px = cx + K * d * Math.PI / 180, py = cy - K * d * Math.PI / 180, L = d % 5 ? 4 : 9;
          ctx.beginPath(); ctx.moveTo(px, cy - L); ctx.lineTo(px, cy + L); ctx.moveTo(cx - L, py); ctx.lineTo(cx + L, py); ctx.stroke();
          if (!(d % 5)) ctx.fillText(Math.abs(d) + '°', px, cy + 22);
        }
      }
      ctx.font = `${big ? 12 : 10}px ${tk.mono}`; ctx.textAlign = 'left';
      ctx.fillText(big ? T`COAS · ${fov}° field of view · real mode` : 'COAS', x0 + 8, big ? y0 + H - 12 : y0 + 13);
      if (big && running) {
        const parts = Object.entries(S.fire).filter(([, v]) => v).map(([k]) => ({ fwd: T`FWD`, back: T`AFT`, left: T`LEFT`, right: T`RIGHT` }[k]));
        if (parts.length) { ctx.fillStyle = '#ffb04a'; ctx.textAlign = 'right'; ctx.fillText('RCS ' + parts.join(' '), x0 + W - 10, y0 + H - 12); }
      }
      ctx.strokeStyle = tk.line; ctx.strokeRect(x0, y0, W, H);
    }

    function readout() {
      const r = rel(), sug = 0.03 + Math.max(0, r.along) / 100;
      const col = (ok) => (ok ? '' : ' style="color:var(--bad)"');
      root.querySelector('#dk-ro').innerHTML = `
        <dt>MET</dt><dd>${UI.fmtTime(S.t)}</dd>
        <dt>${T`Range to port`}</dt><dd class="hl">${UI.fmt(Math.max(0, r.along), 1)} m</dd>
        <dt>${T`Closing rate`}</dt><dd${col(r.close <= Math.max(sug, ENV.vmax) || r.along > 60)}>${UI.fmt(r.close * 100, 1)} cm/s</dd>
        <dt>${T`Suggested max`}</dt><dd>${UI.fmt(sug * 100, 0)} cm/s</dd>
        <dt>${T`Off axis`}</dt><dd${col(Math.abs(r.lat) <= ENV.lat || r.along > 5)}>${UI.fmt(r.lat, 2)} m</dd>
        <dt>${T`Sideways drift`}</dt><dd>${UI.fmt(r.latRate * 100, 1)} cm/s</dd>
        <dt>${T`Attitude error`}</dt><dd${col(Math.abs(r.angErr) <= ENV.ang)}>${UI.fmt(r.angErr, 1)}°</dd>
        <dt>${T`Rotation rate`}</dt><dd>${UI.fmt(S.om * 180 / Math.PI, 2)} °/s</dd>
        <dt>${T`RCS Δv used`}</dt><dd>${UI.fmt(S.dv, 2)} m/s</dd>
        <dt>${T`Propellant used`}</dt><dd>${UI.fmt(S.fuel, 1)} kg</dd>
        <dt>${T`Rotation Δω spent`}</dt><dd>${UI.fmt(S.rotDv, 2)} °/s</dd>
        <dt>${T`Rotation mode`}</dt><dd>${{ hold: T`attitude hold`, drift: T`free drift`, minimp: T`min impulse, 0.1°/s` }[rotMode]}</dd>
        <dt>${T`Thrusters`}</dt><dd>${thrMode === 'pulse' ? T`pulse, 1 cm/s per tap` : fine() ? T`fine, ¼ thrust` : T`full, 890 N`}</dd>`;
      root.querySelector('#dk-ov').innerHTML = running || ended ? T`warp ×${warp}` : T`Press Start. Rotate first, then line up, then close.`;
    }

    // controls
    startBtn.addEventListener('click', () => { reset(); running = true; badge(T`In flight`, ''); startBtn.textContent = T`⟲ Restart`; stage.focus({ preventScroll: true }); });
    root.querySelector('#dk-scen').addEventListener('change', (e) => { scen = SCEN[e.target.value]; reset(); running = false; startBtn.textContent = T`▸ Start`; });
    UI.seg(root, '#dk-warp', (v) => { warp = +v; });
    UI.seg(root, '#dk-thr', (v) => { thrMode = v; stage.focus({ preventScroll: true }); });
    UI.seg(root, '#dk-rot', (v) => { rotMode = v; keys.rotL = keys.rotR = false; stage.focus({ preventScroll: true }); });
    UI.seg(root, '#dk-view', (v) => { viewMode = v; stage.focus({ preventScroll: true }); });
    const KEYS = { ArrowUp: 'fwd', KeyW: 'fwd', ArrowDown: 'back', KeyS: 'back', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyQ: 'rotL', KeyE: 'rotR' };
    const onKey = (e, down) => {
      const k = KEYS[e.code];
      if (e.key === 'Shift') keys.shift = down;
      if (k && running) {
        e.preventDefault();
        if (thrMode === 'pulse' && !k.startsWith('rot')) { if (down && !e.repeat) pulse(k); }
        else if (rotMode === 'minimp' && k.startsWith('rot')) { if (down && !e.repeat) rotTap(k); }
        else keys[k] = down;
      }
      if (!down) return;
      if (e.code === 'KeyH') root.querySelector(`#dk-rot [data-v="${{ hold: 'drift', drift: 'minimp', minimp: 'hold' }[rotMode]}"]`).click();
      if (e.code === 'KeyF') root.querySelector(`#dk-thr [data-v="${{ full: 'fine', fine: 'pulse', pulse: 'full' }[thrMode]}"]`).click();
      if (e.code === 'KeyV') root.querySelector(`#dk-view [data-v="${viewMode === 'map' ? 'coas' : 'map'}"]`).click();
      if (e.code === 'KeyR') startBtn.click();
      const wv = { Digit1: 1, Digit2: 5, Digit3: 20 }[e.code];
      if (wv) root.querySelector(`#dk-warp [data-v="${wv}"]`).click();
    };
    stage.addEventListener('keydown', (e) => onKey(e, true)); stage.addEventListener('keyup', (e) => onKey(e, false));
    const wkd = (e) => { const r = root.getBoundingClientRect(); if (document.activeElement === document.body && running && r.top < innerHeight && r.bottom > 0) onKey(e, true); };
    const wku = (e) => onKey(e, false);
    window.addEventListener('keydown', wkd); window.addEventListener('keyup', wku);
    UI.onCleanup(() => { running = false; window.removeEventListener('keydown', wkd); window.removeEventListener('keyup', wku); });
    root.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => {
        e.preventDefault(); if (!running) return;
        if (thrMode === 'pulse' && !k.startsWith('rot')) pulse(k);
        else if (rotMode === 'minimp' && k.startsWith('rot')) rotTap(k);
        else keys[k] = true;
      };
      const off = () => { keys[k] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });

    reset();
    let trail = 0;
    UI.loop((dt) => {
      if (running) {
        const total = dt * warp, n = Math.ceil(total / 0.02);
        for (let i = 0; i < n && running; i++) step(total / n);
        S.real = (S.real || 0) + dt;
        if (viewMode === 'map' && S.real > 3) S.mapRange = Math.min(S.mapRange, Math.max(0, rel().along));   // 3 s grace after Start to switch view
        trail += total;
        if (trail > (scen.n ? 4 : 1)) { path.push([S.x, S.z]); trail = 0; if (path.length > 600) path.shift(); }
      }
      view.redraw(); readout();
    });
  }
})();
