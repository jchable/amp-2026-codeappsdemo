import { useMemo, useState } from "react";
import { useTickets } from "./hooks/useTickets";
import { InMemoryTicketRepository } from "./data/inMemoryTicketRepository";
import { SharePointTicketRepository } from "./data/sharePointTicketRepository";
import type { TicketRepository } from "./data/ticketRepository";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { StatusFilter } from "./components/StatusFilter";
import { compter, filtrerParStatut, type Statut, type Ticket } from "./domain/ticket";

// Bascule mémoire <-> SharePoint. En démo, on démarre en mémoire puis on branche SharePoint (Task 11).
const useSharePoint = import.meta.env.VITE_USE_SHAREPOINT === "true";

export default function App() {
  const repo: TicketRepository = useMemo(
    () => (useSharePoint ? new SharePointTicketRepository() : new InMemoryTicketRepository(demo())),
    []
  );
  const { tickets, chargement, erreur, creer, changerStatut, supprimer } = useTickets(repo);
  const [filtre, setFiltre] = useState<Statut | "Tous">("Tous");
  const visibles = filtrerParStatut(tickets, filtre);
  const stats = compter(tickets);

  return (
    <div className="app">
      <header>
        <h1>aMP Tickets</h1>
        <p className="sous">
          Nouveau {stats.Nouveau} · En cours {stats["En cours"]} · Résolu {stats.Résolu}
        </p>
      </header>
      {erreur && <div className="banniere err">{erreur}</div>}
      <div className="colonnes">
        <section>
          <StatusFilter valeur={filtre} onChange={setFiltre} />
          {chargement ? (
            <p>Chargement…</p>
          ) : (
            <TicketList tickets={visibles} onChangerStatut={changerStatut} onSupprimer={supprimer} />
          )}
        </section>
        <aside>
          <TicketForm onCreer={creer} />
        </aside>
      </div>
    </div>
  );
}

function demo(): Ticket[] {
  const now = new Date().toISOString();
  return [
    {
      id: "d1",
      titre: "VPN inaccessible",
      description: "",
      statut: "En cours",
      priorite: "Haute",
      demandeur: "Julien",
      creeLe: now,
    },
    {
      id: "d2",
      titre: "Badge d'accès HS",
      description: "",
      statut: "Nouveau",
      priorite: "Moyenne",
      demandeur: "Sarah",
      creeLe: now,
    },
  ];
}
