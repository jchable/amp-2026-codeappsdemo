import { describe, it, expect } from "vitest";
import {
  creerTicket, validerTicket, changerStatut, transitionAutorisee,
  filtrerParStatut, trierParPriorite, compter, type Ticket,
} from "./ticket";

const deps = { id: () => "t1", maintenant: () => new Date("2026-09-24T10:00:00Z") };
const base = (over: Partial<Ticket> = {}): Ticket => ({
  id: "x", titre: "T", description: "", statut: "Nouveau",
  priorite: "Moyenne", demandeur: "julien", creeLe: "2026-09-24T10:00:00Z", ...over,
});

describe("validerTicket", () => {
  it("exige un titre", () => {
    expect(validerTicket({ titre: "", demandeur: "j" })).toContain("Le titre est obligatoire.");
  });
  it("exige un demandeur", () => {
    expect(validerTicket({ titre: "Panne", demandeur: "" })).toContain("Le demandeur est obligatoire.");
  });
  it("accepte un ticket correct", () => {
    expect(validerTicket({ titre: "Panne imprimante", demandeur: "julien" })).toEqual([]);
  });
});

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

describe("changerStatut", () => {
  it("autorise Nouveau → En cours", () => {
    expect(changerStatut(base(), "En cours").statut).toBe("En cours");
  });
  it("interdit Nouveau → Résolu", () => {
    expect(() => changerStatut(base(), "Résolu")).toThrow();
  });
  it("permet la réouverture Résolu → En cours", () => {
    expect(transitionAutorisee("Résolu", "En cours")).toBe(true);
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
  it("trie par priorité décroissante", () => {
    expect(trierParPriorite(tickets).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("compte par statut", () => {
    expect(compter(tickets)).toEqual({ Nouveau: 2, "En cours": 1, "Résolu": 0 });
  });
});
