import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tampon } from "./Tampon";

describe("Tampon", () => {
  it("affiche son contenu dans un span de classe cto-tampon", () => {
    render(<Tampon>En cours</Tampon>);
    const tampon = screen.getByText("En cours");
    expect(tampon.tagName).toBe("SPAN");
    expect(tampon).toHaveClass("cto-tampon");
  });

  it("conserve className et transmet les attributs natifs", () => {
    render(
      <Tampon className="perso" title="Statut">
        Résolu
      </Tampon>
    );
    expect(screen.getByText("Résolu")).toHaveClass("cto-tampon", "perso");
    expect(screen.getByTitle("Statut")).toBeInTheDocument();
  });
});
