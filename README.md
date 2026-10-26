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

You play an astronaut candidate. Each chapter is a **training module** (TM-1 … TM-8) with a briefing,
objectives that the simulators detect automatically, and a mission patch when all objectives are met.
Earn all eight patches for the "go for launch" certificate on the home page. Folded **math refreshers**
(vectors, trigonometry, powers, derivatives, integrals, logarithms, ellipses, iteration) appear where each
notion first matters; all of them are on the Math Toolkit page. Greek letters show their name on hover,
and every equation has a "where:" legend of its variables and units.

## Modules and labs

| Phase | Chapter | Lab |
|---|---|---|
| Pre-launch | The Mission | Apollo 11 Δv staircase; live free-return animation |
| Foundations | Newton & Gravity | Newton's cannon (circular / escape speed) |
| Coast | Describing Orbits | Orbit designer: burnout state → conic, Kepler's equation, equal-area sectors |
| Ignition | Rocket Science | F-1 thrust vs altitude · rocket-equation curves · Saturn V staging builder |
| Ascent | Getting to Orbit | Saturn V ascent: gravity turn, guidance, Δv loss ledger, Max Q |
| Manoeuvres | Orbital Manoeuvres | Hohmann / plane change / bi-elliptic / rendezvous lead angle (Earth or Moon) |
| TLI → LOI | Going to the Moon | Earth–Moon restricted three-body simulator, free return, MCC solver, LOI |
| Descent | Landing on the Moon | Lunar lander with real LM numbers and P66 mode |
| Entry | Coming Home | Entry corridor explorer with a live corridor map |
| Ground school | Math Toolkit | Eight refreshers with interactive widgets |
| Simulator room | Practice | 35 problem generators with worked solutions, 15 concept questions |

## Layout

```
index.html          shell, loads MathJax + scripts
css/style.css       design tokens (light/dark) and layout
js/physics.js       pure physics (no DOM): two-body, RK4, ascent, CR3BP, entry. Runs in Node too.
js/ui.js            canvas, charts, controls, storage helpers
js/app.js           hash router and chapter registry
js/ch/*.js          one file per chapter (text + labs)
js/practice.js      exercise generators and the Practice page
js/progress.js      training modules: briefings, objectives, patches, debriefs, toasts
js/primers.js       math refreshers, their widgets and the Math Toolkit page
js/symbols.js       Greek-letter tooltips and the variable legends under equations
tmp/                scratch: Node test scripts, screenshots (safe to delete)
```

Physics can be tested headless, e.g. `node tmp/t6.js` (free-return search) or `node tmp/t_practice.js`.
Append `?focus=<lab id>` to a URL to jump straight to a lab (e.g. `?focus=tl#moon`).
