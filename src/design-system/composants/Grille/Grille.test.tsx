import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grille } from "./Grille";

describe("Grille", () => {
  it("rend une div de mode deux-colonnes", () => {
    render(
      <Grille mode="deux-colonnes" data-testid="g">
        <p>a</p>
      </Grille>
    );
    expect(screen.getByTestId("g").tagName).toBe("DIV");
    expect(screen.getByTestId("g")).toHaveClass("cto-grille", "cto-grille--deux-colonnes");
  });

  it("rend une liste quand as vaut ul, avec ses éléments de liste", () => {
    render(
      <Grille mode="auto" as="ul">
        <li>un</li>
        <li>deux</li>
      </Grille>
    );
    expect(screen.getByRole("list")).toHaveClass("cto-grille--auto");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("peut être une section et conserve className", () => {
    render(
      <Grille mode="deux-colonnes" as="section" className="perso" data-testid="g">
        <p>a</p>
      </Grille>
    );
    expect(screen.getByTestId("g").tagName).toBe("SECTION");
    expect(screen.getByTestId("g")).toHaveClass("perso");
  });
});
