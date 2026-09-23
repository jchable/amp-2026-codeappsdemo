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
  // sans ce try/catch, un échec resterait une promesse rejetée invisible pour l'utilisateur.
  // Après un échec on recharge quand même : l'écriture a pu réussir côté serveur alors que
  // la lecture de sa réponse échoue, et un nouvel essai aveugle créerait un doublon.
  // recharger() efface `erreur` : le message de la mutation est donc posé APRÈS le rechargement.
  const muter = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
      } catch (e) {
        await recharger();
        setErreur(e instanceof Error ? e.message : String(e));
        return false;
      }
      await recharger();
      return true;
    },
    [recharger]
  );

  const creer = useCallback(
    (input: NouveauTicket): Promise<boolean> => muter(() => repo.creer(input)),
    [repo, muter]
  );

  const changerStatut = useCallback(
    async (id: string, s: Statut) => {
      await muter(() => repo.changerStatut(id, s));
    },
    [repo, muter]
  );

  const supprimer = useCallback(
    async (id: string) => {
      await muter(() => repo.supprimer(id));
    },
    [repo, muter]
  );

  return { tickets, chargement, erreur, creer, changerStatut, supprimer, recharger };
}
