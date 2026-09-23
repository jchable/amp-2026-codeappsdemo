import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketList } from "./TicketList";
import type { Ticket } from "../domain/ticket";

const ticket: Ticket = {
  id: "t1",
  titre: "VPN inaccessible",
  description: "",
  statut: "Nouveau",
  priorite: "Haute",
  demandeur: "julien",
  creeLe: "2026-09-23T10:00:00Z",
};

describe("TicketList", () => {
  it("ne propose que les transitions autorisées dans le sélecteur de statut", () => {
    render(<TicketList tickets={[ticket]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    const select = screen.getByLabelText("Statut de VPN inaccessible") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    // Nouveau → Résolu est interdit (règle 3) : "Résolu" ne doit pas apparaître.
    expect(options).toEqual(["Nouveau", "En cours"]);
  });

  it("affiche un message quand la liste est vide", () => {
    render(<TicketList tickets={[]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.getByText(/Aucun ticket/)).toBeInTheDocument();
  });

  it("appelle onChangerStatut avec l'id du ticket et le statut choisi", () => {
    const onChangerStatut = vi.fn();
    render(<TicketList tickets={[ticket]} onChangerStatut={onChangerStatut} onSupprimer={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Statut de VPN inaccessible"), { target: { value: "En cours" } });
    expect(onChangerStatut).toHaveBeenCalledWith("t1", "En cours");
  });

  it("appelle onSupprimer avec l'id du ticket au clic sur Supprimer", () => {
    const onSupprimer = vi.fn();
    render(<TicketList tickets={[ticket]} onChangerStatut={vi.fn()} onSupprimer={onSupprimer} />);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onSupprimer).toHaveBeenCalledWith("t1");
  });
});
