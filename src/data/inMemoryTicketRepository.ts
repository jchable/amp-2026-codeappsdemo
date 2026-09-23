import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket, changerStatut } from "../domain/ticket";

/** Impl mémoire : sert aux tests et au dev local sans connexion SharePoint. */
export class InMemoryTicketRepository implements TicketRepository {
  private tickets: Ticket[] = [];
  private seq = 0;
  constructor(seed: Ticket[] = []) { this.tickets = [...seed]; }

  async lister(): Promise<Ticket[]> { return [...this.tickets]; }

  async creer(input: NouveauTicket): Promise<Ticket> {
    const t = creerTicket(input, { id: () => `mem-${++this.seq}`, maintenant: () => new Date() });
    this.tickets.push(t);
    return t;
  }

  async changerStatut(id: string, statut: Statut): Promise<Ticket> {
    const i = this.tickets.findIndex((t) => t.id === id);
    if (i < 0) throw new Error(`Ticket introuvable : ${id}`);
    this.tickets[i] = changerStatut(this.tickets[i], statut);
    return this.tickets[i];
  }

  async supprimer(id: string): Promise<void> {
    this.tickets = this.tickets.filter((t) => t.id !== id);
  }
}
