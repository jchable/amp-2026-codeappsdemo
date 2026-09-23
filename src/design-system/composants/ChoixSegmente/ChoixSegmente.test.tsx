import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ChoixSegmente, type OptionChoix } from "./ChoixSegmente";

const options: OptionChoix<string>[] = [
  { valeur: "basse", libelle: "Basse", ton: "basse" },
  { valeur: "moyenne", libelle: "Moyenne", ton: "moyenne" },
  { valeur: "haute", libelle: "Haute", ton: "haute" },
];

describe("ChoixSegmente", () => {
  it("expose un radiogroup nommé par sa légende, avec un radio par option", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    const groupe = screen.getByRole("radiogroup", { name: "Priorité" });
    expect(within(groupe).getAllByRole("radio")).toHaveLength(3);
  });

  it("coche uniquement l'option dont la valeur est courante", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Basse")).not.toBeChecked();
    expect(screen.getByLabelText("Moyenne")).toBeChecked();
    expect(screen.getByLabelText("Haute")).not.toBeChecked();
  });

  it("appelle onChange avec la valeur de l'option choisie", () => {
    const onChange = vi.fn();
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Haute"));
    expect(onChange).toHaveBeenCalledWith("haute");
  });

  it("donne le même name à tous les radios (flèches et tabulation gérées par le navigateur)", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).toHaveAttribute("name", "priorite");
  });

  it("applique le ton de chaque option sur son libellé", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="moyenne" options={options} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Haute").closest("label")).toHaveClass("cto-choix__option--haute");
  });

  it("ne coche rien et ne plante pas quand la valeur ne correspond à aucune option", () => {
    render(<ChoixSegmente legende="Priorité" nom="priorite" valeur="" options={options} onChange={vi.fn()} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
  });
});
