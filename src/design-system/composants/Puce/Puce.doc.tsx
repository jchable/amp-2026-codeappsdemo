import { useState } from "react";
import type { DocComposant } from "../../doc-types";
import { Puce } from "./Puce";

function Demo() {
  const [actif, setActif] = useState("Tous");
  const valeurs: Array<[string, number]> = [["Tous", 8], ["Nouveau", 3], ["Résolu", 0]];
  return (
    <div className="doc-demo-ligne" role="group" aria-label="Exemple de filtre">
      {valeurs.map(([nom, compteur]) => (
        <Puce key={nom} actif={actif === nom} compteur={compteur} onClick={() => setActif(nom)}>
          {nom}
        </Puce>
      ))}
    </div>
  );
}

const doc: DocComposant = {
  nom: "Puce",
  resume: "Bouton à bascule pour filtrer ou sélectionner, avec un compteur optionnel.",
  props: [
    { nom: "actif", type: "boolean", description: "État de la bascule, exposé par aria-pressed." },
    { nom: "compteur", type: "number", description: "Nombre affiché à droite du libellé ; 0 s'affiche." },
    { nom: "…natifs", type: "ButtonHTMLAttributes", description: "onClick, aria-*…" },
  ],
  accessibilite: [
    "aria-pressed annonce l'état aux lecteurs d'écran ; l'état actif change aussi de fond, pas seulement de bordure.",
    "Cible d'au moins 44 px sur écran tactile.",
    "Regrouper les puces dans un élément role group nommé.",
  ],
  aFaire: "Une puce par valeur de filtre, dans un groupe nommé.",
  aEviter: "Utiliser une puce pour une navigation entre pages.",
  Demo,
};

export default doc;
