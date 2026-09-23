import { describe, it, expect } from "vitest";
import { InMemoryTicketRepository } from "./inMemoryTicketRepository";

describe("InMemoryTicketRepository", () => {
  it("crée puis liste un ticket", async () => {
    const repo = new InMemoryTicketRepository();
    await repo.creer({ titre: "Panne VPN", demandeur: "julien", priorite: "Haute" });
    const tickets = await repo.lister();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].statut).toBe("Nouveau");
  });

  it("change le statut d'un ticket existant", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "Panne VPN", demandeur: "julien" });
    const maj = await repo.changerStatut(t.id, "En cours");
    expect(maj.statut).toBe("En cours");
  });

  it("supprime un ticket", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });
});
