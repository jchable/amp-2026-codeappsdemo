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
