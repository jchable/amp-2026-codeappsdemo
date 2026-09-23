import { describe, it, expect } from "vitest";
import { tonPriorite } from "./tonPriorite";

describe("tonPriorite", () => {
  it("traduit chaque priorité métier en ton du design system", () => {
    expect(tonPriorite("Basse")).toBe("basse");
    expect(tonPriorite("Moyenne")).toBe("moyenne");
    expect(tonPriorite("Haute")).toBe("haute");
  });
});
