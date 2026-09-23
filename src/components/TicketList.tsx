import { useId, useState } from "react";
import type { Ticket, Statut } from "../domain/ticket";
import { transitionsPossibles, libelleTransition } from "../domain/ticket";
import { numeroTicket, formaterDate } from "./format";

type Props = {
  tickets: Ticket[];
  onChangerStatut: (id: string, s: Statut) => void;
  onSupprimer: (id: string) => void;
};

function classeSouche(t: Ticket): string {
  return t.statut === "Résolu" ? "resolu" : t.priorite.toLowerCase();
}

function Souche({ ticket: t, onChangerStatut, onSupprimer }: { ticket: Ticket } & Omit<Props, "tickets">) {
  const [depliee, setDepliee] = useState(false);
  const idDescription = useId();
  const cibles = transitionsPossibles(t.statut).filter((s) => s !== t.statut);
  return (
    <article className={"souche " + classeSouche(t)}>
      <div className="tete">
        <span className="n">N° {numeroTicket(t.id)}</span>
        <span className="tampon">{t.statut}</span>
      </div>
      <div className="corps">
        <h3>{t.titre}</h3>
        <div className="qui">
          {t.demandeur}, {formaterDate(t.creeLe)}
        </div>
        {t.description && (
          <button
            type="button"
            className="voir"
            aria-expanded={depliee}
            aria-controls={idDescription}
            onClick={() => setDepliee(!depliee)}
          >
            {depliee ? "Masquer la description" : "Voir la description"}
          </button>
        )}
        {t.description && depliee && (
          <p className="desc" id={idDescription}>
            {t.description}
          </p>
        )}
        <div className="pr">Priorité {t.priorite.toLowerCase()}</div>
        <div className="actions">
          {cibles.map((vers, i) => {
            const libelle = libelleTransition(t.statut, vers);
            return (
              <button
                key={vers}
                type="button"
                className={i === 0 ? undefined : "autre"}
                aria-label={`${libelle} : ${t.titre}`}
                onClick={() => onChangerStatut(t.id, vers)}
              >
                {libelle}
              </button>
            );
          })}
          <button
            type="button"
            className="suppr"
            aria-label={`Supprimer : ${t.titre}`}
            onClick={() => onSupprimer(t.id)}
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}

export function TicketList({ tickets, onChangerStatut, onSupprimer }: Props) {
  if (tickets.length === 0) return <p className="vide">Aucune demande ici pour le moment.</p>;
  return (
    <ul className="souches">
      {tickets.map((t) => (
        <li key={t.id}>
          <Souche ticket={t} onChangerStatut={onChangerStatut} onSupprimer={onSupprimer} />
        </li>
      ))}
    </ul>
  );
}
