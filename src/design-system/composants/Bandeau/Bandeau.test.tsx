import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Bandeau } from "./Bandeau";

describe("Bandeau", () => {
  it("annonce une erreur avec role alert", () => {
    render(<Bandeau ton="erreur">Power Platform indisponible</Bandeau>);
    expect(screen.getByRole("alert")).toHaveTextContent("Power Platform indisponible");
    expect(screen.getByRole("alert")).toHaveClass("cto-bandeau", "cto-bandeau--erreur");
  });

  it("n'a aucun rôle d'alerte par défaut (ton info)", () => {
    render(<Bandeau>Initialisation…</Bandeau>);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Initialisation…")).toHaveClass("cto-bandeau--info");
  });

  it("laisse un role explicite l'emporter et conserve className", () => {
    render(
      <Bandeau ton="erreur" role="status" className="perso">
        Ok
      </Bandeau>
    );
    expect(screen.getByRole("status")).toHaveClass("perso");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
