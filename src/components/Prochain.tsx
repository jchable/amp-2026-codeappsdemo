import type { Ticket } from "../domain/ticket";
import { libelleTransition } from "../domain/ticket";
import { Bouton, Surface, Titre } from "../design-system";
import { numeroTicket, formaterDate } from "./format";
import { tonPriorite } from "./tonPriorite";
import "./Prochain.css";

export function Prochain({
  ticket,
  onPrendreEnCharge,
}: {
  ticket: Ticket | undefined;
  onPrendreEnCharge: (id: string) => void;
}) {
  if (!ticket) {
    return (
      <Surface as="section" ton="creuse" className="app-prochain" aria-live="polite">
        <p className="app-prochain__lib">Prochain à prendre en charge</p>
        <Titre niveau={2} apparence="sous-titre" className="app-prochain__titre">
          Rien en attente. Toutes les demandes sont prises en charge.
        </Titre>
      </Surface>
    );
  }
  return (
    <Surface as="section" ton="creuse" className="app-prochain" aria-live="polite">
      <div>
        <p className="app-prochain__lib">Prochain à prendre en charge</p>
        <div className={`app-prochain__num app-prochain__num--${tonPriorite(ticket.priorite)}`}>
          N° {numeroTicket(ticket.id)}
        </div>
        <Titre niveau={2} apparence="sous-titre" className="app-prochain__titre">
          {ticket.titre}
        </Titre>
        <p className="app-prochain__qui">
          Priorité {ticket.priorite.toLowerCase()}, demandé par {ticket.demandeur} le {formaterDate(ticket.creeLe)}
        </p>
      </div>
      <Bouton
        variante="accent"
        className="app-prochain__action"
        onClick={() => onPrendreEnCharge(ticket.id)}
        aria-label={`${libelleTransition("Nouveau", "En cours")} : ${ticket.titre}`}
      >
        {libelleTransition("Nouveau", "En cours")}
      </Bouton>
    </Surface>
  );
}
