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
