import { describe, it, expect } from "vitest";
import { luminance, ratioContraste } from "./contraste";

describe("luminance", () => {
  it("vaut 0 pour le noir et 1 pour le blanc", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("refuse une valeur qui n'est pas un hex #rrggbb", () => {
    expect(() => luminance("rgb(0,0,0)")).toThrow(/hex/);
    expect(() => luminance("#fff")).toThrow(/hex/);
    expect(() => luminance("transparent")).toThrow(/hex/);
  });
});

describe("ratioContraste", () => {
  it("vaut 21 entre noir et blanc, dans les deux sens", () => {
    expect(ratioContraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(ratioContraste("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("vaut 1 entre deux couleurs identiques", () => {
    expect(ratioContraste("#4e8d92", "#4e8d92")).toBeCloseTo(1, 5);
  });

  it("reproduit le calcul de la spec : teal-950 sur neutre-50", () => {
    expect(ratioContraste("#0d2b2e", "#fbfefd")).toBeCloseTo(14.76, 1);
  });
});
