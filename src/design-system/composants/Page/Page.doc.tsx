import type { DocComposant } from "../../doc-types";
import { Page } from "./Page";

const doc: DocComposant = {
  nom: "Page",
  resume: "Conteneur centré de largeur maximale 1180 px, avec les marges de page.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLDivElement>", description: 'className, data-theme (pour poser un thème sur la racine de l\'app)…' }],
  accessibilite: ["Conteneur neutre : il ne porte aucun rôle, la structure vient de ses enfants."],
  aFaire: "Une seule Page à la racine de l'écran.",
  aEviter: "Imbriquer des Page.",
  Demo: () => <Page className="doc-demo-ligne">Contenu dans une page centrée</Page>,
};

export default doc;
