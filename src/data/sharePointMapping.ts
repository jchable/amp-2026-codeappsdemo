// Mapping PUR colonnes SharePoint <-> domaine. Aucun import SDK ni generated/ ici :
// testable sans mock (règle 2 du projet).
//
// Colonnes Choix (Statut, Priorite) : la LECTURE renvoie des objets
// { "@odata.type", Value, Id } et l'ÉCRITURE attend aussi des objets { Value }
// (schéma du connecteur : .power/schemas/sharepointonline/tickets.Schema.json).
// Le type TypeScript généré (TicketsWrite : `Statut?: string`) est FAUX : une chaîne
// brute est ignorée silencieusement par SharePoint (ligne créée avec des choix vides,
// prouvé sur la liste réelle). Le contournement de typage vit à la frontière, dans
// sharePointTicketRepository.ts.
import type { Ticket, Statut, Priorite } from "../domain/ticket";
import { STATUTS, PRIORITES } from "../domain/ticket";

export interface SharePointChoice {
  Value: string;
}

// Optionnalité alignée sur TicketsBase (modèle généré) : SharePoint peut omettre ces
// champs (ex. $select restreint, ligne ajoutée à la main) — on valide leur présence
// explicitement plutôt que de la supposer. Statut/Priorite absents ont des défauts (règle 8).
export interface SharePointTicketRecord {
  ID?: number;
  Title?: string;
  Description?: string;
  Statut?: SharePointChoice;
  Priorite?: SharePointChoice;
  Demandeur: string;
  Created?: string;
}

// Écriture : Statut/Priorite sont des objets { Value }, comme en lecture (voir en-tête).
export interface SharePointTicketPayload {
  Title: string;
  Description: string;
  Statut: SharePointChoice;
  Priorite: SharePointChoice;
  Demandeur: string;
}

export function choixSharePoint(valeur: Statut | Priorite): SharePointChoice {
  return { Value: valeur };
}

// Payload partiel d'un changement de statut : seul Statut est écrit.
export function miseAJourStatut(statut: Statut): Partial<SharePointTicketPayload> {
  return { Statut: choixSharePoint(statut) };
}

// OData renvoie `null` (et non `undefined`) pour une colonne vide : les deux comptent comme absents.
function champObligatoire<T>(valeur: T | null | undefined, nom: string): T {
  if (valeur == null) throw new Error(`Champ SharePoint manquant : ${nom}.`);
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

// Règle 8 : un choix absent, null, sans Value ou à Value vide prend la valeur par défaut
// de la création (règle 2). Une valeur présente mais inconnue reste une erreur
// (assertStatut/assertPriorite).
function valeurChoix(choix: SharePointChoice | null | undefined): string | undefined {
  const valeur = choix?.Value;
  return valeur ? valeur : undefined;
}

export function fromSharePoint(record: SharePointTicketRecord): Ticket {
  const id = champObligatoire(record.ID, "ID");
  const titre = champObligatoire(record.Title, "Title");
  const creeLe = champObligatoire(record.Created, "Created");
  const statut = valeurChoix(record.Statut);
  const priorite = valeurChoix(record.Priorite);
  return {
    id: String(id),
    titre,
    description: record.Description ?? "",
    statut: statut === undefined ? "Nouveau" : assertStatut(statut),
    priorite: priorite === undefined ? "Moyenne" : assertPriorite(priorite),
    demandeur: record.Demandeur,
    creeLe,
  };
}

export function toSharePoint(ticket: Ticket): SharePointTicketPayload {
  return {
    Title: ticket.titre,
    Description: ticket.description,
    Statut: choixSharePoint(ticket.statut),
    Priorite: choixSharePoint(ticket.priorite),
    Demandeur: ticket.demandeur,
  };
}
