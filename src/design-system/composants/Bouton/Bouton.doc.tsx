import type { DocComposant } from "../../doc-types";
import { Bouton } from "./Bouton";

const doc: DocComposant = {
  nom: "Bouton",
  resume: "Déclenche une action. Quatre variantes selon l'importance de l'action.",
  props: [
    { nom: "variante", type: '"primaire" | "accent" | "secondaire" | "discret"', defaut: '"primaire"', description: "Importance visuelle : primaire pour l'action principale, accent pour la mettre en avant sur fond creux, secondaire en contour, discret en lien." },
    { nom: "taille", type: '"normale" | "compacte"', defaut: '"normale"', description: "Compacte pour les actions en série (cartes)." },
    { nom: "pleineLargeur", type: "boolean", defaut: "false", description: "Occupe toute la largeur du conteneur." },
    { nom: "type", type: "string", defaut: '"button"', description: 'Passer "submit" pour envoyer un formulaire : par défaut un bouton ne soumet rien.' },
    { nom: "…natifs", type: "ButtonHTMLAttributes", description: "Tous les attributs natifs (onClick, disabled, aria-*…) sont transmis." },
  ],
  accessibilite: [
    "Vrai élément button : focus clavier, Entrée et Espace natifs.",
    "Cible tactile d'au moins 44 px sur écran tactile.",
    "Quand plusieurs boutons portent le même libellé, ajouter un aria-label qui les distingue (« Supprimer : VPN inaccessible »).",
  ],
  aFaire: "Un seul bouton primaire par zone. Nommer l'action par un verbe (« Créer », « Prendre en charge »).",
  aEviter: "Détourner un bouton en lien de navigation, ou empiler plusieurs boutons accent.",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Bouton>Primaire</Bouton>
      <Bouton variante="accent">Accent</Bouton>
      <Bouton variante="secondaire">Secondaire</Bouton>
      <Bouton variante="discret">Discret</Bouton>
      <Bouton taille="compacte">Compact</Bouton>
      <Bouton disabled>Désactivé</Bouton>
    </div>
  ),
};

export default doc;
