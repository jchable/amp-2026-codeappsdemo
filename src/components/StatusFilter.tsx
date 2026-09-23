import type { Statut } from "../domain/ticket";
import { STATUTS } from "../domain/ticket";
import { Puce } from "../design-system";
import "./StatusFilter.css";

export function StatusFilter({
  valeur,
  onChange,
  compteurs,
}: {
  valeur: Statut | "Tous";
  onChange: (s: Statut | "Tous") => void;
  compteurs: Record<Statut | "Tous", number>;
}) {
  const options: (Statut | "Tous")[] = ["Tous", ...STATUTS];
  return (
    <div className="app-filtres" role="group" aria-label="Filtrer par statut">
      {options.map((o) => (
        <Puce key={o} actif={o === valeur} compteur={compteurs[o]} onClick={() => onChange(o)}>
          {o}
        </Puce>
      ))}
    </div>
  );
}
