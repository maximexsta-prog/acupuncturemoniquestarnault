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
  '/blog/le-printemps/': 'blog/le-printemps/index.html',
  '/blog/les-allergies-du-printemps/': 'blog/les-allergies-du-printemps/index.html',
  '/blog/le-tao/': 'blog/le-tao/index.html',
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

// English FAQPage for /en/ (mirrors the French FAQ on the home page)
const EN_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is acupuncture?', acceptedAnswer: { '@type': 'Answer', text: 'Acupuncture is a traditional Chinese medicine practice that uses fine needles to stimulate precise points on the body, promoting the balance of Qi (vital energy) and overall well-being.' } },
    { '@type': 'Question', name: 'What conditions can acupuncture help with?', acceptedAnswer: { '@type': 'Answer', text: 'Acupuncture effectively addresses chronic and acute pain, stress and anxiety, digestive disorders, women’s health (menstrual cycles, menopause, fertility), seasonal allergies and insomnia, and promotes deep relaxation.' } },
    { '@type': 'Question', name: 'Where is the Acupuncture Monique St-Arnault clinic in Montreal?', acceptedAnswer: { '@type': 'Answer', text: 'The clinic is located in Montreal in the Rosemont neighbourhood, near Lacordaire. Postal code: H1M 2N1. Phone: (514) 778-7975.' } },
    { '@type': 'Question', name: 'How do I book an acupuncture appointment?', acceptedAnswer: { '@type': 'Answer', text: 'Appointments are booked by phone at (514) 778-7975 (Monday to Friday, 9:00 AM to 8:00 PM). If Monique is in a session, leave a voicemail or text at the same number and she will call you back personally. Email: acumsta@hotmail.com.' } },
    { '@type': 'Question', name: 'How long has Monique St-Arnault practiced acupuncture?', acceptedAnswer: { '@type': 'Answer', text: 'Monique St-Arnault has practiced acupuncture since 1990 — over 35 years of experience in traditional Chinese medicine and personalized care in Montreal, with more than 30,000 treatments given.' } },
    { '@type': 'Question', name: 'What services does the Acupuncture Monique St-Arnault clinic offer?', acceptedAnswer: { '@type': 'Answer', text: 'The clinic offers acupuncture, gua sha and cupping, moxibustion, energy dietetics (Chinese dietary therapy), mind and relaxation care, and facial acupuncture.' } },
  ],
};

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

  // internal links to translated pages -> /en/ equivalents (longest path first
  // so /blog/le-tao/ is rewritten before the /blog/ listing link)
  for (const p of Object.keys(PAGES).sort((a, b) => b.length - a.length)) {
    html = html.split(`href="${p}"`).join(`href="/en${p}"`);
  }

  html = translateBody(html, map);

  // English structured data on /en/ pages
  html = html.replace(/"inLanguage": "fr-CA"/g, '"inLanguage": "en-CA"');
  if (route === '/') {
    html = html.replace(/<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/, '<script type="application/ld+json">' + JSON.stringify(EN_FAQ) + '</script>');
    html = html.replace(/"description": "Depuis 1990[^"]*"/, '"description": ' + JSON.stringify('Since 1990, Monique St-Arnault has offered personalized acupuncture care in Montreal. Specialized in pain management, stress, digestion and women’s health.'));
  }

  const out = path.join('en', route === '/' ? '' : route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('built', out);
}
console.log('done');
