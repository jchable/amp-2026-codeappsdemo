import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { Grille } from "./Grille";

const doc: DocComposant = {
  nom: "Grille",
  resume: "Dispose ses enfants en grille : deux colonnes (une seule sous 860 px) ou colonnes automatiques.",
  props: [
    { nom: "mode", type: '"deux-colonnes" | "auto"', description: "deux-colonnes : 1,5 fr / 1 fr, une colonne sous 860 px. auto : autant de colonnes de 270 px minimum que la largeur en permet." },
    { nom: "as", type: '"div" | "section" | "ul"', defaut: '"div"', description: "Balise rendue ; avec ul, les enfants sont des li." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLElement>", description: "className, aria-*…" },
  ],
  accessibilite: ["Avec as=\"ul\", la liste garde sa sémantique pour les lecteurs d'écran.", "L'ordre du DOM est l'ordre de lecture : ne pas s'appuyer sur la disposition visuelle."],
  aFaire: "Utiliser as=\"ul\" pour une collection d'éléments comparables.",
  aEviter: "Compter sur la grille pour réordonner visuellement le contenu.",
  Demo: () => (
    <Grille mode="auto" as="ul">
      {["Un", "Deux", "Trois"].map((n) => (
        <li key={n}>
          <Surface>{n}</Surface>
        </li>
      ))}
    </Grille>
  ),
};

export default doc;
