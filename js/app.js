/* Router and chapter registry. Each chapter file calls App.chapter({...}). */
(function () {
  'use strict';
  const ORDER = ['home', 'newton', 'orbits', 'rockets', 'ascent', 'maneuvers', 'burns', 'docking', 'moon', 'landing', 'entry', 'toolkit', 'practice', 'reference'];
  const chapters = {};

  const App = {
    chapters,
    chapter(def) { chapters[def.id] = def; },
    go(id) { location.hash = id; },
    markVisited(id) {
      const v = UI.store.get('visited', {});
      v[id] = true;
      UI.store.set('visited', v);
    },
    // rail: module code and state (patch earned = filled, started = ring)
    refreshRail() {
      const tl = document.getElementById('timeline');
      let html = '';
      for (const id of ORDER) {
        const c = chapters[id];
        if (!c) continue;
        if (id === 'toolkit') html += `<li class="sep">${T`Training`}</li>`;
        const m = Progress.MODULES[id];
        const state = m ? (Progress.complete(id) ? 'done' : Progress.count(id) ? 'started' : '') : '';
        const label = m ? `${m.code} · ${T(c.phase)}` : T(c.phase);
        const cur = (location.hash || '#home').slice(1) === id ? ' aria-current="page"' : '';
        html += `<li><a href="#${id}" data-id="${id}" class="${state}"${cur}><span class="phase">${label}</span><span class="ttl">${T(c.title)}</span></a></li>`;
      }
      tl.innerHTML = html;
    },
    // switch language: load its dictionaries, then redraw everything that shows text
    setLang(lang) {
      if (!I18N.LANGS[lang]) return;
      UI.store.set('lang', lang);
      return I18N.load(lang).then(() => {
        I18N.lang = lang;
        document.documentElement.lang = lang;
        App.translateStatic();
        App.refreshRail();
        route(true);
      });
    },
    // static shell text marked with data-i18n (text), data-i18n-title, data-i18n-aria
    translateStatic() {
      document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T(el.dataset.i18n); });
      document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = T(el.dataset.i18nTitle); });
      document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', T(el.dataset.i18nAria)); });
      document.querySelectorAll('[data-lang-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langSet === I18N.lang)));
    },
    start() {
      // a non-English first visit waits for its dictionaries before the first render
      if (!I18N.loaded[I18N.lang]) { I18N.load(I18N.lang).then(App.start); return; }
      const tl = document.getElementById('timeline');
      App.translateStatic();
      App.refreshRail();
      Progress.checkQual();
      const rail = document.getElementById('rail'), mb = document.getElementById('menu-btn');
      mb.addEventListener('click', () => { const o = rail.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o)); });
      tl.addEventListener('click', () => { rail.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); });
      Sym.observe(document.getElementById('page'));
      document.getElementById('theme-switch').addEventListener('click', (e) => { const m = e.target.dataset.themeSet; if (m) UI.theme.set(m); });
      document.getElementById('lang-switch').addEventListener('click', (e) => { const l = e.target.dataset.langSet; if (l) App.setLang(l); });
      UI.theme.refresh();
      window.addEventListener('hashchange', () => route());
      route();
    },
  };

  function route(keepScroll) {
    const y = window.scrollY;
    const id = (location.hash || '#home').slice(1);
    const c = chapters[id] || chapters.home;
    UI.cleanup();
    const page = document.getElementById('page');
    page.innerHTML = '';
    c.render(page);
    UI.typeset(page);
    document.querySelectorAll('#timeline a').forEach((a) => {
      if (a.dataset.id === c.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    App.markVisited(c.id);
    Primer.activate(page);
    // focus targets: a debrief link into ground school, or ?focus=<element id> (handy for links and screenshots)
    const focus = App.pendingFocus || new URLSearchParams(location.search).get('focus');
    App.pendingFocus = null;
    const target = focus && document.getElementById(focus);
    if (target && target.tagName === 'DETAILS') target.open = true;
    if (keepScroll === true) window.scrollTo(0, y);
    else if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }

  /* Shared chapter scaffolding */
  App.header = ({ eyebrow, title, lede, refs = [] }) => `
    <header class="header">
      <span class="eyebrow">${eyebrow}</span>
      <h1>${title}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ''}
      ${refs.length ? `<div class="refs">${refs.map((r) => `<span class="chip book">${r}</span>`).join('')}</div>` : ''}
    </header>`;
  App.next = (id) => {
    const i = ORDER.indexOf(id), n = chapters[ORDER[i + 1]];
    return n ? `<a class="card" href="#${n.id}" style="max-width:26rem"><span class="phase">${T`Next phase`} · ${T(n.phase)}</span><h3>${T(n.title)}</h3><p>${T(n.blurb || '')}</p></a>` : '';
  };

  window.App = App;
})();
