import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Bandeau.css";

export type TonBandeau = "info" | "erreur";
export type BandeauProps = { ton?: TonBandeau } & HTMLAttributes<HTMLDivElement>;

export function Bandeau({ ton = "info", role, className, ...natifs }: BandeauProps) {
  return (
    <div
      role={role ?? (ton === "erreur" ? "alert" : undefined)}
      className={classes("cto-bandeau", `cto-bandeau--${ton}`, className)}
      {...natifs}
    />
  );
}
