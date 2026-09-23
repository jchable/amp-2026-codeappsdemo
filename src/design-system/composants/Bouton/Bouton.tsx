import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classes } from "../classes";
import "./Bouton.css";

export type VarianteBouton = "primaire" | "accent" | "secondaire" | "discret";
export type TailleBouton = "normale" | "compacte";

export type BoutonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  pleineLargeur?: boolean;
};

export const Bouton = forwardRef<HTMLButtonElement, BoutonProps>(function Bouton(
  { variante = "primaire", taille = "normale", pleineLargeur = false, type = "button", className, ...natifs },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(
        "cto-bouton",
        `cto-bouton--${variante}`,
        taille === "compacte" && "cto-bouton--compacte",
        pleineLargeur && "cto-bouton--pleine",
        className
      )}
      {...natifs}
    />
  );
});
