import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EtatVide } from "./EtatVide";

describe("EtatVide", () => {
  it("affiche son message dans un paragraphe cto-etat-vide", () => {
    render(<EtatVide className="perso">Aucune demande ici pour le moment.</EtatVide>);
    const message = screen.getByText("Aucune demande ici pour le moment.");
    expect(message.tagName).toBe("P");
    expect(message).toHaveClass("cto-etat-vide", "perso");
  });
});
