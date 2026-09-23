import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StatusFilter } from "./StatusFilter";

const compteurs = { Tous: 8, Nouveau: 3, "En cours": 3, "Résolu": 2 };

describe("StatusFilter", () => {
  it("affiche Tous + les 3 statuts, avec la valeur active marquée", () => {
    render(<StatusFilter valeur="En cours" onChange={vi.fn()} compteurs={compteurs} />);
    const actif = screen.getByRole("button", { name: /^En cours/ });
    expect(actif).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^Tous/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("group", { name: "Filtrer par statut" })).toBeInTheDocument();
  });

  it("affiche le compteur de chaque statut dans son bouton", () => {
    render(<StatusFilter valeur="Tous" onChange={vi.fn()} compteurs={compteurs} />);
    expect(within(screen.getByRole("button", { name: /^Nouveau/ })).getByText("3")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /^Tous/ })).getByText("8")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /^Résolu/ })).getByText("2")).toBeInTheDocument();
  });

  it("appelle onChange avec le statut cliqué", () => {
    const onChange = vi.fn();
    render(<StatusFilter valeur="Tous" onChange={onChange} compteurs={compteurs} />);
    screen.getByRole("button", { name: /^Résolu/ }).click();
    expect(onChange).toHaveBeenCalledWith("Résolu");
  });
});
