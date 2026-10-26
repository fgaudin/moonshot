/* Small UI toolkit: DOM helpers, theme tokens, HiDPI canvases, line charts, controls, storage. */
(function () {
  'use strict';
  const UI = {};
  const cleanups = [];

  UI.$ = (sel, root = document) => root.querySelector(sel);
  UI.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  UI.html = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; };

  /* ---- lifecycle: everything a page starts is stopped on navigation ---- */
  UI.onCleanup = (fn) => cleanups.push(fn);
  UI.cleanup = () => { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { console.error(e); } } };
  UI.loop = (fn) => {
    let id = 0, last = performance.now(), alive = true;
    const tick = (now) => { if (!alive) return; const dt = Math.min(0.1, (now - last) / 1000); last = now; fn(dt, now); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    const stop = () => { alive = false; cancelAnimationFrame(id); };
    UI.onCleanup(stop);
    return stop;
  };
  UI.reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- theme tokens, read live so canvases follow light/dark ---- */
  let tokCache = null, tokStamp = 0;
  UI.tok = () => {
    const now = performance.now();
    if (tokCache && now - tokStamp < 500) return tokCache;
    const cs = getComputedStyle(document.documentElement);
    const g = (n) => cs.getPropertyValue('--' + n).trim();
    tokCache = { bg: g('bg'), panel: g('panel'), sunk: g('sunk'), ink: g('ink'), muted: g('muted'), line: g('line'), accent: g('accent'),
      trace: g('trace'), trace2: g('trace2'), moon: g('moon'), earth: g('earth'), good: g('good'), warn: g('warn'), bad: g('bad'), grid: g('grid'),
      mono: g('f-mono') || 'monospace', display: g('f-display') || 'sans-serif' };
    tokStamp = now;
    return tokCache;
  };

  /* ---- HiDPI canvas bound to its CSS box; draw(ctx, w, h) is called on resize ---- */
  UI.canvas = (canvas, draw) => {
    const ctx = canvas.getContext('2d');
    const state = { ctx, w: 0, h: 0, draw };
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      state.w = Math.max(10, r.width); state.h = Math.max(10, r.height);
      canvas.width = Math.round(state.w * dpr); canvas.height = Math.round(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state.draw) state.draw(ctx, state.w, state.h);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    UI.onCleanup(() => ro.disconnect());
    fit();
    state.redraw = () => { if (state.draw) state.draw(ctx, state.w, state.h); };
    return state;
  };

  /* ---- formatting ---- */
  UI.fmt = (x, d = 2) => {
    if (x === Infinity) return '∞';
    if (!isFinite(x)) return '—';
    return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, ' ');
  };
  UI.fmtTime = (s) => {
    if (!isFinite(s)) return '—';
    const sign = s < 0 ? '−' : '';
    s = Math.abs(s);
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = Math.floor(s % 60);
    const p = (n) => String(n).padStart(2, '0');
    return d > 0 ? `${sign}${d}d ${p(h)}:${p(m)}:${p(ss)}` : `${sign}${p(h)}:${p(m)}:${p(ss)}`;
  };
  UI.niceStep = (span, n = 5) => {
    const raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
  };

  /* ---- simple line chart ----
     opts: { series: [{ data: [[x,y],...], color, width, dash, fill }], xLabel, yLabel, xMin, xMax, yMin, yMax,
             xFmt, yFmt, marks: [{x, label, color}], hlines: [{y, label, color}], cursor: x } */
  UI.chart = (ctx, w, h, opts) => {
    const T = UI.tok();
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 46, r: 12, t: 12, b: 30 };
    const all = opts.series.flatMap((s) => s.data);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]).filter(isFinite);
    let x0 = opts.xMin ?? Math.min(...xs), x1 = opts.xMax ?? Math.max(...xs);
    let y0 = opts.yMin ?? Math.min(0, ...ys), y1 = opts.yMax ?? Math.max(...ys);
    if (!isFinite(x0) || !isFinite(x1) || x1 === x0) { x0 = 0; x1 = 1; }
    if (!isFinite(y0) || !isFinite(y1) || y1 === y0) { y0 = 0; y1 = 1; }
    if (opts.yMax == null) y1 += (y1 - y0) * 0.06;
    const X = (x) => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r);
    const Y = (y) => h - pad.b - (y - y0) / (y1 - y0) * (h - pad.t - pad.b);
    ctx.font = `10px ${T.mono}`;
    ctx.lineWidth = 1;
    // grid + ticks
    const xs_ = UI.niceStep(x1 - x0, Math.max(2, Math.floor(w / 90))), ys_ = UI.niceStep(y1 - y0, Math.max(2, Math.floor(h / 40)));
    ctx.strokeStyle = T.grid; ctx.fillStyle = T.muted;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = Math.ceil(x0 / xs_) * xs_; x <= x1 + 1e-9; x += xs_) {
      ctx.beginPath(); ctx.moveTo(X(x), pad.t); ctx.lineTo(X(x), h - pad.b); ctx.stroke();
      ctx.fillText((opts.xFmt || ((v) => +v.toFixed(6)))(x), X(x), h - pad.b + 5);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = Math.ceil(y0 / ys_) * ys_; y <= y1 + 1e-9; y += ys_) {
      ctx.beginPath(); ctx.moveTo(pad.l, Y(y)); ctx.lineTo(w - pad.r, Y(y)); ctx.stroke();
      ctx.fillText((opts.yFmt || ((v) => +v.toFixed(6)))(y), pad.l - 6, Y(y));
    }
    ctx.strokeStyle = T.line;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();
    if (opts.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillStyle = T.muted; ctx.fillText(opts.xLabel, w - pad.r, h - pad.b - 3); }
    if (opts.yLabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = T.muted; ctx.fillText(opts.yLabel, pad.l + 5, pad.t + 1); }
    for (const hl of opts.hlines || []) {
      if (hl.y < y0 || hl.y > y1) continue;
      ctx.strokeStyle = hl.color || T.muted; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(pad.l, Y(hl.y)); ctx.lineTo(w - pad.r, Y(hl.y)); ctx.stroke(); ctx.setLineDash([]);
      if (hl.label) { ctx.fillStyle = hl.color || T.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(hl.label, w - pad.r - 2, Y(hl.y) - 2); }
    }
    // series
    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t - 2, w - pad.l - pad.r, h - pad.t - pad.b + 4); ctx.clip();
    for (const s of opts.series) {
      if (!s.data.length) continue;
      ctx.beginPath();
      s.data.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
      if (s.fill) {
        ctx.save();
        ctx.lineTo(X(s.data[s.data.length - 1][0]), Y(Math.max(y0, 0))); ctx.lineTo(X(s.data[0][0]), Y(Math.max(y0, 0))); ctx.closePath();
        ctx.globalAlpha = 0.12; ctx.fillStyle = s.color; ctx.fill(); ctx.restore();
        ctx.beginPath(); s.data.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
      }
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 1.8; ctx.setLineDash(s.dash || []);
      ctx.stroke(); ctx.setLineDash([]);
      if (s.end !== false) { const p = s.data[s.data.length - 1]; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 2.6, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    for (const m of opts.marks || []) {
      if (m.x < x0 || m.x > x1) continue;
      ctx.strokeStyle = m.color || T.muted; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(X(m.x), pad.t); ctx.lineTo(X(m.x), h - pad.b); ctx.stroke(); ctx.setLineDash([]);
      if (m.label) { ctx.save(); ctx.fillStyle = m.color || T.muted; ctx.translate(X(m.x) + 3, pad.t + 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(m.label, 0, 0); ctx.restore(); }
    }
    if (opts.cursor != null && opts.cursor >= x0 && opts.cursor <= x1) {
      ctx.strokeStyle = T.accent; ctx.beginPath(); ctx.moveTo(X(opts.cursor), pad.t); ctx.lineTo(X(opts.cursor), h - pad.b); ctx.stroke();
    }
    return { X, Y };
  };

  /* ---- controls ---- */
  UI.slider = ({ id, label, min, max, step, value, fmt, unit = '' }) => `
    <div class="ctl"><label for="${id}"><span>${label}</span><output id="${id}-out"></output></label>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></div>`;
  // binds every range input in root: updates its <output> with fmt, and calls onChange(values)
  UI.bindControls = (root, fmts, onChange) => {
    const inputs = UI.$$('input[type=range], select, input[type=checkbox]', root);
    const read = () => {
      const v = {};
      for (const i of inputs) v[i.id] = i.type === 'checkbox' ? i.checked : i.tagName === 'SELECT' ? i.value : parseFloat(i.value);
      return v;
    };
    const update = (src) => {
      const v = read();
      for (const i of inputs) {
        const o = root.querySelector('#' + i.id + '-out');
        if (o) o.textContent = (fmts[i.id] ? fmts[i.id](v[i.id]) : v[i.id]) + (i.dataset.unit ? ' ' + i.dataset.unit : '');
      }
      onChange(v, src);
    };
    inputs.forEach((i) => i.addEventListener('input', () => update(i.id)));
    return { read, update, set(id, val) { const el = root.querySelector('#' + id); if (el) { el.value = val; } } };
  };
  UI.seg = (root, sel, onPick) => {
    const btns = UI.$$(sel + ' button', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset.v);
    }));
  };

  /* ---- persistence (per-viewer convenience only) ---- */
  UI.store = {
    get(k, d) { try { const v = localStorage.getItem('moonshot:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('moonshot:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  /* ---- math typesetting ---- */
  // MathJax must not typeset overlapping regions concurrently, so calls are queued
  let typesetQueue = Promise.resolve();
  UI.typeset = (el) => {
    const MJ = window.MathJax;
    if (MJ && MJ.typesetPromise) {
      typesetQueue = typesetQueue.then(() => MJ.startup.promise).then(() => (el.isConnected ? MJ.typesetPromise([el]) : null))
        .then(() => { if (window.Sym && el.isConnected) Sym.hitAreas(el); }).catch((e) => console.warn(e));
    } else window.__pendingTypeset = (window.__pendingTypeset || []).concat(el);
  };

  /* ---- drawing helpers for space scenes ---- */
  UI.drawEarth = (ctx, x, y, r, T) => {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, T.earth); g.addColorStop(1, T.ink === '#132238' ? '#1b4a75' : '#163a5c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  };
  UI.drawMoon = (ctx, x, y, r, T) => {
    ctx.fillStyle = T.moon; ctx.beginPath(); ctx.arc(x, y, Math.max(r, 1.5), 0, 7); ctx.fill();
  };
  UI.arrow = (ctx, x0, y0, x1, y1, color, w = 2) => {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hh = Math.min(9, L * 0.4);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hh * Math.cos(a - 0.4), y1 - hh * Math.sin(a - 0.4)); ctx.lineTo(x1 - hh * Math.cos(a + 0.4), y1 - hh * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
  };
  // deterministic starfield, cached per size
  UI.stars = (ctx, w, h, T, n = 140) => {
    let s = 12345;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    ctx.fillStyle = T.muted;
    for (let i = 0; i < n; i++) { ctx.globalAlpha = 0.15 + rnd() * 0.45; ctx.fillRect(rnd() * w, rnd() * h, rnd() < 0.1 ? 1.6 : 1, rnd() < 0.1 ? 1.6 : 1); }
    ctx.globalAlpha = 1;
  };

  window.UI = UI;
})();
