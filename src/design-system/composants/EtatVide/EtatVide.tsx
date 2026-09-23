import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./EtatVide.css";

export type EtatVideProps = HTMLAttributes<HTMLParagraphElement>;

export function EtatVide({ className, ...natifs }: EtatVideProps) {
  return <p className={classes("cto-etat-vide", className)} {...natifs} />;
}
