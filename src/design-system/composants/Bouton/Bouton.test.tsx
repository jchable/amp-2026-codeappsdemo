import { createRef, type FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Bouton } from "./Bouton";

describe("Bouton", () => {
  it("rend un bouton de type button et de variante primaire par défaut", () => {
    render(<Bouton>Créer</Bouton>);
    const bouton = screen.getByRole("button", { name: "Créer" });
    expect(bouton).toHaveAttribute("type", "button");
    expect(bouton).toHaveClass("cto-bouton", "cto-bouton--primaire");
  });

  it.each(["primaire", "accent", "secondaire", "discret"] as const)("applique la variante %s", (variante) => {
    render(<Bouton variante={variante}>Ok</Bouton>);
    expect(screen.getByRole("button")).toHaveClass(`cto-bouton--${variante}`);
  });

  it("applique la taille compacte et la pleine largeur", () => {
    render(
      <Bouton taille="compacte" pleineLargeur>
        Ok
      </Bouton>
    );
    expect(screen.getByRole("button")).toHaveClass("cto-bouton--compacte", "cto-bouton--pleine");
  });

  it("conserve className et transmet les attributs natifs", () => {
    const onClick = vi.fn();
    render(
      <Bouton className="perso" aria-label="Supprimer : VPN" onClick={onClick}>
        Supprimer
      </Bouton>
    );
    const bouton = screen.getByRole("button", { name: "Supprimer : VPN" });
    expect(bouton).toHaveClass("cto-bouton", "perso");
    fireEvent.click(bouton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ne déclenche pas onClick quand il est désactivé", () => {
    const onClick = vi.fn();
    render(
      <Bouton disabled onClick={onClick}>
        Ok
      </Bouton>
    );
    expect(screen.getByRole("button")).toBeDisabled();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ne soumet pas un formulaire par défaut, mais le soumet avec type submit", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Bouton>Ok</Bouton>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <form onSubmit={onSubmit}>
        <Bouton type="submit">Ok</Bouton>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("transmet la ref à l'élément button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Bouton ref={ref}>Ok</Bouton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
