# Moonshot — a flight manual for astrodynamics

An interactive course on how Apollo went to the Moon: theory, live simulators and randomized exercises.
It follows Sellers, *Understanding Space*, and Bate, Mueller & White, *Fundamentals of Astrodynamics*. SI units throughout.

## Run it

No build step. Either open `index.html` in a browser, or serve it:

```sh
docker compose up -d      # http://localhost:8642
```

An internet connection is needed only for MathJax and the web fonts (both from CDNs).

## How it is organised

You play an astronaut candidate. Each chapter is a **training module** (TM-1 … TM-18) with a briefing,
objectives that the simulators detect automatically, and a mission patch when all objectives are met.
Earn all eighteen patches for the "go for launch" certificate on the home page. Folded **math refreshers**
(vectors, trigonometry, powers, derivatives, integrals, logarithms, ellipses, relative velocity, iteration,
interpolation, angles that wrap around, constant acceleration) appear where each
notion first matters; all of them are on the Math Toolkit page. Greek letters show their name on hover,
and every equation has a "where:" legend of its variables and units. History capsules with NASA archive
photographs (public domain, credited and linked to images.nasa.gov) tie each module to the real missions.

## Modules and labs

| Phase | Chapter | Lab |
|---|---|---|
| Pre-launch | The Mission | Apollo 11 Δv staircase; live free-return animation |
| Foundations | Newton & Gravity | Newton's cannon (circular / escape speed) |
| Coast | Describing Orbits | Orbit designer: burnout state → conic, Kepler's equation, equal-area sectors |
| Navigation | Where Are We? | Telemetry desk: orbit from altitude, speed and vertical speed; Solo / Apollo / MC-only modes |
| Ignition | Rocket Science | F-1 thrust vs altitude · rocket-equation curves · Saturn V staging builder |
| Sounding | Measuring an Atmosphere | Sounding range: noisy pressure telemetry, least-squares fit of the scale height |
| Ascent | Getting to Orbit | Saturn V ascent: gravity turn, guidance, Δv loss ledger, Max Q |
| Launch vehicle | Your Own Launcher | Pitch program designer: own stages, Isp vs pressure, hand-written pitch table |
| Manoeuvres | Orbital Manoeuvres | Hohmann / plane change / bi-elliptic / rendezvous lead angle (Earth or Moon) |
| Mission Control | Planning a Burn | Maneuver computer: Δv in the prograde/radial frame, burn time, finite burns, PADs |
| Timing | When to Burn | Phasing clock: phase angle, wait time, TIG on the mission clock |
| 3D orbits | Plane Changes | Rotatable 3D globe: plane changes as PAD components, combined burns, launch azimuth |
| Docking | Docking | Docking simulator in the target's orbital frame (Clohessy–Wiltshire), COAS sight, three scenarios |
| TLI → LOI | Going to the Moon | Earth–Moon three-body simulator vs patched conics, free return, MCC solver, LOI |
| Descent planning | Planning a Powered Descent | Descent planner: DOI, ignition point, braking throttle, hover margin |
| Descent | Landing on the Moon | Lunar lander with real LM numbers and P66 mode |
| Trans-Earth | Planning the Return | Trans-Earth planner: TEI Δv and position, entry corridor, midcourse correction |
| Entry | Coming Home | Entry corridor explorer with a live corridor map |
| Capstone | Mission Control | Mission planning desk: Δv budget with margins and RSS dispersions, printable PADs, readback drill, aborts |
| Ground school | Math Toolkit | Twelve refreshers with interactive widgets |
| Simulator room | Practice | 94 problem generators with worked solutions, 48 concept questions |

## Languages

English, French and German. The switch is in the side rail; the first visit follows the browser's language.
English lives in the code: visible strings are wrapped in `` T`…` `` (or marked `` N`…` `` when defined as data and
translated where displayed). Translations are in `js/i18n/<lang>/<source file>.js`, keyed by the English text.
French and German use decimal commas, also inside equations.

To add or change text: edit the English in the code, then run the checker and add the missing entries:

```sh
cd tools && npm install          # once: installs acorn for the checker
node tools/i18n-check.js check fr    # lists missing / unused keys per source file
node tools/i18n-check.js check de
```

Conventions, style and the glossary are in `tools/I18N.md`.

## Layout

```
index.html          shell, loads MathJax + scripts
css/style.css       design tokens (light/dark) and layout
js/physics.js       pure physics (no DOM): two-body, RK4, ascent, CR3BP, entry. Runs in Node too.
js/ui.js            canvas, charts, controls, storage helpers
js/app.js           hash router and chapter registry
js/ch/*.js          one file per chapter (text + labs); newer modules keep their physics in js/ch/<id>.phys.js
js/practice.js      exercise generators and the Practice page
js/progress.js      training modules: briefings, objectives, patches, debriefs, toasts
js/primers.js       math refreshers, their widgets and the Math Toolkit page
js/symbols.js       Greek-letter tooltips and the variable legends under equations
js/history.js       history capsules: NASA photo, story and credit per module
img/history/        the NASA photographs (WebP, 1280 px)
js/i18n.js          T/N translation helpers, language loading
js/i18n/fr|de/      French and German dictionaries, one per source file
tools/              dev-only: i18n checker, translation guide (I18N.md), module-author guide (MODULE-GUIDE.md)
tmp/                scratch: Node test scripts, screenshots (safe to delete)
```

Physics can be tested headless, e.g. `node tmp/t6.js` (free-return search) or `node tmp/t_practice.js`.
Append `?focus=<lab id>` to a URL to jump straight to a lab (e.g. `?focus=tl#moon`).
