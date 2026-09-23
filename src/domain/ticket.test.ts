import { describe, it, expect } from "vitest";
import { validerTicket, creerTicket, type NouveauTicket } from "./ticket";

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
