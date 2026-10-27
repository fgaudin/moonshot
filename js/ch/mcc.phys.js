/* Mission Control: pure physics for the mcc module (no DOM). Loaded before js/ch/mcc.js; also runs in Node.
   Δv budgets with mass stacks, dispersions combined by root-sum-square, margins as Δv and as time,
   PAD arithmetic (total, attitude, burn time) and abort-option screening. */
(function (root) {
  'use strict';
  const g0 = 9.80665, gMoon = 1.62;
  const P = { g0, gMoon };

  /* ---------- rocket equation ---------- */
  // Δv from an initial mass and the propellant burned
  P.dv = (isp, m0, mProp) => isp * g0 * Math.log(m0 / (m0 - mProp));
  // propellant needed to give Δv to a stack of mass m0
  P.propFor = (isp, m0, dv) => m0 * (1 - Math.exp(-dv / (isp * g0)));
  // burn time at constant thrust F (N)
  P.burnTime = (isp, m0, dv, F) => P.propFor(isp, m0, dv) * isp * g0 / F;

  /* ---------- combining errors ---------- */
  P.rss = (list) => Math.sqrt(list.reduce((s, x) => s + x * x, 0));
  P.linear = (list) => list.reduce((s, x) => s + Math.abs(x), 0);

  /* ---------- margins as time ---------- */
  // hover time a Δv reserve buys on the Moon: hovering spends g☾ of Δv every second
  P.hoverFromDv = (dv) => dv / gMoon;
  // hover time from a propellant reserve: thrust = weight, so the mass decays exponentially
  P.hoverFromProp = (isp, m0, mProp) => isp * g0 / gMoon * Math.log(m0 / (m0 - mProp));

  /* ---------- PAD arithmetic ---------- */
  const DEG = 180 / Math.PI;
  P.padTotal = (p, n, r) => Math.sqrt(p * p + n * n + r * r);
  // α: in-plane attitude measured from prograde towards radial (−180..180°); β: out of plane, towards normal
  P.padAlpha = (p, r) => Math.atan2(r, p) * DEG;
  P.padBeta = (p, n, r) => Math.atan2(n, Math.hypot(p, r)) * DEG;
  P.ENGINES = {
    SPS: { F: 91200, isp: 314 },
    DPS: { F: 45040, isp: 311 },
    APS: { F: 15600, isp: 311 },
    RCS: { F: 1780, isp: 280 },     // four 445 N jets firing together
  };

  // GET as h:mm:ss; accepts "75:49:50", "075 49 50", "75.49.50", "75h49m50"
  P.parseGET = (s) => {
    const parts = String(s || '').trim().split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!parts.length || parts.length > 3) return NaN;
    while (parts.length < 3) parts.push(0);
    const [h, m, sec] = parts;
    if (m >= 60 || sec >= 60) return NaN;
    return h * 3600 + m * 60 + sec;
  };
  P.fmtGET = (t) => {
    const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.round(t % 60);
    const p2 = (x) => String(x).padStart(2, '0');
    return `${String(h).padStart(3, '0')}:${p2(m)}:${p2(s)}`;
  };
  // number typed by a candidate: decimal comma, spaces, unicode minus
  P.parseNum = (s) => {
    const t = String(s == null ? '' : s).replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return NaN;
    return parseFloat(t);
  };

  /* ---------- the lunar mission Δv budget ---------- */
  // Stages of an Apollo-like stack. dry includes everything that stays with the stage (instrument unit on the S-IVB).
  // cap: tank capacity (kg of usable propellant). Training figures rounded from Apollo 11-era values.
  P.STAGES = {
    sic: { name: 'S-IC', dry: 131000, prop: 2150000, cap: 2150000, isp: 285, depletion: true },
    sii: { name: 'S-II', dry: 40000, prop: 444000, cap: 444000, isp: 421, depletion: true },
    sivb: { name: 'S-IVB', dry: 13500, prop: 107000, cap: 107000, isp: 421 },
    sps: { name: 'CSM · SPS', dry: 10400, prop: 18400, cap: 18500, isp: 314 },
    dps: { name: 'LM descent · DPS', dry: 2030, prop: 8200, cap: 8900, isp: 311 },
    aps: { name: 'LM ascent · APS', dry: 2450, prop: 2350, cap: 2400, isp: 311 },
  };
  P.STAGE_ORDER = ['sic', 'sii', 'sivb', 'sps', 'dps', 'aps'];
  P.ASCENT_DV = 9300;     // pad to 185 km parking orbit, ideal Δv including gravity and drag losses

  // The maneuver list. stack: stages attached during the burn. s3: 3σ dispersion of the burn (m/s).
  // DOI may be flown by the LM (DPS, LM alone) or by the CSM with the LM docked (SPS).
  P.maneuvers = (doiBy = 'dps') => [
    { id: 'boost1', phase: 'ascent', stage: 'sic', depletion: true, s3: 0, stack: ['sic', 'sii', 'sivb', 'sps', 'dps', 'aps'] },
    { id: 'boost2', phase: 'ascent', stage: 'sii', depletion: true, s3: 0, stack: ['sii', 'sivb', 'sps', 'dps', 'aps'] },
    { id: 'insert', phase: 'ascent', stage: 'sivb', dv: 'rest', s3: 60, stack: ['sivb', 'sps', 'dps', 'aps'] },
    { id: 'tli', phase: 'translunar', stage: 'sivb', dv: 3150, s3: 20, stack: ['sivb', 'sps', 'dps', 'aps'] },
    { id: 'mcc1', phase: 'translunar', stage: 'sps', dv: 15, s3: 30, stack: ['sps', 'dps', 'aps'] },
    { id: 'loi', phase: 'lunar', stage: 'sps', dv: 940, s3: 15, stack: ['sps', 'dps', 'aps'] },
    doiBy === 'sps'
      ? { id: 'doi', phase: 'lunar', stage: 'sps', dv: 23, s3: 2, stack: ['sps', 'dps', 'aps'] }
      : { id: 'doi', phase: 'lunar', stage: 'dps', dv: 23, s3: 2, stack: ['dps', 'aps'] },
    { id: 'pdi', phase: 'lunar', stage: 'dps', dv: 2040, s3: 60, stack: ['dps', 'aps'] },
    { id: 'lasc', phase: 'lunar', stage: 'aps', dv: 1850, s3: 30, stack: ['aps'] },
    { id: 'tei', phase: 'transearth', stage: 'sps', dv: 1000, s3: 15, stack: ['sps'] },
    { id: 'mcc2', phase: 'transearth', stage: 'sps', dv: 5, s3: 15, stack: ['sps'] },
  ];

  // Evaluate a budget. cfg: { stages: {id: {dry, prop, isp}}, cargo (kg on the descent stage), doiBy, ascentDv, combine: 'rss'|'linear' }
  P.budget = (cfg) => {
    const st = {};
    for (const id of P.STAGE_ORDER) {
      const s = cfg.stages[id];
      st[id] = { dry: s.dry + (id === 'dps' ? (cfg.cargo || 0) : 0), prop: s.prop, isp: s.isp, load: s.prop };
    }
    const mass = (ids) => ids.reduce((m, id) => m + st[id].dry + st[id].prop, 0);
    const ascentDv = cfg.ascentDv || P.ASCENT_DV;
    const rows = [];
    let ascentSoFar = 0;
    for (const mv of P.maneuvers(cfg.doiBy)) {
      const s = st[mv.stage], c = s.isp * g0, m0 = mass(mv.stack);
      let dv, used;
      if (mv.depletion) { used = s.prop; dv = c * Math.log(m0 / (m0 - used)); ascentSoFar += dv; } else {
        dv = mv.dv === 'rest' ? Math.max(0, ascentDv - ascentSoFar) : mv.dv;
        used = m0 * (1 - Math.exp(-dv / c));
      }
      s.prop -= used;
      s.lastMass = m0 - used;           // stack mass after this stage's latest burn
      rows.push({ ...mv, dv, m0, used, left: s.prop, mEnd: m0 - used });
    }
    const stages = {};
    for (const id of P.STAGE_ORDER) {
      const mine = rows.filter((r) => r.stage === id);
      const s = st[id], c = s.isp * g0;
      const planned = mine.reduce((a, r) => a + r.dv, 0);
      const sig = mine.map((r) => r.s3);
      const depletion = mine.some((r) => r.depletion);
      // Δv the leftover propellant would still give to the stack as it is after the stage's last burn
      const mEnd = s.lastMass, dry = mEnd - s.prop;
      const dvRem = depletion ? 0 : c * Math.log(mEnd / dry);
      const s3 = cfg.combine === 'linear' ? P.linear(sig) : P.rss(sig);
      const marginDv = dvRem - s3;
      stages[id] = { id, planned, s3, s3rss: P.rss(sig), s3lin: P.linear(sig), propLeft: s.prop, load: s.load, dvRem, marginDv,
        marginPct: planned > 0 ? 100 * marginDv / planned : 0, depletion, mEnd };
    }
    return { rows, stages, ascentDv };
  };
  // GO when every stage that carries a reserve meets the margin rule
  P.verdict = (b, rulePct) => P.STAGE_ORDER.filter((id) => !b.stages[id].depletion && b.stages[id].planned > 0)
    .map((id) => ({ id, ok: b.stages[id].marginPct >= rulePct - 1e-9 }));

  /* ---------- abort screening ---------- */
  // option: { engine, dv, s3, hours }; engines: { SPS: { go, dvAvail } … }; consumables in hours; reserve fraction
  P.screen = (opt, engines, consumables, reserve = 0.1) => {
    const e = engines[opt.engine];
    const engineGo = !!(e && e.go);
    const dvAvail = e ? e.dvAvail : 0;
    const dvMargin = dvAvail - opt.dv - opt.s3;
    const tLimit = consumables * (1 - reserve);
    const tMargin = tLimit - opt.hours;
    return { engineGo, dvAvail, dvMargin, tLimit, tMargin, ok: engineGo && dvMargin >= 0 && tMargin >= 0 };
  };
  // the rule: the fastest option that passes every check
  P.bestOption = (opts, engines, consumables, reserve) => {
    let best = -1;
    opts.forEach((o, i) => { if (P.screen(o, engines, consumables, reserve).ok && (best < 0 || o.hours < opts[best].hours)) best = i; });
    return best;
  };

  root.Phys_mcc = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
