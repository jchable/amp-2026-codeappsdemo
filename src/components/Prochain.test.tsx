import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Prochain } from "./Prochain";
import type { Ticket } from "../domain/ticket";

const ticket: Ticket = {
  id: "43", titre: "Vidéoprojecteur de la salle Lagon ne s'allume plus", description: "",
  statut: "Nouveau", priorite: "Haute", demandeur: "Marc", creeLe: "2026-09-23T12:00:00Z",
};

describe("Prochain", () => {
  it("affiche le numéro, le titre, la priorité et le demandeur", () => {
    render(<Prochain ticket={ticket} onPrendreEnCharge={vi.fn()} />);
    expect(screen.getByText("N° 43")).toBeInTheDocument();
    expect(screen.getByText(/Vidéoprojecteur de la salle Lagon/)).toBeInTheDocument();
    expect(screen.getByText(/Priorité haute/)).toBeInTheDocument();
    expect(screen.getByText(/Marc/)).toBeInTheDocument();
  });

  it("appelle onPrendreEnCharge avec l'id au clic sur Prendre en charge", () => {
    const onPrendreEnCharge = vi.fn();
    render(<Prochain ticket={ticket} onPrendreEnCharge={onPrendreEnCharge} />);
    fireEvent.click(screen.getByRole("button", { name: /Prendre en charge/ }));
    expect(onPrendreEnCharge).toHaveBeenCalledWith("43");
  });

  it("annonce qu'il n'y a rien en attente, sans bouton, quand il n'y a pas de ticket", () => {
    render(<Prochain ticket={undefined} onPrendreEnCharge={vi.fn()} />);
    expect(screen.getByText(/Rien en attente/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
