import type { DocComposant } from "../../doc-types";
import { Bandeau } from "./Bandeau";

const doc: DocComposant = {
  nom: "Bandeau",
  resume: "Message pleine largeur qui informe ou signale une erreur.",
  props: [
    { nom: "ton", type: '"info" | "erreur"', defaut: '"info"', description: "Ton du message." },
    { nom: "role", type: "string", description: "Remplace le rôle par défaut (alert pour une erreur, aucun pour une info)." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLDivElement>", description: "className, aria-*…" },
  ],
  accessibilite: [
    'Le ton erreur porte role="alert" : un lecteur d\'écran l\'annonce dès son apparition.',
    "Le message est un texte : il ne dépend pas de la couleur.",
  ],
  aFaire: "Dire ce qui s'est passé et, si possible, quoi faire.",
  aEviter: "Afficher plusieurs bandeaux d'erreur à la fois.",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Bandeau>Initialisation Power Platform…</Bandeau>
      <Bandeau ton="erreur">Power Platform indisponible : délai dépassé.</Bandeau>
    </div>
  ),
};

export default doc;
