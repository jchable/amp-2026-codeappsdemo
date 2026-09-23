import { useState, type ChangeEvent, type FormEvent } from "react";
import type { NouveauTicket, Priorite } from "../domain/ticket";
import { validerTicket, PRIORITES } from "../domain/ticket";
import { Bouton, Champ, ChoixSegmente, Surface, Titre, type OptionChoix } from "../design-system";
import { tonPriorite } from "./tonPriorite";
import "./TicketForm.css";

const OPTIONS_PRIORITE: OptionChoix<Priorite>[] = PRIORITES.map((p) => ({
  valeur: p,
  libelle: p,
  ton: tonPriorite(p),
}));

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
    <Surface as="form" className="app-ticket-form" onSubmit={soumettre}>
      <Titre niveau={2}>Nouvelle demande</Titre>
      <Champ
        libelle="Titre"
        value={titre}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitre(e.target.value)}
        placeholder="Ex. VPN inaccessible"
      />
      <Champ
        libelle="Demandeur"
        value={demandeur}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDemandeur(e.target.value)}
        placeholder="Prénom Nom"
      />
      <Champ
        libelle="Description"
        multiligne
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        placeholder="Détails utiles pour traiter la demande (optionnel)"
      />
      <ChoixSegmente
        legende="Priorité"
        nom="priorite"
        valeur={priorite}
        options={OPTIONS_PRIORITE}
        onChange={setPriorite}
      />
      {erreurs.map((x) => (
        <p key={x} className="app-ticket-form__err">
          {x}
        </p>
      ))}
      <Bouton type="submit" pleineLargeur disabled={enCours}>
        Créer
      </Bouton>
    </Surface>
  );
}
