# blog-content/ — les articles du blogue

Chaque fichier `.md` dans ce dossier devient un article du blogue, à l'adresse
`/blog/<slug>/`. Vous ne touchez jamais au HTML : il est généré automatiquement
(en-tête, menu et pied de page du site inclus) à chaque envoi sur GitHub.

## Écrire un article

Créez un fichier, par exemple `mon-article.md`, avec un petit en-tête puis le texte :

```markdown
---
titre: Le printemps et l'élément Bois
description: Une phrase pour les moteurs de recherche (≈ 155 caractères).
date: 2026-04-15
slug: printemps-element-bois
tags: bois, printemps, foie
---

Votre texte commence ici. **Gras**, *italique*, [liens](https://exemple.com),
listes, citations et sous-titres fonctionnent.

## Un sous-titre

- un point
- un autre
```

### Les champs de l'en-tête
- `titre` — le titre de l'article (sert aussi de `<h1>` et de balise title).
- `description` — le résumé pour Google et les réseaux sociaux.
- `date` — `AAAA-MM-JJ` ; affichée en français (« 15 avril 2026 »).
- `slug` — l'adresse de la page (`/blog/<slug>/`) ; sinon le nom du fichier est utilisé.
- `tags` — séparés par des virgules (optionnel).
- `status: draft` — l'article est ignoré (brouillon, non publié).
- `noindex: true` — la page existe mais n'est pas indexée par Google (pour les essais).

## Publier
Ajoutez/modifiez un `.md` ici → `git commit` + `git push` → l'article paraît en
ligne en une minute. Une note exportée en Markdown (UpNote, etc.) fonctionne aussi :
déposez-la ici, c'est tout.

Pour générer localement avant d'envoyer : `node tools/build-blog.js`
