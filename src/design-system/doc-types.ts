import type { ReactElement } from "react";

export type PropDoc = { nom: string; type: string; defaut?: string; description: string };

/** Fiche de documentation d'un composant : exportée par défaut par chaque `<Nom>.doc.tsx`. */
export type DocComposant = {
  nom: string;
  resume: string;
  props: PropDoc[];
  accessibilite: string[];
  aFaire: string;
  aEviter: string;
  /** Rendu comme composant (`<doc.Demo />`), donc les hooks y sont permis. */
  Demo: () => ReactElement;
};
