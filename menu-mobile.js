/* EN TERMES SIMPLES
   Sur telephone, toucher a cote du menu hamburger ouvert le referme.

   Le theme prevoit un voile (.jkit-overlay) derriere le panneau, mais dans cet
   export il n'a ni position ni hauteur : le toucher passait au travers, vers
   le diaporama de l'accueil, et le menu restait ouvert. La feuille de style de
   l'accueil redonne au voile sa place (plein ecran, legerement assombri) ;
   ce script referme le menu quand on le touche.

   On reutilise le bouton x du theme plutot que de retirer la classe a la main :
   son animation de fermeture et son etat interne restent coherents. */
(function () {
  function fermer(e) {
    var panneau = document.querySelector('.jkit-menu-wrapper.active');
    if (!panneau || panneau.contains(e.target)) return;          // toucher DANS le menu : rien
    if (e.target.closest && e.target.closest('.jkit-hamburger-menu')) return;
    var croix = panneau.querySelector('.jkit-close-menu');
    if (!croix) return;
    // capture + preventDefault : le toucher ne doit pas, en plus, activer
    // un lien situe sous le voile.
    e.preventDefault();
    e.stopPropagation();
    croix.click();
  }
  document.addEventListener('click', fermer, true);
})();
