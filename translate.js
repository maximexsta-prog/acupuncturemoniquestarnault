(function () {
  var SK = 'msa-lang';
  var cur = localStorage.getItem(SK) || 'fr';

  /* Pages with pre-rendered English versions under /en/ (see tools/build-en.js).
     For these, the pill navigates between URLs; other pages translate in place. */
  var EN_PAGES = ['/', '/blog/', '/le-printemps/', '/les-allergies-du-printemps/', '/le-tao/'];
  function curPath() {
    var p = window.location.pathname.replace(/\/index\.html$/, '/');
    if (p.slice(-1) !== '/') p += '/';
    return p;
  }
  var IS_EN_PAGE = curPath().indexOf('/en/') === 0;
  if (IS_EN_PAGE) cur = 'en';

  /* ── Translations ──────────────────────────────────────────────────── */
  var T = {
    common: {
      'Blog': 'Blog',
      'Rendez-vous': 'Book Now',
      'Accueil': 'Home',
      'Skip to content': 'Skip to content',
      'Contact': 'Contact',
      'Facebook': 'Facebook',
      'Envelope': 'Email',
      'Whatsapp': 'WhatsApp',
      'Acupuncture Monique St-Arnault': 'Acupuncture Monique St-Arnault',
      'Rosemont et Lacordaire': 'Rosemont & Lacordaire',
      'Montreal, Qc H1M 2N1': 'Montreal, QC H1M 2N1',
      'Montréal, Qc H1M 2N1': 'Montreal, QC H1M 2N1',
      '(514) 778-7975': '(514) 778-7975',
      '© Tout droits réservés 2026.': '© All rights reserved 2026.',
      'All rights reserved': 'All rights reserved',
      'Acupuncture': 'Acupuncture',
      '5 Éléments': '5 Elements',
      '5 éléments': '5 Elements',
      'Médecine chinoise': 'Chinese Medicine',
      'Problèmes saisonniers': 'Seasonal Issues',
      'Feng Shui': 'Feng Shui',
      'Articles récents': 'Recent Articles',
      'Catégorie': 'Category',
      'Partager cet article :': 'Share this article:',
      'Tags :': 'Tags:',
      'Monique St-Arnault': 'Monique St-Arnault',
      'April 16, 2026': 'April 16, 2026',
      'April 19, 2026': 'April 19, 2026',
      'Rechercher...': 'Search…',
      'No Content Available': 'No Content Available',
      'Les allergies du printemps': 'Spring Allergies',
      'Le printemps, la saison du mouvement de l’élément Bois': 'Spring, the Season of the Wood Element',
      'Le Tao': 'The Tao',
      'À lire': 'Read',
      'Des articles pour mieux comprendre l’acupuncture et prendre soin de votre santé': 'Articles to better understand acupuncture and care for your health',
      'Pour prendre rendez-vous': 'Book an Appointment',
      'Acupuncture Monique St-Arnault\nRosemont et Lacordaire\nMontréal, Qc H1M 2N1': 'Acupuncture Monique St-Arnault\nRosemont & Lacordaire\nMontreal, QC H1M 2N1',
    },

    '/': {
      'L’acupuncture pour retrouver votre équilibre, naturellement': 'Acupuncture to restore your balance, naturally',
      'Depuis 1990': 'Since 1990',
      'Depuis 1990, Monique St-Arnault offre des soins personnalisés en acupuncture pour accompagner la douleur, le stress, la digestion, la santé des femmes et l’équilibre global, avec douceur, expérience et professionnalisme.': 'Since 1990, Monique St-Arnault has offered personalized acupuncture care to address pain, stress, digestion, women’s health and overall balance, with gentleness, experience and professionalism.',
      'Prenez rendez-vous pour retrouver votre équilibre': 'Book an appointment to restore your balance',
      'Guasha & Ventouses': 'Gua Sha & Cupping',
      'Libération des tensions et harmonisation énergétique': 'Release of tension and energetic harmonization',
      'Moxibustion': 'Moxibustion',
      'Chaleur thérapeutique et activation des points énergétiques': 'Therapeutic heat and activation of energy points',
      'Diététique énergétique': 'Energy Dietetics',
      'Accompagnement alimentaire selon votre équilibre énergétique': 'Dietary guidance based on your energetic balance',
      'Acupuncture Facial': 'Facial Acupuncture',
      'Éclat du visage et rééquilibrage énergétique': 'Radiant complexion and energetic rebalancing',
      'Esprit & Relaxation': 'Mind & Relaxation',
      'Apaisement du mental et profonde détente': 'Mental calming and deep relaxation',
      'À propos': 'About',
      'Depuis 36 ans': 'For 36 years',
      'Traitements relaxants réalisés': 'Relaxing treatments performed',
      'Clients satisfaits servis': 'Satisfied clients served',
      'Acupunctrice depuis plus de 35 ans, Monique St-Arnault accompagne ses patients avec une approche à la fois humaine, rigoureuse et profondément personnalisée. Son parcours, marqué par le sport de haut niveau, l’éducation physique, le Tai Chi et la médecine traditionnelle chinoise, l’a menée à développer une pratique centrée sur l’équilibre global de la personne.': 'An acupuncturist for over 35 years, Monique St-Arnault guides her patients with an approach that is both human, rigorous and deeply personalized. Her background in high-level sports, physical education, Tai Chi and traditional Chinese medicine led her to develop a practice centered on the person’s overall balance.',
      'Formée en acupression puis en acupuncture, elle a également complété un stage pratique à Shanghai en 1991. Depuis, elle a offert plus de 30 000 traitements, auprès d’une clientèle de tous âges, pour accompagner entre autres les douleurs, la fatigue, le stress, le burnout, l’anxiété, certains enjeux de santé des femmes, ainsi que la prévention et le mieux-être global.': 'Trained in acupressure and then acupuncture, she also completed a practical internship in Shanghai in 1991. Since then, she has provided over 30,000 treatments to clients of all ages, addressing pain, fatigue, stress, burnout, anxiety, women’s health issues, and overall prevention and well-being.',
      'Un accueil personnalisé dès le premier échange': 'A personalized welcome from the first contact',
      'Parce que chaque personne est unique, la prise de rendez-vous se fait par téléphone, dans un esprit d’écoute, de simplicité et de présence. Ce premier contact permet d’établir un lien direct et de proposer un accompagnement adapté à votre situation.': 'Because each person is unique, appointments are made by phone, in a spirit of attentiveness, simplicity and presence. This first contact allows us to establish a direct connection and offer support tailored to your situation.',
      'Si je suis en consultation, n’hésitez pas à me laisser un message vocal ou m’envoyer un message texte au même numéro. Je vous rappellerai personellement dans les plus brefs délais.': 'If I am in a session, please feel free to leave a voice message or text the same number. I will personally call you back as soon as possible.',
      'Heures d’appels :': 'Call hours:',
      'Lundi – Vendredi : 9h00 à 20h00': 'Monday – Friday: 9:00 AM to 8:00 PM',
      'Appelez le (514) 778-7975': 'Call (514) 778-7975',
    },

    '/blog/': {
      'À lire': 'Read',
    },

    '/le-printemps/': {
      'Le printemps, la saison du mouvement de l’élément Bois': 'Spring, the Season of the Wood Element',
      'Tout le monde dehors !': 'Everyone Outside!',
      'Le printemps, la saison du Bois': 'Spring, the Season of Wood',
      'Cycle d’engendrement et de contrôle': 'Generation and Control Cycle',
      'Pour le maintien d’une bonne santé': 'For Maintaining Good Health',
      'L’ennemi juré ? Le stress !': 'The Main Enemy? Stress!',
      'Créer l’équilibre dans notre vie': 'Creating Balance in Our Life',
      'Pour une maison équilibrée': 'For a Balanced Home',
      'Phénomènes en affinité avec l’élément bois': 'Phenomena Associated with the Wood Element',
      '5 Éléments , Médecine chinoise': '5 Elements, Chinese Medicine',
      'Après un hiver qui n’en finit plus, le printemps est la saison la plus attendue de toutes. La première vraie journée de printemps nous apparaît comme un cadeau du ciel, presque un miracle!': 'After a seemingly endless winter, spring is the most anticipated season of all. The first true spring day feels like a gift from heaven, almost a miracle!',
      'On ressent une véritable effervescence, comme si l’énergie jaillissait de partout, faisant disparaître, comme par magie, tous les petits et grands problèmes de notre vie!': 'We feel a genuine effervescence, as if energy is bursting from everywhere, magically dissolving all the small and large problems in our lives!',
      'Cet instant de félicité déclenche en nous un besoin impératif de bouger, d’aller à l’extérieur pour sentir la douceur de la brise sur nos joues, l’ardeur des rayons de soleil sur notre peau et de voir les milles et une nuances de vert se déployer sous nos yeux. Enfin, le bonheur est au rendez-vous.': 'This moment of bliss triggers an urgent need in us to move, to go outside and feel the gentle breeze on our cheeks, the warmth of sunlight on our skin, and to see the thousand shades of green unfold before our eyes. At last, happiness is here.',
      'Je suis toujours stupéfaite de voir autant de gens marcher joyeusement sur la rue St-Denis, s’asseoir à une terrasse bondée pour siroter un café par-ci, une tisane par-là. L’exaltation était presque palpable! Tels des crustacés se débarrassant de leur vieille carapace, tous ces passants étaient enfin libérés de leurs gros manteaux, de leurs bottes, des foulards et des 4 murs de leur maison.': 'I am always amazed to see so many people walking joyfully on Rue St-Denis, sitting at a crowded terrace to sip a coffee here, a herbal tea there. The exhilaration was almost palpable! Like crustaceans shedding their old shells, all these passersby were finally freed from their heavy coats, boots, scarves and the four walls of their homes.',
      'Chaque saison joue un rôle indispensable pour assurer l’arrivée de la suivante. Alors que durant l’hiver, la saison de l’Eau, nous avons goûté à la profondeur de l’intériorisation, de la dormance et de la gestation pour préparer la vie dans les tréfonds, le printemps, la saison du Bois, nous invite pour sa part à la mise en mouvement, à la germination, à la naissance de ce qui est en devenir. Les phénomènes et les sensations décrites dans les premiers paragraphes sont représentatifs de l’énergie associée à l’élément Bois: un mouvement qui tend vers l’extérieur, vers l’épanouissement, vers le réchauffement et vers la naissance.': 'Each season plays an indispensable role in ensuring the arrival of the next. While during winter, the season of Water, we savored the depth of introspection, dormancy and gestation to prepare life in the depths, spring, the season of Wood, invites us to set things in motion, to germinate, to give birth to what is becoming. The phenomena and sensations described in the first paragraphs are representative of the energy associated with the Wood element: a movement that tends outward, toward blossoming, warming and birth.',
      'Dans le grand cycle de la vie, les éléments entretiennent entre eux des relations selon un cycle d’engendrement et un cycle de contrôle. Le Bois est produit par sa mère l’Eau qui l’alimente constamment. Le Bois est contrôlé par le Métal qui l’encadre. Le Bois contrôle la Terre en la perçant. Le Bois nourrit et donne naissance à son fils le Feu, en le nourrissant de sa matière.': 'In the great cycle of life, the elements maintain relationships with each other according to a generation cycle and a control cycle. Wood is produced by its mother Water, which constantly nourishes it. Wood is controlled by Metal, which frames it. Wood controls Earth by piercing through it. Wood nourishes and gives birth to its son Fire, feeding it with its substance.',
      'L’organe relié à l’élément Bois est le foie. En médecine chinoise cet organe joue un rôle très important dont voici quelques-unes des fonctions :': 'The organ associated with the Wood element is the liver. In Chinese medicine, this organ plays a very important role, some of whose functions are:',
      'Comme certaines de nos habitudes de vie malmènent énormément cet organe, la première règle à suivre au printemps est de faire une cure de désintoxication du foie. Un foie sain et équilibré est le précurseur d’une bonne vitalité et d’une excellente santé.': 'Since some of our lifestyle habits greatly strain this organ, the first rule to follow in spring is to do a liver detox. A healthy, balanced liver is the precursor to good vitality and excellent health.',
      'Le stress incessant causé par notre rythme de vie déséquilibré est un grand responsable du mauvais fonctionnement du foie. Il crée une surpression de l’énergie du foie ralentissant ainsi ses fonctions et favorisant des malaises de toutes sortes :': 'The incessant stress caused by our unbalanced pace of life is a major contributor to poor liver function. It creates excess pressure in the liver’s energy, slowing its functions and causing all kinds of discomforts:',
      'La meilleure façon de gérer le stress est de se mettre en mouvement, idéalement entouré de végétaux, tels que forêts, montagnes, cours d’eau : Tai Chi, Qi Gong, étirements, marche, bicyclette, escalade, canot, ski, raquette, etc. L’important c’est que l’on bouge !': 'The best way to manage stress is to get moving, ideally surrounded by nature such as forests, mountains, waterways: Tai Chi, Qi Gong, stretching, walking, cycling, climbing, canoeing, skiing, snowshoeing, etc. The important thing is to move!',
      'Voici quelques conseils pratiques à mettre en application pour vous aider à vivre un beau printemps, en harmonie avec le TAO, c’est-à-dire avec l’univers. Une cure d’acupuncture saisonnière est très bénéfique pour équilibrer l’énergie du foie tout en favorisant la circulation de l’énergie dans tout le corps.': 'Here are some practical tips to help you experience a beautiful spring in harmony with the TAO, that is, with the universe. A seasonal acupuncture treatment is very beneficial for balancing liver energy while promoting the circulation of energy throughout the body.',
      'Voici un exercice de Qi Gong facile à exécuter et qui vous aidera à vous calmer rapidement :': 'Here is an easy Qi Gong exercise that will help you calm down quickly:',
      'La difficulté de cet exercice réside dans le fait de ne penser qu’à notre respiration, l’analyser, l’améliorer. Il peut être pratiqué de 1 à 2 fois par jour durant 10 minutes.': 'The difficulty of this exercise lies in thinking only about our breathing, analyzing it, improving it. It can be practiced 1 to 2 times a day for 10 minutes.',
      'enrichit le sang, nourrit les tendons et les muscles;': 'enriches the blood, nourishes tendons and muscles;',
      'purifie, filtre et nettoie;': 'purifies, filters and cleanses;',
      'assure la libre circulation du sang, des liquides, de l’énergie, des hormones, des enzymes ainsi que des émotions;': 'ensures the free circulation of blood, fluids, energy, hormones, enzymes and emotions;',
      'aide à la digestion;': 'aids digestion;',
      'éclaircit la vue, etc.': 'clarifies vision, etc.',
      'dégénérescence du système neuro-endocrinien;': 'degeneration of the neuro-endocrine system;',
      'affaiblissement du système immunitaire;': 'weakening of the immune system;',
      'dérèglement digestif;': 'digestive disruption;',
      'constipation ou diarrhée;': 'constipation or diarrhea;',
      'problème cardiaque;': 'cardiac problems;',
      'cycle menstruel irrégulier / S.P.M.;': 'irregular menstrual cycle / PMS;',
      'dépression;': 'depression;',
      'irritabilité, colère, frustration.': 'irritability, anger, frustration.',
      'Visualisez que vous êtes dans une bulle de lumière verte. Vous respirez normalement. Lors de l’inspiration, imaginez la lumière verte qui entre dans chacune de vos cellules. À l’expiration, imaginez cette lumière qui ressort chargée de toutes les impuretés qu’elle contenait.': 'Visualize yourself inside a bubble of green light. Breathe normally. As you inhale, imagine the green light entering each of your cells. As you exhale, imagine that light leaving, carrying away all the impurities it contained.',
      'Prenez quelques secondes pour relaxer tous vos muscles.': 'Take a few seconds to relax all your muscles.',
      'Placez vos deux mains, l’une par dessus l’autre, juste en dessous de votre nombril. Ce point, qui se nomme Tan Tien, est le centre énergétique de votre corps.': 'Place both hands, one on top of the other, just below your navel. This point, called the Tan Tien, is the energetic center of your body.',
      'Concentrez-vous sur votre respiration et dirigez l’inspiration vers le Tan Tien en gonflant l’abdomen.': 'Focus on your breathing and direct the inhalation toward the Tan Tien by expanding the abdomen.',
      'Si vous êtes stressé ou si votre foie est déséquilibré, assurez-vous d’avoir de la verdure dans votre environnement : plantes, fleurs, image de forêt, etc. Ayez aussi des objets qui représentent l’élément Eau : fontaine, aquarium, image de la mer, etc.': 'If you are stressed or your liver is out of balance, make sure you have greenery in your environment: plants, flowers, images of forests, etc. Also keep objects that represent the Water element: a fountain, an aquarium, images of the sea, etc.',
      'Les matériaux en bois ainsi que les couleurs vertes et bleu seront régénérateurs d’énergie dans la salle de séjour et dans la salle d’eau. Elles vous aideront à recharger votre système nerveux.': 'Wood materials and green and blue colors will be energetically regenerating in the living room and bathroom. They will help recharge your nervous system.',
      'Pour bien faire circuler l’énergie, assurez-vous que les couloirs et les aires de passage sont libres de tout encombrement. Évitez les piles de livres ou de « paperasse ». Rangez au fur et à mesure les objets que vous utilisez en les remettant à leur place respective.': 'To ensure good energy flow, make sure hallways and passageways are free of clutter. Avoid piles of books or "paperwork." Put objects back in their proper places as you use them.',
      'Aérez souvent la maison': 'Air out the house often',
      'Et finalement, un carillon de bois placé à l’extérieur sera bénéfique pour réveiller l’énergie en douceur.': 'And finally, a wooden wind chime placed outside will gently awaken the energy.',
      'La saison : Printemps': 'Season: Spring',
      'La direction : Est': 'Direction: East',
      'L’évolution : Naissance': 'Evolution: Birth',
      'Le climat : Vent': 'Climate: Wind',
      'La couleur : Vert et bleu': 'Color: Green and blue',
      'L’organe : Foie, vésicule biliaire': 'Organ: Liver, gallbladder',
      'Le sens : Vue': 'Sense: Sight',
      'La saveur : Acide': 'Flavor: Sour',
      'Les émotions : Frustration, irritabilité, colère, stress': 'Emotions: Frustration, irritability, anger, stress',
      'Le besoin : De se mouvoir, d’être actif, de travailler': 'Need: To move, to be active, to work',
      'Le désir : De charmer, de vaincre': 'Desire: To charm, to conquer',
      'La tendance à être : compétitif, déterminé, organisé, planifié, visionnaire, téméraire, irritable, colérique': 'Tendency: competitive, determined, organized, planned, visionary, reckless, irritable, choleric',
      'L’action : De commencer, de naître': 'Action: To begin, to be born',
      'Les accessoires : Plantes, verdure, bois': 'Accessories: Plants, greenery, wood',
      'Les pièces intérieures : Salle de séjour, salon': 'Interior rooms: Living room, lounge',
      'Les métiers : Sportif, affaire, politicien, vendeur, artiste de cirque, cascadeur, danseur.Les signes astrologiques chinois : tigre et lapin': 'Professions: Athlete, business, politician, salesperson, circus artist, stuntperson, dancer. Chinese astrological signs: tiger and rabbit',
      'Les problèmes de santé : douleurs musculaires, migraine, digestion disharmonieuse, constipation alterné de diarrhée, dépression, allergies, torticolis, toxicomanie.': 'Health issues: muscle pain, migraine, disharmonious digestion, alternating constipation and diarrhea, depression, allergies, torticollis, addiction.',
      'Les aides thérapeutiques : Herbes, aromathérapie, massage musculaire profond, relaxation, visualisation': 'Therapeutic aids: Herbs, aromatherapy, deep muscle massage, relaxation, visualization',
    },

    '/les-allergies-du-printemps/': {
      'Les allergies du printemps': 'Spring Allergies',
      'Acupuncture , Problèmes saisonniers': 'Acupuncture, Seasonal Issues',
      'Le retour du printemps apporte souvent lumière, douceur et renouveau. Mais pour plusieurs, cette saison s’accompagne aussi de symptômes inconfortables: éternuements, nez qui coule, congestion, démangeaisons, yeux irrités ou sensation d’encombrement.': 'The return of spring often brings light, warmth and renewal. But for many, this season also comes with uncomfortable symptoms: sneezing, runny nose, congestion, itching, irritated eyes or a feeling of stuffiness.',
      'En médecine chinoise, les allergies saisonnières ne sont pas envisagées uniquement comme une réaction à un élément extérieur comme le pollen. Elles sont aussi perçues comme le reflet d’un déséquilibre plus profond, lié à la manière dont le corps se défend, s’adapte et maintient son harmonie intérieure.': 'In Chinese medicine, seasonal allergies are not viewed solely as a reaction to an external element like pollen. They are also seen as a reflection of a deeper imbalance, linked to the way the body defends itself, adapts and maintains its inner harmony.',
      'Cette approche cherche donc à aller au-delà du simple soulagement des manifestations visibles. Elle s’intéresse au terrain de la personne, à sa vitalité globale, à sa respiration, à sa digestion et à sa capacité naturelle à faire face aux agressions de l’environnement.': 'This approach therefore seeks to go beyond simply relieving visible symptoms. It looks at the person’s constitution, overall vitality, breathing, digestion and natural capacity to handle environmental challenges.',
      'Selon cette vision, l’énergie du Poumon joue un rôle central dans la circulation de l’énergie défensive. Lorsqu’il est affaibli, le corps peut devenir plus sensible aux allergènes et les voies respiratoires peuvent être plus facilement encombrées. L’énergie du Reins participent eux aussi au soutien de cette énergie profonde, tandis que l’énergie de la Rate, associée au système digestif, contribue à la production de l’énergie nécessaire à l’équilibre général.': 'According to this view, the energy of the Lung plays a central role in the circulation of defensive energy. When weakened, the body can become more sensitive to allergens and the respiratory passages can more easily become congested. The energy of the Kidneys also participates in supporting this deep energy, while the energy of the Spleen, associated with the digestive system, contributes to the production of energy necessary for overall balance.',
      'C’est pourquoi l’acupuncture traditionnelle chinoise propose une approche globale et individualisée. Elle vise à apaiser les inconforts, tout en soutenant les fonctions internes qui participent à l’équilibre du corps. L’objectif est d’aider l’organisme à retrouver plus de stabilité, de fluidité et de résilience au fil de la saison.': 'This is why traditional Chinese acupuncture offers a global and individualized approach. It aims to soothe discomforts while supporting the internal functions that contribute to the body’s balance. The goal is to help the body regain greater stability, fluidity and resilience throughout the season.',
      'L’alimentation peut également jouer un rôle important. Dans cette perspective, les aliments très froids, glacés ou consommés crus en excès peuvent parfois fragiliser la digestion et favoriser une forme d’humidité interne, souvent associée à une sensation d’encombrement. À l’inverse, des aliments plus tièdes, simples et réconfortants peuvent mieux soutenir l’équilibre digestif et l’énergie du corps.': 'Diet can also play an important role. From this perspective, very cold, icy or excessively raw foods can sometimes weaken digestion and promote a form of internal dampness, often associated with a feeling of congestion. Conversely, warmer, simpler and more comforting foods can better support digestive balance and the body’s energy.',
      'Chaque personne vit les allergies différemment. C’est pourquoi l’accompagnement doit être adapté à sa réalité, à ses symptômes et à son terrain. Dans un cadre de soin attentif et personnalisé, l’acupuncture peut offrir un soutien précieux pour traverser la saison du printemps avec plus de confort et de douceur.': 'Each person experiences allergies differently. This is why care must be adapted to their reality, their symptoms and their constitution. Within an attentive and personalized care framework, acupuncture can offer valuable support for navigating the spring season with greater comfort and ease.',
      'Si les allergies reviennent d’année en année, il peut être bénéfique d’adopter une approche qui ne cherche pas seulement à calmer les symptômes, mais aussi à soutenir l’organisme dans son ensemble.': 'If allergies return year after year, it may be beneficial to adopt an approach that not only seeks to calm the symptoms, but also to support the body as a whole.',
    },

    '/le-tao/': {
      'Le Tao': 'The Tao',
      'la voie où s’achemine les mystères de la vie': 'the path where the mysteries of life unfold',
      'Si la vie m’était contée': 'If Life Could Be Told',
      'Au début était le Verbe': 'In the Beginning Was the Word',
      'Cartésiens purs et durs, prière de s’abstenir': 'Strict Rationalists, Please Abstain',
      '5 éléments : 5 mouvements': '5 Elements: 5 Movements',
      'Prenons par exemple la nuit et le jour. Ils sont...': "Let’s take night and day as an example. They are…",
      'Opposés : quand l’un est là, l’autre n’y est pas.': 'Opposites: when one is present, the other is not.',
      'Complémentaires : dans la nuit il y a la semence du jour et dans le jour il y a la semence de la nuit.': 'Complementary: in the night there is the seed of day, and in the day there is the seed of night.',
      'Interdépendants : la nuit ne peut exister si le jour n’existe pas.': 'Interdependent: night cannot exist if day does not exist.',
      'En équilibre : l’un comme l’autre a droit à une portion de la journée.': 'In balance: each has its share of the day.',
      'En transformation : l’un se transforme en laissant la place à l’autre.': 'In transformation: one transforms itself, making way for the other.',
      'Ils sont en perpétuel mouvement et il en sera ainsi jusqu’à la fin des temps.': 'They are in perpetual motion and will remain so until the end of time.',
      '— Monique St-Arnault': '— Monique St-Arnault',
      'La difficulté d’un tel exercice vient du fait que dans tous les phénomènes qui nous entourent – la nature, les saisons, la vie – rien n’est jamais statique, tout est en mouvement. Un instant on croit avoir trouvé les réponses à nos questions et l’instant d’après tout redevient confus, nous donnant ainsi l’impression de vivre dans un monde aussi bien illusoire qu’éphémère. Et pendant tout ce temps, malgré cette sensation d’éternel recommencement, la petite étincelle qui scintille à l’intérieur de soi nous donne l’espoir et le courage de pousser plus loin nos recherches, de toujours aller de l’avant !': 'The difficulty of such an exercise lies in the fact that in all the phenomena that surround us – nature, the seasons, life – nothing is ever static, everything is in motion. One moment we believe we have found the answers to our questions, and the next everything becomes confusing again, giving us the impression of living in a world that is as illusory as it is ephemeral. And throughout all this time, despite this sense of eternal recommencement, the little spark that glimmers inside us gives us the hope and courage to push our research further, to always move forward!',
      'Ce n’est pas d’aujourd’hui que l’humain désire ardemment connaître les mystérieux rouages de la vie, de l’esprit, des comportements et des émotions. Depuis toujours il se pose les questions existentielles : Qui suis-je ? Où vais-je ? Pourquoi ? D’où venons-nous ? Qui est le maître d’œuvre de tout cela ? Depuis plus de 10 000 ans les grands sages et philosophes orientaux se sont posé les mêmes questions. Voyons un peu ce qu’ils ont trouvé.': 'It is not new that humans ardently desire to understand the mysterious workings of life, the mind, behaviors and emotions. They have always asked existential questions: Who am I? Where am I going? Why? Where do we come from? Who is the master architect of all this? For more than 10,000 years, great Eastern sages and philosophers have asked the same questions. Let us see what they have found.',
      'Chacune des manifestations de la vie – la rotation de la Terre autour du Soleil, les variations climatiques, les saisons, les ondes sonores, la lumière, le règne végétal, animal, l’être humain, les émotions, la mort, etc. – tout est issu d’une seule et même énergie. Alors que certains utilisent l’expression « Le Souffle » pour la décrire, d’autres utilisent « Le Verbe », les orientaux l’appellent le « Qi », l’énergie créatrice universelle.': 'Each manifestation of life – the rotation of the Earth around the Sun, climate variations, the seasons, sound waves, light, the plant kingdom, the animal kingdom, the human being, emotions, death, etc. – everything comes from one and the same energy. While some use the expression “The Breath” to describe it, others use “The Word”, and Easterners call it “Qi”, the universal creative energy.',
      'Selon la sagesse orientale, le « Qi » est tout, il crée tout, il est dans tout. Certaines religions font référence au « Qi » en parlant de « Dieu », de « Allah » ou de « Yahvé ». C’est la matière fondamentale universelle. Tous les phénomènes de l’univers, tout ce qui nous entoure – de la plus petite fourmi à la plus gigantesque planète – résulte des mouvements et des transformations du « Qi ».': 'According to Eastern wisdom, “Qi” is everything, it creates everything, it is in everything. Some religions refer to “Qi” when speaking of “God”, “Allah” or “Yahweh”. It is the universal fundamental substance. All phenomena in the universe, everything that surrounds us – from the smallest ant to the most gigantic planet – result from the movements and transformations of “Qi”.',
      'Pour nous, occidentaux, ce concept est très nébuleux et souvent la risée des cartésiens purs et durs. L’idée qu’une chose soit à la fois dense et subtile, qu’elle constitue la vie et la mette en mouvement, qu’on puisse la voir et qu’elle soit en même temps invisible… Tout ceci ne peut être qu’un subterfuge, qu’une blague grotesque, qu’une illusion !': 'For us Westerners, this concept is very nebulous and often the subject of ridicule from strict rationalists. The idea that something can be both dense and subtle, that it constitutes life and sets it in motion, that we can see it and yet it is simultaneously invisible… All of this can only be a subterfuge, a grotesque joke, an illusion!',
      'Depuis toujours les idées nouvelles ont ébranlé les lettrés bien pensants et les scientifiques convaincus. Pourtant, il n’y a pas si longtemps encore on disait que la Terre était plate… Je crois sincèrement que dans un avenir rapproché l’explication scientifique du « Qi » sera validée par nombre d’expériences et tous les secteurs de notre vie en seront influencés pour notre plus grand bien. Mais en attendant que la science ne s’exécute, les pratiques du Qi Qong, du Tai Chi, de l’acupuncture, du Feng Shui, etc. sont accessibles à tous ceux qui veulent vivre l’expérience sensitive du « Qi ».': 'New ideas have always shaken established thinkers and convinced scientists. Yet not so long ago, people still said the Earth was flat… I sincerely believe that in the near future the scientific explanation of “Qi” will be validated by many experiments and all sectors of our lives will be influenced for our greatest good. But while waiting for science to catch up, the practices of Qi Gong, Tai Chi, acupuncture, Feng Shui, etc. are accessible to all those who want to experience “Qi” through their senses.',
      'L’approfondissement de ces concepts a permis l’élaboration d’un système de pensée, « le Taoïsme », qui a influencé depuis fort longtemps la culture chinoise dans tous les aspects de sa vie : astronomie, philosophie, science, médecine, psychologie, alimentation, design, environnement, art, spiritualité, etc.': 'The deepening of these concepts led to the development of a system of thought, “Taoism”, which has long influenced Chinese culture in all aspects of life: astronomy, philosophy, science, medicine, psychology, food, design, environment, art, spirituality, etc.',
      'Ce système de pensée – à la fois extrêmement sophistiqué, précis et logique – est arrivé en occident aux alentours des années 70. Il a permis à plusieurs milliers de personnes de prendre conscience du lien étroit qui existe entre l’homme et l’univers qu’il habite.': 'This system of thought – at once extremely sophisticated, precise and logical – arrived in the West around the 1970s. It allowed thousands of people to become aware of the close link that exists between humanity and the universe it inhabits.',
      'Une fois bien compris et assimilé, le taoïsme se prête à mille et un emplois.': 'Once properly understood and assimilated, Taoism lends itself to a thousand and one applications.',
      'Une chose est certaine, l’homme fait partie de ce grand Tout. Chaque seconde de sa vie est influencée par les fluctuations des multiples énergies cosmiques qui l’entourent. La naissance, la vie et la mort sont soumis au même dynamisme, aux mêmes souffles et à la même logique, du plus petit phénomène au plus grand. On peut ainsi mieux se comprendre, mieux comprendre les autres et mieux comprendre la vie pour mieux la vivre ! Voilà l’essence du Taoïsme.': 'One thing is certain: humanity is part of this great Whole. Every second of life is influenced by the fluctuations of the multiple cosmic energies that surround us. Birth, life and death are subject to the same dynamism, the same forces and the same logic, from the smallest to the greatest phenomenon. We can thus better understand ourselves, better understand others, and better understand life in order to live it more fully. That is the essence of Taoism.',
      'Les sages de ces temps anciens nous lèguent un message d’espoir remarquable en nous disant : « N’ayez point peur, vous faites partie du tout et ce tout est infiniment parfait, juste et à jamais. Alors, bon voyage ! » ♦': 'The sages of these ancient times leave us a remarkable message of hope, saying: “Have no fear, you are part of the whole and this whole is infinitely perfect, just and eternal. So, bon voyage!” ♦',
      'Toujours dans le but de nous aider à mieux comprendre l’univers qui nous entoure, aux deux forces que sont le Yin et le Yang on a ajouté les catégories suivantes – 5 éléments : 5 mouvements – qui représentent un dégradé plus subtil, un système de régulation plus précis. Si le yin / yang représente le couple fidèle, les 5 éléments sont leur progéniture et, bien sûr, ils ont beaucoup de caractère. Chaque élément en nourrit un autre et chaque élément en contrôle un autre. Si chacun respecte son rôle, l’équilibre dynamique sera maintenu.': 'Always seeking to help us better understand the universe around us, to the two forces of Yin and Yang were added the following categories – 5 elements: 5 movements – representing a more subtle gradient, a more precise regulatory system. If yin/yang represents the faithful couple, the 5 elements are their offspring and, of course, they have a lot of character. Each element nourishes another and each element controls another. If each respects its role, dynamic balance is maintained.',
      '“VIVRE, C’EST... Étudier le grand mouvement de la Vie\nComprendre le mouvement de la vie qui nous entoure nous permet de comprendre l’influence que ce mouvement a sur notre vie, donc de participer activement à notre mieux-être.”': '"LIVING IS... Studying the great movement of Life\nUnderstanding the movement of life that surrounds us allows us to understand its influence on our lives, and to actively participate in our well-being."',
    }
  };

  /* ── Engine ─────────────────────────────────────────────────── */
  function norm(s) {
    return s.replace(/['\u2018\u2019\u02BC]/g, '\u2019').replace(/[\u201C\u201D]/g, '\u201D').replace(/\u00A0/g, ' ');
  }

  function buildMap(lang) {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    if (!path.endsWith('/')) path += '/';
    var common = T.common || {};
    var specific = T[path] || {};
    var merged = {};
    [common, specific].forEach(function(src) {
      Object.keys(src).forEach(function(k) {
        merged[norm(k)] = src[k];
      });
    });
    return merged;
  }

  function applyEN() {
    var map = buildMap('en');
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: function(node) {
          var t = (node.parentElement || {}).tagName;
          if (!t) return NodeFilter.FILTER_REJECT;
          t = t.toLowerCase();
          if (t === 'script' || t === 'style' || t === 'noscript' || t === 'textarea') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node) {
      var raw = node.textContent;
      var key = norm(raw.trim());
      if (key && map[key] !== undefined) {
        node.textContent = raw.replace(raw.trim(), map[key]);
      }
    });
    document.documentElement.lang = 'en';
  }

  function updBtns(lang) {
    document.querySelectorAll('.msa-lb').forEach(function(b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }

  function setLang(lang) {
    if (lang === cur) return;
    localStorage.setItem(SK, lang);
    var p = curPath();
    if (IS_EN_PAGE) {
      if (lang === 'fr') location.href = p.replace(/^\/en\//, '/');
      return;
    }
    if (lang === 'en' && EN_PAGES.indexOf(p) !== -1) { location.href = '/en' + p; return; }
    if (lang === 'fr') { location.reload(); return; }
    applyEN();
    updBtns(lang);
    cur = lang;
  }

  /* ── Button injection ────────────────────────────────────────── */
  function inject() {
    var s = document.createElement('style');
    s.textContent = '.msa-ls{display:inline-flex;align-items:center;gap:0}.msa-ls-header{padding:0 10px}.msa-ls-footer{display:flex;justify-content:center;margin-top:10px}.msa-sep{color:rgba(255,255,255,.25);font-size:9px;line-height:1;pointer-events:none}.msa-lb{border:none;margin:0;background:none!important;color:rgba(255,255,255,.85)!important;font:600 9px/1 Jost,sans-serif;letter-spacing:.05em;padding:0;cursor:pointer;transition:color .18s;text-transform:uppercase;box-shadow:none!important}.msa-lb.active{color:#E9B88A!important}.msa-lb:hover:not(.active){color:#fff!important}#menu-menu-mobile-view li a{color:#182A23!important}#menu-menu-mobile-view li a:hover{color:#E9B88A!important}';
    document.head.appendChild(s);

    function mkPill(cls) {
      var d = document.createElement('div');
      d.className = 'msa-ls ' + cls;
      var isFr = cur === 'fr';
      d.innerHTML = '<button class="msa-lb' + (isFr ? ' active' : '') + '" data-lang="fr" onclick="msaSetLang(\'fr\')">FR</button>'
                  + '<span class="msa-sep">|</span>'
                  + '<button class="msa-lb' + (!isFr ? ' active' : '') + '" data-lang="en" onclick="msaSetLang(\'en\')">EN</button>';
      return d;
    }

    // Header: append as <li> inside #menu-menu-principal — already display:flex row,
    // so pill sits inline with Blog with zero impact on the outer header flex layout
    var navWidgets = document.querySelectorAll('.elementor-widget-jkit_nav_menu');
    var navWidget = null;
    for (var i = 0; i < navWidgets.length; i++) {
      if (!navWidgets[i].classList.contains('elementor-hidden-desktop') && !navWidgets[i].closest('.elementor-hidden-desktop')) {
        navWidget = navWidgets[i];
        break;
      }
    }
    if (navWidget) {
      var menuList = navWidget.querySelector('#menu-menu-principal');
      if (menuList) {
        var li = document.createElement('li');
        li.style.cssText = 'list-style:none;display:flex;align-items:center;padding:0';
        li.appendChild(mkPill('msa-ls-header'));
        menuList.appendChild(li);
      }
    }

    // Footer: after social icons
    var sw = document.querySelector('.elementor-social-icons-wrapper');
    if (sw) sw.parentNode.insertBefore(mkPill('msa-ls-footer'), sw.nextSibling);
  }

  window.msaSetLang = setLang;

  document.addEventListener('DOMContentLoaded', function() {
    inject();
    if (IS_EN_PAGE) return; // page is already English; pill marked via cur
    if (cur === 'en') {
      var p = curPath();
      if (EN_PAGES.indexOf(p) !== -1) { location.replace('/en' + p); return; }
      applyEN(); updBtns('en');
    }
  });
})();
