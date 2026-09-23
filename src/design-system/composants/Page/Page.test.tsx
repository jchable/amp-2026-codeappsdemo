import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page } from "./Page";

describe("Page", () => {
  it("rend un conteneur cto-page qui transmet className et attributs (data-theme compris)", () => {
    render(
      <Page className="perso" data-theme="comptoir" data-testid="p">
        contenu
      </Page>
    );
    const page = screen.getByTestId("p");
    expect(page).toHaveClass("cto-page", "perso");
    expect(page).toHaveAttribute("data-theme", "comptoir");
    expect(page).toHaveTextContent("contenu");
  });
});
