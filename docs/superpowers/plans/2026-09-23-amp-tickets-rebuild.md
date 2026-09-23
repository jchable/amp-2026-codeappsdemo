# aMP Tickets — Rebuild complet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruire entièrement l'application aMP Tickets (React/TS, Power Apps Code App) en TDD strict à partir de `docs/spec.md`, du domaine pur jusqu'au branchement SharePoint réel et au déploiement.

**Architecture:** Dépendances à sens unique : `components/` + `hooks/` → `data/TicketRepository` (contrat) → `domain/` (pur). Deux implémentations du contrat : `InMemoryTicketRepository` (défaut, tests, dev local) et `SharePointTicketRepository` (adaptateur vers `generated/`, activé par `VITE_USE_SHAREPOINT=true`). Aucun composant ni hook n'importe `generated/` ou le SDK directement ; seul `sharePointTicketRepository.ts` y touche.

**Tech Stack:** Vite 5, React 18, TypeScript 5 strict (`noUnusedLocals`, `noUnusedParameters`), `@microsoft/power-apps` 1.4.0 (API `getContext()` depuis `@microsoft/power-apps/app`), Vitest 2 + Testing Library (environnement `jsdom`, `globals: true`), connecteur `shared_sharepointonline`, `pac code` CLI.

**Spec:** [`docs/spec.md`](../../spec.md) — voir aussi [`CLAUDE.md`](../../../CLAUDE.md) (constitution du projet, règles non négociables, pièges connus).

## Global Constraints

- TypeScript 5 `strict` + `noUnusedLocals` + `noUnusedParameters` ; `npm run build` (`tsc -b && vite build`) doit passer sans erreur ni warning.
- SDK `@microsoft/power-apps` 1.4.0 ; seule API utilisée : `getContext()` depuis `@microsoft/power-apps/app`. `initialize()` n'existe plus en v1 : ne jamais la réintroduire.
- `src/domain/` reste pur : aucun import React ni SDK, aucun `Date`/`Math.random`/`crypto` direct — les dépendances impures sont injectées.
- Une seule porte vers les données : `src/data/ticketRepository.ts` (interface `TicketRepository`). Seul `sharePointTicketRepository.ts` importe `generated/`.
- Le SDK n'est jamais appelé dans les tests ; les tests portent sur le domaine et `InMemoryTicketRepository` uniquement (pas de mock du SDK).
- Noms en français métier (`titre`, `demandeur`, `changerStatut`) ; termes techniques anglais tolérés (`useTickets`, `Repository`).
- Port 3000 fixé : `vite.config.ts` a `strictPort: true` ; `power.config.json` (`localAppUrl`, une fois renseigné par `pac code init`) doit coïncider.
- Aucun secret dans le code ; `.env.local` reste ignoré par git ; `power.config.json` ne contient que des identifiants non sensibles.
- YAGNI : pas de pièces jointes, notifications, droits fins, multi-listes.
- Le mode SharePoint ne fonctionne que via `npm run power:run` (hôte Power Apps local) ; `npm run dev` seul n'est valide qu'en mode mémoire.
- Colonnes Choix SharePoint (`Statut`, `Priorite`) envoyées comme `{ Value: "..." }`, jamais une chaîne brute ; propriétés suffixées `#Id` du modèle généré exclues des payloads `create`/`update` ; `supprimer(id)` envoie l'ID numérique SharePoint sous forme de chaîne.

## Review Focus

- Suppression d'un ticket dont le statut n'est pas `Nouveau` (`En cours` ou `Résolu`) : doit réussir — c'est exactement le trou (CRUD incomplet) qui a motivé la règle 6 de la spec ; sans test dédié, la régression est invisible. → Testé dans Task 4.
- Titre ou demandeur composé uniquement d'espaces : doit être refusé comme un champ vide, le trim s'applique avant la validation, pas seulement au stockage. → Testé dans Task 1.
- Menu de changement de statut dans `TicketList` : ne doit proposer que les transitions autorisées depuis le statut courant (empêcher l'utilisateur de choisir `Résolu` depuis `Nouveau` puis de subir une erreur au submit). → Testé dans Task 6.
- Titre de exactement 120 caractères : accepté ; 121 caractères : refusé (limite exacte de la règle 1). → Testé dans Task 1.
- Suppression d'un ticket avec un id inconnu : ne doit pas lever d'exception (idempotent), contrairement à `changerStatut` qui lève explicitement pour un id inconnu — la divergence est un choix documenté et testé, pas un oubli. → Testé dans Task 4.

---

## Task 1: Fondations de test + types du domaine + validation + création (règles 1–2)

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/domain/ticket.ts`
- Test: `src/domain/ticket.test.ts`

**Interfaces:**
- Produces: `type Statut = "Nouveau" | "En cours" | "Résolu"`, `type Priorite = "Basse" | "Moyenne" | "Haute"`, `interface Ticket { id: string; titre: string; description: string; statut: Statut; priorite: Priorite; demandeur: string; creeLe: string }`, `interface NouveauTicket { titre: string; description?: string; priorite?: Priorite; demandeur: string }`, `PRIORITES: Priorite[]` (réutilisé par `TicketForm` en Task 6 et par le mapping SharePoint en Task 10, au lieu d'être redéfini localement), `validerTicket(input: NouveauTicket): string[]`, `creerTicket(input: NouveauTicket, deps: { id: () => string; maintenant: () => Date }): Ticket`.

- [ ] **Step 1: Créer le setup de test (requis par `vitest.config.ts` déjà présent, sinon aucun test ne peut s'exécuter)**

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 2: Écrire le test rouge pour `validerTicket` (règle 1, avec les cas limites)**

```typescript
// src/domain/ticket.test.ts
import { describe, it, expect } from "vitest";
import { validerTicket, type NouveauTicket } from "./ticket";

describe("validerTicket", () => {
  it("exige un titre", () => {
    expect(validerTicket({ titre: "", demandeur: "j" })).toContain("Le titre est obligatoire.");
  });
  it("exige un demandeur", () => {
    expect(validerTicket({ titre: "Panne", demandeur: "" })).toContain("Le demandeur est obligatoire.");
  });
  it("refuse un titre composé uniquement d'espaces", () => {
    expect(validerTicket({ titre: "   ", demandeur: "julien" })).toContain("Le titre est obligatoire.");
  });
  it("refuse un demandeur composé uniquement d'espaces", () => {
    expect(validerTicket({ titre: "Panne", demandeur: "   " })).toContain("Le demandeur est obligatoire.");
  });
  it("accepte un titre de exactement 120 caractères", () => {
    const titre = "x".repeat(120);
    expect(validerTicket({ titre, demandeur: "julien" })).toEqual([]);
  });
  it("refuse un titre de 121 caractères", () => {
    const titre = "x".repeat(121);
    expect(validerTicket({ titre, demandeur: "julien" })).toContain("Le titre dépasse 120 caractères.");
  });
  it("accepte un ticket correct", () => {
    const input: NouveauTicket = { titre: "Panne imprimante", demandeur: "julien" };
    expect(validerTicket(input)).toEqual([]);
  });
});
```

- [ ] **Step 3: Lancer les tests, vérifier l'échec**

Run: `npm run test:watch -- ticket.test.ts` (ou `npx vitest run src/domain/ticket.test.ts`)
Expected: FAIL — `Cannot find module './ticket'` (le fichier `ticket.ts` n'existe pas encore).

- [ ] **Step 4: Implémenter les types et `validerTicket`**

```typescript
// src/domain/ticket.ts
// Logique métier PURE : aucun import React, aucun SDK. 100 % testable.

export type Statut = "Nouveau" | "En cours" | "Résolu";
export type Priorite = "Basse" | "Moyenne" | "Haute";

export interface Ticket {
  id: string;
  titre: string;
  description: string;
  statut: Statut;
  priorite: Priorite;
  demandeur: string;
  creeLe: string; // ISO
}

export interface NouveauTicket {
  titre: string;
  description?: string;
  priorite?: Priorite;
  demandeur: string;
}

export const STATUTS: Statut[] = ["Nouveau", "En cours", "Résolu"];
export const PRIORITES: Priorite[] = ["Basse", "Moyenne", "Haute"];

/** Valide un nouveau ticket. Renvoie la liste des erreurs (vide = valide). */
export function validerTicket(input: NouveauTicket): string[] {
  const erreurs: string[] = [];
  if (!input.titre || input.titre.trim().length === 0) erreurs.push("Le titre est obligatoire.");
  if (input.titre && input.titre.trim().length > 120) erreurs.push("Le titre dépasse 120 caractères.");
  if (!input.demandeur || input.demandeur.trim().length === 0) erreurs.push("Le demandeur est obligatoire.");
  return erreurs;
}
```

- [ ] **Step 5: Lancer les tests, vérifier le succès**

Run: `npx vitest run src/domain/ticket.test.ts`
Expected: PASS (7 tests verts).

- [ ] **Step 6: Écrire le test rouge pour `creerTicket` (règle 2)**

```typescript
// à ajouter dans src/domain/ticket.test.ts
import { creerTicket } from "./ticket";

const deps = { id: () => "t1", maintenant: () => new Date("2026-09-24T10:00:00Z") };

describe("creerTicket", () => {
  it("met le statut à Nouveau par défaut", () => {
    expect(creerTicket({ titre: "Panne", demandeur: "julien" }, deps).statut).toBe("Nouveau");
  });
  it("priorité Moyenne par défaut et titre trimé", () => {
    const t = creerTicket({ titre: "  Panne  ", demandeur: "julien" }, deps);
    expect(t.priorite).toBe("Moyenne");
    expect(t.titre).toBe("Panne");
  });
  it("refuse un ticket invalide", () => {
    expect(() => creerTicket({ titre: "", demandeur: "" }, deps)).toThrow();
  });
});
```

- [ ] **Step 7: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/domain/ticket.test.ts`
Expected: FAIL — `creerTicket is not exported` / `is not a function`.

- [ ] **Step 8: Implémenter `creerTicket`**

```typescript
// à ajouter dans src/domain/ticket.ts, après validerTicket

/** Crée un ticket valide. Statut par défaut = Nouveau. Lève si invalide. */
export function creerTicket(
  input: NouveauTicket,
  deps: { id: () => string; maintenant: () => Date }
): Ticket {
  const erreurs = validerTicket(input);
  if (erreurs.length > 0) throw new Error(erreurs.join(" "));
  return {
    id: deps.id(),
    titre: input.titre.trim(),
    description: (input.description ?? "").trim(),
    statut: "Nouveau",
    priorite: input.priorite ?? "Moyenne",
    demandeur: input.demandeur.trim(),
    creeLe: deps.maintenant().toISOString(),
  };
}
```

- [ ] **Step 9: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (10 tests verts).

- [ ] **Step 10: Commit**

```bash
git add src/test/setup.ts src/domain/ticket.ts src/domain/ticket.test.ts
git commit -m "feat(domain): validation et création de ticket (règles 1-2)"
```

---

## Task 2: Machine à états — transitions de statut (règle 3)

**Files:**
- Modify: `src/domain/ticket.ts` (ajout)
- Test: `src/domain/ticket.test.ts` (ajout)

**Interfaces:**
- Consumes: `Ticket`, `Statut` (Task 1).
- Produces: `transitionAutorisee(de: Statut, vers: Statut): boolean`, `changerStatut(ticket: Ticket, vers: Statut): Ticket`, `transitionsPossibles(statut: Statut): Statut[]` (utilisé par `TicketList` en Task 6 pour filtrer le sélecteur de statut).

- [ ] **Step 1: Écrire les tests rouges**

```typescript
// à ajouter dans src/domain/ticket.test.ts
import { changerStatut, transitionAutorisee, transitionsPossibles } from "./ticket";

const base = (over: Partial<Ticket> = {}): Ticket => ({
  id: "x", titre: "T", description: "", statut: "Nouveau",
  priorite: "Moyenne", demandeur: "julien", creeLe: "2026-09-24T10:00:00Z", ...over,
});

describe("changerStatut / transitionAutorisee / transitionsPossibles", () => {
  it("autorise Nouveau → En cours", () => {
    expect(changerStatut(base(), "En cours").statut).toBe("En cours");
  });
  it("interdit Nouveau → Résolu", () => {
    expect(() => changerStatut(base(), "Résolu")).toThrow();
  });
  it("permet la réouverture Résolu → En cours", () => {
    expect(transitionAutorisee("Résolu", "En cours")).toBe(true);
  });
  it("ne change rien (même référence) si le statut cible est déjà le statut courant", () => {
    const t = base({ statut: "En cours" });
    expect(changerStatut(t, "En cours")).toBe(t);
  });
  it("transitionsPossibles depuis Nouveau : lui-même + En cours", () => {
    expect(transitionsPossibles("Nouveau")).toEqual(["Nouveau", "En cours"]);
  });
  it("transitionsPossibles depuis En cours : lui-même + Résolu + Nouveau", () => {
    expect(transitionsPossibles("En cours")).toEqual(["En cours", "Résolu", "Nouveau"]);
  });
  it("transitionsPossibles depuis Résolu : lui-même + En cours (réouverture)", () => {
    expect(transitionsPossibles("Résolu")).toEqual(["Résolu", "En cours"]);
  });
});
```

Need `Ticket` type imported at top of test file — ajouter `type Ticket` à l'import existant de `"./ticket"` si absent.

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/domain/ticket.test.ts`
Expected: FAIL — `changerStatut`/`transitionAutorisee`/`transitionsPossibles` non exportés.

- [ ] **Step 3: Implémenter**

```typescript
// à ajouter dans src/domain/ticket.ts

const TRANSITIONS: Record<Statut, Statut[]> = {
  Nouveau: ["En cours"],
  "En cours": ["Résolu", "Nouveau"],
  Résolu: ["En cours"], // réouverture possible
};

export function transitionAutorisee(de: Statut, vers: Statut): boolean {
  return TRANSITIONS[de].includes(vers);
}

/** Change le statut si la transition est autorisée, sinon lève. */
export function changerStatut(ticket: Ticket, vers: Statut): Ticket {
  if (ticket.statut === vers) return ticket;
  if (!transitionAutorisee(ticket.statut, vers)) {
    throw new Error(`Transition interdite : ${ticket.statut} → ${vers}.`);
  }
  return { ...ticket, statut: vers };
}

/** Statuts à proposer dans un sélecteur : le statut courant + les transitions autorisées. */
export function transitionsPossibles(statut: Statut): Statut[] {
  return [statut, ...TRANSITIONS[statut]];
}
```

- [ ] **Step 4: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (17 tests verts).

- [ ] **Step 5: Commit**

```bash
git add src/domain/ticket.ts src/domain/ticket.test.ts
git commit -m "feat(domain): machine à états des transitions de statut (règle 3)"
```

---

## Task 3: Opérations de liste — filtre, tri, comptage (règles 4–5)

**Files:**
- Modify: `src/domain/ticket.ts` (ajout)
- Test: `src/domain/ticket.test.ts` (ajout)

**Interfaces:**
- Consumes: `Ticket`, `Statut` (Task 1).
- Produces: `filtrerParStatut(tickets: Ticket[], statut: Statut | "Tous"): Ticket[]`, `trierParPriorite(tickets: Ticket[]): Ticket[]`, `compter(tickets: Ticket[]): Record<Statut, number>`.

- [ ] **Step 1: Écrire les tests rouges**

```typescript
// à ajouter dans src/domain/ticket.test.ts
import { filtrerParStatut, trierParPriorite, compter } from "./ticket";

describe("filtrerParStatut / trierParPriorite / compter", () => {
  const tickets = [
    base({ id: "a", priorite: "Basse", statut: "Nouveau" }),
    base({ id: "b", priorite: "Haute", statut: "En cours" }),
    base({ id: "c", priorite: "Moyenne", statut: "Nouveau" }),
  ];
  it("filtre par statut", () => {
    expect(filtrerParStatut(tickets, "Nouveau").map((t) => t.id)).toEqual(["a", "c"]);
  });
  it("Tous ne filtre rien", () => {
    expect(filtrerParStatut(tickets, "Tous")).toHaveLength(3);
  });
  it("trie par priorité décroissante", () => {
    expect(trierParPriorite(tickets).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("compte par statut", () => {
    expect(compter(tickets)).toEqual({ Nouveau: 2, "En cours": 1, "Résolu": 0 });
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/domain/ticket.test.ts`
Expected: FAIL — `filtrerParStatut`/`trierParPriorite`/`compter` non exportés.

- [ ] **Step 3: Implémenter**

```typescript
// à ajouter dans src/domain/ticket.ts
const PRIORITE_ORDRE: Record<Priorite, number> = { Haute: 0, Moyenne: 1, Basse: 2 };

export function filtrerParStatut(tickets: Ticket[], statut: Statut | "Tous"): Ticket[] {
  return statut === "Tous" ? tickets : tickets.filter((t) => t.statut === statut);
}

/** Tri : priorité décroissante puis date de création (plus récent d'abord). */
export function trierParPriorite(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(
    (a, b) =>
      PRIORITE_ORDRE[a.priorite] - PRIORITE_ORDRE[b.priorite] ||
      b.creeLe.localeCompare(a.creeLe)
  );
}

export function compter(tickets: Ticket[]): Record<Statut, number> {
  return {
    Nouveau: filtrerParStatut(tickets, "Nouveau").length,
    "En cours": filtrerParStatut(tickets, "En cours").length,
    Résolu: filtrerParStatut(tickets, "Résolu").length,
  };
}
```

- [ ] **Step 4: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (21 tests verts). Le domaine est complet : rules 1–5 couvertes.

- [ ] **Step 5: Commit**

```bash
git add src/domain/ticket.ts src/domain/ticket.test.ts
git commit -m "feat(domain): filtre, tri et comptage des tickets (règles 4-5)"
```

---

## Task 4: Contrat de données + implémentation mémoire (CRUD complet, règle 6)

**Files:**
- Create: `src/data/ticketRepository.ts`
- Create: `src/data/inMemoryTicketRepository.ts`
- Test: `src/data/inMemoryTicketRepository.test.ts`

**Interfaces:**
- Consumes: `Ticket`, `NouveauTicket`, `Statut`, `creerTicket`, `changerStatut` (Tasks 1–2).
- Produces: `interface TicketRepository { lister(): Promise<Ticket[]>; creer(input: NouveauTicket): Promise<Ticket>; changerStatut(id: string, statut: Statut): Promise<Ticket>; supprimer(id: string): Promise<void>; }`, `class InMemoryTicketRepository implements TicketRepository` avec constructeur `(seed: Ticket[] = [])`.

- [ ] **Step 1: Créer le contrat (pas de logique, donc pas de cycle rouge/vert — juste un type)**

```typescript
// src/data/ticketRepository.ts
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";

/** Contrat d'accès aux données. Les composants ne dépendent QUE de ceci. */
export interface TicketRepository {
  lister(): Promise<Ticket[]>;
  creer(input: NouveauTicket): Promise<Ticket>;
  changerStatut(id: string, statut: Statut): Promise<Ticket>;
  supprimer(id: string): Promise<void>;
}
```

- [ ] **Step 2: Écrire les tests rouges pour l'implémentation mémoire**

```typescript
// src/data/inMemoryTicketRepository.test.ts
import { describe, it, expect } from "vitest";
import { InMemoryTicketRepository } from "./inMemoryTicketRepository";

describe("InMemoryTicketRepository", () => {
  it("crée puis liste un ticket", async () => {
    const repo = new InMemoryTicketRepository();
    await repo.creer({ titre: "Panne VPN", demandeur: "julien", priorite: "Haute" });
    const tickets = await repo.lister();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].statut).toBe("Nouveau");
  });

  it("change le statut d'un ticket existant", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "Panne VPN", demandeur: "julien" });
    const maj = await repo.changerStatut(t.id, "En cours");
    expect(maj.statut).toBe("En cours");
  });

  it("changerStatut lève pour un id inconnu", async () => {
    const repo = new InMemoryTicketRepository();
    await expect(repo.changerStatut("inconnu", "En cours")).rejects.toThrow("Ticket introuvable");
  });

  it("supprime un ticket au statut Nouveau", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprime un ticket même s'il est En cours (règle 6)", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.changerStatut(t.id, "En cours");
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprime un ticket même s'il est Résolu (règle 6)", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.changerStatut(t.id, "En cours");
    await repo.changerStatut(t.id, "Résolu");
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprimer un id inconnu ne lève pas et laisse la liste inchangée", async () => {
    const repo = new InMemoryTicketRepository();
    await repo.creer({ titre: "X", demandeur: "j" });
    await expect(repo.supprimer("inconnu")).resolves.toBeUndefined();
    expect(await repo.lister()).toHaveLength(1);
  });

  it("évite les collisions d'id quand le seed contient déjà des ids mem-N", async () => {
    const seed: Ticket[] = [
      {
        id: "mem-1",
        titre: "Existant",
        description: "",
        statut: "Nouveau",
        priorite: "Moyenne",
        demandeur: "j",
        creeLe: "2026-09-23T08:00:00Z",
      },
    ];
    const repo = new InMemoryTicketRepository(seed);
    const nouveau = await repo.creer({ titre: "Nouveau", demandeur: "j" });
    expect(nouveau.id).not.toBe("mem-1");
    expect(nouveau.id).toBe("mem-2");
  });
});
```

Note : ce dernier test importe aussi `type Ticket` depuis `"../domain/ticket"` — ajouter cet import en tête du fichier de test.

- [ ] **Step 3: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/data/inMemoryTicketRepository.test.ts`
Expected: FAIL — `Cannot find module './inMemoryTicketRepository'`.

- [ ] **Step 4: Implémenter**

```typescript
// src/data/inMemoryTicketRepository.ts
import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket, changerStatut } from "../domain/ticket";

/** Impl mémoire : sert aux tests et au dev local sans connexion SharePoint. */
export class InMemoryTicketRepository implements TicketRepository {
  private tickets: Ticket[] = [];
  private seq: number;

  constructor(seed: Ticket[] = []) {
    this.tickets = [...seed];
    // Le compteur démarre après le plus grand id `mem-N` déjà présent dans le seed,
    // pour éviter toute collision si un appelant seed avec ce même format d'id.
    this.seq = seed.reduce((max, t) => {
      const m = /^mem-(\d+)$/.exec(t.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
  }

  async lister(): Promise<Ticket[]> { return [...this.tickets]; }

  async creer(input: NouveauTicket): Promise<Ticket> {
    const t = creerTicket(input, { id: () => `mem-${++this.seq}`, maintenant: () => new Date() });
    this.tickets.push(t);
    return t;
  }

  async changerStatut(id: string, statut: Statut): Promise<Ticket> {
    const i = this.tickets.findIndex((t) => t.id === id);
    if (i < 0) throw new Error(`Ticket introuvable : ${id}`);
    this.tickets[i] = changerStatut(this.tickets[i], statut);
    return this.tickets[i];
  }

  /** Suppression toujours autorisée (règle 6). Idempotent : id inconnu = no-op. */
  async supprimer(id: string): Promise<void> {
    this.tickets = this.tickets.filter((t) => t.id !== id);
  }
}
```

- [ ] **Step 5: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (29 tests verts).

- [ ] **Step 6: Commit**

```bash
git add src/data/ticketRepository.ts src/data/inMemoryTicketRepository.ts src/data/inMemoryTicketRepository.test.ts
git commit -m "feat(data): contrat TicketRepository + implémentation mémoire (CRUD, règle 6)"
```

---

## Task 5: Hook `useTickets` (orchestration état, rechargement, erreurs de mutation)

**Files:**
- Create: `src/hooks/useTickets.ts`
- Test: `src/hooks/useTickets.test.ts`

**Interfaces:**
- Consumes: `TicketRepository` (Task 4), `Ticket`, `NouveauTicket`, `Statut`, `trierParPriorite` (Tasks 1–3).
- Produces: `useTickets(repo: TicketRepository): { tickets: Ticket[]; chargement: boolean; erreur: string | null; creer(input: NouveauTicket): Promise<void>; changerStatut(id: string, s: Statut): Promise<void>; supprimer(id: string): Promise<void>; recharger(): Promise<void>; }`.

Ce hook n'importe et n'appelle jamais le SDK directement (il ne dépend que de l'interface `TicketRepository`) : il est donc testable avec `InMemoryTicketRepository` et de simples doublures TypeScript, sans violer la règle 2 (« le SDK n'est jamais appelé dans les tests »). Point corrigé après revue : les trois mutations (`creer`, `changerStatut`, `supprimer`) doivent capturer leurs erreurs dans `erreur`, exactement comme `recharger` le fait déjà pour le chargement — sinon un échec de mutation (ex. écriture SharePoint refusée) ne remonte jamais à l'utilisateur.

- [ ] **Step 1: Écrire les tests rouges**

```typescript
// src/hooks/useTickets.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTickets } from "./useTickets";
import { InMemoryTicketRepository } from "../data/inMemoryTicketRepository";
import type { TicketRepository } from "../data/ticketRepository";

describe("useTickets", () => {
  it("charge la liste au montage puis recharge après création", async () => {
    const repo = new InMemoryTicketRepository();
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(result.current.tickets).toHaveLength(0);

    await act(async () => {
      await result.current.creer({ titre: "Panne VPN", demandeur: "julien" });
    });

    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.erreur).toBeNull();
  });

  it("recharge après changement de statut et après suppression", async () => {
    const repo = new InMemoryTicketRepository();
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.creer({ titre: "X", demandeur: "j" });
    });
    const id = result.current.tickets[0].id;

    await act(async () => {
      await result.current.changerStatut(id, "En cours");
    });
    expect(result.current.tickets[0].statut).toBe("En cours");

    await act(async () => {
      await result.current.supprimer(id);
    });
    expect(result.current.tickets).toHaveLength(0);
  });

  it("expose une erreur si le chargement initial échoue", async () => {
    const repoEnPanne: TicketRepository = {
      lister: async () => {
        throw new Error("réseau indisponible");
      },
      creer: async () => {
        throw new Error("non utilisé");
      },
      changerStatut: async () => {
        throw new Error("non utilisé");
      },
      supprimer: async () => {
        throw new Error("non utilisé");
      },
    };
    const { result } = renderHook(() => useTickets(repoEnPanne));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(result.current.erreur).toBe("réseau indisponible");
  });

  it("expose une erreur si une mutation (création) échoue, sans lever pour l'appelant", async () => {
    const repoMutationEnPanne: TicketRepository = {
      lister: async () => [],
      creer: async () => {
        throw new Error("création refusée");
      },
      changerStatut: async () => {
        throw new Error("non utilisé");
      },
      supprimer: async () => {
        throw new Error("non utilisé");
      },
    };
    const { result } = renderHook(() => useTickets(repoMutationEnPanne));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.creer({ titre: "X", demandeur: "j" });
    });

    expect(result.current.erreur).toBe("création refusée");
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/hooks/useTickets.test.ts`
Expected: FAIL — `Cannot find module './useTickets'`.

- [ ] **Step 3: Implémenter**

```typescript
// src/hooks/useTickets.ts
import { useCallback, useEffect, useState } from "react";
import type { TicketRepository } from "../data/ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { trierParPriorite } from "../domain/ticket";

export function useTickets(repo: TicketRepository) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setTickets(trierParPriorite(await repo.lister()));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setChargement(false);
    }
  }, [repo]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  // Chaque mutation capture ses propres erreurs (écriture refusée, réseau, etc.) :
  // sans ce try/catch, un échec de mutation resterait une promesse rejetée invisible
  // pour l'utilisateur (bug trouvé en revue avant implémentation).
  const creer = useCallback(
    async (input: NouveauTicket) => {
      try {
        await repo.creer(input);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  const changerStatut = useCallback(
    async (id: string, s: Statut) => {
      try {
        await repo.changerStatut(id, s);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  const supprimer = useCallback(
    async (id: string) => {
      try {
        await repo.supprimer(id);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  return { tickets, chargement, erreur, creer, changerStatut, supprimer, recharger };
}
```

- [ ] **Step 4: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (les 4 nouveaux tests de `useTickets.test.ts` passent, plus tous les tests précédents).

- [ ] **Step 5: Vérifier que le typecheck ne casse rien**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur liée à `useTickets.ts` (les composants qui le consomment n'existent pas encore — Task 6/7 les créeront ; si `tsc -b` échoue à cause de fichiers manquants ailleurs, ignorer pour l'instant et revérifier en Task 8).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTickets.ts src/hooks/useTickets.test.ts
git commit -m "feat(hooks): useTickets orchestre état, rechargement, et erreurs de mutation"
```

---

## Task 6: Composants UI — StatusFilter, TicketForm, TicketList

**Files:**
- Create: `src/components/StatusFilter.tsx`
- Test: `src/components/StatusFilter.test.tsx`
- Create: `src/components/TicketForm.tsx`
- Test: `src/components/TicketForm.test.tsx`
- Create: `src/components/TicketList.tsx`
- Test: `src/components/TicketList.test.tsx`

**Interfaces:**
- Consumes: `Statut`, `STATUTS`, `Priorite`, `PRIORITES`, `NouveauTicket`, `Ticket`, `validerTicket`, `transitionsPossibles` (Tasks 1–3).
- Produces: `StatusFilter({ valeur, onChange })`, `TicketForm({ onCreer })`, `TicketList({ tickets, onChangerStatut, onSupprimer })`.

Point corrigé après revue : `TicketForm` n'avait aucun champ pour `description`, pourtant définie dans `docs/spec.md` (modèle de données) et dans `NouveauTicket` — elle restait toujours vide en pratique. Un textarea optionnel est ajouté. `TicketForm` importe désormais `PRIORITES` depuis `../domain/ticket` (Task 1) au lieu de le redéfinir localement.

- [ ] **Step 1: Écrire les tests rouges pour `StatusFilter`**

```tsx
// src/components/StatusFilter.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusFilter } from "./StatusFilter";

describe("StatusFilter", () => {
  it("affiche Tous + les 3 statuts, avec la valeur active marquée", () => {
    render(<StatusFilter valeur="En cours" onChange={vi.fn()} />);
    const actif = screen.getByRole("button", { name: "En cours" });
    expect(actif).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
  });

  it("appelle onChange avec le statut cliqué", () => {
    const onChange = vi.fn();
    render(<StatusFilter valeur="Tous" onChange={onChange} />);
    screen.getByRole("button", { name: "Résolu" }).click();
    expect(onChange).toHaveBeenCalledWith("Résolu");
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npx vitest run src/components/StatusFilter.test.tsx`
Expected: FAIL — `Cannot find module './StatusFilter'`.

- [ ] **Step 3: Implémenter `StatusFilter`**

```tsx
// src/components/StatusFilter.tsx
import type { Statut } from "../domain/ticket";
import { STATUTS } from "../domain/ticket";

export function StatusFilter({
  valeur,
  onChange,
}: {
  valeur: Statut | "Tous";
  onChange: (s: Statut | "Tous") => void;
}) {
  const options: (Statut | "Tous")[] = ["Tous", ...STATUTS];
  return (
    <div className="filtre" role="tablist" aria-label="Filtrer par statut">
      {options.map((o) => (
        <button
          key={o}
          className={"pill" + (o === valeur ? " actif" : "")}
          onClick={() => onChange(o)}
          aria-pressed={o === valeur}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `npx vitest run src/components/StatusFilter.test.tsx`
Expected: PASS (2 tests verts).

- [ ] **Step 5: Écrire les tests rouges pour `TicketForm`**

```tsx
// src/components/TicketForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketForm } from "./TicketForm";

describe("TicketForm", () => {
  it("affiche les erreurs et n'appelle pas onCreer si le titre est vide", () => {
    const onCreer = vi.fn();
    render(<TicketForm onCreer={onCreer} />);
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    expect(screen.getByText("Le titre est obligatoire.")).toBeInTheDocument();
    expect(onCreer).not.toHaveBeenCalled();
  });

  it("appelle onCreer avec titre, demandeur, priorité et description, puis réinitialise le formulaire", async () => {
    const onCreer = vi.fn().mockResolvedValue(undefined);
    render(<TicketForm onCreer={onCreer} />);

    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "VPN inaccessible" } });
    fireEvent.change(screen.getByLabelText("Demandeur"), { target: { value: "julien" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Depuis ce matin" } });
    fireEvent.change(screen.getByLabelText("Priorité"), { target: { value: "Haute" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await vi.waitFor(() =>
      expect(onCreer).toHaveBeenCalledWith({
        titre: "VPN inaccessible",
        demandeur: "julien",
        description: "Depuis ce matin",
        priorite: "Haute",
      })
    );
    await vi.waitFor(() => expect(screen.getByLabelText("Titre")).toHaveValue(""));
    expect(screen.getByLabelText("Priorité")).toHaveValue("Moyenne");
  });
});
```

- [ ] **Step 6: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/components/TicketForm.test.tsx`
Expected: FAIL — `Cannot find module './TicketForm'`.

- [ ] **Step 7: Implémenter `TicketForm` (avec le champ Description)**

```tsx
// src/components/TicketForm.tsx
import { useState, type FormEvent } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket, PRIORITES } from "../domain/ticket";

export function TicketForm({ onCreer }: { onCreer: (t: NouveauTicket) => Promise<void> }) {
  const [titre, setTitre] = useState("");
  const [demandeur, setDemandeur] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("Moyenne");
  const [erreurs, setErreurs] = useState<string[]>([]);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    const input: NouveauTicket = { titre, demandeur, description, priorite };
    const errs = validerTicket(input);
    setErreurs(errs);
    if (errs.length) return;
    await onCreer(input);
    setTitre("");
    setDemandeur("");
    setDescription("");
    setPriorite("Moyenne");
  }

  return (
    <form className="carte form" onSubmit={soumettre}>
      <h2>Nouveau ticket</h2>
      <label>
        Titre
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. VPN inaccessible" />
      </label>
      <label>
        Demandeur
        <input value={demandeur} onChange={(e) => setDemandeur(e.target.value)} placeholder="Prénom Nom" />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails utiles pour traiter la demande (optionnel)"
        />
      </label>
      <label>
        Priorité
        <select value={priorite} onChange={(e) => setPriorite(e.target.value as Priorite)}>
          {PRIORITES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      {erreurs.length > 0 && (
        <ul className="erreurs">
          {erreurs.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
      <button type="submit" className="primaire">
        Créer
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Lancer les tests, vérifier le succès**

Run: `npx vitest run src/components/TicketForm.test.tsx`
Expected: PASS (2 tests verts).

- [ ] **Step 9: Écrire les tests rouges pour `TicketList` (filtrage des transitions + interactions, couvre le point Review Focus dédié)**

```tsx
// src/components/TicketList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketList } from "./TicketList";
import type { Ticket } from "../domain/ticket";

const ticket: Ticket = {
  id: "t1",
  titre: "VPN inaccessible",
  description: "",
  statut: "Nouveau",
  priorite: "Haute",
  demandeur: "julien",
  creeLe: "2026-09-23T10:00:00Z",
};

describe("TicketList", () => {
  it("ne propose que les transitions autorisées dans le sélecteur de statut", () => {
    render(<TicketList tickets={[ticket]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    const select = screen.getByLabelText("Statut de VPN inaccessible") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    // Nouveau → Résolu est interdit (règle 3) : "Résolu" ne doit pas apparaître.
    expect(options).toEqual(["Nouveau", "En cours"]);
  });

  it("affiche un message quand la liste est vide", () => {
    render(<TicketList tickets={[]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.getByText(/Aucun ticket/)).toBeInTheDocument();
  });

  it("appelle onChangerStatut avec l'id du ticket et le statut choisi", () => {
    const onChangerStatut = vi.fn();
    render(<TicketList tickets={[ticket]} onChangerStatut={onChangerStatut} onSupprimer={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Statut de VPN inaccessible"), { target: { value: "En cours" } });
    expect(onChangerStatut).toHaveBeenCalledWith("t1", "En cours");
  });

  it("appelle onSupprimer avec l'id du ticket au clic sur Supprimer", () => {
    const onSupprimer = vi.fn();
    render(<TicketList tickets={[ticket]} onChangerStatut={vi.fn()} onSupprimer={onSupprimer} />);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onSupprimer).toHaveBeenCalledWith("t1");
  });
});
```

- [ ] **Step 10: Lancer le test, vérifier l'échec**

Run: `npx vitest run src/components/TicketList.test.tsx`
Expected: FAIL — `Cannot find module './TicketList'`.

- [ ] **Step 11: Implémenter `TicketList` avec le filtrage des transitions**

```tsx
// src/components/TicketList.tsx
import type { Ticket, Statut } from "../domain/ticket";
import { transitionsPossibles } from "../domain/ticket";

export function TicketList({
  tickets,
  onChangerStatut,
  onSupprimer,
}: {
  tickets: Ticket[];
  onChangerStatut: (id: string, s: Statut) => void;
  onSupprimer: (id: string) => void;
}) {
  if (tickets.length === 0) return <p className="vide">Aucun ticket. Créez-en un →</p>;
  return (
    <ul className="liste">
      {tickets.map((t) => (
        <li key={t.id} className={"carte ticket p-" + t.priorite.toLowerCase()}>
          <div className="entete">
            <span className={"badge s-" + t.statut.replace(" ", "").toLowerCase()}>{t.statut}</span>
            <span className="prio">{t.priorite}</span>
          </div>
          <h3>{t.titre}</h3>
          <p className="meta">Demandé par {t.demandeur}</p>
          <div className="actions">
            <select
              value={t.statut}
              onChange={(e) => onChangerStatut(t.id, e.target.value as Statut)}
              aria-label={"Statut de " + t.titre}
            >
              {transitionsPossibles(t.statut).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="lien" onClick={() => onSupprimer(t.id)}>
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 12: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (tous les tests précédents + les 2 `StatusFilter` + 2 `TicketForm` + 4 `TicketList`).

- [ ] **Step 13: Commit**

```bash
git add src/components/StatusFilter.tsx src/components/StatusFilter.test.tsx src/components/TicketForm.tsx src/components/TicketForm.test.tsx src/components/TicketList.tsx src/components/TicketList.test.tsx
git commit -m "feat(ui): StatusFilter, TicketForm (+description), TicketList (transitions filtrées, règle 3), tests d'interaction"
```

---

## Task 7: Bootstrap — PowerProvider, App, main.tsx, styles — app fonctionnelle en mode mémoire

**Files:**
- Create: `src/vite-env.d.ts`
- Create: `src/PowerProvider.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: tout ce qui précède (Tasks 1–6).
- Produces: `export default function App()`, `export function PowerProvider({ children })`, point d'entrée `main.tsx`.

Pas de test dédié (composition root + appel SDK, hors du périmètre testable par la règle 2 — pas de mock du SDK). La vérification se fait en Task 8 par build + lancement manuel.

Point corrigé après revue (bloquant) : la première version de `PowerProvider` appelait `getContext()` **sans condition**, y compris en mode mémoire. Hors d'un hôte Power Apps (`npm run dev` seul), cet appel ne se résout jamais en succès : `pret` ne devient jamais `true`, et le composant reste bloqué sur la bannière d'initialisation ou d'erreur — l'app mémoire ne s'affiche jamais, ce qui contredit directement le mode mémoire exigé par `npm run dev`. Le correctif : en mode mémoire (`VITE_USE_SHAREPOINT` absent/`false`), `PowerProvider` ne doit jamais appeler le SDK et doit rendre `children` immédiatement ; l'attente de `getContext()` ne s'applique qu'en mode SharePoint.

- [ ] **Step 1: Créer le typage d'environnement Vite**

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_USE_SHAREPOINT?: string;
  readonly VITE_SP_SITE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 2: Créer `PowerProvider` (attend `getContext()` avant d'afficher l'app)**

```tsx
// src/PowerProvider.tsx
import { useEffect, useState, type ReactNode } from "react";
import { getContext } from "@microsoft/power-apps/app";

// Même logique de bascule que App.tsx (Step 3) : en mode mémoire, aucune dépendance
// à un hôte Power Apps n'est nécessaire, donc aucun appel SDK n'est fait ici.
const useSharePoint = import.meta.env.VITE_USE_SHAREPOINT === "true";

/**
 * En mode SharePoint : attend que le contexte Power Platform soit disponible
 * AVANT d'afficher les composants qui accèdent aux données.
 * En mode mémoire : rend `children` immédiatement, sans jamais appeler le SDK
 * (`npm run dev` seul doit suffire — voir CLAUDE.md § Pièges connus).
 */
export function PowerProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(!useSharePoint);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!useSharePoint) return;
    getContext()
      .then(() => setPret(true))
      .catch((e: unknown) => setErreur(e instanceof Error ? e.message : String(e)));
  }, []);

  if (erreur) return <div className="banniere err">Power Platform indisponible : {erreur}</div>;
  if (!pret) return <div className="banniere">Initialisation Power Platform…</div>;
  return <>{children}</>;
}
```

- [ ] **Step 3: Créer `App` (composition, bascule mémoire/SharePoint)**

```tsx
// src/App.tsx
import { useMemo, useState } from "react";
import { useTickets } from "./hooks/useTickets";
import { InMemoryTicketRepository } from "./data/inMemoryTicketRepository";
import { SharePointTicketRepository } from "./data/sharePointTicketRepository";
import type { TicketRepository } from "./data/ticketRepository";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { StatusFilter } from "./components/StatusFilter";
import { compter, filtrerParStatut, type Statut, type Ticket } from "./domain/ticket";

// Bascule mémoire <-> SharePoint. En démo, on démarre en mémoire puis on branche SharePoint (Task 11).
const useSharePoint = import.meta.env.VITE_USE_SHAREPOINT === "true";

export default function App() {
  const repo: TicketRepository = useMemo(
    () => (useSharePoint ? new SharePointTicketRepository() : new InMemoryTicketRepository(demo())),
    []
  );
  const { tickets, chargement, erreur, creer, changerStatut, supprimer } = useTickets(repo);
  const [filtre, setFiltre] = useState<Statut | "Tous">("Tous");
  const visibles = filtrerParStatut(tickets, filtre);
  const stats = compter(tickets);

  return (
    <div className="app">
      <header>
        <h1>aMP Tickets</h1>
        <p className="sous">
          Nouveau {stats.Nouveau} · En cours {stats["En cours"]} · Résolu {stats.Résolu}
        </p>
      </header>
      {erreur && <div className="banniere err">{erreur}</div>}
      <div className="colonnes">
        <section>
          <StatusFilter valeur={filtre} onChange={setFiltre} />
          {chargement ? (
            <p>Chargement…</p>
          ) : (
            <TicketList tickets={visibles} onChangerStatut={changerStatut} onSupprimer={supprimer} />
          )}
        </section>
        <aside>
          <TicketForm onCreer={creer} />
        </aside>
      </div>
    </div>
  );
}

function demo(): Ticket[] {
  const now = new Date().toISOString();
  return [
    {
      id: "d1",
      titre: "VPN inaccessible",
      description: "",
      statut: "En cours",
      priorite: "Haute",
      demandeur: "Julien",
      creeLe: now,
    },
    {
      id: "d2",
      titre: "Badge d'accès HS",
      description: "",
      statut: "Nouveau",
      priorite: "Moyenne",
      demandeur: "Sarah",
      creeLe: now,
    },
  ];
}
```

Note : `App.tsx` importe déjà `SharePointTicketRepository` depuis `./data/sharePointTicketRepository`, qui n'existe pas encore — ce fichier est créé au Task 9 (stub qui lève une erreur explicite tant que `pac code add-data-source` n'a pas été lancé). Sans lui, `App.tsx` ne compile pas : **créer ce stub minimal dans ce Task-ci**, son câblage réel avec `generated/` viendra en Task 11.

- [ ] **Step 3bis: Créer le stub `SharePointTicketRepository` (nécessaire pour que `App.tsx` compile ; sera complété en Task 11)**

```typescript
// src/data/sharePointTicketRepository.ts
import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";

/**
 * Adaptateur SharePoint. Tant que `pac code add-data-source` n'a pas été lancé
 * (Task 9) et le mapping écrit (Task 10-11), les appels lèvent une erreur
 * explicite — le reste de l'app reste fonctionnel et testable via l'impl mémoire.
 */
export class SharePointTicketRepository implements TicketRepository {
  private absent(): never {
    throw new Error(
      "Service SharePoint non généré. Lancez `pac code add-data-source` (Task 9) " +
        "puis complétez le mapping (Task 10-11)."
    );
  }

  async lister(): Promise<Ticket[]> {
    return this.absent();
  }

  async creer(_input: NouveauTicket): Promise<Ticket> {
    return this.absent();
  }

  async changerStatut(_id: string, _statut: Statut): Promise<Ticket> {
    return this.absent();
  }

  async supprimer(_id: string): Promise<void> {
    return this.absent();
  }
}
```

- [ ] **Step 4: Créer les styles**

```css
/* src/styles.css */
:root { --bg:#f5f7fa; --card:#fff; --ink:#1f2733; --muted:#6b7685; --bleu:#3a81ba; --haute:#963334; --moy:#d89f39; --basse:#8bab42; }
* { box-sizing: border-box; }
body { margin:0; font-family: "Segoe UI", Arial, sans-serif; color:var(--ink); background:var(--bg); }
.app { max-width: 980px; margin: 0 auto; padding: 24px; }
header h1 { margin:0; color:var(--bleu); }
.sous { color:var(--muted); margin:4px 0 16px; }
.colonnes { display:grid; grid-template-columns: 1fr 320px; gap:20px; }
@media (max-width:760px){ .colonnes{ grid-template-columns:1fr; } }
.carte { background:var(--card); border-radius:12px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
.liste { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
.ticket h3 { margin:6px 0; }
.entete { display:flex; justify-content:space-between; align-items:center; }
.badge { font-size:12px; padding:2px 8px; border-radius:999px; color:#fff; }
.s-nouveau{ background:var(--bleu);} .s-encours{ background:var(--moy);} .s-résolu,.s-resolu{ background:var(--basse);}
.prio { font-size:12px; color:var(--muted); }
.p-haute { border-left:4px solid var(--haute);} .p-moyenne{ border-left:4px solid var(--moy);} .p-basse{ border-left:4px solid var(--basse);}
.meta { color:var(--muted); font-size:13px; margin:4px 0; }
.actions { display:flex; gap:10px; align-items:center; margin-top:8px; }
.filtre { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
.pill { border:1px solid #d0d7de; background:#fff; border-radius:999px; padding:6px 14px; cursor:pointer; }
.pill.actif { background:var(--bleu); color:#fff; border-color:var(--bleu); }
.form label { display:block; margin:10px 0; font-size:14px; }
.form input, .form select { width:100%; padding:8px; border:1px solid #d0d7de; border-radius:8px; margin-top:4px; }
.primaire { background:var(--bleu); color:#fff; border:0; border-radius:8px; padding:10px 16px; cursor:pointer; width:100%; }
.lien { background:none; border:0; color:var(--haute); cursor:pointer; }
.erreurs { color:var(--haute); font-size:13px; }
.vide { color:var(--muted); }
.banniere { background:#eef3f8; padding:10px 14px; border-radius:8px; margin:8px 0; }
.banniere.err { background:#fde8e8; color:var(--haute); }
```

- [ ] **Step 5: Créer le point d'entrée**

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PowerProvider } from "./PowerProvider";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PowerProvider>
      <App />
    </PowerProvider>
  </StrictMode>
);
```

- [ ] **Step 6: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (41 tests verts, inchangé par rapport à la fin du Task 6).

- [ ] **Step 7: Commit**

```bash
git add src/vite-env.d.ts src/PowerProvider.tsx src/App.tsx src/data/sharePointTicketRepository.ts src/styles.css src/main.tsx
git commit -m "feat(app): bootstrap PowerProvider/App/main, app fonctionnelle en mode mémoire"
```

---

## Task 8: Vérification bout-en-bout du mode mémoire (typecheck strict, build, dev)

**Files:** aucun fichier nouveau — vérification pure.

**Interfaces:** aucune (checkpoint).

- [ ] **Step 1: Typecheck strict**

Run: `npx tsc -b --noEmit`
Expected: 0 erreur. Si une erreur apparaît (import inutilisé, type manquant), la corriger dans le fichier concerné avant de continuer — ne jamais désactiver une règle stricte pour la faire taire.

- [ ] **Step 2: Suite de tests complète**

Run: `npm test`
Expected: PASS (41 tests verts).

- [ ] **Step 3: Build de production**

Run: `npm run build`
Expected: `tsc -b` puis `vite build` réussissent sans erreur ni warning ; un dossier `dist/` est produit.

- [ ] **Step 4: Vérification manuelle en mode mémoire**

Run: `npm run dev`, ouvrir `http://localhost:3000`.
Vérifier à l'œil : l'app s'affiche **immédiatement**, sans passer par la bannière « Initialisation Power Platform… » ni « Power Platform indisponible » (depuis le correctif du Task 7, `PowerProvider` ne doit plus appeler le SDK en mode mémoire) ; les deux tickets de démo s'affichent, y compris le champ description quand il est renseigné à la création ; la création d'un ticket fonctionne (titre/demandeur obligatoires, erreurs affichées si vides) ; le changement de statut ne propose que les transitions autorisées ; la suppression fonctionne quel que soit le statut ; le filtre par statut fonctionne.
Si la bannière Power Platform apparaît et bloque l'affichage, c'est une régression du correctif du Task 7 : la corriger avant de continuer.
Arrêter le serveur (`Ctrl+C`) une fois vérifié.

- [ ] **Step 5: Commit (uniquement si Step 1 a nécessité des corrections)**

```bash
git add -A
git commit -m "fix: corrections de typecheck strict suite à la vérification bout-en-bout"
```

Si aucune correction n'a été nécessaire, ne rien committer à cette étape.

---

## Task 9: Génération du service SharePoint

**Contexte :** l'environnement Power Platform (auth, connexion SharePoint, site + liste `Tickets`) est déjà prêt côté tenant. Ce Task exécute la génération côté projet.

**Files:**
- Modify: `power.config.json` (renseigné automatiquement par les commandes `pac`)
- Create: `generated/` ou `src/generated/` (sortie de `pac`, **jamais éditée à la main**)

**Interfaces:** aucune côté TypeScript — sortie de tooling externe.

- [ ] **Step 1: Vérifier si le projet est déjà initialisé côté `pac code`**

`power.config.json` contient actuellement des valeurs de gabarit (`"<généré par pac code init>"`, `"<votre environnement>"`). Si c'est toujours le cas :

Run: `pac auth list` (vérifier qu'un profil est bien sélectionné vers l'environnement de démo).
Run: `pac code init --help` pour confirmer la syntaxe exacte de la commande dans la version de `pac` installée (le CLI `pac code` est en preview, sa surface peut changer — ne pas deviner les options).
Run la commande `pac code init` confirmée par `--help`, exécutée à la racine du projet. Elle doit renseigner `appId`, `environmentId` (et généralement `localAppUrl`) dans `power.config.json`.

Si `power.config.json` a déjà des valeurs réelles (pas de gabarit), passer directement au Step 2.

- [ ] **Step 2: Vérifier la cohérence du port**

Ouvrir `power.config.json`, relever la valeur de `localAppUrl` si présente.
Elle doit correspondre exactement au port 3000 fixé dans `vite.config.ts` (`server: { port: 3000, strictPort: true }`). Sinon, corriger `power.config.json` (jamais `vite.config.ts`, qui est la contrainte figée par la démo).

- [ ] **Step 3: Repérer la connexion SharePoint existante**

Run: `pac connection list`
Noter le `connectionId` de la connexion `shared_sharepointonline` déjà créée dans `make.powerapps.com` pour le tenant de démo.

- [ ] **Step 4: Découvrir le dataset et la table exacts via `pac code list-datasets` / `list-tables` (au lieu de deviner l'encodage à la main)**

Le flag `-d`/`--dataset` de `pac code add-data-source` n'est **pas documenté officiellement** pour `shared_sharepointonline` (la doc Microsoft Learn actuelle de `pac code` ne précise pas de format d'encodage ; c'est un comportement communautaire — voir Step 5). Pour éviter de deviner, interroger d'abord le connecteur lui-même :

Run (remplacer `<connectionId>` par la valeur notée au Step 3) :

```bash
pac code list-datasets -a "shared_sharepointonline" -c "<connectionId>"
```

Cette commande liste les datasets (sites) accessibles par la connexion, sous la forme exacte attendue par `-d`. Copier cette valeur telle quelle (ne pas la ré-encoder à la main). Puis :

```bash
pac code list-tables -a "shared_sharepointonline" -c "<connectionId>" -d "<dataset copié ci-dessus>"
```

pour confirmer le nom exact de la table `Tickets` tel qu'attendu par `-t`.

- [ ] **Step 5: Générer le service pour la liste `Tickets`**

Run, en une seule ligne, avec le `connectionId` du Step 3 et le dataset/table copiés tels quels au Step 4 :

```bash
pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" -t "<table copiée au Step 4>" -d "<dataset copié au Step 4>"
```

Si `pac code list-datasets` n'est pas disponible dans la version de `pac` installée, ou si la commande échoue, se rabattre sur l'URL du site SharePoint **double URL-encodée** (ex. `https://contoso.sharepoint.com/sites/aMP` → encoder une fois → `https%3A%2F%2Fcontoso.sharepoint.com%2Fsites%2FaMP` → encoder une seconde fois, les `%` deviennent `%25` → `https%253A%252F%252Fcontoso.sharepoint.com%252Fsites%252FaMP`) : ce double encodage est rapporté de façon cohérente par plusieurs sources communautaires pour `pac code add-data-source` + `shared_sharepointonline` (ex. issue GitHub microsoft/PowerAppsCodeApps#137), bien que non documenté officiellement — ne pas confondre avec le nouveau CLI `pa app add data-source`, dont la doc officielle attend l'URL en clair (non encodée) : ce projet utilise `pac code`, pas `pa app` (CLAUDE.md).

- [ ] **Step 6: Localiser le code généré et noter le chemin réel**

Run (Bash/Git Bash) : `ls generated 2>/dev/null; ls src/generated 2>/dev/null`
Run (PowerShell) : `Test-Path generated; Test-Path src/generated`
La documentation officielle actuelle génère dans `src/generated/` ; ce projet a été conçu avec l'hypothèse `generated/` à la racine. **Noter le chemin réellement produit** — il sera utilisé pour les imports du Task 11 (ajuster les imports, jamais les fichiers générés).

- [ ] **Step 7: Inspecter le modèle généré pour la liste `Tickets`**

Ouvrir le fichier de modèle généré (nom approximatif : `TicketsModel.ts` ou équivalent, dans le dossier repéré au Step 6) et noter précisément :
- le nom exact de la propriété d'identifiant (ex. `ID`) et de toute propriété suffixée `#Id` à exclure des payloads,
- la forme exacte des colonnes Choix `Statut` et `Priorite` (doit être un objet `{ Value: string }` ou équivalent — vérifier le nom exact du champ),
- le nom exact du champ système de date de création (ex. `Created`), utilisé pour mapper `creeLe`.

Ces noms exacts sont nécessaires pour écrire un mapping correct au Task 11 — s'ils diffèrent des hypothèses du Task 10, ajuster le mapping en conséquence à ce moment-là.

- [ ] **Step 8: Vérifier que rien n'est cassé côté tests et build**

Run: `npm test` puis `npx tsc -b --noEmit`
Expected: toujours PASS / 0 erreur (le code généré n'est encore importé nulle part).

- [ ] **Step 9: Commit**

Ajouter `power.config.json` et le dossier généré réellement produit (celui noté au Step 6 — `generated/` ou `src/generated/`, selon ce qui a été constaté ; si le modèle `pac code` l'a placé sous `.gitignore` par défaut, seul `power.config.json` aura changé, ce qui est normal) :

```bash
git add power.config.json
git add generated 2>/dev/null
git add src/generated 2>/dev/null
git commit -m "chore: génération du service SharePoint pour la liste Tickets (pac code add-data-source)"
```

Note : selon la politique de `.gitignore` du modèle `pac code`, le dossier généré peut être ignoré par défaut — dans ce cas, ce commit ne portera que sur `power.config.json`, ce qui est normal.

---

## Task 10: Mapping SharePoint pur (TDD) — fromSharePoint / toSharePoint

> **Révisé après génération réelle (Task 9).** Le contrat ci-dessous n'est plus une hypothèse : il a été vérifié en lisant directement `src/generated/models/TicketsModel.ts` (le modèle réellement produit par `pac code add-data-source` contre la liste `Tickets` réelle). Deux points divergent de la documentation historique de `CLAUDE.md` :
> 1. **Asymétrie lecture/écriture confirmée.** En lecture (`TicketsRead`), `Statut`/`Priorite` sont des objets `{ "@odata.type", Value, Id }`. En écriture (`TicketsWrite`), ce sont des **chaînes brutes** (`Statut?: string`), pas des objets `{ Value }` — contrairement à ce que `CLAUDE.md` documentait jusqu'ici. Ce Task lit donc un objet mais écrit une chaîne.
> 2. **Champs optionnels dans le modèle réel.** `TicketsBase` (dont hérite `TicketsRead`) déclare `ID?`, `Title?`, `Statut?`, `Priorite?`, `Created?` comme optionnels — le mapping doit donc valider explicitement leur présence plutôt que de les supposer toujours renseignés.

**Files:**
- Create: `src/data/sharePointMapping.ts`
- Test: `src/data/sharePointMapping.test.ts`

**Interfaces:**
- Consumes: `Ticket`, `Statut`, `Priorite`, `STATUTS`, `PRIORITES` (Task 1).
- Produces: `interface SharePointTicketRecord`, `interface SharePointTicketPayload`, `fromSharePoint(record: SharePointTicketRecord): Ticket`, `toSharePoint(ticket: Ticket): SharePointTicketPayload`.

Ces fonctions restent **pures** (aucun import SDK, et — choix délibéré — aucun import direct de `src/generated/` non plus, même pour un type) : elles sont testables sans mock, et gardent `sharePointTicketRepository.ts` comme seule porte vers `generated/` (règle 4). `SharePointTicketRecord`/`SharePointTicketPayload` sont donc des interfaces maintenues à la main ici, mais leur forme est désormais copiée fidèlement sur le modèle réel `src/generated/models/TicketsModel.ts` plutôt que devinée — Task 11 passera des valeurs `TicketsRead`/`TicketsWrite` réelles à ces fonctions ; TypeScript acceptera l'affectation par typage structurel (`TicketsRead` a une forme compatible, avec des champs en plus, ce qui est licite sans cast).

- [ ] **Step 1: Écrire les tests rouges**

```typescript
// src/data/sharePointMapping.test.ts
import { describe, it, expect } from "vitest";
import { fromSharePoint, toSharePoint, type SharePointTicketRecord } from "./sharePointMapping";

describe("fromSharePoint", () => {
  it("mappe un enregistrement SharePoint complet vers un Ticket", () => {
    const record: SharePointTicketRecord = {
      ID: 42,
      Title: "VPN inaccessible",
      Description: "Ne se connecte plus depuis ce matin",
      Statut: { Value: "En cours" },
      Priorite: { Value: "Haute" },
      Demandeur: "julien",
      Created: "2026-09-23T08:00:00Z",
    };
    expect(fromSharePoint(record)).toEqual({
      id: "42",
      titre: "VPN inaccessible",
      description: "Ne se connecte plus depuis ce matin",
      statut: "En cours",
      priorite: "Haute",
      demandeur: "julien",
      creeLe: "2026-09-23T08:00:00Z",
    });
  });

  it("traite une Description absente comme une chaîne vide", () => {
    const record: SharePointTicketRecord = {
      ID: 1,
      Title: "T",
      Description: undefined,
      Statut: { Value: "Nouveau" },
      Priorite: { Value: "Moyenne" },
      Demandeur: "j",
      Created: "2026-09-23T08:00:00Z",
    };
    expect(fromSharePoint(record).description).toBe("");
  });

  it("lève une erreur explicite si un champ obligatoire est absent (ex. ID)", () => {
    const record: SharePointTicketRecord = {
      Title: "T",
      Statut: { Value: "Nouveau" },
      Priorite: { Value: "Moyenne" },
      Demandeur: "j",
      Created: "2026-09-23T08:00:00Z",
    };
    expect(() => fromSharePoint(record)).toThrow(/Champ SharePoint manquant : ID/);
  });
});

describe("toSharePoint", () => {
  it("envoie Statut/Priorite en chaînes brutes (pas en objet { Value }) et omet l'id", () => {
    const ticket = {
      id: "42",
      titre: "VPN inaccessible",
      description: "Ne se connecte plus",
      statut: "En cours" as const,
      priorite: "Haute" as const,
      demandeur: "julien",
      creeLe: "2026-09-23T08:00:00Z",
    };
    expect(toSharePoint(ticket)).toEqual({
      Title: "VPN inaccessible",
      Description: "Ne se connecte plus",
      Statut: "En cours",
      Priorite: "Haute",
      Demandeur: "julien",
    });
  });
});

describe("fromSharePoint — valeurs distantes invalides (rigueur)", () => {
  it("lève une erreur explicite si la colonne Statut contient une valeur inconnue", () => {
    const record: SharePointTicketRecord = {
      ID: 1,
      Title: "T",
      Description: "",
      Statut: { Value: "Archivé" }, // valeur historique/mal configurée, hors du domaine Statut
      Priorite: { Value: "Moyenne" },
      Demandeur: "j",
      Created: "2026-09-23T08:00:00Z",
    };
    expect(() => fromSharePoint(record)).toThrow(/Statut SharePoint inattendu/);
  });

  it("lève une erreur explicite si la colonne Priorite contient une valeur inconnue", () => {
    const record: SharePointTicketRecord = {
      ID: 1,
      Title: "T",
      Description: "",
      Statut: { Value: "Nouveau" },
      Priorite: { Value: "Urgente" }, // hors du domaine Priorite
      Demandeur: "j",
      Created: "2026-09-23T08:00:00Z",
    };
    expect(() => fromSharePoint(record)).toThrow(/Priorité SharePoint inattendue/);
  });
});
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `npx vitest run src/data/sharePointMapping.test.ts` (ajouter `-- --no-file-parallelism` si une erreur `spawn UNKNOWN` apparaît — condition d'environnement connue, sans rapport avec le code, voir note du Task 9)
Expected: FAIL — `Cannot find module './sharePointMapping'`.

- [ ] **Step 3: Implémenter**

```typescript
// src/data/sharePointMapping.ts
// Mapping PUR colonnes SharePoint <-> domaine. Aucun import SDK ni generated/ ici :
// testable sans mock (règle 2 du projet). Forme copiée fidèlement sur le modèle
// réellement généré (src/generated/models/TicketsModel.ts, vérifié au Task 9) —
// pas une hypothèse.
import type { Ticket, Statut, Priorite } from "../domain/ticket";
import { STATUTS, PRIORITES } from "../domain/ticket";

export interface SharePointChoice {
  Value: string;
}

// Optionnalité alignée sur TicketsBase (modèle généré réel) : SharePoint peut en
// théorie omettre ces champs (ex. $select restreint) — on valide leur présence
// explicitement plutôt que de la supposer.
export interface SharePointTicketRecord {
  ID?: number;
  Title?: string;
  Description?: string;
  Statut?: SharePointChoice;
  Priorite?: SharePointChoice;
  Demandeur: string;
  Created?: string;
}

// Écriture : Statut/Priorite sont des CHAÎNES BRUTES dans le modèle généré réel
// (TicketsWrite), pas des objets { Value } — asymétrie confirmée avec la lecture.
export interface SharePointTicketPayload {
  Title: string;
  Description: string;
  Statut: string;
  Priorite: string;
  Demandeur: string;
}

function champObligatoire<T>(valeur: T | undefined, nom: string): T {
  if (valeur === undefined) throw new Error(`Champ SharePoint manquant : ${nom}.`);
  return valeur;
}

// Point corrigé après revue : un cast `as Statut`/`as Priorite` accepterait
// silencieusement n'importe quelle valeur distante (liste mal configurée, donnée
// historique invalide). On valide explicitement contre le domaine connu et on
// lève une erreur lisible plutôt que de laisser un Ticket typé mais invalide
// se propager dans l'app.
function assertStatut(value: string): Statut {
  if ((STATUTS as string[]).includes(value)) return value as Statut;
  throw new Error(`Statut SharePoint inattendu : "${value}". Valeurs valides : ${STATUTS.join(", ")}.`);
}

function assertPriorite(value: string): Priorite {
  if ((PRIORITES as string[]).includes(value)) return value as Priorite;
  throw new Error(`Priorité SharePoint inattendue : "${value}". Valeurs valides : ${PRIORITES.join(", ")}.`);
}

export function fromSharePoint(record: SharePointTicketRecord): Ticket {
  const id = champObligatoire(record.ID, "ID");
  const titre = champObligatoire(record.Title, "Title");
  const statut = champObligatoire(record.Statut, "Statut");
  const priorite = champObligatoire(record.Priorite, "Priorite");
  const creeLe = champObligatoire(record.Created, "Created");
  return {
    id: String(id),
    titre,
    description: record.Description ?? "",
    statut: assertStatut(statut.Value),
    priorite: assertPriorite(priorite.Value),
    demandeur: record.Demandeur,
    creeLe,
  };
}

export function toSharePoint(ticket: Ticket): SharePointTicketPayload {
  return {
    Title: ticket.titre,
    Description: ticket.description,
    Statut: ticket.statut,
    Priorite: ticket.priorite,
    Demandeur: ticket.demandeur,
  };
}
```

- [ ] **Step 4: Lancer tous les tests, vérifier le succès**

Run: `npm test`
Expected: PASS (tous les tests précédents + les 6 tests de `sharePointMapping.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/data/sharePointMapping.ts src/data/sharePointMapping.test.ts
git commit -m "feat(data): mapping pur SharePoint <-> domaine (contrat réel post-génération), testé sans SDK"
```

---

## Task 11: Câblage `SharePointTicketRepository` + bascule + vérification `power:run`

> **Révisé après génération réelle (Task 9).** Le contrat exact du service généré est maintenant connu (lu directement dans `src/generated/services/TicketsService.ts` et `src/generated/models/TicketsModel.ts`) :
> - Chemin réel : `src/generated/` (pas `generated/` à la racine). Depuis `src/data/sharePointTicketRepository.ts`, l'import est donc `../generated/...` (un seul niveau, pas deux).
> - Méthodes réelles : `TicketsService.getAll(options?)`, `.get(id: string, options?)`, `.create(record: Omit<TicketsWrite,'ID'>)`, `.update(id: string, changes: Partial<Omit<TicketsWrite,'ID'>>)`, `.delete(id: string): Promise<void>`.
> - `getAll`/`get`/`create`/`update` renvoient tous `Promise<IOperationResult<T>>` où `IOperationResult<T> = { success: boolean; data: T; error?: Error | { message: string; status?: number; ... } }`. **Pas de wrapper `.value`** : pour `getAll`, `data` est directement `TicketsRead[]`. `delete` renvoie `Promise<void>` nu (pas enveloppé).
> - `TicketsRead`/`TicketsWrite` sont structurellement compatibles avec `SharePointTicketRecord`/`SharePointTicketPayload` (Task 10) : TypeScript accepte l'affectation directe sans cast.

**Files:**
- Modify: `src/data/sharePointTicketRepository.ts`
- Modify: `.env.local` (non commité — copié depuis `.env.local.example`)

**Interfaces:**
- Consumes: `TicketRepository` (Task 4), `changerStatut` du domaine (Task 2, importé ici sous l'alias `appliquerTransition`), `fromSharePoint`/`toSharePoint` (Task 10), `TicketsService` et `IOperationResult` du service généré du Task 9.
- Produces: `SharePointTicketRepository` pleinement fonctionnel (remplace le stub du Task 7).

Point corrigé après revue (bloquant) : la première version de `changerStatut` envoyait directement le statut cible à SharePoint, sans passer par la fonction `changerStatut` du domaine. Résultat : contrairement à `InMemoryTicketRepository` (qui applique déjà la machine à états du domaine), n'importe quel appelant pouvait forcer `Nouveau → Résolu` en mode SharePoint — la règle 3 n'était garantie que par le filtrage du sélecteur UI (Task 6), pas par le repository lui-même. Le correctif : lire d'abord le ticket courant, appliquer la fonction pure `changerStatut` du domaine (qui lève si la transition est interdite), puis persister le seul statut validé.

- [ ] **Step 1: Remplacer le stub par l'implémentation réelle**

```typescript
// src/data/sharePointTicketRepository.ts
import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket, changerStatut as appliquerTransition } from "../domain/ticket";
import { fromSharePoint, toSharePoint } from "./sharePointMapping";
import type { IOperationResult } from "@microsoft/power-apps/data";
import { TicketsService } from "../generated/services/TicketsService";

/** Déballe un IOperationResult : renvoie `.data` si succès, sinon lève une erreur lisible. */
function unwrap<T>(result: IOperationResult<T>): T {
  if (!result.success) {
    throw new Error(result.error?.message ?? "Appel SharePoint échoué.");
  }
  return result.data;
}

/**
 * Adaptateur SharePoint. Mappe les colonnes de la liste SP <-> le modèle métier
 * via sharePointMapping.ts (pur, testé), et délègue au service généré.
 */
export class SharePointTicketRepository implements TicketRepository {
  async lister(): Promise<Ticket[]> {
    const rows = unwrap(await TicketsService.getAll());
    return rows.map(fromSharePoint);
  }

  async creer(input: NouveauTicket): Promise<Ticket> {
    // id/creeLe sont gérés par SharePoint (ID auto-incrémenté, Created système) :
    // on ne les utilise pas dans le payload envoyé (toSharePoint ne les inclut pas).
    const brouillon = creerTicket(input, { id: () => "", maintenant: () => new Date() });
    const cree = unwrap(await TicketsService.create(toSharePoint(brouillon)));
    return fromSharePoint(cree);
  }

  async changerStatut(id: string, statut: Statut): Promise<Ticket> {
    // On lit le ticket courant, on applique la machine à états du domaine (qui lève
    // sur une transition interdite), puis on persiste uniquement le statut validé —
    // jamais le statut cible brut envoyé par l'appelant.
    const actuel = unwrap(await TicketsService.get(id));
    const ticketActuel = fromSharePoint(actuel);
    const valide = appliquerTransition(ticketActuel, statut);
    const maj = unwrap(await TicketsService.update(id, { Statut: valide.statut }));
    return fromSharePoint(maj);
  }

  async supprimer(id: string): Promise<void> {
    await TicketsService.delete(id);
  }
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc -b --noEmit`
Expected: 0 erreur. Si `tsc` rapporte une divergence (ex. un champ de `TicketsRead`/`TicketsWrite` different de ce qui précède), corriger cette implémentation pour correspondre exactement à ce que `tsc` rapporte — ne jamais utiliser `any` pour faire taire une erreur (règle 5 : zéro `any`).

- [ ] **Step 3: Lancer la suite de tests (le SDK n'y est toujours pas appelé)**

Run: `npm test` (ajouter `-- --no-file-parallelism` si `spawn UNKNOWN` apparaît, voir note du Task 9)
Expected: PASS, inchangé — `SharePointTicketRepository` n'est pas testé unitairement (il appelle le SDK), seul son mapping pur (Task 10) et la machine à états qu'il réutilise (Task 2) le sont.

- [ ] **Step 4: Activer le mode SharePoint localement**

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` : mettre `VITE_USE_SHAREPOINT=true` et `VITE_SP_SITE_URL=https://votretenant.sharepoint.com/sites/aMP` (site réel, confirmé au Task 9 — simple rappel humain dans ce fichier, pas une valeur consommée par le code applicatif).

- [ ] **Step 5: Lancer l'hôte Power Apps local et vérifier manuellement**

Run: `npm run power:run`
Ouvrir l'URL « Local Play » indiquée (même profil navigateur que le tenant de démo — **jamais** `npm run dev` seul pour ce mode).
Vérifier : la liste se charge depuis la vraie liste SharePoint `Tickets`, la création d'un ticket apparaît bien dans SharePoint, le changement de statut persiste, la suppression fonctionne pour un ticket `Résolu`, et une tentative de transition interdite (si testée via un appel direct hors UI) échoue proprement au lieu d'être silencieusement acceptée.

- [ ] **Step 6: Commit**

```bash
git add src/data/sharePointTicketRepository.ts
git commit -m "feat(data): câblage SharePointTicketRepository sur le service généré (contrat réel post-génération)"
```

(`.env.local` reste non commité — il est dans `.gitignore`.)

---

## Task 12: Recette manuelle sur la liste réelle (checklist critères DONE)

**Files:** aucun — recette manuelle, pas de nouveaux tests automatisés (règle 2 : le SDK n'est jamais appelé dans les tests).

- [ ] **Step 1: Lancer l'hôte Power Apps local**

Run: `npm run power:run` (avec `VITE_USE_SHAREPOINT=true` déjà en place depuis Task 11).

- [ ] **Step 2: Rejouer chaque critère DONE de `docs/spec.md` contre la vraie liste**

Cocher un par un, dans l'ordre :
- [ ] Créer un ticket avec titre + demandeur → apparaît avec statut `Nouveau`, priorité `Moyenne` par défaut, dans la liste SharePoint réelle.
- [ ] Créer un ticket sans titre ou sans demandeur → refusé, message d'erreur affiché, rien n'est écrit dans SharePoint (règle 1).
- [ ] Faire `Nouveau → En cours` → `En cours → Résolu` sur un ticket → chaque transition persiste dans SharePoint (règle 3).
- [ ] Tenter `Nouveau → Résolu` directement → non proposé dans le sélecteur (règle 3, vérifiée UI en Task 6).
- [ ] Rouvrir un ticket `Résolu → En cours` → persiste (règle 3).
- [ ] Créer deux tickets de priorités différentes → la liste les trie priorité décroissante puis date récente (règle 4).
- [ ] Filtrer par chaque statut, puis `Tous` → la liste affichée correspond (règle 5).
- [ ] Supprimer un ticket `Nouveau`, un `En cours`, un `Résolu` → chacun disparaît de la liste SharePoint réelle (règle 6).
- [ ] Redimensionner la fenêtre / tester sur mobile → la mise en page (`colonnes` → 1 colonne sous 760px) reste lisible.

- [ ] **Step 3: Consigner le résultat**

Si un point échoue, revenir en `systematic-debugging` sur ce point précis avant de continuer — ne pas passer au Task 13 avec un critère DONE non satisfait.

---

## Task 13: Déploiement

**Files:** aucun — build + déploiement.

- [ ] **Step 1: Build de production propre**

Run: `npm run build`
Expected: 0 erreur, 0 warning TypeScript (critère DONE « sans code smells »).

- [ ] **Step 2: Déployer**

Run: `npm run push`
Expected: `pac code push` termine sans erreur.

- [ ] **Step 3: Vérification post-déploiement**

Ouvrir l'application déployée (URL fournie par `pac code push` ou le portail Power Apps), vérifier qu'elle se charge et affiche la liste réelle `Tickets`.

- [ ] **Step 4: Commit final (si des ajustements ont eu lieu pendant la recette/déploiement)**

```bash
git add -A
git commit -m "chore: ajustements post-recette avant déploiement"
```

Si aucun ajustement n'a été nécessaire, ne rien committer à cette étape — le projet est **DONE** selon `docs/spec.md`.
