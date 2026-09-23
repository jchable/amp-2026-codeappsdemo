import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketList } from "./TicketList";
import type { Ticket } from "../domain/ticket";

const base = (over: Partial<Ticket> = {}): Ticket => ({
  id: "42", titre: "VPN inaccessible", description: "", statut: "Nouveau",
  priorite: "Haute", demandeur: "julien", creeLe: "2026-09-23T12:00:00Z", ...over,
});
const rendre = (t: Ticket, cbs: { changer?: () => void; suppr?: () => void } = {}) =>
  render(<TicketList tickets={[t]} onChangerStatut={cbs.changer ?? vi.fn()} onSupprimer={cbs.suppr ?? vi.fn()} />);

describe("TicketList", () => {
  it("n'offre depuis Nouveau que Prendre en charge (Nouveau vers Résolu interdit)", () => {
    rendre(base({ statut: "Nouveau" }));
    expect(screen.getByRole("button", { name: /Prendre en charge/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marquer résolu/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rouvrir/ })).not.toBeInTheDocument();
  });

  it("offre depuis En cours Marquer résolu et Renvoyer à Nouveau", () => {
    rendre(base({ statut: "En cours" }));
    expect(screen.getByRole("button", { name: /Marquer résolu/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renvoyer à Nouveau/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Prendre en charge/ })).not.toBeInTheDocument();
  });

  it("offre depuis Résolu uniquement Rouvrir", () => {
    rendre(base({ statut: "Résolu" }));
    expect(screen.getByRole("button", { name: /Rouvrir/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marquer résolu/ })).not.toBeInTheDocument();
  });

  it("affiche le numéro, le tampon de statut, le demandeur et la priorité en texte", () => {
    rendre(base({ statut: "En cours" }));
    expect(screen.getByText("N° 42")).toBeInTheDocument();
    expect(screen.getByText("En cours", { selector: ".tampon" })).toBeInTheDocument();
    expect(screen.getByText(/julien/)).toBeInTheDocument();
    expect(screen.getByText("Priorité haute")).toBeInTheDocument();
  });

  it("appelle onChangerStatut avec l'id et le statut visé", () => {
    const changer = vi.fn();
    rendre(base({ statut: "En cours" }), { changer });
    fireEvent.click(screen.getByRole("button", { name: /Marquer résolu/ }));
    expect(changer).toHaveBeenCalledWith("42", "Résolu");
  });

  it("appelle onSupprimer avec l'id", () => {
    const suppr = vi.fn();
    rendre(base(), { suppr });
    fireEvent.click(screen.getByRole("button", { name: /Supprimer/ }));
    expect(suppr).toHaveBeenCalledWith("42");
  });

  it("masque la description par défaut et la déplie au clic", () => {
    rendre(base({ description: "Coupure en plein test son." }));
    expect(screen.queryByText("Coupure en plein test son.")).not.toBeInTheDocument();
    const voir = screen.getByRole("button", { name: /Voir la description/ });
    expect(voir).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(voir);
    expect(screen.getByText("Coupure en plein test son.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Masquer la description/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("nomme chaque bouton de description avec le titre de sa demande", () => {
    render(
      <TicketList
        tickets={[
          base({ id: "1", titre: "VPN inaccessible", description: "Première description" }),
          base({ id: "2", titre: "Badge cassé", description: "Seconde description" }),
        ]}
        onChangerStatut={vi.fn()}
        onSupprimer={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Voir la description : VPN inaccessible" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voir la description : Badge cassé" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voir la description : VPN inaccessible" }));
    expect(screen.getByRole("button", { name: "Masquer la description : VPN inaccessible" })).toBeInTheDocument();
  });

  it("déplier une description ne déplie pas celle des autres demandes", () => {
    render(
      <TicketList
        tickets={[
          base({ id: "1", titre: "VPN inaccessible", description: "Première description" }),
          base({ id: "2", titre: "Badge cassé", description: "Seconde description" }),
        ]}
        onChangerStatut={vi.fn()}
        onSupprimer={vi.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Voir la description/ })[0]);
    expect(screen.getByText("Première description")).toBeInTheDocument();
    expect(screen.queryByText("Seconde description")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voir la description : Badge cassé/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("n'affiche aucun bouton de description quand elle est vide", () => {
    rendre(base({ description: "" }));
    expect(screen.queryByRole("button", { name: /description/ })).not.toBeInTheDocument();
  });

  it("affiche un message quand la liste est vide", () => {
    render(<TicketList tickets={[]} onChangerStatut={vi.fn()} onSupprimer={vi.fn()} />);
    expect(screen.getByText(/Aucune demande/)).toBeInTheDocument();
  });
});
