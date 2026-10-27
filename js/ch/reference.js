/* Reference: constants, formula sheet, sources. */
(function () {
  'use strict';
  const { C } = Phys;
  const row = (a, b, c, d = '') => `<tr><td>${a}</td><td>${b}</td><td>${UI.dec(c)}</td><td>${UI.dec(d)}</td></tr>`;

  // glossary entries, sorted in the reader's language; data-k holds accent-free text for the search box
  const fold = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function glossary() {
    return window.GLOSSARY.map((e) => ({ ...e, t: T(e.term), a: e.aka ? T(e.aka) : '', d: T(e.def) }))
      .sort((x, y) => x.t.localeCompare(y.t, I18N.lang, { sensitivity: 'base' }))
      .map((e) => {
        const ch = App.chapters[e.module], code = Progress.MODULES[e.module] ? Progress.code(e.module) + ' · ' : '';
        return `<div class="gl-entry" data-k=" ${fold(`${e.t} ${e.a} ${e.d}`).replace(/[^\p{L}\p{N}]+/gu, ' ')}"><dt>${e.t}${e.a ? ` <span class="gl-aka">${e.a}</span>` : ''}</dt>
          <dd>${e.d}${ch ? ` <a class="gl-mod" href="#${e.module}">→ ${code}${T(ch.title)}</a>` : ''}</dd></div>`;
      }).join('');
  }
  App.css('glossary', `
    .gl-search { max-width: 24rem; margin: .5rem 0 1rem; }
    .glossary { margin: 0; display: grid; gap: .1rem; }
    .gl-entry { padding: .55rem 0; border-top: 1px solid var(--line); }
    .gl-entry dt { font-weight: 600; }
    .gl-entry dd { margin: .2rem 0 0; color: var(--ink); }
    .gl-aka { font: 400 .75rem/1.3 var(--f-mono); color: var(--muted); margin-left: .4rem; }
    .gl-mod { font: 500 .75rem var(--f-mono); white-space: nowrap; }
  `);

  App.chapter({
    id: 'reference', phase: N`Flight data file`, title: N`Reference`,
    blurb: N`Constants, the formula sheet and sources.`,
    render(page) {
      page.innerHTML = `
        ${App.header({ eyebrow: T`Flight data file`, title: T`Reference`, lede: T`Every constant used by the simulators and exercises, and the equations you will reach for most often.` })}

        <section class="section">
          <h2><span class="idx">A</span>${T`Reading the notation`}</h2>
          <div class="prose"><p>${T`You don’t need to do calculus to follow this manual, but you will meet its notation. Here is what each piece means, in plain words.`}</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>${T`Notation`}</th><th>${T`Read it as`}</th><th>${T`Example`}</th></tr></thead>
            <tbody>
              <tr><td>\\(\\vec v\\)</td><td>${T`a vector: a quantity with a direction (an arrow). Without the arrow, \\(v\\) is just its length`}</td><td>${T`\\(\\vec v\\) velocity, \\(v\\) speed`}</td></tr>
              <tr><td>\\(\\Delta x\\)</td><td>${T`“change in \\(x\\)”: final value minus initial value`}</td><td>\\(\\Delta v\\) = 3 160 m/s</td></tr>
              <tr><td>\\(\\dot x\\)</td><td>${T`“how fast \\(x\\) changes, per second”. Same as \\(dx/dt\\)`}</td><td>${T`\\(\\dot m\\) = kg of propellant burned per second`}</td></tr>
              <tr><td>\\(\\ddot x\\)</td><td>${T`how fast the rate of change changes: two dots on a position give an acceleration`}</td><td>${T`\\(\\ddot{\\vec r}\\) = acceleration`}</td></tr>
              <tr><td>\\(\\frac{dx}{dt}\\)</td><td>${T`derivative: the slope of \\(x\\) plotted against time. For small steps, \\(\\approx \\Delta x/\\Delta t\\)`}</td><td>${T`\\(dv/dt\\) = acceleration`}</td></tr>
              <tr><td>\\(\\int x\\,dt\\)</td><td>${T`integral: add up \\(x \\times\\) (tiny time step) over the whole period. It is the area under the curve of \\(x\\)`}</td><td>${T`\\(\\int g\\sin\\gamma\\,dt\\) = gravity loss`}</td></tr>
              <tr><td>\\(\\sum_k x_k\\)</td><td>${T`sum: \\(x_1 + x_2 + x_3 + \\ldots\\)`}</td><td>${T`Δv of all stages`}</td></tr>
              <tr><td>\\(\\ln x\\)</td><td>${T`natural logarithm (the “ln” key). Undoes \\(e^x\\): \\(\\ln e^x = x\\)`}</td><td>${T`\\(\\ln 3 \\approx 1.10\\)`}</td></tr>
              <tr><td>\\(e^{x}\\)</td><td>${T`exponential, with \\(e \\approx 2.718\\). Not the eccentricity, despite the same letter`}</td><td>${T`\\(e^{-h/H}\\): air thins with height`}</td></tr>
              <tr><td>\\(\\vec a \\times \\vec b\\)</td><td>${T`cross product: a vector perpendicular to both`}</td><td>\\(\\vec h = \\vec r\\times\\vec v\\)</td></tr>
              <tr><td>\\(|x|\\)</td><td>${T`absolute value: drop the minus sign`}</td><td>${T`\\(|{-6.5^\\circ}| = 6.5^\\circ\\)`}</td></tr>
              <tr><td>\\(x_p,\\ x_0,\\ x_{\\oplus}\\)</td><td>${T`subscripts are labels, not maths: which \\(x\\) we mean`}</td><td>${T`\\(r_p\\) periapsis radius, \\(m_0\\) initial mass`}</td></tr>
              <tr><td>rad</td><td>${T`radians: \\(\\pi\\) rad = 180°, 1 rad ≈ 57.3°`}</td><td>${T`set your calculator mode!`}</td></tr>
            </tbody></table></div>
          <div class="prose"><p>${T`<b>Letters with more than one meaning.</b> Physics runs out of letters, and the books this course follows reuse them. The legend under each equation always says which meaning applies. The Latin letters that change meaning between modules:`}</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>${T`Letter`}</th><th>${T`Meanings`}</th></tr></thead>
            <tbody>
              <tr><td>\\(h\\)</td><td>${T`altitude above the surface; in module ${Progress.code('orbits')} and the formula sheet, the specific angular momentum (module ${Progress.code('navigation')} writes it \\(H\\) to keep \\(h\\) for altitude)`}</td></tr>
              <tr><td>\\(H\\)</td><td>${T`scale height of an atmosphere; specific angular momentum in module ${Progress.code('navigation')}`}</td></tr>
              <tr><td>\\(p\\)</td><td>${T`semi-latus rectum of an orbit; air pressure`}</td></tr>
              <tr><td>\\(a\\)</td><td>${T`semi-major axis; an acceleration; the intercept of a fitted line`}</td></tr>
              <tr><td>\\(M\\)</td><td>${T`mass of the central body; mean anomaly; molar mass of a gas`}</td></tr>
              <tr><td>\\(D\\)</td><td>${T`Earth–Moon distance; drag force`}</td></tr>
              <tr><td>\\(n\\)</td><td>${T`mean motion of an orbit; a number of data points`}</td></tr>
            </tbody></table></div>
        </section>

        <section class="section" id="glossary">
          <h2><span class="idx">B</span>${T`Glossary`}</h2>
          <div class="prose"><p>${T`Every technical term and acronym of the course, in plain words. Each entry links to the module that explains it.`}</p></div>
          <div class="ctl gl-search"><label for="gl-q"><span>${T`Search the glossary`}</span></label><input type="search" id="gl-q" autocomplete="off" placeholder="${T`apoapsis, TLI, Isp…`}"></div>
          <dl class="glossary" id="gl-list">${glossary()}</dl>
          <p class="note" id="gl-none" hidden>${T`No term matches.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">C</span>${T`The Greek alphabet in this manual`}</h2>
          <div class="prose"><p>${T`Hover over (or tap) any Greek letter on any page to see this information in place.`}</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>${T`Letter`}</th><th>${T`Name`}</th><th>${T`Say`}</th><th>${T`Meaning here`}</th></tr></thead>
            <tbody>${Object.values(Sym.GREEK).filter((g) => !/not used/.test(g.use) && /^[^\x00-\x7f]$/.test(g.ch) && g.name.indexOf('symbol') < 0 && g.ch !== '∫' && g.ch !== '∞' && g.name !== 'capital sigma (sum)' && g.ch !== 'ϵ' && g.ch !== 'ϕ')
              .map((g) => `<tr><td style="font-size:1.2rem">${g.ch}</td><td>${T(g.name)}</td><td>${g.say ? T(g.say) : ''}</td><td style="white-space:normal">${T(g.use)}</td></tr>`).join('')}</tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">D</span>${T`Constants`}</h2>
          <div class="scroll-x"><table class="data">
            <thead><tr><th>${T`Quantity`}</th><th>${T`Symbol`}</th><th>${T`Value`}</th><th>${T`Note`}</th></tr></thead>
            <tbody>
              ${row(T`Gravitational constant`, 'G', '6.674 30 × 10⁻¹¹ m³ kg⁻¹ s⁻²')}
              ${row(T`Standard gravity`, 'g₀', '9.806 65 m/s²', T`defines I<sub>sp</sub>`)}
              ${row(T`Earth gravitational parameter`, 'μ⊕', '398 600.4418 km³/s²', 'WGS-84')}
              ${row(T`Earth equatorial radius`, 'R⊕', '6 378.137 km')}
              ${row(T`Earth sidereal rotation rate (relative to the stars)`, 'ω⊕', '7.292 115 9 × 10⁻⁵ rad/s', T`465.1 m/s at equator`)}
              ${row(T`Sidereal day`, '', '86 164.1 s', '23 h 56 min 4 s')}
              ${row(T`Moon gravitational parameter`, 'μ☾', '4 902.80 km³/s²')}
              ${row(T`Moon mean radius`, 'R☾', '1 737.4 km')}
              ${row(T`Moon surface gravity`, 'g☾', '1.624 m/s²')}
              ${row(T`Mean Earth–Moon distance`, 'D', '384 400 km')}
              ${row(T`Moon sidereal period (relative to the stars)`, '', '27.32 d', T`model: ${(2 * Math.PI / Phys.EM.w / 86400).toFixed(2)} d (circular)`)}
              ${row(T`Moon sphere of influence`, 'r_SOI', UI.fmt(C.DEM * Math.pow(C.muM / C.muE, 0.4) / 1000, 0) + ' km')}
              ${row(T`Sun gravitational parameter`, 'μ☉', '1.327 124 × 10¹¹ km³/s²')}
              ${row(T`Astronomical unit`, 'AU', '149 597 870.7 km')}
              ${row(T`Sea-level air density`, 'ρ₀', '1.225 kg/m³')}
              ${row(T`Density scale height (model)`, 'H', '7.2 km', T`exponential atmosphere`)}
              ${row(T`Pressure scale height (engine model)`, 'H_p', '7.5 km', T`fit to the lowest 30 km`)}
              ${row(T`Entry interface`, '', '121.92 km', '400 000 ft')}
              ${row(T`BMW canonical units`, 'DU, TU', '1 DU = 6 378.145 km, 1 TU = 806.81 s', '1 DU/TU = 7.905 km/s')}
            </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">E</span>${T`Formula sheet`}</h2>
          <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))">
            <div class="card"><span class="phase">${T`Gravity`}</span>
              <div class="eq">\\[ F = \\frac{GMm}{r^2},\\quad g = \\frac{\\mu}{r^2} \\]</div>
              <div class="eq">\\[ v_c = \\sqrt{\\frac{\\mu}{r}},\\quad v_{esc} = \\sqrt{\\frac{2\\mu}{r}} \\]</div></div>
            <div class="card"><span class="phase">${T`Two-body constants`}</span>
              <div class="eq">\\[ \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r} = -\\frac{\\mu}{2a} \\]</div>
              <div class="eq">\\[ h = r v \\cos\\gamma = \\sqrt{\\mu p} \\]</div></div>
            <div class="card"><span class="phase">${T`Conic geometry`}</span>
              <div class="eq">\\[ r = \\frac{p}{1+e\\cos\\nu},\\quad p = a(1-e^2) \\]</div>
              <div class="eq">\\[ r_p = a(1-e),\\ r_a = a(1+e),\\ e = \\frac{r_a-r_p}{r_a+r_p} \\]</div></div>
            <div class="card"><span class="phase">${T`Vis-viva &amp; period`}</span>
              <div class="eq">\\[ v = \\sqrt{\\mu\\left(\\frac2r-\\frac1a\\right)} \\]</div>
              <div class="eq">\\[ T = 2\\pi\\sqrt{\\frac{a^3}{\\mu}},\\quad n = \\sqrt{\\frac{\\mu}{a^3}} \\]</div></div>
            <div class="card"><span class="phase">${T`Kepler’s equation`}</span>
              <div class="eq">\\[ M = n(t-t_p) = E - e\\sin E \\]</div>
              <div class="eq">\\[ \\tan\\frac\\nu2 = \\sqrt{\\frac{1+e}{1-e}}\\tan\\frac E2 \\]</div></div>
            <div class="card"><span class="phase">${T`Rockets`}</span>
              <div class="eq">\\[ F = \\dot m v_e + (p_e - p_a)A_e,\\quad I_{sp} = \\frac{F}{\\dot m g_0} \\]</div>
              <div class="eq">\\[ \\Delta v = I_{sp}g_0\\ln\\frac{m_0}{m_f} \\]</div></div>
            <div class="card"><span class="phase">${T`Manoeuvres`}</span>
              <div class="eq">\\[ a_t = \\frac{r_1+r_2}{2},\\quad \\mathrm{TOF} = \\pi\\sqrt{\\frac{a_t^3}{\\mu}} \\]</div>
              <div class="eq">\\[ \\Delta v_{plane} = 2v\\sin\\frac{\\Delta i}{2} \\]</div>
              <div class="eq">\\[ \\alpha_{lead} = \\pi - \\omega_{tgt}\\,\\mathrm{TOF} \\]</div></div>
            <div class="card"><span class="phase">${T`Lunar &amp; hyperbolic`}</span>
              <div class="eq">\\[ r_{SOI} = D\\left(\\frac{m}{M}\\right)^{2/5} \\]</div>
              <div class="eq">\\[ v^2 = v_\\infty^2 + \\frac{2\\mu}{r},\\quad \\varepsilon = \\frac{v_\\infty^2}{2} \\]</div></div>
            <div class="card"><span class="phase">${T`Entry`}</span>
              <div class="eq">\\[ \\beta = \\frac{m}{C_D A},\\quad a_{max} = \\frac{v_E^2\\sin|\\gamma_E|}{2eH} \\]</div>
              <div class="eq">\\[ \\dot q = 1.74\\times10^{-4}\\sqrt{\\rho/r_n}\\,v^3 \\]</div></div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">F</span>${T`How the simulators work`}</h2>
          <div class="prose">
            <ul>
              <li>${T`<b>Integrator</b>: classical fourth-order Runge–Kutta, a standard method that advances the motion in small time steps. Step sizes scale with the local orbital time scale \\(\\sqrt{r^3/\\mu}\\), so steps are short near Earth and Moon and long in cislunar space, between the Earth and the Moon.`}</li>
              <li>${T`<b>Orbit designer, Hohmann planner</b>: exact two-body solutions with Kepler’s equation solved by Newton iteration.`}</li>
              <li>${T`<b>Ascent</b>: planar, point mass, rotating Earth, exponential atmosphere, pressure-dependent F-1 thrust, centre-engine cutoff, gravity turn for stage 1 and a linear-tangent-like terminal guidance law for the upper stages.`}</li>
              <li>${T`<b>Earth–Moon</b>: planar circular restricted three-body problem in an inertial barycentric frame. Patched conics are used only in the text.`}</li>
              <li>${T`<b>Entry</b>: planar point mass with lift, constant bank angle, exponential atmosphere and Sutton–Graves heating.`}</li>
            </ul>
            <p>${T`All of these are models. They are close to Apollo’s numbers, typically within 5–15%, but not mission-grade.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">G</span>${T`Sources and further reading`}</h2>
          <div class="prose">
            <ul>
              <li>J. J. Sellers, <i>Understanding Space: An Introduction to Astronautics</i>, McGraw-Hill.</li>
              <li>${T`R. R. Bate, D. D. Mueller, J. E. White (and J. W. Saylor, 2nd ed.), <i>Fundamentals of Astrodynamics</i>, Dover.`}</li>
              <li>${T`NASA, <i>Apollo 11 Mission Report</i>, MSC-00171, November 1969.`}</li>
              <li>Saturn V Flight Evaluation Report, AS-506 (Apollo 11), MPR-SAT-FE-69-9.</li>
              <li>${T`H. J. Allen &amp; A. J. Eggers, <i>A Study of the Motion and Aerodynamic Heating of Ballistic Missiles Entering the Earth’s Atmosphere at High Supersonic Speeds</i>, NACA Report 1381, 1958.`}</li>
              <li>${T`R. H. Battin, <i>An Introduction to the Mathematics and Methods of Astrodynamics</i>, AIAA, for the Apollo guidance mathematics.`}</li>
              <li>${T`D. Woods &amp; F. O’Brien, <i>Apollo Flight Journal</i>, history.nasa.gov/afj: annotated transcripts of every mission.`}</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">H</span>${T`Photographs`}</h2>
          <div class="prose"><p>${T`The archive photographs in this manual are NASA images from the NASA Image and Video Library (images.nasa.gov). Works created by NASA are generally not subject to copyright in the United States; NASA asks to be credited as the source. NASA’s use does not imply its endorsement of this manual. Each photograph links to its original record.`}</p></div>
          ${Archive.credits()}
        </section>`;
      const q = page.querySelector('#gl-q'), items = [...page.querySelectorAll('.gl-entry')], none = page.querySelector('#gl-none');
      q.addEventListener('input', () => {
        // match from the start of a word: "TLI" finds TLI, not "Ableitung"
        const k = fold(q.value.trim()).replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); let n = 0;
        items.forEach((it) => { const show = !k || it.dataset.k.includes(' ' + k); it.hidden = !show; n += show; });
        none.hidden = n > 0;
      });
    },
  });
})();
