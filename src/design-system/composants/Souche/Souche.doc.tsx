import type { DocComposant } from "../../doc-types";
import { Bouton } from "../Bouton/Bouton";
import { Tampon } from "../Tampon/Tampon";
import { Titre } from "../Titre/Titre";
import { Souche } from "./Souche";

const doc: DocComposant = {
  nom: "Souche",
  resume: "Carte à encoches, comme la souche d'un ticket de guichet, colorée selon son ton.",
  props: [
    { nom: "ton", type: '"haute" | "moyenne" | "basse" | "neutre"', description: "Couleur de fond. neutre sert aux éléments clos." },
    { nom: "numero", type: "ReactNode", description: "Numéro affiché en grand, en haut à gauche." },
    { nom: "tampon", type: "ReactNode", description: "Emplacement du tampon, en haut à droite (facultatif)." },
    { nom: "children", type: "ReactNode", description: "Corps de la souche, sous la ligne pointillée." },
  ],
  accessibilite: [
    "Rendue comme un article. La couleur seule ne dit pas la priorité : le contenu doit l'écrire en toutes lettres.",
    "Texte à l'encre foncée, 5,8 de contraste au minimum sur chaque ton.",
    "En thème Jour, un contour rend les bords visibles sur la page claire.",
  ],
  aFaire: "Écrire la priorité dans le corps (« Priorité haute »).",
  aEviter: "Compter sur le seul ton pour transmettre l'urgence.",
  Demo: () => (
    <Souche ton="moyenne" numero="N° 42" tampon={<Tampon>Nouveau</Tampon>}>
      <Titre niveau={4} apparence="carte">Badge d'accès HS</Titre>
      <p>Priorité moyenne</p>
      <Bouton taille="compacte">Prendre en charge</Bouton>
    </Souche>
  ),
};

export default doc;
