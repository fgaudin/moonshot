# Changelog

What changed and why, in more detail than the commit messages. Newest first. Module numbers (TM-n, section n.k)
follow the current `ORDER` in `js/app.js`.

## 2026-11-13 — briefings replace the chapter intros, callsign used sparingly, ASCAN, objectives button

- **One intro per module.** The header lede repeated the briefing (in half the modules almost word for word), so
  the 19 module pages lose their lede and each briefing absorbs what the lede added: the physical idea or the
  striking fact (Newton in 1687, conics and Kepler's equation, 60 MJ/kg on entry, orbit as a matter of speed…).
  Briefings drop their "In this module you will…" lists, which the Objectives right below already give. Pages
  without a briefing (toolkit, practice, reference, glossary) keep their lede.
- **Callsign.** It closed almost every briefing and debrief (", {name}."), which read like a mail merge. The
  briefing header now says "Briefing for <callsign>" (just "Briefing" until one is set) and the debrief header
  "TM-n · debrief for <callsign>" ("TM-n · debrief" until then). The briefing header no longer repeats "Training
  module TM-n", already in the page header. In the text the callsign stays at six moments: the welcome (TM-1),
  the first launch (TM-6), the landing (TM-16), splashdown (TM-18) and the capstone (TM-19, briefing and debrief).
- **ASCAN** replaces "Candidate" as the name used before a callsign is chosen: NASA's own nickname for astronaut
  candidates, the same in every language. The TM-1 welcome explains it ("NASA calls its trainees ASCANs, short for
  astronaut candidates, and that is what you are until every patch is earned") and the glossary has an entry. The
  home page's callsign field no longer compares with the default text to decide whether it is empty.
- **Home page without a callsign:** the record heading is just "Flight record", and the certificate reads "You have
  completed all 19 training modules… and are hereby declared GO FOR LAUNCH" (it said "Candidate has completed…"),
  with a note asking for a callsign to put a name on it. Entering one updates the heading and the certificate at once.
- **Home page free-return animation:** an endless loop at constant speed. It used to step through the simulation's
  points, which are spaced in time, so the spacecraft rushed past the Earth and the Moon and crawled far out, then
  paused and restarted. It now advances by distance along the drawn path (12 s per lap), with the whole figure eight
  drawn faintly and a fading trail behind the spacecraft; the GET clock still shows the mission time at the dot.
  Entry and TLI are joined behind the Earth's disc, so the loop wraps without a jump. With reduced motion the full
  path is drawn still.
- **Certificate date:** it showed today's date at every visit. It now shows the day training was completed: the time
  of the last objective earned, which each objective already stores (`Progress.completedAt()`). It changes only if
  objectives are reset and earned again.
- **Debriefs announced the wrong next module** in five places, left from an older module order: TM-2 (said the
  rocket, next is navigation), TM-4 ("Now ride one", next is sounding), TM-6 (said burns, next is the launcher),
  TM-8 ("Next stop: the Moon", next is burns), TM-16 ("One last test", two modules follow). TM-9 and TM-18 now
  name their next module too.
- **Objectives button.** Most objectives are earned in the labs, far below the briefing. Every module page now has
  an "Objectives n/N" button in the bottom-right corner, shown once the briefing's own list has scrolled out of view.
  It opens a panel with the checklist (ticked live as objectives complete) and a "Back to the briefing" link; the
  panel stays open while you work and closes with its button, × or Escape. Objective toasts move above the button,
  or to the top of the screen while the panel is open, so they never cover it. Not printed.
- Tests: module pages have no lede, the callsign appears in at most six briefings/debriefs and once in each, and
  the headers read "Briefing" / "Briefing for <callsign>"; ASCAN is the default and is explained; every module
  briefing brings the objectives dock with its count and full checklist.
- Translations pending (WIP in `tests/i18n.test.js`): progress.js and the chapters that define their own briefing
  (descent, sounding, freereturn, planes, homeward, launcher, mcc, timing, navigation), the glossary and home.

## 2026-11-13 — full review, translations, license

### Physics and lab behaviour

- **Ascent Δv ledger (physics.js `simulateAscent`, TM-6).** Gravity and steering losses are now measured against
  the air-relative flight path, the one the gravity turn follows. Against the inertial path, which starts horizontal
  because of Earth's spin, the vertical rise was booked as steering loss. Nominal Saturn V: gravity 908 → 1 635 m/s,
  steering 802 → 88 m/s, drag unchanged (35 m/s). The ledger now closes to within about 20 m/s (Earth's spin is
  worth ω·r at orbit height, not at the pad), so its last line reads "≈ Final inertial speed".
- **physics.js** `simulateAscent` defaults (no options) crashed at T+86 s; they are now the lab's nominal 16 s / 0.7°.
  `asin` guarded in `conicOf` and the TLI entry flight-path angle.
- **Free return lab (TM-14).** The MCC slider spans ±10 m/s (was ±1 m/s, shared with TM-13), so the corrections of
  sections 14.5–14.6 (−7.77, −6.95, −6.78 m/s) can be flown. New MoonLab option `mccMax`; the solver uses the same
  range and its failure message states it.
- **Landing lab call-outs (TM-16)** follow the Apollo 11 sequence: LOW LEVEL light with under two minutes of
  propellant left (it fired at 1.5 %, after the 60-second call), then "Sixty seconds" and "Thirty seconds" counted
  to bingo (they counted to empty tanks), then a new "Bingo" call 20 s before depletion (abort reserve).
- **Landing lab:** keyboard and button throttle steps no longer stick at the forbidden 65–92.5 % band.
- **Newton's cannon (TM-1):** the Circular and Escape preset buttons are removed; the speeds must be found with the
  slider.
- **Free return `rescue` objective (TM-14):** "Mission Control: solve MCC" no longer completes it (a solution button
  must not earn an objective). The solver reports its own source (`<id>-solve`); the candidate must set an MCC with
  the slider. Lab step 3 says so and points to the arrow keys (5 mm/s steps).
- **Plane change lab (TM-11):** "Show Mission Control's solution" now costs the credit of the next attempt only,
  as the lab says. Before, no attempt in that scenario could earn credit until the scenario was changed.
- **Navigation (TM-3):** the Suborbital scenario no longer shows negative altitudes after "Take new readings".
- **Homeward (TM-17):** NaN readouts when the Δv is too low show "—"; the far-side angle test wraps correctly.
- **Timing (TM-10) / Planes (TM-11) physics:** a float-noise negative angle no longer adds a full synodic period.
- **MCC (TM-19):** GET times could print "000:00:60".
- **Maneuvers (TM-8):** the bi-elliptic "cheaper" highlight compares with the pure Hohmann Δv.
- **Callsign (progress.js):** `<` and `>` are stripped, since the callsign is inserted as HTML.
- **Phone width (400 px):** no more horizontal scrolling on TM-13 (the v_rel formula is a display equation), TM-14
  (a figure label wraps) and TM-18 (the Allen–Eggers figure frame).

### Objectives that could be earned without the work

- Ascent `fail` was earned by clicking the "Too hard" preset; it now needs the candidate's own control change.
- Maneuvers `lor` was earned by the "LM → CSM (Moon)" preset.
- Entry `site`: "show the working" on one orbit, switching away and back reset the flag; it is now per orbit.
- MCC `margin`: typing a huge Isp or a tiny dry mass passed; the stage data must now be the real ones.

### Practice

- Navigation "A speed error near circular" mixed metres and kilometres: the expected answer was ~12 % off.
- Timing "Required phase at liftoff" and "Liftoff time from the overhead pass" no longer draw answers near zero.
- Orbits "Specific mechanical energy" redraws when |ε| < 1 km²/s², where the 1 % tolerance was unfair.
- Quiz explanations: free return (Apollo 9 never went to the Moon; Apollo 13 got back onto a free return with the
  LM descent engine), Apollo 11 bingo margin, Apollo 11 TLI Δv including gravity losses.
- MCC readback quiz: the wrong option "the loop is often too noisy…" was nearly right; replaced.

### Text corrections

- **TM-15 15.2** braking estimate: the mass at the end of braking is about 8 600 kg (a ≈ 5.2 m/s², not 3.7), the
  mean mass about 11 800 kg, so a ≈ 3.8 m/s², about 450 s and 380 km (the text said 480 s and 410 km), 8 % short
  of the simulation's 412 km.
- **TM-6 4.1** gravity loss "often 1.2–1.8 km/s" (was 1–1.5), consistent with TM-7.
- **TM-7 7.4** no longer claims the lab's vehicles lose less to gravity than a Saturn V.
- **TM-16** blurb and briefing match the lab (500 m, about two minutes of propellant; was 150 m and 60 s).
  History callout rewritten from the Apollo 11 Mission Report and the Apollo Lunar Surface Journal: P66 at about
  150 m, "60/30 seconds" counted to bingo, touchdown about 20 s before bingo, about 45 s of propellant left in
  post-flight analysis (slosh fooled the low-level sensor), landing about 6.5 km beyond the ellipse centre, mostly a
  navigation error present at PDI, about 600 m from Armstrong's detour (the "400 m further" was unsourced).
- **TM-14** blurb: the free return "brought Apollo 13 home" (was "saved"); "Apollo 8, 10 and 11 were launched onto
  free-return trajectories" (Apollo 11's midcourse correction took it off a strict free return). Same in the glossary.
  14.4: three seconds of TLI timing move the periselene by about 700 km in the lab (was "almost 800").
- **TM-13 13.1** Apollo 11's 3.18 km/s TLI is the Δv delivered in a burn of nearly six minutes, part of it lost to
  gravity.
- **TM-11** sin β = 0.9597 (was 0.9594); launch windows 19.7 h apart (was 19.8); 7 726 m/s at 300 km (was 7 730).
- **TM-18** β ≈ 353 kg/m² (was 355); heating grows with the square root of the density (was "with the density");
  "about fourteen and a half times" the energy of TNT.
- **TM-5** Standard Atmosphere values at geometric altitude, as the lab uses (22 700 Pa at 11 km, 5 530 Pa at
  20 km); the F-1 was not throttled at max-q; the "half a scale height" quiz explanation.
- **TM-12** the pilot flying the CSM used the hand controllers (was "the commander").
- **TM-1** the shell theorem sentence (Newton's proofs were geometric); "every bound shot" returns to the cannon.
- **TM-3 3.6** removed an unsupported sentence about crews disagreeing with the ground.
- **TM-9** 1 930 kg of propellant (was 1 900).
- **README:** 19 modules (was 18), Free Return row added, practice counts no longer hard-coded.

### New content

- Home page: "The crew" note, Apollo 11's three roles and who flew what (Armstrong CDR, Aldrin LMP, Collins CMP).
- Glossary: "CDR, CMP, LMP".
- Reference page: new section "At the keyboard" with Kerbal Space Program (patched conics and spheres of influence,
  manoeuvre nodes in prograde/normal/radial components like a PAD, staging, the gravity turn), linked to TM-6,
  TM-9 and TM-13. `tools/MODULE-GUIDE.md` now says modules never mention games; only the Reference page lists them.
- `LICENSE`: Creative Commons BY-NC-SA 4.0 (share and adapt with credit, no commercial use, same license for
  derivatives), with the full legal text. The NASA photographs (public domain) and the CDN libraries and fonts are
  excluded. README has a License section.

### Tests

28 → 169 tests (`node --test tests/*.test.js`, about 1.5 s).

- New files: ascent, burns, docking, landing, launcher, maneuvers, navigation, orbits, planes, practice, progress,
  rockets, sounding, timing. Extended: descent, entry, freereturn, homeward, mcc, moon, newton, physics.
- They check numbers quoted in the text against the code, lab scenarios and objective reachability, physics
  against hand calculations, figures without NaN, and every practice generator and concept question.
- `tests/helpers/appenv.js` loads the whole app in a vm (real Progress, App, Practice);
  `tests/helpers/practiceTopic.js` loads `js/practice.js` for one topic. `checkGenerators` accepts an empty unit
  for dimensionless answers.

### Translations

- French and German for every string changed or added above (45 keys, plus the Reference page), edited from the
  existing translations where the English only changed in part. Old entries replaced; the dictionary entries of
  removed strings (Newton's Circular/Escape buttons, the old LOW LEVEL call, the old readback option and free-return
  explanation) deleted.
- Also translated the strings that were still pending before the review: the Apollo 11 LOI loss-of-signal sentence
  (TM-13), the far-side TEI silence (TM-17) and the launch-escape-tower history capsule.
- The WIP list in `tests/i18n.test.js` is empty: every source is fully translated (0 missing in fr and de, no
  conflicting keys).
