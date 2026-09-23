import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { Champ } from "./Champ";

const doc: DocComposant = {
  nom: "Champ",
  resume: "Champ de saisie avec son libellé, sur une ou plusieurs lignes, et un message d'erreur relié.",
  props: [
    { nom: "libelle", type: "string", description: "Texte du libellé, relié au champ par htmlFor." },
    { nom: "erreur", type: "string", description: "Message d'erreur : marque le champ invalide et le relie par aria-describedby. (Pas encore utilisé par l'app : les messages du domaine ne sont pas rattachés à un champ.)" },
    { nom: "multiligne", type: "boolean", defaut: "false", description: "Rend un textarea au lieu d'un input." },
    { nom: "…natifs", type: "InputHTMLAttributes | TextareaHTMLAttributes", description: "value, onChange, placeholder, etc. La ref est transmise à l'élément natif." },
  ],
  accessibilite: [
    "Le libellé est un vrai label : cliquer dessus donne le focus au champ, un lecteur d'écran l'annonce.",
    "Une erreur ajoute aria-invalid et aria-describedby ; le texte ne dépend pas de la couleur.",
    "Hauteur d'au moins 44 px sur écran tactile.",
  ],
  aFaire: "Un libellé court et permanent ; le placeholder n'est qu'un exemple.",
  aEviter: "Remplacer le libellé par le placeholder, qui disparaît à la saisie.",
  Demo: () => (
    <Surface>
      <Champ libelle="Titre" placeholder="Ex. VPN inaccessible" />
      <Champ libelle="Demandeur" erreur="Le demandeur est obligatoire." />
      <Champ libelle="Description" multiligne placeholder="Détails utiles (optionnel)" />
    </Surface>
  ),
};

export default doc;
