import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { classes } from "../classes";
import "./Champ.css";

type Commun = { libelle: string; erreur?: string };
type ChampLigneProps = Commun & { multiligne?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;
type ChampMultiligneProps = Commun & { multiligne: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export type ChampProps = ChampLigneProps | ChampMultiligneProps;
export type ElementChamp = HTMLInputElement | HTMLTextAreaElement;

type EnveloppeProps = {
  id: string;
  idErreur: string;
  libelle: string;
  erreur?: string;
  className?: string;
  children: ReactNode;
};

function Enveloppe({ id, idErreur, libelle, erreur, className, children }: EnveloppeProps) {
  return (
    <div className={classes("cto-champ", className)}>
      <label className="cto-champ__libelle" htmlFor={id}>
        {libelle}
      </label>
      {children}
      {erreur && (
        <p className="cto-champ__erreur" id={idErreur}>
          {erreur}
        </p>
      )}
    </div>
  );
}

type ContexteAria = { "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling" };

// Fusionne les attributs ARIA de l'appelant avec ceux de l'erreur : on n'écrase jamais l'aide fournie.
function ariaDuChamp(natifs: ContexteAria, idErreur: string, erreur?: string): ContexteAria {
  const decrit = [natifs["aria-describedby"], erreur ? idErreur : undefined].filter(Boolean).join(" ");
  return {
    "aria-describedby": decrit || undefined,
    "aria-invalid": erreur ? true : natifs["aria-invalid"],
  };
}

// forwardRef ne type qu'un seul élément : la ref est affinée ici, l'appelant ayant choisi `multiligne`.
export const Champ = forwardRef<ElementChamp, ChampProps>(function Champ(props, ref) {
  const id = useId();
  const idErreur = `${id}-erreur`;

  if (props.multiligne) {
    const { libelle, erreur, multiligne: _multiligne, className, ...natifs } = props;
    return (
      <Enveloppe id={id} idErreur={idErreur} libelle={libelle} erreur={erreur} className={className}>
        <textarea
          {...natifs}
          ref={ref as Ref<HTMLTextAreaElement>}
          id={id}
          className="cto-champ__controle"
          {...ariaDuChamp(natifs, idErreur, erreur)}
        />
      </Enveloppe>
    );
  }

  const { libelle, erreur, multiligne: _multiligne, className, ...natifs } = props;
  return (
    <Enveloppe id={id} idErreur={idErreur} libelle={libelle} erreur={erreur} className={className}>
      <input
        {...natifs}
        ref={ref as Ref<HTMLInputElement>}
        id={id}
        className="cto-champ__controle"
        {...ariaDuChamp(natifs, idErreur, erreur)}
      />
    </Enveloppe>
  );
});
