import { describe, it, expect } from "vitest";
import { validerTicket, creerTicket, changerStatut, transitionAutorisee, transitionsPossibles, filtrerParStatut, trierParPriorite, compter, type NouveauTicket, type Ticket } from "./ticket";

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

const base = (over: Partial<Ticket> = {}): Ticket => ({
  id: "x",
  titre: "T",
  description: "",
  statut: "Nouveau",
  priorite: "Moyenne",
  demandeur: "julien",
  creeLe: "2026-09-24T10:00:00Z",
  ...over,
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
  it("tie-break par date : plus récent d'abord quand priorités égales", () => {
    const samePrority = [
      base({ id: "x", priorite: "Moyenne", creeLe: "2026-09-24T10:00:00Z" }),
      base({ id: "y", priorite: "Moyenne", creeLe: "2026-09-24T11:00:00Z" }),
    ];
    expect(trierParPriorite(samePrority).map((t) => t.id)).toEqual(["y", "x"]);
  });
  it("compte par statut", () => {
    expect(compter(tickets)).toEqual({ Nouveau: 2, "En cours": 1, "Résolu": 0 });
  });
});
