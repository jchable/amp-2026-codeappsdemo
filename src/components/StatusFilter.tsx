import type { Statut } from "../domain/ticket";
import { STATUTS } from "../domain/ticket";

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
    <div className="filtres" role="group" aria-label="Filtrer par statut">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={o === valeur}>
          {o}
          <b>{compteurs[o]}</b>
        </button>
      ))}
    </div>
  );
}
