import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketForm } from "./TicketForm";

describe("TicketForm", () => {
  it("affiche les erreurs et n'appelle pas onCreer si le titre est vide", () => {
    const onCreer = vi.fn();
    render(<TicketForm onCreer={onCreer} />);
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    expect(screen.getByText("Le titre est obligatoire.")).toBeInTheDocument();
    expect(onCreer).not.toHaveBeenCalled();
  });

  it("appelle onCreer avec titre, demandeur, priorité et description, puis réinitialise le formulaire", async () => {
    const onCreer = vi.fn().mockResolvedValue(undefined);
    render(<TicketForm onCreer={onCreer} />);

    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "VPN inaccessible" } });
    fireEvent.change(screen.getByLabelText("Demandeur"), { target: { value: "julien" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Depuis ce matin" } });
    fireEvent.change(screen.getByLabelText("Priorité"), { target: { value: "Haute" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await vi.waitFor(() =>
      expect(onCreer).toHaveBeenCalledWith({
        titre: "VPN inaccessible",
        demandeur: "julien",
        description: "Depuis ce matin",
        priorite: "Haute",
      })
    );
    await vi.waitFor(() => expect(screen.getByLabelText("Titre")).toHaveValue(""));
    expect(screen.getByLabelText("Priorité")).toHaveValue("Moyenne");
  });
});
