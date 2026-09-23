import { describe, it, expect } from "vitest";
import { TOKENS_PRIMITIFS_COULEUR, TOKENS_SEMANTIQUES, PAIRES_CONTRASTE } from "../tokens/manifeste";
import { lignesPaires, pastillesPrimitives, pastillesSemantiques } from "./donnees";

describe("données de la doc", () => {
  it("expose une pastille par couleur primitive, avec la valeur hex", () => {
    const pastilles = pastillesPrimitives();
    expect(pastilles.map((p) => p.nom)).toEqual([...TOKENS_PRIMITIFS_COULEUR]);
    expect(pastilles.find((p) => p.nom === "--cto-teal-700")?.valeurs.comptoir).toBe("#0f4c55");
  });

  it("expose une pastille par token sémantique, résolue dans chaque thème", () => {
    const pastilles = pastillesSemantiques();
    expect(pastilles).toHaveLength(TOKENS_SEMANTIQUES.length);
    const fond = pastilles.find((p) => p.nom === "--cto-fond-page");
    expect(fond?.valeurs).toEqual({ comptoir: "#0f4c55", jour: "#eaf6f4" });
  });

  it("calcule le ratio de chaque paire du manifeste dans chaque thème, au-dessus du seuil", () => {
    const lignes = lignesPaires();
    expect(lignes).toHaveLength(PAIRES_CONTRASTE.length);
    for (const ligne of lignes) {
      expect(ligne.ratios.comptoir).toBeGreaterThanOrEqual(ligne.seuil);
      expect(ligne.ratios.jour).toBeGreaterThanOrEqual(ligne.seuil);
    }
  });
});
