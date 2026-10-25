/* Router and chapter registry. Each chapter file calls App.chapter({...}). */
(function () {
  'use strict';
  const ORDER = ['home', 'newton', 'orbits', 'rockets', 'ascent', 'maneuvers', 'moon', 'landing', 'entry', 'practice', 'reference'];
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
    start() {
      const tl = document.getElementById('timeline');
      const visited = UI.store.get('visited', {});
      let html = '';
      for (const id of ORDER) {
        const c = chapters[id];
        if (!c) continue;
        if (id === 'practice') html += '<li class="sep">Training</li>';
        html += `<li><a href="#${id}" data-id="${id}" class="${visited[id] ? 'done' : ''}"><span class="phase">${c.phase}</span><span class="ttl">${c.title}</span></a></li>`;
      }
      tl.innerHTML = html;
      const rail = document.getElementById('rail'), mb = document.getElementById('menu-btn');
      mb.addEventListener('click', () => { const o = rail.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o)); });
      tl.addEventListener('click', () => { rail.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); });
      Sym.observe(document.getElementById('page'));
      window.addEventListener('hashchange', route);
      route();
    },
  };

  function route() {
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
    const link = document.querySelector(`#timeline a[data-id="${c.id}"]`);
    if (link) link.classList.add('done');
    // ?focus=<element id> scrolls straight to a lab (handy for links and screenshots)
    const focus = new URLSearchParams(location.search).get('focus');
    const target = focus && document.getElementById(focus);
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
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
    return n ? `<a class="card" href="#${n.id}" style="max-width:26rem"><span class="phase">Next phase · ${n.phase}</span><h3>${n.title}</h3><p>${n.blurb || ''}</p></a>` : '';
  };

  window.App = App;
})();
