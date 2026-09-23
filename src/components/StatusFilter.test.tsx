import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusFilter } from "./StatusFilter";

describe("StatusFilter", () => {
  it("affiche Tous + les 3 statuts, avec la valeur active marquée", () => {
    render(<StatusFilter valeur="En cours" onChange={vi.fn()} />);
    const actif = screen.getByRole("button", { name: "En cours" });
    expect(actif).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
  });

  it("appelle onChange avec le statut cliqué", () => {
    const onChange = vi.fn();
    render(<StatusFilter valeur="Tous" onChange={onChange} />);
    screen.getByRole("button", { name: "Résolu" }).click();
    expect(onChange).toHaveBeenCalledWith("Résolu");
  });
});
