/* EN TERMES SIMPLES
   Monique ne veut pas que les visiteurs enregistrent ses photos d'un clic
   droit. Ce fichier bloque le menu contextuel et le glisser-deposer, mais
   UNIQUEMENT sur les images.

   Pourquoi pas sur toute la page : bloquer le clic droit partout casse des
   usages legitimes — copier le numero de telephone, ouvrir un lien dans un
   nouvel onglet, se servir d'un lecteur d'ecran ou d'un traducteur. Le texte,
   les liens et les boutons gardent donc leur comportement normal.

   Ce que ca fait vraiment : ca arrete le clic droit distrait. Ca n'empeche
   PAS quelqu'un de determine (Ctrl+S, F12, URL directe de l'image, capture
   d'ecran, JavaScript desactive). Une image affichee par un navigateur est
   deja sur l'ordinateur du visiteur. La seule protection reelle contre la
   reutilisation serait un filigrane visible. */

(function () {
  var s = document.createElement('style');
  s.textContent =
    /* long appui sur iOS : empeche le menu « Enregistrer l'image » */
    'img{-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none;' +
    '-webkit-user-select:none}';
  document.head.appendChild(s);

  function estImage(el) {
    return el && el.tagName === 'IMG';
  }

  /* Capture au niveau du document : marche aussi pour les images ajoutees
     apres coup (galeries, contenu injecte). */
  document.addEventListener('contextmenu', function (e) {
    if (estImage(e.target)) e.preventDefault();
  });

  document.addEventListener('dragstart', function (e) {
    if (estImage(e.target)) e.preventDefault();
  });
})();
