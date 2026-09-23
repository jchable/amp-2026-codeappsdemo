import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket } from "../domain/ticket";

// ⚠️ Ce service est GÉNÉRÉ par `pac code add-data-source` (ne pas éditer generated/).
//   pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" \
//     -t "Tickets" -d "<URL de site double URL-encodée>"
// L'import ci-dessous devient valide APRÈS génération :
// import { TicketsService } from "../../generated/services/TicketsService";
// import type { Tickets as SpTicket } from "../../generated/models/TicketsModel";

/**
 * Adaptateur SharePoint. Il MAPPE les colonnes de la liste SP <-> le modèle métier,
 * et délègue au service généré. Tant que la génération n'a pas eu lieu, les appels
 * lèvent une erreur explicite (le reste de l'app reste testable via l'impl mémoire).
 */
export class SharePointTicketRepository implements TicketRepository {
  private absent(): never {
    throw new Error(
      "Service SharePoint non généré. Lancez `pac code add-data-source` puis " +
      "décommentez les imports generated/ et le mapping ci-dessous."
    );
  }

  async lister(): Promise<Ticket[]> {
    // const rows = await TicketsService.getAll();
    // return rows.value.map(fromSharePoint);
    return this.absent();
  }

  async creer(input: NouveauTicket): Promise<Ticket> {
    const brouillon = creerTicket(input, { id: () => "", maintenant: () => new Date() });
    // const cree = await TicketsService.create(toSharePoint(brouillon));
    // return fromSharePoint(cree);
    void brouillon;
    return this.absent();
  }

  async changerStatut(_id: string, _statut: Statut): Promise<Ticket> {
    // await TicketsService.update(_id, { Statut: _statut });
    return this.absent();
  }

  async supprimer(_id: string): Promise<void> {
    // await TicketsService.delete(_id);
    return this.absent();
  }
}

// Mapping colonnes SharePoint (Title, SPStatut, ...) <-> domaine :
// function fromSharePoint(r: SpTicket): Ticket { ... }
// function toSharePoint(t: Ticket) { return { Title: t.titre, /* ... */ }; }
