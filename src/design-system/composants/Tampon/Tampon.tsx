import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Tampon.css";

export type TamponProps = HTMLAttributes<HTMLSpanElement>;

export function Tampon({ className, ...natifs }: TamponProps) {
  return <span className={classes("cto-tampon", className)} {...natifs} />;
}
