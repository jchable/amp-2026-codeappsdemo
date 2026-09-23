import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Souche } from "./Souche";

describe("Souche", () => {
  it("rend un article avec son numéro, son tampon et son corps", () => {
    render(
      <Souche ton="haute" numero="N° 41" tampon={<span>En cours</span>}>
        <p>Corps de la souche</p>
      </Souche>
    );
    const souche = screen.getByRole("article");
    expect(within(souche).getByText("N° 41")).toBeInTheDocument();
    expect(within(souche).getByText("En cours")).toBeInTheDocument();
    expect(within(souche).getByText("Corps de la souche")).toBeInTheDocument();
  });

  it.each(["haute", "moyenne", "basse", "neutre"] as const)("applique le ton %s", (ton) => {
    render(
      <Souche ton={ton} numero="N° 1">
        corps
      </Souche>
    );
    expect(screen.getByRole("article")).toHaveClass("cto-souche", `cto-souche--${ton}`);
  });

  it("fonctionne sans tampon", () => {
    render(
      <Souche ton="basse" numero="N° 2">
        corps
      </Souche>
    );
    expect(screen.getByRole("article")).toHaveTextContent("N° 2");
  });

  it("conserve className et transmet les attributs natifs", () => {
    render(
      <Souche ton="moyenne" numero="N° 3" className="perso" aria-label="Demande 3">
        corps
      </Souche>
    );
    expect(screen.getByRole("article", { name: "Demande 3" })).toHaveClass("perso");
  });
});
