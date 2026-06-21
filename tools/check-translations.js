// Reports visible French strings in each page that have no entry in translate.js,
// so EN mode doesn't silently show French. Heuristic: a text chunk counts as
// "French" if it contains accented characters or common French words.
// Exit code is always 0 — this is a warning report, not a gate.
const fs = require('fs');
const vm = require('vm');

// Extract the T table by running translate.js with stubs and intercepting it.
const src = fs.readFileSync('translate.js', 'utf8');
const sandbox = {
  localStorage: { getItem: () => null, setItem: () => {} },
  window: { location: { pathname: '/' } },
  document: { addEventListener: () => {} },
};
// expose T: the IIFE keeps it private, so re-run with `var T =` captured.
const captured = src.replace(/var T = \{/, 'globalThis.__T = {').replace(/\bT\b(?=\.|\[)/g, '__T');
vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(captured, sandbox);
const T = sandbox.__T;
if (!T) { console.error('could not extract T from translate.js'); process.exit(1); }

const norm = (s) => s.replace(/['‘’ʼ]/g, '’').replace(/[“”]/g, '”').replace(/ /g, ' ');

const pages = {
  '/': 'index.html',
  '/blog/': 'blog/index.html',
  '/blog/le-printemps/': 'blog/le-printemps/index.html',
  '/blog/les-allergies-du-printemps/': 'blog/les-allergies-du-printemps/index.html',
  '/blog/le-tao/': 'blog/le-tao/index.html',
};

const frenchish = (t) =>
  /[àâçéèêëîïôûùüœÀÂÇÉÈÊËÎÏÔÛ]/.test(t) || /\b(les?|la|des|une?|pour|avec|votre|nous|vous)\b/i.test(t);

let total = 0;
for (const [route, file] of Object.entries(pages)) {
  const map = {};
  for (const m of [T.common || {}, T[route] || {}]) for (const k of Object.keys(m)) map[norm(k)] = true;
  const html = fs
    .readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const chunks = html
    .split(/<[^>]+>/)
    .map((t) => t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 2 && !/^[\d\s\W]+$/.test(t));
  const missing = [...new Set(chunks.filter((t) => frenchish(t) && !map[norm(t)]))];
  if (missing.length) {
    console.log(`\n${route} — ${missing.length} untranslated string(s):`);
    for (const t of missing) console.log('  •', t.length > 110 ? t.slice(0, 110) + '…' : t);
    total += missing.length;
  }
}
console.log(total ? `\n${total} potentially untranslated strings.` : 'All visible French strings have translations.');
