import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTickets } from "./useTickets";
import { InMemoryTicketRepository } from "../data/inMemoryTicketRepository";
import type { TicketRepository } from "../data/ticketRepository";

describe("useTickets", () => {
  it("charge la liste au montage puis recharge après création", async () => {
    const repo = new InMemoryTicketRepository();
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(result.current.tickets).toHaveLength(0);

    await act(async () => {
      await result.current.creer({ titre: "Panne VPN", demandeur: "julien" });
    });

    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.erreur).toBeNull();
  });

  it("recharge après changement de statut et après suppression", async () => {
    const repo = new InMemoryTicketRepository();
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.creer({ titre: "X", demandeur: "j" });
    });
    const id = result.current.tickets[0].id;

    await act(async () => {
      await result.current.changerStatut(id, "En cours");
    });
    expect(result.current.tickets[0].statut).toBe("En cours");

    await act(async () => {
      await result.current.supprimer(id);
    });
    expect(result.current.tickets).toHaveLength(0);
  });

  it("expose une erreur si le chargement initial échoue", async () => {
    const repoEnPanne: TicketRepository = {
      lister: async () => {
        throw new Error("réseau indisponible");
      },
      creer: async () => {
        throw new Error("non utilisé");
      },
      changerStatut: async () => {
        throw new Error("non utilisé");
      },
      supprimer: async () => {
        throw new Error("non utilisé");
      },
    };
    const { result } = renderHook(() => useTickets(repoEnPanne));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(result.current.erreur).toBe("réseau indisponible");
  });

  it("expose une erreur si une mutation (création) échoue, sans lever pour l'appelant", async () => {
    const repoMutationEnPanne: TicketRepository = {
      lister: async () => [],
      creer: async () => {
        throw new Error("création refusée");
      },
      changerStatut: async () => {
        throw new Error("non utilisé");
      },
      supprimer: async () => {
        throw new Error("non utilisé");
      },
    };
    const { result } = renderHook(() => useTickets(repoMutationEnPanne));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.creer({ titre: "X", demandeur: "j" });
    });

    expect(result.current.erreur).toBe("création refusée");
  });
});
