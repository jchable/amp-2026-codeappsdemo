import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";

/**
 * Adaptateur SharePoint. Tant que `pac code add-data-source` n'a pas été lancé
 * (Task 9) et le mapping écrit (Task 10-11), les appels lèvent une erreur
 * explicite — le reste de l'app reste fonctionnel et testable via l'impl mémoire.
 */
export class SharePointTicketRepository implements TicketRepository {
  private absent(): never {
    throw new Error(
      "Service SharePoint non généré. Lancez `pac code add-data-source` (Task 9) " +
        "puis complétez le mapping (Task 10-11)."
    );
  }

  async lister(): Promise<Ticket[]> {
    return this.absent();
  }

  async creer(_input: NouveauTicket): Promise<Ticket> {
    return this.absent();
  }

  async changerStatut(_id: string, _statut: Statut): Promise<Ticket> {
    return this.absent();
  }

  async supprimer(_id: string): Promise<void> {
    return this.absent();
  }
}
