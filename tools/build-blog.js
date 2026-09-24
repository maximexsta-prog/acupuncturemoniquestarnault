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
const HOME_TITLE = 'Acupunctrice d’expérience à Montréal — Rosemont | Depuis 1990';
const HOME_DESC = "Acupunctrice d’expérience à Montréal, quartier Rosemont (angle Lacordaire). Monique St-Arnault pratique depuis 1990 — plus de 30 000 traitements. Douleur, stress, digestion, santé des femmes. (514) 778-7975.";
const BLOG_DESC = "Articles de Monique St-Arnault, acupunctrice à Montréal (Rosemont) depuis 1990 : acupuncture, médecine traditionnelle chinoise, cinq éléments et saisons.";
const SUFFIX_NAME = 'Acupuncture Monique St-Arnault';
const SRC = 'blog-content';

// ── tiny, safe Markdown → HTML (the subset a blog needs) ───────────────────
// Banniere d'ambiance commune a TOUS les articles : la meme image que la
// section « Pour prendre rendez-vous » de la page d'accueil, pour que le
// blogue et le site respirent pareil. L'image propre a chaque article
// (champ « image: » de l'en-tete) ne sert plus de banniere : elle descend
// dans le texte, apres le premier paragraphe (voir insererImageArticle).
const HERO_AMBIANCE = '/wp-content/uploads/2026/04/stones-and-bamboo-sprout-in-water-on-dark-backgrou-2026-01-05-19-12-47-utc.jpg';

// L'Atelier ecrit des URL absolues vers le site. Un chemin relatif marche
// partout — en local, en preproduction et en ligne — donc on normalise a
// la lecture plutot que de corriger chaque article a la main.
function relImg(u) { return String(u || '').replace(SITE, ''); }

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
// Partage social par LIENS SIMPLES, pas par widgets officiels : les boutons
// Facebook & co chargent des scripts de pistage tiers qui ralentissent la page,
// suivent le visiteur meme sans clic, et declenchent une obligation de
// consentement sous la Loi 25. Un lien ne fait rien de tout cela.
function rangeePartage(url, titre) {
  const u = encodeURIComponent(url), t = encodeURIComponent(titre);
  const ic = {
    fb: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg>',
    wa: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 01-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a2.8 2.8 0 00-.9 2.1 4.8 4.8 0 001 2.5 11 11 0 004.2 3.7c1.5.6 2 .6 2.7.5.4 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z"/></svg>',
    ml: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z"/></svg>',
    cp: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>',
  };
  return `<nav class="msa-share" aria-label="Partager cet article"><b>Partager cet article</b><ul>`
    + `<li><a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener noreferrer">${ic.fb}Facebook</a></li>`
    + `<li><a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener noreferrer">${ic.wa}WhatsApp</a></li>`
    + `<li><a href="mailto:?subject=${t}&body=${u}">${ic.ml}Courriel</a></li>`
    + `<li><button type="button" class="msa-copy" data-url="${attr(url)}">${ic.cp}<span>Copier le lien</span></button></li>`
    + `</ul></nav>`;
}

const SCRIPT_PARTAGE = `<script>
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.msa-copy');
  if (!b) return;
  var dire = function (t) { var s = b.querySelector('span'); var v = s.textContent; s.textContent = t;
                            setTimeout(function () { s.textContent = v; }, 1800); };
  // navigator.clipboard exige HTTPS et peut etre refuse : on garde un repli.
  if (navigator.clipboard) { navigator.clipboard.writeText(b.dataset.url).then(function(){dire('Lien copié !');},
                                                                               function(){dire('Copie refusée');}); return; }
  var z = document.createElement('textarea'); z.value = b.dataset.url; document.body.appendChild(z);
  z.select(); try { document.execCommand('copy'); dire('Lien copié !'); } catch (x) { dire('Copie refusée'); }
  document.body.removeChild(z);
});
</script>`;

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
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function enDate(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${MONTHS_EN[+m[2]-1]} ${+m[3]}, ${m[1]}` : (iso || ''); }
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function frDate(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : (iso || ''); }
function rfc822(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : new Date(); return isNaN(d) ? '' : d.toUTCString(); }
function readMeta(html) {
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  return {
    title: t.replace(new RegExp('\\s*-\\s*' + SUFFIX_NAME + '\\s*$'), '').trim(),
    desc: (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '',
    image: String((html.match(/og:image" content="([^"]*)"/) || [])[1] || '').replace(SITE, ''),
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
.msa-share{margin:42px 0 0;padding-top:26px;border-top:1px solid var(--e-global-color-ae87854)}
.msa-share b{display:block;font-family:var( --e-global-typography-text-font-family ),"Jost",sans-serif;font-weight:500;font-size:.82em;letter-spacing:.12em;text-transform:uppercase;color:#a9b2a8;margin:0 0 14px}
.msa-share ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.msa-share li{margin:0}
.msa-share a,.msa-share button{display:inline-flex;align-items:center;gap:9px;padding:11px 16px;border:1px solid var(--e-global-color-ae87854);border-radius:8px;background:#fff;color:var(--e-global-color-primary)!important;text-decoration:none!important;font:500 .84em/1 Jost,sans-serif;letter-spacing:.04em;cursor:pointer;transition:background .18s,border-color .18s}
.msa-share a:hover,.msa-share button:hover{background:var(--e-global-color-01449a1);border-color:var(--e-global-color-193b8aa)}
.msa-share a:focus-visible,.msa-share button:focus-visible{outline:2px solid var(--e-global-color-193b8aa);outline-offset:2px}
.msa-share svg{flex:none}
/* Le theme met les <button> en capitales et force sa taille : on aligne
   le bouton « Copier le lien » sur les trois liens voisins. */
.msa-share button,.msa-share button span{text-transform:none;font-size:.84em;font-family:Jost,sans-serif;font-weight:500;letter-spacing:.04em;line-height:1}
.msa-share button span{font-size:1em}

</style>`;
const STYLE_BLOG = `<style>
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary);margin:0!important}
.elementor-718 .elementor-element-4fdf38d{display:none!important}
/* Banniere de tete, comme sur les articles */
.bl-cover{position:relative;min-height:330px;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 22px 48px;background:var(--e-global-color-primary) center/cover no-repeat}
.bl-cover::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,42,35,.58),rgba(24,42,35,.50))}
.bl-cover .in{position:relative}
.bl-cover h1{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:#fff;font-size:clamp(2em,5vw,3.1em);letter-spacing:.05em;margin:0}
.bl-cover .fil{color:rgba(255,255,255,.8);font-size:.92em;margin:16px 0 0}
.bl-cover .fil a{color:rgba(255,255,255,.8)!important;text-decoration:none!important}
.bl-cover .fil i{font-style:normal;color:var(--e-global-color-193b8aa);margin:0 8px}
/* Intro */
.msa-blog{max-width:1180px;margin:0 auto;padding:58px 22px 76px;color:var(--e-global-color-text)}
.bl-intro{text-align:center;margin:0 auto 46px;max-width:720px}
.bl-intro .eyebrow{display:block;font-size:.8em;letter-spacing:.18em;text-transform:uppercase;color:var(--e-global-color-193b8aa);margin:0 0 14px}
.bl-intro h2{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:var(--e-global-color-primary);font-size:clamp(1.6em,3.4vw,2.4em);line-height:1.22;margin:0;text-wrap:balance}
/* Grille de cartes */
.bl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px}
@media(max-width:820px){.bl-grid{grid-template-columns:1fr}}
.bl-card{position:relative;display:block;min-height:340px;border-radius:2px;overflow:hidden;text-decoration:none!important;background:var(--e-global-color-primary) center/cover no-repeat;transition:transform .2s}
.bl-card:hover{transform:translateY(-3px)}
/* Degrade franc : certaines images sont tres claires (illustration, diagramme)
   et le texte en surimpression devenait illisible. */
.bl-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(24,42,35,0) 18%,rgba(24,42,35,.55) 52%,rgba(24,42,35,.93) 100%)}
.bl-card .in{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;min-height:340px;padding:26px 28px}
.bl-card .cat{font-size:.74em;letter-spacing:.16em;text-transform:uppercase;color:var(--e-global-color-193b8aa);margin:0 0 10px}
.bl-card .ttl{font-family:var( --e-global-typography-primary-font-family ),"Federo",serif;font-weight:400;color:#fff;font-size:1.62em;line-height:1.22;letter-spacing:.03em;text-transform:uppercase;margin:0 0 12px}
.bl-card .by{font-size:.8em;color:rgba(255,255,255,.82);text-transform:none;letter-spacing:.02em}
.bl-card .by b{font-weight:500;letter-spacing:.06em;text-transform:uppercase}
/* .bl-card pose display:block, qui l'emporte sur le [hidden]{display:none}
   du navigateur : sans cette regle, une carte « masquee » par la recherche
   reste visible a l'ecran. */
.bl-card[hidden]{display:none}
.bl-vide{grid-column:1/-1;text-align:center;color:var(--e-global-color-text);padding:24px 0}
/* Champ de recherche de la page de liste */
.bl-search{display:flex;max-width:460px;margin:0 auto 38px;background:#fff;border:1px solid var(--e-global-color-ae87854)}
.bl-search input{flex:1;min-width:0;border:0;padding:15px 17px;font:400 1em Jost,sans-serif;color:var(--e-global-color-primary);background:transparent}
.bl-search input:focus{outline:2px solid var(--e-global-color-193b8aa);outline-offset:-2px}
.bl-search button{border:0;background:var(--e-global-color-193b8aa);color:var(--e-global-color-primary);padding:0 22px;cursor:pointer;font-size:1.15em;line-height:1;text-transform:none}
.bl-avis{text-align:center;margin:0 0 30px;color:var(--e-global-color-text)}
.bl-avis a{color:var(--e-global-color-primary)!important}
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
      // L'en-tete est clone de l'accueil, ou le bouton pointe vers l'ancre
      // locale #sec-1 (la section « Pour prendre rendez-vous »). Cette ancre
      // n'existe sur aucune autre page : le clic ne faisait rien. On le
      // renvoie vers la section de l'accueil.
      .split('href="#sec-1"').join(`href="${p.rac || ''}/#sec-1"`)
      .replace(`<title>${HOME_TITLE}</title>`,
        // un titre deja complet (celui des pages de liste) se passe du suffixe :
        // sinon « Acupuncture » apparait deux fois et la balise depasse 80 signes.
        `<title>${esc(p.title)}${p.titreComplet ? '' : ' - ' + SUFFIX_NAME}</title>`)
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
      const tg = (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      metas.push({ slug: enSlug(data.slug || f.replace(/\.md$/i, '')), title: data.titre || data.title || '',
                   date: data.date || '', image: relImg(data.image), desc: data.description || '',
                   categorie: (data.categorie || data.category || tg[0] || '').trim(),
                   auteur: (data.auteur || data.author || 'Monique St-Arnault').trim() });
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
      const image = relImg(data.image);
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
      ${rangeePartage(url, title)}
    </article>
  </main>
  <aside class="msa-side">${barreLaterale(slug)}</aside>
</div>`;
      const dir = path.join('blog', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), rewriteHead({ title, desc, url, image, noindex, enUrl, ld }) + '\n' + content + '\n' + SCRIPT_PARTAGE + '\n' + SUFFIX);
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

  // ── 3) les pages de liste, en francais ET en anglais ─────────────────────
  // La page anglaise etait une page Elementor figee : 3 articles ecrits en dur
  // et un 4e emplacement qui affichait « No Content Available » au visiteur.
  // Les deux listes sont desormais generees, avec la meme grille de cartes.
  const CAT_EN = { 'Acupuncture': 'Acupuncture', 'Médecine chinoise': 'Chinese Medicine',
    '5 Éléments': '5 Elements', '5 éléments': '5 Elements', 'Feng Shui': 'Feng Shui',
    'Allergies': 'Allergies', 'Méridiens': 'Meridians', 'Tao': 'Tao',
    'Problèmes saisonniers': 'Seasonal Issues', 'Printemps': 'Spring' };

  const T = {
    fr: { rac: '', titre: 'Blogue', titreSeo: 'Blogue — Acupuncture et médecine chinoise à Montréal', fil: 'Accueil', eyebrow: 'À lire',
          intro: 'Des articles pour mieux comprendre l’acupuncture et prendre soin de votre santé',
          par: 'par', vide: 'Aucun article pour le moment.', cherche: 'Rechercher…', tous: 'Voir tous les articles', lang: 'fr-CA', desc: BLOG_DESC },
    en: { rac: '/en', titre: 'Blog', titreSeo: 'Blog — Acupuncture and Chinese Medicine in Montreal', fil: 'Home', eyebrow: 'Read',
          intro: 'Articles to better understand acupuncture and care for your health',
          par: 'by', vide: 'No articles yet.', cherche: 'Search…', tous: 'See all articles', lang: 'en-CA',
          desc: 'Articles by Monique St-Arnault, acupuncturist in Montreal (Rosemont) since 1990: acupuncture, traditional Chinese medicine, the five elements and the seasons.' },
  };

  function ecrireListe(lang, liste) {
    const L = T[lang];
    const cartes = liste.length ? liste.map((p) => {
      const m = metas.find((x) => x.slug === p.slug) || {};
      // Sur la page anglaise, le titre et l'image viennent de la page ANGLAISE :
      // sinon on afficherait les titres francais a un lecteur anglophone.
      let titre = p.title, img = p.image;
      if (lang === 'en') {
        try {
          const en = readMeta(fs.readFileSync(path.join('en', 'blog', p.slug, 'index.html'), 'utf8'));
          if (en.title) titre = en.title;
          if (en.image) img = en.image;
        } catch (e) { /* page anglaise illisible : on garde les valeurs francaises */ }
      }
      const cat = lang === 'en' ? (CAT_EN[m.categorie] || '') : (m.categorie || '');
      const fond = img ? ` style="background-image:url('${img.replace(/'/g, '%27')}')"` : '';
      const quand = lang === 'en' ? enDate(p.date) : frDate(p.date);
      // Les cartes n'affichent pas le resume : on le porte en attribut pour que
      // la recherche couvre aussi le contenu, pas seulement le titre.
      const cherchable = [titre, cat, m.desc || p.desc || ''].join(' ');
      return `<a class="bl-card" href="${L.rac}/blog/${p.slug}/"${fond} data-rech="${attr(cherchable)}"><span class="in">`
        + (cat ? `<span class="cat">${esc(cat)}</span>` : '')
        + `<span class="ttl">${esc(titre)}</span>`
        + `<span class="by">${L.par} <b>${esc(m.auteur || 'Monique St-Arnault')}</b>`
        + (quand ? ` &middot; ${esc(quand)}` : '') + `</span></span></a>`;
    }).join('\n') : `<p class="bl-vide">${esc(L.vide)}</p>`;

    const url = `${SITE}${L.rac}/blog/`;
    const head = rewriteHead({
      title: L.titreSeo || L.titre, titreComplet: !!L.titreSeo, desc: L.desc, url, image: '', rac: L.rac,
      extraHead: lang === 'fr'
        ? `<link rel="alternate" type="application/rss+xml" title="Blogue — ${SUFFIX_NAME}" href="/blog/feed.xml">` : '',
      ld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: L.titre + ' — ' + SUFFIX_NAME,
             url, description: L.desc, inLanguage: L.lang, publisher: orgLD }],
    });
    const body = `${STYLE_BLOG}
<header class="bl-cover" style="background-image:url('${HERO_AMBIANCE.replace(/'/g, '%27')}')">
  <div class="in">
    <h1>${esc(L.titre)}</h1>
    <p class="fil"><a href="${L.rac}/">${esc(L.fil)}</a><i>›</i>${esc(L.titre)}</p>
  </div>
</header>
<main id="content" class="msa-blog">
  <div class="bl-intro"><span class="eyebrow">${esc(L.eyebrow)}</span><h2>${esc(L.intro)}</h2></div>
  <form class="bl-search" action="${L.rac}/blog/" method="get" role="search">
    <input type="search" name="q" placeholder="${attr(L.cherche)}" aria-label="${attr(L.cherche)}">
    <button type="submit" aria-label="${attr(L.cherche)}">&#9906;</button>
  </form>
  <div class="bl-grid">
${cartes}
  </div>
</main>`;
    const RECHERCHE = `<script>
(function(){
  var TOUS="${L.tous}";
  // Filtre la grille selon ?q= — le champ de recherche de la barre laterale
  // des articles pointe ici. Tout se passe dans le navigateur.
  // Sans accents : personne ne tape « médecine » avec l'accent dans un champ
  // de recherche. On aplatit les deux cotes avant de comparer.
  var plat=function(t){return (t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();};
  var q=plat((new URLSearchParams(location.search).get('q')||'').trim());
  if(!q) return;
  var g=document.querySelector('.bl-grid'); if(!g) return;
  var n=0;
  g.querySelectorAll('.bl-card').forEach(function(c){
    var ok=plat((c.dataset.rech||'')+' '+c.textContent).indexOf(q)>=0;
    c.hidden=!ok; if(ok) n++;
  });
  var brut=(new URLSearchParams(location.search).get('q')||'').trim();
  var champ=document.querySelector('.bl-search input'); if(champ) champ.value=brut;
  var avis=document.createElement('p');
  avis.className='bl-avis';
  avis.textContent=n?(n+' article'+(n>1?'s':'')+' pour « '+brut+' » — '):('Aucun article pour « '+brut+' » — ');
  var lien=document.createElement('a');
  lien.href=location.pathname; lien.textContent=TOUS;
  avis.appendChild(lien);
  g.parentNode.insertBefore(avis,g);
})();
</script>`;
    // Le pied de page est clone de l'accueil FRANCAIS : sur la page anglaise,
    // ses quelques libelles francais doivent suivre. build-en.js ne passe pas
    // ici (cette page est generee, pas transformee), d'ou ce petit relais.
    const PIED_EN = [['© Tout droits réservés 2026.', '© All rights reserved 2026.'],
                     ['Rosemont et Lacordaire', 'Rosemont & Lacordaire']];
    let queue = SUFFIX;
    if (lang === 'en') for (const [fr, en] of PIED_EN) queue = queue.split(fr).join(en);

    const dossier = lang === 'en' ? path.join('en', 'blog') : 'blog';
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, 'index.html'), head + '\n' + body + '\n' + RECHERCHE + '\n' + queue);
    console.log(`build-blog: wrote ${dossier}/index.html (${liste.length} article(s))`);
  }

  try {
    ecrireListe('fr', posts);
    // L'anglais ne liste QUE les articles reellement traduits : mieux vaut une
    // liste courte qu'un lecteur anglophone renvoye sur une page francaise.
    ecrireListe('en', posts.filter((p) => fs.existsSync(path.join('en', 'blog', p.slug, 'index.html'))));
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
    let img = p.image || '', titre = p.title;
    // Sur l'accueil anglais, le titre et l'image viennent de la page ANGLAISE :
    // sinon la carte affiche un titre francais a un lecteur anglophone.
    if (langue === 'en') {
      try {
        const en = readMeta(fs.readFileSync(path.join('en', 'blog', p.slug, 'index.html'), 'utf8'));
        if (en.title) titre = en.title;
        if (en.image) img = en.image;
      } catch (e) { /* pas de page anglaise : on garde le francais */ }
    }
    const par = langue === 'en' ? 'by ' : 'Par ';
    const quand = langue === 'en' ? p.date : frDate(p.date);
    const vignette = img
      ? `<div class="jkit-thumb"><a aria-label="${attr(titre)}" href="${url}"><div class="thumbnail-container "> <img loading="lazy" decoding="async" width="540" height="360" src="${attr(img)}" class="attachment-full size-full wp-post-image" alt="${attr(titre)}"> </div></a></div>`
      : '';
    return `<article class="jkit-post post type-post status-publish format-standard has-post-thumbnail hentry">`
      + ` ${vignette} <div class="jkit-postblock-content">`
      + `<h3 class="jkit-post-title"> <a href="${url}">${esc(titre)}</a> </h3>`
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
