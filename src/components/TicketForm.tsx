import { useState, type FormEvent } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket, PRIORITES } from "../domain/ticket";

const CLASSE_PRIORITE: Record<Priorite, string> = { Basse: "b", Moyenne: "m", Haute: "h" };

export function TicketForm({ onCreer }: { onCreer: (t: NouveauTicket) => Promise<boolean> }) {
  const [titre, setTitre] = useState("");
  const [demandeur, setDemandeur] = useState("");
  const [description, setDescription] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("Moyenne");
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    const input: NouveauTicket = { titre, demandeur, description, priorite };
    const errs = validerTicket(input);
    setErreurs(errs);
    if (errs.length) return;
    setEnCours(true);
    try {
      if (await onCreer(input)) {
        setTitre("");
        setDemandeur("");
        setDescription("");
        setPriorite("Moyenne");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="bloc" onSubmit={soumettre}>
      <h2>Nouvelle demande</h2>
      <label>
        Titre
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. VPN inaccessible" />
      </label>
      <label>
        Demandeur
        <input value={demandeur} onChange={(e) => setDemandeur(e.target.value)} placeholder="Prénom Nom" />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails utiles pour traiter la demande (optionnel)"
        />
      </label>
      <div className="prios" role="radiogroup" aria-label="Priorité">
        {PRIORITES.map((p) => (
          <label key={p} className={CLASSE_PRIORITE[p]}>
            <input
              type="radio"
              name="priorite"
              value={p}
              checked={priorite === p}
              onChange={() => setPriorite(p)}
            />
            <span>{p}</span>
          </label>
        ))}
      </div>
      {erreurs.map((x) => (
        <p key={x} className="err">
          {x}
        </p>
      ))}
      <button type="submit" className="valider" disabled={enCours}>
        Créer
      </button>
    </form>
  );
}
