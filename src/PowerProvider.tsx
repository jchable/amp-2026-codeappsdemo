import { useEffect, useState, type ReactNode } from "react";
import { getContext } from "@microsoft/power-apps/app";
import { Bandeau } from "./design-system";

// Même logique de bascule que App.tsx (Step 3) : en mode mémoire, aucune dépendance
// à un hôte Power Apps n'est nécessaire, donc aucun appel SDK n'est fait ici.
const useSharePoint = import.meta.env.VITE_USE_SHAREPOINT === "true";

/**
 * En mode SharePoint : attend que le contexte Power Platform soit disponible
 * AVANT d'afficher les composants qui accèdent aux données.
 * En mode mémoire : rend `children` immédiatement, sans jamais appeler le SDK
 * (`npm run dev` seul doit suffire — voir CLAUDE.md § Pièges connus).
 */
export function PowerProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(!useSharePoint);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!useSharePoint) return;
    getContext()
      .then(() => setPret(true))
      .catch((e: unknown) => setErreur(e instanceof Error ? e.message : String(e)));
  }, []);

  if (erreur) return <Bandeau ton="erreur">Power Platform indisponible : {erreur}</Bandeau>;
  if (!pret) return <Bandeau>Initialisation Power Platform…</Bandeau>;
  return <>{children}</>;
}
