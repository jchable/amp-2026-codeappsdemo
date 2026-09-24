# Design system Contoso — spec de conception

Date : 2026-09-23 · Branche : `feat/design-system` (worktree `.worktrees/design-system`)
Base : `e1bc924` (`step/branding` = `step/2-development`).

## 1. Intention

Donner à l'app aMP Tickets un design system au niveau d'un DS d'entreprise, nommé **Contoso** :
tokens à trois niveaux, thèmes, bibliothèque de composants React testés, documentation vivante,
règles de gouvernance vérifiées par des tests. L'app existante le consomme ensuite, sans
changement de comportement.

**Succès** = `npm test` vert (tests existants inchangés), `npm run build` sans erreur ni warning,
thème Comptoir visuellement identique à l'app actuelle (hors les deux écarts volontaires listés au
§7), thème Jour lisible et conforme (contraste, §8), page de doc complète, aucune couleur en dur
hors des primitifs, dans le DS comme dans le CSS de l'app.

## 2. Périmètre

**Dans le périmètre** : tokens (primitifs, sémantiques, composants), thèmes Comptoir et Jour,
12 composants, page de doc `#/design-system`, README et CHANGELOG du DS, migration des composants
métier, tests de composants et de gouvernance, mise à jour de `CLAUDE.md`.

**Hors périmètre (YAGNI)** : Storybook, package npm séparé, sélecteur de thème dans l'app,
`jest-axe` ou toute nouvelle dépendance, génération automatique de la doc, composants sans usage
actuel (modale, menu, tableau, toast…), mode « suit `prefers-color-scheme` ».

**Intouchés** : `src/domain/`, `src/data/`, `src/hooks/`, `src/generated/`, `.power/`,
`docs/spec.md` (aucune règle métier ne change).

**Modifiés à la marge** : `PowerProvider.tsx` (ses `<div className="banniere …">` deviennent des
`<Bandeau>` : sans cela il perdrait son style quand `src/styles.css` est supprimé ; la logique `getContext()`
n'est pas touchée) et `main.tsx` (imports des styles du DS, route de la doc).

## 3. Architecture

```
src/design-system/
  index.ts                  point d'entrée unique (composants et types, pas de CSS)
  styles.css                agrégateur : importe primitifs, sémantiques et reset (importé par main.tsx)
  polices.ts                imports @fontsource (Unbounded, Hanken Grotesk), importé par main.tsx
  tokens/
    primitifs.css           seul fichier autorisé à contenir des couleurs brutes
    semantiques.css         thèmes : :root/[data-theme="comptoir"] et [data-theme="jour"]
    reset.css               reset global minimal (box-sizing, focus, reduced-motion)
    manifeste.ts            liste typée des tokens, paires de contraste, points de rupture
  composants/<Nom>/         <Nom>.tsx (importe son <Nom>.css), <Nom>.test.tsx, <Nom>.doc.tsx
  doc/                      page de documentation (chargée en React.lazy)
  gouvernance.test.ts       tests de gouvernance (§8)
  README.md                 guide de contribution
  CHANGELOG.md              journal du DS, versionnage sémantique, démarre en 1.0.0
```

Sens des dépendances : `App`/composants métier → `design-system` (via `index.ts` seulement).
Le DS ne dépend de rien d'autre du projet. Le thème par défaut est posé sur `:root` : tout ce qui
est rendu hors de la racine d'`App` (par exemple `PowerProvider`) est donc en Comptoir.

## 4. Tokens

Préfixe : `--cto-`.

**Règle d'usage.** Les **couleurs** primitives ne sont jamais lues par un composant : il passe par
les niveaux 2 et 3. Les primitifs **non colorimétriques** (espacement, rayons, tailles de texte,
poids, familles, durées, `cible-tactile`) sont sans variation de thème : les composants les lisent
directement, il n'y a pas de couche sémantique pour eux.

### Niveau 1 — primitifs (valeurs brutes)

Palettes en échelle. Les valeurs de l'actuel `src/styles.css` deviennent les ancres, à une exception près
(`#9bb8b9`, remplacé par `teal-500` pour la bordure des champs, voir §7) :

| Palette | Pas → valeur |
|---|---|
| teal | 50 `#eaf6f4` · 400 `#7fb7b8` · 500 `#4e8d92` · 700 `#0f4c55` · 800 `#0a3940` · 950 `#0d2b2e` |
| corail | 100 `#ffe3dc` · 500 `#ff7a59` · 800 `#9b1c14` · 900 `#7a1a0f` |
| ambre | 400 `#ffcb47` |
| menthe | 300 `#a8e0cc` |
| neutre | 0 `#ffffff` · 50 `#fbfefd` · 200 `#c9d8d6` |

Aucune nouvelle valeur de couleur n'est introduite : les deux thèmes se composent de ces ancres.
Un pas ajouté plus tard doit passer les tests de contraste et être noté au CHANGELOG.

Autres primitifs (sans variation de thème) :

- espacement base 4 px : `space-1` à `space-8` (4 à 32 px) ;
- rayons : `rayon-sm` 8, `rayon-md` 12, `rayon-lg` 16, `rayon-xl` 22, `rayon-pleine` 999 px ;
- tailles de texte : `taille-xs` 13, `taille-sm` 14, `taille-md` 15, `taille-lg` 17, `taille-xl` 22,
  `taille-2xl` 30 px ;
- poids : `poids-normal` 400, `poids-moyen` 500, `poids-semi` 600, `poids-gras` 700, `poids-extra` 800 ;
- familles : `police-titre` (Unbounded Variable), `police-texte` (Hanken Grotesk Variable) ;
- `opacite-attenuee` 0.85, `cible-tactile` 44 px.

Élévation et durées d'animation ne sont **pas** définies : rien ne les utilise aujourd'hui (YAGNI).
Les valeurs de l'app actuelle qui ne tombent pas sur l'échelle sont arrondies (voir §7).

### Niveau 2 — sémantiques (redéfinis par thème)

35 tokens, tous redéfinis dans chaque thème :

- Fonds et textes : `fond-page`, `fond-surface`, `fond-creux`, `fond-champ`, `texte-principal`,
  `texte-sur-surface`, `texte-sur-creux`. L'atténuation d'un texte passe par le primitif
  `opacite-attenuee`, pas par un token de couleur.
- Bordures : `bordure-douce` et `bordure-pointille` (décoratives), `bordure-controle-page` (bord
  d'un contrôle posé sur la page : puce), `bordure-controle-surface` (bord d'un contrôle posé sur
  une surface claire : champ).
- Focus : `anneau-focus` (sur la page), `anneau-focus-surface` (sur surface claire et sur souche),
  `anneau-focus-creux` (sur surface creuse : en Jour l'anneau de la page, `teal-950`, y serait
  invisible, ratio ≈ 1,2, d'où un token dédié).
- Actions : `action-primaire-fond|texte`, `action-accent-fond|texte`, `selection-fond|texte`
  (puce active).
- Souches : `priorite-haute|moyenne|basse|neutre-fond`, `encre-souche`, `souche-contour`,
  `separateur-souche`.
- Retours : `retour-erreur-fond|texte|texte-surface|bordure`, `retour-info-fond|texte|bordure`.
- `voile-clair`.

Les valeurs translucides (voile du tampon, séparateur de souche) sont exprimées à ce niveau par
`color-mix()` ; les composants n'écrivent jamais `rgba(...)`. Elles sont exclues des tests de
contraste (aucune information n'y est portée).

### Niveau 3 — composants

Uniquement là où la surcharge a du sens : `--cto-bouton-primaire-fond|texte` (définis par `Bouton`
à partir de `action-primaire-*` ; `Souche` les redéfinit, par un sélecteur descendant, pour ses
boutons à l'encre), `--cto-souche-fond` (défini par les classes de ton
`.cto-souche--haute|moyenne|basse|neutre`, lu par la règle de base `.cto-souche`) et
`--cto-souche-tete-hauteur` / `--cto-souche-encoche` (la position et le rayon de l'encoche du masque
en dépendent : `Souche` possède les deux). Tout autre style lit directement le niveau 2.

### Thèmes

- **Comptoir** (défaut, sélecteur `:root` et `[data-theme="comptoir"]`) : rendu actuel. Anneau de
  focus blanc sur la page et sur surface creuse ; `souche-contour` transparent.
- **Jour** (`[data-theme="jour"]`) : page `teal-50`, surfaces `neutre-50`, texte `teal-950`,
  actions `teal-700`, cartes « creuses » restant `teal-800` sur texte clair. Anneau de focus
  `teal-950` (le blanc serait invisible sur `teal-50`, ratio 1,11). Bord des contrôles sur la page :
  `teal-500`. Comme les pastels de priorité se distinguent peu d'une page claire (ratio 1,3 à 2,3),
  `souche-contour` vaut `teal-500` dans ce thème. Les pastels et l'encre des souches restent
  identiques dans les deux thèmes.

Les thèmes ne redéfinissent que le niveau 2. Ils définissent exactement le même jeu de tokens.

Le point de rupture (860 px) n'est pas un token CSS (limite des `@media`) : c'est une constante du
manifeste, documentée.

## 5. Composants

Chacun correspond à un usage existant. Les 12 : **Bouton**, **Champ**, **ChoixSegmente**, **Puce**,
**Tampon**, **Bandeau**, **Surface**, **Souche**, **EtatVide**, **Titre**, **Page**, **Grille**.

| Composant | Remplace | Contrat |
|---|---|---|
| Bouton | `.bouton`, `.valider`, `.actions button`, `.autre`, `.suppr`, `.voir` | variantes `primaire` · `accent` (jaune, bouton de « Prochain ») · `secondaire` · `discret` (liens `.suppr` et `.voir`) ; tailles `normale` · `compacte` ; `pleineLargeur` ; `type="button"` par défaut ; `forwardRef` ; attributs natifs |
| Champ | label + input/textarea | `multiligne` ; erreur reliée par `aria-describedby` + `aria-invalid` ; `forwardRef`. La prop `erreur` n'est pas encore utilisée par l'app (les messages du domaine ne sont pas rattachés à un champ) : elle est construite, testée et documentée, sans plus |
| ChoixSegmente | 3 puces de priorité | `radiogroup` de `<input type="radio">` natifs de même `name` : flèches et arrêt de tabulation unique viennent du navigateur, le DS ne les réimplémente pas (et jsdom ne peut pas les tester) |
| Puce | filtres de statut | `aria-pressed` ; compteur optionnel |
| Tampon | statut incliné | présentationnel |
| Bandeau | `.banniere` | tons `info`, `erreur` ; `role="alert"` pour l'erreur |
| Surface | `.bloc`, `.prochain` | tons `claire`, `creuse` |
| Souche | `.souche` | prop `ton` (`haute` · `moyenne` · `basse` · `neutre`) ; emplacements `numero` et `tampon` (nœuds React) ; ne connaît pas le domaine |
| EtatVide | `.vide` | |
| Titre | `h1`–`h3` | niveau sémantique et taille visuelle indépendants |
| Page | `.page` | conteneur centré |
| Grille | `.affichage`, `.souches` | modes `deux-colonnes` (1 colonne sous 860 px) et `auto` |

Règles communes : aucune couleur primitive (§4) ; `className` et attributs natifs transmis ;
cible tactile 44 px sur `pointer: coarse` ; focus visible ; `prefers-reduced-motion` respecté ; la
couleur ne porte jamais seule une information (la souche affiche toujours « Priorité … » en texte) ;
noms en français métier ; zéro `any`.

## 6. Documentation

Page `#/design-system`, chargée par `main.tsx` via `React.lazy` selon `location.hash` (pas de
router). Sections : Principes · Fondations (pastilles avec nom, valeur, ratio de contraste ;
espacement ; rayons ; typographie) · Thèmes (comparaison côte à côte, sélecteur qui agit
sur un conteneur, pas sur `document`) · Composants (démos vivantes, variantes et états, tableau des
props, notes d'accessibilité, à faire / à éviter) · Gouvernance.

Chaque composant fournit son `<Nom>.doc.tsx` (démos + description des props). La page de doc
n'utilise que des composants Contoso et du CSS propre à la doc.

## 7. Migration de l'app

Le DS est construit en entier d'abord, puis l'app est migrée composant par composant
(`Prochain`, `StatusFilter`, `TicketForm`, `TicketList`, `App`), tests verts à chaque étape.
`App` pose `data-theme="comptoir"` sur sa racine. `PowerProvider` passe aux `<Bandeau>` (§2).
`src/styles.css` est supprimé, `main.tsx` importe `design-system/polices` et `design-system/styles.css`.

**CSS de l'app.** Un composant métier peut garder un CSS co-localisé pour sa mise en page propre
(le chiffre géant de `Prochain`, les textes secondaires `.qui`, `.pr`, `.desc`), à condition de ne
lire que des tokens : mêmes tests 2 et 3 qu'au §8, étendus à tout `src/**/*.css`. Les classes
métier globales de `src/styles.css` disparaissent, elles ne sont pas déplacées telles quelles.

**Les tests existants ne sont pas modifiés.** Si l'un doit l'être, on s'arrête et on en parle.

**Parité visuelle.** Captures Playwright de référence prises avant tout changement, rangées dans
`.superpowers/captures/avant/` (dossier déjà ignoré par git) : bureau et mobile ; formulaire vide
et en erreur ; liste remplie ; souche dépliée. Comparées après migration. Écarts **volontaires**
en Comptoir, imposés par le contraste des composants d'interface (WCAG 1.4.11, ≥ 3:1) :
1. bordure des champs `#9bb8b9` → `teal-500` (2,11 → 3,8) ;
2. bordure des puces de filtre `teal-500` → `teal-400` sur la page (2,54 → 4,3).
3. arrondi à l'échelle : espacements et rayons au multiple de 4 px le plus proche (écart ≤ 2 px,
   sauf le padding bas de page 72 → 64 px), tailles de texte 13,5 → 14 et 16 → 17 px (titre `h1`),
   atténuations 0,9 / 0,85 / 0,8 → `opacite-attenuee` 0,85 ; l'écart entre les cartes de la grille
   de tickets est de 20 px (l'arrondissement aux multiples de 4 les plus proches de 18 px donne 16 ou 20 ;
   16 ferait passer la disposition de 3 à 4 colonnes à 1280 px) ;
4. la souche `neutre` garde l'`opacity: 0.92` de l'ancienne carte résolue : littéral conservé
   volontairement, hors échelle ;
5. `TicketList` passe `className="tampon"` au `Tampon` : classe sans style, conservée pour que le
   test existant (`selector: ".tampon"`) reste inchangé.

Tout autre écart est un défaut et est signalé.

`CLAUDE.md` gagne une section « Design system Contoso » : (1) ni les composants de l'app ni leur
CSS n'utilisent de couleur en dur ni de couleur primitive ; (2) le DS n'importe jamais le métier ;
le tableau d'architecture est mis à jour.

## 8. Tests

**Composants** (Vitest + Testing Library, TDD rouge d'abord) : variantes et tons, `disabled`,
`forwardRef`, transmission de `className` et des attributs, rôles et noms accessibles, câblage ARIA
de `Champ`, clavier de `ChoixSegmente`.

**Gouvernance** (`gouvernance.test.ts`, lit les fichiers) :
1. chaque token du manifeste est défini dans le CSS ; chaque `var(--cto-*)` utilisé est défini ;
2. aucune couleur en dur (hex, `rgb()`, `hsl()`) dans `src/**/*.css` hors de `primitifs.css` ;
3. aucun `src/**/*.css` hors des tokens ne lit une **couleur** primitive (teal, corail, ambre,
   menthe, neutre) ;
4. les paires du manifeste (tableau ci-dessous) atteignent leur seuil dans **chaque** thème. Le ratio
   est calculé en résolvant la chaîne `var()` jusqu'à un hex ; un token de paire qui ne se résout
   pas en hex opaque fait échouer le test ;
5. Comptoir et Jour définissent exactement le même jeu de tokens sémantiques ;
6. le DS n'importe rien de `domain/`, `data/`, `hooks/`, `generated/`, du SDK ni d'`App` ;
7. tout composant exporté par `index.ts` possède son `.doc.tsx` ;
8. les composants interactifs (Bouton, Champ, ChoixSegmente, Puce) référencent le primitif
   `cible-tactile` ;
9. le point de rupture du manifeste (860 px) est celui des `@media (max-width: …)` du DS.

Périmètre des scans CSS (tests 1 à 3) : `src/design-system/**`, `src/components/**`, `src/*.css`
(hors l'ancien `src/styles.css`, tant qu'il n'est pas supprimé).

**Paires de contraste du manifeste** (seuil WCAG 2.2 : 4,5 texte · 3 grand texte, composant
d'interface, focus) :

| Paire | Seuil |
|---|---|
| `texte-principal` / `fond-page` ; `texte-sur-creux` / `fond-creux` ; `texte-sur-surface` / `fond-surface` | 4,5 |
| `texte-sur-surface` / `fond-champ` | 4,5 |
| `encre-souche` / chaque `priorite-*-fond` (haute, moyenne, basse, neutre) | 4,5 |
| `action-primaire-texte` / `-fond` et / `encre-souche` (boutons de souche) ; `action-accent-texte` / `-fond` ; `selection-texte` / `-fond` | 4,5 |
| `retour-erreur-texte` / `-fond` ; `retour-erreur-texte-surface` / `fond-surface` ; `retour-info-texte` / `-fond` | 4,5 |
| `retour-erreur-texte-surface` / `fond-champ` (bordure du champ invalide) | 3 |
| chaque `priorite-haute\|moyenne\|basse-fond` (chiffre géant de `Prochain`) / `fond-creux` | 3 |
| `bordure-controle-page` / `fond-page` ; `bordure-controle-surface` / `fond-champ` | 3 |
| `anneau-focus` / `fond-page` ; `anneau-focus-creux` / `fond-creux` ; `anneau-focus-surface` / `fond-surface` et chaque `priorite-*-fond` | 3 |

**Exemptions documentées** (bordures décoratives, l'information passe par le texte) : pointillé
des surfaces claires, bordure du bandeau d'erreur, séparateur des souches, contour des souches en
Comptoir.

**Page de doc** : elle s'affiche ; le sélecteur change `data-theme` sur son conteneur.

**Limites assumées** : jsdom ne calcule ni mise en page ni CSS de fichier ; le rendu (encoches de la
souche, responsive, thème Jour) est vérifié par captures Playwright manuelles, pas en CI. Le SDK
n'est jamais appelé dans les tests (règle 2 du projet).

## 9. Ordre d'exécution

1. Captures de référence de l'app actuelle.
2. Tokens, thèmes, reset, manifeste + tests de gouvernance.
3. Composants, un par un, en TDD.
4. Page de doc.
5. Migration de l'app.
6. Suppression de `src/styles.css`, `CLAUDE.md`, README et CHANGELOG du DS.

## 10. Risques

- **Régression visuelle** à la migration → captures avant/après, tests existants inchangés.
- **Sur-ingénierie** (DS de grande entreprise pour une app de 5 composants) → chaque composant
  et chaque token de niveau 3 doit avoir un usage actuel ; le reste est refusé.
- **Contraste** : les ratios de la spec ont été calculés sur les ancres (texte 5,8 à 14,8 ; les
  échecs trouvés à la relecture ont été corrigés au §4 et §7). Les tests du §8 verrouillent ces
  chiffres dans les deux thèmes.
- **Rendu du thème Jour** (pastels sur page claire, contour de souche) : jugement visuel, pas
  testable en CI → relecture par captures, à valider avec vous.
- **Hash routing** dans l'hôte Power Apps → à vérifier en `npm run power:run` avant de conclure.
  La page de doc est rendue hors de `PowerProvider` (elle n'a pas besoin de Power Platform).
- **Régression de `PowerProvider`** : il n'a pas de test ; sa migration vers `Bandeau` est
  couverte par les tests de `Bandeau` et par une vérification manuelle en mode SharePoint.
