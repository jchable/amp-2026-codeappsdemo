import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Champ } from "./Champ";

describe("Champ", () => {
  it("relie le libellé au champ de saisie", () => {
    render(<Champ libelle="Titre" placeholder="Ex. VPN" />);
    const champ = screen.getByLabelText("Titre");
    expect(champ.tagName).toBe("INPUT");
    expect(champ).toHaveAttribute("placeholder", "Ex. VPN");
  });

  it("rend un textarea quand multiligne est vrai", () => {
    render(<Champ libelle="Description" multiligne />);
    expect(screen.getByLabelText("Description").tagName).toBe("TEXTAREA");
  });

  it("transmet valeur et onChange au champ natif", () => {
    const onChange = vi.fn();
    render(<Champ libelle="Titre" value="abc" onChange={onChange} />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).toHaveValue("abc");
    fireEvent.change(champ, { target: { value: "abcd" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("relie l'erreur au champ par aria-describedby et le marque invalide", () => {
    render(<Champ libelle="Titre" erreur="Le titre est obligatoire." />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).toHaveAttribute("aria-invalid", "true");
    expect(champ).toHaveAccessibleDescription("Le titre est obligatoire.");
  });

  it("n'expose ni aria-invalid ni aria-describedby sans erreur, et les retire quand l'erreur disparaît", () => {
    const { rerender } = render(<Champ libelle="Titre" erreur="Oups" />);
    rerender(<Champ libelle="Titre" />);
    const champ = screen.getByLabelText("Titre");
    expect(champ).not.toHaveAttribute("aria-invalid");
    expect(champ).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("Oups")).not.toBeInTheDocument();
  });

  it("garde deux champs distincts : chaque libellé désigne son propre champ", () => {
    render(
      <>
        <Champ libelle="Titre" />
        <Champ libelle="Demandeur" />
      </>
    );
    const titre = screen.getByLabelText("Titre");
    const demandeur = screen.getByLabelText("Demandeur");
    expect(titre).not.toBe(demandeur);
    expect(titre.id).not.toBe(demandeur.id);
  });

  it("applique className au conteneur", () => {
    const { container } = render(<Champ libelle="Titre" className="perso" />);
    expect(container.firstElementChild).toHaveClass("cto-champ", "perso");
  });

  it("transmet la ref à l'input et au textarea", () => {
    const refInput = createRef<HTMLInputElement>();
    const refTexte = createRef<HTMLTextAreaElement>();
    render(
      <>
        <Champ libelle="A" ref={refInput} />
        <Champ libelle="B" multiligne ref={refTexte} />
      </>
    );
    expect(refInput.current).toBeInstanceOf(HTMLInputElement);
    expect(refTexte.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("conserve un aria-describedby fourni par l'appelant quand il n'y a pas d'erreur", () => {
    render(
      <>
        <Champ libelle="Titre" aria-describedby="aide" />
        <p id="aide">Aide au titre</p>
      </>
    );
    const champ = screen.getByLabelText("Titre");
    expect(champ).toHaveAttribute("aria-describedby", "aide");
    expect(champ).toHaveAccessibleDescription("Aide au titre");
  });

  it("fusionne l'aria-describedby de l'appelant et l'identifiant de l'erreur", () => {
    render(
      <>
        <Champ libelle="Titre" aria-describedby="aide" erreur="Le titre est obligatoire." />
        <p id="aide">Aide au titre</p>
      </>
    );
    const champ = screen.getByLabelText("Titre");
    const ids = champ.getAttribute("aria-describedby")?.split(" ");
    expect(ids).toContain("aide");
    expect(ids).toHaveLength(2);
    expect(champ).toHaveAccessibleDescription(expect.stringContaining("Le titre est obligatoire."));
  });

  it("marque aussi le textarea invalide et le relie à l'erreur", () => {
    render(<Champ libelle="Description" multiligne erreur="Trop long." />);
    const champ = screen.getByLabelText("Description");
    expect(champ).toHaveAttribute("aria-invalid", "true");
    expect(champ).toHaveAccessibleDescription("Trop long.");
  });

  it("conserve un aria-invalid fourni par l'appelant quand il n'y a pas d'erreur", () => {
    render(<Champ libelle="Titre" aria-invalid="true" />);
    expect(screen.getByLabelText("Titre")).toHaveAttribute("aria-invalid", "true");
  });
});
