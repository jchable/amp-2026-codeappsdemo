# Contoso — design system d'aMP Tickets

Tokens, thèmes et composants React. Voir la documentation vivante : `npm run dev`, puis `http://localhost:3000/#/design-system`.
Conception : `docs/superpowers/specs/2026-09-23-design-system-contoso-design.md`.

## Utiliser

```tsx
import { Bouton, Surface, Titre } from "../design-system";
```

Toujours depuis `index.ts` : jamais d'import profond. Le thème par défaut (Comptoir) est posé sur `:root` ; un autre thème s'active avec `data-theme="jour"` sur un conteneur.

## Règles

1. Un composant ne lit que des tokens sémantiques (`--cto-fond-surface`) ou de composant, jamais une couleur primitive, jamais une valeur de couleur brute.
2. Le DS n'importe rien de `domain/`, `data/`, `hooks/`, `generated/`, de `components/`, d'`App` ni du SDK.
3. Aucun token, aucun composant sans usage réel dans l'app.
4. Les contrastes du manifeste sont vérifiés dans les deux thèmes par `npm test`.

## Proposer un token

1. Décrire l'usage. Sans usage, refus.
2. Ajouter le token dans `tokens/primitifs.css` ou dans **les deux thèmes** de `tokens/semantiques.css`, puis dans `tokens/manifeste.ts`.
3. S'il porte du texte, un contour ou un anneau de focus, ajouter sa paire dans `PAIRES_CONTRASTE`.
4. Lancer `npm test`, puis noter le changement dans `CHANGELOG.md`.

## Proposer un composant

1. Un usage existant dans l'app.
2. Test rouge (`<Nom>.test.tsx`), puis `<Nom>.tsx` et `<Nom>.css` (tokens uniquement).
3. La fiche `<Nom>.doc.tsx` (démo, props, accessibilité, à faire / à éviter).
4. L'exporter depuis `index.ts` ; la liste exacte des exports est testée.

## Versionnage

Semver. Retirer ou renommer un token, une prop ou une variante est un changement **cassant** (majeure).
