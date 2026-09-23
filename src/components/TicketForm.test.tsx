import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { TicketForm } from "./TicketForm";

describe("TicketForm", () => {
  it("propose exactement trois priorités en radios, Moyenne cochée par défaut", () => {
    render(<TicketForm onCreer={vi.fn()} />);
    const groupe = screen.getByRole("radiogroup", { name: "Priorité" });
    expect(within(groupe).getAllByRole("radio")).toHaveLength(3);
    expect(within(groupe).getByLabelText("Basse")).not.toBeChecked();
    expect(within(groupe).getByLabelText("Moyenne")).toBeChecked();
    expect(within(groupe).getByLabelText("Haute")).not.toBeChecked();
  });

  it("affiche les erreurs et n'appelle pas onCreer si le titre est vide", () => {
    const onCreer = vi.fn();
    render(<TicketForm onCreer={onCreer} />);
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    expect(screen.getByText("Le titre est obligatoire.")).toBeInTheDocument();
    expect(onCreer).not.toHaveBeenCalled();
  });

  it("appelle onCreer avec titre, demandeur, priorité et description, puis réinitialise le formulaire", async () => {
    const onCreer = vi.fn().mockResolvedValue(true);
    render(<TicketForm onCreer={onCreer} />);

    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "VPN inaccessible" } });
    fireEvent.change(screen.getByLabelText("Demandeur"), { target: { value: "julien" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Depuis ce matin" } });
    fireEvent.click(screen.getByLabelText("Haute"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    });

    expect(onCreer).toHaveBeenCalledWith({
      titre: "VPN inaccessible",
      demandeur: "julien",
      description: "Depuis ce matin",
      priorite: "Haute",
    });
    expect(screen.getByLabelText("Titre")).toHaveValue("");
    expect(screen.getByLabelText("Moyenne")).toBeChecked();
  });

  it("conserve la saisie quand la création échoue (onCreer résout false)", async () => {
    const onCreer = vi.fn().mockResolvedValue(false);
    render(<TicketForm onCreer={onCreer} />);

    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "VPN inaccessible" } });
    fireEvent.change(screen.getByLabelText("Demandeur"), { target: { value: "julien" } });
    fireEvent.click(screen.getByLabelText("Haute"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    });

    expect(onCreer).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Titre")).toHaveValue("VPN inaccessible");
    expect(screen.getByLabelText("Demandeur")).toHaveValue("julien");
    expect(screen.getByLabelText("Haute")).toBeChecked();
  });

  it("désactive le bouton pendant la création puis le réactive", async () => {
    let terminer: (ok: boolean) => void = () => {};
    const onCreer = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          terminer = resolve;
        })
    );
    render(<TicketForm onCreer={onCreer} />);

    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "VPN inaccessible" } });
    fireEvent.change(screen.getByLabelText("Demandeur"), { target: { value: "julien" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Créer" }));
    });
    expect(screen.getByRole("button", { name: "Créer" })).toBeDisabled();

    await act(async () => {
      terminer(false);
    });
    expect(screen.getByRole("button", { name: "Créer" })).toBeEnabled();
  });
});
