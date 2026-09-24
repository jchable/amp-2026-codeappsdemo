# Changelog — Contoso

## 1.0.0 — 2026-09-23

Première version.

- Tokens à trois niveaux (`--cto-*`) : 15 couleurs primitives, échelles d'espacement, de rayons et de typographie ; 35 tokens sémantiques ; tokens de composant : `--cto-bouton-primaire-fond|texte` (Bouton, surchargés par Souche) et `--cto-souche-*` (Souche).
- Deux thèmes : **Comptoir** (par défaut) et **Jour** (clair).
- 12 composants : Bandeau, Bouton, Champ, ChoixSegmente, EtatVide, Grille, Page, Puce, Souche, Surface, Tampon, Titre.
- Documentation vivante sur `#/design-system`.
- Gouvernance testée : tokens définis, aucune couleur en dur, contrastes calculés dans les deux thèmes, frontière d'import, fiche de doc obligatoire.
- Écarts visuels volontaires par rapport à l'app d'avant le DS : bordures des champs et des puces de filtre plus contrastées (WCAG 1.4.11) ; espacements et rayons alignés sur l'échelle de 4 px.
