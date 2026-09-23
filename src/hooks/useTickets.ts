import { useCallback, useEffect, useState } from "react";
import type { TicketRepository } from "../data/ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { trierParPriorite } from "../domain/ticket";

export function useTickets(repo: TicketRepository) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true); setErreur(null);
    try { setTickets(trierParPriorite(await repo.lister())); }
    catch (e) { setErreur(e instanceof Error ? e.message : String(e)); }
    finally { setChargement(false); }
  }, [repo]);

  useEffect(() => { void recharger(); }, [recharger]);

  const creer = useCallback(async (input: NouveauTicket) => { await repo.creer(input); await recharger(); }, [repo, recharger]);
  const changerStatut = useCallback(async (id: string, s: Statut) => { await repo.changerStatut(id, s); await recharger(); }, [repo, recharger]);
  const supprimer = useCallback(async (id: string) => { await repo.supprimer(id); await recharger(); }, [repo, recharger]);

  return { tickets, chargement, erreur, creer, changerStatut, supprimer, recharger };
}
