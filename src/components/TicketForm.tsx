import { useState, type FormEvent } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket, PRIORITES } from "../domain/ticket";

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
    <form className="carte form" onSubmit={soumettre}>
      <h2>Nouveau ticket</h2>
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
      <label>
        Priorité
        <select value={priorite} onChange={(e) => setPriorite(e.target.value as Priorite)}>
          {PRIORITES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      {erreurs.length > 0 && (
        <ul className="erreurs">
          {erreurs.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
      <button type="submit" className="primaire" disabled={enCours}>
        Créer
      </button>
    </form>
  );
}
