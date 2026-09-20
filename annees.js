/* EN TERMES SIMPLES
   Monique pratique depuis 1990. Le nombre d'annees d'experience affiche sur le
   site devenait faux a chaque 1er janvier et il fallait le corriger a la main.
   Ce fichier le recalcule tout seul a l'ouverture de la page.

   Pourquoi remplacer le NOMBRE dans le texte plutot que d'ajouter une balise
   <span> dans le HTML : translate.js fait correspondre des noeuds de texte
   ENTIERS a son dictionnaire francais->anglais. Couper un paragraphe en trois
   morceaux avec une <span> casserait la traduction anglaise de ce paragraphe.
   On laisse donc le HTML intact et on retouche le chiffre apres coup.

   Sans JavaScript, le texte ecrit en dur reste affiche et demeure vrai
   (« depuis plus de 35 ans ») — la page ne casse jamais. */

(function () {
  var DEBUT = 1990;

  function annees() {
    return new Date().getFullYear() - DEBUT;
  }

  /* Les deux langues. L'ordre compte : la variante « plus de » doit passer
     avant la variante simple, sinon la seconde n'attrape jamais rien. */
  function regles(n) {
    return [
      [/depuis\s+plus\s+de\s+\d+\s*ans/gi, 'depuis ' + n + ' ans'],
      [/plus\s+de\s+\d+\s*ans\s+d[’']expérience/gi, n + ' ans d’expérience'],
      [/\bDepuis\s+\d+\s*ans\b/g, 'Depuis ' + n + ' ans'],
      [/for\s+over\s+\d+\s*years/gi, 'for ' + n + ' years'],
      [/over\s+\d+\s*years\s+of\s+experience/gi, n + ' years of experience'],
      [/\bFor\s+\d+\s*years\b/g, 'For ' + n + ' years']
    ];
  }

  function appliquer() {
    var n = annees();
    var r = regles(n);

    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: function (node) {
          var p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          var t = p.tagName.toLowerCase();
          if (t === 'script' || t === 'style' || t === 'noscript' || t === 'textarea') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        } },
      false
    );

    var node;
    while ((node = walker.nextNode())) {
      var avant = node.textContent;
      var apres = avant;
      for (var i = 0; i < r.length; i++) {
        apres = apres.replace(r[i][0], r[i][1]);
      }
      if (apres !== avant) node.textContent = apres;
    }
  }

  function demarrer() {
    appliquer();

    /* Passer en anglais reinjecte le texte du dictionnaire (« for over 35
       years »), ce qui effacerait notre correction. On repasse derriere. */
    if (typeof window.msaSetLang === 'function' && !window.msaSetLang.__annees) {
      var original = window.msaSetLang;
      var enveloppe = function (lang) {
        var res = original.apply(this, arguments);
        appliquer();
        return res;
      };
      enveloppe.__annees = true;
      window.msaSetLang = enveloppe;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
