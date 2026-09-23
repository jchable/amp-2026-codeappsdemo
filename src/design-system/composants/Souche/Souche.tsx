import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "../classes";
import type { TonPriorite } from "../ton";
import "./Souche.css";

export type SoucheProps = {
  ton: TonPriorite;
  numero: ReactNode;
  tampon?: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Souche({ ton, numero, tampon, className, children, ...natifs }: SoucheProps) {
  return (
    <article className={classes("cto-souche", `cto-souche--${ton}`, className)} {...natifs}>
      <div className="cto-souche__tete">
        <span className="cto-souche__numero">{numero}</span>
        {tampon}
      </div>
      <div className="cto-souche__corps">{children}</div>
    </article>
  );
}
