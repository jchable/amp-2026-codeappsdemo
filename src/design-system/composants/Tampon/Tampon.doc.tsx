import type { DocComposant } from "../../doc-types";
import { Souche } from "../Souche/Souche";
import { Tampon } from "./Tampon";

const doc: DocComposant = {
  nom: "Tampon",
  resume: "Mention courte inclinée, comme un tampon d'encre, pour un statut.",
  props: [{ nom: "…natifs", type: "HTMLAttributes<HTMLSpanElement>", description: "className, title, aria-*… ; le contenu est libre." }],
  accessibilite: [
    "Le tampon est du texte : il est lu tel quel. Ne pas s'en servir comme seule marque d'un état.",
    "Il reprend la couleur du texte de son conteneur (bordure et texte en currentColor).",
  ],
  aFaire: "Un mot ou deux : un statut.",
  aEviter: "Y mettre une phrase ou une action cliquable.",
  Demo: () => (
    <Souche ton="basse" numero="N° 12" tampon={<Tampon>Nouveau</Tampon>}>
      <p>Le tampon vit dans la tête d'une souche.</p>
    </Souche>
  ),
};

export default doc;
