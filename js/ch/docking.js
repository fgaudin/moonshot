/* Chapter — Docking: relative motion, Clohessy–Wiltshire, probe and drogue. Lab: docking simulator with a COAS sight. */
(function () {
  'use strict';

  // Scenarios. Positions in the target's orbital (Hill) frame: x along-track (+ ahead), z radial (+ away from the planet).
  // sT: the target's docking port faces +x (1) or −x (−1).
  // Start state for the terminal phase, from what a pilot would measure: the target at range rho, in the direction phi (degrees
  // from the along-track axis, counter-clockwise on the map), closing at c m/s with a sideways drift of s m/s against the stars.
  // The velocity in the rotating target frame adds the frame's own turn (n): see losRate below.
  function terminalStart(phiDeg, rho, c, s, n = 8.82e-4) {
    const p = phiDeg * Math.PI / 180, ex = Math.cos(p), ez = Math.sin(p), wh = s / rho + n;
    return { x: rho * ex, z: rho * ez, vx: -c * ex - rho * wh * ez, vz: -c * ez + rho * wh * ex, th: Math.atan2(-ez, -ex) };
  }
  const SCEN = {
    tde: { label: N`Transposition & docking (translunar coast)`, n: 0, m: 28800, F: 890, sT: 1, target: N`LM in the S-IVB adapter`,
      s: { x: 24, z: 0.6, vx: 0.12, vz: -0.01, th: 0 },
      brief: N`The CSM has just separated from the S-IVB and is drifting away, nose pointing away from the LM. Turn around, stop the drift, line up on the LM’s docking axis and close in gently.` },
    lunar: { label: N`Lunar orbit docking (after ascent)`, n: 8.82e-4, m: 16800, F: 890, sT: 1, target: N`Eagle, LM ascent stage`,
      s: { x: 95, z: -7, vx: -0.6, vz: 0.05, th: Math.PI + 0.07 },
      brief: N`Final approach in a 110 km lunar orbit. You are 95 m out and slightly below the docking axis, closing too fast. Orbital mechanics bends your path: watch the predicted trajectory.` },
    terminal: { label: N`Terminal phase (from 2 km)`, n: 8.82e-4, m: 16800, F: 890, sT: 1, target: N`Eagle, LM ascent stage`, terminal: true, lost: 4000,
      s: terminalStart(-82, 1960, 2.2, 0.3),
      brief: N`A transfer burn left you 2 km below the LM in a 110 km lunar orbit, drifting. First measure the drift, then null the line-of-sight rate, then fly the braking gates down to 100 m. Switch to attitude hold at the end and dock as usual. Time warp ×20 helps.` },
    gemini: { label: N`The Gemini 4 lesson (low Earth orbit)`, n: 1.186e-3, m: 3600, F: 445, sT: -1, target: N`Titan II upper stage`,
      s: { x: -180, z: 0, vx: 0, vz: 0, th: 0 },
      brief: N`June 1965. Your booster’s upper stage floats 180 m ahead in the same orbit. Do what Jim McDivitt did: point at it and thrust forward. Use time warp ×20 and watch where you go.` },
  };
  const LT = 2.5, LC = 5.5;                    // target CoM → port, chaser CoM → probe tip (m)
  const EYE = 3.5;                             // COAS eye point, behind the probe tip (m)
  const TGT_R = 0.25, STANDOFF = 0.45, CROSS_ARM = 0.15;   // docking target disc radius, cross stand-off and arm (m)
  // Terminal-phase braking gates (this course's rule of thumb): closing speed at most range / TAU_G, never below V_MIN
  const TAU_G = 400, V_MIN = 0.05, HANDOVER = 100;            // s, m/s, m
  const gateSpeed = (rho) => Math.max(rho / TAU_G, V_MIN);
  // line-of-sight rate against the stars (rad/s, positive = counter-clockwise on the map), from the relative state in the
  // rotating target frame: rate in that frame minus the frame's own turn rate n
  const losRate = (x, z, vx, vz, n) => (x * vz - z * vx) / (x * x + z * z) - n;
  const Term = { gateSpeed, losRate, TAU_G, V_MIN, HANDOVER };
  if (typeof window !== 'undefined') window.DockTerm = Term;
  if (typeof module !== 'undefined') module.exports = Term;
  const ENV = { vmin: 0.03, vmax: 0.3, lat: 0.3, ang: 10, latRate: 0.15 };   // probe capture envelope

  // practice: terminal phase
  (function () {
    const R = String.raw, f = UI.fmt;
    const rnd = (a, b, st = 1) => a + st * Math.floor(Math.random() * ((b - a) / st + 1));
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    Practice.register('docking', N`Docking`, [
      { title: N`Braking gate speed`, make() {
        const rho = pick([300, 400, 600, 800, 1200, 1500, 2000, 2500]), tau = pick([300, 400, 500]), v = rho / tau, a = rho / (tau * tau);
        return { q: T`A braking gate allows a closing speed equal to the range divided by <b>${tau} s</b>. You are <b>${f(rho, 0)} m</b> from the target. What is the largest closing speed allowed?`, answer: v, unit: 'm/s',
          hint: T`Speed = range ÷ time constant, with the time constant in seconds.`,
          sol: R`\[ v_{gate} = \frac{\rho}{\tau_g} = \frac{${rho}\ \mathrm{m}}{${tau}\ \mathrm{s}} = ${f(v, 3)}\ \mathrm{m/s} \]` + `<p>${T`To stay under this line the ship must brake at ρ/τ² = ${f(a, 4)} m/s². Check that your thrusters can do at least three or four times that.`}</p>` };
      } },
      { title: N`Terminal phase Δv`, make() {
        if (Math.random() < 0.5) {
          const vc = pick([1.2, 1.8, 2.4, 3.1]), vs = pick([0.3, 0.4, 0.6, 0.8]), m = pick([16800, 28800]);
          const dv = Math.hypot(vc, vs), t = m * dv / 890;
          return { q: T`After a transfer, the target closes on your ${f(m, 0)} kg CSM at <b>${f(vc, 1)} m/s</b> along the line of sight and drifts <b>${f(vs, 1)} m/s</b> sideways. You cancel the whole relative velocity in one burn. What Δv does it take?`, answer: dv, unit: 'm/s',
            hint: T`The closing and sideways components are at right angles: Pythagoras.`,
            sol: R`\[ \Delta v = \sqrt{v_c^{\,2} + v_s^{\,2}} = \sqrt{${f(vc, 1)}^2 + ${f(vs, 1)}^2} = ${f(dv, 2)}\ \mathrm{m/s} \]` + `<p>${T`With two 445 N thrusters (890 N) that is a burn of ${f(t, 0)} s.`}</p>` };
        }
        const vs = pick([0.2, 0.4, 0.5, 0.7]), v0 = pick([2.0, 2.4, 3.0, 4.0]), g = [v0 / 2, v0 / 4, 0.25].map((x) => Math.round(x * 100) / 100);
        const brake = v0 - g[2], tot = vs + brake;
        return { q: T`You arrive 2 km out with a closing speed of <b>${f(v0, 1)} m/s</b> and <b>${f(vs, 1)} m/s</b> of sideways drift. You cancel the drift, then brake at three gates, to <b>${f(g[0], 2)}</b>, <b>${f(g[1], 2)}</b> and finally <b>${f(g[2], 2)} m/s</b> at 100 m. What is the total Δv of all these burns? (Ignore orbital effects.)`, answer: tot, unit: 'm/s',
          hint: T`Each gate takes off the difference between two speeds. Add them up: most of it cancels.`,
          sol: R`\[ \Delta v = v_s + (v_0 - g_1) + (g_1 - g_2) + (g_2 - g_3) = v_s + v_0 - g_3 = ${f(vs, 1)} + ${f(v0, 1)} - ${f(g[2], 2)} = ${f(tot, 2)}\ \mathrm{m/s} \]` + `<p>${T`Only the first and the last speed matter, not the number of gates.`}</p>` };
      } },
    ]);
  })();

  App.chapter({
    id: 'docking', phase: N`Docking`, title: N`Docking`, lab: N`Docking simulator`,
    blurb: N`Two ships, one line: match attitude, position and velocity to within centimetres per second.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('docking')} · Docking`,
          title: T`Docking`,
          lede: T`Rendezvous brings two spacecraft within a few hundred metres. Docking closes the last gap, a slow, precise dance where every push lasts forever and orbital mechanics still has a say.`,
          refs: [T`Sellers · Maneuvering in Space (rendezvous)`, T`BMW ch. 3 Basic Orbital Maneuvers`, T`Apollo Operations Handbook, CSM docking system`],
        })}
        ${Progress.briefing('docking', { theory: 'theory', lab: 'dk', math: 'refresher', mathLabel: N`Vectors and relative velocity.` })}

        <section class="section" id="theory">
          <h2><span class="idx">7.1</span>${T`What docking really is`}</h2>
          <div class="prose">
            <p>${T`A natural first picture: point the two docking axes at each other, then push them together. That is the right start, and it is one third of the job. Docking means bringing <b>three</b> things to zero at the same time:`}</p>
            <ol>
              <li>${T`<b>Attitude.</b> The two docking axes must be exactly opposite, nose to nose, and rolled so the latches and alignment marks match.`}</li>
              <li>${T`<b>Position.</b> The chaser must be <i>on</i> the target’s axis, not merely parallel to it. Two axes can be perfectly opposite yet a metre apart sideways, like two cars in neighbouring lanes.`}</li>
              <li>${T`<b>Velocity.</b> The relative velocity must shrink to a slow crawl straight along that axis, with no sideways drift and no rotation left.`}</li>
            </ol>
            <div class="eq">${T`\\[ \\hat a_c\\cdot\\hat a_t = -1, \\qquad d_\\perp = 0, \\qquad \\vec v_{rel} = -v_{close}\\,\\hat a_t \\ \\text{ with } 0.03 < v_{close} < 0.3\\ \\mathrm{m/s} \\]`}</div>
            ${Sym.where([['\\hat a_c', N`unit vector along the chaser’s docking axis (a hat means length 1: a pure direction)`, '—'], ['\\hat a_t', N`unit vector along the target’s docking axis, pointing out of its port`, '—'], ['\\cdot', N`dot product: for unit vectors it equals the cosine of the angle between them. −1 means exactly opposite (180°)`, ''], ['d_\\perp', N`sideways distance between the chaser’s probe and the target’s axis`, 'm'], ['\\vec v_{rel}', N`velocity of the chaser relative to the target`, 'm/s'], ['v_{close}', N`closing speed along the axis: walking pace is 1.4 m/s; docking is 5 to 50 times slower`, 'm/s']], N`Apollo’s probe could capture within about 0.3 m and 10° of misalignment, at 3 to 30 cm/s.`)}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`Crews tackle them in a fixed order. <b>Rotate first</b>: turning costs little propellant and changes nothing else. Then <b>null the sideways drift and slide onto the axis</b>. Only then <b>close in</b>, slowing down at each “braking gate” as the range shrinks: a common rule is a closing speed of about 1% of the range per second when far out, down to a few centimetres per second at contact.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.2</span>${T`Newton’s first law, for real`}</h2>
          <div class="prose">
            <p>${T`Everything you know about driving or walking involves friction: let go of the controls and you stop. In space nothing stops you. A thruster pulse changes your velocity, and that velocity stays until another pulse cancels it. Pilots fly <i>velocities</i>, not positions: a pulse to start moving, a coast, an opposite pulse to stop.`}</p>
            <div class="eq">\\[ \\Delta v = \\frac{F\\,t}{m} \\]</div>
            ${Sym.where(['dv', ['F', N`thrust of the thrusters firing (two 445 N Apollo RCS thrusters = 890 N)`, 'N'], ['t', N`how long they fire`, 's'], ['m', N`spacecraft mass (CSM ≈ 28.8 t on the way out)`, 'kg']], N`One second of translation on the full CSM changes the velocity by only 3 cm/s. Docking is a game of short taps.`)}
            ${Primer.box('relative')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.3</span>${T`Orbital mechanics up close`}</h2>
          <div class="prose">
            <p>${T`Seen from the target, the chaser does not move in straight lines. Both ships orbit the planet, and a small difference in height means a difference in orbital speed. In the target’s frame, the <b>Clohessy–Wiltshire</b> (Hill) equations describe the relative motion for small separations:`}</p>
            <div class="eq">\\[ \\ddot x = -2n\\,\\dot z + a_x, \\qquad \\ddot z = 3n^2 z + 2n\\,\\dot x + a_z \\]</div>
            ${Sym.where([['x', N`distance along the orbit (along-track, the “V-bar”), positive ahead of the target`, 'm'], ['z', N`distance away from the planet (radial, the “R-bar”), positive above the target`, 'm'], ['\\dot x,\\ \\dot z', N`relative velocities (one dot: per second)`, 'm/s'], ['\\ddot x,\\ \\ddot z', N`relative accelerations (two dots)`, 'm/s²'], 'n', ['a_x,\\ a_z', N`acceleration from your own thrusters`, 'm/s²']], N`The extra terms are the orbital effects: 2n·ż and 2n·ẋ couple the two directions (a Coriolis effect), 3n²z pushes you away from the target’s altitude.`)}
            <p>${T`<b>The Gemini 4 paradox.</b> In June 1965 Jim McDivitt tried to fly his Gemini capsule up to the spent upper stage of his Titan rocket, a few hundred metres ahead. He pointed at it and thrust forward. Thrusting forward raised his orbit, a higher orbit is slower, and the target pulled away. The harder he pushed, the worse it got, and he gave up to save propellant. The fix, used ever since: to catch something ahead, you briefly <i>slow down</i> and drop to a lower, faster orbit (module ${Progress.code('maneuvers')}).`}</p>
            <p>${T`The orbital terms grow with \\(n\\) and with time. Over a one-minute final approach in lunar orbit, \\(n t \\approx 0.05\\) rad, so paths look almost straight. Over a 15-minute approach from 1 km out they curve a lot. That is why long-range approaches are planned as orbital manoeuvres and the final 30 m are flown by hand, almost like flying in free space.`}</p>
          </div>
        </section>

        <section class="section" id="terminal">
          <h2><span class="idx">7.4</span>${T`Closing in: from a few km to 100 m`}</h2>
          <div class="prose">
            <p>${T`The transfer burns of module ${Progress.code('timing')} (a phasing orbit, a Hohmann transfer) are meant to end near the target. Their last burn should leave you in the target’s orbit, moving as the target moves. A hand-flown transfer never quite does: a small error in size, timing or direction leaves you a few kilometres away with a relative velocity of a metre or so per second. Between that arrival and the docking approach of the lab, which starts tens of metres out, lies the <b>terminal phase</b>. It has three jobs, in this order.`}</p>
            <p>${T`<b>1. Cancel the arrival velocity.</b> Whatever the burn error was, it shows up as a relative velocity: the target drifts across your window, or grows, or shrinks, faster than you can accept. Measure it from the range, the range rate and the line-of-sight angles that radar and optics give, over a minute or two. Then fire opposite to it, near the closest approach, so the target stops drifting.`}</p>
            <div class="eq">\\[ \\Delta\\vec v = -\\vec v_{rel}, \\qquad \\Delta v = \\sqrt{v_c^{\\,2} + v_s^{\\,2}}, \\qquad t_{burn} = \\frac{m\\,\\Delta v}{F} \\]</div>
            ${Sym.where([['\\Delta\\vec v', N`the burn to make, as a vector (a size and a direction)`, 'm/s'], ['\\vec v_{rel}', N`velocity of the chaser relative to the target`, 'm/s'], ['v_c', N`closing component of the relative velocity, along the line of sight (positive when the range shrinks)`, 'm/s'], ['v_s', N`sideways component, across the line of sight`, 'm/s'], ['t_{burn}', N`how long the thrusters must fire`, 's'], ['m', N`spacecraft mass (the lab’s CSM in lunar orbit: 16 800 kg)`, 'kg'], ['F', N`total thrust of the jets firing (two 445 N thrusters: 890 N)`, 'N']], N`Fire against the drift and it stops. The two components are at right angles, so they add like the sides of a triangle (Pythagoras). Cancelling everything is the safe default. You may instead keep a closing speed that the gates below allow, and cancel only the sideways part: it costs less.`)}
            <p>${T`<b>2. Null the line-of-sight rate.</b> Point the nose at the target and watch it against the star background. If it drifts across the stars, the line between you is turning, and you will pass beside it. Thrust sideways, in the direction the target drifts, until it stands still against the stars. A target that stays fixed against the stars while it grows is on a collision course. You need no orbital calculation for this: two bodies in straight lines that do not change their bearing as seen from each other must meet, like two ships heading for the same harbour mouth.`}</p>
            <div class="eq">\\[ v_\\perp = \\rho\\,\\omega, \\qquad \\Delta v_{null} = -v_\\perp \\]</div>
            ${Sym.where([['v_\\perp', N`sideways speed of the chaser relative to the target, across the line of sight`, 'm/s'], ['\\rho', N`range: distance to the target`, 'm'], ['\\omega', N`line-of-sight rate: how fast the direction to the target turns against the stars (1°/s = 0.0175 rad/s)`, 'rad/s'], ['\\Delta v_{null}', N`sideways burn that stops the drift`, 'm/s']], N`A tiny angular rate is a large speed far out: at 2 km, 0.03°/s is about 1 m/s of sideways drift. The miss distance is that speed times the time to go: left alone for 800 s, it means missing by 800 m. Null it early.`)}
            <p>${T`Over long ranges the straight-line picture is slightly wrong, for the reason of section ${App.sec('docking', 3)}. Both ships fall around the Moon, but not along the same path. The pull on the chaser differs from the pull on the target, by about \\(n^2\\rho\\) per kilogram, and the difference keeps changing direction as you move along the orbit (\\(n\\) is the mean motion, 8.82 × 10⁻⁴ rad/s at 110 km). At 2 km that is 1.6 mm/s², small each second and a few m/s over half an hour. So the target slowly starts to drift against the stars again, and you null it again: a small sideways burn every minute or two. In the frame that turns with the orbit, which is the frame of the Clohessy–Wiltshire equations, a target that is fixed against the stars appears to rotate at \\(n\\), about 0.05°/s. The straight line in space looks curved in that frame: over the half hour of the example it swings through about 90°. A chaser that starts 2 km below the target and holds the line of sight fixed arrives on the target’s own axis, ahead of it, which is how the lab scenario is set up. The lab shows the rate against the stars.`}</p>
            <p>${T`<b>3. Fly the braking gates.</b> Closing speed must shrink with the range, because stopping takes time and distance. A <b>braking gate</b> ties the two together: at each range, the closing speed must not exceed a limit. This course uses a simple rule of thumb.`}</p>
            <div class="eq">\\[ v_{gate}(\\rho) = \\max\\!\\left(\\frac{\\rho}{\\tau_g},\\ v_{min}\\right), \\qquad \\tau_g = 400\\ \\mathrm{s}, \\quad v_{min} = 0.05\\ \\mathrm{m/s} \\]</div>
            ${Sym.where([['v_{gate}', N`largest closing speed allowed at range ρ`, 'm/s'], ['\\rho', N`range: distance to the target`, 'm'], ['\\tau_g', N`gate time: the time the target would take to arrive if you flew at the limit and the range did not shrink`, 's'], ['v_{min}', N`floor for the last metres, close to the speeds the docking probe accepts (3 to 30 cm/s)`, 'm/s']], N`Each time the range halves, the limit halves. At the limit, the range shrinks by a constant fraction every 400 s: it takes 400 s × ln 2 = 277 s to halve it. Closing from 2 km to 100 m at the limit takes 400 × ln 20 = 20 minutes.`)}
            <div class="scroll-x" style="max-width:36rem"><table class="data"><thead><tr><th>${T`Gate range`}</th><th>${T`Speed limit`}</th><th>${T`Brake by`}</th></tr></thead><tbody>${[2000, 1000, 500, 250, 100, 20].map((g, i, a) => `<tr><td>${UI.fmt(g, 0)} m</td><td>${UI.fmt(gateSpeed(g), g >= 1000 ? 1 : 2)} m/s</td><td>${i ? UI.fmt(gateSpeed(a[i - 1]) - gateSpeed(g), 2) + ' m/s' : '—'}</td></tr>`).join('')}</tbody></table></div>
            <p>${T`<b>Why 400 s?</b> The CSM’s thrusters give \\(a = F/m = 890/16\\,800 = 0.053\\) m/s² in lunar orbit. To stay under the line, the ship must brake at \\(\\rho/\\tau_g^2\\): 0.0125 m/s² at 2 km, a quarter of what it has. The rest is margin for errors and for a failed jet. The 1% of the range per second quoted in section ${App.sec('docking', 1)} (\\(\\tau_g = 100\\) s) would need 0.2 m/s² at 2 km, four times what the thrusters give: it fits the last 100 m, not the first kilometre. It is the rule of this course, not flight data. Apollo crews also flew the end of their rendezvous against a table of range against closing speed, a braking schedule of this kind, and used it to check the approach at each stage.`}</p>
            <p>${T`<b>What it costs.</b> Each gate is a braking burn. The steps add up like stairs, so only the first and the last speed matter, not how many gates there are. A ship that rides the limit from rest also has to speed up first, and pays for that too.`}</p>
            <div class="eq">\\[ \\Delta v_{brake} = v_0 - v_{end}, \\qquad \\Delta v_{terminal} \\approx v_s + \\Delta v_{brake} + \\Delta v_{orbit} \\]</div>
            ${Sym.where([['v_0', N`closing speed on arrival, when the gates start`, 'm/s'], ['v_{end}', N`closing speed at the end of the last gate (here 0.25 m/s at 100 m)`, 'm/s'], ['\\Delta v_{brake}', N`total of all braking burns: each gate takes off the difference between two limits`, 'm/s'], ['v_s', N`sideways drift cancelled at the start`, 'm/s'], ['\\Delta v_{orbit}', N`small burns that keep the line of sight fixed against the orbital pull of the previous paragraphs`, 'm/s'], ['\\Delta v_{terminal}', N`total Δv of the terminal phase`, 'm/s']], N`Starting below the limit at v₀, speeding up to a peak v_p and stopping again at the end costs (v_p − v₀) + (v_p − v_end). Flying faster saves time and costs propellant twice.`)}
            <p>${T`<b>Worked example, lunar orbit at 110 km.</b>`}</p>
            <ol>
              <li>${T`<b>The orbit.</b> The radius is 1 737.4 + 110 = 1 847.4 km. With \\(\\mu_☾\\) = 4.9028 × 10¹² m³/s², the mean motion is \\(n = \\sqrt{\\mu_☾/r^3}\\) = 8.82 × 10⁻⁴ rad/s. The period is \\(2\\pi/n\\) = 7 125 s = 118.8 min, and both ships move at \\(nr\\) = 1.629 km/s.`}</li>
              <li>${T`<b>Arrival.</b> The CSM (16 800 kg) ends its transfer 2 000 m from the LM, closing at \\(v_c = 2.4\\) m/s and drifting sideways at \\(v_s = 0.4\\) m/s. Cancelling everything takes \\(\\Delta v = \\sqrt{2.4^2 + 0.4^2} = 2.43\\) m/s: a burn of \\(16\\,800 \\times 2.43/890 = 46\\) s and about 15 kg of propellant (\\(I_{sp}\\) = 280 s). The line-of-sight rate is \\(\\omega = v_s/\\rho = 0.4/2\\,000 = 2.0\\times10^{-4}\\) rad/s = 0.0115°/s: slow, and clearly visible against the stars within a minute.`}</li>
              <li>${T`<b>Keep the closing speed.</b> The gate at 2 km allows 5 m/s, so 2.4 m/s is fine, and cancelling it would only mean speeding up again later. Null the sideways drift (0.4 m/s, 7.5 s of burn) and keep closing at 2.4 m/s.`}</li>
              <li>${T`<b>Gates.</b> Fly 2.4 m/s down to the 1 000 m gate (417 s). There the limit at 500 m is 1.25 m/s: brake by 1.15 m/s (22 s of burn, started about 40 m early, since the ship moves while it brakes). Then 1.25 m/s to 500 m (400 s), 0.625 m/s to 250 m (400 s), 0.25 m/s to 100 m (600 s). The braking burns total 1.15 + 0.625 + 0.375 = 2.15 m/s, which is \\(v_0 - v_{end} = 2.4 - 0.25\\). The terminal phase takes 1 817 s, 30 minutes. Closing the whole way at the limit would take 20 minutes.`}</li>
              <li>${T`<b>Orbit upkeep.</b> Thirty minutes is \\(nt = 1.6\\) rad, 92° of orbit, so the pull is no longer a detail: \\(n^2\\rho\\) is 1.6 mm/s² at 2 km. A numerical run of this schedule with the Clohessy–Wiltshire equations, the sideways jets nulling the line-of-sight rate and the main jets holding each leg’s speed, spent 5.0 m/s in all. Of that, 2.15 m/s is the braking ladder. The other 2.9 m/s is orbit upkeep: the long slow approach is paid for in small burns.`}</li>
              <li>${T`<b>Propellant.</b> \\(\\Delta m \\approx m\\,\\Delta v/(I_{sp}\\,g_0)\\), that is 16 800 × 5.0 / (280 × 9.807) = 31 kg.`}</li>
            </ol>
            <p>${T`The scenario <b>Terminal phase (from 2 km)</b> in the lab below starts you in this situation: 2 km out, closing at about 2 m/s, with a sideways drift. The autopilot mode <b>Track target</b> keeps the nose on the target, so you only decide the thrust. Left alone, the ship passes the LM at about half a kilometre.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.5</span>${T`Lab: dock`}</h2>
          <div class="prose"><p>${T`Top-down view in the target’s frame, real RCS numbers. The dashed line predicts your path if you stop firing. The <b>COAS</b> inset is the view through the Crewman Optical Alignment Sight in the CSM window: when you are on the axis and aligned, the docking target’s stand-off cross sits in the middle of the target disc behind it. A cross offset from the ring means your angle is off (parallax); the whole target off-centre means you are off the axis.`}</p>
          <p class="mono note">${T`Keys: ↑/↓ or W/S thrust forward/back · ←/→ or A/D translate left/right · Q/E rotate · hold Shift for fine thrust · F cycles thruster mode · H cycles rotation mode · V toggles real mode · 1/2/3 time warp · R restart. Buttons work on touch screens (hold to fire).`}</p>
          <p>${T`The scenario <b>Terminal phase (from 2 km)</b> adds the part before all this. The map zooms out as the range grows, with rings at the braking gates and their speed limits. The readouts show the range, the closing speed, the gate limit and the line-of-sight rate against the stars (positive: the target drifts to the left of your nose; thrust left to stop it). Closing faster than the limit turns the readout red and warns “over the gate”.`}</p>
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
              <div class="ctl"><span class="mono note">${T`Rotation`}</span><div class="seg" id="dk-rot" role="group" aria-label="${T`Rotation control mode`}"><button data-v="hold" aria-pressed="true" title="${T`Rate command: releasing the stick stops the rotation`}">${T`Attitude hold`}</button><button data-v="drift" aria-pressed="false" title="${T`Jets fire only while held; the rotation persists`}">${T`Free drift`}</button><button data-v="minimp" aria-pressed="false" title="${T`Each tap adds ±0.1°/s`}">${T`Min impulse`}</button><button data-v="track" aria-pressed="false" title="${T`The autopilot keeps the nose on the target’s docking port`}">${T`Track target`}</button></div></div>
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
          <h2><span class="idx">7.6</span>${T`The hardware: probe, drogue and latches`}</h2>
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
          <h2><span class="idx">7.7</span>${T`Apollo’s two dockings`}</h2>
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
    let scen = SCEN.tde, S = null, running = false, ended = false, warp = 1, keys = {}, path = [], msgTimer = 0, zoom = {};
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
      path = []; ended = false; keys = {}; zoom = {};
      S.overT = 0; S.over = false; S.hand = false; S.badged = false;
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
      else if (rotMode === 'track') {
        // keep the nose on the port: follow the line of sight in the target frame (rate feed-forward plus a proportional term)
        const p = portPos(), dx = S.x - p.x, rho2 = dx * dx + S.z * S.z;
        const wLos = rho2 > 1 ? (dx * S.vz - S.z * S.vx) / rho2 : 0;
        const wCmd = Math.max(-2, Math.min(2, (wLos + wrap(Math.atan2(-S.z, -dx) - S.th)) * 180 / Math.PI)) * Math.PI / 180;
        dw = Math.max(-alpha * dt, Math.min(alpha * dt, wCmd - S.om));
      }
      S.om += dw; S.th += S.om * dt;
      S.rotDv += Math.abs(dw) * 180 / Math.PI;
      // propellant: two 445 N thrusters per translation axis, Isp 280 s; rotation pulses are small
      S.fuel += (thrusting > 0 ? scen.F * (fine() ? 0.25 : 1) / (280 * 9.80665) : 0) * dt + Math.abs(dw) * 30;
      S.t += dt;
      contact();
      if (scen.terminal && running && !S.hand) terminalCheck(dt);
      if (scen.n && S.fwdDv > 0.3 && Math.abs(S.z) > 8 && scen === SCEN.gemini) {
        Progress.done('docking', 'paradox');
        if (!S.paradoxSaid) { S.paradoxSaid = true; say(T`You thrust straight at the target, and climbed above it. A higher orbit is slower: it is pulling away from you. That is the Gemini 4 paradox.`); }
      }
      if (Math.hypot(S.x, S.z) > (scen.lost || 450)) {
        running = false; ended = true; badge(T`Lost visual contact: abort`, 'bad');
        say(scen.terminal ? T`More than 4 km away: the chaser has drifted out of range. Restart and try again.` : T`More than 450 m away. Restart and try again.`);
      }
    }

    // terminal phase: range, range rate and the braking gates; the handover to the docking approach is at 100 m
    function terminalCheck(dt) {
      const rg = Math.hypot(S.x, S.z), close = -(S.x * S.vx + S.z * S.vz) / rg;
      S.over = close > 1.1 * gateSpeed(rg);
      if (S.over && rg > HANDOVER) S.overT += dt;
      if (rg > HANDOVER) return;
      S.hand = true;
      const ok = S.overT <= 5 && S.dv > 0.3;
      const r = rel();
      if (ok) Progress.done('docking', 'terminal');
      badge(ok ? T`100 m: gates flown` : T`100 m: over the gates`, ok ? 'good' : 'bad');
      say(ok
        ? T`100 m after ${UI.fmtTime(S.t)}, closing at ${UI.fmt(close, 2)} m/s, ${UI.fmt(S.dv, 1)} m/s of Δv spent. Gates respected. Switch to attitude hold, line up on the axis (${UI.fmt(Math.abs(r.lat), 0)} m off now) and dock.`
        : T`100 m after ${UI.fmtTime(S.t)}, closing at ${UI.fmt(close, 2)} m/s, but you were over the gate for ${UI.fmt(S.overT, 0)} s. Restart and brake earlier, or carry on and dock.`);
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
      const tEnd = scen.terminal ? 2400 : scen.n ? 900 : 120, dt = scen.terminal ? 6 : scen.n ? 3 : 1;
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
      // zoom follows the range, with a dead-band (the goal only moves when the range changed by about 20%) and smoothing: no jitter
      const want = Math.max(26, Math.min(scen.terminal ? 6000 : 700, range * 2.4 + 12));
      const nowMs = performance.now(), dz = Math.min(0.1, (nowMs - (zoom.t || nowMs)) / 1000); zoom.t = nowMs;
      if (!zoom.span) zoom.span = zoom.goal = want;
      if (Math.abs(Math.log(want / zoom.goal)) > 0.2) zoom.goal = want;
      zoom.span *= Math.exp(Math.log(zoom.goal / zoom.span) * (1 - Math.exp(-dz / 0.5)));
      const span = zoom.span;
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
      if (scen.n) { ctx.textAlign = 'right'; ctx.fillText(`${scen === SCEN.lunar || scen.terminal ? T`Moon` : T`Earth`} ↓  (R-bar)`, w - 10, h - 10); }
      // approach corridor (±10°)
      const port = portPos();
      const [px, py] = P(port.x, port.z);
      // braking gates: rings around the target with their speed limits
      if (scen.terminal) {
        const [ox, oy] = P(0, 0);
        ctx.font = `10px ${tk.mono}`; ctx.textAlign = 'left'; ctx.strokeStyle = tk.warn; ctx.fillStyle = tk.muted; ctx.lineWidth = 1;
        let lastLy = -99;
        for (const g of [100, 250, 500, 1000, 2000]) {
          if (g * s < 14 || g * s > 2.2 * w) continue;
          ctx.globalAlpha = 0.45; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ox, oy, g * s, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
          const lxp = ox + g * s * Math.cos(-0.5) + 4, lyp = oy + g * s * Math.sin(-0.5);
          if (lxp > 0 && lxp < w - 80 && lyp > 12 && lyp < h - 20 && Math.abs(lyp - lastLy) > 13) { lastLy = lyp; ctx.fillText(`${g} m · ${UI.fmt(gateSpeed(g), g >= 1000 ? 1 : 2)} m/s`, lxp, lyp); }
        }
      }
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
      if (4.4 * s < 12) { const [mx, my] = P(0, 0); ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(mx + 7, my); ctx.lineTo(mx, my + 7); ctx.lineTo(mx - 7, my); ctx.closePath(); ctx.fill(); ctx.stroke(); }
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
      if (11 * s < 16) { const [mx, my] = P(S.x, S.z); ctx.fillStyle = tk.accent; ctx.beginPath(); ctx.arc(mx, my, 5, 0, 7); ctx.fill(); ctx.stroke(); }
      // thruster plumes (opposite to the push)
      const plume = (bx, bz, dx, dz) => { ctx.strokeStyle = tk.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...B(bx, bz)); ctx.lineTo(...B(bx + dx, bz + dz)); ctx.stroke(); };
      if (S.fire.fwd) { plume(-3, 2.1, -1.4, 0); plume(-3, -2.1, -1.4, 0); }
      if (S.fire.back) { plume(-1, 2.1, 1.4, 0); plume(-1, -2.1, 1.4, 0); }
      if (S.fire.left) plume(-2, -2.1, 0, -1.4);
      if (S.fire.right) plume(-2, 2.1, 0, 1.4);
      // relative velocity arrow (1 m/s = 120 px)
      const [cxp, cyp] = P(S.x, S.z), vlen = Math.hypot(S.vx, S.vz);
      const ak = 120 * Math.min(1, 700 / span);                       // px per m/s: 120 up close, shrinking with the zoom
      if (vlen > 0.003) UI.arrow(ctx, cxp, cyp, cxp + S.vx * ak, cyp - S.vz * ak, tk.trace, 1.6);
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
      let head;
      if (scen.terminal) {
        const rg = Math.hypot(S.x, S.z), close = -(S.x * S.vx + S.z * S.vz) / rg, gate = gateSpeed(rg);
        const los = losRate(S.x, S.z, S.vx, S.vz, scen.n) * 180 / Math.PI;
        const point = wrap(S.th - Math.atan2(-S.z, scen.sT * LT - S.x)) * 180 / Math.PI;
        const over = S.over && running;
        head = `<dt>${T`Range to target`}</dt><dd class="hl">${UI.fmt(rg, rg < 200 ? 1 : 0)} m</dd>
        <dt>${T`Closing speed (range rate)`}</dt><dd${col(!over)}>${UI.fmt(close, 2)} m/s</dd>
        <dt>${T`Gate limit`}</dt><dd${col(!over)}>${UI.fmt(gate, 2)} m/s${over ? ' ⚠' : ''}</dd>
        <dt>${T`Line-of-sight rate vs stars`}</dt><dd>${UI.fmt(los, 3)} °/s</dd>
        <dt>${T`Nose off target`}</dt><dd>${UI.fmt(point, 1)}°</dd>`;
        if (running && over !== S.badged && !S.hand) { S.badged = over; badge(over ? T`Over the gate` : T`In flight`, over ? 'bad' : ''); }
      } else head = `
        <dt>${T`Range to port`}</dt><dd class="hl">${UI.fmt(Math.max(0, r.along), 1)} m</dd>
        <dt>${T`Closing rate`}</dt><dd${col(r.close <= Math.max(sug, ENV.vmax) || r.along > 60)}>${UI.fmt(r.close * 100, 1)} cm/s</dd>
        <dt>${T`Suggested max`}</dt><dd>${UI.fmt(sug * 100, 0)} cm/s</dd>`;
      root.querySelector('#dk-ro').innerHTML = `
        <dt>MET</dt><dd>${UI.fmtTime(S.t)}</dd>${head}
        ${scen.terminal && Math.hypot(S.x, S.z) > 150 ? '' : `<dt>${T`Off axis`}</dt><dd${col(Math.abs(r.lat) <= ENV.lat || r.along > 5)}>${UI.fmt(r.lat, 2)} m</dd>
        <dt>${T`Sideways drift`}</dt><dd>${UI.fmt(r.latRate * 100, 1)} cm/s</dd>
        <dt>${T`Attitude error`}</dt><dd${col(Math.abs(r.angErr) <= ENV.ang)}>${UI.fmt(r.angErr, 1)}°</dd>`}
        <dt>${T`Rotation rate`}</dt><dd>${UI.fmt(S.om * 180 / Math.PI, 2)} °/s</dd>
        <dt>${T`RCS Δv used`}</dt><dd>${UI.fmt(S.dv, 2)} m/s</dd>
        <dt>${T`Propellant used`}</dt><dd>${UI.fmt(S.fuel, 1)} kg</dd>
        <dt>${T`Rotation Δω spent`}</dt><dd>${UI.fmt(S.rotDv, 2)} °/s</dd>
        <dt>${T`Rotation mode`}</dt><dd>${{ hold: T`attitude hold`, drift: T`free drift`, minimp: T`min impulse, 0.1°/s`, track: T`tracking the target` }[rotMode]}</dd>
        <dt>${T`Thrusters`}</dt><dd>${thrMode === 'pulse' ? T`pulse, 1 cm/s per tap` : fine() ? T`fine, ¼ thrust` : T`full, 890 N`}</dd>`;
      root.querySelector('#dk-ov').innerHTML = (running || ended ? T`warp ×${warp}` : scen.terminal ? T`Press Start. Cancel the drift, null the line-of-sight rate, then brake at the gates.` : T`Press Start. Rotate first, then line up, then close.`)
        + (scen.terminal && running && S.over && !S.hand ? ` · <b style="color:var(--bad)">${T`OVER THE GATE: brake`}</b>` : '');
    }

    // controls
    startBtn.addEventListener('click', () => { reset(); running = true; badge(T`In flight`, ''); startBtn.textContent = T`⟲ Restart`; stage.focus({ preventScroll: true }); });
    root.querySelector('#dk-scen').addEventListener('change', (e) => {
      scen = SCEN[e.target.value]; reset(); running = false; startBtn.textContent = T`▸ Start`;
      // the terminal scenario starts in tracking mode (nose on the target); leaving it restores attitude hold
      const want = scen.terminal ? 'track' : rotMode === 'track' ? 'hold' : null;
      if (want) root.querySelector(`#dk-rot [data-v="${want}"]`).click();
    });
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
      if (e.code === 'KeyH') root.querySelector(`#dk-rot [data-v="${{ hold: 'drift', drift: 'minimp', minimp: 'hold', track: 'hold' }[rotMode]}"]`).click();
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
