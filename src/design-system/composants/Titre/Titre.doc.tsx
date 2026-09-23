import type { DocComposant } from "../../doc-types";
import { Titre } from "./Titre";

const doc: DocComposant = {
  nom: "Titre",
  resume: "Titre dont le niveau sémantique (h1 à h4) est indépendant de son apparence.",
  props: [
    { nom: "niveau", type: "1 | 2 | 3 | 4", description: "Balise rendue : h1, h2, h3 ou h4." },
    { nom: "apparence", type: '"marque" | "sous-titre" | "carte"', defaut: '"marque"', description: "Rendu visuel : marque (Unbounded), sous-titre (22 px), carte (17 px)." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLHeadingElement>", description: "id, className…" },
  ],
  accessibilite: [
    "Choisir le niveau selon la structure du document, jamais selon la taille voulue : c'est le rôle d'apparence.",
    "Ne pas sauter de niveau (h1 puis h3).",
  ],
  aFaire: "Un seul h1 par page.",
  aEviter: "Choisir un h4 « parce qu'il est plus petit ».",
  Demo: () => (
    <div className="doc-demo-ligne">
      <Titre niveau={2}>Marque</Titre>
      <Titre niveau={2} apparence="sous-titre">Sous-titre</Titre>
      <Titre niveau={2} apparence="carte">Carte</Titre>
    </div>
  ),
};

export default doc;
