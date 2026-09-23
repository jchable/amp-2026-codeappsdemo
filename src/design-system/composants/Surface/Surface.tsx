import { createElement, type HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Surface.css";

export type TonSurface = "claire" | "creuse";
export type SurfaceProps = { ton?: TonSurface; as?: "div" | "section" | "form" } & HTMLAttributes<HTMLElement>;

export function Surface({ ton = "claire", as = "div", className, ...natifs }: SurfaceProps) {
  return createElement(as, { className: classes("cto-surface", `cto-surface--${ton}`, className), ...natifs });
}
