import { useState } from "react";
import type { DocComposant } from "../../doc-types";
import { Surface } from "../Surface/Surface";
import { ChoixSegmente, type OptionChoix } from "./ChoixSegmente";

const OPTIONS: OptionChoix<string>[] = [
  { valeur: "basse", libelle: "Basse", ton: "basse" },
  { valeur: "moyenne", libelle: "Moyenne", ton: "moyenne" },
  { valeur: "haute", libelle: "Haute", ton: "haute" },
];

function Demo() {
  const [valeur, setValeur] = useState("moyenne");
  return (
    <Surface>
      <ChoixSegmente legende="Priorité" nom="demo-priorite" valeur={valeur} options={OPTIONS} onChange={setValeur} />
    </Surface>
  );
}

const doc: DocComposant = {
  nom: "ChoixSegmente",
  resume: "Choix exclusif parmi quelques options colorées, présenté en segments.",
  props: [
    { nom: "legende", type: "string", description: "Nom du groupe, lu par les lecteurs d'écran." },
    { nom: "nom", type: "string", description: "Attribut name partagé par les radios." },
    { nom: "valeur", type: "V extends string", description: "Valeur actuellement choisie." },
    { nom: "options", type: "{ valeur: V; libelle: string; ton?: TonPriorite }[]", description: "Les options ; ton colore le segment." },
    { nom: "onChange", type: "(valeur: V) => void", description: "Appelé avec la valeur choisie." },
  ],
  accessibilite: [
    "role radiogroup nommé par la légende, radios natifs : flèches et arrêt de tabulation unique gérés par le navigateur.",
    "L'option choisie se voit par une bordure et un liseré, pas seulement par sa couleur.",
    "Cibles d'au moins 44 px sur écran tactile.",
  ],
  aFaire: "Réserver ce composant à 2 à 5 options courtes.",
  aEviter: "L'utiliser pour une liste longue : préférer une liste déroulante.",
  Demo,
};

export default doc;
