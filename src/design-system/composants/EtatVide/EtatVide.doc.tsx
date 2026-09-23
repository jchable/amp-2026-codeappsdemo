import type { DocComposant } from "../../doc-types";
import { EtatVide } from "./EtatVide";

const doc: DocComposant = {
  nom: "EtatVide",
  resume: "Message affiché quand une liste ne contient rien.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLParagraphElement>", description: "className, aria-live… ; le contenu est libre." }],
  accessibilite: ["Rendu comme un paragraphe : lu dans l'ordre normal de la page."],
  aFaire: "Dire pourquoi c'est vide et, si utile, comment y remédier.",
  aEviter: "Laisser une zone blanche sans explication.",
  Demo: () => <EtatVide>Aucune demande ici pour le moment.</EtatVide>,
};

export default doc;
