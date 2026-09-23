import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PageDoc from "./PageDoc";

describe("PageDoc", () => {
  it("affiche le titre du design system et ses cinq sections", () => {
    render(<PageDoc />);
    expect(screen.getByRole("heading", { level: 1, name: "Contoso" })).toBeInTheDocument();
    for (const nom of ["Principes", "Fondations", "Thèmes", "Composants", "Gouvernance"]) {
      expect(screen.getByRole("heading", { level: 2, name: nom })).toBeInTheDocument();
    }
  });

  it("change le thème du conteneur de la doc, jamais celui du document", () => {
    render(<PageDoc />);
    const conteneur = screen.getByTestId("conteneur-doc");
    expect(conteneur).toHaveAttribute("data-theme", "comptoir");
    fireEvent.click(screen.getByRole("button", { name: "Jour" }));
    expect(conteneur).toHaveAttribute("data-theme", "jour");
    expect(screen.getByRole("button", { name: "Jour" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(document.body).not.toHaveAttribute("data-theme");
  });

  it("montre les deux thèmes côte à côte dans la section Thèmes", () => {
    const { container } = render(<PageDoc />);
    expect(container.querySelector('[data-theme="comptoir"].doc-theme-carte')).not.toBeNull();
    expect(container.querySelector('[data-theme="jour"].doc-theme-carte')).not.toBeNull();
  });
});
