import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DOCS_COMPOSANTS } from "./registre";

describe("registre de documentation", () => {
  it("contient une fiche complète par composant", () => {
    expect(DOCS_COMPOSANTS.length).toBeGreaterThan(0);
    for (const doc of DOCS_COMPOSANTS) {
      expect(doc.resume, doc.nom).not.toBe("");
      expect(doc.props.length, `${doc.nom} : props`).toBeGreaterThan(0);
      expect(doc.accessibilite.length, `${doc.nom} : accessibilité`).toBeGreaterThan(0);
      expect(doc.aFaire, `${doc.nom} : à faire`).not.toBe("");
      expect(doc.aEviter, `${doc.nom} : à éviter`).not.toBe("");
    }
  });

  it("rend la démo de chaque composant sans erreur", () => {
    for (const doc of DOCS_COMPOSANTS) {
      const { container, unmount } = render(<doc.Demo />);
      expect(container.firstChild, doc.nom).not.toBeNull();
      unmount();
    }
  });
});
