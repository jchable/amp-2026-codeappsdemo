import { describe, it, expect } from "vitest";
import { changeDeRoute, estRouteDoc } from "./routage";

describe("estRouteDoc", () => {
  it("reconnaît la route de la doc, avec ou sans sous-chemin", () => {
    expect(estRouteDoc("#/design-system")).toBe(true);
    expect(estRouteDoc("#/design-system/")).toBe(true);
    expect(estRouteDoc("#/design-system/composants")).toBe(true);
  });

  it("ne confond pas une route voisine avec la doc", () => {
    expect(estRouteDoc("#/design-systemique")).toBe(false);
    expect(estRouteDoc("#/autre")).toBe(false);
    expect(estRouteDoc("#design-system")).toBe(false);
  });

  it("ne reconnaît pas la doc sans hash", () => {
    expect(estRouteDoc("")).toBe(false);
  });
});

describe("changeDeRoute", () => {
  const base = "http://localhost:3000/";

  it("est vrai quand on passe de l'app à la doc, et de la doc à l'app", () => {
    expect(changeDeRoute(`${base}#/tickets`, `${base}#/design-system`)).toBe(true);
    expect(changeDeRoute(`${base}#/design-system`, `${base}#/tickets`)).toBe(true);
  });

  it("est faux quand on reste dans la doc, ou dans l'app", () => {
    expect(changeDeRoute(`${base}#/design-system`, `${base}#/design-system/composants`)).toBe(false);
    expect(changeDeRoute(`${base}#/a`, `${base}#/b`)).toBe(false);
  });

  it("est vrai de la doc vers une ancre de page : ce hash n'est pas la route de la doc", () => {
    expect(changeDeRoute(`${base}#/design-system`, `${base}#doc-composants`)).toBe(true);
  });
});
