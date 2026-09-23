import { useMemo, useState } from "react";
import { useTickets } from "./hooks/useTickets";
import { InMemoryTicketRepository } from "./data/inMemoryTicketRepository";
import { SharePointTicketRepository } from "./data/sharePointTicketRepository";
import type { TicketRepository } from "./data/ticketRepository";
import { Bandeau, Grille, Page, Titre } from "./design-system";
import { Prochain } from "./components/Prochain";
import { TicketForm } from "./components/TicketForm";
import { TicketList } from "./components/TicketList";
import { StatusFilter } from "./components/StatusFilter";
import { compter, filtrerParStatut, prochainATraiter, type Statut, type Ticket } from "./domain/ticket";
import "./App.css";

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

  return (
    <Page data-theme="comptoir">
      <Titre niveau={1} className="app-titre">
        Guichet des demandes aMP
      </Titre>
      <Grille as="section" mode="deux-colonnes" className="app-affichage">
        <Prochain ticket={prochainATraiter(tickets)} onPrendreEnCharge={(id) => changerStatut(id, "En cours")} />
        <TicketForm onCreer={creer} />
      </Grille>
      <StatusFilter
        valeur={filtre}
        onChange={setFiltre}
        compteurs={{ Tous: tickets.length, ...compter(tickets) }}
      />
      {erreur && (
        <Bandeau ton="erreur" className="app-bandeau">
          {erreur}
        </Bandeau>
      )}
      {chargement ? (
        <p>Chargement…</p>
      ) : (
        <TicketList tickets={visibles} onChangerStatut={changerStatut} onSupprimer={supprimer} />
      )}
    </Page>
  );
}

function demo(): Ticket[] {
  const now = new Date().toISOString();
  return [
    {
      id: "41",
      titre: "VPN inaccessible",
      description: "Impossible de se connecter depuis ce matin, l'erreur indique un délai dépassé.",
      statut: "En cours",
      priorite: "Haute",
      demandeur: "Julien",
      creeLe: now,
    },
    {
      id: "42",
      titre: "Badge d'accès HS",
      description: "Le badge ne déverrouille plus la porte de la salle de réunion du 2e étage.",
      statut: "Nouveau",
      priorite: "Moyenne",
      demandeur: "Sarah",
      creeLe: now,
    },
  ];
}
