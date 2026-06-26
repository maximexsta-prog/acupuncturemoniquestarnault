// Blog generator — Markdown in, a real blog out. Zero dependencies (Node built-ins).
//
//   Source of truth : blog-content/<name>.md   (front-matter + Markdown)
//   Output          : blog/<slug>/index.html   (one page per post — generated)
//                     blog/index.html           (the blog listing — generated)
//                     blog/feed.xml             (RSS — generated)
//                     sitemap.xml               (post URLs appended, never removed)
//
// Each page clones the home page's head + header + footer chrome (same approach as
// make-sport.js) so it looks native and reuses the site's known-good links. The
// listing/feed AUTO-DISCOVER every post under blog/ (the original WordPress posts
// AND the Markdown ones) by reading each page's <title>/description/og:image; the
// original posts' publication dates come from blog-content/legacy-posts.json.
//
// Fail-safe by design: a bad file is skipped, each output is wrapped so a failure
// leaves the existing file untouched, and the script always exits 0 — it can run
// inside the deploy workflow without ever breaking the site.
//
// Run locally:  node tools/build-blog.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://acupuncturemoniquestarnault.com';
const HOME_TITLE = 'Accueil - Acupuncture Monique St-Arnault';
const HOME_DESC = "Depuis 1990, Monique St-Arnault offre des soins d'acupuncture personnalisés à Montréal. Douleur, stress, digestion, santé des femmes. Clinique Rosemont — (514) 778-7975.";
const BLOG_DESC = "Articles de Monique St-Arnault sur l'acupuncture, la médecine traditionnelle chinoise, les cinq éléments et les saisons.";
const SUFFIX_NAME = 'Acupuncture Monique St-Arnault';
const SRC = 'blog-content';

// ── tiny, safe Markdown → HTML (the subset a blog needs) ───────────────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
function xml(s) { return String(s).replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
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
    if (h) { html += `<h${h[1].length}>${inline(h[2].trim())}</h${h[1].length}>\n`; i++; continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { html += '<hr>\n'; i++; continue; }
    if (/^\s*>\s?/.test(line)) { const b = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) { b.push(lines[i].replace(/^\s*>\s?/, '')); i++; } html += `<blockquote>${inline(b.join(' '))}</blockquote>\n`; continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const b = []; while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { b.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; } html += '<ul>' + b.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>\n'; continue; }
    if (/^\s*\d+\.\s+/.test(line)) { const b = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { b.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; } html += '<ol>' + b.map((x) => `<li>${inline(x)}</li>`).join('') + '</ol>\n'; continue; }
    const b = [line]; i++;
    while (i < lines.length && !isBlockStart(lines[i])) { b.push(lines[i]); i++; }
    html += `<p>${inline(b.join(' ').trim())}</p>\n`;
  }
  return html;
}
function parseFront(src) {
  const m = String(src).match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  m[1].split('\n').forEach((line) => { const mm = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/); if (mm) data[mm[1].toLowerCase()] = mm[2].trim().replace(/^["']|["']$/g, ''); });
  return { data, body: m[2] };
}
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function frDate(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : (iso || ''); }
function rfc822(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : new Date(); return isNaN(d) ? '' : d.toUTCString(); }
function readMeta(html) {
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  return {
    title: t.replace(new RegExp('\\s*-\\s*' + SUFFIX_NAME + '\\s*$'), '').trim(),
    desc: (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '',
    image: (html.match(/og:image" content="([^"]*)"/) || [])[1] || '',
    date: ((html.match(/"datePublished":"([^"]*)"/) || [])[1] || '').slice(0, 10),
    noindex: /name="robots" content="[^"]*noindex/.test(html),
  };
}

const STYLE_POST = `<style>
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary);margin:0!important}
.elementor-718 .elementor-element-4fdf38d{display:none!important}
.msa-hero{height:360px;background:var(--e-global-color-primary) center/cover no-repeat}
.msa-article{max-width:780px;margin:0 auto;padding:54px 22px;color:var(--e-global-color-text);font-family:var( --e-global-typography-text-font-family ),"Jost",sans-serif;font-size:1.12em;line-height:1.8}
.msa-article .backlink{display:inline-block;margin-bottom:26px;color:var(--e-global-color-primary)!important;text-decoration:none!important;font-family:var( --e-global-typography-text-font-family ),"Jost",sans-serif;font-size:.9em}
.msa-article h1{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:2.5em;line-height:1.18;margin:0 0 12px}
.msa-article .meta{color:#a9b2a8;font-size:.82em;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px}
.msa-article .rule{width:54px;height:3px;background:var(--e-global-color-secondary);border:0;margin:0 0 32px}
.msa-article h2{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:1.72em;line-height:1.25;margin:44px 0 14px}
.msa-article h3{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:1.34em;margin:32px 0 10px}
.msa-article p{margin:0 0 20px}
.msa-article a{color:var(--e-global-color-primary)!important;text-decoration:underline!important;text-decoration-color:var(--e-global-color-secondary)!important;text-underline-offset:3px;text-transform:none!important;letter-spacing:normal!important}
.msa-article img{max-width:100%;height:auto;border-radius:14px;display:block;margin:32px auto;box-shadow:0 14px 32px rgba(24,42,35,.12)}
.msa-article blockquote{border-left:4px solid var(--e-global-color-secondary);margin:28px 0;padding:6px 24px;color:var(--e-global-color-primary);font-style:italic;font-size:1.05em}
.msa-article ul,.msa-article ol{padding-left:24px;margin:0 0 20px}
.msa-article li{margin:9px 0}
.msa-article hr{border:0;border-top:1px solid var(--e-global-color-ae87854);margin:38px 0}
.msa-article code{background:var(--e-global-color-01449a1);border:1px solid var(--e-global-color-ae87854);border-radius:5px;padding:1px 6px;font-size:.92em}
.msa-article .tags{margin-top:42px;padding-top:22px;border-top:1px solid var(--e-global-color-ae87854);font-size:.9em;color:#a9b2a8}
@media(max-width:767px){.msa-article{padding:30px 16px;font-size:1.06em}.msa-hero{height:220px}.msa-article h1{font-size:2em}}
</style>`;
const STYLE_BLOG = `<style>
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary);margin:0!important}
.elementor-718 .elementor-element-4fdf38d{display:none!important}
.msa-blog{max-width:900px;margin:0 auto;padding:48px 20px;color:var(--e-global-color-text)}
.msa-blog .bloghead{text-align:center;margin:0 0 40px}
.msa-blog .bloghead h1{color:var(--e-global-color-primary);margin:0 0 8px}
.msa-blog .bloghead p{color:#5d7d3a;font-family:"Federo",sans-serif;font-size:1.35em;margin:0}
.msa-blog .posts{display:grid;gap:22px}
.msa-blog .post{display:flex;gap:0;background:#fff;border:1px solid var(--e-global-color-193b8aa);border-radius:12px;overflow:hidden;text-decoration:none!important;transition:box-shadow .15s,transform .15s}
.msa-blog .post:hover{box-shadow:0 8px 26px rgba(0,0,0,.08);transform:translateY(-2px)}
.msa-blog .post .thumb{flex:0 0 220px;min-height:170px;background:#eef0ec center/cover no-repeat}
.msa-blog .post .body{padding:24px 26px}
.msa-blog .post h2{color:var(--e-global-color-primary)!important;margin:0 0 8px;font-size:1.45em;line-height:1.25}
.msa-blog .post .date{color:#9aa6a0;font-style:italic;font-size:.9em;margin:0 0 10px}
.msa-blog .post .excerpt{color:var(--e-global-color-text);line-height:1.6;margin:0}
@media(max-width:680px){.msa-blog .post{flex-direction:column}.msa-blog .post .thumb{flex:0 0 180px;width:100%}}
</style>`;

function main() {
  if (!fs.existsSync(SRC)) { console.log('build-blog: no blog-content/ — nothing to build.'); return; }
  const h = fs.readFileSync('index.html', 'utf8');
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
      .replace(`<title>${HOME_TITLE}</title>`, `<title>${esc(p.title)} - ${SUFFIX_NAME}</title>`)
      .split(`content="${HOME_TITLE}"`).join(`content="${attr(p.title)} - ${SUFFIX_NAME}"`)
      .split(HOME_DESC).join(attr(p.desc))
      .replace(`rel="canonical" href="${SITE}/"`, `rel="canonical" href="${p.url}"`)
      .replace(`hreflang="fr" href="${SITE}/"`, `hreflang="fr" href="${p.url}"`)
      .replace(`hreflang="x-default" href="${SITE}/"`, `hreflang="x-default" href="${p.url}"`)
      .split(`content="${SITE}/"`).join(`content="${p.url}"`);
    if (p.enUrl) out = out.replace(`hreflang="en" href="${SITE}/en/"`, `hreflang="en" href="${p.enUrl}"`);
    else out = out.replace(/\s*<link rel="alternate" hreflang="en"[^>]*>/g, '');
    if (p.image) out = out.replace(/(og:image" content=")[^"]*(")/g, `$1${p.image}$2`).replace(/(twitter:image" content=")[^"]*(")/g, `$1${p.image}$2`);
    if (p.noindex) out = out.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
    out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const ld = (p.ld || []).map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('');
    return out.replace('</head>', ld + (p.extraHead || '') + '</head>');
  }
  const orgLD = { '@type': 'Organization', name: SUFFIX_NAME, url: SITE };

  // ── 1) build a page for each Markdown post ───────────────────────────────
  const legacyDates = (() => { try { return JSON.parse(fs.readFileSync(path.join(SRC, 'legacy-posts.json'), 'utf8')); } catch (e) { return {}; } })();
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
      const image = data.image || '';
      const url = `${SITE}/blog/${slug}/`;
      const noindex = /^(1|true|yes|oui)$/i.test(data.noindex || '');
      const enUrl = /^(1|true|yes|oui)$/i.test(data.en || '') ? `${SITE}/en/blog/${slug}/` : '';
      const tags = (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      const ld = [
        { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description: desc, inLanguage: 'fr-CA', datePublished: date || undefined, dateModified: date || undefined, url, image: image || undefined, author: { '@type': 'Person', name: 'Monique St-Arnault' }, publisher: orgLD, mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Blogue', item: SITE + '/blog/' }, { '@type': 'ListItem', position: 3, name: title, item: url }] },
      ];
      const hero = image ? `<div class="msa-hero" style="background-image:url('${image.replace(/'/g, '%27')}')"></div>` : '';
      const content = `${STYLE_POST}
${hero}
<main id="content" class="msa-article">
  <a class="backlink" href="/blog/">← Tous les articles</a>
  <article>
    <h1>${esc(title)}</h1>
    ${date ? `<p class="meta">${esc(frDate(date))}</p>` : ''}
    <hr class="rule">
    ${renderMarkdown(body)}
    ${tags.length ? `<p class="tags">${tags.map((t) => '#' + esc(t)).join('&nbsp; &nbsp;')}</p>` : ''}
  </article>
</main>`;
      const dir = path.join('blog', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), rewriteHead({ title, desc, url, image, noindex, enUrl, ld }) + '\n' + content + '\n' + SUFFIX);
      console.log(`build-blog: wrote blog/${slug}/index.html`);
      built++;
    } catch (e) { console.warn('build-blog: SKIP ' + f + ' — ' + e.message); }
  }

  // ── 2) discover every post under blog/ (legacy + Markdown) ───────────────
  const posts = [];
  for (const d of fs.readdirSync('blog', { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = path.join('blog', d.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    try {
      const meta = readMeta(fs.readFileSync(file, 'utf8'));
      if (meta.noindex || !meta.title) continue;
      posts.push({ slug: d.name, title: meta.title, desc: meta.desc, image: meta.image, date: meta.date || legacyDates[d.name] || '' });
    } catch (e) { /* skip unreadable */ }
  }
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // ── 3) the blog listing (blog/index.html) ────────────────────────────────
  try {
    const cards = posts.map((p) => {
      const thumb = p.image ? `<div class="thumb" style="background-image:url('${p.image.replace(/'/g, '%27')}')"></div>` : '';
      return `<a class="post" href="/blog/${p.slug}/">${thumb}<div class="body"><h2>${p.title}</h2>${p.date ? `<p class="date">${esc(frDate(p.date))}</p>` : ''}<p class="excerpt">${p.desc}</p></div></a>`;
    }).join('\n');
    const url = `${SITE}/blog/`;
    const head = rewriteHead({
      title: 'Blogue', desc: BLOG_DESC, url, image: '',
      extraHead: `<link rel="alternate" type="application/rss+xml" title="Blogue — ${SUFFIX_NAME}" href="/blog/feed.xml">`,
      ld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: 'Blogue — ' + SUFFIX_NAME, url, description: BLOG_DESC, inLanguage: 'fr-CA', publisher: orgLD }],
    });
    const body = `${STYLE_BLOG}
<main id="content" class="msa-blog">
  <div class="bloghead"><h1>Blogue</h1><p>Acupuncture, médecine chinoise et saisons</p></div>
  <div class="posts">
${cards}
  </div>
</main>`;
    fs.writeFileSync(path.join('blog', 'index.html'), head + '\n' + body + '\n' + SUFFIX);
    console.log(`build-blog: wrote blog/index.html (${posts.length} posts listed)`);
  } catch (e) { console.warn('build-blog: index not rewritten — ' + e.message); }

  // ── 4) RSS feed (blog/feed.xml) ──────────────────────────────────────────
  try {
    const items = posts.slice(0, 20).map((p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${SITE}/blog/${p.slug}/</link>
      <guid>${SITE}/blog/${p.slug}/</guid>
      ${p.date ? `<pubDate>${rfc822(p.date)}</pubDate>` : ''}
      <description>${xml(p.desc)}</description>
    </item>`).join('\n');
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>Blogue — ${xml(SUFFIX_NAME)}</title>
    <link>${SITE}/blog/</link>
    <description>${xml(BLOG_DESC)}</description>
    <language>fr-CA</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel></rss>
`;
    fs.writeFileSync(path.join('blog', 'feed.xml'), feed);
    console.log('build-blog: wrote blog/feed.xml');
  } catch (e) { console.warn('build-blog: feed not written — ' + e.message); }

  // ── 5) ensure each post is in sitemap.xml (append only, never remove) ────
  try {
    if (fs.existsSync('sitemap.xml')) {
      let sm = fs.readFileSync('sitemap.xml', 'utf8');
      let added = 0;
      for (const p of posts) {
        const loc = `${SITE}/blog/${p.slug}/`;
        if (sm.indexOf(`<loc>${loc}</loc>`) >= 0) continue;
        const entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${p.date || new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        sm = sm.replace('</urlset>', entry + '</urlset>');
        added++;
      }
      if (added) { fs.writeFileSync('sitemap.xml', sm); console.log(`build-blog: added ${added} post(s) to sitemap.xml`); }
    }
  } catch (e) { console.warn('build-blog: sitemap not updated — ' + e.message); }

  console.log(`build-blog: done — ${built} post page(s) built, ${posts.length} listed.`);
}

try { main(); } catch (e) { console.warn('build-blog: skipped — ' + e.message); }
process.exit(0);
