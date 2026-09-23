import { useEffect, useState, type ReactNode } from "react";
import { getContext } from "@microsoft/power-apps/app";

/**
 * Attend que le contexte Power Platform soit disponible AVANT d'afficher
 * les composants qui accèdent aux données (SharePoint).
 * NB : selon la version du template généré par `pac code init`, l'amorçage
 * peut aussi passer par un PowerProvider généré — aligner si besoin.
 */
export function PowerProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    getContext()
      .then(() => setPret(true))
      .catch((e: unknown) => setErreur(e instanceof Error ? e.message : String(e)));
  }, []);

  if (erreur) return <div className="banniere err">Power Platform indisponible : {erreur}</div>;
  if (!pret) return <div className="banniere">Initialisation Power Platform…</div>;
  return <>{children}</>;
}
