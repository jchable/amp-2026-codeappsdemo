import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Puce } from "./Puce";

describe("Puce", () => {
  it("reflète l'état actif dans aria-pressed", () => {
    const { rerender } = render(<Puce actif={false}>Tous</Puce>);
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    rerender(<Puce actif>Tous</Puce>);
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "true");
  });

  it("affiche le compteur dans le bouton", () => {
    render(
      <Puce actif={false} compteur={3}>
        Nouveau
      </Puce>
    );
    expect(within(screen.getByRole("button")).getByText("3")).toBeInTheDocument();
  });

  it("affiche un compteur à zéro", () => {
    render(
      <Puce actif={false} compteur={0}>
        Résolu
      </Puce>
    );
    expect(within(screen.getByRole("button")).getByText("0")).toBeInTheDocument();
  });

  it("n'affiche aucun compteur quand il est absent", () => {
    render(<Puce actif={false}>Tous</Puce>);
    expect(screen.getByRole("button").querySelector(".cto-puce__compteur")).toBeNull();
  });

  it("est de type button, transmet onClick et conserve className", () => {
    const onClick = vi.fn();
    render(
      <Puce actif={false} className="perso" onClick={onClick}>
        Tous
      </Puce>
    );
    const puce = screen.getByRole("button");
    expect(puce).toHaveAttribute("type", "button");
    expect(puce).toHaveClass("cto-puce", "perso");
    fireEvent.click(puce);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
