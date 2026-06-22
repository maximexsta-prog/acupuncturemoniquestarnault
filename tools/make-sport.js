// One-off generator: builds the FR /acupuncture-sport/ landing page by cloning
// the home page's head + header + footer chrome and injecting custom sports
// content. The English version is produced afterwards by build-en.js.
const fs = require('fs');

const h = fs.readFileSync('index.html', 'utf8');
function matchDiv(s) {
  const re = /<div\b|<\/div>/g; re.lastIndex = s; let d = 0, m;
  while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return m.index + m[0].length; }
  throw new Error('unbalanced');
}
// Keep the leading header section(s) and the trailing footer section of the page
// body (elementor-718); replace the content sections in between.
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
const headerEnd = kids[nHeader - 1].end;
const footerStart = kids[kids.length - 1].start;

let prefix = h.slice(0, headerEnd);
const suffix = h.slice(footerStart);

const TITLE = 'L’acupuncture sportive - Acupuncture Monique St-Arnault';
const DESC = 'Acupuncture sportive à Montréal : tendinites, épicondylites, entorses, douleurs de surutilisation, récupération et prévention des blessures — escalade, course, vélo, sports de raquette et plus. Monique St-Arnault, ancienne gymnaste de compétition, depuis 1990. (514) 778-7975.';
const HOME_DESC = "Depuis 1990, Monique St-Arnault offre des soins d'acupuncture personnalisés à Montréal. Douleur, stress, digestion, santé des femmes. Clinique Rosemont — (514) 778-7975.";
const U = 'https://acupuncturemoniquestarnault.com/sport/';

// ── head SEO rewrites ────────────────────────────────────────────────────
prefix = prefix
  .replace('<title>Accueil - Acupuncture Monique St-Arnault</title>', `<title>${TITLE}</title>`)
  .split('content="Accueil - Acupuncture Monique St-Arnault"').join(`content="${TITLE}"`)
  .split(HOME_DESC).join(DESC)
  .replace('rel="canonical" href="https://acupuncturemoniquestarnault.com/"', `rel="canonical" href="${U}"`)
  .replace('hreflang="fr" href="https://acupuncturemoniquestarnault.com/"', `hreflang="fr" href="${U}"`)
  .replace('hreflang="x-default" href="https://acupuncturemoniquestarnault.com/"', `hreflang="x-default" href="${U}"`)
  .replace('hreflang="en" href="https://acupuncturemoniquestarnault.com/en/"', 'hreflang="en" href="https://acupuncturemoniquestarnault.com/en/sport/"')
  .split('content="https://acupuncturemoniquestarnault.com/"').join(`content="${U}"`);

const LD = [
  {
    '@context': 'https://schema.org', '@type': 'MedicalWebPage',
    name: 'L’acupuncture sportive', url: U, inLanguage: 'fr-CA', description: DESC,
    about: { '@type': 'MedicalTherapy', name: 'Acupuncture sportive' },
    audience: { '@type': 'PeopleAudience', audienceType: 'Sportifs, athlètes et personnes actives — dont les grimpeurs' },
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
      { '@type': 'ListItem', position: 2, name: 'L’acupuncture sportive', item: U },
    ],
  },
];
prefix = prefix.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
prefix = prefix.replace('</head>', LD.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('') + '</head>');

const STYLE = `<style>
/* The shared header is styled for a dark hero (white logo + white nav). Give it
   a navy bar so it stays legible on this light page, and zero the negative
   header margins (-90px/-222px) that otherwise pull content up behind it. */
.elementor-718 .header.e-con{background-color:var(--e-global-color-primary);margin:0!important}
/* the second header section (4fdf38d) is an empty strip; with a navy background
   and z-index 200 it paints over the open mobile menu. It carries no content, so
   hide it — removes the navy band overlapping the logo when the hamburger is open. */
.elementor-718 .elementor-element-4fdf38d{display:none!important}
.msa-esc{max-width:1140px;margin:0 auto;padding:56px 20px;color:var(--e-global-color-text)}
.msa-esc-hero{text-align:center;padding:32px 20px 8px}
.msa-esc h1{color:var(--e-global-color-primary);margin:0 0 10px}
.msa-esc .sub{font-family:"Federo",sans-serif;color:#5d7d3a;font-size:1.7em;line-height:1.2;margin:0 0 6px}
.msa-esc .since{font-style:italic;color:#9aa6a0;margin:0}
.msa-esc .lead{max-width:780px;margin:22px auto;font-size:1.12em;line-height:1.65}
.msa-esc .cta{display:inline-block;margin-top:10px;background:var(--e-global-color-secondary);color:var(--e-global-color-primary)!important;padding:14px 30px;border-radius:6px;font-family:"Jost",sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-decoration:none}
.msa-esc .cta:hover{background:var(--e-global-color-193b8aa)}
.msa-esc h2{color:var(--e-global-color-primary);text-align:center;margin:52px 0 22px}
.msa-esc .intro{max-width:720px;margin:0 auto 18px;text-align:center;line-height:1.6}
.msa-esc ul.treat{max-width:700px;margin:0 auto;list-style:none;padding:0}
.msa-esc ul.treat li{position:relative;padding:11px 0 11px 34px;border-bottom:1px solid var(--e-global-color-ae87854);font-size:1.06em}
.msa-esc ul.treat li::before{content:"✓";position:absolute;left:2px;color:#5d7d3a;font-weight:700}
.msa-esc .callout{max-width:760px;margin:24px auto 0;background:#fff;border:1px solid var(--e-global-color-193b8aa);border-left:4px solid #5d7d3a;border-radius:8px;padding:24px 30px}
.msa-esc .callout h3{color:var(--e-global-color-primary);margin:0 0 10px}
.msa-esc .callout p{margin:0;line-height:1.6}
.msa-esc .cards{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:18px}
.msa-esc .card{flex:1 1 320px;max-width:470px;border:1px solid var(--e-global-color-193b8aa);border-radius:12px;padding:28px;background:#fff}
.msa-esc .card h3{color:var(--e-global-color-primary);margin:0 0 12px}
.msa-esc .card ul{padding-left:18px;margin:0}
.msa-esc .card li{margin:9px 0}
.msa-esc .credit{background:#fff;border:1px solid var(--e-global-color-193b8aa);border-radius:12px;padding:34px 28px;margin-top:52px;text-align:center}
.msa-esc .credit p{max-width:720px;margin:0 auto;font-size:1.08em;line-height:1.6}
.msa-esc .msa-photo{margin:24px auto 0;max-width:360px}
.msa-esc .msa-photo img{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--e-global-color-ae87854)}
.msa-esc .msa-photo figcaption{margin-top:10px;font-size:.9em;font-style:italic;color:var(--e-global-color-text)}
.msa-esc .contact{text-align:center;margin-top:52px}
.msa-esc .contact .cta{margin:8px 0 24px}
/* a global theme rule forces bare links to white/uppercase (built for dark
   backgrounds); override it so the email and address stay legible here */
.msa-esc .contact .contact-meta{font-size:1.12em;line-height:1.9;margin:0}
.msa-esc .contact .contact-meta a{color:var(--e-global-color-primary)!important;font-weight:600!important;text-transform:none!important;letter-spacing:normal!important;font-size:1em!important;text-decoration:underline!important}
.msa-esc .contact .contact-meta .addr{display:block;color:var(--e-global-color-text);margin-top:8px}
@media(max-width:767px){.msa-esc{padding:28px 16px}.msa-esc .sub{font-size:1.35em}}
</style>`;

// The 1977 photo: emit the live <figure> once the image file is in the repo,
// otherwise a safe placeholder comment (no src/href tokens, so it never trips
// the link checker). Drop the file and re-run this script to enable it.
const PHOTO_FILE = 'wp-content/uploads/2026/04/monique-gymnaste-1977.jpg';
const PHOTO = fs.existsSync(PHOTO_FILE)
  ? `<figure class="msa-photo">
      <img src="/${PHOTO_FILE}" alt="Monique St-Arnaud à la poutre en gymnastique de compétition, 1977" loading="lazy">
      <figcaption>Monique St-Arnaud, gymnastique de compétition — The Montreal Star, 1er mars 1977.</figcaption>
    </figure>`
  : `<!-- PHOTO a venir : ajouter le fichier ${PHOTO_FILE} puis relancer node tools/make-sport.js -->`;

const CONTENT = `${STYLE}
<main id="content" class="msa-esc">
  <section class="msa-esc-hero">
    <h1>L’acupuncture sportive</h1>
    <p class="sub">Blessures, douleurs et performance — pour tous les sports</p>
    <p class="since">depuis 1990</p>
    <p class="lead">Tendinites, entorses, douleurs de surutilisation, tensions, récupération lente, anxiété de performance… le sport met le corps à l’épreuve. L’acupuncture aide à soulager la douleur, à accélérer la récupération et à prévenir les blessures, quel que soit votre sport et votre niveau.</p>
    <a class="cta" href="tel:+15147787975">Appeler le (514) 778-7975</a>
  </section>

  <section>
    <h2>Ce que je traite souvent chez les sportifs</h2>
    <ul class="treat">
      <li>Tendinites et épicondylites (coudes, épaules, genoux)</li>
      <li>Entorses, foulures et raideurs articulaires</li>
      <li>Tensions à la nuque, au dos et aux épaules</li>
      <li>Poignets, doigts et articulations sursollicités</li>
      <li>Stress et anxiété de performance</li>
      <li>Récupération, fatigue et prévention des blessures</li>
    </ul>
  </section>

  <section>
    <h2>Adaptée à votre sport</h2>
    <p class="intro">Chaque discipline sollicite le corps différemment. Les soins sont adaptés à votre pratique :</p>
    <ul class="treat">
      <li>Escalade et bloc — coudes, doigts, poignets, épaules</li>
      <li>Course à pied — genoux, hanches, tendons</li>
      <li>Vélo et cyclisme — dos, nuque, genoux</li>
      <li>Sports de raquette — coudes, épaules, poignets</li>
      <li>Gymnastique et sports acrobatiques — poignets, dos, souplesse</li>
      <li>Musculation et entraînement — récupération, tendons</li>
      <li>Sports d’équipe — entorses, chocs, surmenage</li>
    </ul>
    <div class="callout">
      <h3>Une attention particulière pour les grimpeurs</h3>
      <p>Les grimpeurs forment une part importante de ma clientèle sportive. Les coudes (épicondylite), les doigts, les poignets et les épaules, très sollicités en escalade, répondent particulièrement bien à l’acupuncture — en traitement comme en prévention.</p>
    </div>
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
          <li>Sportifs récréatifs ou de compétition</li>
          <li>Débutants comme avancés</li>
          <li>Blessés ou en prévention</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="credit">
    <h2>Une praticienne qui connaît le sport de l’intérieur</h2>
    <p>Avant l’acupuncture, Monique a été gymnaste de compétition et entraîneuse de haut niveau au Canada — quatre médailles d’or en 1977. Cette expérience du sport, de l’entraînement et de la blessure nourrit chaque traitement.</p>
    ${PHOTO}
  </section>

  <section class="contact">
    <h2>Pour prendre rendez-vous</h2>
    <p class="lead">La prise de rendez-vous se fait par téléphone. Laissez un message vocal ou texto si je suis en consultation, je vous rappelle personnellement.</p>
    <a class="cta" href="tel:+15147787975">Appeler le (514) 778-7975</a>
    <p class="contact-meta">
      <span class="addr">Clinique à Montréal — Rosemont et Lacordaire</span>
    </p>
  </section>
</main>`;

const page = prefix + '\n' + CONTENT + '\n' + suffix;
fs.mkdirSync('sport', { recursive: true });
fs.writeFileSync('sport/index.html', page);
console.log('wrote sport/index.html (' + page.length + ' bytes)');
