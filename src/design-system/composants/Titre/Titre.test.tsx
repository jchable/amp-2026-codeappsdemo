import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Titre } from "./Titre";

describe("Titre", () => {
  it.each([1, 2, 3, 4] as const)("rend un h%i pour le niveau %i", (niveau) => {
    render(<Titre niveau={niveau}>Guichet</Titre>);
    expect(screen.getByRole("heading", { level: niveau, name: "Guichet" })).toBeInTheDocument();
  });

  it("découple le niveau sémantique de l'apparence", () => {
    render(
      <Titre niveau={2} apparence="sous-titre">
        Prochain
      </Titre>
    );
    const titre = screen.getByRole("heading", { level: 2 });
    expect(titre).toHaveClass("cto-titre", "cto-titre--sous-titre");
  });

  it("a l'apparence marque par défaut et conserve className", () => {
    render(
      <Titre niveau={1} className="perso">
        Guichet
      </Titre>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("cto-titre--marque", "perso");
  });
});
