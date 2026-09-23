# Plan d'implémentation (sortie de `writing-plans`)

Tâches courtes (2–5 min), testables, dans l'ordre. ✅ = déjà fait dans ce repo amorcé.

1. ✅ **Domaine** `src/domain/ticket.ts` — types + `validerTicket`, `creerTicket`, `changerStatut`, `filtrerParStatut`, `trierParPriorite`, `compter`.
2. ✅ **Tests domaine** `ticket.test.ts` — RED→GREEN sur les règles 1–5.
3. ✅ **Contrat** `data/ticketRepository.ts` + impl mémoire + tests.
4. ✅ **Hook** `useTickets` — chargement, création, changement de statut, suppression.
5. ✅ **UI** `TicketList`, `TicketForm`, `StatusFilter`, `App`, styles.
6. ⏳ **Brancher SharePoint** — `pac code add-data-source` puis compléter `sharePointTicketRepository.ts` (mapping + appels service généré).
7. ⏳ **Recette** — vérifier CRUD bout-en-bout sur la liste réelle.
8. ⏳ **Déploiement** — `pac code push`.

> Étapes 1–5 = le socle testé (le « garde-fou »). 6–8 = le branchement plateforme, fait en live.
