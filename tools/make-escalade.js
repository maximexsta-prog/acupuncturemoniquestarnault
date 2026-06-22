// One-off generator: builds the FR /acupuncture-escalade/ landing page by
// cloning the home page's head + header + footer chrome and injecting custom
// climbing content. The English version is produced afterwards by build-en.js.
const fs = require('fs');

const h = fs.readFileSync('index.html', 'utf8');
function matchDiv(s) {
  const re = /<div\b|<\/div>/g; re.lastIndex = s; let d = 0, m;
  while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return m.index + m[0].length; }
  throw new Error('unbalanced');
}
// Enumerate the top-level sections of the page body (elementor-718).
// Layout: [header sections...] [content sections...] [footer section].
// Keep the leading header section(s) and the trailing footer section; the
// content sections in between are replaced with the landing-page content.
const pageOpen = h.indexOf('<div data-elementor-type="wp-page"');
const bodyStart = h.indexOf('>', pageOpen) + 1;
const pageEnd = matchDiv(pageOpen);
const kids = [];
for (let pos = bodyStart; pos < pageEnd;) {
  const nx = h.indexOf('<div', pos);
  if (nx < 0 || nx >= pageEnd) break;
  const end = matchDiv(nx);
  const cls = (h.slice(nx, h.indexOf('>', nx)).match(/class="([^"]*)"/) || [])[1] || '';
  kids.push({ start: nx, end, cls });
  pos = end;
}
let nHeader = 0;
while (nHeader < kids.length && /\bheader\b/.test(kids[nHeader].cls)) nHeader++;
const headerEnd = kids[nHeader - 1].end;     // after last header section
const footerStart = kids[kids.length - 1].start; // start of footer section

let prefix = h.slice(0, headerEnd);
const suffix = h.slice(footerStart);          // footer section + page close + theme footer + scripts

const TITLE = 'L’acupuncture et l’escalade - Acupuncture Monique St-Arnault';
const DESC = 'Acupuncture pour grimpeurs à Montréal : douleurs aux coudes (épicondylite), épaules, poignets et doigts, récupération et prévention des blessures. Monique St-Arnault, ancienne athlète, depuis 1990. (514) 778-7975.';
const HOME_DESC = "Depuis 1990, Monique St-Arnault offre des soins d'acupuncture personnalisés à Montréal. Douleur, stress, digestion, santé des femmes. Clinique Rosemont — (514) 778-7975.";
const U = 'https://acupuncturemoniquestarnault.com/acupuncture-escalade/';

// ── head SEO rewrites ────────────────────────────────────────────────────
prefix = prefix
  .replace('<title>Accueil - Acupuncture Monique St-Arnault</title>', `<title>${TITLE}</title>`)
  .split('content="Accueil - Acupuncture Monique St-Arnault"').join(`content="${TITLE}"`)
  .split(HOME_DESC).join(DESC)
  .replace('rel="canonical" href="https://acupuncturemoniquestarnault.com/"', `rel="canonical" href="${U}"`)
  .replace('hreflang="fr" href="https://acupuncturemoniquestarnault.com/"', `hreflang="fr" href="${U}"`)
  .replace('hreflang="x-default" href="https://acupuncturemoniquestarnault.com/"', `hreflang="x-default" href="${U}"`)
  .replace('hreflang="en" href="https://acupuncturemoniquestarnault.com/en/"', 'hreflang="en" href="https://acupuncturemoniquestarnault.com/en/acupuncture-escalade/"')
  .split('content="https://acupuncturemoniquestarnault.com/"').join(`content="${U}"`);

// replace the home JSON-LD blocks with page-specific schema
const LD = [
  {
    '@context': 'https://schema.org', '@type': 'MedicalWebPage',
    name: 'L’acupuncture et l’escalade', url: U, inLanguage: 'fr-CA',
    description: DESC,
    about: { '@type': 'MedicalTherapy', name: 'Acupuncture' },
    audience: { '@type': 'PeopleAudience', audienceType: 'Grimpeurs et grimpeuses, athlètes d’escalade' },
    provider: {
      '@type': ['LocalBusiness', 'MedicalOrganization'], '@id': 'https://acupuncturemoniquestarnault.com/#business',
      name: 'Acupuncture Monique St-Arnault', url: 'https://acupuncturemoniquestarnault.com',
      telephone: '+1-514-778-7975', email: 'acumsta@hotmail.com',
      address: { '@type': 'PostalAddress', streetAddress: 'Rosemont et Lacordaire', addressLocality: 'Montréal', addressRegion: 'QC', postalCode: 'H1M 2N1', addressCountry: 'CA' },
      areaServed: { '@type': 'City', name: 'Montréal' },
    },
  },
  {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://acupuncturemoniquestarnault.com/' },
      { '@type': 'ListItem', position: 2, name: 'L’acupuncture et l’escalade', item: U },
    ],
  },
];
prefix = prefix.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const ldHtml = LD.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('');
prefix = prefix.replace('</head>', ldHtml + '</head>');

// ── page content ─────────────────────────────────────────────────────────
const STYLE = `<style>
/* This page has a light background, but the shared header is styled for a dark
   hero (white logo + white nav). Give the header a navy bar so it stays legible. */
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary)}
.msa-esc{max-width:1140px;margin:0 auto;padding:56px 20px;color:var(--e-global-color-text)}
.msa-esc-hero{text-align:center;padding:32px 20px 8px}
.msa-esc h1{color:var(--e-global-color-primary);margin:0 0 10px}
.msa-esc .sub{font-family:"Federo",sans-serif;color:#5d7d3a;font-size:1.7em;line-height:1.2;margin:0 0 6px}
.msa-esc .since{font-style:italic;color:#9aa6a0;margin:0}
.msa-esc .lead{max-width:760px;margin:22px auto;font-size:1.12em;line-height:1.65}
.msa-esc .cta{display:inline-block;margin-top:10px;background:var(--e-global-color-secondary);color:var(--e-global-color-primary)!important;padding:14px 30px;border-radius:6px;font-family:"Jost",sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-decoration:none}
.msa-esc .cta:hover{background:var(--e-global-color-193b8aa)}
.msa-esc h2{color:var(--e-global-color-primary);text-align:center;margin:52px 0 22px}
.msa-esc ul.treat{max-width:680px;margin:0 auto;list-style:none;padding:0}
.msa-esc ul.treat li{position:relative;padding:11px 0 11px 34px;border-bottom:1px solid var(--e-global-color-ae87854);font-size:1.06em}
.msa-esc ul.treat li::before{content:"✓";position:absolute;left:2px;color:#5d7d3a;font-weight:700}
.msa-esc .cards{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:18px}
.msa-esc .card{flex:1 1 320px;max-width:470px;border:1px solid var(--e-global-color-193b8aa);border-radius:12px;padding:28px;background:#fff}
.msa-esc .card h3{color:var(--e-global-color-primary);margin:0 0 12px}
.msa-esc .card ul{padding-left:18px;margin:0}
.msa-esc .card li{margin:9px 0}
.msa-esc .credit{background:#fff;border:1px solid var(--e-global-color-193b8aa);border-radius:12px;padding:34px 28px;margin-top:52px;text-align:center}
.msa-esc .credit p{max-width:720px;margin:0 auto;font-size:1.08em;line-height:1.6}
.msa-esc .contact{text-align:center;margin-top:48px}
.msa-esc .contact .row{margin:10px 0;font-size:1.12em}
.msa-esc .contact a{color:var(--e-global-color-primary);font-weight:600;text-decoration:none}
@media(max-width:767px){.msa-esc{padding:28px 16px}.msa-esc .sub{font-size:1.35em}}
</style>`;

const CONTENT = `${STYLE}
<main id="content" class="msa-esc">
  <section class="msa-esc-hero">
    <h1>L’acupuncture et l’escalade</h1>
    <p class="sub">Douleurs aux coudes, épaules, poignets&nbsp;?</p>
    <p class="since">depuis 1990</p>
    <p class="lead">L’escalade sollicite intensément les doigts, les poignets, les coudes et les épaules. Que vous grimpiez en salle ou en falaise, de façon récréative ou intensive, l’acupuncture aide à soulager la douleur, à accélérer la récupération et à prévenir les blessures de surutilisation.</p>
    <a class="cta" href="tel:+15147787975">Appeler le (514) 778-7975</a>
  </section>

  <section>
    <h2>Ce que je traite souvent chez les grimpeurs</h2>
    <ul class="treat">
      <li>Tensions à la nuque, au dos et aux épaules</li>
      <li>Épicondylites et douleurs aux coudes</li>
      <li>Poignets et doigts sursollicités</li>
      <li>Stress et anxiété de performance</li>
      <li>Douleurs ou raideurs qui traînent</li>
      <li>Récupération et prévention des blessures</li>
    </ul>
  </section>

  <section>
    <div class="cards">
      <div class="card">
        <h3>Approche globale</h3>
        <p>Au-delà du symptôme, on soutient l’ensemble du corps&nbsp;: douleur, stress, digestion, sommeil et énergie, pour une récupération durable.</p>
      </div>
      <div class="card">
        <h3>Pour tout le monde</h3>
        <ul>
          <li>Grimpeurs récréatifs ou intensifs</li>
          <li>Débutants comme avancés</li>
          <li>Blessés ou en prévention</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="credit">
    <h2>Une approche par une ancienne athlète</h2>
    <p>Ancienne gymnaste et entraîneuse de gymnastique de haut niveau au Canada, Monique comprend les exigences du corps sportif et l’importance d’une récupération bien menée.</p>
  </section>

  <section class="contact">
    <h2>Pour prendre rendez-vous</h2>
    <p class="lead">La prise de rendez-vous se fait par téléphone. Laissez un message vocal ou texto si je suis en consultation, je vous rappelle personnellement.</p>
    <div class="row"><a href="tel:+15147787975">(514) 778-7975</a></div>
    <div class="row"><a href="mailto:acumsta@hotmail.com">acumsta@hotmail.com</a></div>
    <div class="row">Clinique à Montréal — Rosemont et Lacordaire</div>
  </section>
</main>`;

const page = prefix + '\n' + CONTENT + '\n' + suffix;
fs.mkdirSync('acupuncture-escalade', { recursive: true });
fs.writeFileSync('acupuncture-escalade/index.html', page);
console.log('wrote acupuncture-escalade/index.html (' + page.length + ' bytes)');
