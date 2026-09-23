import type { TicketRepository } from "./ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { creerTicket, changerStatut as appliquerTransition } from "../domain/ticket";

/** Impl mémoire : sert aux tests et au dev local sans connexion SharePoint. */
export class InMemoryTicketRepository implements TicketRepository {
  private tickets: Ticket[] = [];
  private seq: number;

  constructor(seed: Ticket[] = []) {
    this.tickets = [...seed];
    // Le compteur démarre après le plus grand id `mem-N` déjà présent dans le seed,
    // pour éviter toute collision si un appelant seed avec ce même format d'id.
    this.seq = seed.reduce((max, t) => {
      const m = /^mem-(\d+)$/.exec(t.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
  }

  async lister(): Promise<Ticket[]> { return [...this.tickets]; }

  async creer(input: NouveauTicket): Promise<Ticket> {
    const t = creerTicket(input, { id: () => `mem-${++this.seq}`, maintenant: () => new Date() });
    this.tickets.push(t);
    return t;
  }

  async changerStatut(id: string, statut: Statut): Promise<Ticket> {
    const i = this.tickets.findIndex((t) => t.id === id);
    if (i < 0) throw new Error(`Ticket introuvable : ${id}`);
    this.tickets[i] = appliquerTransition(this.tickets[i], statut);
    return this.tickets[i];
  }

  /** Suppression toujours autorisée (règle 6). Idempotent : id inconnu = no-op. */
  async supprimer(id: string): Promise<void> {
    this.tickets = this.tickets.filter((t) => t.id !== id);
  }
}
