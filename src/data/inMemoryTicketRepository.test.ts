import { describe, it, expect } from "vitest";
import type { Ticket } from "../domain/ticket";
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

  it("changerStatut lève pour un id inconnu", async () => {
    const repo = new InMemoryTicketRepository();
    await expect(repo.changerStatut("inconnu", "En cours")).rejects.toThrow("Ticket introuvable");
  });

  it("supprime un ticket au statut Nouveau", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprime un ticket même s'il est En cours (règle 6)", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.changerStatut(t.id, "En cours");
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprime un ticket même s'il est Résolu (règle 6)", async () => {
    const repo = new InMemoryTicketRepository();
    const t = await repo.creer({ titre: "X", demandeur: "j" });
    await repo.changerStatut(t.id, "En cours");
    await repo.changerStatut(t.id, "Résolu");
    await repo.supprimer(t.id);
    expect(await repo.lister()).toHaveLength(0);
  });

  it("supprimer un id inconnu ne lève pas et laisse la liste inchangée", async () => {
    const repo = new InMemoryTicketRepository();
    await repo.creer({ titre: "X", demandeur: "j" });
    await expect(repo.supprimer("inconnu")).resolves.toBeUndefined();
    expect(await repo.lister()).toHaveLength(1);
  });

  it("évite les collisions d'id quand le seed contient déjà des ids mem-N", async () => {
    const seed: Ticket[] = [
      {
        id: "mem-1",
        titre: "Existant",
        description: "",
        statut: "Nouveau",
        priorite: "Moyenne",
        demandeur: "j",
        creeLe: "2026-09-23T08:00:00Z",
      },
    ];
    const repo = new InMemoryTicketRepository(seed);
    const nouveau = await repo.creer({ titre: "Nouveau", demandeur: "j" });
    expect(nouveau.id).not.toBe("mem-1");
    expect(nouveau.id).toBe("mem-2");
  });
});
