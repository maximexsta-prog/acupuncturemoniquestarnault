// Blog generator — turns every Markdown file in blog-content/ into a real blog
// post page. It clones the home page's head + header + footer chrome (exactly
// like make-sport.js) so each post looks native and reuses the site's known-good
// links, then injects the rendered Markdown in between. Zero dependencies (Node
// built-ins only). It NEVER throws fatally: a bad file is skipped, and the whole
// script always exits 0 so it can run inside the deploy workflow without ever
// breaking the site build.
//
//   Source of truth : blog-content/<name>.md   (front-matter + Markdown)
//   Output          : blog/<slug>/index.html   (generated — do not hand-edit)
//
// Run locally:  node tools/build-blog.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://acupuncturemoniquestarnault.com';
const HOME_TITLE = 'Accueil - Acupuncture Monique St-Arnault';
const HOME_DESC = "Depuis 1990, Monique St-Arnault offre des soins d'acupuncture personnalisés à Montréal. Douleur, stress, digestion, santé des femmes. Clinique Rosemont — (514) 778-7975.";
const SRC = 'blog-content';

// ── tiny, safe Markdown → HTML (the subset a blog actually needs) ──────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
function inline(s) {
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => `<img src="${u}" alt="${attr(a)}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>').replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function isBlockStart(l) { return /^\s*$/.test(l) || /^(#{1,6})\s/.test(l) || /^\s*>\s?/.test(l) || /^\s*[-*+]\s+/.test(l) || /^\s*\d+\.\s+/.test(l) || /^\s*(---|\*\*\*|___)\s*$/.test(l); }
function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  let html = '', i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const lvl = h[1].length; html += `<h${lvl}>${inline(h[2].trim())}</h${lvl}>\n`; i++; continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { html += '<hr>\n'; i++; continue; }
    if (/^\s*>\s?/.test(line)) { const buf = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; } html += `<blockquote>${inline(buf.join(' '))}</blockquote>\n`; continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const buf = []; while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; } html += '<ul>' + buf.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>\n'; continue; }
    if (/^\s*\d+\.\s+/.test(line)) { const buf = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; } html += '<ol>' + buf.map((x) => `<li>${inline(x)}</li>`).join('') + '</ol>\n'; continue; }
    const buf = [line]; i++;
    while (i < lines.length && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    html += `<p>${inline(buf.join(' ').trim())}</p>\n`;
  }
  return html;
}
function parseFront(src) {
  const m = String(src).match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  m[1].split('\n').forEach((line) => {
    const mm = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (mm) data[mm[1].toLowerCase()] = mm[2].trim().replace(/^["']|["']$/g, '');
  });
  return { data, body: m[2] };
}
function frDate(iso) {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${+m[3]} ${months[+m[2] - 1]} ${m[1]}` : (iso || '');
}

// ── the article's own styling (reuses the site's brand colours/fonts) ──────
const STYLE = `<style>
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary);margin:0!important}
.elementor-718 .elementor-element-4fdf38d{display:none!important}
.msa-article{max-width:760px;margin:0 auto;padding:48px 20px;color:var(--e-global-color-text);font-size:1.08em;line-height:1.7}
.msa-article h1{color:var(--e-global-color-primary);font-size:2.1em;line-height:1.2;margin:0 0 10px}
.msa-article .meta{color:#9aa6a0;font-style:italic;margin:0 0 26px}
.msa-article h2{color:var(--e-global-color-primary);margin:38px 0 14px}
.msa-article h3{color:var(--e-global-color-primary);margin:28px 0 10px}
.msa-article p{margin:0 0 18px}
.msa-article a{color:var(--e-global-color-primary)!important;text-decoration:underline!important;text-transform:none!important;letter-spacing:normal!important}
.msa-article img{max-width:100%;height:auto;border-radius:8px;display:block;margin:24px auto}
.msa-article blockquote{border-left:4px solid #5d7d3a;margin:24px 0;padding:8px 22px;color:#5d7d3a;background:#fff;border-radius:0 8px 8px 0;font-style:italic}
.msa-article ul,.msa-article ol{padding-left:22px;margin:0 0 18px}
.msa-article li{margin:8px 0}
.msa-article hr{border:0;border-top:1px solid var(--e-global-color-ae87854);margin:34px 0}
.msa-article code{background:#fff;border:1px solid var(--e-global-color-ae87854);border-radius:5px;padding:1px 6px;font-size:.92em}
.msa-article .tags{margin-top:36px;font-size:.9em;color:#9aa6a0;font-style:italic}
@media(max-width:767px){.msa-article{padding:28px 16px;font-size:1.04em}}
</style>`;

function main() {
  if (!fs.existsSync(SRC)) { console.log('build-blog: no blog-content/ folder — nothing to build.'); return; }
  const h = fs.readFileSync('index.html', 'utf8');
  // clone the home page's head + header (PREFIX) and footer (SUFFIX)
  function matchDiv(s) { const re = /<div\b|<\/div>/g; re.lastIndex = s; let d = 0, m; while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return m.index + m[0].length; } throw new Error('unbalanced <div> in index.html'); }
  const pageOpen = h.indexOf('<div data-elementor-type="wp-page"');
  const bodyStart = h.indexOf('>', pageOpen) + 1;
  const pageEnd = matchDiv(pageOpen);
  const kids = [];
  for (let pos = bodyStart; pos < pageEnd;) { const nx = h.indexOf('<div', pos); if (nx < 0 || nx >= pageEnd) break; const end = matchDiv(nx); const cls = (h.slice(nx, h.indexOf('>', nx)).match(/class="([^"]*)"/) || [])[1] || ''; kids.push({ start: nx, end, cls }); pos = end; }
  let nHeader = 0; while (nHeader < kids.length && /\bheader\b/.test(kids[nHeader].cls)) nHeader++;
  const PREFIX = h.slice(0, kids[nHeader - 1].end);
  const SUFFIX = h.slice(kids[kids.length - 1].start);

  function rewriteHead(p) {
    let out = PREFIX
      .replace(`<title>${HOME_TITLE}</title>`, `<title>${esc(p.title)} - Acupuncture Monique St-Arnault</title>`)
      .split(`content="${HOME_TITLE}"`).join(`content="${attr(p.title)} - Acupuncture Monique St-Arnault"`)
      .split(HOME_DESC).join(attr(p.desc))
      .replace(`rel="canonical" href="${SITE}/"`, `rel="canonical" href="${p.url}"`)
      .replace(`hreflang="fr" href="${SITE}/"`, `hreflang="fr" href="${p.url}"`)
      .replace(`hreflang="x-default" href="${SITE}/"`, `hreflang="x-default" href="${p.url}"`)
      .split(`content="${SITE}/"`).join(`content="${p.url}"`)
      .replace(/\s*<link rel="alternate" hreflang="en"[^>]*>/g, '');
    if (p.noindex) out = out.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
    out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const ld = [
      { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.desc, inLanguage: 'fr-CA', datePublished: p.date || undefined, dateModified: p.date || undefined, url: p.url, author: { '@type': 'Person', name: 'Monique St-Arnault' }, publisher: { '@type': 'Organization', name: 'Acupuncture Monique St-Arnault', url: SITE }, mainEntityOfPage: { '@type': 'WebPage', '@id': p.url } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Blogue', item: SITE + '/blog/' }, { '@type': 'ListItem', position: 3, name: p.title, item: p.url }] },
    ];
    return out.replace('</head>', ld.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('') + '</head>');
  }

  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');
  let built = 0;
  for (const f of files) {
    try {
      const { data, body } = parseFront(fs.readFileSync(path.join(SRC, f), 'utf8'));
      if ((data.status || '').toLowerCase() === 'draft') { console.log('build-blog: skip draft', f); continue; }
      const slug = (data.slug || f.replace(/\.md$/i, '')).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      const title = data.titre || data.title || slug;
      const desc = data.description || '';
      const date = data.date || '';
      const url = `${SITE}/blog/${slug}/`;
      const noindex = /^(1|true|yes|oui)$/i.test(data.noindex || '');
      const tags = (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      const content = `${STYLE}
<main id="content" class="msa-article">
  <article>
    <h1>${esc(title)}</h1>
    ${date ? `<p class="meta">${esc(frDate(date))}</p>` : ''}
    ${renderMarkdown(body)}
    ${tags.length ? `<p class="tags">${tags.map((t) => '#' + esc(t)).join('&nbsp; &nbsp;')}</p>` : ''}
  </article>
</main>`;
      const dir = path.join('blog', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), rewriteHead({ title, desc, url, date, noindex }) + '\n' + content + '\n' + SUFFIX);
      console.log(`build-blog: wrote blog/${slug}/index.html`);
      built++;
    } catch (e) { console.warn('build-blog: SKIP ' + f + ' — ' + e.message); }
  }
  console.log(`build-blog: done, ${built} post(s).`);
}

try { main(); } catch (e) { console.warn('build-blog: skipped — ' + e.message); }
process.exit(0);
