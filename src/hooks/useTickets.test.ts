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

    let succes: boolean | undefined;
    await act(async () => {
      succes = await result.current.creer({ titre: "Panne VPN", demandeur: "julien" });
    });

    expect(succes).toBe(true);
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

    let succes: boolean | undefined;
    await act(async () => {
      succes = await result.current.creer({ titre: "X", demandeur: "j" });
    });

    expect(succes).toBe(false);
    expect(result.current.erreur).toBe("création refusée");
  });
});

// Une écriture peut réussir côté serveur alors que la lecture de sa réponse échoue :
// après un échec, la liste affichée doit refléter l'état réel (sinon un nouvel essai
// aveugle créerait un doublon). recharger() efface `erreur` : le message de la mutation
// doit donc être posé APRÈS le rechargement.
describe("useTickets — échec d'une mutation : rechargement et erreur conservée", () => {
  function repoAvecMutationEnPanne(message: string) {
    let lectures = 0;
    const panne = async () => {
      throw new Error(message);
    };
    const repo: TicketRepository = {
      lister: async () => {
        lectures += 1;
        return [];
      },
      creer: panne,
      changerStatut: panne,
      supprimer: panne,
    };
    return { repo, lectures: () => lectures };
  }

  it("creer : recharge la liste, affiche l'erreur et résout false", async () => {
    const { repo, lectures } = repoAvecMutationEnPanne("création refusée");
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(lectures()).toBe(1);

    let succes: boolean | undefined;
    await act(async () => {
      succes = await result.current.creer({ titre: "X", demandeur: "j" });
    });

    expect(succes).toBe(false);
    expect(lectures()).toBe(2);
    expect(result.current.erreur).toBe("création refusée");
  });

  it("changerStatut : recharge la liste et affiche l'erreur", async () => {
    const { repo, lectures } = repoAvecMutationEnPanne("transition refusée");
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.changerStatut("1", "En cours");
    });

    expect(lectures()).toBe(2);
    expect(result.current.erreur).toBe("transition refusée");
  });

  it("supprimer : recharge la liste et affiche l'erreur", async () => {
    const { repo, lectures } = repoAvecMutationEnPanne("suppression refusée");
    const { result } = renderHook(() => useTickets(repo));
    await waitFor(() => expect(result.current.chargement).toBe(false));

    await act(async () => {
      await result.current.supprimer("1");
    });

    expect(lectures()).toBe(2);
    expect(result.current.erreur).toBe("suppression refusée");
  });
});
