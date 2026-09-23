import type { ButtonHTMLAttributes } from "react";
import { classes } from "../classes";
import "./Puce.css";

export type PuceProps = { actif: boolean; compteur?: number } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-pressed"
>;

export function Puce({ actif, compteur, className, children, ...natifs }: PuceProps) {
  return (
    <button type="button" className={classes("cto-puce", className)} {...natifs} aria-pressed={actif}>
      {children}
      {compteur !== undefined && <b className="cto-puce__compteur">{compteur}</b>}
    </button>
  );
}
