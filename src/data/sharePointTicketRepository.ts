import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket, changerStatut as appliquerTransition } from "../domain/ticket";
import { fromSharePoint, miseAJourStatut, toSharePoint, type SharePointTicketPayload } from "./sharePointMapping";
import type { IOperationResult } from "@microsoft/power-apps/data";
import { TicketsService } from "../generated/services/TicketsService";
import type { TicketsWrite } from "../generated/models/TicketsModel";

/** Déballe un IOperationResult : renvoie `.data` si succès, sinon lève une erreur lisible. */
function unwrap<T>(result: IOperationResult<T>): T {
  if (!result.success) {
    throw new Error(result.error?.message ?? "Appel SharePoint échoué.");
  }
  return result.data;
}

/**
 * Frontière de typage : le type généré `TicketsWrite` déclare `Statut?: string` et
 * `Priorite?: string`, ce qui est FAUX. Le schéma du connecteur
 * (.power/schemas/sharepointonline/tickets.Schema.json) les déclare en objets `{ Value }`,
 * et une chaîne brute est silencieusement ignorée (ligne créée avec des choix vides).
 * On envoie donc `{ Value }` et on contourne le typage ici, à un seul endroit.
 */
function versCreationGeneree(payload: SharePointTicketPayload): Omit<TicketsWrite, "ID"> {
  return payload as unknown as Omit<TicketsWrite, "ID">;
}

// Même cast, pour une mise à jour partielle (mêmes raisons que ci-dessus).
function versMiseAJourGeneree(payload: Partial<SharePointTicketPayload>): Partial<Omit<TicketsWrite, "ID">> {
  return payload as unknown as Partial<Omit<TicketsWrite, "ID">>;
}

/**
 * Adaptateur SharePoint. Mappe les colonnes de la liste SP <-> le modèle métier
 * via sharePointMapping.ts (pur, testé), et délègue au service généré.
 */
export class SharePointTicketRepository implements TicketRepository {
  async lister(): Promise<Ticket[]> {
    // getAll est appelé sans option de pagination : une longue liste peut être tronquée
    // par la taille de page du connecteur (à vérifier sur la liste réelle).
    const rows = unwrap(await TicketsService.getAll());
    return rows.map(fromSharePoint);
  }

  async creer(input: NouveauTicket): Promise<Ticket> {
    // id/creeLe sont gérés par SharePoint (ID auto-incrémenté, Created système) :
    // on ne les utilise pas dans le payload envoyé (toSharePoint ne les inclut pas).
    const brouillon = creerTicket(input, { id: () => "", maintenant: () => new Date() });
    const cree = unwrap(await TicketsService.create(versCreationGeneree(toSharePoint(brouillon))));
    return fromSharePoint(cree);
  }

  async changerStatut(id: string, statut: Statut): Promise<Ticket> {
    // On lit le ticket courant, on applique la machine à états du domaine (qui lève
    // sur une transition interdite), puis on persiste uniquement le statut validé —
    // jamais le statut cible brut envoyé par l'appelant.
    const actuel = unwrap(await TicketsService.get(id));
    const ticketActuel = fromSharePoint(actuel);
    const valide = appliquerTransition(ticketActuel, statut);
    const maj = unwrap(await TicketsService.update(id, versMiseAJourGeneree(miseAJourStatut(valide.statut))));
    return fromSharePoint(maj);
  }

  async supprimer(id: string): Promise<void> {
    // Le delete généré jette son IOperationResult : un échec de suppression n'est pas observable ici.
    await TicketsService.delete(id);
  }
}
