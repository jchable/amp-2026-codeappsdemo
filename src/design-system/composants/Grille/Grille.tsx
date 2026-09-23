import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Grille.css";

export type ModeGrille = "deux-colonnes" | "auto";
export type GrilleProps = { mode: ModeGrille; as?: "div" | "section" | "ul" } & HTMLAttributes<HTMLElement>;

export function Grille({ mode, as = "div", className, ...natifs }: GrilleProps) {
  return createElement(as, { className: classes("cto-grille", `cto-grille--${mode}`, className), ...natifs });
}
