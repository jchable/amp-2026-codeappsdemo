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
