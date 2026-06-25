// One-time migration helper: extract the French article from a WordPress/Elementor
// post page and WRITE it to blog-content/<slug>.md (front-matter + Markdown body).
// Title/description/image are read from the page; date/tags/en come from META below.
//   node tools/wp-to-md.js <slug>
const fs = require('fs');
const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/wp-to-md.js <slug>'); process.exit(1); }
const h = fs.readFileSync(`blog/${slug}/index.html`, 'utf8');

// publication date (April 19 2026 per the page meta), tags, and en=has English version
const META = {
  'le-printemps': { date: '2026-04-19', tags: '5 éléments, Médecine chinoise, Printemps', en: true },
  'le-tao': { date: '2026-04-19', tags: 'Tao, Médecine chinoise, Qi', en: true },
  'les-allergies-du-printemps': { date: '2026-04-19', tags: 'Allergies, Médecine chinoise, Printemps', en: true },
};
const meta = META[slug] || { date: '', tags: '', en: false };

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#39;': "'", '&nbsp;': ' ', '&#8217;': '’', '&#8216;': '‘', '&#8230;': '…', '&#8211;': '–', '&#8212;': '—', '&#8220;': '“', '&#8221;': '”', '&laquo;': '«', '&raquo;': '»' };
function decode(s) { return s.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] || m); }
function containerInner(idx) { const open = h.indexOf('>', idx) + 1; let depth = 1; const re = /<div\b|<\/div>/g; re.lastIndex = open; let m; while ((m = re.exec(h))) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) return h.slice(open, m.index); } return h.slice(open); }
function inlineMd(t) {
  t = t.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, u, x) => `[${x.replace(/<[^>]+>/g, '').trim()}](${u})`);
  t = t.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**').replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  t = t.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
  return decode(t).replace(/\s+/g, ' ').trim();
}
function blockMd(html) {
  let s = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, lv, t) => `\n## ${inlineMd(t)}\n\n`);
  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (m, t) => `- ${inlineMd(t)}\n`);
  s = s.replace(/<\/(ul|ol)>/gi, '\n').replace(/<(ul|ol)\b[^>]*>/gi, '\n');
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, t) => `\n> ${inlineMd(t)}\n\n`);
  s = s.replace(/<img\b[^>]*src="([^"]*)"[^>]*>/gi, (m, u) => `\n![](${u})\n\n`);
  s = s.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (m, t) => { const x = inlineMd(t); return x ? `\n${x}\n\n` : ''; });
  s = s.replace(/<[^>]+>/g, '');
  return decode(s).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const title = ((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/\s*-\s*Acupuncture Monique St-Arnault\s*$/, '').trim();
const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const image = (h.match(/og:image" content="([^"]*)"/) || [])[1] || '';

const body = [];
const re = /elementor-widget-(heading|text-editor)\b/g; let m;
while ((m = re.exec(h))) {
  const c = h.indexOf('<div class="elementor-widget-container">', m.index);
  if (c < 0 || c - m.index > 400) continue;
  const inner = containerInner(c);
  const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  re.lastIndex = c + 1;
  if (/<h1\b/i.test(inner)) continue; // title/meta block
  if (/^Tags\s*:/.test(text) || /Partager cet article|Articles récents|Tout droits réservés|Catégorie\b/.test(text)) break; // footer reached
  const md = blockMd(inner);
  if (md) body.push(md);
}
// drop a leading heading that just repeats the title
if (body.length && body[0].replace(/^##\s*/, '').toLowerCase().replace(/[’']/g, "'") === title.toLowerCase().replace(/[’']/g, "'")) body.shift();

const fm = ['---', `titre: ${title}`, `description: ${desc}`, `date: ${meta.date}`, `slug: ${slug}`, `tags: ${meta.tags}`, image ? `image: ${image}` : '', meta.en ? 'en: true' : '', '---', ''].filter((l) => l !== '').join('\n');
const out = fm + '\n' + body.join('\n\n') + '\n';
fs.writeFileSync(`blog-content/${slug}.md`, out);
console.log(`wrote blog-content/${slug}.md (${out.length} chars, ${body.length} blocks)`);
