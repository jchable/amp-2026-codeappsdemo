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
