import { useState } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket } from "../domain/ticket";

const PRIORITES: Priorite[] = ["Basse", "Moyenne", "Haute"];

export function TicketForm({ onCreer }: { onCreer: (t: NouveauTicket) => Promise<void> }) {
  const [titre, setTitre] = useState("");
  const [demandeur, setDemandeur] = useState("");
  const [priorite, setPriorite] = useState<Priorite>("Moyenne");
  const [erreurs, setErreurs] = useState<string[]>([]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const input: NouveauTicket = { titre, demandeur, priorite };
    const errs = validerTicket(input);
    setErreurs(errs);
    if (errs.length) return;
    await onCreer(input);
    setTitre(""); setDemandeur(""); setPriorite("Moyenne");
  }

  return (
    <form className="carte form" onSubmit={soumettre}>
      <h2>Nouveau ticket</h2>
      <label>Titre<input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. VPN inaccessible" /></label>
      <label>Demandeur<input value={demandeur} onChange={(e) => setDemandeur(e.target.value)} placeholder="Prénom Nom" /></label>
      <label>Priorité
        <select value={priorite} onChange={(e) => setPriorite(e.target.value as Priorite)}>
          {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      {erreurs.length > 0 && <ul className="erreurs">{erreurs.map((x) => <li key={x}>{x}</li>)}</ul>}
      <button type="submit" className="primaire">Créer</button>
    </form>
  );
}
