import { useCallback, useEffect, useState } from "react";
import type { TicketRepository } from "../data/ticketRepository";
import type { Ticket, NouveauTicket, Statut } from "../domain/ticket";
import { trierParPriorite } from "../domain/ticket";

export function useTickets(repo: TicketRepository) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setTickets(trierParPriorite(await repo.lister()));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setChargement(false);
    }
  }, [repo]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  // Chaque mutation capture ses propres erreurs (écriture refusée, réseau, etc.) :
  // sans ce try/catch, un échec de mutation resterait une promesse rejetée invisible
  // pour l'utilisateur (bug trouvé en revue avant implémentation).
  const creer = useCallback(
    async (input: NouveauTicket) => {
      try {
        await repo.creer(input);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  const changerStatut = useCallback(
    async (id: string, s: Statut) => {
      try {
        await repo.changerStatut(id, s);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  const supprimer = useCallback(
    async (id: string) => {
      try {
        await repo.supprimer(id);
        await recharger();
      } catch (e) {
        setErreur(e instanceof Error ? e.message : String(e));
      }
    },
    [repo, recharger]
  );

  return { tickets, chargement, erreur, creer, changerStatut, supprimer, recharger };
}
