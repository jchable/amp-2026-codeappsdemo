import type { Ticket, Statut } from "../domain/ticket";
import { transitionsPossibles } from "../domain/ticket";

export function TicketList({
  tickets,
  onChangerStatut,
  onSupprimer,
}: {
  tickets: Ticket[];
  onChangerStatut: (id: string, s: Statut) => void;
  onSupprimer: (id: string) => void;
}) {
  if (tickets.length === 0) return <p className="vide">Aucun ticket. Créez-en un →</p>;
  return (
    <ul className="liste">
      {tickets.map((t) => (
        <li key={t.id} className={"carte ticket p-" + t.priorite.toLowerCase()}>
          <div className="entete">
            <span className={"badge s-" + t.statut.replace(" ", "").toLowerCase()}>{t.statut}</span>
            <span className="prio">{t.priorite}</span>
          </div>
          <h3>{t.titre}</h3>
          <p className="meta">Demandé par {t.demandeur}</p>
          <div className="actions">
            <select
              value={t.statut}
              onChange={(e) => onChangerStatut(t.id, e.target.value as Statut)}
              aria-label={"Statut de " + t.titre}
            >
              {transitionsPossibles(t.statut).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="lien" onClick={() => onSupprimer(t.id)}>
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
