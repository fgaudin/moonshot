# Moonshot: writing a training module

Moonshot is a static web app (vanilla JS, no build, served at http://localhost:8642, source in this repo) that
teaches astrodynamics and rocket science through the Apollo program. Readers are adult astronaut candidates
(ASCANs) of a training program; their maths is French "terminale S" from long ago: comfortable with algebra and
vectors, rusty on derivatives and integrals. Everything is metric (SI).

**The app never mentions Kerbal Space Program or any game.** It uses Earth, the Moon and Apollo. The methods must
transfer to any planetary system, but the examples are real.

Read before starting: `js/ch/burns.js` and `js/ch/moon.js` (structure, voice, lab layout), `js/practice.js` (problem
format), `js/symbols.js` (`Sym.where`, `SYM`), `js/progress.js` (modules, briefings), `js/primers.js`
(refreshers), `js/ui.js` (canvas, charts, controls), `js/physics.js` (existing helpers: `Phys.C` constants,
`Phys.rk4`, `Phys.Orbit2D`, `Phys.elementsFromRV`, `Phys.solveKepler`, `Phys.executeBurns`, `Phys.simulateEntry`…),
and `tools/I18N.md` (translation rules, mandatory).

## Files you own (edit nothing else)

- `js/ch/<id>.js`: the chapter (replace the stub entirely).
- `js/ch/<id>.phys.js`: pure physics, no DOM (exports `window.Phys_<id>`, and `module.exports` for Node).
- `js/i18n/fr/<id>.js`, `js/i18n/de/<id>.js`: complete French and German dictionaries for every key in your two files.
- `tmp/<id>/`: your scratch files and tests. Never write temporary files anywhere else (not `/tmp`).

If you believe a shared file needs a change, do not make it: describe it in your report.

## Registration (from your chapter file, at load time)

```js
Progress.register('<id>', {
  name: N`Module name`, topic: '<id>', glyph: 'node',           // glyphs: cannon ellipse rocket ascent transfer node docking figure8 lander capsule
  briefing: N`Second-person briefing by Vega, the chief flight instructor, addressing {name}.`,
  objectives: [ { id: 'xyz', text: N`…` }, …, { id: 'qual', text: N`Qualify: answer 2 … problems correctly` } ],
  debrief: N`One or two sentences, ending with what comes next, {name}.`,
});
Practice.register('<id>', N`Topic name`, [generators…], [concept questions…]);
Primer.register('key', { title: N`…`, used: N`…`, html: [N`<p>…</p>`, '\\[ … \\]', …], widget: (el) => { … } });  // optional
App.css('<id>', `…`);   // optional module-specific CSS; prefer existing classes
```

- 3 to 5 objectives, the last one `qual`. Detect them in your lab with `Progress.done('<id>', 'xyz')`, only after
  the candidate has changed a control themselves (see the `touched` pattern in `burns.js`); a preset or a
  "show solution" button must not complete an objective.
- The `qual` objective is completed automatically when the candidate answers 2 problems of your topic correctly.
- Practice: 4 to 6 generators and 2 or 3 concept questions, same format as `js/practice.js` (title `N`, `make()`
  returns `{ q, answer, unit, tol?, hint, sol }`, prose wrapped in `T`, TeX solutions with `String.raw`). Define your
  own small helpers in your file (`rnd`, `pick`, `f = UI.fmt`, `R = String.raw`, constants).

## Chapter structure

```js
App.chapter({ id: '<id>', phase: N`Phase`, title: N`Title`, lab: N`Lab name`, blurb: N`One-line hook.`, render(page) { … } });
```

`render` builds, in this order:

1. `App.header({ eyebrow: T\`Training module ${Progress.code('<id>')} · Phase\`, title, lede, refs })`. `refs` are
   real book chapters (Sellers, *Understanding Space*; Bate, Mueller & White, *Fundamentals of Astrodynamics*) or
   primary sources; do not invent chapter titles you are unsure of (use the book name alone then).
2. `Progress.briefing('<id>', { theory: 'theory', lab: '<labId>', math: 'refresher', mathLabel: N\`…\` })`.
3. Theory sections: `<section class="section">` with `<h2><span class="idx">0.1</span>${T\`…\`}</h2>`; section
   numbers are renumbered automatically (write `0.1`, `0.2`…). The first section has `id="theory"`.
   Every display equation (`<div class="eq">\\[ … \\]</div>`) is followed by `${Sym.where([...], N\`note\`)}` with
   each symbol explained (custom rows `['tex', N\`meaning\`, 'unit']`; existing keys from `SYM` in `js/symbols.js`).
   Give a plain-language reading of anything involving calculus. Include at least one
   `${Primer.box('key', false, 'refresher')}` (the first one gets the id `refresher`).
4. A lab (see below), introduced by a short paragraph.
5. `<section class="section"><h2><span class="idx">✓</span>${T\`Check yourself\`}</h2><div id="practice-slot"></div></section>`
   then `${Progress.debrief('<id>', { math: 'key', mathLabel: N\`…\` })}`; after `innerHTML`, mount the lab and call
   `Practice.embed(page.querySelector('#practice-slot'), '<id>', 3)`.

Cross-references to other modules: `${Progress.code('moon')}` (gives "TM-13") or `App.sec('moon', 1)` (gives
"13.1"). Never hard-code a module or section number.

## Labs

Use the existing one-screen layout (see `burns.js` and `moon.js`):
`<div class="lab tl-lab" id="…">` with `.lab-head`, `.stage` (canvas + `.overlay` + `.badge`), `.tl-side`
(live numbers, small charts), `.tl-transport` (play/restart/time slider if time-based) and `.tl-groups` with
`.tl-group` columns of controls. Controls: `UI.slider`, `UI.bindControls`, `.seg` + `UI.seg`, `select`, `.btn`,
`.readout` (`dl`). Canvases: `UI.canvas(el, draw)`; in draw functions name the theme tokens `const K = UI.tok()`
(**never `T`**, which is the translation function). Helpers: `UI.chart`, `UI.arrow`, `UI.drawEarth`, `UI.drawMoon`,
`UI.stars`, `UI.loop`, `UI.fmt` (locale decimals), `UI.dec`, `UI.fmtTime`. Inputs where candidates type numbers
must accept decimal commas. Give canvases an `aria-label`.

The lab must open in a meaningful state (a scenario loaded), offer a few scenarios, show the result of the
candidate's own calculation compared with the truth, and make the objectives reachable by real work.

## Quality bar

- Physics correct and verified: write Node tests in `tmp/<id>/` that check your functions against hand
  calculations and known values; tune scenarios so objectives are achievable and teach something.
- Historical facts: only state what you are sure of. When unsure, leave it out. No invented quotes or numbers.
- Voice: like the existing chapters. Short direct sentences, active voice, no em-dash asides, no "not X but Y",
  no filler. Explain the why. Use real Apollo examples where they illuminate.
- Translations: follow `tools/I18N.md` exactly; French "vous", German "du"; complete for every key; reuse existing
  translations of shared terms (`node tmp/i18n-conflicts.js` must report 0 conflicts; align yours if needed).
- Checks before you finish:
  - `node --check` on every file you created or edited;
  - `node tools/i18n-check.js check fr js/ch/<id>.js js/ch/<id>.phys.js` and the same for `de`: 0 missing, no
    placeholder mismatch (`node tmp/missing-keys.js fr js/ch/<id>.js` prints exact missing keys as JSON);
  - a browser smoke test with puppeteer (installed in `tmp/pp`, Chromium at `/snap/bin/chromium`): load
    `http://localhost:8642/#<id>` in en, fr and de (set `localStorage['moonshot:lang']` to `'"fr"'` etc. before
    loading), exercise the lab, check there are no page errors and `I18N.missing` is empty for your strings;
  - screenshots of your lab at 1440×900 and 400 px wide; look at them and fix the layout;
  - script the objectives to prove each is reachable.

## Report

When done, report briefly: what the module covers, the lab and its scenarios, the objectives and how you verified
them, key numbers you checked, anything you were unsure of, any change you think a shared file needs, and one or
two NASA archive photo suggestions for a history capsule (images.nasa.gov IDs, why they fit).
