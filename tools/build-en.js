// Generates pre-rendered English pages under /en/ from the French pages,
// using the translation table in translate.js. Re-run after editing French
// copy or translations:  node tools/build-en.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://acupuncturemoniquestarnault.com';
const PAGES = {
  '/': 'index.html',
  '/blog/': 'blog/index.html',
  '/le-printemps/': 'le-printemps/index.html',
  '/les-allergies-du-printemps/': 'les-allergies-du-printemps/index.html',
  '/le-tao/': 'le-tao/index.html',
};

// ── extract T from translate.js ──────────────────────────────────────────
const src = fs.readFileSync('translate.js', 'utf8');
const sandbox = {
  localStorage: { getItem: () => null, setItem: () => {} },
  window: { location: { pathname: '/' } },
  document: { addEventListener: () => {} },
};
const captured = src.replace(/var T = \{/, 'globalThis.__T = {').replace(/\bT\b(?=\.|\[)/g, '__T');
vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(captured, sandbox);
const T = sandbox.__T;
if (!T) { console.error('could not extract T from translate.js'); process.exit(1); }

const norm = (s) => s.replace(/['‘’ʼ]/g, '’').replace(/[“”]/g, '”').replace(/ /g, ' ');
const decodeEnt = (s) =>
  s.replace(/&nbsp;|&#160;/g, ' ').replace(/&#0?39;|&apos;/g, "'").replace(/&#8217;|&rsquo;/g, '’')
   .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

function mapFor(route) {
  const m = {};
  for (const src of [T.common || {}, T[route] || {}]) for (const k of Object.keys(src)) m[norm(k)] = src[k];
  return m;
}

// ── translate visible text nodes (mirrors translate.js applyEN) ──────────
function translateBody(html, map) {
  const parts = html.split(/(<[^>]*>)/);
  let skip = null; // inside script/style/noscript/textarea
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<\s*(\/?)(script|style|noscript|textarea)\b/i);
      if (m) skip = m[1] ? null : m[2].toLowerCase();
      continue;
    }
    if (skip || !p.trim()) continue;
    const decoded = decodeEnt(p);
    const key = norm(decoded.trim());
    if (map[key] !== undefined) {
      parts[i] = decoded.replace(decoded.trim(), map[key]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }
  return parts.join('');
}

function translateTitle(title, map) {
  return title.split(' - ').map((part) => map[norm(part.trim())] !== undefined ? map[norm(part.trim())] : part).join(' - ');
}

const hreflang = (route) =>
  `<link rel="alternate" hreflang="fr" href="${SITE}${route}">\n<link rel="alternate" hreflang="en" href="${SITE}/en${route}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${route}">`;

// ── 1. inject hreflang into the French pages ─────────────────────────────
for (const [route, file] of Object.entries(PAGES)) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<link rel="alternate" hreflang[^>]*>\n?/g, ''); // idempotent
  html = html.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${hreflang(route)}`);
  fs.writeFileSync(file, html);
}

// ── 2. build /en/ copies ─────────────────────────────────────────────────
for (const [route, file] of Object.entries(PAGES)) {
  const map = mapFor(route);
  let html = fs.readFileSync(file, 'utf8');

  // head: language + canonical/og point at the EN URL
  html = html.replace(/<html\s+lang="fr-CA"/i, '<html lang="en"');
  html = html.replace(/(rel="canonical" href="[^"]*?)\.com\//, '$1.com/en/');
  html = html.replace(/(property="og:url" content="[^"]*?)\.com\//, '$1.com/en/');
  html = html.replace(/(property="og:locale" content=")fr_CA(")/, '$1en_CA$2');
  html = html.replace(/<title>([^<]*)<\/title>/, (_, t) => `<title>${translateTitle(decodeEnt(t), map)}</title>`);
  html = html.replace(/(<meta name="description" content=")([^"]*)(")/, (_, a, d, b) => {
    const k = norm(decodeEnt(d).trim());
    return a + (map[k] !== undefined ? map[k].replace(/"/g, '&quot;') : d) + b;
  });

  // internal links to translated pages -> /en/ equivalents
  html = html.replace(/href="(\/(?:blog\/|le-printemps\/|les-allergies-du-printemps\/|le-tao\/)?)"/g, (m, p) =>
    Object.prototype.hasOwnProperty.call(PAGES, p) ? `href="/en${p}"` : m);

  html = translateBody(html, map);

  const out = path.join('en', route === '/' ? '' : route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('built', out);
}
console.log('done');
