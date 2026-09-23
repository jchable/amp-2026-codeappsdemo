import { useId, useState } from "react";
import type { Ticket, Statut } from "../domain/ticket";
import { transitionsPossibles, libelleTransition } from "../domain/ticket";
import { Bouton, EtatVide, Grille, Souche, Tampon, Titre, type TonPriorite } from "../design-system";
import { numeroTicket, formaterDate } from "./format";
import { tonPriorite } from "./tonPriorite";
import "./TicketList.css";

type Props = {
  tickets: Ticket[];
  onChangerStatut: (id: string, s: Statut) => void;
  onSupprimer: (id: string) => void;
};

function tonSouche(t: Ticket): TonPriorite {
  return t.statut === "Résolu" ? "neutre" : tonPriorite(t.priorite);
}

function CarteTicket({ ticket: t, onChangerStatut, onSupprimer }: { ticket: Ticket } & Omit<Props, "tickets">) {
  const [depliee, setDepliee] = useState(false);
  const idDescription = useId();
  const cibles = transitionsPossibles(t.statut).filter((s) => s !== t.statut);
  return (
    <Souche
      ton={tonSouche(t)}
      numero={`N° ${numeroTicket(t.id)}`}
      // La classe « tampon » n'a aucun style : elle garde le test existant (selector ".tampon") inchangé.
      tampon={<Tampon className="tampon">{t.statut}</Tampon>}
    >
      <Titre niveau={3} apparence="carte" className="app-ticket__titre">
        {t.titre}
      </Titre>
      <div className="app-ticket__qui">
        {t.demandeur}, {formaterDate(t.creeLe)}
      </div>
      {t.description && (
        <Bouton
          variante="discret"
          taille="compacte"
          className="app-ticket__voir"
          aria-label={`${depliee ? "Masquer" : "Voir"} la description : ${t.titre}`}
          aria-expanded={depliee}
          aria-controls={idDescription}
          onClick={() => setDepliee(!depliee)}
        >
          {depliee ? "Masquer la description" : "Voir la description"}
        </Bouton>
      )}
      {t.description && depliee && (
        <p className="app-ticket__desc" id={idDescription}>
          {t.description}
        </p>
      )}
      <div className="app-ticket__priorite">Priorité {t.priorite.toLowerCase()}</div>
      <div className="app-ticket__actions">
        {cibles.map((vers, i) => {
          const libelle = libelleTransition(t.statut, vers);
          return (
            <Bouton
              key={vers}
              taille="compacte"
              variante={i === 0 ? "primaire" : "secondaire"}
              aria-label={`${libelle} : ${t.titre}`}
              onClick={() => onChangerStatut(t.id, vers)}
            >
              {libelle}
            </Bouton>
          );
        })}
        <Bouton
          variante="discret"
          taille="compacte"
          className="app-ticket__suppr"
          aria-label={`Supprimer : ${t.titre}`}
          onClick={() => onSupprimer(t.id)}
        >
          Supprimer
        </Bouton>
      </div>
    </Souche>
  );
}

export function TicketList({ tickets, onChangerStatut, onSupprimer }: Props) {
  if (tickets.length === 0) return <EtatVide>Aucune demande ici pour le moment.</EtatVide>;
  return (
    <Grille as="ul" mode="auto">
      {tickets.map((t) => (
        <li key={t.id}>
          <CarteTicket ticket={t} onChangerStatut={onChangerStatut} onSupprimer={onSupprimer} />
        </li>
      ))}
    </Grille>
  );
}
