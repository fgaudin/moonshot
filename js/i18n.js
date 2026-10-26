/* Internationalisation. English is the source language and lives in the code.
   T`English ${x} text` (or T('English {$0} text', x)) looks the English string up in the current language's
   dictionary; interpolated values become placeholders {$0}, {$1}… in the key. Missing translations fall back
   to English. N`…` marks a data string for extraction without translating it (translate later with T(str)).
   Dictionaries: js/i18n/<lang>/<source file>.js, each calling I18N.add('<lang>', { 'English': 'Traduction' }). */
(function () {
  'use strict';
  const LANGS = { en: { name: 'English', locale: 'en-GB' }, fr: { name: 'Français', locale: 'fr-FR' }, de: { name: 'Deutsch', locale: 'de-DE' } };
  // one dictionary file per source file; keep in sync with the files in js/i18n/<lang>/
  const MANIFEST = ['app', 'ui', 'home', 'progress', 'newton', 'orbits', 'rockets', 'ascent', 'maneuvers', 'docking', 'moon', 'landing', 'entry', 'practice', 'symbols', 'primers', 'reference'];

  const I18N = {
    LANGS,
    lang: 'en',
    dicts: { fr: {}, de: {} },
    missing: new Set(),
    loaded: { en: true },
    add(lang, obj) { Object.assign(I18N.dicts[lang], obj); },
    locale: () => LANGS[I18N.lang].locale,
    decimalComma: () => I18N.lang !== 'en',
    // load a language's dictionary files (script tags, so it also works from file://)
    load(lang) {
      if (I18N.loaded[lang]) return Promise.resolve();
      return Promise.all(MANIFEST.map((name) => new Promise((res) => {
        const s = document.createElement('script');
        s.src = `js/i18n/${lang}/${name}.js`;
        s.onload = res; s.onerror = res;               // a missing file only means English fallback
        document.head.appendChild(s);
      }))).then(() => { I18N.loaded[lang] = true; });
    },
    initial() {
      let l = null;
      try { l = JSON.parse(localStorage.getItem('moonshot:lang')); } catch (e) { /* storage unavailable */ }
      if (!l && navigator.language) l = navigator.language.slice(0, 2);
      return LANGS[l] ? l : 'en';
    },
  };

  const lookup = (key) => {
    if (I18N.lang === 'en') return key;
    const d = I18N.dicts[I18N.lang];
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    I18N.missing.add(key);
    return key;
  };
  const fillArgs = (s, args) => (args.length ? s.replace(/\{\$(\d+)\}/g, (m, i) => (i < args.length ? args[i] : m)) : s);

  // T as a template tag or as a function
  function T(first, ...vals) {
    if (Array.isArray(first) && first.raw) {
      let key = first[0];
      for (let i = 1; i < first.length; i++) key += `{$${i - 1}}` + first[i];
      return fillArgs(lookup(key), vals);
    }
    if (first == null) return first;
    return fillArgs(lookup(String(first)), vals);
  }
  // N: mark for extraction only (data defined at load time, translated with T(str) where displayed)
  function N(first, ...vals) {
    if (Array.isArray(first) && first.raw) { let s = first[0]; for (let i = 1; i < first.length; i++) s += vals[i - 1] + first[i]; return s; }
    return first;
  }

  window.I18N = I18N; window.T = T; window.N = N;
  I18N.lang = I18N.initial();
  document.documentElement.lang = I18N.lang;
})();
