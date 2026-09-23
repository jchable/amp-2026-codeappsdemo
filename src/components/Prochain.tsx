import type { Ticket } from "../domain/ticket";
import { libelleTransition } from "../domain/ticket";
import { numeroTicket, formaterDate } from "./format";

export function Prochain({
  ticket,
  onPrendreEnCharge,
}: {
  ticket: Ticket | undefined;
  onPrendreEnCharge: (id: string) => void;
}) {
  if (!ticket) {
    return (
      <section className="prochain" aria-live="polite">
        <p className="lib">Prochain à prendre en charge</p>
        <h2>Rien en attente. Toutes les demandes sont prises en charge.</h2>
      </section>
    );
  }
  return (
    <section className="prochain" aria-live="polite">
      <div>
        <p className="lib">Prochain à prendre en charge</p>
        <div className={"num " + ticket.priorite.toLowerCase()}>N° {numeroTicket(ticket.id)}</div>
        <h2>{ticket.titre}</h2>
        <p className="qui">
          Priorité {ticket.priorite.toLowerCase()}, demandé par {ticket.demandeur} le {formaterDate(ticket.creeLe)}
        </p>
      </div>
      <button
        type="button"
        className="bouton"
        onClick={() => onPrendreEnCharge(ticket.id)}
        aria-label={`${libelleTransition("Nouveau", "En cours")} : ${ticket.titre}`}
      >
        {libelleTransition("Nouveau", "En cours")}
      </button>
    </section>
  );
}
