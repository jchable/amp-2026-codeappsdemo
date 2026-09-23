import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";

/** Contrat d'accès aux données. Les composants ne dépendent QUE de ceci. */
export interface TicketRepository {
  lister(): Promise<Ticket[]>;
  creer(input: NouveauTicket): Promise<Ticket>;
  changerStatut(id: string, statut: Statut): Promise<Ticket>;
  supprimer(id: string): Promise<void>;
}
