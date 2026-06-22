// Generates llms-full.txt — a condensed English version of the site content
// for AI crawlers — from the translation table in translate.js.
// Re-run after content changes:  node tools/build-llms-full.js
const fs = require('fs');
const vm = require('vm');

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

const SECTIONS = [
  ['/', 'Home — Acupuncture Monique St-Arnault (Montreal)'],
  ['/sport/', 'Sports acupuncture (incl. climbing, running, cycling, racquet sports, gymnastics)'],
  ['/blog/le-printemps/', 'Article: Spring, the Season of the Wood Element'],
  ['/blog/les-allergies-du-printemps/', 'Article: Spring Allergies'],
  ['/blog/le-tao/', 'Article: The Tao'],
];

let out = `# Acupuncture Monique St-Arnault — full site content (English)

Acupuncture clinic in Montreal (Rosemont / Lacordaire), Quebec, Canada.
Practitioner: Monique St-Arnault, acupuncturist since 1990, 30,000+ treatments, Shanghai internship (1991).
Appointments by phone: +1 (514) 778-7975 (Mon-Fri 9:00-20:00). Email: acumsta@hotmail.com.
Services: acupuncture, gua sha & cupping, moxibustion, energy dietetics, facial acupuncture, mind & relaxation.
French version: https://acupuncturemoniquestarnault.com/ — English: https://acupuncturemoniquestarnault.com/en/

`;

for (const [route, title] of SECTIONS) {
  out += `## ${title}\n\nURL: https://acupuncturemoniquestarnault.com/en${route}\n\n`;
  const seen = new Set();
  for (const en of Object.values(T[route] || {})) {
    const v = en.replace(/\n/g, ' ').trim();
    if (v.length < 25 || seen.has(v)) continue; // skip labels/buttons & duplicates
    seen.add(v);
    out += v + '\n\n';
  }
}
fs.writeFileSync('llms-full.txt', out);
console.log('wrote llms-full.txt (' + out.length + ' chars)');
