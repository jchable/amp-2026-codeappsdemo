import type { Statut } from "../domain/ticket";
import { STATUTS } from "../domain/ticket";

export function StatusFilter({
  valeur,
  onChange,
}: {
  valeur: Statut | "Tous";
  onChange: (s: Statut | "Tous") => void;
}) {
  const options: (Statut | "Tous")[] = ["Tous", ...STATUTS];
  return (
    <div className="filtre" role="tablist" aria-label="Filtrer par statut">
      {options.map((o) => (
        <button
          key={o}
          className={"pill" + (o === valeur ? " actif" : "")}
          onClick={() => onChange(o)}
          aria-pressed={o === valeur}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
