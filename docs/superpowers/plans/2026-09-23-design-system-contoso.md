# Design system Contoso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire le design system **Contoso** (tokens à 3 niveaux, thèmes Comptoir et Jour, 12 composants React testés, page de doc `#/design-system`, tests de gouvernance) puis migrer l'app aMP Tickets pour le consommer, sans changer son comportement.

**Architecture:** `src/design-system/` est autonome et n'importe rien du métier. Les tokens sont des variables CSS `--cto-*` (primitifs → sémantiques par thème → composants). Chaque composant a son `.tsx`, son `.css` (tokens uniquement), son test et sa doc. Des tests lisent les fichiers CSS/TS (via `import.meta.glob` `?raw`) pour faire respecter la gouvernance : tokens définis, aucune couleur en dur, contrastes calculés dans les deux thèmes, frontière d'import, doc complète. L'app est ensuite migrée composant par composant, tests existants inchangés.

**Tech Stack:** React 18, TypeScript 5 strict, Vite 5, Vitest 2 + Testing Library (jsdom). **Aucune nouvelle dépendance** (ni `@types/node` : les lectures de fichiers passent par `import.meta.glob`).

**Spec:** [`docs/superpowers/specs/2026-09-23-design-system-contoso-design.md`](../specs/2026-09-23-design-system-contoso-design.md) — à lire en entier avant de commencer (tableau des contrastes §8, écarts volontaires §7).

## Global Constraints

- **Aucun commit sans confirmation explicite de l'utilisateur.** Chaque étape « Commit » : afficher `git status --short` et le message prévu, demander, ne commiter qu'après un oui. L'utilisateur peut accorder un oui valable pour toute une tâche ; ne jamais étendre cet accord aux tâches suivantes sans qu'il le dise.
- Travail dans le worktree `E:\Sources\demo-amp-tickets\.worktrees\design-system` (branche `feat/design-system`). Ne pas `cd` vers le dépôt principal. Pas de `git stash` nu.
- TDD strict : test rouge d'abord (le voir échouer pour la bonne raison), code minimal, test vert. Aucune règle sans test.
- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`, **zéro `any`**. `npm run build` sans erreur ni warning à la fin de chaque tâche.
- Noms en français métier (`Bouton`, `variante`, `erreur`) ; termes techniques anglais tolérés (`forwardRef`, `props`).
- Préfixe des tokens `--cto-` ; préfixe des classes du DS `cto-` ; préfixe des classes CSS locales de l'app `app-` (pour ne jamais entrer en collision avec l'ancien `styles.css` pendant la migration).
- **Couleurs** : jamais de hex/`rgb()`/`hsl()` hors de `src/design-system/tokens/primitifs.css`. Un composant ne lit jamais une couleur primitive (`--cto-teal-…`, `--cto-corail-…`, `--cto-ambre-…`, `--cto-menthe-…`, `--cto-neutre-…`) : uniquement des tokens sémantiques ou de composant. Les primitifs non colorimétriques (`--cto-space-*`, `--cto-rayon-*`, `--cto-taille-*`, `--cto-poids-*`, `--cto-police-*`, `--cto-opacite-attenuee`, `--cto-cible-tactile`) se lisent directement. Pour un masque, utiliser `transparent`/`black`, pas `#0000`/`#000`.
- Le DS n'importe jamais `domain/`, `data/`, `hooks/`, `generated/`, `components/`, `App`, `PowerProvider` ni `@microsoft/power-apps`.
- Un seul point d'entrée : `src/design-system/index.ts`. Le code de l'app n'importe jamais un fichier profond du DS (`import … from "../design-system"`).
- Le SDK n'est jamais appelé ni simulé dans les tests. Ne modifier ni `src/domain/`, ni `src/data/`, ni `src/hooks/`, ni `src/generated/`, ni `.power/`, ni `docs/spec.md`.
- **Les tests existants (`src/components/*.test.*`, `src/domain`, `src/data`, `src/hooks`) ne sont pas modifiés.** S'il faut en modifier un : s'arrêter, le dire à l'utilisateur.
- Accessibilité : focus visible, cibles tactiles ≥ 44 px sur `pointer: coarse`, `prefers-reduced-motion` respecté, la couleur ne porte jamais seule une information, contrastes du §8 de la spec.
- Point de rupture responsive : 860 px (`POINT_DE_RUPTURE_PX`).
- Commandes : `npm test` (une passe), `npm test -- <chemin>` (un fichier), `npm run build`.
- Message de commit : conventionnel en français, terminé par la ligne `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Review Focus

Entrées ou conditions que la spec sous-entend sans qu'un test évident les couvre, les plus probables d'abord. Chacune a son test dans la tâche indiquée.

1. **Compteur à 0** : une `Puce` avec `compteur={0}` doit afficher « 0 » (le piège `{compteur && …}` l'avale). → Task 6.
2. **Bouton dans un formulaire** : un `Bouton` sans `type` ne doit pas soumettre le formulaire ; `type="submit"` doit le faire. → Task 3.
3. **Deux `Champ` sur la page** : chaque libellé désigne son propre champ (identifiants distincts). → Task 4.
4. **`ChoixSegmente` sans option correspondant à la valeur** : aucun radio coché, pas d'exception. → Task 5.
5. **Route de doc voisine** : `#/design-systemique` n'ouvre pas la doc ; `#/design-system` et `#/design-system/…` l'ouvrent. → Task 14.

Deux entrées de plus sont déjà verrouillées par les tests de gouvernance (Task 2) : un token utilisé mais non défini, et un thème qui oublie un token sémantique.

## File Structure

```text
src/design-system/
  index.ts                         Task 10  point d'entrée unique
  styles.css                       Task 2   agrégateur (importe les 3 fichiers de tokens)
  polices.ts                       Task 2   imports @fontsource
  doc-types.ts                     Task 11  types DocComposant / PropDoc
  gouvernance.test.ts              Tasks 2, 8, 10, 12
  tokens/
    contraste.ts (+test)           Task 1   luminance, ratioContraste
    analyseCss.ts (+test)          Task 1   lecture des blocs CSS, résolution var(), couleurs en dur
    manifeste.ts                   Task 2   listes de tokens, paires de contraste, point de rupture
    themes.ts                      Task 2   propriétés résolues de chaque thème (lecture ?raw)
    primitifs.css                  Task 2
    semantiques.css                Task 2
    reset.css                      Task 2
  composants/
    classes.ts (+test)             Task 3
    ton.ts                         Task 5   type TonPriorite
    Bouton/ Champ/ ChoixSegmente/ Puce/ Tampon/ Bandeau/ Surface/ EtatVide/ Titre/ Page/ Grille/ Souche/
      <Nom>.tsx  <Nom>.css  <Nom>.test.tsx  <Nom>.doc.tsx (docs : Task 12)
  doc/
    donnees.ts (+test)             Task 11
    registre.ts (+test)            Task 11/12
    PageDoc.tsx (+test) PageDoc.css SectionPrincipes/Fondations/Themes/Composants/Gouvernance.tsx   Task 11
  README.md  CHANGELOG.md          Task 16
src/routage.ts (+test)             Task 14
src/components/tonPriorite.ts (+test)  Task 13
src/components/{Prochain,StatusFilter,TicketForm,TicketList}.tsx + .css    Tasks 13-14
src/App.tsx, App.css, PowerProvider.tsx, main.tsx                           Task 15
src/styles.css                     supprimé Task 16
```

---

## Task 0: Base de travail — captures de référence et commit de la spec/plan

**Files:**
- Create (non commité, dossier ignoré par git) : `.superpowers/captures/avant/*.png`
- Commit : `docs/superpowers/specs/2026-09-23-design-system-contoso-design.md`, `docs/superpowers/plans/2026-09-23-design-system-contoso.md`

**Interfaces:**
- Produces: le jeu de captures « avant » comparé à la Task 17 ; un commit de base contenant spec et plan.

- [ ] **Step 1: Vérifier que le worktree est propre et vert**

Run: `git status --short` — attendu : uniquement les deux fichiers de doc ci-dessus (non suivis).
Run: `npm test` — attendu : 9 fichiers, 95 tests verts.

- [ ] **Step 2: Lancer l'app actuelle en mode mémoire**

Run (en arrière-plan) : `npm run dev` ; attendre `Local: http://localhost:3000/`. Si le port 3000 est déjà pris (autre worktree), arrêter l'autre serveur : `strictPort` interdit un autre port.

- [ ] **Step 3: Prendre les captures « avant »** avec les outils Playwright (`mcp__plugin_playwright_playwright__*`), en suivant l'**Annexe A** ci-dessous, dossier de sortie `.superpowers/captures/avant/`. Si l'outil refuse ce chemin, noter où il enregistre et le dire dans le compte rendu.

- [ ] **Step 4: Arrêter le serveur** (`TaskStop` ou Ctrl+C) et vérifier `git status --short` : les captures n'apparaissent pas (dossier ignoré).

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add docs/superpowers/specs/2026-09-23-design-system-contoso-design.md docs/superpowers/plans/2026-09-23-design-system-contoso.md
git commit -m "docs(ds): spec et plan du design system Contoso

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Annexe A — procédure de capture (avant et après)

Fenêtre bureau `1280×900`, mobile `390×844` (`browser_resize`). Chaque capture en page entière (`fullPage: true`). Noms de fichiers : `NN-état-format.png`.

1. `01-defaut-bureau`, `02-defaut-mobile` : app fraîchement chargée (2 demandes de démo).
2. `03-erreur-bureau` : cliquer « Créer » avec le formulaire vide (messages d'erreur).
3. `04-depliee-bureau` : cliquer « Voir la description : VPN inaccessible ».
4. Enrichir : remplir Titre « Imprimante en panne », Demandeur « Sarah », choisir « Basse », « Créer » ; puis cliquer « Marquer résolu : VPN inaccessible ». On a maintenant des souches Haute/Moyenne/Basse/Résolue.
5. `05-riche-bureau`, `06-riche-mobile` ; `07-filtre-resolu-bureau` : cliquer la puce « Résolu ».
6. `08-focus-bureau` : recharger, appuyer sur Tab jusqu'au premier bouton de souche (anneau de focus visible).

---

## Task 1: Utilitaires purs — contraste et lecture du CSS

**Files:**
- Create: `src/design-system/tokens/contraste.ts`, `src/design-system/tokens/analyseCss.ts`
- Test: `src/design-system/tokens/contraste.test.ts`, `src/design-system/tokens/analyseCss.test.ts`

**Interfaces:**
- Produces:
  - `luminance(hex: string): number` (lève si la valeur n'est pas `#rrggbb`)
  - `ratioContraste(a: string, b: string): number` (symétrique, entre 1 et 21)
  - `type Proprietes = Record<string, string>` (nom `--x` → valeur brute)
  - `extraireBlocs(css: string): { selecteur: string; proprietes: Proprietes }[]` (uniquement les propriétés personnalisées `--*`, commentaires ignorés)
  - `proprietesDe(css: string, fragmentSelecteur?: string): Proprietes` (fusion des blocs dont le sélecteur contient le fragment ; tous si omis ; le dernier gagne)
  - `resoudre(nom: string, proprietes: Proprietes): string` (suit `var(--x)` jusqu'à une valeur ; lève si non défini ou circulaire)
  - `variablesUtilisees(css: string): string[]` (noms `--x` apparaissant dans `var(--x`, sans doublon)
  - `couleursEnDur(css: string): string[]` (hex, `rgb(`, `rgba(`, `hsl(`, `hsla(` hors commentaires)

- [ ] **Step 1: Écrire les tests rouges de `contraste`**

`src/design-system/tokens/contraste.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { luminance, ratioContraste } from "./contraste";

describe("luminance", () => {
  it("vaut 0 pour le noir et 1 pour le blanc", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("refuse une valeur qui n'est pas un hex #rrggbb", () => {
    expect(() => luminance("rgb(0,0,0)")).toThrow(/hex/);
    expect(() => luminance("#fff")).toThrow(/hex/);
    expect(() => luminance("transparent")).toThrow(/hex/);
  });
});

describe("ratioContraste", () => {
  it("vaut 21 entre noir et blanc, dans les deux sens", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(ratioContraste("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("vaut 1 entre deux couleurs identiques", () => {
    expect(ratioContraste("#4e8d92", "#4e8d92")).toBeCloseTo(1, 5);
  });

  it("reproduit le calcul de la spec : teal-950 sur neutre-50", () => {
    expect(ratioContraste("#0d2b2e", "#fbfefd")).toBeCloseTo(14.76, 1);
  });
});
```

- [ ] **Step 2: Écrire les tests rouges de `analyseCss`**

`src/design-system/tokens/analyseCss.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { couleursEnDur, extraireBlocs, proprietesDe, resoudre, variablesUtilisees } from "./analyseCss";

const CSS = `
/* commentaire : --cto-fantome: #ffffff; */
:root {
  --cto-a: #112233;
  --cto-b: var(--cto-a);
}
[data-theme="jour"] {
  --cto-b: #ffffff;
}
@media (pointer: coarse) {
  .x { min-height: var(--cto-cible, 44px); }
}
`;

describe("extraireBlocs", () => {
  it("ignore les commentaires et les préambules @media, et ne garde que les propriétés --*", () => {
    const blocs = extraireBlocs(CSS);
    expect(blocs.map((b) => b.selecteur)).toEqual([":root", '[data-theme="jour"]', ".x"]);
    expect(blocs[0].proprietes).toEqual({ "--cto-a": "#112233", "--cto-b": "var(--cto-a)" });
    expect(blocs[2].proprietes).toEqual({});
  });
});

describe("proprietesDe", () => {
  it("fusionne tous les blocs, le dernier gagnant", () => {
    expect(proprietesDe(CSS)["--cto-b"]).toBe("#ffffff");
  });

  it("ne garde que les blocs dont le sélecteur contient le fragment", () => {
    expect(proprietesDe(CSS, ":root")["--cto-b"]).toBe("var(--cto-a)");
    expect(proprietesDe(CSS, 'data-theme="jour"')).toEqual({ "--cto-b": "#ffffff" });
  });

  it("garde une valeur contenant des virgules et des parenthèses", () => {
    const css = ":root { --cto-v: color-mix(in srgb, var(--cto-a) 40%, transparent); }";
    expect(proprietesDe(css)["--cto-v"]).toBe("color-mix(in srgb, var(--cto-a) 40%, transparent)");
  });
});

describe("resoudre", () => {
  it("suit une chaîne de var() jusqu'à la valeur", () => {
    expect(resoudre("--cto-b", proprietesDe(CSS, ":root"))).toBe("#112233");
  });

  it("lève si le token n'est pas défini", () => {
    expect(() => resoudre("--cto-absent", {})).toThrow(/non défini/);
    expect(() => resoudre("--cto-b", { "--cto-b": "var(--cto-absent)" })).toThrow(/non défini/);
  });

  it("lève sur une référence circulaire", () => {
    expect(() => resoudre("--cto-a", { "--cto-a": "var(--cto-b)", "--cto-b": "var(--cto-a)" })).toThrow(/circulaire/);
  });
});

describe("variablesUtilisees", () => {
  it("liste chaque variable lue par var(), sans doublon, hors commentaires", () => {
    const css = "/* var(--cto-fantome) */ .a { color: var(--cto-x); border: 1px solid var(--cto-x, var(--cto-y)); }";
    expect(variablesUtilisees(css)).toEqual(["--cto-x", "--cto-y"]);
  });
});

describe("couleursEnDur", () => {
  it("détecte hex, rgb(a) et hsl(a), hors commentaires", () => {
    const css = ".a { color: #fff; background: rgba(0,0,0,.5); border-color: #0d2b2e; outline-color: hsl(1 2% 3%); } /* #123456 */";
    expect(couleursEnDur(css)).toEqual(["#fff", "rgba(", "#0d2b2e", "hsl("]);
  });

  it("ne signale rien pour du CSS qui ne passe que par des variables", () => {
    expect(couleursEnDur(".a { color: var(--cto-texte-principal); background: transparent; }")).toEqual([]);
  });
});
```

- [ ] **Step 3: Lancer les tests pour les voir échouer**

Run: `npm test -- src/design-system/tokens`
Expected: FAIL — `Failed to resolve import "./contraste"` et `"./analyseCss"`.

- [ ] **Step 4: Implémenter `contraste.ts`**

```typescript
const HEX = /^#[0-9a-fA-F]{6}$/;

function canal(valeur: number): number {
  const v = valeur / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative WCAG d'une couleur `#rrggbb`. */
export function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`Couleur hex #rrggbb attendue, reçu : ${hex}`);
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs `#rrggbb`, de 1 à 21. */
export function ratioContraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}
```

- [ ] **Step 5: Implémenter `analyseCss.ts`**

```typescript
export type Proprietes = Record<string, string>;
export type Bloc = { selecteur: string; proprietes: Proprietes };

const COMMENTAIRE = /\/\*[\s\S]*?\*\//g;

function sansCommentaires(css: string): string {
  return css.replace(COMMENTAIRE, "");
}

function lireProprietes(corps: string): Proprietes {
  const resultat: Proprietes = {};
  for (const ligne of corps.split(";")) {
    const i = ligne.indexOf(":");
    if (i === -1) continue;
    const nom = ligne.slice(0, i).trim();
    if (nom.startsWith("--")) resultat[nom] = ligne.slice(i + 1).trim();
  }
  return resultat;
}

/** Blocs `sélecteur { … }` d'un CSS sans imbrication (les @media sont aplatis : seul le bloc interne compte). */
export function extraireBlocs(css: string): Bloc[] {
  const blocs: Bloc[] = [];
  for (const [, selecteur, corps] of sansCommentaires(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    blocs.push({ selecteur: selecteur.trim(), proprietes: lireProprietes(corps) });
  }
  return blocs;
}

export function proprietesDe(css: string, fragmentSelecteur = ""): Proprietes {
  return extraireBlocs(css)
    .filter((b) => b.selecteur.includes(fragmentSelecteur))
    .reduce<Proprietes>((acc, b) => ({ ...acc, ...b.proprietes }), {});
}

export function resoudre(nom: string, proprietes: Proprietes, profondeur = 0): string {
  if (profondeur > 10) throw new Error(`Référence circulaire autour de ${nom}`);
  const valeur = proprietes[nom];
  if (valeur === undefined) throw new Error(`Token non défini : ${nom}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(valeur);
  return reference ? resoudre(reference[1], proprietes, profondeur + 1) : valeur;
}

export function variablesUtilisees(css: string): string[] {
  const noms = [...sansCommentaires(css).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
  return [...new Set(noms)];
}

export function couleursEnDur(css: string): string[] {
  return [...sansCommentaires(css).matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g)].map((m) => m[0]);
}
```

- [ ] **Step 6: Lancer les tests pour les voir passer**

Run: `npm test -- src/design-system/tokens`
Expected: PASS (2 fichiers, 17 tests).

- [ ] **Step 7: Vérifier le typage**

Run: `npm run build` — attendu : succès sans warning.

- [ ] **Step 8: Commit (après confirmation)**

```bash
git add src/design-system/tokens/contraste.ts src/design-system/tokens/contraste.test.ts src/design-system/tokens/analyseCss.ts src/design-system/tokens/analyseCss.test.ts
git commit -m "feat(ds): calcul de contraste WCAG et lecture des tokens CSS

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Tokens, thèmes, reset et tests de gouvernance des tokens

**Files:**
- Create: `src/design-system/tokens/manifeste.ts`, `themes.ts`, `primitifs.css`, `semantiques.css`, `reset.css`, `src/design-system/styles.css`, `src/design-system/polices.ts`
- Test: `src/design-system/gouvernance.test.ts`

**Interfaces:**
- Consumes: `proprietesDe`, `resoudre`, `variablesUtilisees`, `couleursEnDur` (Task 1), `ratioContraste` (Task 1).
- Produces:
  - `manifeste.ts` : `POINT_DE_RUPTURE_PX = 860` ; `TOKENS_PRIMITIFS_COULEUR`, `TOKENS_PRIMITIFS_AUTRES`, `TOKENS_SEMANTIQUES` (tableaux `readonly` de noms `--cto-…`) ; `type PaireContraste = { avantPlan: string; fond: string; seuil: 3 | 4.5 }` ; `PAIRES_CONTRASTE: readonly PaireContraste[]`.
  - `themes.ts` : `type NomTheme = "comptoir" | "jour"` ; `NOMS_THEMES` ; `PROPRIETES_PRIMITIFS` ; `BLOCS_THEME` (tokens sémantiques par thème) ; `PROPRIETES_THEME` (primitifs + sémantiques, résolvables).
  - CSS : les 35 tokens sémantiques du §4 de la spec, définis **entièrement** dans chacun des deux thèmes.

- [ ] **Step 1: Écrire le test de gouvernance (rouge)**

`src/design-system/gouvernance.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { couleursEnDur, proprietesDe, resoudre, variablesUtilisees, type Proprietes } from "./tokens/analyseCss";
import { ratioContraste } from "./tokens/contraste";
import {
  PAIRES_CONTRASTE,
  TOKENS_PRIMITIFS_AUTRES,
  TOKENS_PRIMITIFS_COULEUR,
  TOKENS_SEMANTIQUES,
} from "./tokens/manifeste";
import { BLOCS_THEME, NOMS_THEMES, PROPRIETES_PRIMITIFS, PROPRIETES_THEME } from "./tokens/themes";

// Périmètre des scans CSS : le DS, les composants de l'app et les CSS à la racine de src/
// (hors l'ancien src/styles.css, tant qu'il n'est pas supprimé).
const fichiersCss = import.meta.glob<string>(
  ["/src/design-system/**/*.css", "/src/components/**/*.css", "/src/*.css", "!/src/styles.css"],
  { query: "?raw", import: "default", eager: true }
);

const PRIMITIFS = "/src/design-system/tokens/primitifs.css";
const SEMANTIQUES = "/src/design-system/tokens/semantiques.css";
const cles = (p: Proprietes) => Object.keys(p).sort();

describe("gouvernance — tokens", () => {
  it("le manifeste et primitifs.css déclarent exactement les mêmes tokens", () => {
    expect(cles(PROPRIETES_PRIMITIFS)).toEqual([...TOKENS_PRIMITIFS_COULEUR, ...TOKENS_PRIMITIFS_AUTRES].sort());
  });

  it("le manifeste et chaque thème déclarent exactement les mêmes tokens sémantiques", () => {
    for (const nom of NOMS_THEMES) {
      expect(cles(BLOCS_THEME[nom]), `thème ${nom}`).toEqual([...TOKENS_SEMANTIQUES].sort());
    }
  });

  it("les paires de contraste ne référencent que des tokens sémantiques du manifeste", () => {
    const connus = new Set<string>(TOKENS_SEMANTIQUES);
    const inconnus = PAIRES_CONTRASTE.flatMap((p) => [p.avantPlan, p.fond]).filter((t) => !connus.has(t));
    expect(inconnus).toEqual([]);
  });

  it("chaque var(--cto-*) utilisée est définie quelque part dans le CSS", () => {
    const definis = new Set(Object.values(fichiersCss).flatMap((css) => Object.keys(proprietesDe(css))));
    const manquants = Object.entries(fichiersCss).flatMap(([chemin, css]) =>
      variablesUtilisees(css)
        .filter((v) => v.startsWith("--cto-") && !definis.has(v))
        .map((v) => `${chemin} : ${v}`)
    );
    expect(manquants).toEqual([]);
  });

  it("aucune couleur en dur hors de primitifs.css", () => {
    const fautes = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin !== PRIMITIFS)
      .flatMap(([chemin, css]) => couleursEnDur(css).map((c) => `${chemin} : ${c}`));
    expect(fautes).toEqual([]);
  });

  it("aucun CSS hors des fichiers de tokens ne lit une couleur primitive", () => {
    const primitive = /var\(\s*--cto-(?:teal|corail|ambre|menthe|neutre)-\d+/;
    const fautes = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin !== PRIMITIFS && chemin !== SEMANTIQUES)
      .filter(([, css]) => primitive.test(css))
      .map(([chemin]) => chemin);
    expect(fautes).toEqual([]);
  });

  for (const nom of NOMS_THEMES) {
    it(`respecte tous les contrastes du manifeste — thème ${nom}`, () => {
      const decl = PROPRIETES_THEME[nom];
      const echecs = PAIRES_CONTRASTE.flatMap((p) => {
        const ratio = ratioContraste(resoudre(p.avantPlan, decl), resoudre(p.fond, decl));
        return ratio >= p.seuil ? [] : [`${p.avantPlan} / ${p.fond} : ${ratio.toFixed(2)} < ${p.seuil}`];
      });
      expect(echecs).toEqual([]);
    });
  }
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test -- src/design-system/gouvernance.test.ts`
Expected: FAIL — `Failed to resolve import "./tokens/manifeste"`.

- [ ] **Step 3: Écrire `manifeste.ts`**

```typescript
/** Point de rupture responsive (px). Les variables CSS ne fonctionnent pas dans les @media : constante documentée. */
export const POINT_DE_RUPTURE_PX = 860;

export const TOKENS_PRIMITIFS_COULEUR = [
  "--cto-teal-50",
  "--cto-teal-400",
  "--cto-teal-500",
  "--cto-teal-700",
  "--cto-teal-800",
  "--cto-teal-950",
  "--cto-corail-100",
  "--cto-corail-500",
  "--cto-corail-800",
  "--cto-corail-900",
  "--cto-ambre-400",
  "--cto-menthe-300",
  "--cto-neutre-0",
  "--cto-neutre-50",
  "--cto-neutre-200",
] as const;

export const TOKENS_PRIMITIFS_AUTRES = [
  "--cto-space-1",
  "--cto-space-2",
  "--cto-space-3",
  "--cto-space-4",
  "--cto-space-5",
  "--cto-space-6",
  "--cto-space-7",
  "--cto-space-8",
  "--cto-rayon-sm",
  "--cto-rayon-md",
  "--cto-rayon-lg",
  "--cto-rayon-xl",
  "--cto-rayon-pleine",
  "--cto-taille-xs",
  "--cto-taille-sm",
  "--cto-taille-md",
  "--cto-taille-lg",
  "--cto-taille-xl",
  "--cto-taille-2xl",
  "--cto-poids-normal",
  "--cto-poids-moyen",
  "--cto-poids-semi",
  "--cto-poids-gras",
  "--cto-poids-extra",
  "--cto-police-titre",
  "--cto-police-texte",
  "--cto-opacite-attenuee",
  "--cto-cible-tactile",
] as const;

export const TOKENS_SEMANTIQUES = [
  "--cto-fond-page",
  "--cto-fond-surface",
  "--cto-fond-creux",
  "--cto-fond-champ",
  "--cto-texte-principal",
  "--cto-texte-sur-surface",
  "--cto-texte-sur-creux",
  "--cto-bordure-douce",
  "--cto-bordure-pointille",
  "--cto-bordure-controle-page",
  "--cto-bordure-controle-surface",
  "--cto-anneau-focus",
  "--cto-anneau-focus-surface",
  "--cto-anneau-focus-creux",
  "--cto-action-primaire-fond",
  "--cto-action-primaire-texte",
  "--cto-action-accent-fond",
  "--cto-action-accent-texte",
  "--cto-selection-fond",
  "--cto-selection-texte",
  "--cto-priorite-haute-fond",
  "--cto-priorite-moyenne-fond",
  "--cto-priorite-basse-fond",
  "--cto-priorite-neutre-fond",
  "--cto-encre-souche",
  "--cto-souche-contour",
  "--cto-separateur-souche",
  "--cto-voile-clair",
  "--cto-retour-erreur-fond",
  "--cto-retour-erreur-texte",
  "--cto-retour-erreur-texte-surface",
  "--cto-retour-erreur-bordure",
  "--cto-retour-info-fond",
  "--cto-retour-info-texte",
  "--cto-retour-info-bordure",
] as const;

/** `avantPlan` est le texte, l'icône, la bordure ou l'anneau de focus ; `fond` ce sur quoi il se détache. */
export type PaireContraste = { avantPlan: string; fond: string; seuil: 3 | 4.5 };

const p = (avantPlan: string, fond: string, seuil: 3 | 4.5): PaireContraste => ({
  avantPlan: `--cto-${avantPlan}`,
  fond: `--cto-${fond}`,
  seuil,
});

const PRIORITES = ["haute", "moyenne", "basse", "neutre"] as const;
const PRIORITES_COULEUR = ["haute", "moyenne", "basse"] as const;

/** Seuils WCAG 2.2 : 4,5 texte · 3 grand texte, composant d'interface, focus. Voir spec §8. */
export const PAIRES_CONTRASTE: readonly PaireContraste[] = [
  p("texte-principal", "fond-page", 4.5),
  p("texte-sur-creux", "fond-creux", 4.5),
  p("texte-sur-surface", "fond-surface", 4.5),
  p("texte-sur-surface", "fond-champ", 4.5),
  ...PRIORITES.map((x) => p("encre-souche", `priorite-${x}-fond`, 4.5)),
  p("action-primaire-texte", "action-primaire-fond", 4.5),
  p("action-primaire-texte", "encre-souche", 4.5),
  p("action-accent-texte", "action-accent-fond", 4.5),
  p("selection-texte", "selection-fond", 4.5),
  p("retour-erreur-texte", "retour-erreur-fond", 4.5),
  p("retour-erreur-texte-surface", "fond-surface", 4.5),
  p("retour-info-texte", "retour-info-fond", 4.5),
  ...PRIORITES_COULEUR.map((x) => p(`priorite-${x}-fond`, "fond-creux", 3)),
  p("bordure-controle-page", "fond-page", 3),
  p("bordure-controle-surface", "fond-champ", 3),
  p("anneau-focus", "fond-page", 3),
  p("anneau-focus-creux", "fond-creux", 3),
  p("anneau-focus-surface", "fond-surface", 3),
  ...PRIORITES.map((x) => p("anneau-focus-surface", `priorite-${x}-fond`, 3)),
];
```

- [ ] **Step 4: Écrire `themes.ts`**

```typescript
import primitifsCss from "./primitifs.css?raw";
import semantiquesCss from "./semantiques.css?raw";
import { proprietesDe, type Proprietes } from "./analyseCss";

export type NomTheme = "comptoir" | "jour";
export const NOMS_THEMES: readonly NomTheme[] = ["comptoir", "jour"];

export const PROPRIETES_PRIMITIFS: Proprietes = proprietesDe(primitifsCss);

/** Tokens sémantiques définis par chaque thème (sans les primitifs). */
export const BLOCS_THEME: Record<NomTheme, Proprietes> = {
  comptoir: proprietesDe(semantiquesCss, 'data-theme="comptoir"'),
  jour: proprietesDe(semantiquesCss, 'data-theme="jour"'),
};

/** Primitifs + sémantiques d'un thème : de quoi résoudre n'importe quelle chaîne de var(). */
export const PROPRIETES_THEME: Record<NomTheme, Proprietes> = {
  comptoir: { ...PROPRIETES_PRIMITIFS, ...BLOCS_THEME.comptoir },
  jour: { ...PROPRIETES_PRIMITIFS, ...BLOCS_THEME.jour },
};
```

- [ ] **Step 5: Écrire `primitifs.css`**

```css
/*
 * Contoso — niveau 1 : primitifs.
 * Seul fichier autorisé à contenir des couleurs brutes (test de gouvernance).
 * Les composants ne lisent jamais les couleurs d'ici : ils passent par semantiques.css.
 */
:root {
  /* Couleurs */
  --cto-teal-50: #eaf6f4;
  --cto-teal-400: #7fb7b8;
  --cto-teal-500: #4e8d92;
  --cto-teal-700: #0f4c55;
  --cto-teal-800: #0a3940;
  --cto-teal-950: #0d2b2e;
  --cto-corail-100: #ffe3dc;
  --cto-corail-500: #ff7a59;
  --cto-corail-800: #9b1c14;
  --cto-corail-900: #7a1a0f;
  --cto-ambre-400: #ffcb47;
  --cto-menthe-300: #a8e0cc;
  --cto-neutre-0: #ffffff;
  --cto-neutre-50: #fbfefd;
  --cto-neutre-200: #c9d8d6;

  /* Espacement, base 4 px */
  --cto-space-1: 4px;
  --cto-space-2: 8px;
  --cto-space-3: 12px;
  --cto-space-4: 16px;
  --cto-space-5: 20px;
  --cto-space-6: 24px;
  --cto-space-7: 28px;
  --cto-space-8: 32px;

  /* Rayons */
  --cto-rayon-sm: 8px;
  --cto-rayon-md: 12px;
  --cto-rayon-lg: 16px;
  --cto-rayon-xl: 22px;
  --cto-rayon-pleine: 999px;

  /* Typographie */
  --cto-taille-xs: 13px;
  --cto-taille-sm: 14px;
  --cto-taille-md: 15px;
  --cto-taille-lg: 17px;
  --cto-taille-xl: 22px;
  --cto-taille-2xl: 30px;
  --cto-poids-normal: 400;
  --cto-poids-moyen: 500;
  --cto-poids-semi: 600;
  --cto-poids-gras: 700;
  --cto-poids-extra: 800;
  --cto-police-titre: "Unbounded Variable", system-ui, sans-serif;
  --cto-police-texte: "Hanken Grotesk Variable", system-ui, sans-serif;

  /* Divers */
  --cto-opacite-attenuee: 0.85;
  --cto-cible-tactile: 44px;
}
```

- [ ] **Step 6: Écrire `semantiques.css`** (chaque thème définit **les 35 tokens**, sans héritage implicite)

```css
/*
 * Contoso — niveau 2 : tokens sémantiques, redéfinis par thème.
 * Comptoir est le thème par défaut (posé aussi sur :root). Jour est le thème clair.
 * Chaque thème définit exactement le même jeu de tokens (test de gouvernance).
 */
:root,
[data-theme="comptoir"] {
  --cto-fond-page: var(--cto-teal-700);
  --cto-fond-surface: var(--cto-neutre-50);
  --cto-fond-creux: var(--cto-teal-800);
  --cto-fond-champ: var(--cto-neutre-0);
  --cto-texte-principal: var(--cto-teal-50);
  --cto-texte-sur-surface: var(--cto-teal-950);
  --cto-texte-sur-creux: var(--cto-teal-50);
  --cto-bordure-douce: var(--cto-teal-500);
  --cto-bordure-pointille: var(--cto-teal-400);
  --cto-bordure-controle-page: var(--cto-teal-400);
  --cto-bordure-controle-surface: var(--cto-teal-500);
  --cto-anneau-focus: var(--cto-neutre-0);
  --cto-anneau-focus-surface: var(--cto-teal-950);
  --cto-anneau-focus-creux: var(--cto-neutre-0);
  --cto-action-primaire-fond: var(--cto-teal-700);
  --cto-action-primaire-texte: var(--cto-neutre-0);
  --cto-action-accent-fond: var(--cto-ambre-400);
  --cto-action-accent-texte: var(--cto-teal-950);
  --cto-selection-fond: var(--cto-teal-50);
  --cto-selection-texte: var(--cto-teal-950);
  --cto-priorite-haute-fond: var(--cto-corail-500);
  --cto-priorite-moyenne-fond: var(--cto-ambre-400);
  --cto-priorite-basse-fond: var(--cto-menthe-300);
  --cto-priorite-neutre-fond: var(--cto-neutre-200);
  --cto-encre-souche: var(--cto-teal-950);
  --cto-souche-contour: transparent;
  --cto-separateur-souche: color-mix(in srgb, var(--cto-teal-950) 40%, transparent);
  --cto-voile-clair: color-mix(in srgb, var(--cto-neutre-0) 35%, transparent);
  --cto-retour-erreur-fond: var(--cto-corail-100);
  --cto-retour-erreur-texte: var(--cto-corail-900);
  --cto-retour-erreur-texte-surface: var(--cto-corail-800);
  --cto-retour-erreur-bordure: var(--cto-corail-500);
  --cto-retour-info-fond: var(--cto-teal-800);
  --cto-retour-info-texte: var(--cto-teal-50);
  --cto-retour-info-bordure: var(--cto-teal-500);
}

[data-theme="jour"] {
  --cto-fond-page: var(--cto-teal-50);
  --cto-fond-surface: var(--cto-neutre-50);
  --cto-fond-creux: var(--cto-teal-800);
  --cto-fond-champ: var(--cto-neutre-0);
  --cto-texte-principal: var(--cto-teal-950);
  --cto-texte-sur-surface: var(--cto-teal-950);
  --cto-texte-sur-creux: var(--cto-teal-50);
  --cto-bordure-douce: var(--cto-teal-500);
  --cto-bordure-pointille: var(--cto-teal-400);
  --cto-bordure-controle-page: var(--cto-teal-500);
  --cto-bordure-controle-surface: var(--cto-teal-500);
  --cto-anneau-focus: var(--cto-teal-950);
  --cto-anneau-focus-surface: var(--cto-teal-950);
  --cto-anneau-focus-creux: var(--cto-neutre-0);
  --cto-action-primaire-fond: var(--cto-teal-700);
  --cto-action-primaire-texte: var(--cto-neutre-0);
  --cto-action-accent-fond: var(--cto-ambre-400);
  --cto-action-accent-texte: var(--cto-teal-950);
  --cto-selection-fond: var(--cto-teal-950);
  --cto-selection-texte: var(--cto-teal-50);
  --cto-priorite-haute-fond: var(--cto-corail-500);
  --cto-priorite-moyenne-fond: var(--cto-ambre-400);
  --cto-priorite-basse-fond: var(--cto-menthe-300);
  --cto-priorite-neutre-fond: var(--cto-neutre-200);
  --cto-encre-souche: var(--cto-teal-950);
  --cto-souche-contour: var(--cto-teal-500);
  --cto-separateur-souche: color-mix(in srgb, var(--cto-teal-950) 40%, transparent);
  --cto-voile-clair: color-mix(in srgb, var(--cto-neutre-0) 35%, transparent);
  --cto-retour-erreur-fond: var(--cto-corail-100);
  --cto-retour-erreur-texte: var(--cto-corail-900);
  --cto-retour-erreur-texte-surface: var(--cto-corail-800);
  --cto-retour-erreur-bordure: var(--cto-corail-500);
  --cto-retour-info-fond: var(--cto-teal-800);
  --cto-retour-info-texte: var(--cto-teal-50);
  --cto-retour-info-bordure: var(--cto-teal-500);
}
```

- [ ] **Step 7: Écrire `reset.css`, `styles.css` et `polices.ts`**

`src/design-system/tokens/reset.css` :

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--cto-fond-page);
  color: var(--cto-texte-principal);
  font: var(--cto-poids-normal) var(--cto-taille-md) / 1.45 var(--cto-police-texte);
}

/* Une région thémée peint son propre fond : la doc compare deux thèmes côte à côte. */
[data-theme] {
  background: var(--cto-fond-page);
  color: var(--cto-texte-principal);
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

:focus-visible {
  outline: 3px solid var(--cto-anneau-focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

`src/design-system/styles.css` :

```css
@import "./tokens/primitifs.css";
@import "./tokens/semantiques.css";
@import "./tokens/reset.css";
```

`src/design-system/polices.ts` :

```typescript
import "@fontsource-variable/unbounded";
import "@fontsource-variable/hanken-grotesk";
```

- [ ] **Step 8: Lancer le test de gouvernance**

Run: `npm test -- src/design-system/gouvernance.test.ts`
Expected: PASS (8 tests : 6 + 1 par thème). Si un contraste échoue, **ne pas assouplir le seuil** : relire le tableau des ratios de la spec §8 et corriger le token fautif.

- [ ] **Step 9: Vérifier que le test détecte bien une violation** (contrôle du filet de sécurité, à défaire ensuite)

Dans `semantiques.css`, supprimer temporairement la ligne `--cto-souche-contour: var(--cto-teal-500);` du thème `jour` → relancer : le test « chaque thème déclare exactement les mêmes tokens » doit échouer en nommant `jour`. Rétablir la ligne, relancer : vert.

- [ ] **Step 10: Suite complète et typage**

Run: `npm test` — attendu : tous verts (95 anciens + les nouveaux).
Run: `npm run build` — attendu : succès, sans warning.

- [ ] **Step 11: Commit (après confirmation)**

```bash
git add src/design-system
git commit -m "feat(ds): tokens à trois niveaux, thèmes Comptoir et Jour, gouvernance des tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Bouton

**Files:**
- Create: `src/design-system/composants/classes.ts`, `composants/Bouton/Bouton.tsx`, `composants/Bouton/Bouton.css`
- Test: `src/design-system/composants/classes.test.ts`, `composants/Bouton/Bouton.test.tsx`

**Interfaces:**
- Produces:
  - `classes(...noms: Array<string | false | null | undefined>): string` (joint les valeurs truthy par un espace)
  - `type VarianteBouton = "primaire" | "accent" | "secondaire" | "discret"` ; `type TailleBouton = "normale" | "compacte"`
  - `type BoutonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBouton; taille?: TailleBouton; pleineLargeur?: boolean }`
  - `Bouton` : `forwardRef<HTMLButtonElement, BoutonProps>`, `type="button"` par défaut, classes `cto-bouton cto-bouton--<variante>` (+ `cto-bouton--compacte`, `cto-bouton--pleine`).

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/classes.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { classes } from "./classes";

describe("classes", () => {
  it("joint les noms truthy et ignore false, null, undefined et les chaînes vides", () => {
    expect(classes("a", false, undefined, null, "", "b")).toBe("a b");
  });
});
```

`src/design-system/composants/Bouton/Bouton.test.tsx` :

```tsx
import { createRef, type FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Bouton } from "./Bouton";

describe("Bouton", () => {
  it("rend un bouton de type button et de variante primaire par défaut", () => {
    render(<Bouton>Créer</Bouton>);
    const bouton = screen.getByRole("button", { name: "Créer" });
    expect(bouton).toHaveAttribute("type", "button");
    expect(bouton).toHaveClass("cto-bouton", "cto-bouton--primaire");
  });

  it.each(["primaire", "accent", "secondaire", "discret"] as const)("applique la variante %s", (variante) => {
    render(<Bouton variante={variante}>Ok</Bouton>);
    expect(screen.getByRole("button")).toHaveClass(`cto-bouton--${variante}`);
  });

  it("applique la taille compacte et la pleine largeur", () => {
    render(
      <Bouton taille="compacte" pleineLargeur>
        Ok
      </Bouton>
    );
    expect(screen.getByRole("button")).toHaveClass("cto-bouton--compacte", "cto-bouton--pleine");
  });

  it("conserve className et transmet les attributs natifs", () => {
    const onClick = vi.fn();
    render(
      <Bouton className="perso" aria-label="Supprimer : VPN" onClick={onClick}>
        Supprimer
      </Bouton>
    );
    const bouton = screen.getByRole("button", { name: "Supprimer : VPN" });
    expect(bouton).toHaveClass("cto-bouton", "perso");
    fireEvent.click(bouton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ne déclenche pas onClick quand il est désactivé", () => {
    const onClick = vi.fn();
    render(
      <Bouton disabled onClick={onClick}>
        Ok
      </Bouton>
    );
    expect(screen.getByRole("button")).toBeDisabled();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ne soumet pas un formulaire par défaut, mais le soumet avec type submit", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Bouton>Ok</Bouton>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <form onSubmit={onSubmit}>
        <Bouton type="submit">Ok</Bouton>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("transmet la ref à l'élément button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Bouton ref={ref}>Ok</Bouton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants`
Expected: FAIL — `Failed to resolve import "./classes"` / `"./Bouton"`.

- [ ] **Step 3: Implémenter `classes.ts` et `Bouton.tsx`**

`src/design-system/composants/classes.ts` :

```typescript
export function classes(...noms: Array<string | false | null | undefined>): string {
  return noms.filter(Boolean).join(" ");
}
```

`src/design-system/composants/Bouton/Bouton.tsx` :

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classes } from "../classes";
import "./Bouton.css";

export type VarianteBouton = "primaire" | "accent" | "secondaire" | "discret";
export type TailleBouton = "normale" | "compacte";

export type BoutonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  pleineLargeur?: boolean;
};

export const Bouton = forwardRef<HTMLButtonElement, BoutonProps>(function Bouton(
  { variante = "primaire", taille = "normale", pleineLargeur = false, type = "button", className, ...natifs },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(
        "cto-bouton",
        `cto-bouton--${variante}`,
        taille === "compacte" && "cto-bouton--compacte",
        pleineLargeur && "cto-bouton--pleine",
        className
      )}
      {...natifs}
    />
  );
});
```

`src/design-system/composants/Bouton/Bouton.css` (la bordure de 2 px est compensée dans le padding : la taille extérieure reste celle de l'app actuelle ; l'ordre des règles compte : `compacte` avant `discret`) :

```css
.cto-bouton {
  /* Tokens de composant : un conteneur les surcharge par un sélecteur descendant (voir Souche.css). */
  --cto-bouton-primaire-fond: var(--cto-action-primaire-fond);
  --cto-bouton-primaire-texte: var(--cto-action-primaire-texte);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cto-space-2);
  padding: calc(var(--cto-space-3) - 2px) calc(var(--cto-space-4) - 2px);
  border: 2px solid transparent;
  border-radius: var(--cto-rayon-md);
  background: none;
  color: inherit;
  font-weight: var(--cto-poids-gras);
  cursor: pointer;
}

.cto-bouton--primaire {
  background: var(--cto-bouton-primaire-fond);
  color: var(--cto-bouton-primaire-texte);
}
.cto-bouton--primaire:hover:not(:disabled) {
  filter: brightness(0.85);
}

.cto-bouton--accent {
  background: var(--cto-action-accent-fond);
  color: var(--cto-action-accent-texte);
}
.cto-bouton--accent:hover:not(:disabled) {
  filter: brightness(1.06);
}

.cto-bouton--secondaire {
  border-color: currentColor;
}

.cto-bouton--compacte {
  padding: calc(var(--cto-space-2) - 2px) calc(var(--cto-space-3) - 2px);
  border-radius: var(--cto-rayon-sm);
  font-size: var(--cto-taille-sm);
}

.cto-bouton--discret {
  padding: var(--cto-space-2) var(--cto-space-1);
  border: 0;
  font-weight: var(--cto-poids-moyen);
  text-decoration: underline;
}

.cto-bouton--pleine {
  width: 100%;
}

.cto-bouton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (pointer: coarse) {
  .cto-bouton {
    min-height: var(--cto-cible-tactile);
  }
}
```

- [ ] **Step 4: Voir les tests passer**

Run: `npm test -- src/design-system`
Expected: PASS, dont la gouvernance : `Bouton.css` ne contient ni couleur en dur ni couleur primitive, et toutes ses `var(--cto-*)` sont définies (les deux tokens de composant `--cto-bouton-primaire-*` le sont dans `Bouton.css` même).

- [ ] **Step 5: Typage**

Run: `npm run build` — attendu : succès.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/design-system/composants
git commit -m "feat(ds): composant Bouton (variantes, tailles, forwardRef)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Champ

**Files:**
- Create: `src/design-system/composants/Champ/Champ.tsx`, `Champ.css`
- Test: `src/design-system/composants/Champ/Champ.test.tsx`

**Interfaces:**
- Consumes: `classes` (Task 3).
- Produces:
  - `type ChampProps` = union `{ libelle: string; erreur?: string; multiligne?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">` | `{ libelle: string; erreur?: string; multiligne: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">`
  - `type ElementChamp = HTMLInputElement | HTMLTextAreaElement`
  - `Champ` : `forwardRef<ElementChamp, ChampProps>`. Rend `<div class="cto-champ"><label for=id>…</label><input|textarea id aria-invalid aria-describedby/>{erreur && <p id=…-erreur>}</div>`. `className` s'applique au conteneur.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/Champ/Champ.test.tsx` :

```tsx
import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Champ } from "./Champ";

describe("Champ", () => {
  it("relie le libellé au champ de saisie", () => {
    render(<Champ libelle="Titre" placeholder="Ex. VPN" />);
    const champ = screen.getByLabelText("Titre");
    expect(champ.tagName).toBe("INPUT");
    expect(champ).toHaveAttribute("placeholder", "Ex. VPN");
  });

  it("rend un textarea quand multiligne est vrai", () => {
    render(<Champ libelle="Description" multiligne />);
    expect(screen.getByLabelText("Description").tagName).toBe("TEXTAREA");
  });

  it("transmet valeur et onChange au champ natif", () => {
    const onChange = vi.fn();
    render(<Champ libelle="Titre" value="abc" onChange={onChange} />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).toHaveValue("abc");
    fireEvent.change(champ, { target: { value: "abcd" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("relie l'erreur au champ par aria-describedby et le marque invalide", () => {
    render(<Champ libelle="Titre" erreur="Le titre est obligatoire." />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).toHaveAttribute("aria-invalid", "true");
    expect(champ).toHaveAccessibleDescription("Le titre est obligatoire.");
  });

  it("n'expose ni aria-invalid ni aria-describedby sans erreur, et les retire quand l'erreur disparaît", () => {
    const { rerender } = render(<Champ libelle="Titre" erreur="Oups" />);
    rerender(<Champ libelle="Titre" />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).not.toHaveAttribute("aria-invalid");
    expect(champ).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("Oups")).not.toBeInTheDocument();
  });

  it("garde deux champs distincts : chaque libellé désigne son propre champ", () => {
    render(
      <>
        <Champ libelle="Titre" />
        <Champ libelle="Demandeur" />
      </>
    );
    const titre = screen.getByLabelText("Titre");
    const demandeur = screen.getByLabelText("Demandeur");
    expect(titre).not.toBe(demandeur);
    expect(titre.id).not.toBe(demandeur.id);
  });

  it("applique className au conteneur", () => {
    const { container } = render(<Champ libelle="Titre" className="perso" />);
    expect(container.firstElementChild).toHaveClass("cto-champ", "perso");
  });

  it("transmet la ref à l'input et au textarea", () => {
    const refInput = createRef<HTMLInputElement>();
    const refTexte = createRef<HTMLTextAreaElement>();
    render(
      <>
        <Champ libelle="A" ref={refInput} />
        <Champ libelle="B" multiligne ref={refTexte} />
      </>
    );
    expect(refInput.current).toBeInstanceOf(HTMLInputElement);
    expect(refTexte.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants/Champ`
Expected: FAIL — `Failed to resolve import "./Champ"`.

- [ ] **Step 3: Implémenter `Champ.tsx`**

```tsx
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { classes } from "../classes";
import "./Champ.css";

type Commun = { libelle: string; erreur?: string };
type ChampLigneProps = Commun & { multiligne?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;
type ChampMultiligneProps = Commun & { multiligne: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export type ChampProps = ChampLigneProps | ChampMultiligneProps;
export type ElementChamp = HTMLInputElement | HTMLTextAreaElement;

type EnveloppeProps = {
  id: string;
  idErreur: string;
  libelle: string;
  erreur?: string;
  className?: string;
  children: ReactNode;
};

function Enveloppe({ id, idErreur, libelle, erreur, className, children }: EnveloppeProps) {
  return (
    <div className={classes("cto-champ", className)}>
      <label className="cto-champ__libelle" htmlFor={id}>
        {libelle}
      </label>
      {children}
      {erreur && (
        <p className="cto-champ__erreur" id={idErreur}>
          {erreur}
        </p>
      )}
    </div>
  );
}

// forwardRef ne type qu'un seul élément : la ref est affinée ici, l'appelant ayant choisi `multiligne`.
export const Champ = forwardRef<ElementChamp, ChampProps>(function Champ(props, ref) {
  const id = useId();
  const idErreur = `${id}-erreur`;

  if (props.multiligne) {
    const { libelle, erreur, multiligne: _multiligne, className, ...natifs } = props;
    return (
      <Enveloppe id={id} idErreur={idErreur} libelle={libelle} erreur={erreur} className={className}>
        <textarea
          {...natifs}
          ref={ref as Ref<HTMLTextAreaElement>}
          id={id}
          className="cto-champ__controle"
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? idErreur : undefined}
        />
      </Enveloppe>
    );
  }

  const { libelle, erreur, multiligne: _multiligne, className, ...natifs } = props;
  return (
    <Enveloppe id={id} idErreur={idErreur} libelle={libelle} erreur={erreur} className={className}>
      <input
        {...natifs}
        ref={ref as Ref<HTMLInputElement>}
        id={id}
        className="cto-champ__controle"
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? idErreur : undefined}
      />
    </Enveloppe>
  );
});
```

- [ ] **Step 4: Écrire `Champ.css`**

```css
.cto-champ {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-1);
}

.cto-champ__libelle {
  font-size: var(--cto-taille-sm);
  font-weight: var(--cto-poids-semi);
}

.cto-champ__controle {
  display: block;
  width: 100%;
  padding: var(--cto-space-2) var(--cto-space-3);
  border: 1.5px solid var(--cto-bordure-controle-surface);
  border-radius: var(--cto-rayon-md);
  background: var(--cto-fond-champ);
  color: var(--cto-texte-sur-surface);
}

.cto-champ__controle[aria-invalid="true"] {
  border-color: var(--cto-retour-erreur-texte-surface);
}

.cto-champ__erreur {
  margin: 0;
  font-size: var(--cto-taille-sm);
  color: var(--cto-retour-erreur-texte-surface);
}

@media (pointer: coarse) {
  .cto-champ__controle {
    min-height: var(--cto-cible-tactile);
  }
}
```

- [ ] **Step 5: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS.
Run: `npm run build` — attendu : succès. Si `tsc` refuse la conversion `ref as Ref<…>` (TS2352), la remplacer par `ref as unknown as Ref<…>` en gardant le commentaire.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/design-system/composants/Champ
git commit -m "feat(ds): composant Champ (libellé, multiligne, erreur reliée en ARIA)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: ChoixSegmente

**Files:**
- Create: `src/design-system/composants/ton.ts`, `composants/ChoixSegmente/ChoixSegmente.tsx`, `ChoixSegmente.css`
- Test: `src/design-system/composants/ChoixSegmente/ChoixSegmente.test.tsx`

**Interfaces:**
- Consumes: `classes`.
- Produces:
  - `type TonPriorite = "haute" | "moyenne" | "basse" | "neutre"` (`ton.ts`, réutilisé par `Souche`)
  - `type OptionChoix<V extends string> = { valeur: V; libelle: string; ton?: TonPriorite }`
  - `type ChoixSegmenteProps<V extends string> = { legende: string; nom: string; valeur: V; options: ReadonlyArray<OptionChoix<V>>; onChange: (valeur: V) => void; className?: string }`
  - `ChoixSegmente<V extends string>(props)` : `<div role="radiogroup" aria-label={legende}>` de `<label><input type="radio" name={nom}/><span>libellé</span></label>`. Les flèches et l'arrêt de tabulation unique sont ceux des radios natifs de même `name`.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/ChoixSegmente/ChoixSegmente.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ChoixSegmente, type OptionChoix } from "./ChoixSegmente";

const options: OptionChoix<string>[] = [
  { valeur: "basse", libelle: "Basse", ton: "basse" },
  { valeur: "moyenne", libelle: "Moyenne", ton: "moyenne" },
  { valeur: "haute", libelle: "Haute", ton: "haute" },
];

describe("ChoixSegmente", () => {
  it("expose un radiogroup nommé par sa légende, avec un radio par option", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    const groupe = screen.getByRole("radiogroup", { name: "Priorité" });
    expect(within(groupe).getAllByRole("radio")).toHaveLength(3);
  });

  it("coche uniquement l'option dont la valeur est courante", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Basse")).not.toBeChecked();
    expect(screen.getByLabelText("Moyenne")).toBeChecked();
    expect(screen.getByLabelText("Haute")).not.toBeChecked();
  });

  it("appelle onChange avec la valeur de l'option choisie", () => {
    const onChange = vi.fn();
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Haute"));
    expect(onChange).toHaveBeenCalledWith("haute");
  });

  it("donne le même name à tous les radios (flèches et tabulation gérées par le navigateur)", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).toHaveAttribute("name", "priorite");
  });

  it("applique le ton de chaque option sur son libellé", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Haute").closest("label")).toHaveClass("cto-choix__option--haute");
  });

  it("ne coche rien et ne plante pas quand la valeur ne correspond à aucune option", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="" options={options} onChange={vi.fn()} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants/ChoixSegmente`
Expected: FAIL — `Failed to resolve import "./ChoixSegmente"`.

- [ ] **Step 3: Implémenter**

`src/design-system/composants/ton.ts` :

```typescript
/** Ton d'une souche ou d'une option colorée. `neutre` sert aux éléments clos (par exemple une demande résolue). */
export type TonPriorite = "haute" | "moyenne" | "basse" | "neutre";
```

`src/design-system/composants/ChoixSegmente/ChoixSegmente.tsx` :

```tsx
import { classes } from "../classes";
import type { TonPriorite } from "../ton";
import "./ChoixSegmente.css";

export type OptionChoix<V extends string> = { valeur: V; libelle: string; ton?: TonPriorite };

export type ChoixSegmenteProps<V extends string> = {
  legende: string;
  nom: string;
  valeur: V;
  options: ReadonlyArray<OptionChoix<V>>;
  onChange: (valeur: V) => void;
  className?: string;
};

export function ChoixSegmente<V extends string>({
  legende,
  nom,
  valeur,
  options,
  onChange,
  className,
}: ChoixSegmenteProps<V>) {
  return (
    <div role="radiogroup" aria-label={legende} className={classes("cto-choix", className)}>
      {options.map((option) => (
        <label
          key={option.valeur}
          className={classes("cto-choix__option", option.ton && `cto-choix__option--${option.ton}`)}
        >
          <input
            type="radio"
            name={nom}
            value={option.valeur}
            checked={valeur === option.valeur}
            onChange={() => onChange(option.valeur)}
          />
          <span>{option.libelle}</span>
        </label>
      ))}
    </div>
  );
}
```

`src/design-system/composants/ChoixSegmente/ChoixSegmente.css` :

```css
.cto-choix {
  display: flex;
  gap: var(--cto-space-2);
}

.cto-choix__option {
  position: relative;
  flex: 1;
}

.cto-choix__option input {
  position: absolute;
  opacity: 0;
}

.cto-choix__option span {
  display: block;
  padding: var(--cto-space-2);
  border: 2px solid transparent;
  border-radius: var(--cto-rayon-md);
  background: var(--cto-priorite-neutre-fond);
  color: var(--cto-encre-souche);
  font-weight: var(--cto-poids-gras);
  text-align: center;
  cursor: pointer;
}

.cto-choix__option--haute span {
  background: var(--cto-priorite-haute-fond);
}
.cto-choix__option--moyenne span {
  background: var(--cto-priorite-moyenne-fond);
}
.cto-choix__option--basse span {
  background: var(--cto-priorite-basse-fond);
}

.cto-choix__option input:checked + span {
  border-color: var(--cto-texte-sur-surface);
  box-shadow: 0 0 0 2px var(--cto-fond-champ) inset;
}

.cto-choix__option input:focus-visible + span {
  outline: 3px solid var(--cto-anneau-focus-surface);
  outline-offset: 2px;
}

@media (pointer: coarse) {
  .cto-choix__option span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--cto-cible-tactile);
  }
}
```

- [ ] **Step 4: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS.
Run: `npm run build` — attendu : succès.

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add src/design-system/composants/ton.ts src/design-system/composants/ChoixSegmente
git commit -m "feat(ds): composant ChoixSegmente (radiogroup natif à options colorées)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Puce et Tampon

**Files:**
- Create: `composants/Puce/Puce.tsx`, `Puce.css`, `composants/Tampon/Tampon.tsx`, `Tampon.css`
- Test: `composants/Puce/Puce.test.tsx`, `composants/Tampon/Tampon.test.tsx`

**Interfaces:**
- Consumes: `classes`.
- Produces:
  - `type PuceProps = { actif: boolean; compteur?: number } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed">` ; `Puce` : `<button type="button" aria-pressed={actif}>{children}{compteur !== undefined && <b class="cto-puce__compteur">{compteur}</b>}</button>`.
  - `type TamponProps = HTMLAttributes<HTMLSpanElement>` ; `Tampon` : `<span class="cto-tampon …">`.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/Puce/Puce.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Puce } from "./Puce";

describe("Puce", () => {
  it("reflète l'état actif dans aria-pressed", () => {
    const { rerender } = render(<Puce actif={false}>Tous</Puce>);
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    rerender(<Puce actif>Tous</Puce>);
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "true");
  });

  it("affiche le compteur dans le bouton", () => {
    render(
      <Puce actif={false} compteur={3}>
        Nouveau
      </Puce>
    );
    expect(within(screen.getByRole("button")).getByText("3")).toBeInTheDocument();
  });

  it("affiche un compteur à zéro", () => {
    render(
      <Puce actif={false} compteur={0}>
        Résolu
      </Puce>
    );
    expect(within(screen.getByRole("button")).getByText("0")).toBeInTheDocument();
  });

  it("n'affiche aucun compteur quand il est absent", () => {
    render(<Puce actif={false}>Tous</Puce>);
    expect(screen.getByRole("button").querySelector(".cto-puce__compteur")).toBeNull();
  });

  it("est de type button, transmet onClick et conserve className", () => {
    const onClick = vi.fn();
    render(
      <Puce actif={false} className="perso" onClick={onClick}>
        Tous
      </Puce>
    );
    const puce = screen.getByRole("button");
    expect(puce).toHaveAttribute("type", "button");
    expect(puce).toHaveClass("cto-puce", "perso");
    fireEvent.click(puce);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

`src/design-system/composants/Tampon/Tampon.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tampon } from "./Tampon";

describe("Tampon", () => {
  it("affiche son contenu dans un span de classe cto-tampon", () => {
    render(<Tampon>En cours</Tampon>);
    const tampon = screen.getByText("En cours");
    expect(tampon.tagName).toBe("SPAN");
    expect(tampon).toHaveClass("cto-tampon");
  });

  it("conserve className et transmet les attributs natifs", () => {
    render(
      <Tampon className="perso" title="Statut">
        Résolu
      </Tampon>
    );
    expect(screen.getByText("Résolu")).toHaveClass("cto-tampon", "perso");
    expect(screen.getByTitle("Statut")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants/Puce src/design-system/composants/Tampon`
Expected: FAIL — imports introuvables.

- [ ] **Step 3: Implémenter**

`src/design-system/composants/Puce/Puce.tsx` :

```tsx
import type { ButtonHTMLAttributes } from "react";
import { classes } from "../classes";
import "./Puce.css";

export type PuceProps = { actif: boolean; compteur?: number } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-pressed"
>;

export function Puce({ actif, compteur, className, children, ...natifs }: PuceProps) {
  return (
    <button type="button" className={classes("cto-puce", className)} {...natifs} aria-pressed={actif}>
      {children}
      {compteur !== undefined && <b className="cto-puce__compteur">{compteur}</b>}
    </button>
  );
}
```

`src/design-system/composants/Puce/Puce.css` :

```css
.cto-puce {
  display: inline-flex;
  align-items: center;
  gap: var(--cto-space-2);
  padding: var(--cto-space-2) var(--cto-space-4);
  border: 2px solid var(--cto-bordure-controle-page);
  border-radius: var(--cto-rayon-pleine);
  background: transparent;
  font-weight: var(--cto-poids-semi);
  cursor: pointer;
}

.cto-puce[aria-pressed="true"] {
  border-color: var(--cto-selection-fond);
  background: var(--cto-selection-fond);
  color: var(--cto-selection-texte);
}

@media (pointer: coarse) {
  .cto-puce {
    min-height: var(--cto-cible-tactile);
  }
}
```

`src/design-system/composants/Tampon/Tampon.tsx` :

```tsx
import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Tampon.css";

export type TamponProps = HTMLAttributes<HTMLSpanElement>;

export function Tampon({ className, ...natifs }: TamponProps) {
  return <span className={classes("cto-tampon", className)} {...natifs} />;
}
```

`src/design-system/composants/Tampon/Tampon.css` :

```css
.cto-tampon {
  display: inline-block;
  padding: var(--cto-space-1) var(--cto-space-2);
  border: 2px solid currentColor;
  border-radius: var(--cto-rayon-sm);
  background: var(--cto-voile-clair);
  font: var(--cto-poids-gras) var(--cto-taille-sm) var(--cto-police-texte);
  transform: rotate(-5deg);
}
```

- [ ] **Step 4: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS.
Run: `npm run build` — attendu : succès.

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add src/design-system/composants/Puce src/design-system/composants/Tampon
git commit -m "feat(ds): composants Puce (filtre à bascule) et Tampon

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Bandeau, Surface et EtatVide

**Files:**
- Create: `composants/Bandeau/Bandeau.tsx`, `.css` ; `composants/Surface/Surface.tsx`, `.css` ; `composants/EtatVide/EtatVide.tsx`, `.css`
- Test: `Bandeau.test.tsx`, `Surface.test.tsx`, `EtatVide.test.tsx` (dans leurs dossiers)

**Interfaces:**
- Consumes: `classes`.
- Produces:
  - `type TonBandeau = "info" | "erreur"` ; `BandeauProps = { ton?: TonBandeau } & HTMLAttributes<HTMLDivElement>` ; `Bandeau` : `role="alert"` pour `erreur` (sauf `role` explicite), classes `cto-bandeau cto-bandeau--<ton>`.
  - `type TonSurface = "claire" | "creuse"` ; `SurfaceProps = { ton?: TonSurface; as?: "div" | "section" | "form" } & HTMLAttributes<HTMLElement>` ; `Surface` (défaut `claire`, `div`), classes `cto-surface cto-surface--<ton>`.
  - `EtatVide` : `<p class="cto-etat-vide">` (`HTMLAttributes<HTMLParagraphElement>`).

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/Bandeau/Bandeau.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Bandeau } from "./Bandeau";

describe("Bandeau", () => {
  it("annonce une erreur avec role alert", () => {
    render(<Bandeau ton="erreur">Power Platform indisponible</Bandeau>);
    expect(screen.getByRole("alert")).toHaveTextContent("Power Platform indisponible");
    expect(screen.getByRole("alert")).toHaveClass("cto-bandeau", "cto-bandeau--erreur");
  });

  it("n'a aucun rôle d'alerte par défaut (ton info)", () => {
    render(<Bandeau>Initialisation…</Bandeau>);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Initialisation…")).toHaveClass("cto-bandeau--info");
  });

  it("laisse un role explicite l'emporter et conserve className", () => {
    render(
      <Bandeau ton="erreur" role="status" className="perso">
        Ok
      </Bandeau>
    );
    expect(screen.getByRole("status")).toHaveClass("perso");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
```

`src/design-system/composants/Surface/Surface.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Surface } from "./Surface";

describe("Surface", () => {
  it("est une div de ton claire par défaut", () => {
    render(<Surface data-testid="s">contenu</Surface>);
    const surface = screen.getByTestId("s");
    expect(surface.tagName).toBe("DIV");
    expect(surface).toHaveClass("cto-surface", "cto-surface--claire");
  });

  it("applique le ton creuse", () => {
    render(
      <Surface ton="creuse" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s")).toHaveClass("cto-surface--creuse");
  });

  it("peut être une section et transmet les attributs ARIA", () => {
    render(
      <Surface as="section" aria-live="polite" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
    expect(screen.getByTestId("s")).toHaveAttribute("aria-live", "polite");
  });

  it("peut être un formulaire dont onSubmit est appelé", () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <Surface as="form" onSubmit={onSubmit} data-testid="s">
        <button type="submit">Envoyer</button>
      </Surface>
    );
    expect(screen.getByTestId("s").tagName).toBe("FORM");
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("conserve className", () => {
    render(
      <Surface className="perso" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s")).toHaveClass("cto-surface", "perso");
  });
});
```

`src/design-system/composants/EtatVide/EtatVide.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EtatVide } from "./EtatVide";

describe("EtatVide", () => {
  it("affiche son message dans un paragraphe cto-etat-vide", () => {
    render(<EtatVide className="perso">Aucune demande ici pour le moment.</EtatVide>);
    const message = screen.getByText("Aucune demande ici pour le moment.");
    expect(message.tagName).toBe("P");
    expect(message).toHaveClass("cto-etat-vide", "perso");
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants/Bandeau src/design-system/composants/Surface src/design-system/composants/EtatVide`
Expected: FAIL — imports introuvables.

- [ ] **Step 3: Implémenter**

`src/design-system/composants/Bandeau/Bandeau.tsx` :

```tsx
import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Bandeau.css";

export type TonBandeau = "info" | "erreur";
export type BandeauProps = { ton?: TonBandeau } & HTMLAttributes<HTMLDivElement>;

export function Bandeau({ ton = "info", role, className, ...natifs }: BandeauProps) {
  return (
    <div
      role={role ?? (ton === "erreur" ? "alert" : undefined)}
      className={classes("cto-bandeau", `cto-bandeau--${ton}`, className)}
      {...natifs}
    />
  );
}
```

`src/design-system/composants/Bandeau/Bandeau.css` :

```css
.cto-bandeau {
  padding: var(--cto-space-3) var(--cto-space-4);
  border: 2px solid;
  border-radius: var(--cto-rayon-md);
}

.cto-bandeau--info {
  background: var(--cto-retour-info-fond);
  color: var(--cto-retour-info-texte);
  border-color: var(--cto-retour-info-bordure);
}

.cto-bandeau--erreur {
  background: var(--cto-retour-erreur-fond);
  color: var(--cto-retour-erreur-texte);
  border-color: var(--cto-retour-erreur-bordure);
  font-weight: var(--cto-poids-semi);
}
```

`src/design-system/composants/Surface/Surface.tsx` :

```tsx
import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Surface.css";

export type TonSurface = "claire" | "creuse";
export type SurfaceProps = { ton?: TonSurface; as?: "div" | "section" | "form" } & HTMLAttributes<HTMLElement>;

export function Surface({ ton = "claire", as = "div", className, ...natifs }: SurfaceProps) {
  return createElement(as, { className: classes("cto-surface", `cto-surface--${ton}`, className), ...natifs });
}
```

`src/design-system/composants/Surface/Surface.css` :

```css
.cto-surface {
  border-radius: var(--cto-rayon-xl);
}

.cto-surface--claire {
  padding: var(--cto-space-6);
  border: 2px dashed var(--cto-bordure-pointille);
  background: var(--cto-fond-surface);
  color: var(--cto-texte-sur-surface);
}
.cto-surface--claire :focus-visible {
  outline-color: var(--cto-anneau-focus-surface);
}

.cto-surface--creuse {
  padding: var(--cto-space-6) var(--cto-space-7);
  background: var(--cto-fond-creux);
  color: var(--cto-texte-sur-creux);
}
.cto-surface--creuse :focus-visible {
  outline-color: var(--cto-anneau-focus-creux);
}
```

`src/design-system/composants/EtatVide/EtatVide.tsx` :

```tsx
import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./EtatVide.css";

export type EtatVideProps = HTMLAttributes<HTMLParagraphElement>;

export function EtatVide({ className, ...natifs }: EtatVideProps) {
  return <p className={classes("cto-etat-vide", className)} {...natifs} />;
}
```

`src/design-system/composants/EtatVide/EtatVide.css` :

```css
.cto-etat-vide {
  margin: 0;
  padding: var(--cto-space-6);
  border: 2px dashed var(--cto-bordure-douce);
  border-radius: var(--cto-rayon-lg);
}
```

- [ ] **Step 4: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS.
Run: `npm run build` — attendu : succès. Le `onSubmit` du test `Surface` est typé `{ preventDefault }` pour rester assignable au `FormEventHandler<HTMLElement>` ; si `tsc` proteste, le typer `(e: FormEvent) => …` avec `import type { FormEvent } from "react"`.

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add src/design-system/composants/Bandeau src/design-system/composants/Surface src/design-system/composants/EtatVide
git commit -m "feat(ds): composants Bandeau, Surface et EtatVide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Titre, Page et Grille

**Files:**
- Create: `composants/Titre/Titre.tsx`, `.css` ; `composants/Page/Page.tsx`, `.css` ; `composants/Grille/Grille.tsx`, `.css`
- Test: `Titre.test.tsx`, `Page.test.tsx`, `Grille.test.tsx`
- Modify: `src/design-system/gouvernance.test.ts` (test 9 : point de rupture)

**Interfaces:**
- Consumes: `classes`, `POINT_DE_RUPTURE_PX` (Task 2).
- Produces:
  - `type ApparenceTitre = "marque" | "sous-titre" | "carte"` ; `TitreProps = { niveau: 1 | 2 | 3 | 4; apparence?: ApparenceTitre } & HTMLAttributes<HTMLHeadingElement>` ; `Titre` rend `h1`–`h4` selon `niveau`, classe `cto-titre cto-titre--<apparence>` (défaut `marque`).
  - `PageProps = HTMLAttributes<HTMLDivElement>` ; `Page` : `div.cto-page`.
  - `type ModeGrille = "deux-colonnes" | "auto"` ; `GrilleProps = { mode: ModeGrille; as?: "div" | "section" | "ul" } & HTMLAttributes<HTMLElement>` ; `Grille` : classes `cto-grille cto-grille--<mode>`.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/Titre/Titre.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Titre } from "./Titre";

describe("Titre", () => {
  it.each([1, 2, 3, 4] as const)("rend un h%i pour le niveau %i", (niveau) => {
    render(<Titre niveau={niveau}>Guichet</Titre>);
    expect(screen.getByRole("heading", { level: niveau, name: "Guichet" })).toBeInTheDocument();
  });

  it("découple le niveau sémantique de l'apparence", () => {
    render(
      <Titre niveau={2} apparence="sous-titre">
        Prochain
      </Titre>
    );
    const titre = screen.getByRole("heading", { level: 2 });
    expect(titre).toHaveClass("cto-titre", "cto-titre--sous-titre");
  });

  it("a l'apparence marque par défaut et conserve className", () => {
    render(
      <Titre niveau={1} className="perso">
        Guichet
      </Titre>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("cto-titre--marque", "perso");
  });
});
```

`src/design-system/composants/Page/Page.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page } from "./Page";

describe("Page", () => {
  it("rend un conteneur cto-page qui transmet className et attributs (data-theme compris)", () => {
    render(
      <Page className="perso" data-theme="comptoir" data-testid="p">
        contenu
      </Page>
    );
    const page = screen.getByTestId("p");
    expect(page).toHaveClass("cto-page", "perso");
    expect(page).toHaveAttribute("data-theme", "comptoir");
    expect(page).toHaveTextContent("contenu");
  });
});
```

`src/design-system/composants/Grille/Grille.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grille } from "./Grille";

describe("Grille", () => {
  it("rend une div de mode deux-colonnes", () => {
    render(
      <Grille mode="deux-colonnes" data-testid="g">
        <p>a</p>
      </Grille>
    );
    expect(screen.getByTestId("g").tagName).toBe("DIV");
    expect(screen.getByTestId("g")).toHaveClass("cto-grille", "cto-grille--deux-colonnes");
  });

  it("rend une liste quand as vaut ul, avec ses éléments de liste", () => {
    render(
      <Grille mode="auto" as="ul">
        <li>un</li>
        <li>deux</li>
      </Grille>
    );
    expect(screen.getByRole("list")).toHaveClass("cto-grille--auto");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("peut être une section et conserve className", () => {
    render(
      <Grille mode="deux-colonnes" as="section" className="perso" data-testid="g">
        <p>a</p>
      </Grille>
    );
    expect(screen.getByTestId("g").tagName).toBe("SECTION");
    expect(screen.getByTestId("g")).toHaveClass("perso");
  });
});
```

Ajouter à `src/design-system/gouvernance.test.ts` : dans l'import du manifeste, ajouter `POINT_DE_RUPTURE_PX` ; puis, à la fin du fichier :

```typescript
describe("gouvernance — responsive", () => {
  it("le point de rupture du manifeste est celui des @media du DS", () => {
    const attendu = `@media (max-width: ${POINT_DE_RUPTURE_PX}px)`;
    const grille = fichiersCss["/src/design-system/composants/Grille/Grille.css"];
    expect(grille).toContain(attendu);
    const autres = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin.startsWith("/src/design-system/"))
      .flatMap(([chemin, css]) =>
        [...css.matchAll(/@media \(max-width: (\d+)px\)/g)].filter((m) => m[1] !== String(POINT_DE_RUPTURE_PX)).map(() => chemin)
      );
    expect(autres).toEqual([]);
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system`
Expected: FAIL — imports `./Titre`, `./Page`, `./Grille` introuvables ; le test de rupture échoue aussi (`Grille.css` inexistant → `undefined`).

- [ ] **Step 3: Implémenter**

`src/design-system/composants/Titre/Titre.tsx` :

```tsx
import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Titre.css";

export type ApparenceTitre = "marque" | "sous-titre" | "carte";
export type TitreProps = { niveau: 1 | 2 | 3 | 4; apparence?: ApparenceTitre } & HTMLAttributes<HTMLHeadingElement>;

const BALISES = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export function Titre({ niveau, apparence = "marque", className, ...natifs }: TitreProps) {
  return createElement(BALISES[niveau], { className: classes("cto-titre", `cto-titre--${apparence}`, className), ...natifs });
}
```

`src/design-system/composants/Titre/Titre.css` :

```css
.cto-titre {
  margin: 0;
}

.cto-titre--marque {
  font: var(--cto-poids-extra) var(--cto-taille-lg) var(--cto-police-titre);
  letter-spacing: 0.01em;
}

.cto-titre--sous-titre {
  font: var(--cto-poids-semi) var(--cto-taille-xl) / 1.3 var(--cto-police-texte);
}

.cto-titre--carte {
  font: var(--cto-poids-gras) var(--cto-taille-lg) / 1.3 var(--cto-police-texte);
}
```

`src/design-system/composants/Page/Page.tsx` :

```tsx
import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Page.css";

export type PageProps = HTMLAttributes<HTMLDivElement>;

export function Page({ className, ...natifs }: PageProps) {
  return <div className={classes("cto-page", className)} {...natifs} />;
}
```

`src/design-system/composants/Page/Page.css` :

```css
.cto-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--cto-space-7) var(--cto-space-6) calc(var(--cto-space-8) * 2);
}
```

`src/design-system/composants/Grille/Grille.tsx` :

```tsx
import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Grille.css";

export type ModeGrille = "deux-colonnes" | "auto";
export type GrilleProps = { mode: ModeGrille; as?: "div" | "section" | "ul" } & HTMLAttributes<HTMLElement>;

export function Grille({ mode, as = "div", className, ...natifs }: GrilleProps) {
  return createElement(as, { className: classes("cto-grille", `cto-grille--${mode}`, className), ...natifs });
}
```

`src/design-system/composants/Grille/Grille.css` :

```css
.cto-grille {
  display: grid;
  gap: var(--cto-space-4);
}

ul.cto-grille {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cto-grille > * {
  min-width: 0;
}

.cto-grille--deux-colonnes {
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: var(--cto-space-5);
}

.cto-grille--auto {
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
}

@media (max-width: 860px) {
  .cto-grille--deux-colonnes {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS.
Run: `npm run build` — attendu : succès.

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add src/design-system
git commit -m "feat(ds): composants Titre, Page et Grille

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Souche

**Files:**
- Create: `composants/Souche/Souche.tsx`, `composants/Souche/Souche.css`
- Test: `composants/Souche/Souche.test.tsx`

**Interfaces:**
- Consumes: `classes`, `TonPriorite` (Task 5).
- Produces: `type SoucheProps = { ton: TonPriorite; numero: ReactNode; tampon?: ReactNode } & Omit<HTMLAttributes<HTMLElement>, "children"> & { children: ReactNode }` ; `Souche` : `<article class="cto-souche cto-souche--<ton>"><div class="cto-souche__tete"><span class="cto-souche__numero">{numero}</span>{tampon}</div><div class="cto-souche__corps">{children}</div></article>`. Ne connaît pas le domaine.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/composants/Souche/Souche.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Souche } from "./Souche";

describe("Souche", () => {
  it("rend un article avec son numéro, son tampon et son corps", () => {
    render(
      <Souche ton="haute" numero="N° 41" tampon={<span>En cours</span>}>
        <p>Corps de la souche</p>
      </Souche>
    );
    const souche = screen.getByRole("article");
    expect(within(souche).getByText("N° 41")).toBeInTheDocument();
    expect(within(souche).getByText("En cours")).toBeInTheDocument();
    expect(within(souche).getByText("Corps de la souche")).toBeInTheDocument();
  });

  it.each(["haute", "moyenne", "basse", "neutre"] as const)("applique le ton %s", (ton) => {
    render(
      <Souche ton={ton} numero="N° 1">
        corps
      </Souche>
    );
    expect(screen.getByRole("article")).toHaveClass("cto-souche", `cto-souche--${ton}`);
  });

  it("fonctionne sans tampon", () => {
    render(
      <Souche ton="basse" numero="N° 2">
        corps
      </Souche>
    );
    expect(screen.getByRole("article")).toHaveTextContent("N° 2");
  });

  it("conserve className et transmet les attributs natifs", () => {
    render(
      <Souche ton="moyenne" numero="N° 3" className="perso" aria-label="Demande 3">
        corps
      </Souche>
    );
    expect(screen.getByRole("article", { name: "Demande 3" })).toHaveClass("perso");
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/composants/Souche`
Expected: FAIL — `Failed to resolve import "./Souche"`.

- [ ] **Step 3: Implémenter `Souche.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "../classes";
import type { TonPriorite } from "../ton";
import "./Souche.css";

export type SoucheProps = {
  ton: TonPriorite;
  numero: ReactNode;
  tampon?: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Souche({ ton, numero, tampon, className, children, ...natifs }: SoucheProps) {
  return (
    <article className={classes("cto-souche", `cto-souche--${ton}`, className)} {...natifs}>
      <div className="cto-souche__tete">
        <span className="cto-souche__numero">{numero}</span>
        {tampon}
      </div>
      <div className="cto-souche__corps">{children}</div>
    </article>
  );
}
```

- [ ] **Step 4: Écrire `Souche.css`**

```css
.cto-souche {
  /* L'encoche du masque dépend de la hauteur de la tête : ces deux variables vivent ensemble. */
  --cto-souche-tete-hauteur: 96px;
  --cto-souche-encoche: 10px;

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--cto-rayon-lg);
  background: var(--cto-souche-fond);
  color: var(--cto-encre-souche);
  box-shadow: inset 0 0 0 1px var(--cto-souche-contour);
  -webkit-mask:
    radial-gradient(circle var(--cto-souche-encoche) at 0 var(--cto-souche-tete-hauteur), transparent 98%, black) left / 51% 100% no-repeat,
    radial-gradient(circle var(--cto-souche-encoche) at 100% var(--cto-souche-tete-hauteur), transparent 98%, black) right / 51% 100% no-repeat;
  mask:
    radial-gradient(circle var(--cto-souche-encoche) at 0 var(--cto-souche-tete-hauteur), transparent 98%, black) left / 51% 100% no-repeat,
    radial-gradient(circle var(--cto-souche-encoche) at 100% var(--cto-souche-tete-hauteur), transparent 98%, black) right / 51% 100% no-repeat;
}

.cto-souche :focus-visible {
  outline-color: var(--cto-anneau-focus-surface);
}

/* Les boutons primaires d'une souche sont à l'encre (surcharge des tokens de composant de Bouton). */
.cto-souche .cto-bouton {
  --cto-bouton-primaire-fond: var(--cto-encre-souche);
  --cto-bouton-primaire-texte: var(--cto-action-primaire-texte);
}

.cto-souche--haute {
  --cto-souche-fond: var(--cto-priorite-haute-fond);
}
.cto-souche--moyenne {
  --cto-souche-fond: var(--cto-priorite-moyenne-fond);
}
.cto-souche--basse {
  --cto-souche-fond: var(--cto-priorite-basse-fond);
}
.cto-souche--neutre {
  --cto-souche-fond: var(--cto-priorite-neutre-fond);
  opacity: 0.92;
}

.cto-souche__tete {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  height: var(--cto-souche-tete-hauteur);
  padding: var(--cto-space-4) var(--cto-space-4) 0;
}

.cto-souche__numero {
  font: var(--cto-poids-extra) var(--cto-taille-2xl) / 1 var(--cto-police-titre);
}

.cto-souche__corps {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--cto-space-4);
  border-top: 2px dashed var(--cto-separateur-souche);
}
```

- [ ] **Step 5: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS (la gouvernance vérifie `Souche.css` : variables définies, aucune couleur en dur — d'où `transparent`/`black` dans le masque).
Run: `npm run build` — attendu : succès.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/design-system/composants/Souche
git commit -m "feat(ds): composant Souche (carte à encoches, ton par priorité)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Point d'entrée et gouvernance des composants

**Files:**
- Create: `src/design-system/index.ts`
- Modify: `src/design-system/gouvernance.test.ts`

**Interfaces:**
- Consumes: tous les composants (Tasks 3-9).
- Produces: `index.ts` exporte **uniquement** les 12 composants (valeurs) : `Bandeau, Bouton, Champ, ChoixSegmente, EtatVide, Grille, Page, Puce, Souche, Surface, Tampon, Titre`, plus les types `BandeauProps, TonBandeau, BoutonProps, VarianteBouton, TailleBouton, ChampProps, ElementChamp, ChoixSegmenteProps, OptionChoix, TonPriorite, EtatVideProps, GrilleProps, ModeGrille, PageProps, PuceProps, SoucheProps, SurfaceProps, TonSurface, TamponProps, TitreProps, ApparenceTitre`. Aucun autre export runtime (le test de complétude de la Task 12 compare `Object.keys` de l'index aux docs).

- [ ] **Step 1: Écrire les tests de gouvernance rouges** — ajouter à la fin de `src/design-system/gouvernance.test.ts` :

```typescript
const sourcesDs = import.meta.glob<string>(
  ["/src/design-system/**/*.{ts,tsx}", "!/src/design-system/**/*.test.{ts,tsx}"],
  { query: "?raw", import: "default", eager: true }
);

const IMPORTS_INTERDITS = [
  /(^|\/)domain(\/|$)/,
  /(^|\/)data(\/|$)/,
  /(^|\/)hooks(\/|$)/,
  /(^|\/)generated(\/|$)/,
  /(^|\/)components(\/|$)/,
  /@microsoft\/power-apps/,
  /(^|\/)App(\.tsx?)?$/,
  /PowerProvider/,
];

function specifieurs(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
}

describe("gouvernance — frontières", () => {
  it("le DS n'importe rien du métier, du SDK, de generated/ ni de l'App", () => {
    const fautes = Object.entries(sourcesDs).flatMap(([chemin, source]) =>
      specifieurs(source)
        .filter((s) => IMPORTS_INTERDITS.some((interdit) => interdit.test(s)))
        .map((s) => `${chemin} importe ${s}`)
    );
    expect(fautes).toEqual([]);
  });

  it("l'index n'exporte aucune valeur autre que les composants", () => {
    expect(Object.keys(DS).sort()).toEqual([
      "Bandeau", "Bouton", "Champ", "ChoixSegmente", "EtatVide", "Grille",
      "Page", "Puce", "Souche", "Surface", "Tampon", "Titre",
    ]);
  });
});

describe("gouvernance — accessibilité tactile", () => {
  const INTERACTIFS = [
    "/src/design-system/composants/Bouton/Bouton.css",
    "/src/design-system/composants/Champ/Champ.css",
    "/src/design-system/composants/ChoixSegmente/ChoixSegmente.css",
    "/src/design-system/composants/Puce/Puce.css",
  ];

  it("les composants interactifs référencent la cible tactile dans un @media (pointer: coarse)", () => {
    const fautes = INTERACTIFS.filter((chemin) => {
      const css = fichiersCss[chemin] ?? "";
      return !/@media \(pointer: coarse\)[\s\S]*var\(--cto-cible-tactile\)/.test(css);
    });
    expect(fautes).toEqual([]);
  });
});
```

et ajouter en tête du fichier : `import * as DS from "./index";`.

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/gouvernance.test.ts`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: Écrire `index.ts`**

```typescript
export { Bandeau } from "./composants/Bandeau/Bandeau";
export type { BandeauProps, TonBandeau } from "./composants/Bandeau/Bandeau";
export { Bouton } from "./composants/Bouton/Bouton";
export type { BoutonProps, TailleBouton, VarianteBouton } from "./composants/Bouton/Bouton";
export { Champ } from "./composants/Champ/Champ";
export type { ChampProps, ElementChamp } from "./composants/Champ/Champ";
export { ChoixSegmente } from "./composants/ChoixSegmente/ChoixSegmente";
export type { ChoixSegmenteProps, OptionChoix } from "./composants/ChoixSegmente/ChoixSegmente";
export { EtatVide } from "./composants/EtatVide/EtatVide";
export type { EtatVideProps } from "./composants/EtatVide/EtatVide";
export { Grille } from "./composants/Grille/Grille";
export type { GrilleProps, ModeGrille } from "./composants/Grille/Grille";
export { Page } from "./composants/Page/Page";
export type { PageProps } from "./composants/Page/Page";
export { Puce } from "./composants/Puce/Puce";
export type { PuceProps } from "./composants/Puce/Puce";
export { Souche } from "./composants/Souche/Souche";
export type { SoucheProps } from "./composants/Souche/Souche";
export { Surface } from "./composants/Surface/Surface";
export type { SurfaceProps, TonSurface } from "./composants/Surface/Surface";
export { Tampon } from "./composants/Tampon/Tampon";
export type { TamponProps } from "./composants/Tampon/Tampon";
export { Titre } from "./composants/Titre/Titre";
export type { ApparenceTitre, TitreProps } from "./composants/Titre/Titre";
export type { TonPriorite } from "./composants/ton";
```

- [ ] **Step 4: Voir les tests passer**

Run: `npm test -- src/design-system` — attendu : PASS.

- [ ] **Step 5: Contrôle du filet de sécurité** (temporaire, à défaire) — tester que chaque garde-fou mord :
  1. Ajouter `import { validerTicket } from "../../domain/ticket";` en tête de `Bouton.tsx` → « le DS n'importe rien du métier » doit échouer ; retirer.
  2. Ajouter `color: #fff;` dans `Tampon.css` → « aucune couleur en dur » doit échouer ; retirer.
  3. Ajouter `color: var(--cto-teal-700);` dans `Puce.css` → « aucun CSS … ne lit une couleur primitive » doit échouer ; retirer.
  4. Supprimer le bloc `@media (pointer: coarse)` de `Champ.css` → le test tactile doit échouer ; rétablir.
  Relancer `npm test -- src/design-system` : tout vert.

- [ ] **Step 6: Typage**

Run: `npm run build` — attendu : succès sans warning.

- [ ] **Step 7: Commit (après confirmation)**

```bash
git add src/design-system/index.ts src/design-system/gouvernance.test.ts
git commit -m "feat(ds): point d'entrée unique et tests de frontière et d'accessibilité tactile

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Infrastructure de la page de doc

**Files:**
- Create: `src/design-system/doc-types.ts`, `doc/donnees.ts`, `doc/registre.ts`, `doc/PageDoc.tsx`, `doc/PageDoc.css`, `doc/SectionPrincipes.tsx`, `doc/SectionFondations.tsx`, `doc/SectionThemes.tsx`, `doc/SectionComposants.tsx`, `doc/SectionGouvernance.tsx`
- Test: `doc/donnees.test.ts`, `doc/PageDoc.test.tsx`

**Interfaces:**
- Consumes: `PROPRIETES_THEME`, `NOMS_THEMES`, `NomTheme` (themes.ts) ; `resoudre` ; `ratioContraste` ; manifeste ; composants via `../index`.
- Produces:
  - `doc-types.ts` : `PropDoc = { nom: string; type: string; defaut?: string; description: string }` ; `DocComposant = { nom: string; resume: string; props: PropDoc[]; accessibilite: string[]; aFaire: string; aEviter: string; Demo: () => ReactElement }`.
  - `donnees.ts` : `type Pastille = { nom: string; valeurs: Record<NomTheme, string> }` ; `pastillesPrimitives(): Pastille[]` ; `pastillesSemantiques(): Pastille[]` ; `type LignePaire = { avantPlan: string; fond: string; seuil: number; ratios: Record<NomTheme, number> }` ; `lignesPaires(): LignePaire[]`.
  - `registre.ts` : `DOCS_COMPOSANTS: DocComposant[]` — construit par `import.meta.glob("../composants/*/*.doc.tsx", { import: "default", eager: true })`, trié par nom (vide tant que la Task 12 n'a pas créé les `.doc.tsx`).
  - `PageDoc.tsx` : `export default function PageDoc()` — conteneur `data-testid="conteneur-doc"` portant `data-theme` ; sélecteur de thème (deux `Puce` « Comptoir » / « Jour ») ; sections Principes, Fondations, Thèmes, Composants, Gouvernance.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/doc/donnees.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { TOKENS_PRIMITIFS_COULEUR, TOKENS_SEMANTIQUES, PAIRES_CONTRASTE } from "../tokens/manifeste";
import { lignesPaires, pastillesPrimitives, pastillesSemantiques } from "./donnees";

describe("données de la doc", () => {
  it("expose une pastille par couleur primitive, avec la valeur hex", () => {
    const pastilles = pastillesPrimitives();
    expect(pastilles.map((p) => p.nom)).toEqual([...TOKENS_PRIMITIFS_COULEUR]);
    expect(pastilles.find((p) => p.nom === "--cto-teal-700")?.valeurs.comptoir).toBe("#0f4c55");
  });

  it("expose une pastille par token sémantique, résolue dans chaque thème", () => {
    const pastilles = pastillesSemantiques();
    expect(pastilles).toHaveLength(TOKENS_SEMANTIQUES.length);
    const fond = pastilles.find((p) => p.nom === "--cto-fond-page");
    expect(fond?.valeurs).toEqual({ comptoir: "#0f4c55", jour: "#eaf6f4" });
  });

  it("calcule le ratio de chaque paire du manifeste dans chaque thème, au-dessus du seuil", () => {
    const lignes = lignesPaires();
    expect(lignes).toHaveLength(PAIRES_CONTRASTE.length);
    for (const ligne of lignes) {
      expect(ligne.ratios.comptoir).toBeGreaterThanOrEqual(ligne.seuil);
      expect(ligne.ratios.jour).toBeGreaterThanOrEqual(ligne.seuil);
    }
  });
});
```

`src/design-system/doc/PageDoc.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PageDoc from "./PageDoc";

describe("PageDoc", () => {
  it("affiche le titre du design system et ses cinq sections", () => {
    render(<PageDoc />);
    expect(screen.getByRole("heading", { level: 1, name: "Contoso" })).toBeInTheDocument();
    for (const nom of ["Principes", "Fondations", "Thèmes", "Composants", "Gouvernance"]) {
      expect(screen.getByRole("heading", { level: 2, name: nom })).toBeInTheDocument();
    }
  });

  it("change le thème du conteneur de la doc, jamais celui du document", () => {
    render(<PageDoc />);
    const conteneur = screen.getByTestId("conteneur-doc");
    expect(conteneur).toHaveAttribute("data-theme", "comptoir");
    fireEvent.click(screen.getByRole("button", { name: "Jour" }));
    expect(conteneur).toHaveAttribute("data-theme", "jour");
    expect(screen.getByRole("button", { name: "Jour" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(document.body).not.toHaveAttribute("data-theme");
  });

  it("montre les deux thèmes côte à côte dans la section Thèmes", () => {
    const { container } = render(<PageDoc />);
    expect(container.querySelector('[data-theme="comptoir"].doc-theme-carte')).not.toBeNull();
    expect(container.querySelector('[data-theme="jour"].doc-theme-carte')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system/doc`
Expected: FAIL — imports `./donnees` et `./PageDoc` introuvables.

- [ ] **Step 3: Écrire `doc-types.ts`, `donnees.ts`, `registre.ts`**

`src/design-system/doc-types.ts` :

```typescript
import type { ReactElement } from "react";

export type PropDoc = { nom: string; type: string; defaut?: string; description: string };

/** Fiche de documentation d'un composant : exportée par défaut par chaque `<Nom>.doc.tsx`. */
export type DocComposant = {
  nom: string;
  resume: string;
  props: PropDoc[];
  accessibilite: string[];
  aFaire: string;
  aEviter: string;
  /** Rendu comme composant (`<doc.Demo />`), donc les hooks y sont permis. */
  Demo: () => ReactElement;
};
```

`src/design-system/doc/donnees.ts` :

```typescript
import { resoudre } from "../tokens/analyseCss";
import { ratioContraste } from "../tokens/contraste";
import { PAIRES_CONTRASTE, TOKENS_PRIMITIFS_COULEUR, TOKENS_SEMANTIQUES } from "../tokens/manifeste";
import { NOMS_THEMES, PROPRIETES_THEME, type NomTheme } from "../tokens/themes";

export type Pastille = { nom: string; valeurs: Record<NomTheme, string> };
export type LignePaire = { avantPlan: string; fond: string; seuil: number; ratios: Record<NomTheme, number> };

function parTheme<T>(calcul: (theme: NomTheme) => T): Record<NomTheme, T> {
  return Object.fromEntries(NOMS_THEMES.map((theme) => [theme, calcul(theme)])) as Record<NomTheme, T>;
}

function pastilles(noms: readonly string[]): Pastille[] {
  return noms.map((nom) => ({ nom, valeurs: parTheme((theme) => resoudre(nom, PROPRIETES_THEME[theme])) }));
}

export const pastillesPrimitives = (): Pastille[] => pastilles(TOKENS_PRIMITIFS_COULEUR);
export const pastillesSemantiques = (): Pastille[] => pastilles(TOKENS_SEMANTIQUES);

export function lignesPaires(): LignePaire[] {
  return PAIRES_CONTRASTE.map((paire) => ({
    ...paire,
    ratios: parTheme((theme) => {
      const decl = PROPRIETES_THEME[theme];
      return ratioContraste(resoudre(paire.avantPlan, decl), resoudre(paire.fond, decl));
    }),
  }));
}
```

`src/design-system/doc/registre.ts` :

```typescript
import type { DocComposant } from "../doc-types";

const modules = import.meta.glob<DocComposant>("../composants/*/*.doc.tsx", { import: "default", eager: true });

export const DOCS_COMPOSANTS: DocComposant[] = Object.values(modules).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
```

- [ ] **Step 4: Écrire les sections et `PageDoc`**

`src/design-system/doc/SectionPrincipes.tsx` :

```tsx
import { Titre } from "../index";

const PRINCIPES = [
  "Les composants ne lisent que des tokens sémantiques : jamais une couleur brute, jamais une couleur primitive.",
  "L'accessibilité n'est pas négociable : contrastes vérifiés par test dans chaque thème, focus visible, cibles tactiles de 44 px.",
  "La couleur ne porte jamais seule une information : la priorité d'une souche s'écrit aussi en toutes lettres.",
  "Le design system ne connaît pas le métier : il ne sait pas ce qu'est une demande, une priorité ou un statut.",
  "Chaque token et chaque composant répond à un usage réel. Le reste est refusé (YAGNI).",
];

export function SectionPrincipes() {
  return (
    <section className="doc-section" aria-labelledby="doc-principes">
      <Titre niveau={2} id="doc-principes">
        Principes
      </Titre>
      <ol className="doc-liste">
        {PRINCIPES.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
    </section>
  );
}
```

`src/design-system/doc/SectionFondations.tsx` :

```tsx
import { Titre } from "../index";
import { TOKENS_PRIMITIFS_AUTRES } from "../tokens/manifeste";
import { NOMS_THEMES } from "../tokens/themes";
import { lignesPaires, pastillesPrimitives, pastillesSemantiques, type Pastille } from "./donnees";

const commencePar = (prefixe: string) => TOKENS_PRIMITIFS_AUTRES.filter((t) => t.startsWith(prefixe));

function ListePastilles({ pastilles }: { pastilles: Pastille[] }) {
  return (
    <ul className="doc-pastilles">
      {pastilles.map((p) => (
        <li key={p.nom}>
          <span className="doc-pastille" style={{ background: `var(${p.nom})` }} aria-hidden="true" />
          <code>{p.nom}</code>
          <span className="doc-valeurs">{[...new Set(NOMS_THEMES.map((t) => p.valeurs[t]))].join(" · ")}</span>
        </li>
      ))}
    </ul>
  );
}

export function SectionFondations() {
  const paires = lignesPaires();
  return (
    <section className="doc-section" aria-labelledby="doc-fondations">
      <Titre niveau={2} id="doc-fondations">
        Fondations
      </Titre>

      <Titre niveau={3} apparence="carte">
        Couleurs primitives
      </Titre>
      <p>Valeurs brutes, jamais lues par un composant.</p>
      <ListePastilles pastilles={pastillesPrimitives()} />

      <Titre niveau={3} apparence="carte">
        Tokens sémantiques
      </Titre>
      <p>Redéfinis par thème. La pastille suit le thème choisi en haut de page ; les valeurs listées sont Comptoir · Jour.</p>
      <ListePastilles pastilles={pastillesSemantiques()} />

      <Titre niveau={3} apparence="carte">
        Contrastes vérifiés
      </Titre>
      <div className="doc-tableau-defilant">
        <table className="doc-tableau">
          <thead>
            <tr>
              <th scope="col">Avant-plan</th>
              <th scope="col">Fond</th>
              <th scope="col">Seuil</th>
              <th scope="col">Comptoir</th>
              <th scope="col">Jour</th>
            </tr>
          </thead>
          <tbody>
            {paires.map((l) => (
              <tr key={`${l.avantPlan}/${l.fond}`}>
                <td><code>{l.avantPlan}</code></td>
                <td><code>{l.fond}</code></td>
                <td>{l.seuil}</td>
                <td>{l.ratios.comptoir.toFixed(2)}</td>
                <td>{l.ratios.jour.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Titre niveau={3} apparence="carte">
        Espacement
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-space-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span className="doc-barre" style={{ width: `var(${t})` }} aria-hidden="true" />
          </li>
        ))}
      </ul>

      <Titre niveau={3} apparence="carte">
        Rayons
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-rayon-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span className="doc-carre" style={{ borderRadius: `var(${t})` }} aria-hidden="true" />
          </li>
        ))}
      </ul>

      <Titre niveau={3} apparence="carte">
        Typographie
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-taille-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span style={{ fontSize: `var(${t})` }}>Guichet des demandes aMP</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`src/design-system/doc/SectionThemes.tsx` :

```tsx
import { Bouton, Souche, Surface, Tampon, Titre } from "../index";
import { NOMS_THEMES, type NomTheme } from "../tokens/themes";

export const LIBELLE_THEME: Record<NomTheme, string> = { comptoir: "Comptoir", jour: "Jour" };

export function SectionThemes() {
  return (
    <section className="doc-section" aria-labelledby="doc-themes">
      <Titre niveau={2} id="doc-themes">
        Thèmes
      </Titre>
      <p>Comptoir est le thème par défaut. Jour est le thème clair. Les deux définissent exactement les mêmes tokens.</p>
      <div className="doc-themes">
        {NOMS_THEMES.map((nom) => (
          <div key={nom} data-theme={nom} className="doc-theme-carte">
            <Titre niveau={3} apparence="carte">
              {LIBELLE_THEME[nom]}
            </Titre>
            <Souche ton="haute" numero="N° 41" tampon={<Tampon>En cours</Tampon>}>
              <Titre niveau={4} apparence="carte">
                VPN inaccessible
              </Titre>
              <p className="doc-souche-texte">Julien, 23 sept.</p>
            </Souche>
            <Surface ton="claire">
              <Bouton>Créer</Bouton>
            </Surface>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/design-system/doc/SectionComposants.tsx` :

```tsx
import { Titre } from "../index";
import { DOCS_COMPOSANTS } from "./registre";

export function SectionComposants() {
  return (
    <section className="doc-section" aria-labelledby="doc-composants">
      <Titre niveau={2} id="doc-composants">
        Composants
      </Titre>
      {DOCS_COMPOSANTS.map((doc) => (
        <article key={doc.nom} className="doc-composant" aria-labelledby={`doc-composant-${doc.nom}`}>
          <Titre niveau={3} id={`doc-composant-${doc.nom}`}>
            {doc.nom}
          </Titre>
          <p>{doc.resume}</p>
          <div className="doc-demo">
            <doc.Demo />
          </div>

          <Titre niveau={4} apparence="carte">
            Props
          </Titre>
          <div className="doc-tableau-defilant">
            <table className="doc-tableau">
              <thead>
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Type</th>
                  <th scope="col">Défaut</th>
                  <th scope="col">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {doc.props.map((p) => (
                  <tr key={p.nom}>
                    <td><code>{p.nom}</code></td>
                    <td><code>{p.type}</code></td>
                    <td>{p.defaut ? <code>{p.defaut}</code> : "—"}</td>
                    <td>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Titre niveau={4} apparence="carte">
            Accessibilité
          </Titre>
          <ul className="doc-liste">
            {doc.accessibilite.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <div className="doc-bonnes-pratiques">
            <p className="doc-afaire"><strong>À faire.</strong> {doc.aFaire}</p>
            <p className="doc-aeviter"><strong>À éviter.</strong> {doc.aEviter}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
```

`src/design-system/doc/SectionGouvernance.tsx` :

```tsx
import { Titre } from "../index";

export function SectionGouvernance() {
  return (
    <section className="doc-section" aria-labelledby="doc-gouvernance">
      <Titre niveau={2} id="doc-gouvernance">
        Gouvernance
      </Titre>
      <Titre niveau={3} apparence="carte">
        Proposer un token
      </Titre>
      <ol className="doc-liste">
        <li>Décrire l'usage réel qui le justifie : sans usage aujourd'hui, la demande est refusée.</li>
        <li>L'ajouter dans les fichiers de tokens <em>et</em> dans le manifeste (le test de gouvernance vérifie que les deux concordent).</li>
        <li>S'il porte une couleur de texte ou de contour, déclarer sa paire de contraste dans le manifeste.</li>
        <li>Le définir dans chaque thème, puis noter le changement au CHANGELOG.</li>
      </ol>
      <Titre niveau={3} apparence="carte">
        Proposer un composant
      </Titre>
      <ol className="doc-liste">
        <li>Un usage existant dans l'app, et pas une hypothèse.</li>
        <li>Test rouge d'abord, puis le composant, son CSS (tokens seulement) et sa fiche <code>.doc.tsx</code>.</li>
        <li>L'exporter depuis <code>index.ts</code> : les tests de gouvernance exigent la fiche de doc.</li>
      </ol>
      <Titre niveau={3} apparence="carte">
        Versionnage
      </Titre>
      <p>
        Versionnage sémantique, journal dans <code>src/design-system/CHANGELOG.md</code>. Retirer ou renommer un token,
        une prop ou une variante est un changement cassant (version majeure).
      </p>
    </section>
  );
}
```

`src/design-system/doc/PageDoc.tsx` :

```tsx
import { useState } from "react";
import { Page, Puce, Titre } from "../index";
import { NOMS_THEMES, type NomTheme } from "../tokens/themes";
import { SectionComposants } from "./SectionComposants";
import { SectionFondations } from "./SectionFondations";
import { SectionGouvernance } from "./SectionGouvernance";
import { SectionPrincipes } from "./SectionPrincipes";
import { LIBELLE_THEME, SectionThemes } from "./SectionThemes";
import "./PageDoc.css";

export default function PageDoc() {
  const [theme, setTheme] = useState<NomTheme>("comptoir");
  return (
    <div data-theme={theme} data-testid="conteneur-doc" className="doc">
      <Page>
        <header className="doc-entete">
          <Titre niveau={1}>Contoso</Titre>
          <p>Le design system d'aMP Tickets : tokens, thèmes, composants et règles de gouvernance.</p>
          <div className="doc-selecteur" role="group" aria-label="Thème de la page">
            {NOMS_THEMES.map((nom) => (
              <Puce key={nom} actif={theme === nom} onClick={() => setTheme(nom)}>
                {LIBELLE_THEME[nom]}
              </Puce>
            ))}
          </div>
        </header>
        <SectionPrincipes />
        <SectionFondations />
        <SectionThemes />
        <SectionComposants />
        <SectionGouvernance />
      </Page>
    </div>
  );
}
```

`src/design-system/doc/PageDoc.css` (tokens seulement ; les classes `doc-*` sont propres à la doc) :

```css
.doc {
  min-height: 100vh;
}

.doc-entete {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-3);
  margin-bottom: var(--cto-space-8);
}
.doc-entete p {
  margin: 0;
}

.doc-selecteur {
  display: flex;
  gap: var(--cto-space-2);
}

.doc-section {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-3);
  margin-bottom: var(--cto-space-8);
}
.doc-section > h3 {
  margin-top: var(--cto-space-4);
}
.doc-section p {
  margin: 0;
}

.doc-liste {
  margin: 0;
  padding-left: var(--cto-space-6);
}
.doc-liste li + li {
  margin-top: var(--cto-space-2);
}

.doc-pastilles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--cto-space-2) var(--cto-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.doc-pastilles li {
  display: flex;
  align-items: center;
  gap: var(--cto-space-2);
  font-size: var(--cto-taille-sm);
}
.doc-pastille {
  flex: none;
  width: var(--cto-space-6);
  height: var(--cto-space-6);
  border: 1px solid var(--cto-bordure-controle-page);
  border-radius: var(--cto-rayon-sm);
}
.doc-valeurs {
  margin-left: auto;
  opacity: var(--cto-opacite-attenuee);
}

.doc-tableau-defilant {
  overflow-x: auto;
}
.doc-tableau {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--cto-taille-sm);
}
.doc-tableau th,
.doc-tableau td {
  padding: var(--cto-space-2) var(--cto-space-3);
  border-bottom: 1px solid var(--cto-bordure-controle-page);
  text-align: left;
  vertical-align: top;
}

.doc-echelle {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.doc-echelle li {
  display: flex;
  align-items: center;
  gap: var(--cto-space-4);
}
.doc-echelle code {
  flex: none;
  min-width: 160px;
}
.doc-barre {
  height: var(--cto-space-3);
  background: var(--cto-action-accent-fond);
}
.doc-carre {
  width: var(--cto-space-8);
  height: var(--cto-space-8);
  border: 2px solid var(--cto-bordure-controle-page);
}

.doc-themes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--cto-space-4);
}
.doc-theme-carte {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-3);
  padding: var(--cto-space-4);
  border: 2px solid var(--cto-bordure-controle-page);
  border-radius: var(--cto-rayon-lg);
}
.doc-souche-texte {
  font-size: var(--cto-taille-sm);
}

.doc-composant {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-3);
  padding: var(--cto-space-4) 0 var(--cto-space-6);
  border-top: 2px solid var(--cto-bordure-controle-page);
}
.doc-composant p {
  margin: 0;
}
.doc-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--cto-space-3);
  padding: var(--cto-space-4);
  border: 2px dashed var(--cto-bordure-controle-page);
  border-radius: var(--cto-rayon-lg);
}
.doc-demo-ligne {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cto-space-3);
}
.doc-bonnes-pratiques {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--cto-space-3);
}
.doc-afaire,
.doc-aeviter {
  padding: var(--cto-space-3);
  border: 2px solid var(--cto-bordure-controle-page);
  border-radius: var(--cto-rayon-md);
}
```

- [ ] **Step 5: Voir les tests passer, puis typer**

Run: `npm test -- src/design-system` — attendu : PASS (la gouvernance scanne aussi `PageDoc.css` : aucune couleur en dur, aucune couleur primitive).
Run: `npm run build` — attendu : succès. Le `style={{ background: `var(${p.nom})` }}` est du TSX, hors du périmètre des scans CSS : il ne contient de toute façon que des références à des tokens.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/design-system/doc-types.ts src/design-system/doc
git commit -m "feat(ds): page de documentation vivante (principes, fondations, thèmes, gouvernance)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Fiches de documentation des 12 composants et test de complétude

**Files:**
- Create: `composants/<Nom>/<Nom>.doc.tsx` pour les 12 composants
- Modify: `src/design-system/gouvernance.test.ts`
- Test: `src/design-system/doc/registre.test.tsx`

**Interfaces:**
- Consumes: `DocComposant`, `PropDoc` (Task 11) ; les composants.
- Produces: 12 modules `export default doc: DocComposant` dont le `nom` égale le nom exporté par `index.ts`.

- [ ] **Step 1: Écrire les tests rouges**

`src/design-system/doc/registre.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DOCS_COMPOSANTS } from "./registre";

describe("registre de documentation", () => {
  it("contient une fiche complète par composant", () => {
    expect(DOCS_COMPOSANTS.length).toBeGreaterThan(0);
    for (const doc of DOCS_COMPOSANTS) {
      expect(doc.resume, doc.nom).not.toBe("");
      expect(doc.props.length, `${doc.nom} : props`).toBeGreaterThan(0);
      expect(doc.accessibilite.length, `${doc.nom} : accessibilité`).toBeGreaterThan(0);
      expect(doc.aFaire, `${doc.nom} : à faire`).not.toBe("");
      expect(doc.aEviter, `${doc.nom} : à éviter`).not.toBe("");
    }
  });

  it("rend la démo de chaque composant sans erreur", () => {
    for (const doc of DOCS_COMPOSANTS) {
      const { container, unmount } = render(<doc.Demo />);
      expect(container.firstChild, doc.nom).not.toBeNull();
      unmount();
    }
  });
});
```

Ajouter à `src/design-system/gouvernance.test.ts` (imports à ajouter en tête : `import type { DocComposant } from "./doc-types";`) :

```typescript
const fichesDoc = import.meta.glob<DocComposant>("./composants/*/*.doc.tsx", { import: "default", eager: true });

describe("gouvernance — documentation", () => {
  it("tout composant exporté par l'index possède sa fiche .doc.tsx, et inversement", () => {
    const exportes = Object.keys(DS).sort();
    const documentes = Object.values(fichesDoc).map((d) => d.nom).sort();
    expect(documentes).toEqual(exportes);
  });

  it("chaque fiche est rangée dans le dossier de son composant, sous le nom <Nom>.doc.tsx", () => {
    const fautes = Object.entries(fichesDoc)
      .filter(([chemin, doc]) => !chemin.endsWith(`/${doc.nom}/${doc.nom}.doc.tsx`))
      .map(([chemin]) => chemin);
    expect(fautes).toEqual([]);
  });
});
```

- [ ] **Step 2: Voir les tests échouer**

Run: `npm test -- src/design-system`
Expected: FAIL — « contient une fiche complète » (`length` > 0 échoue : aucune fiche) et « tout composant exporté possède sa fiche » (`[]` ≠ 12 noms).

- [ ] **Step 3: Écrire les 12 fiches** (chacune : `export default doc`)

`src/design-system/composants/Bouton/Bouton.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Bouton } from "./Bouton";

const doc: DocComposant = {
  nom: "Bouton",
  resume: "Déclenche une action. Quatre variantes selon l'importance de l'action.",
  props: [
    { nom: "variante", type: '"primaire" | "accent" | "secondaire" | "discret"', defaut: '"primaire"', description: "Importance visuelle : primaire pour l'action principale, accent pour la mettre en avant sur fond creux, secondaire en contour, discret en lien." },
    { nom: "taille", type: '"normale" | "compacte"', defaut: '"normale"', description: "Compacte pour les actions en série (cartes)." },
    { nom: "pleineLargeur", type: "boolean", defaut: "false", description: "Occupe toute la largeur du conteneur." },
    { nom: "type", type: "string", defaut: '"button"', description: 'Passer "submit" pour envoyer un formulaire : par défaut un bouton ne soumet rien.' },
    { nom: "…natifs", type: "ButtonHTMLAttributes", description: "Tous les attributs natifs (onClick, disabled, aria-*…) sont transmis." },
  ],
  accessibilite: [
    "Vrai élément button : focus clavier, Entrée et Espace natifs.",
    "Cible tactile d'au moins 44 px sur écran tactile.",
    "Quand plusieurs boutons portent le même libellé, ajouter un aria-label qui les distingue (« Supprimer : VPN inaccessible »).",
  ],
  aFaire: "Un seul bouton primaire par zone. Nommer l'action par un verbe (« Créer », « Prendre en charge »).",
  aEviter: "Détourner un bouton en lien de navigation, ou empiler plusieurs boutons accent.",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Bouton>Primaire</Bouton>
      <Bouton variante="accent">Accent</Bouton>
      <Bouton variante="secondaire">Secondaire</Bouton>
      <Bouton variante="discret">Discret</Bouton>
      <Bouton taille="compacte">Compact</Bouton>
      <Bouton disabled>Désactivé</Bouton>
    </div>
  ),
};

export default doc;
```

`src/design-system/composants/Champ/Champ.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { Champ } from "./Champ";

const doc: DocComposant = {
  nom: "Champ",
  resume: "Champ de saisie avec son libellé, sur une ou plusieurs lignes, et un message d'erreur relié.",
  props: [
    { nom: "libelle", type: "string", description: "Texte du libellé, relié au champ par htmlFor." },
    { nom: "erreur", type: "string", description: "Message d'erreur : marque le champ invalide et le relie par aria-describedby. (Pas encore utilisé par l'app : les messages du domaine ne sont pas rattachés à un champ.)" },
    { nom: "multiligne", type: "boolean", defaut: "false", description: "Rend un textarea au lieu d'un input." },
    { nom: "…natifs", type: "InputHTMLAttributes | TextareaHTMLAttributes", description: "value, onChange, placeholder, etc. La ref est transmise à l'élément natif." },
  ],
  accessibilite: [
    "Le libellé est un vrai label : cliquer dessus donne le focus au champ, un lecteur d'écran l'annonce.",
    "Une erreur ajoute aria-invalid et aria-describedby ; le texte ne dépend pas de la couleur.",
    "Hauteur d'au moins 44 px sur écran tactile.",
  ],
  aFaire: "Un libellé court et permanent ; le placeholder n'est qu'un exemple.",
  aEviter: "Remplacer le libellé par le placeholder, qui disparaît à la saisie.",
  Demo: () => (
    <Surface>
      <Champ libelle="Titre" placeholder="Ex. VPN inaccessible" />
      <Champ libelle="Demandeur" erreur="Le demandeur est obligatoire." />
      <Champ libelle="Description" multiligne placeholder="Détails utiles (optionnel)" />
    </Surface>
  ),
};

export default doc;
```

`src/design-system/composants/ChoixSegmente/ChoixSegmente.doc.tsx` :

```tsx
import { useState } from "react";
import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { ChoixSegmente, type OptionChoix } from "./ChoixSegmente";

const OPTIONS: OptionChoix<string>[] = [
  { valeur: "basse", libelle: "Basse", ton: "basse" },
  { valeur: "moyenne", libelle: "Moyenne", ton: "moyenne" },
  { valeur: "haute", libelle: "Haute", ton: "haute" },
];

function Demo() {
  const [valeur, setValeur] = useState("moyenne");
  return (
    <Surface>
      <ChoixSegmente legende="Priorité" nom="demo-priorite" valeur={valeur} options={OPTIONS} onChange={setValeur} />
    </Surface>
  );
}

const doc: DocComposant = {
  nom: "ChoixSegmente",
  resume: "Choix exclusif parmi quelques options colorées, présenté en segments.",
  props: [
    { nom: "legende", type: "string", description: "Nom du groupe, lu par les lecteurs d'écran." },
    { nom: "nom", type: "string", description: "Attribut name partagé par les radios." },
    { nom: "valeur", type: "V extends string", description: "Valeur actuellement choisie." },
    { nom: "options", type: "{ valeur: V; libelle: string; ton?: TonPriorite }[]", description: "Les options ; ton colore le segment." },
    { nom: "onChange", type: "(valeur: V) => void", description: "Appelé avec la valeur choisie." },
  ],
  accessibilite: [
    "role radiogroup nommé par la légende, radios natifs : flèches et arrêt de tabulation unique gérés par le navigateur.",
    "L'option choisie se voit par une bordure et un liseré, pas seulement par sa couleur.",
    "Cibles d'au moins 44 px sur écran tactile.",
  ],
  aFaire: "Réserver ce composant à 2 à 5 options courtes.",
  aEviter: "L'utiliser pour une liste longue : préférer une liste déroulante.",
  Demo,
};

export default doc;
```

`src/design-system/composants/Puce/Puce.doc.tsx` :

```tsx
import { useState } from "react";
import type { DocComposant } from "../../doc-types";
import { Puce } from "./Puce";

function Demo() {
  const [actif, setActif] = useState("Tous");
  const valeurs: Array<[string, number]> = [["Tous", 8], ["Nouveau", 3], ["Résolu", 0]];
  return (
    <div className="doc-demo-ligne" role="group" aria-label="Exemple de filtre">
      {valeurs.map(([nom, compteur]) => (
        <Puce key={nom} actif={actif === nom} compteur={compteur} onClick={() => setActif(nom)}>
          {nom}
        </Puce>
      ))}
    </div>
  );
}

const doc: DocComposant = {
  nom: "Puce",
  resume: "Bouton à bascule pour filtrer ou sélectionner, avec un compteur optionnel.",
  props: [
    { nom: "actif", type: "boolean", description: "État de la bascule, exposé par aria-pressed." },
    { nom: "compteur", type: "number", description: "Nombre affiché à droite du libellé ; 0 s'affiche." },
    { nom: "…natifs", type: "ButtonHTMLAttributes", description: "onClick, aria-*…" },
  ],
  accessibilite: [
    "aria-pressed annonce l'état aux lecteurs d'écran ; l'état actif change aussi de fond, pas seulement de bordure.",
    "Cible d'au moins 44 px sur écran tactile.",
    "Regrouper les puces dans un élément role group nommé.",
  ],
  aFaire: "Une puce par valeur de filtre, dans un groupe nommé.",
  aEviter: "Utiliser une puce pour une navigation entre pages.",
  Demo,
};

export default doc;
```

`src/design-system/composants/Tampon/Tampon.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Souche } from "../Souche/Souche";
import { Tampon } from "./Tampon";

const doc: DocComposant = {
  nom: "Tampon",
  resume: "Mention courte inclinée, comme un tampon d'encre, pour un statut.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLSpanElement>", description: "className, title, aria-*… ; le contenu est libre." }],
  accessibilite: [
    "Le tampon est du texte : il est lu tel quel. Ne pas s'en servir comme seule marque d'un état.",
    "Il reprend la couleur du texte de son conteneur (bordure et texte en currentColor).",
  ],
  aFaire: "Un mot ou deux : un statut.",
  aEviter: "Y mettre une phrase ou une action cliquable.",
  Demo: () => (
    <Souche ton="basse" numero="N° 12" tampon={<Tampon>Nouveau</Tampon>}>
      <p>Le tampon vit dans la tête d'une souche.</p>
    </Souche>
  ),
};

export default doc;
```

`src/design-system/composants/Bandeau/Bandeau.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Bandeau } from "./Bandeau";

const doc: DocComposant = {
  nom: "Bandeau",
  resume: "Message pleine largeur qui informe ou signale une erreur.",
  props: [
    { nom: "ton", type: '"info" | "erreur"', defaut: '"info"', description: "Ton du message." },
    { nom: "role", type: "string", description: "Remplace le rôle par défaut (alert pour une erreur, aucun pour une info)." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLDivElement>", description: "className, aria-*…" },
  ],
  accessibilite: [
    'Le ton erreur porte role="alert" : un lecteur d\'écran l\'annonce dès son apparition.',
    "Le message est un texte : il ne dépend pas de la couleur.",
  ],
  aFaire: "Dire ce qui s'est passé et, si possible, quoi faire.",
  aEviter: "Afficher plusieurs bandeaux d'erreur à la fois.",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Bandeau>Initialisation Power Platform…</Bandeau>
      <Bandeau ton="erreur">Power Platform indisponible : délai dépassé.</Bandeau>
    </div>
  ),
};

export default doc;
```

`src/design-system/composants/Surface/Surface.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Surface } from "./Surface";

const doc: DocComposant = {
  nom: "Surface",
  resume: "Bloc de contenu à angles arrondis : claire (pointillée) pour un formulaire, creuse pour une zone en retrait.",
  props: [
    { nom: "ton", type: '"claire" | "creuse"', defaut: '"claire"', description: "Fond et couleur de texte." },
    { nom: "as", type: '"div" | "section" | "form"', defaut: '"div"', description: "Balise rendue." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLElement>", description: "className, aria-live, onSubmit (pour form)…" },
  ],
  accessibilite: [
    "Les anneaux de focus des enfants sont adaptés au fond (sombre sur claire, clair sur creuse).",
    "Le texte respecte 4,5 de contraste sur chaque ton, dans les deux thèmes.",
  ],
  aFaire: "Choisir la balise sémantique qui convient (section, form).",
  aEviter: "Imbriquer des surfaces l'une dans l'autre.",
  Demo: () => (
    <>
      <Surface>Surface claire</Surface>
      <Surface ton="creuse">Surface creuse</Surface>
    </>
  ),
};

export default doc;
```

`src/design-system/composants/EtatVide/EtatVide.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { EtatVide } from "./EtatVide";

const doc: DocComposant = {
  nom: "EtatVide",
  resume: "Message affiché quand une liste ne contient rien.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLParagraphElement>", description: "className, aria-live… ; le contenu est libre." }],
  accessibilite: ["Rendu comme un paragraphe : lu dans l'ordre normal de la page."],
  aFaire: "Dire pourquoi c'est vide et, si utile, comment y remédier.",
  aEviter: "Laisser une zone blanche sans explication.",
  Demo: () => <EtatVide>Aucune demande ici pour le moment.</EtatVide>,
};

export default doc;
```

`src/design-system/composants/Titre/Titre.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Titre } from "./Titre";

const doc: DocComposant = {
  nom: "Titre",
  resume: "Titre dont le niveau sémantique (h1 à h4) est indépendant de son apparence.",
  props: [
    { nom: "niveau", type: "1 | 2 | 3 | 4", description: "Balise rendue : h1, h2, h3 ou h4." },
    { nom: "apparence", type: '"marque" | "sous-titre" | "carte"', defaut: '"marque"', description: "Rendu visuel : marque (Unbounded), sous-titre (22 px), carte (17 px)." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLHeadingElement>", description: "id, className…" },
  ],
  accessibilite: [
    "Choisir le niveau selon la structure du document, jamais selon la taille voulue : c'est le rôle d'apparence.",
    "Ne pas sauter de niveau (h1 puis h3).",
  ],
  aFaire: "Un seul h1 par page.",
  aEviter: "Choisir un h4 « parce qu'il est plus petit ».",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Titre niveau={2}>Marque</Titre>
      <Titre niveau={2} apparence="sous-titre">Sous-titre</Titre>
      <Titre niveau={2} apparence="carte">Carte</Titre>
    </div>
  ),
};

export default doc;
```

`src/design-system/composants/Page/Page.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Page } from "./Page";

const doc: DocComposant = {
  nom: "Page",
  resume: "Conteneur centré de largeur maximale 1180 px, avec les marges de page.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLDivElement>", description: 'className, data-theme (pour poser un thème sur la racine de l\'app)…' }],
  accessibilite: ["Conteneur neutre : il ne porte aucun rôle, la structure vient de ses enfants."],
  aFaire: "Une seule Page à la racine de l'écran.",
  aEviter: "Imbriquer des Page.",
  Demo: () => <Page className="doc-demo-ligne">Contenu dans une page centrée</Page>,
};

export default doc;
```

`src/design-system/composants/Grille/Grille.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { Grille } from "./Grille";

const doc: DocComposant = {
  nom: "Grille",
  resume: "Dispose ses enfants en grille : deux colonnes (une seule sous 860 px) ou colonnes automatiques.",
  props: [
    { nom: "mode", type: '"deux-colonnes" | "auto"', description: "deux-colonnes : 1,5 fr / 1 fr, une colonne sous 860 px. auto : autant de colonnes de 270 px minimum que la largeur en permet." },
    { nom: "as", type: '"div" | "section" | "ul"', defaut: '"div"', description: "Balise rendue ; avec ul, les enfants sont des li." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLElement>", description: "className, aria-*…" },
  ],
  accessibilite: ["Avec as=\"ul\", la liste garde sa sémantique pour les lecteurs d'écran.", "L'ordre du DOM est l'ordre de lecture : ne pas s'appuyer sur la disposition visuelle."],
  aFaire: "Utiliser as=\"ul\" pour une collection d'éléments comparables.",
  aEviter: "Compter sur la grille pour réordonner visuellement le contenu.",
  Demo: () => (
    <Grille mode="auto" as="ul">
      {["Un", "Deux", "Trois"].map((n) => (
        <li key={n}>
          <Surface>{n}</Surface>
        </li>
      ))}
    </Grille>
  ),
};

export default doc;
```

`src/design-system/composants/Souche/Souche.doc.tsx` :

```tsx
import type { DocComposant } from "../../doc-types";
import { Bouton } from "../Bouton/Bouton";
import { Tampon } from "../Tampon/Tampon";
import { Titre } from "../Titre/Titre";
import { Souche } from "./Souche";

const doc: DocComposant = {
  nom: "Souche",
  resume: "Carte à encoches, comme la souche d'un ticket de guichet, colorée selon son ton.",
  props: [
    { nom: "ton", type: '"haute" | "moyenne" | "basse" | "neutre"', description: "Couleur de fond. neutre sert aux éléments clos." },
    { nom: "numero", type: "ReactNode", description: "Numéro affiché en grand, en haut à gauche." },
    { nom: "tampon", type: "ReactNode", description: "Emplacement du tampon, en haut à droite (facultatif)." },
    { nom: "children", type: "ReactNode", description: "Corps de la souche, sous la ligne pointillée." },
  ],
  accessibilite: [
    "Rendue comme un article. La couleur seule ne dit pas la priorité : le contenu doit l'écrire en toutes lettres.",
    "Texte à l'encre foncée, 5,8 de contraste au minimum sur chaque ton.",
    "En thème Jour, un contour rend les bords visibles sur la page claire.",
  ],
  aFaire: "Écrire la priorité dans le corps (« Priorité haute »).",
  aEviter: "Compter sur le seul ton pour transmettre l'urgence.",
  Demo: () => (
    <Souche ton="moyenne" numero="N° 42" tampon={<Tampon>Nouveau</Tampon>}>
      <Titre niveau={4} apparence="carte">Badge d'accès HS</Titre>
      <p>Priorité moyenne</p>
      <Bouton taille="compacte">Prendre en charge</Bouton>
    </Souche>
  ),
};

export default doc;
```

- [ ] **Step 4: Voir les tests passer**

Run: `npm test -- src/design-system`
Expected: PASS — 12 fiches, les démos se rendent, `Object.keys(DS)` = noms des fiches.

- [ ] **Step 5: Typage**

Run: `npm run build` — attendu : succès sans warning.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/design-system
git commit -m "docs(ds): fiches de documentation des 12 composants et test de complétude

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Migration — `tonPriorite`, `StatusFilter` et `Prochain`

**Files:**
- Create: `src/components/tonPriorite.ts`, `src/components/StatusFilter.css`, `src/components/Prochain.css`
- Modify: `src/components/StatusFilter.tsx`, `src/components/Prochain.tsx`
- Test: `src/components/tonPriorite.test.ts` (nouveau) ; `StatusFilter.test.tsx` et `Prochain.test.tsx` **inchangés**

**Interfaces:**
- Consumes: `Puce`, `Bouton`, `Surface`, `Titre`, `TonPriorite` (via `../design-system`) ; `Priorite` (domaine).
- Produces: `tonPriorite(p: Priorite): TonPriorite` (`Basse→"basse"`, `Moyenne→"moyenne"`, `Haute→"haute"`).

> Pendant la migration, l'ancien `src/styles.css` est encore chargé par `main.tsx` : l'app n'est visuellement cohérente qu'à la fin de la Task 15. Les classes locales de l'app sont préfixées `app-` pour ne jamais entrer en collision avec l'ancien CSS.

- [ ] **Step 1: Écrire le test rouge de `tonPriorite`**

`src/components/tonPriorite.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { tonPriorite } from "./tonPriorite";

describe("tonPriorite", () => {
  it("traduit chaque priorité métier en ton du design system", () => {
    expect(tonPriorite("Basse")).toBe("basse");
    expect(tonPriorite("Moyenne")).toBe("moyenne");
    expect(tonPriorite("Haute")).toBe("haute");
  });
});
```

- [ ] **Step 2: Voir le test échouer**

Run: `npm test -- src/components/tonPriorite.test.ts`
Expected: FAIL — `Failed to resolve import "./tonPriorite"`.

- [ ] **Step 3: Implémenter `tonPriorite.ts`**

```typescript
import type { Priorite } from "../domain/ticket";
import type { TonPriorite } from "../design-system";

const TON: Record<Priorite, TonPriorite> = { Basse: "basse", Moyenne: "moyenne", Haute: "haute" };

/** Frontière métier → design system : le DS ne connaît pas `Priorite`, l'app traduit. */
export function tonPriorite(priorite: Priorite): TonPriorite {
  return TON[priorite];
}
```

Run: `npm test -- src/components/tonPriorite.test.ts` — attendu : PASS.

- [ ] **Step 4: Migrer `StatusFilter`** (les 3 tests existants sont la spécification : ils doivent passer **sans modification**)

`src/components/StatusFilter.tsx` :

```tsx
import type { Statut } from "../domain/ticket";
import { STATUTS } from "../domain/ticket";
import { Puce } from "../design-system";
import "./StatusFilter.css";

export function StatusFilter({
  valeur,
  onChange,
  compteurs,
}: {
  valeur: Statut | "Tous";
  onChange: (s: Statut | "Tous") => void;
  compteurs: Record<Statut | "Tous", number>;
}) {
  const options: (Statut | "Tous")[] = ["Tous", ...STATUTS];
  return (
    <div className="app-filtres" role="group" aria-label="Filtrer par statut">
      {options.map((o) => (
        <Puce key={o} actif={o === valeur} compteur={compteurs[o]} onClick={() => onChange(o)}>
          {o}
        </Puce>
      ))}
    </div>
  );
}
```

`src/components/StatusFilter.css` :

```css
.app-filtres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cto-space-2);
  margin-bottom: var(--cto-space-6);
}
```

Run: `npm test -- src/components/StatusFilter.test.tsx` — attendu : PASS (3 tests).

- [ ] **Step 5: Migrer `Prochain`** (3 tests existants inchangés)

`src/components/Prochain.tsx` :

```tsx
import type { Ticket } from "../domain/ticket";
import { libelleTransition } from "../domain/ticket";
import { Bouton, Surface, Titre } from "../design-system";
import { numeroTicket, formaterDate } from "./format";
import { tonPriorite } from "./tonPriorite";
import "./Prochain.css";

export function Prochain({
  ticket,
  onPrendreEnCharge,
}: {
  ticket: Ticket | undefined;
  onPrendreEnCharge: (id: string) => void;
}) {
  if (!ticket) {
    return (
      <Surface as="section" ton="creuse" className="app-prochain" aria-live="polite">
        <p className="app-prochain__lib">Prochain à prendre en charge</p>
        <Titre niveau={2} apparence="sous-titre" className="app-prochain__titre">
          Rien en attente. Toutes les demandes sont prises en charge.
        </Titre>
      </Surface>
    );
  }
  return (
    <Surface as="section" ton="creuse" className="app-prochain" aria-live="polite">
      <div>
        <p className="app-prochain__lib">Prochain à prendre en charge</p>
        <div className={`app-prochain__num app-prochain__num--${tonPriorite(ticket.priorite)}`}>
          N° {numeroTicket(ticket.id)}
        </div>
        <Titre niveau={2} apparence="sous-titre" className="app-prochain__titre">
          {ticket.titre}
        </Titre>
        <p className="app-prochain__qui">
          Priorité {ticket.priorite.toLowerCase()}, demandé par {ticket.demandeur} le {formaterDate(ticket.creeLe)}
        </p>
      </div>
      <Bouton
        variante="accent"
        className="app-prochain__action"
        onClick={() => onPrendreEnCharge(ticket.id)}
        aria-label={`${libelleTransition("Nouveau", "En cours")} : ${ticket.titre}`}
      >
        {libelleTransition("Nouveau", "En cours")}
      </Bouton>
    </Surface>
  );
}
```

`src/components/Prochain.css` :

```css
.app-prochain {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 250px;
}

.app-prochain__lib {
  margin: 0;
  font-size: var(--cto-taille-md);
  opacity: var(--cto-opacite-attenuee);
}

.app-prochain__num {
  margin: var(--cto-space-2) 0;
  font: var(--cto-poids-extra) clamp(64px, 10vw, 112px) / 1 var(--cto-police-titre);
}
.app-prochain__num--haute {
  color: var(--cto-priorite-haute-fond);
}
.app-prochain__num--moyenne {
  color: var(--cto-priorite-moyenne-fond);
}
.app-prochain__num--basse {
  color: var(--cto-priorite-basse-fond);
}

.app-prochain__titre {
  max-width: 34ch;
}

.app-prochain__qui {
  margin: var(--cto-space-2) 0 0;
  opacity: var(--cto-opacite-attenuee);
}

.app-prochain__action {
  align-self: flex-start;
  margin-top: var(--cto-space-4);
}
```

- [ ] **Step 6: Vérifier**

Run: `npm test` — attendu : tout vert, **dont les tests existants de `Prochain` et `StatusFilter` non modifiés**.
Run: `git diff --stat -- "src/components/*.test.*"` — attendu : uniquement `tonPriorite.test.ts` (nouveau, non suivi) ; aucun test existant modifié.
Run: `npm run build` — attendu : succès.

- [ ] **Step 7: Commit (après confirmation)**

```bash
git add src/components/tonPriorite.ts src/components/tonPriorite.test.ts src/components/StatusFilter.tsx src/components/StatusFilter.css src/components/Prochain.tsx src/components/Prochain.css
git commit -m "refactor(ui): StatusFilter et Prochain consomment le design system Contoso

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: Migration — `TicketForm` et `TicketList`, puis route de la doc

**Files:**
- Create: `src/components/TicketForm.css`, `src/components/TicketList.css`, `src/routage.ts`
- Modify: `src/components/TicketForm.tsx`, `src/components/TicketList.tsx`
- Test: `src/routage.test.ts` (nouveau) ; `TicketForm.test.tsx` et `TicketList.test.tsx` **inchangés**

**Interfaces:**
- Consumes: `Bouton, Champ, ChoixSegmente, EtatVide, Grille, Souche, Surface, Tampon, Titre, type OptionChoix, type TonPriorite` (via `../design-system`) ; `tonPriorite` (Task 13).
- Produces: `estRouteDoc(hash: string): boolean` — vrai pour `#/design-system` et `#/design-system/…`, faux pour tout le reste (notamment `#/design-systemique`).

- [ ] **Step 1: Écrire le test rouge de `routage`**

`src/routage.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { estRouteDoc } from "./routage";

describe("estRouteDoc", () => {
  it("reconnaît la route de la doc, avec ou sans sous-chemin", () => {
    expect(estRouteDoc("#/design-system")).toBe(true);
    expect(estRouteDoc("#/design-system/")).toBe(true);
    expect(estRouteDoc("#/design-system/composants")).toBe(true);
  });

  it("ne confond pas une route voisine avec la doc", () => {
    expect(estRouteDoc("#/design-systemique")).toBe(false);
    expect(estRouteDoc("#/autre")).toBe(false);
    expect(estRouteDoc("#design-system")).toBe(false);
  });

  it("ne reconnaît pas la doc sans hash", () => {
    expect(estRouteDoc("")).toBe(false);
  });
});
```

Run: `npm test -- src/routage.test.ts` — attendu : FAIL (`Failed to resolve import "./routage"`).

- [ ] **Step 2: Implémenter `routage.ts`**

```typescript
/** La doc du design system vit sous `#/design-system` (pas de router dans le projet). */
export function estRouteDoc(hash: string): boolean {
  return /^#\/design-system(\/.*)?$/.test(hash);
}
```

Run: `npm test -- src/routage.test.ts` — attendu : PASS.

- [ ] **Step 3: Migrer `TicketForm`** (5 tests existants inchangés)

`src/components/TicketForm.tsx` :

```tsx
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket, PRIORITES } from "../domain/ticket";
import { Bouton, Champ, ChoixSegmente, Surface, Titre, type OptionChoix } from "../design-system";
import { tonPriorite } from "./tonPriorite";
import "./TicketForm.css";

const OPTIONS_PRIORITE: OptionChoix<Priorite>[] = PRIORITES.map((p) => ({
  valeur: p,
  libelle: p,
  ton: tonPriorite(p),
}));

export function TicketForm({ onCreer }: { onCreer: (t: NouveauTicket) => Promise<boolean> }) {
  const [titre, setTitre] = useState("");
  const [demandeur, setDemandeur] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("Moyenne");
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    const input: NouveauTicket = { titre, demandeur, description, priorite };
    const errs = validerTicket(input);
    setErreurs(errs);
    if (errs.length) return;
    setEnCours(true);
    try {
      if (await onCreer(input)) {
        setTitre("");
        setDemandeur("");
        setDescription("");
        setPriorite("Moyenne");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Surface as="form" className="app-ticket-form" onSubmit={soumettre}>
      <Titre niveau={2}>Nouvelle demande</Titre>
      <Champ
        libelle="Titre"
        value={titre}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitre(e.target.value)}
        placeholder="Ex. VPN inaccessible"
      />
      <Champ
        libelle="Demandeur"
        value={demandeur}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDemandeur(e.target.value)}
        placeholder="Prénom Nom"
      />
      <Champ
        libelle="Description"
        multiligne
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        placeholder="Détails utiles pour traiter la demande (optionnel)"
      />
      <ChoixSegmente
        legende="Priorité"
        nom="priorite"
        valeur={priorite}
        options={OPTIONS_PRIORITE}
        onChange={setPriorite}
      />
      {erreurs.map((x) => (
        <p key={x} className="app-ticket-form__err">
          {x}
        </p>
      ))}
      <Bouton type="submit" pleineLargeur disabled={enCours}>
        Créer
      </Bouton>
    </Surface>
  );
}
```

`src/components/TicketForm.css` :

```css
.app-ticket-form {
  display: flex;
  flex-direction: column;
  gap: var(--cto-space-3);
}

.app-ticket-form__err {
  margin: 0;
  font-size: var(--cto-taille-sm);
  color: var(--cto-retour-erreur-texte-surface);
}
```

Run: `npm test -- src/components/TicketForm.test.tsx` — attendu : PASS (5 tests, **fichier de test non modifié**). Si `tsc` (étape 6) refuse `PRIORITES.map(...)`, c'est que `PRIORITES` n'est pas un tableau de `Priorite` : lire sa déclaration dans `src/domain/ticket.ts` avant de corriger (ne pas modifier le domaine).

- [ ] **Step 4: Migrer `TicketList`** (11 tests existants inchangés, dont `selector: ".tampon"`)

`src/components/TicketList.tsx` :

```tsx
import { useId, useState } from "react";
import type { Ticket, Statut } from "../domain/ticket";
import { transitionsPossibles, libelleTransition } from "../domain/ticket";
import { Bouton, EtatVide, Grille, Souche, Tampon, Titre, type TonPriorite } from "../design-system";
import { numeroTicket, formaterDate } from "./format";
import { tonPriorite } from "./tonPriorite";
import "./TicketList.css";

type Props = {
  tickets: Ticket[];
  onChangerStatut: (id: string, s: Statut) => void;
  onSupprimer: (id: string) => void;
};

function tonSouche(t: Ticket): TonPriorite {
  return t.statut === "Résolu" ? "neutre" : tonPriorite(t.priorite);
}

function CarteTicket({ ticket: t, onChangerStatut, onSupprimer }: { ticket: Ticket } & Omit<Props, "tickets">) {
  const [depliee, setDepliee] = useState(false);
  const idDescription = useId();
  const cibles = transitionsPossibles(t.statut).filter((s) => s !== t.statut);
  return (
    <Souche
      ton={tonSouche(t)}
      numero={`N° ${numeroTicket(t.id)}`}
      // La classe « tampon » n'a aucun style : elle garde le test existant (selector ".tampon") inchangé.
      tampon={<Tampon className="tampon">{t.statut}</Tampon>}
    >
      <Titre niveau={3} apparence="carte" className="app-ticket__titre">
        {t.titre}
      </Titre>
      <div className="app-ticket__qui">
        {t.demandeur}, {formaterDate(t.creeLe)}
      </div>
      {t.description && (
        <Bouton
          variante="discret"
          taille="compacte"
          className="app-ticket__voir"
          aria-label={`${depliee ? "Masquer" : "Voir"} la description : ${t.titre}`}
          aria-expanded={depliee}
          aria-controls={idDescription}
          onClick={() => setDepliee(!depliee)}
        >
          {depliee ? "Masquer la description" : "Voir la description"}
        </Bouton>
      )}
      {t.description && depliee && (
        <p className="app-ticket__desc" id={idDescription}>
          {t.description}
        </p>
      )}
      <div className="app-ticket__priorite">Priorité {t.priorite.toLowerCase()}</div>
      <div className="app-ticket__actions">
        {cibles.map((vers, i) => {
          const libelle = libelleTransition(t.statut, vers);
          return (
            <Bouton
              key={vers}
              taille="compacte"
              variante={i === 0 ? "primaire" : "secondaire"}
              aria-label={`${libelle} : ${t.titre}`}
              onClick={() => onChangerStatut(t.id, vers)}
            >
              {libelle}
            </Bouton>
          );
        })}
        <Bouton
          variante="discret"
          taille="compacte"
          className="app-ticket__suppr"
          aria-label={`Supprimer : ${t.titre}`}
          onClick={() => onSupprimer(t.id)}
        >
          Supprimer
        </Bouton>
      </div>
    </Souche>
  );
}

export function TicketList({ tickets, onChangerStatut, onSupprimer }: Props) {
  if (tickets.length === 0) return <EtatVide>Aucune demande ici pour le moment.</EtatVide>;
  return (
    <Grille as="ul" mode="auto">
      {tickets.map((t) => (
        <li key={t.id}>
          <CarteTicket ticket={t} onChangerStatut={onChangerStatut} onSupprimer={onSupprimer} />
        </li>
      ))}
    </Grille>
  );
}
```

`src/components/TicketList.css` :

```css
.app-ticket__titre {
  margin-bottom: var(--cto-space-2);
}

.app-ticket__qui {
  font-size: var(--cto-taille-sm);
}

.app-ticket__voir {
  align-self: flex-start;
  margin: var(--cto-space-2) 0 0 calc(var(--cto-space-1) * -1);
}

.app-ticket__desc {
  margin: var(--cto-space-2) 0 0;
  font-size: var(--cto-taille-sm);
  overflow-wrap: anywhere;
}

.app-ticket__priorite {
  margin-top: var(--cto-space-3);
  font-size: var(--cto-taille-xs);
  font-weight: var(--cto-poids-gras);
}

.app-ticket__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cto-space-2);
  margin-top: auto;
  padding-top: var(--cto-space-4);
}

.app-ticket__suppr {
  margin-left: auto;
}

@media (pointer: coarse) {
  .app-ticket__actions {
    gap: var(--cto-space-2) var(--cto-space-3);
  }
}
```

- [ ] **Step 5: Vérifier**

Run: `npm test` — attendu : tout vert, dont `TicketForm.test.tsx` et `TicketList.test.tsx` **non modifiés**.
Run: `git diff --stat -- "src/components/*.test.*"` — attendu : aucun test existant modifié.
Run: `npm run build` — attendu : succès sans warning.

- [ ] **Step 6: Commit (après confirmation)**

```bash
git add src/routage.ts src/routage.test.ts src/components/TicketForm.tsx src/components/TicketForm.css src/components/TicketList.tsx src/components/TicketList.css
git commit -m "refactor(ui): TicketForm et TicketList consomment le design system ; route de la doc

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 15: Migration — `App`, `PowerProvider`, `main.tsx`, suppression de `styles.css`

**Files:**
- Create: `src/App.css`
- Modify: `src/App.tsx`, `src/PowerProvider.tsx`, `src/main.tsx`, `src/design-system/gouvernance.test.ts`
- Delete: `src/styles.css`

**Interfaces:**
- Consumes: `Bandeau, Grille, Page, Titre` (via `./design-system`), `estRouteDoc` (Task 14), `PageDoc` (Task 11).
- Produces: l'app complète sur le DS ; `#/design-system` ouvre la doc, rendue **hors** de `PowerProvider`.

- [ ] **Step 1: `App.tsx` et `App.css`**

Dans `src/App.tsx`, remplacer les imports et le `return` (le reste — `useMemo`, `useTickets`, `demo()` — est inchangé) :

```tsx
import { useMemo, useState } from "react";
import { useTickets } from "./hooks/useTickets";
import { InMemoryTicketRepository } from "./data/inMemoryTicketRepository";
import { SharePointTicketRepository } from "./data/sharePointTicketRepository";
import type { TicketRepository } from "./data/ticketRepository";
import { Bandeau, Grille, Page, Titre } from "./design-system";
import { Prochain } from "./components/Prochain";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { StatusFilter } from "./components/StatusFilter";
import { compter, filtrerParStatut, prochainATraiter, type Statut, type Ticket } from "./domain/ticket";
import "./App.css";
```

```tsx
  return (
    <Page data-theme="comptoir">
      <Titre niveau={1} className="app-titre">
        Guichet des demandes aMP
      </Titre>
      <Grille as="section" mode="deux-colonnes" className="app-affichage">
        <Prochain ticket={prochainATraiter(tickets)} onPrendreEnCharge={(id) => changerStatut(id, "En cours")} />
        <TicketForm onCreer={creer} />
      </Grille>
      <StatusFilter
        valeur={filtre}
        onChange={setFiltre}
        compteurs={{ Tous: tickets.length, ...compter(tickets) }}
      />
      {erreur && (
        <Bandeau ton="erreur" className="app-bandeau">
          {erreur}
        </Bandeau>
      )}
      {chargement ? (
        <p>Chargement…</p>
      ) : (
        <TicketList tickets={visibles} onChangerStatut={changerStatut} onSupprimer={supprimer} />
      )}
    </Page>
  );
```

`src/App.css` :

```css
.app-titre {
  margin-bottom: var(--cto-space-6);
  opacity: var(--cto-opacite-attenuee);
}

.app-affichage {
  margin-bottom: var(--cto-space-7);
}

.app-bandeau {
  margin-bottom: var(--cto-space-6);
}
```

- [ ] **Step 2: `PowerProvider.tsx`** — ne changer que l'import et les deux lignes de rendu (la logique `getContext()` reste intacte) :

```tsx
import { Bandeau } from "./design-system";
```

```tsx
  if (erreur) return <Bandeau ton="erreur">Power Platform indisponible : {erreur}</Bandeau>;
  if (!pret) return <Bandeau>Initialisation Power Platform…</Bandeau>;
  return <>{children}</>;
```

- [ ] **Step 3: `main.tsx`** (remplace le fichier) :

```tsx
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { PowerProvider } from "./PowerProvider";
import App from "./App";
import { estRouteDoc } from "./routage";
import "./design-system/polices";
import "./design-system/styles.css";

// La doc n'a pas besoin de Power Platform et n'alourdit pas le bundle de l'app.
const PageDoc = lazy(() => import("./design-system/doc/PageDoc"));

window.addEventListener("hashchange", () => window.location.reload());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {estRouteDoc(window.location.hash) ? (
      <Suspense fallback={null}>
        <PageDoc />
      </Suspense>
    ) : (
      <PowerProvider>
        <App />
      </PowerProvider>
    )}
  </StrictMode>
);
```

- [ ] **Step 4: Supprimer `src/styles.css` et retirer son exclusion des scans**

Run: `git rm src/styles.css`

Dans `src/design-system/gouvernance.test.ts`, remplacer le glob des fichiers CSS par :

```typescript
const fichiersCss = import.meta.glob<string>(
  ["/src/design-system/**/*.css", "/src/components/**/*.css", "/src/*.css"],
  { query: "?raw", import: "default", eager: true }
);
```

et le commentaire au-dessus par : `// Périmètre des scans CSS : le DS, les composants de l'app et les CSS à la racine de src/.`

- [ ] **Step 5: Chercher les classes orphelines et les usages restants de l'ancien CSS**

Run (Grep) : motifs `className="(souche|tampon|bloc|prochain|filtres|banniere|page|affichage|bouton|valider|prios)` dans `src/` hors tests — attendu : aucun résultat, sauf la classe volontaire `tampon` dans `TicketList.tsx` (attendu, commentée).

- [ ] **Step 6: Vérifier**

Run: `npm test` — attendu : tout vert (les gouvernances scannent maintenant `App.css` et tous les CSS de `src/components/`).
Run: `npm run build` — attendu : succès, sans warning ; le build doit produire un chunk séparé pour la doc.

- [ ] **Step 7: Vérification manuelle en mode mémoire**

Run (arrière-plan) : `npm run dev`. Ouvrir `http://localhost:3000/` : l'app s'affiche, tickets de démo visibles, création d'un ticket et changement de statut fonctionnent ; ouvrir `http://localhost:3000/#/design-system` : la doc s'affiche. Console du navigateur : aucune erreur.

- [ ] **Step 8: Commit (après confirmation)**

```bash
git add src/App.tsx src/App.css src/PowerProvider.tsx src/main.tsx src/design-system/gouvernance.test.ts
git commit -m "refactor(ui): l'app consomme entièrement le design system, styles.css supprimé

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(`git rm` a déjà indexé la suppression de `src/styles.css`.)

---

## Task 16: Documentation du DS, `CLAUDE.md` et CHANGELOG

**Files:**
- Create: `src/design-system/README.md`, `src/design-system/CHANGELOG.md`
- Modify: `CLAUDE.md`

**Interfaces:** aucune (documentation).

- [ ] **Step 1: Écrire `src/design-system/README.md`**

```markdown
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
```

- [ ] **Step 2: Écrire `src/design-system/CHANGELOG.md`**

```markdown
# Changelog — Contoso

## 1.0.0 — 2026-09-23

Première version.

- Tokens à trois niveaux (`--cto-*`) : 15 couleurs primitives, échelles d'espacement, de rayons et de typographie ; 35 tokens sémantiques ; tokens de composant pour `Souche`.
- Deux thèmes : **Comptoir** (par défaut) et **Jour** (clair).
- 12 composants : Bandeau, Bouton, Champ, ChoixSegmente, EtatVide, Grille, Page, Puce, Souche, Surface, Tampon, Titre.
- Documentation vivante sur `#/design-system`.
- Gouvernance testée : tokens définis, aucune couleur en dur, contrastes calculés dans les deux thèmes, frontière d'import, fiche de doc obligatoire.
- Écarts visuels volontaires par rapport à l'app d'avant le DS : bordures des champs et des puces de filtre plus contrastées (WCAG 1.4.11) ; espacements et rayons alignés sur l'échelle de 4 px.
```

- [ ] **Step 3: Mettre à jour `CLAUDE.md`**

Dans le tableau d'architecture, ajouter la ligne suivante après la ligne `src/PowerProvider.tsx` :

```markdown
| `src/design-system/` | Design system **Contoso** : tokens `--cto-*` (primitifs → sémantiques par thème → composants), 12 composants React, doc vivante `#/design-system`. Point d'entrée unique : `index.ts`. **N'importe rien du métier.** Voir `src/design-system/README.md`. |
```

Dans `## Règles (non négociables)`, ajouter après la règle 8 :

```markdown
9. **Design system Contoso.** Les composants de l'app n'utilisent ni couleur en dur ni couleur
   primitive (`--cto-teal-…`, etc.) : uniquement des tokens sémantiques. Leur CSS local est préfixé
   `app-`. Le DS n'importe jamais le métier (`domain/`, `data/`, `hooks/`, `generated/`, SDK, `App`).
   On importe depuis `../design-system`, jamais un fichier profond. Un nouveau composant ou token
   passe par le README du DS (usage réel, test rouge, fiche de doc, manifeste).
```

Dans `## Commandes`, ajouter après `npm run dev` :

```markdown
# Documentation du design system : http://localhost:3000/#/design-system (mode mémoire)
```

Dans `## Stack (figée)`, ajouter la puce : `- Styles : CSS pur et variables CSS `--cto-*` (design system Contoso), polices `@fontsource-variable`. Aucune bibliothèque de composants ni de CSS-in-JS.`

Dans `## Pièges connus`, ajouter :

```markdown
- **Tests de gouvernance du DS** (`src/design-system/gouvernance.test.ts`) : ils lisent les CSS via
  `import.meta.glob(…?raw)`. Un `npm test` rouge « couleur en dur », « token non défini » ou
  « contraste » se corrige dans les tokens, pas en assouplissant le test.
- **Hash routing** : la doc est sur `#/design-system`. Elle est rendue hors de `PowerProvider`.
```

- [ ] **Step 4: Vérifier**

Run: `npm test` — attendu : tout vert (les fichiers `.md` ne sont pas scannés).

- [ ] **Step 5: Commit (après confirmation)**

```bash
git add src/design-system/README.md src/design-system/CHANGELOG.md CLAUDE.md
git commit -m "docs(ds): README, CHANGELOG 1.0.0 et règles du design system dans CLAUDE.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 17: Vérification finale — parité visuelle, thème Jour, hôte Power Apps

**Files:** aucun fichier de code (captures dans `.superpowers/captures/apres/`, ignoré par git). Si un défaut est trouvé, le corriger **dans la tâche concernée** avec un test rouge d'abord, puis revenir ici.

- [ ] **Step 1: Suite complète et build**

Run: `npm test` — noter le nombre de fichiers et de tests ; attendu : tout vert.
Run: `npm run build` — attendu : succès, **sans erreur ni warning** ; noter la taille du chunk de la doc.
Run: `git status --short` — attendu : arbre propre (tout est commité) ; aucun `vitest.config.ts.timestamp-*.mjs` résiduel.

- [ ] **Step 2: Captures « après »** en suivant l'**Annexe A** de la Task 0, dossier `.superpowers/captures/apres/`, mêmes noms de fichiers.

- [ ] **Step 3: Comparer avant/après**, image par image (outil `Read` sur les PNG des deux dossiers) : `01`↔`01`, etc. Lister chaque écart observé et le classer :
  - **volontaire** (spec §7) : bordure des champs plus foncée ; bordure des puces ; arrondis à l'échelle de 4 px (≤ 2 px), padding bas de page 64 px, `h1` 17 px, atténuations à 0,85 ;
  - **défaut** : tout le reste (couleur, alignement, encoches du masque décalées, ligne pointillée, cible tactile, débordement mobile). Corriger, puis refaire la capture concernée.

- [ ] **Step 4: Relire la doc dans les deux thèmes** : `http://localhost:3000/#/design-system`, thème Comptoir puis Jour (bouton en haut). Capturer `10-doc-comptoir.png` et `11-doc-jour.png`. Vérifier à l'œil : lisibilité des pastilles et du tableau de contrastes, souches lisibles sur page claire (contour visible), anneau de focus visible (Tab) sur la page claire et sur la carte creuse.

- [ ] **Step 5: Clavier** : sur l'app, Tab parcourt puces → bouton de souche → … dans l'ordre visuel ; flèches ← → dans le groupe Priorité changent le choix ; l'anneau de focus est visible partout.

- [ ] **Step 6: Hôte Power Apps** (risque de la spec) : si l'environnement est authentifié (`pac auth list`), lancer `npm run power:run` avec `VITE_USE_SHAREPOINT=true` (voir CLAUDE.md § « Brancher SharePoint »), ouvrir l'URL « Local Play » : vérifier que l'app charge ses données **et** que `#…/design-system` ouvre la doc. Si l'environnement n'est pas accessible, **le dire tel quel** dans le compte rendu (« non vérifié en hôte Power Apps ») au lieu de conclure.

- [ ] **Step 7: Compte rendu à l'utilisateur** : résultats des tests et du build (chiffres réels), tableau des écarts visuels (volontaires / défauts corrigés / restants), ce qui n'a pas pu être vérifié, puis proposer la suite : `superpowers:finishing-a-development-branch` (fusion, PR ou conservation de la branche). **Ne rien fusionner ni pousser sans demande explicite.**
