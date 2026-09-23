# Interface « Le guichet » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'interface actuelle par la direction « Le guichet » choisie par l'utilisateur, sans toucher au domaine existant, au hook `useTickets`, ni aux repositories.

**Architecture:** Les composants (`components/`) et `App.tsx` sont restylés et recomposés. Le domaine gagne deux fonctions pures (règle 7 de la spec, libellés de transitions). Aucun changement dans `src/data/`, `src/hooks/`, `src/generated/`, `PowerProvider.tsx`.

**Tech Stack:** React 18, TypeScript strict, Vitest + Testing Library, `@fontsource-variable/unbounded` et `@fontsource-variable/hanken-grotesk` (polices embarquées, pas de Google Fonts).

**Spec:** [`docs/spec.md`](../../spec.md), règles 1 à 7 (la règle 7 est nouvelle). **Référence visuelle unique :** [`docs/design/mockups/2-guichet.html`](../../design/mockups/2-guichet.html) (CSS, couleurs, typographie, rendu). Le comportement de référence est dans le même fichier, alimenté par `docs/design/mockups/store.js`.

## Global Constraints

- TypeScript 5 `strict`, `noUnusedLocals`, `noUnusedParameters`, zéro `any`. `npm run build` sans erreur ni warning.
- Domaine pur : aucun import React ni SDK, pas de `Date`/`Math.random`/`crypto` directs dans `src/domain/`.
- Aucun composant ni hook n'importe `src/generated/` ou le SDK. Ne modifier ni `src/data/`, ni `src/hooks/`, ni `src/generated/`, ni `.power/`, ni `PowerProvider.tsx`.
- Le SDK n'est jamais appelé ni simulé dans les tests.
- Noms en français métier. Textes de l'interface en français, à la phrase (pas de tout en majuscules), une action garde le même nom partout (« Créer », « Prendre en charge », « Marquer résolu », « Renvoyer à Nouveau », « Rouvrir », « Supprimer »).
- Accessibilité : focus visible, cibles tactiles d'au moins 44 px sur mobile, `prefers-reduced-motion` respecté, la priorité ne repose jamais sur la couleur seule (le texte « Priorité haute » est toujours présent), contraste texte/fond d'au moins 4,5.
- Responsive : une seule colonne sous 860 px.
- Le mode mémoire (`npm run dev`) doit rester fonctionnel sans hôte Power Apps.

## Review Focus

- La transition `Nouveau` vers `Résolu` ne doit jamais être proposée dans l'interface (pas de bouton pour elle). → Testé dans Task 3.
- « Prochain à prendre en charge » : priorité la plus haute puis le plus ancien, ticket sans `Nouveau` géré. → Testé dans Task 1.
- La description vide n'affiche aucun bouton de dépliage ; dépliée, elle reste lisible. → Testé dans Task 3.
- Un identifiant non numérique (mode mémoire : `mem-3`) ne produit pas un numéro absurde. → Testé dans Task 2.
- Le formulaire garde la saisie si la création échoue et bloque le double envoi (comportement existant à ne pas perdre). → Testé dans Task 4.

---

## Task 1: Domaine — prochain ticket à traiter et libellés de transition (règle 7)

**Files:**
- Modify: `src/domain/ticket.ts`
- Test: `src/domain/ticket.test.ts`

**Interfaces:**
- Consumes: `Ticket`, `Statut`, `Priorite` (existants).
- Produces: `prochainATraiter(tickets: Ticket[]): Ticket | undefined` et `libelleTransition(de: Statut, vers: Statut): string`.

- [ ] **Step 1: Écrire les tests rouges** (à ajouter dans `src/domain/ticket.test.ts`, en important les deux nouvelles fonctions ; réutiliser le helper `base()` déjà présent)

```typescript
describe("prochainATraiter (règle 7)", () => {
  it("renvoie undefined s'il n'y a aucun ticket Nouveau", () => {
    const tickets = [base({ id: "a", statut: "En cours" }), base({ id: "b", statut: "Résolu" })];
    expect(prochainATraiter(tickets)).toBeUndefined();
    expect(prochainATraiter([])).toBeUndefined();
  });
  it("choisit la priorité la plus haute parmi les Nouveau", () => {
    const tickets = [
      base({ id: "a", statut: "Nouveau", priorite: "Basse" }),
      base({ id: "b", statut: "Nouveau", priorite: "Haute" }),
      base({ id: "c", statut: "Nouveau", priorite: "Moyenne" }),
    ];
    expect(prochainATraiter(tickets)?.id).toBe("b");
  });
  it("à priorité égale, choisit le plus ancien", () => {
    const tickets = [
      base({ id: "recent", statut: "Nouveau", priorite: "Haute", creeLe: "2026-09-24T12:00:00Z" }),
      base({ id: "ancien", statut: "Nouveau", priorite: "Haute", creeLe: "2026-09-24T08:00:00Z" }),
    ];
    expect(prochainATraiter(tickets)?.id).toBe("ancien");
  });
  it("ignore les tickets qui ne sont pas Nouveau, même de priorité haute", () => {
    const tickets = [
      base({ id: "encours", statut: "En cours", priorite: "Haute" }),
      base({ id: "nouveau", statut: "Nouveau", priorite: "Basse" }),
    ];
    expect(prochainATraiter(tickets)?.id).toBe("nouveau");
  });
  it("ne modifie pas le tableau reçu", () => {
    const tickets = [base({ id: "a", statut: "Nouveau" }), base({ id: "b", statut: "Nouveau", priorite: "Haute" })];
    const copie = [...tickets];
    prochainATraiter(tickets);
    expect(tickets).toEqual(copie);
  });
});

describe("libelleTransition", () => {
  it("nomme chaque transition autorisée avec un verbe", () => {
    expect(libelleTransition("Nouveau", "En cours")).toBe("Prendre en charge");
    expect(libelleTransition("En cours", "Résolu")).toBe("Marquer résolu");
    expect(libelleTransition("En cours", "Nouveau")).toBe("Renvoyer à Nouveau");
    expect(libelleTransition("Résolu", "En cours")).toBe("Rouvrir");
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npx vitest run --no-file-parallelism src/domain/ticket.test.ts`
Expected: FAIL, `prochainATraiter` et `libelleTransition` ne sont pas exportés.

- [ ] **Step 3: Implémenter** (à ajouter dans `src/domain/ticket.ts`, après `compter`)

```typescript
/** Règle 7 : parmi les Nouveau, priorité la plus haute, puis le plus ancien. */
export function prochainATraiter(tickets: Ticket[]): Ticket | undefined {
  return tickets
    .filter((t) => t.statut === "Nouveau")
    .sort(
      (a, b) =>
        PRIORITE_ORDRE[a.priorite] - PRIORITE_ORDRE[b.priorite] ||
        a.creeLe.localeCompare(b.creeLe)
    )[0];
}

/** Verbe affiché sur le bouton d'une transition autorisée. */
export function libelleTransition(de: Statut, vers: Statut): string {
  if (de === "Nouveau" && vers === "En cours") return "Prendre en charge";
  if (de === "En cours" && vers === "Résolu") return "Marquer résolu";
  if (de === "En cours" && vers === "Nouveau") return "Renvoyer à Nouveau";
  return "Rouvrir";
}
```

Le `.filter(...)` renvoie un nouveau tableau, donc `.sort` ne modifie pas l'entrée.

- [ ] **Step 4: Lancer tout et vérifier le succès**

Run: `npx vitest run --no-file-parallelism`
Expected: PASS (tous les tests précédents plus les 6 nouveaux).

- [ ] **Step 5: Commit**

```bash
git add src/domain/ticket.ts src/domain/ticket.test.ts
git commit -m "feat(domain): prochain ticket à traiter et libellés de transition (règle 7)"
```

---

## Task 2: Composant `Prochain` et utilitaires d'affichage

**Files:**
- Create: `src/components/format.ts`, `src/components/format.test.ts`
- Create: `src/components/Prochain.tsx`, `src/components/Prochain.test.tsx`

**Interfaces:**
- Consumes: `Ticket`, `libelleTransition` (Task 1).
- Produces:
  - `numeroTicket(id: string): string` : les chiffres de l'identifiant s'il y en a (`"42"` donne `"42"`, `"mem-3"` donne `"3"`), sinon l'identifiant tel quel (`"abc"` donne `"abc"`).
  - `formaterDate(iso: string): string` : jour et mois abrégé en français, par exemple `"23 sept."`.
  - `Prochain({ ticket, onPrendreEnCharge }: { ticket: Ticket | undefined; onPrendreEnCharge: (id: string) => void })`.

- [ ] **Step 1: Tests rouges de `format.ts`**

```typescript
// src/components/format.test.ts
import { describe, it, expect } from "vitest";
import { numeroTicket, formaterDate } from "./format";

describe("numeroTicket", () => {
  it("garde un identifiant SharePoint numérique", () => expect(numeroTicket("42")).toBe("42"));
  it("extrait le nombre d'un identifiant mémoire", () => expect(numeroTicket("mem-3")).toBe("3"));
  it("renvoie l'identifiant tel quel s'il n'a aucun chiffre", () => expect(numeroTicket("abc")).toBe("abc"));
});

describe("formaterDate", () => {
  it("affiche le jour et le mois en français", () => {
    const texte = formaterDate("2026-09-23T12:00:00Z");
    expect(texte).toMatch(/23/);
    expect(texte.toLowerCase()).toMatch(/sept/);
  });
});
```

- [ ] **Step 2: Vérifier l'échec, puis implémenter**

Run: `npx vitest run --no-file-parallelism src/components/format.test.ts` (FAIL : module absent).

```typescript
// src/components/format.ts
export function numeroTicket(id: string): string {
  const chiffres = id.replace(/\D/g, "");
  return chiffres.length > 0 ? chiffres : id;
}

export function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
```

Run again: PASS.

- [ ] **Step 3: Tests rouges de `Prochain`**

```tsx
// src/components/Prochain.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Prochain } from "./Prochain";
import type { Ticket } from "../domain/ticket";

const ticket: Ticket = {
  id: "43", titre: "Vidéoprojecteur de la salle Lagon ne s'allume plus", description: "",
  statut: "Nouveau", priorite: "Haute", demandeur: "Marc", creeLe: "2026-09-23T12:00:00Z",
};

describe("Prochain", () => {
  it("affiche le numéro, le titre, la priorité et le demandeur", () => {
    render(<Prochain ticket={ticket} onPrendreEnCharge={vi.fn()} />);
    expect(screen.getByText("N° 43")).toBeInTheDocument();
    expect(screen.getByText(/Vidéoprojecteur de la salle Lagon/)).toBeInTheDocument();
    expect(screen.getByText(/Priorité haute/)).toBeInTheDocument();
    expect(screen.getByText(/Marc/)).toBeInTheDocument();
  });

  it("appelle onPrendreEnCharge avec l'id au clic sur Prendre en charge", () => {
    const onPrendreEnCharge = vi.fn();
    render(<Prochain ticket={ticket} onPrendreEnCharge={onPrendreEnCharge} />);
    fireEvent.click(screen.getByRole("button", { name: /Prendre en charge/ }));
    expect(onPrendreEnCharge).toHaveBeenCalledWith("43");
  });

  it("annonce qu'il n'y a rien en attente, sans bouton, quand il n'y a pas de ticket", () => {
    render(<Prochain ticket={undefined} onPrendreEnCharge={vi.fn()} />);
    expect(screen.getByText(/Rien en attente/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Vérifier l'échec, puis implémenter**

```tsx
// src/components/Prochain.tsx
import type { Ticket } from "../domain/ticket";
import { libelleTransition } from "../domain/ticket";
import { numeroTicket, formaterDate } from "./format";

export function Prochain({
  ticket,
  onPrendreEnCharge,
}: {
  ticket: Ticket | undefined;
  onPrendreEnCharge: (id: string) => void;
}) {
  if (!ticket) {
    return (
      <section className="prochain" aria-live="polite">
        <p className="lib">Prochain à prendre en charge</p>
        <h2>Rien en attente. Toutes les demandes sont prises en charge.</h2>
      </section>
    );
  }
  return (
    <section className="prochain" aria-live="polite">
      <div>
        <p className="lib">Prochain à prendre en charge</p>
        <div className={"num " + ticket.priorite.toLowerCase()}>N° {numeroTicket(ticket.id)}</div>
        <h2>{ticket.titre}</h2>
        <p className="qui">
          Priorité {ticket.priorite.toLowerCase()}, demandé par {ticket.demandeur} le {formaterDate(ticket.creeLe)}
        </p>
      </div>
      <button
        type="button"
        className="bouton"
        onClick={() => onPrendreEnCharge(ticket.id)}
        aria-label={`${libelleTransition("Nouveau", "En cours")} : ${ticket.titre}`}
      >
        {libelleTransition("Nouveau", "En cours")}
      </button>
    </section>
  );
}
```

Run: `npx vitest run --no-file-parallelism` puis `npx tsc -b --noEmit`. Expected: PASS, 0 erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/format.ts src/components/format.test.ts src/components/Prochain.tsx src/components/Prochain.test.tsx
git commit -m "feat(ui): composant Prochain et utilitaires d'affichage"
```

---

## Task 3: `TicketList` en tickets à souche

**Files:**
- Modify: `src/components/TicketList.tsx`, `src/components/TicketList.test.tsx` (le contenu actuel des deux est remplacé)

**Interfaces:**
- Consumes: `Ticket`, `Statut`, `transitionsPossibles`, `libelleTransition` (domaine), `numeroTicket`, `formaterDate` (Task 2).
- Produces: `TicketList({ tickets, onChangerStatut, onSupprimer })`, mêmes props qu'avant : `tickets: Ticket[]`, `onChangerStatut: (id: string, s: Statut) => void`, `onSupprimer: (id: string) => void`.

Le sélecteur de statut est remplacé par des boutons à verbe, un par transition autorisée (les seules cibles possibles sont `Statut[]` obtenues avec `transitionsPossibles(t.statut).filter((s) => s !== t.statut)`).

Structure et classes à produire (référence : `2-guichet.html`) : `<ul className="souches">`, un `<li>` par ticket contenant `<article className="souche {haute|moyenne|basse|resolu}">` (la classe `resolu` remplace la classe de priorité quand le statut est `Résolu`), avec `div.tete` (`span.n` « N° {numeroTicket(id)} » et `span.tampon` avec le statut), puis `div.corps` (`h3` titre, `div.qui` « {demandeur}, {formaterDate(creeLe)} », le bouton de description s'il y en a une, `p.desc` quand elle est dépliée, `div.pr` « Priorité {priorite en minuscules} », `div.actions` avec les boutons de transition, le premier sans classe et les autres avec `autre`, puis `button.suppr`).

- [ ] **Step 1: Tests rouges** (remplacer tout le contenu de `TicketList.test.tsx`)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketList } from "./TicketList";
import type { Ticket } from "../domain/ticket";

const base = (over: Partial<Ticket> = {}): Ticket => ({
  id: "42", titre: "VPN inaccessible", description: "", statut: "Nouveau",
  priorite: "Haute", demandeur: "julien", creeLe: "2026-09-23T12:00:00Z", ...over,
});
const rendre = (t: Ticket, cbs: { changer?: () => void; suppr?: () => void } = {}) =>
  render(<TicketList tickets={[t]} onChangerStatut={cbs.changer ?? vi.fn()} onSupprimer={cbs.suppr ?? vi.fn()} />);

describe("TicketList", () => {
  it("n'offre depuis Nouveau que Prendre en charge (Nouveau vers Résolu interdit)", () => {
    rendre(base({ statut: "Nouveau" }));
    expect(screen.getByRole("button", { name: /Prendre en charge/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marquer résolu/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rouvrir/ })).not.toBeInTheDocument();
  });

  it("offre depuis En cours Marquer résolu et Renvoyer à Nouveau", () => {
    rendre(base({ statut: "En cours" }));
    expect(screen.getByRole("button", { name: /Marquer résolu/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renvoyer à Nouveau/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Prendre en charge/ })).not.toBeInTheDocument();
  });

  it("offre depuis Résolu uniquement Rouvrir", () => {
    rendre(base({ statut: "Résolu" }));
    expect(screen.getByRole("button", { name: /Rouvrir/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marquer résolu/ })).not.toBeInTheDocument();
  });

  it("affiche le numéro, le tampon de statut, le demandeur et la priorité en texte", () => {
    rendre(base({ statut: "En cours" }));
    expect(screen.getByText("N° 42")).toBeInTheDocument();
    expect(screen.getByText("En cours", { selector: ".tampon" })).toBeInTheDocument();
    expect(screen.getByText(/julien/)).toBeInTheDocument();
    expect(screen.getByText("Priorité haute")).toBeInTheDocument();
  });

  it("appelle onChangerStatut avec l'id et le statut visé", () => {
    const changer = vi.fn();
    rendre(base({ statut: "En cours" }), { changer });
    fireEvent.click(screen.getByRole("button", { name: /Marquer résolu/ }));
    expect(changer).toHaveBeenCalledWith("42", "Résolu");
  });

  it("appelle onSupprimer avec l'id", () => {
    const suppr = vi.fn();
    rendre(base(), { suppr });
    fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));
    expect(suppr).toHaveBeenCalledWith("42");
  });

  it("masque la description par défaut et la déplie au clic", () => {
    rendre(base({ description: "Coupure en plein test son." }));
    expect(screen.queryByText("Coupure en plein test son.")).not.toBeInTheDocument();
    const voir = screen.getByRole("button", { name: /Voir la description/ });
    expect(voir).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(voir);
    expect(screen.getByText("Coupure en plein test son.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Masquer la description/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("n'affiche aucun bouton de description quand elle est vide", () => {
    rendre(base({ description: "" }));
    expect(screen.queryByRole("button", { name: /description/ })).not.toBeInTheDocument();
  });

  it("affiche un message quand la liste est vide", () => {
    render(<TicketList tickets={[]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.getByText(/Aucune demande/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run --no-file-parallelism src/components/TicketList.test.tsx`
Expected: FAIL (l'ancien composant utilise un sélecteur, pas ces boutons).

- [ ] **Step 3: Implémenter**

`TicketList` reste un composant de présentation ; l'état « description dépliée » est local à un sous-composant `Souche` (un `useState` par ticket, clé `ticket.id`). Les boutons de transition et de suppression portent `aria-label` du type `` `${libelle} : ${titre}` `` pour rester distinguables quand plusieurs tickets sont affichés ; le bouton de description porte `aria-expanded` et `aria-controls` vers l'id du paragraphe. Message vide : `Aucune demande ici pour le moment.` dans `<p className="vide">`.

- [ ] **Step 4: Tout lancer**

Run: `npx vitest run --no-file-parallelism` puis `npx tsc -b --noEmit`. Expected: PASS, 0 erreur, sortie sans avertissement `act()`.

- [ ] **Step 5: Commit**

```bash
git add src/components/TicketList.tsx src/components/TicketList.test.tsx
git commit -m "feat(ui): TicketList en tickets à souche, transitions en boutons, description dépliable"
```

---

## Task 4: `TicketForm` (pastilles de priorité) et `StatusFilter` (compteurs)

**Files:**
- Modify: `src/components/TicketForm.tsx`, `src/components/TicketForm.test.tsx`, `src/components/StatusFilter.tsx`, `src/components/StatusFilter.test.tsx`

**Interfaces:**
- `TicketForm({ onCreer })` : props inchangées, `onCreer: (t: NouveauTicket) => Promise<boolean>`.
- `StatusFilter({ valeur, onChange, compteurs })` : nouveau prop `compteurs: Record<Statut | "Tous", number>`.

**TicketForm :** conserver tout le comportement actuel (validation par `validerTicket`, saisie conservée si `onCreer` renvoie `false`, bouton désactivé pendant l'envoi, réinitialisation seulement sur `true`). Changements : `<form className="bloc">` avec `h2` « Nouvelle demande » ; la priorité devient un groupe `role="radiogroup"` `aria-label="Priorité"` de trois radios `Basse`, `Moyenne` (cochée par défaut), `Haute`, chacun dans `label.b|.m|.h` avec un `span` visible (le `input` est masqué visuellement mais reste focalisable et lisible par les lecteurs d'écran) ; bouton `button.valider` « Créer » ; erreurs dans des `p.err`. Mettre à jour les tests existants : la priorité se saisit par `fireEvent.click(screen.getByLabelText("Haute"))`, la réinitialisation vérifie que `getByLabelText("Moyenne")` est coché. Ajouter un test : le groupe « Priorité » contient exactement trois radios.

**StatusFilter :** chaque bouton affiche le libellé puis le compteur dans un `<b>` ; `aria-pressed` conservé ; conteneur `div.filtres` `role="group"` `aria-label="Filtrer par statut"` (remplace l'ancien `role="tablist"`, incohérent avec `aria-pressed`). Mettre à jour les tests : `getByRole("button", { name: /^En cours/ })` a `aria-pressed="true"` quand `valeur="En cours"` ; le compteur est visible (`compteurs={{ Tous: 8, Nouveau: 3, "En cours": 3, "Résolu": 2 }}` affiche « 3 » dans le bouton Nouveau) ; le clic appelle `onChange("Résolu")`.

- [ ] **Step 1 à 3 : tests rouges, échec constaté, implémentation** (même cycle RED/GREEN que les tâches précédentes, une fois pour `StatusFilter`, une fois pour `TicketForm`)
- [ ] **Step 4: Tout lancer** : `npx vitest run --no-file-parallelism`, `npx tsc -b --noEmit` (si `App.tsx` ne compile plus à cause du nouveau prop `compteurs`, c'est attendu et corrigé au Task 5 : dans ce cas ne lancer que les tests).
- [ ] **Step 5: Commit**

```bash
git add src/components/TicketForm.tsx src/components/TicketForm.test.tsx src/components/StatusFilter.tsx src/components/StatusFilter.test.tsx
git commit -m "feat(ui): formulaire à pastilles de priorité et filtre à compteurs"
```

---

## Task 5: Composition de `App`, polices embarquées et feuille de style

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `package.json`, `package-lock.json`

- [ ] **Step 1: Polices embarquées**

Run: `npm install @fontsource-variable/unbounded @fontsource-variable/hanken-grotesk`. Dans `src/main.tsx`, importer `@fontsource-variable/unbounded` et `@fontsource-variable/hanken-grotesk` avant `./styles.css`. Aucune URL vers Google Fonts nulle part. Vérifier que le paquet exporte bien le CSS attendu (chemin d'import par défaut du paquet) ; sinon utiliser le fichier `index.css` du paquet.

- [ ] **Step 2: `App.tsx`**

Composition : `<div className="page">`, `h1` « Guichet des demandes aMP », `<section className="affichage">` contenant `<Prochain ticket={prochainATraiter(tickets)} onPrendreEnCharge={(id) => changerStatut(id, "En cours")} />` et `<TicketForm onCreer={creer} />`, puis `<StatusFilter valeur={filtre} onChange={setFiltre} compteurs={{ Tous: tickets.length, ...compter(tickets) }} />`, la bannière d'erreur `erreur` conservée (classe `banniere err`), l'état de chargement conservé, puis `<TicketList ... />` avec `filtrerParStatut(tickets, filtre)`. Les données de démonstration en mémoire reçoivent des identifiants numériques (`"41"`, `"42"`) au lieu de `d1`, `d2`, et au moins un ticket `Nouveau` et un `En cours`. Supprimer l'ancien bloc de statistiques textuel (les compteurs sont dans le filtre). Ne pas changer la sélection du repository ni l'usage de `useTickets`.

- [ ] **Step 2 bis:** l'ancienne classe `.colonnes`, `.carte`, `.pill` et les autres sélecteurs de l'ancienne feuille disparaissent avec elle.

- [ ] **Step 3: `styles.css`**

Réécrire entièrement à partir du `<style>` de `docs/design/mockups/2-guichet.html` : mêmes variables (`--comptoir`, `--comptoir-fonce`, `--texte`, `--encre`, `--haute`, `--moyenne`, `--basse`, `--resolu`, `--blanc`), mêmes classes (`.page`, `.affichage`, `.prochain`, `.num`, `.bloc`, `.prios` et `.b|.m|.h`, `.valider`, `.err`, `.filtres`, `.souches`, `.souche`, `.tete`, `.n`, `.tampon`, `.corps`, `.desc`, `.pr`, `.actions`, `.autre`, `.suppr`, `.vide`), avec les polices `"Unbounded Variable"` et `"Hanken Grotesk Variable"` (noms de famille exacts fournis par les paquets `@fontsource-variable`, à vérifier dans leurs CSS) suivies de `system-ui, sans-serif`. Ajouter : `.banniere` et `.banniere.err` (bannière d'erreur lisible sur fond sombre), le style du bouton de description (lien souligné, cible d'au moins 44 px de haut sur mobile), les états `:disabled` du bouton `Créer`, `:focus-visible` visible partout, `@media (max-width: 860px)` une colonne, `@media (prefers-reduced-motion: reduce)` sans animation. Le résultat doit être visuellement fidèle à la maquette.

- [ ] **Step 4: Vérifications**

Run : `npx tsc -b --noEmit` (0 erreur), `npx vitest run --no-file-parallelism` (tout vert, sortie propre), `npm run build` (réussit). Puis `git status --porcelain` ne montre aucun fichier inattendu.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/styles.css package.json package-lock.json
git commit -m "feat(ui): interface Le guichet, polices embarquées et nouvelle feuille de style"
```
