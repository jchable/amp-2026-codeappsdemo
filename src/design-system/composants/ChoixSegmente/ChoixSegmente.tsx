import { classes } from "../classes";
import type { TonPriorite } from "../ton";
import "./ChoixSegmente.css";

export type OptionChoix<V extends string> = { valeur: V; libelle: string; ton?: TonPriorite };

export type ChoixSegmenteProps<V extends string> = {
  legende: string;
  nom: string;
  valeur: V;
  options: ReadonlyArray<OptionChoix<V>>;
  onChange: (valeur: V) => void;
  className?: string;
};

export function ChoixSegmente<V extends string>({
  legende,
  nom,
  valeur,
  options,
  onChange,
  className,
}: ChoixSegmenteProps<V>) {
  return (
    <div role="radiogroup" aria-label={legende} className={classes("cto-choix", className)}>
      {options.map((option) => (
        <label
          key={option.valeur}
          className={classes("cto-choix__option", option.ton && `cto-choix__option--${option.ton}`)}
        >
          <input
            type="radio"
            name={nom}
            value={option.valeur}
            checked={valeur === option.valeur}
            onChange={() => onChange(option.valeur)}
          />
          <span>{option.libelle}</span>
        </label>
      ))}
    </div>
  );
}
