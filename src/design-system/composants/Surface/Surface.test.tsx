import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Surface } from "./Surface";

describe("Surface", () => {
  it("est une div de ton claire par défaut", () => {
    render(<Surface data-testid="s">contenu</Surface>);
    const surface = screen.getByTestId("s");
    expect(surface.tagName).toBe("DIV");
    expect(surface).toHaveClass("cto-surface", "cto-surface--claire");
  });

  it("applique le ton creuse", () => {
    render(
      <Surface ton="creuse" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s")).toHaveClass("cto-surface--creuse");
  });

  it("peut être une section et transmet les attributs ARIA", () => {
    render(
      <Surface as="section" aria-live="polite" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
    expect(screen.getByTestId("s")).toHaveAttribute("aria-live", "polite");
  });

  it("peut être un formulaire dont onSubmit est appelé", () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <Surface as="form" onSubmit={onSubmit} data-testid="s">
        <button type="submit">Envoyer</button>
      </Surface>
    );
    expect(screen.getByTestId("s").tagName).toBe("FORM");
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("conserve className", () => {
    render(
      <Surface className="perso" data-testid="s">
        contenu
      </Surface>
    );
    expect(screen.getByTestId("s")).toHaveClass("cto-surface", "perso");
  });
});
