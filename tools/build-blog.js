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
// Banniere d'ambiance commune a TOUS les articles : la meme image que la
// section « Pour prendre rendez-vous » de la page d'accueil, pour que le
// blogue et le site respirent pareil. L'image propre a chaque article
// (champ « image: » de l'en-tete) ne sert plus de banniere : elle descend
// dans le texte, apres le premier paragraphe (voir insererImageArticle).
const HERO_AMBIANCE = '/wp-content/uploads/2026/04/stones-and-bamboo-sprout-in-water-on-dark-backgrou-2026-01-05-19-12-47-utc.jpg';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
function xml(s) { return String(s).replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Place l'image de l'article APRES le premier paragraphe : le lecteur entre
// par le texte, l'image vient appuyer le propos au lieu de l'annoncer.
// Rien a faire de plus en ecrivant un article — il suffit du champ « image: ».
function insererImageArticle(html, src, alt) {
  if (!src) return html;
  const figure = `\n<figure class="post-image"><img src="${attr(src)}" alt="${attr(alt)}" loading="lazy"></figure>\n`;
  const fin = html.indexOf('</p>');
  if (fin < 0) return figure + html;           // article sans paragraphe : image en tete
  const coupe = fin + '</p>'.length;
  return html.slice(0, coupe) + figure + html.slice(coupe);
}
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
.msa-article .byline{color:var(--e-global-color-primary);font-size:.92em;margin:0 0 4px}
.msa-article .meta{color:#a9b2a8;font-size:.82em;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px}
.msa-article .rule{width:54px;height:3px;background:var(--e-global-color-secondary);border:0;margin:0 0 32px}
.msa-article h2{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:1.72em;line-height:1.25;margin:44px 0 14px}
.msa-article h3{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:1.34em;margin:32px 0 10px}
.msa-article p{margin:0 0 20px}
.msa-article a{color:var(--e-global-color-primary)!important;text-decoration:underline!important;text-decoration-color:var(--e-global-color-secondary)!important;text-underline-offset:3px;text-transform:none!important;letter-spacing:normal!important}
.msa-article img{max-width:100%;height:auto;border-radius:14px;display:block;margin:32px auto;box-shadow:0 14px 32px rgba(24,42,35,.12)}
.msa-article figure.post-image{margin:36px 0}
.msa-article figure.post-image img{margin:0 auto}
.msa-article figure.post-image figcaption{margin-top:10px;text-align:center;font-size:.86em;font-style:italic;color:#a9b2a8}
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
/* ── Mise en page d'article : couverture titree + deux colonnes ───────── */
.msa-cover{position:relative;min-height:470px;display:flex;align-items:center;justify-content:center;text-align:center;padding:130px 22px 58px;background:var(--e-global-color-primary) center/cover no-repeat}
.msa-cover::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,42,35,.60),rgba(24,42,35,.50))}
.msa-cover .in{position:relative;max-width:860px}
.msa-cover h1{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:#fff;font-size:clamp(1.9em,5vw,3.3em);line-height:1.14;letter-spacing:.06em;text-transform:uppercase;margin:0;text-wrap:balance}
.msa-cover .sub{color:rgba(255,255,255,.88);font-size:clamp(1em,2.2vw,1.3em);line-height:1.5;margin:18px 0 0}
.msa-cover .fil{color:rgba(255,255,255,.82);font-size:.92em;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:center;align-items:center}
.msa-cover .fil i{font-style:normal;color:var(--e-global-color-193b8aa)}
.msa-wrap{max-width:1180px;margin:0 auto;padding:62px 22px 74px;display:grid;grid-template-columns:minmax(0,1fr) 328px;gap:54px;align-items:start}
.msa-wrap .msa-article{max-width:none;margin:0;padding:0}
@media(max-width:940px){.msa-wrap{grid-template-columns:1fr;gap:46px;padding-top:44px}}
.msa-side{display:flex;flex-direction:column;gap:30px}
.msa-side h2{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:1.45em;margin:0 0 16px}
.side-search{display:flex;background:#fff;border:1px solid var(--e-global-color-ae87854)}
.side-search input{flex:1;min-width:0;border:0;padding:15px 16px;font:400 1em Jost,sans-serif;color:var(--e-global-color-primary);background:transparent}
.side-search input:focus{outline:2px solid var(--e-global-color-193b8aa);outline-offset:-2px}
.side-search button{border:0;background:var(--e-global-color-193b8aa);color:var(--e-global-color-primary);padding:0 20px;cursor:pointer;font-size:1.15em;line-height:1}
.side-post{display:block;position:relative;min-height:188px;text-decoration:none!important;background:var(--e-global-color-primary) center/cover no-repeat;margin-bottom:18px}
.side-post::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,42,35,.12),rgba(24,42,35,.80))}
.side-post .t{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;min-height:188px;padding:20px}
.side-post .t b{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:#fff;font-size:1.1em;line-height:1.26;text-transform:uppercase;letter-spacing:.03em}
.side-post .t span{color:rgba(255,255,255,.8);font-size:.76em;letter-spacing:.1em;text-transform:uppercase;margin-top:9px}
.side-cats{background:var(--e-global-color-primary);padding:26px 28px}
.side-cats h2{color:#fff;border-bottom:1px solid rgba(255,255,255,.18);padding-bottom:14px}
.side-cats ul{list-style:none;margin:0;padding:0}
.side-cats li{margin:15px 0}
.side-cats a{color:rgba(255,255,255,.9)!important;text-decoration:none!important;font-size:.83em;letter-spacing:.11em;text-transform:uppercase;display:flex;gap:11px}
.side-cats a::before{content:"→";color:var(--e-global-color-193b8aa)}
.side-cats a:hover{color:#fff!important}
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

  const enSlug = (v) => String(v).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

  // La barre laterale de CHAQUE article montre les plus recents : il faut donc
  // connaitre toute la liste avant de construire la premiere page.
  const metas = [];
  for (const f of files) {
    try {
      const { data } = parseFront(fs.readFileSync(path.join(SRC, f), 'utf8'));
      if ((data.status || '').toLowerCase() === 'draft') continue;
      if (/^(1|true|yes|oui)$/i.test(data.noindex || '')) continue;
      metas.push({ slug: enSlug(data.slug || f.replace(/\.md$/i, '')), title: data.titre || data.title || '',
                   date: data.date || '', image: data.image || '' });
    } catch (e) { /* fichier illisible : ignore */ }
  }
  metas.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const CATEGORIES = [['problemes-saisonniers', 'Problèmes saisonniers'], ['medecine-chinoise', 'Médecine chinoise'],
                      ['feng-shui', 'Feng Shui'], ['acupuncture', 'Acupuncture'], ['5-elements', '5 Éléments']];

  function barreLaterale(slugCourant) {
    const recents = metas.filter((m) => m.slug !== slugCourant).slice(0, 2);
    const cartes = recents.map((p) => {
      const fond = p.image ? ` style="background-image:url('${p.image.replace(/'/g, '%27')}')"` : '';
      return `<a class="side-post" href="/blog/${p.slug}/"${fond}><span class="t"><b>${esc(p.title)}</b>`
           + `${p.date ? `<span>${esc(frDate(p.date))}</span>` : ''}</span></a>`;
    }).join('');
    return `<section><form class="side-search" action="/blog/" method="get" role="search">`
      + `<input type="search" name="q" placeholder="Rechercher…" aria-label="Rechercher un article">`
      + `<button type="submit" aria-label="Lancer la recherche">&#9906;</button></form></section>`
      + (cartes ? `<section><h2>Articles récents</h2>${cartes}</section>` : '')
      + `<section class="side-cats"><h2>Catégorie</h2><ul>`
      + CATEGORIES.map(([s, n]) => `<li><a href="/category/${s}/">${esc(n)}</a></li>`).join('')
      + `</ul></section>`;
  }

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
      // Monique signe tout par defaut : rien a ecrire dans l'en-tete d'un
      // nouvel article. Un champ « auteur: » permet d'y deroger au besoin.
      const auteur = (data.auteur || data.author || 'Monique St-Arnault').trim();
      const url = `${SITE}/blog/${slug}/`;
      const noindex = /^(1|true|yes|oui)$/i.test(data.noindex || '');
      const enUrl = /^(1|true|yes|oui)$/i.test(data.en || '') ? `${SITE}/en/blog/${slug}/` : '';
      const tags = (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      const ld = [
        { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description: desc, inLanguage: 'fr-CA', datePublished: date || undefined, dateModified: date || undefined, url, image: image || undefined, author: { '@type': 'Person', name: auteur }, publisher: orgLD, mainEntityOfPage: { '@type': 'WebPage', '@id': url } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Blogue', item: SITE + '/blog/' }, { '@type': 'ListItem', position: 3, name: title, item: url }] },
      ];
      // Le titre, le sous-titre et le fil « auteur > date > categorie » vivent
      // dans la couverture, en surimpression de l'image d'ambiance.
      const sousTitre = (data.sous_titre || data.soustitre || data.subtitle || '').trim();
      const categorie = (data.categorie || data.category || tags[0] || '').trim();
      const fil = [esc(auteur), date ? esc(frDate(date)) : '', categorie ? esc(categorie) : '']
        .filter(Boolean).join(' <i>›</i> ');
      const content = `${STYLE_POST}
<header class="msa-cover" style="background-image:url('${HERO_AMBIANCE.replace(/'/g, '%27')}')">
  <div class="in">
    <h1>${esc(title)}</h1>
    ${sousTitre ? `<p class="sub">${esc(sousTitre)}</p>` : ''}
    <p class="fil">${fil}</p>
  </div>
</header>
<div class="msa-wrap">
  <main id="content" class="msa-article">
    <a class="backlink" href="/blog/">← Tous les articles</a>
    <article>
      ${insererImageArticle(renderMarkdown(body), image, data.image_alt || data.alt || title)}
      ${tags.length ? `<p class="tags">${tags.map((t) => '#' + esc(t)).join('&nbsp; &nbsp;')}</p>` : ''}
    </article>
  </main>
  <aside class="msa-side">${barreLaterale(slug)}</aside>
</div>`;
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
    const RECHERCHE = `<script>
(function(){
  // Filtre la liste selon ?q= — le champ de recherche de la barre laterale
  // pointe ici. Tout se passe dans le navigateur : aucun serveur necessaire.
  var q=(new URLSearchParams(location.search).get('q')||'').trim().toLowerCase();
  if(!q) return;
  var liste=document.querySelector('.msa-blog'); if(!liste) return;
  var n=0;
  liste.querySelectorAll('.post').forEach(function(p){
    var ok=p.textContent.toLowerCase().indexOf(q)>=0;
    p.hidden=!ok; if(ok) n++;
  });
  var avis=document.createElement('p');
  avis.style.cssText='margin:0 0 26px;color:var(--e-global-color-text)';
  avis.textContent=n?(n+' article'+(n>1?'s':'')+' pour « '+q+' »')
                    :('Aucun article pour « '+q+' ».');
  liste.parentNode.insertBefore(avis,liste);
})();
</script>`;
    fs.writeFileSync(path.join('blog', 'index.html'), head + '\n' + body + '\n' + RECHERCHE + '\n' + SUFFIX);
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

  // ── 6) page d'accueil : les deux articles mis en avant suivent les parutions ─
  // La page portait deux articles ecrits en dur depuis l'export WordPress, qui
  // ne bougeaient plus. On y reinjecte les deux plus recents a chaque build,
  // pour que publier un article suffise a rafraichir l'accueil.
  function carteAccueil(p, langue) {
    const url = (langue === 'en' ? '/en' : '') + `/blog/${p.slug}/`;
    const img = p.image || '';
    const par = langue === 'en' ? 'by ' : 'Par ';
    const quand = langue === 'en' ? p.date : frDate(p.date);
    const vignette = img
      ? `<div class="jkit-thumb"><a aria-label="${attr(p.title)}" href="${url}"><div class="thumbnail-container "> <img loading="lazy" decoding="async" width="540" height="360" src="${attr(img)}" class="attachment-full size-full wp-post-image" alt="${attr(p.title)}"> </div></a></div>`
      : '';
    return `<article class="jkit-post post type-post status-publish format-standard has-post-thumbnail hentry">`
      + ` ${vignette} <div class="jkit-postblock-content">`
      + `<h3 class="jkit-post-title"> <a href="${url}">${esc(p.title)}</a> </h3>`
      + `<div class="jkit-post-meta"><div class="jkit-meta-author icon-position-before">`
      + `<span class="by">${par}</span><a href="/author/admin-msta/">Monique St-Arnault</a></div>`
      + `<div class="jkit-meta-date icon-position-before">${esc(quand || '')}</div></div>`
      + `<div class="jkit-post-meta-bottom"> </div></div> </article>`;
  }

  function majAccueil(fichier, choisis, langue) {
    if (!fs.existsSync(fichier) || choisis.length < 2) return;
    let h = fs.readFileSync(fichier, 'utf8');
    let i = 0;
    // Le motif s'arrete au DERNIER </article> du bloc : entre deux articles on
    // lit « </article> <article », qui ne correspond pas a « </article></div> ».
    const avant = h;
    h = h.replace(/(<div class="jkit-posts jkit-ajax-flag">)[\s\S]*?<\/article>\s*<\/div>/g,
      (m, ouvre) => (i < choisis.length ? ouvre + carteAccueil(choisis[i++], langue) + '</div>' : m));
    if (h !== avant) {
      fs.writeFileSync(fichier, h);
      console.log(`build-blog: ${fichier} — ${i} article(s) mis en avant`);
    }
  }

  majAccueil('index.html', posts.slice(0, 2), 'fr');
  // Accueil anglais : seuls les articles reellement traduits, sinon on
  // enverrait le lecteur anglophone sur une page francaise.
  majAccueil('en/index.html', posts.filter((p) => fs.existsSync(path.join('en', 'blog', p.slug, 'index.html'))).slice(0, 2), 'en');

  console.log(`build-blog: done — ${built} post page(s) built, ${posts.length} listed.`);
}

try { main(); } catch (e) { console.warn('build-blog: skipped — ' + e.message); }
process.exit(0);
