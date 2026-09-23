import type { HTMLAttributes } from "react";
import { classes } from "../classes";
import "./Page.css";

export type PageProps = HTMLAttributes<HTMLDivElement>;

export function Page({ className, ...natifs }: PageProps) {
  return <div className={classes("cto-page", className)} {...natifs} />;
}
