/* Practice: randomized numeric problems with worked solutions, plus concept questions.
   Constants in km and km/s for orbital work (as in BMW and Sellers), SI elsewhere. */
(function () {
  'use strict';
  const R = String.raw;
  const MU = 398600.4418, RE = 6378.137, G0 = 9.80665, MUM = 4902.80, RM = 1737.4, D_EM = 384400;
  const BODIES = [
    { n: 'the Moon', mu: 4902.8, r: 1737.4 },
    { n: 'Mars', mu: 42828.4, r: 3396.2 },
    { n: 'Earth', mu: MU, r: RE },
    { n: 'Venus', mu: 324859, r: 6051.8 },
  ];
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const f = (x, d = 3) => UI.fmt(x, d);
  const deg = Math.PI / 180;

  const TOPICS = {
    newton: 'Newton & gravity', orbits: 'Orbits & Kepler', rockets: 'Rocket equation', ascent: 'Getting to orbit',
    maneuvers: 'Manoeuvres', moon: 'Lunar trajectories', landing: 'Landing & ascent', entry: 'Re-entry',
  };

  /* Each generator returns { q, answer, unit, tol, hint, sol } — q/sol may contain TeX. */
  const GEN = [
    // ---------------- Newton ----------------
    { topic: 'newton', title: 'Gravity at altitude', make() {
      const h = pick([400, 800, 2000, 5000, 20200, 35786]);
      const g = G0 * Math.pow(RE / (RE + h), 2);
      return { q: `What is the gravitational acceleration at an altitude of <b>${f(h, 0)} km</b> above Earth's surface?`, answer: g, unit: 'm/s²',
        hint: 'Gravity falls off with the square of the distance from Earth’s centre, not from the surface.',
        sol: R`\[ g = g_0\left(\frac{R_\oplus}{R_\oplus+h}\right)^2 = 9.807\left(\frac{6378}{${f(RE + h, 0)}}\right)^2 = ${f(g, 3)}\ \mathrm{m/s^2} \]` };
    } },
    { topic: 'newton', title: 'Surface gravity of another world', make() {
      const b = pick(BODIES.filter((x) => x.n !== 'Earth'));
      const g = b.mu / (b.r * b.r) * 1000;
      return { q: `${b.n[0].toUpperCase() + b.n.slice(1)} has \\(\\mu = ${f(b.mu, 1)}\\ \\mathrm{km^3/s^2}\\) and a mean radius of ${f(b.r, 1)} km. What is its surface gravity?`, answer: g, unit: 'm/s²',
        hint: 'g = μ/R². Watch the units: μ in km³/s² and R in km give km/s².',
        sol: R`\[ g = \frac{\mu}{R^2} = \frac{${f(b.mu, 1)}}{(${f(b.r, 1)})^2} = ${f(g / 1000, 6)}\ \mathrm{km/s^2} = ${f(g, 3)}\ \mathrm{m/s^2} \]` };
    } },
    { topic: 'newton', title: 'Weight on the Moon', make() {
      const m = rnd(150, 200, 5);
      const g = MUM / (RM * RM) * 1000, W = m * g;
      return { q: `An astronaut in a full A7L suit and life-support backpack has a mass of <b>${m} kg</b>. What do they weigh on the lunar surface? (μ☾ = 4 902.8 km³/s², R☾ = 1 737.4 km)`, answer: W, unit: 'N',
        hint: 'Weight is mass times local gravitational acceleration. Mass does not change.',
        sol: R`\[ g_☾ = \frac{4902.8}{1737.4^2}\times 1000 = ${f(g, 3)}\ \mathrm{m/s^2},\quad W = m g_☾ = ${m}\times${f(g, 3)} = ${f(W, 0)}\ \mathrm{N} \]<p>On Earth the same astronaut would weigh ${f(m * G0, 0)} N, about six times more.</p>` };
    } },
    { topic: 'newton', title: 'Circular orbital speed', make() {
      const h = pick([185, 300, 400, 550, 1000, 20200]);
      const v = Math.sqrt(MU / (RE + h));
      return { q: `What speed does a spacecraft need for a circular orbit at <b>${f(h, 0)} km</b> altitude?`, answer: v, unit: 'km/s',
        hint: 'Gravity supplies the centripetal acceleration: μ/r² = v²/r.',
        sol: R`\[ v_c = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{398600}{${f(RE, 0)}+${f(h, 0)}}} = ${f(v, 3)}\ \mathrm{km/s} \]` };
    } },
    { topic: 'newton', title: 'Escape velocity', make() {
      const b = pick(BODIES);
      const v = Math.sqrt(2 * b.mu / b.r);
      return { q: `What is the escape velocity from the surface of <b>${b.n}</b>? (μ = ${f(b.mu, 1)} km³/s², R = ${f(b.r, 1)} km)`, answer: v, unit: 'km/s',
        hint: 'Set the specific mechanical energy to zero: v²/2 − μ/r = 0.',
        sol: R`\[ v_{esc} = \sqrt{\frac{2\mu}{R}} = \sqrt{\frac{2\times${f(b.mu, 1)}}{${f(b.r, 1)}}} = ${f(v, 3)}\ \mathrm{km/s} \]` };
    } },

    // ---------------- Orbits ----------------
    { topic: 'orbits', title: 'Orbital period', make() {
      const h = pick([185, 400, 700, 1500, 20200]);
      const T = 2 * Math.PI * Math.sqrt(Math.pow(RE + h, 3) / MU) / 60;
      return { q: `What is the period of a circular orbit at <b>${f(h, 0)} km</b> altitude?`, answer: T, unit: 'min',
        hint: 'Kepler’s third law: T = 2π√(a³/μ). For a circle, a = r.',
        sol: R`\[ T = 2\pi\sqrt{\frac{a^3}{\mu}} = 2\pi\sqrt{\frac{${f(RE + h, 0)}^3}{398600}} = ${f(T * 60, 0)}\ \mathrm{s} = ${f(T, 2)}\ \mathrm{min} \]` };
    } },
    { topic: 'orbits', title: 'Altitude from period', make() {
      const opts = [{ P: 86164.1, l: 'one sidereal day (23 h 56 min 4 s), the geostationary orbit' }, { P: 43082, l: 'half a sidereal day (GPS-like)' }, { P: 7200, l: '2 hours' }, { P: 10800, l: '3 hours' }];
      const o = pick(opts);
      const a = Math.cbrt(MU * Math.pow(o.P / (2 * Math.PI), 2));
      return { q: `What altitude gives a circular orbit with a period of <b>${o.l}</b>?`, answer: a - RE, unit: 'km',
        hint: 'Invert Kepler’s third law for a, then subtract Earth’s radius.',
        sol: R`\[ a = \sqrt[3]{\mu\left(\frac{T}{2\pi}\right)^2} = \sqrt[3]{398600\left(\frac{${f(o.P, 0)}}{2\pi}\right)^2} = ${f(a, 0)}\ \mathrm{km} \;\Rightarrow\; h = ${f(a - RE, 0)}\ \mathrm{km} \]` };
    } },
    { topic: 'orbits', title: 'Eccentricity from apsides', make() {
      const hp = rnd(160, 600, 5), ha = pick([1000, 2500, 5000, 20000, 35786]);
      const rp = RE + hp, ra = RE + ha, e = (ra - rp) / (ra + rp);
      return { q: `An orbit has a perigee altitude of <b>${hp} km</b> and an apogee altitude of <b>${f(ha, 0)} km</b>. What is its eccentricity?`, answer: e, unit: '', tol: 0.01,
        hint: 'Use radii from Earth’s centre: e = (r_a − r_p)/(r_a + r_p).',
        sol: R`\[ r_p = ${f(rp, 0)},\; r_a = ${f(ra, 0)}\ \mathrm{km},\qquad e = \frac{r_a-r_p}{r_a+r_p} = ${f(e, 4)} \]` };
    } },
    { topic: 'orbits', title: 'Vis-viva at perigee', make() {
      const hp = rnd(180, 400, 5), ha = pick([2000, 10000, 35786, 100000]);
      const rp = RE + hp, ra = RE + ha, a = (rp + ra) / 2, v = Math.sqrt(MU * (2 / rp - 1 / a));
      return { q: `What is the speed at perigee of an orbit with perigee altitude <b>${hp} km</b> and apogee altitude <b>${f(ha, 0)} km</b>?`, answer: v, unit: 'km/s',
        hint: 'Find a = (r_p + r_a)/2, then use the energy equation (vis-viva): v² = μ(2/r − 1/a).',
        sol: R`\[ a = \frac{${f(rp, 0)}+${f(ra, 0)}}{2} = ${f(a, 0)}\ \mathrm{km},\quad v_p = \sqrt{\mu\left(\frac{2}{r_p}-\frac{1}{a}\right)} = ${f(v, 3)}\ \mathrm{km/s} \]` };
    } },
    { topic: 'orbits', title: 'Angular momentum at apogee', make() {
      const hp = rnd(200, 500, 10), ha = pick([5000, 20000, 35786]);
      const rp = RE + hp, ra = RE + ha, a = (rp + ra) / 2;
      const vp = Math.sqrt(MU * (2 / rp - 1 / a)), va = vp * rp / ra;
      return { q: `A satellite passes perigee (altitude ${hp} km) at <b>${f(vp, 3)} km/s</b>. Its apogee altitude is ${f(ha, 0)} km. How fast does it move at apogee?`, answer: va, unit: 'km/s',
        hint: 'At both apsides the velocity is perpendicular to the radius, and h = r v is conserved.',
        sol: R`\[ r_p v_p = r_a v_a \;\Rightarrow\; v_a = v_p\frac{r_p}{r_a} = ${f(vp, 3)}\times\frac{${f(rp, 0)}}{${f(ra, 0)}} = ${f(va, 3)}\ \mathrm{km/s} \]` };
    } },
    { topic: 'orbits', title: 'Specific mechanical energy', make() {
      const h = rnd(200, 2000, 50), v = rnd(7.0, 10.5, 0.1);
      const r = RE + h, eps = v * v / 2 - MU / r;
      return { q: `A spacecraft at ${h} km altitude moves at <b>${v.toFixed(1)} km/s</b>. What is its specific mechanical energy? Is it bound to Earth?`, answer: eps, unit: 'km²/s² (MJ/kg)',
        hint: 'ε = v²/2 − μ/r. A negative value means a closed (elliptical) orbit.',
        sol: R`\[ \varepsilon = \frac{v^2}{2}-\frac{\mu}{r} = \frac{${v.toFixed(1)}^2}{2}-\frac{398600}{${f(r, 0)}} = ${f(eps, 3)}\ \mathrm{km^2/s^2} \]<p>${eps < 0 ? 'Negative, so the orbit is an ellipse and the spacecraft is bound to Earth.' : 'Positive, so the path is a hyperbola and the spacecraft escapes.'}</p>` };
    } },
    { topic: 'orbits', title: 'Time of flight (Kepler’s equation)', make() {
      const hp = rnd(200, 400, 10), ha = pick([10000, 20000, 35786]), nuD = pick([60, 90, 120, 150]);
      const rp = RE + hp, ra = RE + ha, a = (rp + ra) / 2, e = (ra - rp) / (ra + rp), nu = nuD * deg;
      const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
      const M = E - e * Math.sin(E), n = Math.sqrt(MU / (a * a * a)), t = M / n / 60;
      return { q: `On an orbit with perigee altitude ${hp} km and apogee altitude ${f(ha, 0)} km, how long does a spacecraft take to travel from perigee to a true anomaly of <b>${nuD}°</b>?`, answer: t, unit: 'min', tol: 0.015,
        hint: 'Find e and a, convert ν to the eccentric anomaly E, then apply Kepler’s equation M = E − e sin E and t = M/n (BMW §4.2).',
        sol: R`\[ a = ${f(a, 0)}\ \mathrm{km},\ e = ${f(e, 4)} \] \[ \tan\frac{E}{2} = \sqrt{\frac{1-e}{1+e}}\tan\frac{\nu}{2} \Rightarrow E = ${f(E, 4)}\ \mathrm{rad} \] \[ M = E - e\sin E = ${f(M, 4)},\quad n = \sqrt{\mu/a^3} = ${f(n, 7)}\ \mathrm{rad/s} \] \[ t = M/n = ${f(t * 60, 0)}\ \mathrm{s} = ${f(t, 2)}\ \mathrm{min} \]` };
    } },

    // ---------------- Rockets ----------------
    { topic: 'rockets', title: 'Tsiolkovsky', make() {
      const isp = pick([263, 304, 311, 421, 450]), m0 = rnd(20, 200, 5) * 1000, mf = Math.round(m0 * rnd(0.15, 0.5, 0.01) / 100) * 100;
      const dv = isp * G0 * Math.log(m0 / mf);
      return { q: `A stage with a specific impulse of <b>${isp} s</b> burns from an initial mass of ${f(m0, 0)} kg to a final mass of ${f(mf, 0)} kg. What Δv does it deliver?`, answer: dv, unit: 'm/s',
        hint: 'Δv = I_sp g₀ ln(m₀/m_f).',
        sol: R`\[ \Delta v = I_{sp}g_0\ln\frac{m_0}{m_f} = ${isp}\times9.807\times\ln\frac{${m0}}{${mf}} = ${f(dv, 0)}\ \mathrm{m/s} \]` };
    } },
    { topic: 'rockets', title: 'Propellant budget', make() {
      const isp = pick([311, 314, 421]), dry = rnd(5000, 30000, 500), dv = pick([900, 1000, 1850, 2050, 3150]);
      const prop = dry * (Math.exp(dv / (isp * G0)) - 1);
      return { q: `A spacecraft with a dry mass of <b>${f(dry, 0)} kg</b> (no propellant) needs <b>${f(dv, 0)} m/s</b> from an engine with I<sub>sp</sub> = ${isp} s. How much propellant must it carry?`, answer: prop, unit: 'kg',
        hint: 'Invert the rocket equation for the mass ratio, then m_prop = m_f (MR − 1).',
        sol: R`\[ MR = e^{\Delta v/(I_{sp}g_0)} = e^{${dv}/(${isp}\times9.807)} = ${f(Math.exp(dv / (isp * G0)), 4)} \] \[ m_{prop} = m_f(MR-1) = ${f(prop, 0)}\ \mathrm{kg} \]` };
    } },
    { topic: 'rockets', title: 'Burn time', make() {
      const eng = pick([{ n: 'one F-1', F: 6.77e6, isp: 263 }, { n: 'one J-2', F: 1.033e6, isp: 421 }, { n: 'the Apollo SPS', F: 91.2e3, isp: 314 }, { n: 'the LM ascent engine', F: 15.6e3, isp: 311 }]);
      const mdot = eng.F / (eng.isp * G0), prop = Math.round(mdot * rnd(120, 400, 10) / 100) * 100;
      const t = prop / mdot;
      return { q: `How long can <b>${eng.n}</b> (thrust ${f(eng.F / 1000, 1)} kN, I<sub>sp</sub> ${eng.isp} s) fire on ${f(prop, 0)} kg of propellant?`, answer: t, unit: 's',
        hint: 'Mass flow rate ṁ = F / (I_sp g₀).',
        sol: R`\[ \dot m = \frac{F}{I_{sp}g_0} = \frac{${f(eng.F, 0)}}{${eng.isp}\times9.807} = ${f(mdot, 1)}\ \mathrm{kg/s},\quad t = \frac{${f(prop, 0)}}{${f(mdot, 1)}} = ${f(t, 1)}\ \mathrm{s} \]` };
    } },
    { topic: 'rockets', title: 'The thrust equation', make() {
      const mdot = 2578, ve = 2850, pe = 44000, Ae = 9.87, hk = pick([0, 5, 10, 20, 40]);
      const pa = 101325 * Math.exp(-hk * 1000 / 7500);
      const F = mdot * ve + (pe - pa) * Ae;
      return { q: `An F-1 engine has ṁ = ${mdot} kg/s, exhaust velocity v<sub>e</sub> = ${ve} m/s, exit pressure p<sub>e</sub> = ${pe / 1000} kPa and exit area A<sub>e</sub> = ${Ae} m². What thrust does it produce where the ambient pressure is <b>${f(pa / 1000, 2)} kPa</b> (about ${hk} km altitude)?`, answer: F / 1e6, unit: 'MN',
        hint: 'F = ṁ v_e + (p_e − p_a) A_e.',
        sol: R`\[ F = ${mdot}\times${ve} + (${pe} - ${f(pa, 0)})\times${Ae} = ${f(F / 1e6, 3)}\ \mathrm{MN} \]<p>The pressure term ${pa > pe ? 'is negative here: the nozzle is overexpanded at this altitude.' : 'is positive: the exhaust is underexpanded, still pushing on the nozzle exit.'}</p>` };
    } },
    { topic: 'rockets', title: 'Two-stage vehicle', make() {
      const pl = rnd(1000, 5000, 100);
      const s2 = { prop: rnd(15000, 40000, 1000), dry: 0, isp: 421 }, s1 = { prop: rnd(100000, 250000, 5000), dry: 0, isp: 300 };
      s2.dry = Math.round(s2.prop * 0.1); s1.dry = Math.round(s1.prop * 0.08);
      const st = Phys.rocket.staging([s1, s2], pl);
      const tot = st[0].dv + st[1].dv;
      return { q: `A two-stage rocket carries a ${f(pl, 0)} kg payload. Stage 1: ${f(s1.prop, 0)} kg propellant, ${f(s1.dry, 0)} kg structure, I<sub>sp</sub> 300 s. Stage 2: ${f(s2.prop, 0)} kg propellant, ${f(s2.dry, 0)} kg structure, I<sub>sp</sub> 421 s. What is the total ideal Δv?`, answer: tot, unit: 'm/s',
        hint: 'Treat each stage separately: its initial mass includes everything above it. Drop the empty stage before lighting the next.',
        sol: R`\[ m_{0,1} = ${f(st[0].m0, 0)},\ m_{f,1} = ${f(st[0].mf, 0)} \Rightarrow \Delta v_1 = 300\,g_0\ln\frac{m_{0,1}}{m_{f,1}} = ${f(st[0].dv, 0)}\ \mathrm{m/s} \] \[ m_{0,2} = ${f(st[1].m0, 0)},\ m_{f,2} = ${f(st[1].mf, 0)} \Rightarrow \Delta v_2 = ${f(st[1].dv, 0)}\ \mathrm{m/s} \] \[ \Delta v = ${f(tot, 0)}\ \mathrm{m/s} \]` };
    } },

    { topic: 'rockets', title: 'Liftoff acceleration', make() {
      const v = pick([{ n: 'the Saturn V', F: 34.02e6, m: 2938e3 }, { n: 'a Titan II GLV (Gemini)', F: 1.9e6, m: 154e3 }, { n: 'a Soyuz-FG', F: 4.15e6, m: 305e3 }, { n: 'a Falcon 9', F: 7.6e6, m: 549e3 }]);
      const twr = v.F / (v.m * G0), a = (twr - 1) * G0;
      return { q: `At liftoff, <b>${v.n}</b> produces ${f(v.F / 1e6, 2)} MN of thrust and has a mass of ${f(v.m / 1000, 0)} t. What is its initial upward acceleration?`, answer: a, unit: 'm/s²', tol: 0.02,
        hint: 'First the thrust-to-weight ratio, F/(m g₀). Only the thrust beyond the weight accelerates the rocket: a = (TWR − 1) g₀.',
        sol: R`\[ \mathrm{TWR} = \frac{F}{m g_0} = \frac{${f(v.F, 0)}}{${f(v.m, 0)}\times9.807} = ${f(twr, 3)} \] \[ a = (\mathrm{TWR}-1)\,g_0 = ${f(a, 2)}\ \mathrm{m/s^2} \]` };
    } },
    { topic: 'rockets', title: 'Burn time from TWR', make() {
      const isp = pick([263, 285, 304, 421]), twr = pick([0.65, 0.8, 1.2, 1.5, 2.0]), frac = pick([0.7, 0.75, 0.8, 0.85]);
      const t = isp / twr * frac;
      return { q: `A stage with I<sub>sp</sub> = <b>${isp} s</b> ignites with a thrust-to-weight ratio of <b>${twr}</b> (relative to g₀). Propellant is ${Math.round(frac * 100)}% of its mass at ignition. How long does it burn?`, answer: t, unit: 's',
        hint: 't_b = (I_sp / TWR₀) × (1 − m_f/m₀), and 1 − m_f/m₀ is the propellant fraction.',
        sol: R`\[ t_b = \frac{I_{sp}}{\mathrm{TWR}_0}\left(1-\frac{m_f}{m_0}\right) = \frac{${isp}}{${twr}}\times${frac} = ${f(t, 0)}\ \mathrm{s} \]<p>Lower TWR means a longer burn. On the first stage, that time is paid for in gravity loss.</p>` };
    } },
    { topic: 'rockets', title: 'Heaviest rocket that lifts off', make() {
      const n = pick([1, 3, 5, 9]), F1 = pick([{ e: 'F-1', F: 6.77e6 }, { e: 'RD-180', F: 3.83e6 }, { e: 'Merlin 1D', F: 0.845e6 }]), twr = pick([1.2, 1.3, 1.4]);
      const m = n * F1.F / (twr * G0) / 1000;
      return { q: `A first stage has <b>${n} × ${F1.e}</b> engines (${f(F1.F / 1e6, 3)} MN each at sea level). If the liftoff TWR must be at least <b>${twr}</b>, what is the maximum liftoff mass?`, answer: m, unit: 't',
        hint: 'Rearrange TWR = F/(m g₀) for m.',
        sol: R`\[ m_{max} = \frac{F}{\mathrm{TWR}\,g_0} = \frac{${n}\times${f(F1.F, 0)}}{${twr}\times9.807} = ${f(m * 1000, 0)}\ \mathrm{kg} = ${f(m, 0)}\ \mathrm{t} \]` };
    } },

    // ---------------- Ascent ----------------
    { topic: 'ascent', title: 'Free speed from Earth’s rotation', make() {
      const s = pick([{ n: 'Kennedy Space Center', lat: 28.5 }, { n: 'Baikonur', lat: 45.9 }, { n: 'Kourou', lat: 5.2 }, { n: 'Plesetsk', lat: 62.9 }, { n: 'Wenchang', lat: 19.6 }]);
      const v = 7.2921159e-5 * 6378137 * Math.cos(s.lat * deg);
      return { q: `How much eastward speed does a rocket gain from Earth’s rotation when launched due east from <b>${s.n}</b> (latitude ${s.lat}°)?`, answer: v, unit: 'm/s',
        hint: 'Earth turns once per sidereal day (86 164 s). Surface speed is ω R cos(latitude).',
        sol: R`\[ v = \omega_\oplus R_\oplus\cos\phi = 7.292\times10^{-5}\times6\,378\,137\times\cos ${s.lat}^\circ = ${f(v, 1)}\ \mathrm{m/s} \]` };
    } },
    { topic: 'ascent', title: 'Δv to reach orbit', make() {
      const h = pick([185, 200, 300]), lossG = rnd(1100, 1500, 50), lossD = rnd(40, 150, 10), lat = 28.5;
      const vc = Math.sqrt(MU / (RE + h)) * 1000, rot = 465.1 * Math.cos(lat * deg), dv = vc + lossG + lossD - rot;
      return { q: `A launcher heads due east from 28.5° N into a ${h} km circular orbit. It suffers <b>${lossG} m/s</b> of gravity loss and <b>${lossD} m/s</b> of drag loss. Ignoring steering losses, what Δv must the vehicle supply?`, answer: dv, unit: 'm/s',
        hint: 'Orbital speed plus the losses, minus the speed Earth’s rotation gives you for free.',
        sol: R`\[ \Delta v = v_c + \Delta v_{grav} + \Delta v_{drag} - v_{rot} = ${f(vc, 0)} + ${lossG} + ${lossD} - ${f(rot, 0)} = ${f(dv, 0)}\ \mathrm{m/s} \]` };
    } },
    { topic: 'ascent', title: 'Dynamic pressure', make() {
      const h = rnd(8, 16, 1), v = rnd(350, 650, 10);
      const rho = 1.225 * Math.exp(-h * 1000 / 7200), q = 0.5 * rho * v * v / 1000;
      return { q: `At ${h} km altitude a launcher travels at <b>${v} m/s</b> relative to the air. Using an exponential atmosphere (ρ₀ = 1.225 kg/m³, scale height 7.2 km), what is the dynamic pressure?`, answer: q, unit: 'kPa',
        hint: 'q = ½ρv², with ρ = ρ₀ e^(−h/H).',
        sol: R`\[ \rho = 1.225\,e^{-${h}/7.2} = ${f(rho, 4)}\ \mathrm{kg/m^3},\quad q = \tfrac12\rho v^2 = ${f(q, 2)}\ \mathrm{kPa} \]<p>The Saturn V reached Max Q of about 35 kPa near 13 km altitude, 80 s after liftoff.</p>` };
    } },

    // ---------------- Manoeuvres ----------------
    { topic: 'maneuvers', title: 'Hohmann transfer Δv', make() {
      const h1 = pick([185, 300, 400]), h2 = pick([1000, 5000, 20200, 35786]);
      const r1 = RE + h1, r2 = RE + h2, at = (r1 + r2) / 2;
      const v1 = Math.sqrt(MU / r1), v2 = Math.sqrt(MU / r2), vt1 = Math.sqrt(MU * (2 / r1 - 1 / at)), vt2 = Math.sqrt(MU * (2 / r2 - 1 / at));
      const dv = (vt1 - v1) + (v2 - vt2);
      return { q: `What total Δv does a Hohmann transfer need from a <b>${h1} km</b> circular orbit to a <b>${f(h2, 0)} km</b> circular orbit (coplanar)?`, answer: dv, unit: 'km/s',
        hint: 'Transfer ellipse a = (r₁ + r₂)/2. Burn 1 at perigee: v_t1 − v₁. Burn 2 at apogee: v₂ − v_t2.',
        sol: R`\[ a_t = ${f(at, 0)}\ \mathrm{km},\quad v_1 = ${f(v1, 3)},\ v_{t1} = ${f(vt1, 3)},\ v_{t2} = ${f(vt2, 3)},\ v_2 = ${f(v2, 3)}\ \mathrm{km/s} \] \[ \Delta v = (${f(vt1, 3)}-${f(v1, 3)}) + (${f(v2, 3)}-${f(vt2, 3)}) = ${f(dv, 3)}\ \mathrm{km/s} \]` };
    } },
    { topic: 'maneuvers', title: 'Hohmann time of flight', make() {
      const h1 = pick([185, 400]), h2 = pick([5000, 20200, 35786, 384400 - RE]);
      const at = (2 * RE + h1 + h2) / 2, t = Math.PI * Math.sqrt(at * at * at / MU) / 3600;
      return { q: `How long does a Hohmann transfer take from a ${h1} km orbit to a circular orbit at radius <b>${f(RE + h2, 0)} km</b>?`, answer: t, unit: 'h',
        hint: 'Half the period of the transfer ellipse.',
        sol: R`\[ \mathrm{TOF} = \pi\sqrt{\frac{a_t^3}{\mu}} = \pi\sqrt{\frac{${f(at, 0)}^3}{398600}} = ${f(t * 3600, 0)}\ \mathrm{s} = ${f(t, 2)}\ \mathrm{h} \]` };
    } },
    { topic: 'maneuvers', title: 'Simple plane change', make() {
      const h = pick([185, 400, 35786]), di = pick([1, 5, 10, 28.5]);
      const v = Math.sqrt(MU / (RE + h)), dv = 2 * v * Math.sin(di * deg / 2);
      return { q: `How much Δv does it take to rotate a <b>${f(h, 0)} km</b> circular orbit's plane by <b>${di}°</b> without changing its size?`, answer: dv, unit: 'km/s',
        hint: 'The velocity keeps its magnitude but turns through Δi: Δv = 2v sin(Δi/2).',
        sol: R`\[ v = ${f(v, 3)}\ \mathrm{km/s},\quad \Delta v = 2v\sin\frac{\Delta i}{2} = ${f(dv, 3)}\ \mathrm{km/s} \]<p>Plane changes are expensive in low orbit. That is one reason Apollo launch windows were planned so carefully.</p>` };
    } },
    { topic: 'maneuvers', title: 'Rendezvous lead angle', make() {
      const h1 = pick([15, 18]), h2 = pick([110, 111, 120]);
      const r1 = RM + h1, r2 = RM + h2, at = (r1 + r2) / 2;
      const tof = Math.PI * Math.sqrt(at * at * at / MUM), w2 = Math.sqrt(MUM / (r2 * r2 * r2));
      const lead = (Math.PI - w2 * tof) / deg;
      return { q: `The LM ascent stage leaves a ${h1} km lunar orbit on a Hohmann transfer to the CSM, which is in a circular orbit at <b>${h2} km</b>. By what angle must the CSM lead the LM when the transfer burn starts? (μ☾ = 4 902.8 km³/s², R☾ = 1 737.4 km)`, answer: lead, unit: '°', tol: 0.02,
        hint: 'The CSM must arrive at the meeting point at the same time: lead angle = π − ω_target × TOF.',
        sol: R`\[ \mathrm{TOF} = \pi\sqrt{a_t^3/\mu} = ${f(tof, 0)}\ \mathrm{s},\quad \omega_{CSM} = \sqrt{\mu/r_2^3} = ${f(w2, 6)}\ \mathrm{rad/s} \] \[ \alpha_{lead} = 180^\circ - \omega_{CSM}\,\mathrm{TOF} = ${f(lead, 2)}^\circ \]` };
    } },

    // ---------------- Moon ----------------
    { topic: 'moon', title: 'Sphere of influence', make() {
      const o = pick([{ n: 'the Moon (relative to Earth)', D: 384400, m: 0.0123000371 }, { n: 'Earth (relative to the Sun)', D: 149597871, m: 3.003e-6 }, { n: 'Mars (relative to the Sun)', D: 227939200, m: 3.227e-7 }]);
      const r = o.D * Math.pow(o.m, 0.4);
      return { q: `Estimate the radius of the sphere of influence of <b>${o.n}</b>. Distance ${f(o.D, 0)} km, mass ratio m/M = ${o.m.toExponential(4)}.`, answer: r, unit: 'km',
        hint: 'Laplace’s sphere of influence: r_SOI = D (m/M)^(2/5).',
        sol: R`\[ r_{SOI} = D\left(\frac{m}{M}\right)^{2/5} = ${f(o.D, 0)}\times(${o.m.toExponential(4)})^{0.4} = ${f(r, 0)}\ \mathrm{km} \]` };
    } },
    { topic: 'moon', title: 'Trans-lunar injection', make() {
      const h = pick([167, 185, 190]), ra = pick([384400, 400000, 370000]);
      const rp = RE + h, a = (rp + ra) / 2, vc = Math.sqrt(MU / rp), vp = Math.sqrt(MU * (2 / rp - 1 / a));
      return { q: `Apollo coasted in a <b>${h} km</b> circular parking orbit. Using a two-body Hohmann approximation, what TLI Δv raises apogee to <b>${f(ra, 0)} km</b> from Earth's centre?`, answer: vp - vc, unit: 'km/s',
        hint: 'Perigee speed of the transfer ellipse minus circular speed.',
        sol: R`\[ v_c = \sqrt{\mu/r_p} = ${f(vc, 3)},\quad v_p = \sqrt{\mu\left(\frac{2}{r_p}-\frac{1}{a}\right)} = ${f(vp, 3)}\ \mathrm{km/s} \] \[ \Delta v_{TLI} = ${f(vp - vc, 3)}\ \mathrm{km/s} \]<p>Apollo 11's real TLI was 3.18 km/s; the Moon's own gravity is why patched conics or numerical integration are needed for the details.</p>` };
    } },
    { topic: 'moon', title: 'Lunar orbit insertion', make() {
      const vinf = rnd(0.8, 1.0, 0.01), h = pick([110, 111, 120, 300]);
      const r = RM + h, vp = Math.sqrt(vinf * vinf + 2 * MUM / r), vc = Math.sqrt(MUM / r), dv = vp - vc;
      return { q: `The CSM enters the Moon's sphere of influence with a hyperbolic excess speed v∞ = <b>${vinf.toFixed(2)} km/s</b>. Periselene altitude is ${h} km. What retrograde Δv at periselene circularizes the orbit?`, answer: dv, unit: 'km/s',
        hint: 'On a hyperbola, v² = v∞² + 2μ/r. Subtract the circular speed at that radius.',
        sol: R`\[ v_p = \sqrt{v_\infty^2 + \frac{2\mu_☾}{r}} = ${f(vp, 3)},\quad v_c = \sqrt{\mu_☾/r} = ${f(vc, 3)}\ \mathrm{km/s} \] \[ \Delta v = ${f(dv, 3)}\ \mathrm{km/s} \]<p>Apollo split this into LOI-1 (an ellipse, 889 m/s) and LOI-2 (circularization, 48 m/s).</p>` };
    } },
    { topic: 'moon', title: 'Lunar orbit speed and period', make() {
      const h = pick([15, 60, 100, 110]);
      const r = RM + h, v = Math.sqrt(MUM / r), T = 2 * Math.PI * Math.sqrt(r * r * r / MUM) / 60;
      return { q: `What is the period of a circular orbit <b>${h} km</b> above the Moon?`, answer: T, unit: 'min',
        hint: 'Same Kepler third law, with the Moon’s μ and radius.',
        sol: R`\[ T = 2\pi\sqrt{\frac{(${f(RM, 1)}+${h})^3}{4902.8}} = ${f(T, 1)}\ \mathrm{min},\quad v = ${f(v, 3)}\ \mathrm{km/s} \]<p>Apollo's CSM circled the Moon roughly every two hours, out of radio contact behind the far side for about 45 minutes of each orbit.</p>` };
    } },

    // ---------------- Landing ----------------
    { topic: 'landing', title: 'Hover time', make() {
      const m0 = rnd(7200, 8200, 100), prop = rnd(200, 500, 10), isp = 311;
      const gm = MUM / (RM * RM) * 1000, t = isp * G0 / gm * Math.log(m0 / (m0 - prop));
      return { q: `The LM hovers above the surface with a mass of <b>${f(m0, 0)} kg</b> and ${prop} kg of usable descent propellant left (I<sub>sp</sub> = 311 s, g☾ = 1.624 m/s²). How long can it hover?`, answer: t, unit: 's', tol: 0.015,
        hint: 'Hovering means thrust = weight, so ṁ = mg/(I_sp g₀) and ṁ shrinks with m. Integrate dm/m = −g dt /(I_sp g₀).',
        sol: R`\[ t = \frac{I_{sp}g_0}{g_☾}\ln\frac{m_0}{m_0-m_{prop}} = \frac{311\times9.807}{${f(gm, 3)}}\ln\frac{${m0}}{${m0 - prop}} = ${f(t, 1)}\ \mathrm{s} \]` };
    } },
    { topic: 'landing', title: 'LM ascent stage', make() {
      const m0 = rnd(4700, 4900, 10), prop = rnd(2300, 2400, 10), isp = 311;
      const dv = isp * G0 * Math.log(m0 / (m0 - prop));
      return { q: `The LM ascent stage lifts off with a mass of <b>${f(m0, 0)} kg</b>, including ${f(prop, 0)} kg of propellant (I<sub>sp</sub> = 311 s). What is its maximum Δv?`, answer: dv, unit: 'm/s',
        hint: 'Rocket equation again.',
        sol: R`\[ \Delta v = 311\times9.807\times\ln\frac{${m0}}{${m0 - prop}} = ${f(dv, 0)}\ \mathrm{m/s} \]<p>Reaching lunar orbit needs about 1 850 m/s. There was no backup engine; the APS was kept as simple as possible to be reliable.</p>` };
    } },
    { topic: 'landing', title: 'Lunar thrust-to-weight', make() {
      const thr = pick([10, 25, 40, 60]), m = rnd(7000, 15000, 500);
      const F = 45040 * thr / 100, gm = 1.624, tw = F / (m * gm);
      return { q: `The descent engine (45.04 kN at full thrust) is throttled to <b>${thr}%</b>. The LM's mass is ${f(m, 0)} kg. What is its thrust-to-weight ratio on the Moon?`, answer: tw, unit: '',
        hint: 'T/W = F / (m g☾). Above 1 the LM accelerates upward.',
        sol: R`\[ \frac{T}{W} = \frac{${f(F, 0)}}{${m}\times1.624} = ${f(tw, 3)} \]` };
    } },

    // ---------------- Entry ----------------
    { topic: 'entry', title: 'Ballistic coefficient', make() {
      const o = pick([{ n: 'the Apollo Command Module', m: 5500, cd: 1.3, d: 3.9 }, { n: 'a Mercury capsule', m: 1100, cd: 1.6, d: 1.89 }, { n: 'a Soyuz descent module', m: 2900, cd: 1.3, d: 2.17 }]);
      const A = Math.PI * o.d * o.d / 4, b = o.m / (o.cd * A);
      return { q: `What is the ballistic coefficient of <b>${o.n}</b>: m = ${f(o.m, 0)} kg, C<sub>D</sub> = ${o.cd}, base diameter ${o.d} m?`, answer: b, unit: 'kg/m²',
        hint: 'β = m / (C_D A), with A the frontal area.',
        sol: R`\[ A = \pi d^2/4 = ${f(A, 2)}\ \mathrm{m^2},\quad \beta = \frac{m}{C_D A} = ${f(b, 0)}\ \mathrm{kg/m^2} \]` };
    } },
    { topic: 'entry', title: 'Peak deceleration (Allen–Eggers)', make() {
      const v = pick([7.8, 11.0, 11.1]), gam = pick([2, 5, 6.5, 10, 20]);
      const H = 7.2, a = v * v * 1e6 * Math.sin(gam * deg) / (2 * Math.E * H * 1000), g = a / G0;
      return { q: `A non-lifting capsule enters at <b>${v} km/s</b> with a flight-path angle of <b>−${gam}°</b>. Using the Allen–Eggers ballistic solution with a scale height of 7.2 km, what is the peak deceleration in g?`, answer: g, unit: 'g',
        hint: 'a_max = V² sin|γ| / (2 e H). It does not depend on mass or drag coefficient.',
        sol: R`\[ a_{max} = \frac{V_E^2\sin|\gamma|}{2eH} = \frac{(${v * 1000})^2\sin ${gam}^\circ}{2e\times7200} = ${f(a, 0)}\ \mathrm{m/s^2} = ${f(g, 1)}\,g \]<p>${g > 12 ? 'Lethal for a ballistic return. Apollo used lift to keep peak loads near 6.5 g.' : 'Survivable. Lift reduces it further.'}</p>` };
    } },
    { topic: 'entry', title: 'Energy to dissipate', make() {
      const v = pick([7.8, 11.03]), m = 5500;
      const ke = 0.5 * m * Math.pow(v * 1000, 2), tnt = ke / 4.184e6 / 1000;
      return { q: `How much kinetic energy must the ${f(m, 0)} kg Command Module shed when it enters at <b>${v} km/s</b>? Express it in tonnes of TNT (4.184 GJ per tonne).`, answer: tnt, unit: 't TNT',
        hint: 'KE = ½ m v².',
        sol: R`\[ KE = \tfrac12\times${m}\times(${v * 1000})^2 = ${f(ke / 1e9, 1)}\ \mathrm{GJ} = ${f(tnt, 1)}\ \text{t TNT} \]<p>Almost all of it goes into the shock layer and the air around the capsule. Only a few percent reaches the ablative heat shield.</p>` };
    } },
    { topic: 'entry', title: 'Altitude of peak deceleration', make() {
      const b = pick([350, 100, 1000]), gam = pick([3, 6.5, 15]);
      const H = 7200, hh = H * Math.log(1.225 * H / (b * Math.sin(gam * deg))) / 1000;
      return { q: `A ballistic vehicle with β = <b>${b} kg/m²</b> enters at γ = −${gam}°. Where does deceleration peak? (ρ₀ = 1.225 kg/m³, H = 7.2 km)`, answer: hh, unit: 'km',
        hint: 'Allen–Eggers: peak deceleration occurs where ρ = β sin|γ| / H.',
        sol: R`\[ \rho^* = \frac{\beta\sin|\gamma|}{H} = ${f(b * Math.sin(gam * deg) / H, 5)}\ \mathrm{kg/m^3},\quad h^* = H\ln\frac{\rho_0}{\rho^*} = ${f(hh, 1)}\ \mathrm{km} \]` };
    } },
  ];

  /* Concept questions: { topic, q, opts, a (index), why } */
  const QUIZ = [
    { topic: 'newton', q: 'Why do astronauts on the ISS float?', opts: ['There is no gravity at 400 km', 'They and the station are in continuous free fall', 'The station’s rotation cancels gravity', 'The atmosphere holds them up'], a: 1, why: 'Gravity there is still 89% of surface gravity. Everything aboard falls together, so nothing presses on anything else.' },
    { topic: 'newton', q: 'Escape velocity at any radius is how many times the circular speed there?', opts: ['2', '√2', '1.5', 'It depends on the mass of the spacecraft'], a: 1, why: 'v_esc = √(2μ/r) = √2 · √(μ/r). Neither depends on the spacecraft’s mass.' },
    { topic: 'orbits', q: 'Where on an elliptical orbit is the spacecraft fastest?', opts: ['Apoapsis', 'Periapsis', 'At the ends of the minor axis', 'Speed is constant'], a: 1, why: 'Angular momentum h = r v cos φ is conserved, so speed is highest where r is smallest (Kepler’s second law).' },
    { topic: 'orbits', q: 'Two orbits have the same semi-major axis but different eccentricities. Their periods are…', opts: ['Identical', 'Longer for the more eccentric one', 'Shorter for the more eccentric one', 'Impossible to compare'], a: 0, why: 'T = 2π√(a³/μ) depends only on a. So does the specific mechanical energy, ε = −μ/2a.' },
    { topic: 'rockets', q: 'Doubling the specific impulse of a stage, at the same mass ratio, does what to its Δv?', opts: ['Doubles it', 'Multiplies it by √2', 'Multiplies it by ln 2', 'No change'], a: 0, why: 'Δv = I_sp g₀ ln(MR) is linear in I_sp. The mass ratio only enters through a logarithm, which is why staging matters so much.' },
    { topic: 'rockets', q: 'Why did the Saturn V use kerosene (RP-1) for the first stage but hydrogen for the upper stages?', opts: ['Hydrogen was cheaper', 'RP-1 is dense and gives high thrust in a compact tank; LH₂ gives higher Isp where Δv per kilogram matters most', 'Hydrogen does not work at sea level', 'Kerosene freezes in space'], a: 1, why: 'At liftoff the job is raw thrust, and dense propellant keeps tanks and drag small. Upper stages carry every kilogram the whole way, so their Isp (421 s versus 263 s) pays off more.' },
    { topic: 'rockets', q: 'A rocket’s liftoff thrust-to-weight ratio is 0.95. What happens when the engines ignite?', opts: ['It rises slowly', 'It stays on the pad while burning propellant, until it is light enough', 'It tips over', 'It depends on the specific impulse'], a: 1, why: 'Thrust is less than weight, so the net force is downward and the pad holds it. As propellant burns the mass drops and TWR rises, but all that propellant is wasted. Real rockets are held down until thrust is verified and released only when TWR > 1.' },
    { topic: 'rockets', q: 'Why can the S-IVB upper stage fly with a TWR of only 0.64?', opts: ['Gravity is much weaker at 180 km', 'It is already high, fast and nearly horizontal: it only needs to build sideways speed, and near orbital speed gravity is cancelled by the curvature of the path', 'Its engine is more efficient', 'It cannot; it falls back'], a: 1, why: 'At 180 km gravity is still 95% of its surface value. What changes is the task: the vehicle no longer has to climb, and the faster it goes sideways the less of its weight it must support.' },
    { topic: 'ascent', q: 'What is gravity loss?', opts: ['Mass lost from the vehicle', 'The part of thrust spent holding the vehicle up against gravity instead of accelerating it along its path', 'Weaker gravity at altitude', 'Energy lost to heat'], a: 1, why: 'Δv_grav = ∫ g sin γ dt. A vertical climb loses about 9.8 m/s every second. Pitching over early reduces it, but drag rises.' },
    { topic: 'ascent', q: 'Why launch toward the east?', opts: ['To avoid the Sun', 'Earth’s rotation gives a free eastward velocity of up to 465 m/s', 'Weather is better', 'Tradition'], a: 1, why: 'From Cape Canaveral (28.5° N) the free boost is about 408 m/s.' },
    { topic: 'maneuvers', q: 'In a Hohmann transfer to a higher circular orbit, the second burn is made…', opts: ['At perigee, retrograde', 'At apogee, prograde', 'At apogee, retrograde', 'Halfway, radially'], a: 1, why: 'At apogee the transfer orbit is slower than the circular orbit there, so a prograde burn circularizes.' },
    { topic: 'maneuvers', q: 'To catch up with a target ahead of you in the same circular orbit, you should first…', opts: ['Burn prograde', 'Burn retrograde to drop into a lower, faster phasing orbit', 'Burn radially outward', 'Wait'], a: 1, why: 'Orbital mechanics is counter-intuitive here: a lower orbit has a shorter period, so you gain on the target. Prograde would raise you and slow you down.' },
    { topic: 'moon', q: 'What is a free-return trajectory?', opts: ['A trajectory that costs no propellant to reach orbit', 'A trans-lunar path that swings around the Moon and returns to Earth’s atmosphere without a major burn', 'A return powered only by the Sun', 'A lunar orbit that decays'], a: 1, why: 'Apollo 8 to 11 flew free-return (or near free-return) trajectories. It saved Apollo 13 when its service module failed.' },
    { topic: 'moon', q: 'Why did Apollo choose lunar orbit rendezvous over a direct landing?', opts: ['Better radio coverage', 'Only a small lander had to descend and climb out of the Moon’s gravity well, which saved a huge amount of mass', 'Astronauts preferred it', 'It was faster'], a: 1, why: 'John Houbolt’s argument: the return vehicle and heat shield stayed in orbit, so the mass that had to land and take off again was cut dramatically.' },
    { topic: 'landing', q: 'Why does hovering waste propellant?', opts: ['The engine runs hotter', 'All thrust goes to cancelling gravity (pure gravity loss) and none to changing velocity', 'Throttling lowers Isp', 'It doesn’t'], a: 1, why: 'Hovering spends about 1.6 m/s of Δv every second for nothing. Armstrong’s long hover over the boulder field left about 45 s of propellant.' },
    { topic: 'entry', q: 'What happens if the entry flight-path angle is too shallow?', opts: ['Excessive g-load', 'The capsule skips back out of the atmosphere', 'It lands short', 'Nothing'], a: 1, why: 'Too shallow and drag cannot slow the capsule enough before lift and the curvature carry it out. Too steep and deceleration and heating become lethal. Apollo’s corridor was only about 2° wide.' },
    { topic: 'entry', q: 'How did Apollo steer during entry?', opts: ['Fins', 'Rolling an offset-centre-of-mass capsule to point its lift vector up, down or sideways', 'Small wings', 'The SPS engine'], a: 1, why: 'The CM flew at an angle of attack, giving L/D ≈ 0.3. Rolling the lift vector controlled descent rate and cross-range.' },
  ];

  /* ---- scoring ---- */
  const stats = () => UI.store.get('stats', {});
  const record = (topic, ok) => {
    const s = stats();
    s[topic] = s[topic] || { tries: 0, right: 0 };
    s[topic].tries++; if (ok) s[topic].right++;
    s.streak = ok ? (s.streak || 0) + 1 : 0;
    UI.store.set('stats', s);
    if (window.Progress) Progress.checkQual();
  };
  const RANKS = [[0, 'Trainee'], [5, 'Flight Controller'], [15, 'CAPCOM'], [30, 'FIDO'], [50, 'Flight Director']];
  const rankOf = (n) => RANKS.filter((r) => n >= r[0]).pop()[1];

  const parseNum = (s) => parseFloat(String(s).replace(/\s|\u202f/g, '').replace(',', '.'));

  function problemCard(gen, onDone) {
    const p = gen.make();
    const tol = p.tol ?? 0.01;
    const el = UI.html(`
      <div class="problem">
        <div class="meta"><span class="chip">${TOPICS[gen.topic]}</span><span class="chip">${gen.title}</span></div>
        <div class="q">${p.q}</div>
        <form class="answer-row" autocomplete="off">
          <input type="text" inputmode="decimal" aria-label="Your answer" placeholder="your answer">
          <span class="unit">${p.unit}</span>
          <button class="btn primary" type="submit">Check</button>
          <button class="btn" type="button" data-a="hint">Hint</button>
          <button class="btn" type="button" data-a="sol">Solution</button>
          <button class="btn" type="button" data-a="new">New problem ↻</button>
        </form>
        <div class="verdict" aria-live="polite"></div>
        <div class="note hint" hidden>${p.hint}</div>
        <div class="solution" hidden>${p.sol}<p class="mono" style="margin:0">Answer: <b>${f(p.answer, Math.abs(p.answer) < 10 ? 3 : Math.abs(p.answer) < 1000 ? 1 : 0)} ${p.unit}</b> (tolerance ±${(tol * 100).toFixed(1)}%)</p></div>
      </div>`);
    let answered = false;
    const form = el.querySelector('form'), input = el.querySelector('input'), verdict = el.querySelector('.verdict');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = parseNum(input.value);
      if (!isFinite(x)) { verdict.className = 'verdict no'; verdict.textContent = 'Enter a number, for example 7.784 or 1.2e3.'; return; }
      const ok = Math.abs(x - p.answer) <= Math.abs(p.answer) * tol;
      if (!answered) { record(gen.topic, ok); answered = true; onDone && onDone(); }
      verdict.className = 'verdict ' + (ok ? 'ok' : 'no');
      verdict.textContent = ok ? '✓ Correct. Go flight!' : `✗ Not within ${(tol * 100).toFixed(1)}%. ${x * p.answer < 0 ? 'Check the sign. ' : Math.abs(Math.log10(Math.abs(x / p.answer))) > 2.5 ? 'Off by orders of magnitude; check units (km vs m). ' : ''}Try again or open the hint.`;
    });
    el.addEventListener('click', (e) => {
      const a = e.target.dataset && e.target.dataset.a;
      if (a === 'hint') el.querySelector('.hint').hidden = false;
      if (a === 'sol') { el.querySelector('.solution').hidden = false; UI.typeset(el.querySelector('.solution')); if (!answered) { record(gen.topic, false); answered = true; onDone && onDone(); } }
      if (a === 'new') { const n = problemCard(pickGen(gen.topic), onDone); el.replaceWith(n); UI.typeset(n); }
    });
    return el;
  }

  function quizCard(qq) {
    const el = UI.html(`<div class="problem"><div class="meta"><span class="chip">${TOPICS[qq.topic]}</span><span class="chip">Concept</span></div><div class="q">${qq.q}</div><div class="quiz"></div><div class="note why" hidden>${qq.why}</div></div>`);
    const box = el.querySelector('.quiz');
    let done = false;
    qq.opts.forEach((o, i) => {
      const b = UI.html(`<button class="opt" type="button">${o}</button>`);
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        b.classList.add(i === qq.a ? 'right' : 'wrong');
        box.children[qq.a].classList.add('right');
        el.querySelector('.why').hidden = false;
        record(qq.topic, i === qq.a);
      });
      box.appendChild(b);
    });
    return el;
  }

  const pickGen = (topic) => pick(GEN.filter((g) => !topic || topic === 'all' || g.topic === topic));

  const Practice = {
    TOPICS, GEN, QUIZ,
    // inline set at the end of a chapter: n numeric problems (distinct generators) + one concept question
    embed(container, topic, n = 2) {
      const gens = GEN.filter((g) => g.topic === topic).sort(() => Math.random() - 0.5).slice(0, n);
      const wrap = UI.html('<div style="display:flex;flex-direction:column;gap:1rem"></div>');
      gens.forEach((g) => wrap.appendChild(problemCard(g)));
      const qs = QUIZ.filter((q) => q.topic === topic);
      if (qs.length) wrap.appendChild(quizCard(pick(qs)));
      wrap.appendChild(UI.html(`<p class="note">More in <a href="#practice">Practice</a>: new numbers every time, with worked solutions.</p>`));
      container.appendChild(wrap);
    },
  };
  window.Practice = Practice;

  App.chapter({
    id: 'practice', phase: 'Simulator room', title: 'Practice', blurb: 'Randomized problems with worked solutions, from vis-viva to re-entry heating. Climb from Trainee to Flight Director.',
    render(page) {
      let topic = UI.store.get('ptopic', 'all');
      page.innerHTML = `
        ${App.header({ eyebrow: 'Training · Mission simulator', title: 'Practice', lede: 'Each problem has fresh numbers. Answers within 1% count as correct (some allow a little more). Use a calculator; the solutions follow the notation of BMW and Sellers.' })}
        <div class="score" id="score"></div>
        <div class="topics" id="topics"></div>
        <div id="pbox" style="display:flex;flex-direction:column;gap:1rem"></div>
        <div class="btn-row"><button class="btn" id="more">Another problem</button><button class="btn" id="concept">Concept question</button><button class="btn" id="reset">Reset my score</button></div>
        <p class="note" id="reset-note" hidden></p>`;
      const topicsEl = page.querySelector('#topics'), box = page.querySelector('#pbox');
      topicsEl.innerHTML = [['all', 'All topics'], ...Object.entries(TOPICS)].map(([k, v]) => `<button data-t="${k}" aria-pressed="${k === topic}">${v}</button>`).join('');
      const renderScore = () => {
        const s = stats();
        let tries = 0, right = 0;
        for (const k of Object.keys(TOPICS)) if (s[k]) { tries += s[k].tries; right += s[k].right; }
        const next = RANKS.find((r) => r[0] > right);
        page.querySelector('#score').innerHTML = `
          <div><b>${rankOf(right)}</b>rank${next ? ` · ${next[0] - right} more to ${next[1]}` : ''}</div>
          <div><b class="num">${right}/${tries}</b>correct</div>
          <div><b class="num">${s.streak || 0}</b>current streak</div>
          ${Object.entries(TOPICS).filter(([k]) => s[k]).map(([k, v]) => `<div><b class="num">${Math.round(100 * s[k].right / s[k].tries)}%</b>${v}</div>`).join('')}`;
      };
      const add = (concept) => {
        let card;
        if (concept) {
          const qs = QUIZ.filter((q) => topic === 'all' || q.topic === topic);
          card = quizCard(pick(qs));
          card.addEventListener('click', () => setTimeout(renderScore, 0));
        } else card = problemCard(pickGen(topic), renderScore);
        box.prepend(card);
        while (box.children.length > 4) box.lastElementChild.remove();
        UI.typeset(card);
        card.querySelector('input')?.focus({ preventScroll: true });
      };
      topicsEl.addEventListener('click', (e) => {
        const t = e.target.dataset.t; if (!t) return;
        topic = t; UI.store.set('ptopic', t);
        topicsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
        box.innerHTML = ''; add(false);
      });
      page.querySelector('#more').addEventListener('click', () => add(false));
      page.querySelector('#concept').addEventListener('click', () => add(true));
      const resetBtn = page.querySelector('#reset'), note = page.querySelector('#reset-note');
      let armed = false;
      resetBtn.addEventListener('click', () => {
        if (!armed) { armed = true; resetBtn.textContent = 'Click again to confirm reset'; return; }
        UI.store.set('stats', {}); armed = false; resetBtn.textContent = 'Reset my score';
        note.hidden = false; note.textContent = 'Score reset.'; renderScore();
      });
      renderScore();
      add(false);
    },
  });
})();
