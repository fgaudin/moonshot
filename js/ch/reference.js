/* Reference: notation, Greek letters, constants, formula sheet, sources. Glossary: its own page, after Reference. */
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
  // links from a film to the modules it illustrates
  const mv = (...ids) => ids.filter((id) => App.chapters[id]).map((id) => `<a class="gl-mod" href="#${id}">→ ${Progress.code(id)} ${T(App.chapters[id].title)}</a>`).join(' ');
  App.css('glossary', `
    .movies li { margin-bottom: .7rem; } .movies .chips { display: inline-flex; flex-wrap: wrap; gap: .2rem .7rem; }
    .ref-toc ol { list-style: none; margin: 0; padding: 0; columns: 2 14rem; column-gap: 2rem; }
    .ref-toc li { break-inside: avoid; padding: .2rem 0; }
    .ref-toc a { display: flex; gap: .7rem; align-items: baseline; text-decoration: none; }
    .ref-toc a:hover { text-decoration: underline; }
    .ref-toc .idx { font: 500 .8rem/1 var(--f-mono); color: var(--accent); min-width: 1ch; }
    .section > h2 { scroll-margin-top: 1rem; }
    .ref-top { margin-left: auto; font: 500 .72rem var(--f-mono); color: var(--muted); text-decoration: none; white-space: nowrap; }
    .ref-top:hover { color: var(--accent); }
    .refs h3 { margin: 1.4rem 0 .5rem; font-size: 1rem; } .refs h3:first-child { margin-top: .5rem; }
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
        <p class="note">${T`Looking for a term or an acronym? See the <a href="#glossary">Glossary</a>.`}</p>

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

        <section class="section">
          <h2><span class="idx">B</span>${T`The Greek alphabet in this manual`}</h2>
          <div class="prose"><p>${T`Hover over (or tap) any Greek letter on any page to see this information in place.`}</p></div>
          <div class="scroll-x" style="max-width:56rem"><table class="data notation">
            <thead><tr><th>${T`Letter`}</th><th>${T`Name`}</th><th>${T`Say`}</th><th>${T`Meaning here`}</th></tr></thead>
            <tbody>${Object.values(Sym.GREEK).filter((g) => !/not used/.test(g.use) && /^[^\x00-\x7f]$/.test(g.ch) && g.name.indexOf('symbol') < 0 && g.ch !== '∫' && g.ch !== '∞' && g.name !== 'capital sigma (sum)' && g.ch !== 'ϵ' && g.ch !== 'ϕ')
              .map((g) => `<tr><td style="font-size:1.2rem">${g.ch}</td><td>${T(g.name)}</td><td>${g.say ? T(g.say) : ''}</td><td style="white-space:normal">${T(g.use)}</td></tr>`).join('')}</tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">C</span>${T`Constants`}</h2>
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
              ${row(T`Canonical units`, 'DU, TU', '1 DU = 6 378.145 km, 1 TU = 806.81 s', '1 DU/TU = 7.905 km/s')}
            </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">D</span>${T`Formula sheet`}</h2>
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
          <h2><span class="idx">E</span>${T`How the simulators work`}</h2>
          <div class="prose">
            <ul>
              <li>${T`<b>Integrator</b>: classical fourth-order Runge–Kutta, a standard method that advances the motion in small time steps. Step sizes scale with the local orbital time scale \\(\\sqrt{r^3/\\mu}\\), so steps are short near Earth and Moon and long in cislunar space, between the Earth and the Moon.`}</li>
              <li>${T`<b>Orbit designer, Hohmann planner</b>: exact two-body solutions with Kepler’s equation solved by Newton iteration.`}</li>
              <li>${T`<b>Ascent</b>: planar, point mass, rotating Earth, exponential atmosphere, pressure-dependent F-1 thrust, centre-engine cutoff, gravity turn for stage 1 and a linear-tangent-like terminal guidance law for the upper stages.`}</li>
              <li>${T`<b>Earth–Moon</b>: two models. Patched conics: an Earth-centred two-body orbit, switched to a Moon-centred one inside the Moon’s sphere of influence and back again on leaving it. Three-body: the planar circular restricted three-body problem in an inertial barycentric frame.`}</li>
              <li>${T`<b>Entry</b>: planar point mass with lift, constant bank angle, exponential atmosphere and Sutton–Graves heating.`}</li>
            </ul>
            <p>${T`All of these are models. They are close to Apollo’s numbers, typically within 5–15%, but not mission-grade.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">F</span>${T`Sources and further reading`}</h2>
          <div class="prose refs">
            <h3>${T`Sources for the course`}</h3>
            <ul>
              <li>J. J. Sellers, <i>Understanding Space: An Introduction to Astronautics</i>, McGraw-Hill.</li>
              <li>${T`R. R. Bate, D. D. Mueller, J. E. White (and J. W. Saylor, 2nd ed.), <i>Fundamentals of Astrodynamics</i>, Dover.`}</li>
              <li>${T`R. H. Battin, <i>An Introduction to the Mathematics and Methods of Astrodynamics</i>, AIAA, for the Apollo guidance mathematics.`}</li>
              <li>I. Asimov, <i>Understanding Physics</i>, Walker, 1966.</li>
              <li>${T`H. J. Allen &amp; A. J. Eggers, <i>A Study of the Motion and Aerodynamic Heating of Ballistic Missiles Entering the Earth’s Atmosphere at High Supersonic Speeds</i>, NACA Report 1381, 1958.`}</li>
              <li>W. D. Woods, <i>How Apollo Flew to the Moon</i>, Springer-Praxis, 2008.</li>
              <li>F. O’Brien, <i>The Apollo Guidance Computer: Architecture and Operation</i>, Springer-Praxis, 2010.</li>
              <li>D. Baker, <i>NASA Mercury</i>, Haynes Owners’ Workshop Manual.</li>
              <li>D. Woods &amp; D. M. Harland, <i>NASA Gemini</i>, Haynes Owners’ Workshop Manual.</li>
              <li>D. Woods, <i>NASA Saturn V</i>, Haynes Owners’ Workshop Manual.</li>
              <li>C. Riley &amp; P. Dolling, <i>NASA Apollo 11</i>, Haynes Owners’ Workshop Manual.</li>
              <li>${T`NASA Manned Spacecraft Center, <i>Apollo 11 Flight Plan</i>, AS-506/CSM-107/LM-5, final version, 1 July 1969.`} <a href="https://apollojournals.org/alsj/a11/a11-fltplan.html" target="_blank" rel="noopener">apollojournals.org</a></li>
              <li>${T`NASA, <i>Apollo 11 Mission Report</i>, MSC-00171, November 1969.`}</li>
              <li>Saturn V Flight Evaluation Report, AS-506 (Apollo 11), MPR-SAT-FE-69-9.</li>
              <li>${T`D. Woods &amp; F. O’Brien, <i>Apollo Flight Journal</i>, history.nasa.gov/afj: annotated transcripts of every mission.`}</li>
            </ul>
            <h3>${T`Further reading`}</h3>
            <ul>
              <li>L. S. Swenson, J. M. Grimwood, C. C. Alexander, <i>This New Ocean: A History of Project Mercury</i>, NASA SP-4201, 1966.</li>
              <li>J. D. Clark, <i>Ignition! An Informal History of Liquid Rocket Propellants</i>, Rutgers University Press, 1972.</li>
              <li>M. Collins, <i>Carrying the Fire</i>, Farrar, Straus and Giroux, 1974.</li>
              <li>A. Chaikin, <i>A Man on the Moon</i>, Viking, 1994.</li>
              <li>J. Lovell &amp; J. Kluger, <i>Apollo 13</i> (first published as <i>Lost Moon</i>), Houghton Mifflin, 1994.</li>
              <li>G. Kranz, <i>Failure Is Not an Option</i>, Simon &amp; Schuster, 2000.</li>
              <li>N. Conrad &amp; H. A. Klausner, <i>Rocketman: Astronaut Pete Conrad’s Incredible Ride to the Moon and Beyond</i>, NAL, 2005.</li>
              <li>C. Hadfield, <i>An Astronaut’s Guide to Life on Earth</i>, Little, Brown, 2013.</li>
              <li>J. Kluger, <i>Apollo 8: The Thrilling Story of the First Mission to the Moon</i>, Henry Holt, 2017.</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">G</span>${T`Photographs`}</h2>
          <div class="prose"><p>${T`The archive photographs in this manual are NASA images from the NASA Image and Video Library (images.nasa.gov). Works created by NASA are generally not subject to copyright in the United States; NASA asks to be credited as the source. NASA’s use does not imply its endorsement of this manual. Each photograph links to its original record.`}</p></div>
          ${Archive.credits()}
        </section>

        <section class="section">
          <h2><span class="idx">H</span>${T`At the movies`}</h2>
          <div class="prose">
            <p>${T`Six films to watch once you know what is on the screen. Each one shows something this manual teaches.`}</p>
            <ul class="movies">
              <li>${T`<b>The Right Stuff</b> (1983, Philip Kaufman). From Chuck Yeager’s rocket plane to the Mercury Seven. John Glenn’s orbital flight in Friendship 7 comes home with a warning that the heat shield may be loose, so the retrorocket pack is left strapped on through entry.`} <span class="chips">${mv('rockets', 'orbits', 'entry')}</span></li>
              <li>${T`<b>Hidden Figures</b> (2016, Theodore Melfi). Katherine Johnson, Dorothy Vaughan and Mary Jackson at NASA Langley. Johnson computed trajectories by hand: where a capsule comes down, and when to fire to get there. John Glenn asked for her to check the IBM computer’s numbers before his 1962 orbital flight. She later worked on trajectories for Apollo 11, and her backup procedures and charts helped bring Apollo 13 home.`} <span class="chips">${mv('orbits', 'entry', 'freereturn')}</span></li>
              <li>${T`<b>Apollo 13</b> (1995, Ron Howard). The free return, the burn of the lunar module’s descent engine to get back onto it, the manual burn steered by keeping the Earth in the window, and an entry corridor that must not be missed.`} <span class="chips">${mv('freereturn', 'burns', 'entry')}</span></li>
              <li>${T`<b>Apollo 11</b> (2019, Todd Douglas Miller). A documentary made only from the 1969 footage and recordings, much of it 70 mm film never shown before. Launch, trans-lunar injection, the landing with its program alarms, and the return.`} <span class="chips">${mv('ascent', 'moon', 'landing')}</span></li>
              <li>${T`<b>First Man</b> (2018, Damien Chazelle). Neil Armstrong from the X-15 to the Moon: the Gemini 8 docking and the spin that followed, the training vehicle crash, and the final minutes of the landing.`} <span class="chips">${mv('docking', 'landing')}</span></li>
              <li>${T`<b>The Martian</b> (2015, Ridley Scott). Fiction, but careful with orbits. The rescue uses a flyby of the Earth to turn the ship back toward Mars, a gravity assist, and ends with a rendezvous where the relative velocity is what matters.`} <span class="chips">${mv('freereturn', 'docking')}</span></li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">I</span>${T`At the table`}</h2>
          <div class="prose">
            <p>${T`Two board games that run on the same rules as this manual: every move costs velocity change, and the rocket has to carry its own fuel.`}</p>
            <ul class="movies">
              <li>${T`<b>Leaving Earth</b> (2015, Joseph Fatula). The space race from 1956 to 1976. Each manoeuvre has a difficulty, its velocity change, and you build rockets stage by stage until their thrust can push the mass across it. Untested hardware fails, so you test it first, as the real programmes did.`} <span class="chips">${mv('rockets', 'maneuvers', 'moon')}</span></li>
              <li>${T`<b>High Frontier 4 All</b> (2020, Phil Eklund). The solar system drawn as a map of burns: each step costs fuel, and gravity wells cost the most. Engines trade thrust against efficiency, and water mined out there is fuel you no longer have to lift.`} <span class="chips">${mv('rockets', 'burns', 'timing')}</span></li>
            </ul>
          </div>
        </section>`;
      // table of contents from the section headings; the URL hash is the router, so scroll instead of linking to #anchors
      const heads = [...page.querySelectorAll('.section > h2')];
      const toc = document.createElement('nav');
      toc.className = 'ref-toc'; toc.setAttribute('aria-label', T`Contents`);
      toc.innerHTML = `<ol>${heads.map((h, i) => `<li><a href="#reference" data-i="${i}"><span class="idx">${h.querySelector('.idx').textContent}</span>${[...h.childNodes].filter((n) => !n.classList?.contains('idx')).map((n) => n.textContent).join('').trim()}</a></li>`).join('')}</ol>`;
      toc.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-i]'); if (!a) return;
        e.preventDefault(); heads[+a.dataset.i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      page.querySelector('.note').after(toc);
      // a "back to top" link at the right of every section heading, added after the contents read the headings
      heads.forEach((h) => h.insertAdjacentHTML('beforeend', `<a class="ref-top" href="#reference">↑ ${T`Back to top`}</a>`));
      page.addEventListener('click', (e) => {
        if (!e.target.closest('.ref-top')) return;
        e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    },
  });

  App.chapter({
    id: 'glossary', phase: N`Flight data file`, title: N`Glossary`,
    blurb: N`Every technical term and acronym of the course, in plain words.`,
    render(page) {
      page.innerHTML = `
        ${App.header({ eyebrow: T`Flight data file`, title: T`Glossary`, lede: T`Every technical term and acronym of the course, in plain words. Each entry links to the module that explains it.` })}
        <section class="section">
          <div class="ctl gl-search"><label for="gl-q"><span>${T`Search the glossary`}</span></label><input type="search" id="gl-q" autocomplete="off" placeholder="${T`apoapsis, TLI, Isp…`}"></div>
          <dl class="glossary" id="gl-list">${glossary()}</dl>
          <p class="note" id="gl-none" hidden>${T`No term matches.`}</p>
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
