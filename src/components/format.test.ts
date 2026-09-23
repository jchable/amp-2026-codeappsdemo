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
