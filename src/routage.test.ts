import { describe, it, expect } from "vitest";
import { estRouteDoc } from "./routage";

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
