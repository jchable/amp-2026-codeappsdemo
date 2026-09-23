import type { DocComposant } from "../../doc-types";
import { Surface } from "./Surface";

const doc: DocComposant = {
  nom: "Surface",
  resume: "Bloc de contenu à angles arrondis : claire (pointillée) pour un formulaire, creuse pour une zone en retrait.",
  props: [
    { nom: "ton", type: '"claire" | "creuse"', defaut: '"claire"', description: "Fond et couleur de texte." },
    { nom: "as", type: '"div" | "section" | "form"', defaut: '"div"', description: "Balise rendue." },
    { nom: "…natifs", type: "HTMLAttributes<HTMLElement>", description: "className, aria-live, onSubmit (pour form)…" },
  ],
  accessibilite: [
    "Les anneaux de focus des enfants sont adaptés au fond (sombre sur claire, clair sur creuse).",
    "Le texte respecte 4,5 de contraste sur chaque ton, dans les deux thèmes.",
  ],
  aFaire: "Choisir la balise sémantique qui convient (section, form).",
  aEviter: "Imbriquer des surfaces l'une dans l'autre.",
  Demo: () => (
    <>
      <Surface>Surface claire</Surface>
      <Surface ton="creuse">Surface creuse</Surface>
    </>
  ),
};

export default doc;
