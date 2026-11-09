# Moonshot: how to add an illustration

Read this before adding a figure to a chapter. Translation rules are in `tools/I18N.md`.

## Two kinds of figure

- **Static SVG + HTML labels** (most figures). It is a function in the chapter file that returns a `<figure>` string,
  called inline in the section's prose: `${figSOI()}`. Examples:
  `figSOI` (js/ch/moon.js, 13.1, two conics and a vector inset), `figLiftoff` (js/ch/timing.js),
  `figAzimuth` (js/ch/planes.js, a sphere drawn in orthographic projection with front and back parts).
- **Interactive canvas** (when the reader needs to drag or use sliders). It is a markup function plus a `mountX(root)`
  function called after `page.innerHTML = …` in `render()`. Example: `figPlane3D` / `mountPlane3D` (js/ch/planes.js),
  which uses `UI.canvas`, `UI.tok()` colours, `UI.slider` and `UI.bindControls`. An animation example is in js/ch/docking.js
  (`ds-fig`).

A compact helper for new static figures is `frame(W, H, ox, oy)` in js/ch/moon.js and js/ch/freereturn.js: it gives
`S` (maths → SVG), `path`, `head`, `arrow` (vector, tip on the end point), `arc`, `dot` and `lbs` (HTML labels).
Interactive SVG (re-rendered on a slider): `figTiming` / `mountTiming` in js/ch/freereturn.js.
The Earth–Moon lab is shared: `window.MoonLab.markup(cfg)` / `MoonLab.mount(root, cfg)` in js/ch/moon.js.

## Skeleton of a static figure

```js
App.css('<chapter>-fig', `
  .f-moon { fill: var(--moon); fill-opacity: .35; stroke: var(--muted); stroke-width: 1; }`);   // only the classes you add
function figX() {
  const W = 460, H = 270, fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const S = (q) => [ox + q[0], oy - q[1]];   // maths coordinates (y up) → SVG (y down)
  const lbs = (list) => list.map(([[x, y], t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
  return `<figure class="fig" role="img" aria-label="${T`Full description of the picture for screen readers.`}">
    <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true"> …paths… </svg>${lbs([
      [S([x, y]), T`label`, 'tr l'], …
    ])}</div>
    <figcaption>${T`Not to scale … what the colours mean, the one idea the figure shows.`}</figcaption></figure>`;
}
```

- **Labels are HTML spans over the SVG, not SVG `<text>`.** They are placed in % of the viewBox and scale with the figure
  width (container query). Label classes: `l` (anchored on its left), `r` (anchored on its right), default centred;
  colours `m` (muted), `acc`, `tr`, `inv`, plus `wn`, `gd` where a chapter defines them. Math in labels uses
  `<i>v</i><sub>∞</sub>`, not TeX.
- **Shared SVG classes** are defined once in js/ch/orbits.js (`App.css('orbits', …)`, global): `.fig`, `.fig-box`, `.lb*`,
  `f-tr` (blue trajectory), `f-ac-ln` / `f-ac-fill` (orange), `f-ink-ln` / `f-ink-fill`, `f-mu` / `f-mu-fill` (grey),
  `f-dash`, `f-earth`, `f-eq`, `f-pl`, `f-cone`, `f-cut`. Add chapter-specific classes with `App.css('<chapter>-fig', …)`.
  Use colour tokens only (`var(--trace)`, `--accent`, `--moon`, `--earth`, `--muted`, `--ink`, `--panel`, `--line`, `--good`,
  `--warn`) so dark mode works without extra code.
- Colour conventions: blue (`trace`) = orbit or velocity in the Earth frame / main trajectory, orange (`accent`) = the
  thing the section is about (or the Moon frame), grey = reference lines, Moon's orbit, construction lines.
- Arrowheads: draw a small filled triangle (see `head()` in figSOI or figLiftoff). `head(q, dir)` puts the tip 9 units
  *beyond* q, which is right for a direction marker on a curve but wrong for a vector: for vectors use `arrow()` in figSOI,
  which stops the line 9 units short so the tip lands exactly on the end point (tip-to-tail triangles must meet).
- Label every place where the method does something (e.g. both patch points, entry and exit, not just one), and avoid
  a ghost or continuation line that makes a point read as the wrong one.
- **Compute geometry from the physics, don't hand-draw curves.** Conics come from `r = p / (1 + e cos ν)`; when two
  pieces must join (patched conics, transfers), solve for the parameters so they meet exactly. Prototype the maths in
  `tmp/<topic>/` with node first if it is not obvious.
- Figures are schematic: say "Not to scale" in the caption and what is exaggerated.
- Section numbers in text: `App.sec('moon', 1)`, never hard-coded.

## Translation

Every `T`…`` string (aria-label, labels, caption) needs entries in `js/i18n/fr/<chapter>.js` and `js/i18n/de/<chapter>.js`
(append before the final `});`). Labels that are only symbols (`'TLI'`, `'<i>v</i>'`) are not wrapped. Check:

```sh
node tools/i18n-check.js check fr js/ch/<chapter>.js   # TOTAL missing in fr: 0
node tools/i18n-check.js check de js/ch/<chapter>.js
node --check js/ch/<chapter>.js
```

## Look at it (always, in en / fr / de and in dark mode)

Long French and German labels are where layouts break (clipped at the edge, overlapping a curve).

1. Serve the site: `docker compose up -d`, or without docker `python3 -m http.server 8642 --bind 127.0.0.1` from the repo root.
2. Screenshot the figure with `tmp/pp/soi.js` (puppeteer-core + `/snap/bin/chromium`):
   `cd tmp/pp && node soi.js fr dark` writes `tmp/soi/fig-fr-dark.png` and prints page errors and missing i18n keys.
   For any page and element: `node shot.js <hash> '<css selector>' <out.png> [lang] [theme] [index]`, e.g.
   `node shot.js freereturn 'figure.fig' fig.png de dark 1` (the second figure). `EVALFILE=script.js` runs a script in
   the page first (pick a preset, tick a box). `node scan.js` visits every page in en/fr/de and reports errors and
   missing translation keys.
   The language is set in `localStorage['moonshot:lang']` and needs a **reload** (a hash change alone does not re-read it).
3. Open the PNG, fix positions, repeat.
