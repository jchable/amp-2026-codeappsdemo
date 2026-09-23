import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Titre.css";

export type ApparenceTitre = "marque" | "sous-titre" | "carte";
export type TitreProps = { niveau: 1 | 2 | 3 | 4; apparence?: ApparenceTitre } & HTMLAttributes<HTMLHeadingElement>;

const BALISES = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export function Titre({ niveau, apparence = "marque", className, ...natifs }: TitreProps) {
  return createElement(BALISES[niveau], { className: classes("cto-titre", `cto-titre--${apparence}`, className), ...natifs });
}
