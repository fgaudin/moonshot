/* Reference: constants, formula sheet, sources. */
(function () {
  'use strict';
  const { C } = Phys;
  const row = (a, b, c, d = '') => `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`;

  App.chapter({
    id: 'reference', phase: 'Flight data file', title: 'Reference',
    blurb: 'Constants, the formula sheet and sources.',
    render(page) {
      page.innerHTML = `
        ${App.header({ eyebrow: 'Flight data file', title: 'Reference', lede: 'Every constant used by the simulators and exercises, and the equations you will reach for most often.' })}

        <section class="section">
          <h2><span class="idx">A</span>Reading the notation</h2>
          <div class="prose"><p>You don’t need to do calculus to follow this manual, but you will meet its notation. Here is what each piece means, in plain words.</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>Notation</th><th>Read it as</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>\\(\\vec v\\)</td><td>a vector: a quantity with a direction (an arrow). Without the arrow, \\(v\\) is just its length</td><td>\\(\\vec v\\) velocity, \\(v\\) speed</td></tr>
              <tr><td>\\(\\Delta x\\)</td><td>“change in \\(x\\)”: final value minus initial value</td><td>\\(\\Delta v\\) = 3 160 m/s</td></tr>
              <tr><td>\\(\\dot x\\)</td><td>“how fast \\(x\\) changes, per second”. Same as \\(dx/dt\\)</td><td>\\(\\dot m\\) = kg of propellant burned per second</td></tr>
              <tr><td>\\(\\ddot x\\)</td><td>how fast the rate of change changes: two dots on a position give an acceleration</td><td>\\(\\ddot{\\vec r}\\) = acceleration</td></tr>
              <tr><td>\\(\\frac{dx}{dt}\\)</td><td>derivative: the slope of \\(x\\) plotted against time. For small steps, \\(\\approx \\Delta x/\\Delta t\\)</td><td>\\(dv/dt\\) = acceleration</td></tr>
              <tr><td>\\(\\int x\\,dt\\)</td><td>integral: add up \\(x \\times\\) (tiny time step) over the whole period. It is the area under the curve of \\(x\\)</td><td>\\(\\int g\\sin\\gamma\\,dt\\) = gravity loss</td></tr>
              <tr><td>\\(\\sum_k x_k\\)</td><td>sum: \\(x_1 + x_2 + x_3 + \\ldots\\)</td><td>Δv of all stages</td></tr>
              <tr><td>\\(\\ln x\\)</td><td>natural logarithm (the “ln” key). Undoes \\(e^x\\): \\(\\ln e^x = x\\)</td><td>\\(\\ln 3 \\approx 1.10\\)</td></tr>
              <tr><td>\\(e^{x}\\)</td><td>exponential, with \\(e \\approx 2.718\\). Not the eccentricity, despite the same letter</td><td>\\(e^{-h/H}\\): air thins with height</td></tr>
              <tr><td>\\(\\vec a \\times \\vec b\\)</td><td>cross product: a vector perpendicular to both</td><td>\\(\\vec h = \\vec r\\times\\vec v\\)</td></tr>
              <tr><td>\\(|x|\\)</td><td>absolute value: drop the minus sign</td><td>\\(|{-6.5^\\circ}| = 6.5^\\circ\\)</td></tr>
              <tr><td>\\(x_p,\\ x_0,\\ x_{\\oplus}\\)</td><td>subscripts are labels, not maths: which \\(x\\) we mean</td><td>\\(r_p\\) periapsis radius, \\(m_0\\) initial mass</td></tr>
              <tr><td>rad</td><td>radians: \\(\\pi\\) rad = 180°, 1 rad ≈ 57.3°</td><td>set your calculator mode!</td></tr>
            </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">B</span>The Greek alphabet in this manual</h2>
          <div class="prose"><p>Hover over (or tap) any Greek letter on any page to see this information in place.</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>Letter</th><th>Name</th><th>Say</th><th>Meaning here</th></tr></thead>
            <tbody>${Object.values(Sym.GREEK).filter((g) => !/not used/.test(g.use) && /^[^\x00-\x7f]$/.test(g.ch) && g.name.indexOf('symbol') < 0 && g.ch !== '∫' && g.ch !== '∞' && g.name !== 'capital sigma (sum)' && g.ch !== 'ϵ' && g.ch !== 'ϕ')
              .map((g) => `<tr><td style="font-size:1.2rem">${g.ch}</td><td>${g.name}</td><td>${g.say}</td><td style="white-space:normal">${g.use}</td></tr>`).join('')}</tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">C</span>Constants</h2>
          <div class="scroll-x"><table class="data">
            <thead><tr><th>Quantity</th><th>Symbol</th><th>Value</th><th>Note</th></tr></thead>
            <tbody>
              ${row('Gravitational constant', 'G', '6.674 30 × 10⁻¹¹ m³ kg⁻¹ s⁻²')}
              ${row('Standard gravity', 'g₀', '9.806 65 m/s²', 'defines I<sub>sp</sub>')}
              ${row('Earth gravitational parameter', 'μ⊕', '398 600.4418 km³/s²', 'WGS-84')}
              ${row('Earth equatorial radius', 'R⊕', '6 378.137 km')}
              ${row('Earth sidereal rotation rate', 'ω⊕', '7.292 115 9 × 10⁻⁵ rad/s', '465.1 m/s at equator')}
              ${row('Sidereal day', '', '86 164.1 s', '23 h 56 min 4 s')}
              ${row('Moon gravitational parameter', 'μ☾', '4 902.80 km³/s²')}
              ${row('Moon mean radius', 'R☾', '1 737.4 km')}
              ${row('Moon surface gravity', 'g☾', '1.624 m/s²')}
              ${row('Mean Earth–Moon distance', 'D', '384 400 km')}
              ${row('Moon sidereal period', '', '27.32 d', 'model: ' + (2 * Math.PI / Phys.EM.w / 86400).toFixed(2) + ' d (circular)')}
              ${row('Moon sphere of influence', 'r_SOI', UI.fmt(C.DEM * Math.pow(C.muM / C.muE, 0.4) / 1000, 0) + ' km')}
              ${row('Sun gravitational parameter', 'μ☉', '1.327 124 × 10¹¹ km³/s²')}
              ${row('Astronomical unit', 'AU', '149 597 870.7 km')}
              ${row('Sea-level air density', 'ρ₀', '1.225 kg/m³')}
              ${row('Density scale height (model)', 'H', '7.2 km', 'exponential atmosphere')}
              ${row('Entry interface', '', '121.92 km', '400 000 ft')}
              ${row('BMW canonical units', 'DU, TU', '1 DU = 6 378.145 km, 1 TU = 806.81 s', '1 DU/TU = 7.905 km/s')}
            </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">D</span>Formula sheet</h2>
          <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))">
            <div class="card"><span class="phase">Gravity</span>
              <div class="eq">\\[ F = \\frac{GMm}{r^2},\\quad g = \\frac{\\mu}{r^2} \\]</div>
              <div class="eq">\\[ v_c = \\sqrt{\\frac{\\mu}{r}},\\quad v_{esc} = \\sqrt{\\frac{2\\mu}{r}} \\]</div></div>
            <div class="card"><span class="phase">Two-body constants</span>
              <div class="eq">\\[ \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r} = -\\frac{\\mu}{2a} \\]</div>
              <div class="eq">\\[ h = r v \\cos\\phi = \\sqrt{\\mu p} \\]</div></div>
            <div class="card"><span class="phase">Conic geometry</span>
              <div class="eq">\\[ r = \\frac{p}{1+e\\cos\\nu},\\quad p = a(1-e^2) \\]</div>
              <div class="eq">\\[ r_p = a(1-e),\\ r_a = a(1+e),\\ e = \\frac{r_a-r_p}{r_a+r_p} \\]</div></div>
            <div class="card"><span class="phase">Vis-viva &amp; period</span>
              <div class="eq">\\[ v = \\sqrt{\\mu\\left(\\frac2r-\\frac1a\\right)} \\]</div>
              <div class="eq">\\[ T = 2\\pi\\sqrt{\\frac{a^3}{\\mu}},\\quad n = \\sqrt{\\frac{\\mu}{a^3}} \\]</div></div>
            <div class="card"><span class="phase">Kepler’s equation</span>
              <div class="eq">\\[ M = n(t-t_p) = E - e\\sin E \\]</div>
              <div class="eq">\\[ \\tan\\frac\\nu2 = \\sqrt{\\frac{1+e}{1-e}}\\tan\\frac E2 \\]</div></div>
            <div class="card"><span class="phase">Rockets</span>
              <div class="eq">\\[ F = \\dot m v_e + (p_e - p_a)A_e,\\quad I_{sp} = \\frac{F}{\\dot m g_0} \\]</div>
              <div class="eq">\\[ \\Delta v = I_{sp}g_0\\ln\\frac{m_0}{m_f} \\]</div></div>
            <div class="card"><span class="phase">Manoeuvres</span>
              <div class="eq">\\[ a_t = \\frac{r_1+r_2}{2},\\quad \\mathrm{TOF} = \\pi\\sqrt{\\frac{a_t^3}{\\mu}} \\]</div>
              <div class="eq">\\[ \\Delta v_{plane} = 2v\\sin\\frac{\\Delta i}{2} \\]</div>
              <div class="eq">\\[ \\alpha_{lead} = \\pi - \\omega_{tgt}\\,\\mathrm{TOF} \\]</div></div>
            <div class="card"><span class="phase">Lunar &amp; hyperbolic</span>
              <div class="eq">\\[ r_{SOI} = D\\left(\\frac{m}{M}\\right)^{2/5} \\]</div>
              <div class="eq">\\[ v^2 = v_\\infty^2 + \\frac{2\\mu}{r},\\quad \\varepsilon = \\frac{v_\\infty^2}{2} \\]</div></div>
            <div class="card"><span class="phase">Entry</span>
              <div class="eq">\\[ \\beta = \\frac{m}{C_D A},\\quad a_{max} = \\frac{v_E^2\\sin|\\gamma_E|}{2eH} \\]</div>
              <div class="eq">\\[ \\dot q = 1.74\\times10^{-4}\\sqrt{\\rho/r_n}\\,v^3 \\]</div></div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">E</span>How the simulators work</h2>
          <div class="prose">
            <ul>
              <li><b>Integrator</b>: classical fourth-order Runge–Kutta. Step sizes scale with the local orbital time scale \\(\\sqrt{r^3/\\mu}\\), so steps are short near Earth and Moon and long in cislunar space.</li>
              <li><b>Orbit designer, Hohmann planner</b>: exact two-body solutions with Kepler’s equation solved by Newton iteration.</li>
              <li><b>Ascent</b>: planar, point mass, rotating Earth, exponential atmosphere, pressure-dependent F-1 thrust, centre-engine cutoff, gravity turn for stage 1 and a linear-tangent-like terminal guidance law for the upper stages.</li>
              <li><b>Earth–Moon</b>: planar circular restricted three-body problem in an inertial barycentric frame. Patched conics are used only in the text.</li>
              <li><b>Entry</b>: planar point mass with lift, constant bank angle, exponential atmosphere and Sutton–Graves heating.</li>
            </ul>
            <p>All of these are models. They are close to Apollo’s numbers, typically within 5–15%, but not mission-grade.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">F</span>Sources and further reading</h2>
          <div class="prose">
            <ul>
              <li>J. J. Sellers, <i>Understanding Space: An Introduction to Astronautics</i>, McGraw-Hill.</li>
              <li>R. R. Bate, D. D. Mueller, J. E. White (and J. W. Saylor, 2nd ed.), <i>Fundamentals of Astrodynamics</i>, Dover.</li>
              <li>NASA, <i>Apollo 11 Mission Report</i>, MSC-00171, November 1969.</li>
              <li>Saturn V Flight Evaluation Report, AS-506 (Apollo 11), MPR-SAT-FE-69-9.</li>
              <li>H. J. Allen &amp; A. J. Eggers, <i>A Study of the Motion and Aerodynamic Heating of Ballistic Missiles Entering the Earth’s Atmosphere at High Supersonic Speeds</i>, NACA Report 1381, 1958.</li>
              <li>R. H. Battin, <i>An Introduction to the Mathematics and Methods of Astrodynamics</i>, AIAA, for the Apollo guidance mathematics.</li>
              <li>D. Woods &amp; F. O’Brien, <i>Apollo Flight Journal</i>, history.nasa.gov/afj: annotated transcripts of every mission.</li>
            </ul>
          </div>
        </section>`;
    },
  });
})();
