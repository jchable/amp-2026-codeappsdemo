import { describe, it, expect } from "vitest";
import { couleursEnDur, proprietesDe, resoudre, variablesUtilisees, type Proprietes } from "./tokens/analyseCss";
import { ratioContraste } from "./tokens/contraste";
import {
  PAIRES_CONTRASTE,
  TOKENS_PRIMITIFS_AUTRES,
  TOKENS_PRIMITIFS_COULEUR,
  TOKENS_SEMANTIQUES,
} from "./tokens/manifeste";
import { BLOCS_THEME, NOMS_THEMES, PROPRIETES_PRIMITIFS, PROPRIETES_THEME } from "./tokens/themes";

// Périmètre des scans CSS : le DS, les composants de l'app et les CSS à la racine de src/
// (hors l'ancien src/styles.css, tant qu'il n'est pas supprimé).
const fichiersCss = import.meta.glob<string>(
  ["/src/design-system/**/*.css", "/src/components/**/*.css", "/src/*.css", "!/src/styles.css"],
  { query: "?raw", import: "default", eager: true }
);

const PRIMITIFS = "/src/design-system/tokens/primitifs.css";
const SEMANTIQUES = "/src/design-system/tokens/semantiques.css";
const cles = (p: Proprietes) => Object.keys(p).sort();

describe("gouvernance — tokens", () => {
  it("les CSS sont réellement lus : un import ?raw vide ferait passer tous les scans à vide", () => {
    const vides = Object.entries(fichiersCss)
      .filter(([, css]) => css.trim().length === 0)
      .map(([chemin]) => chemin);
    expect(vides).toEqual([]);
    for (const fichier of ["primitifs.css", "semantiques.css", "reset.css"]) {
      expect(Object.keys(fichiersCss), fichier).toContain(`/src/design-system/tokens/${fichier}`);
    }
    expect(Object.keys(PROPRIETES_PRIMITIFS).length).toBeGreaterThan(0);
  });

  it("le manifeste et primitifs.css déclarent exactement les mêmes tokens", () => {
    expect(cles(PROPRIETES_PRIMITIFS)).toEqual([...TOKENS_PRIMITIFS_COULEUR, ...TOKENS_PRIMITIFS_AUTRES].sort());
  });

  it("le manifeste et chaque thème déclarent exactement les mêmes tokens sémantiques", () => {
    for (const nom of NOMS_THEMES) {
      expect(cles(BLOCS_THEME[nom]), `thème ${nom}`).toEqual([...TOKENS_SEMANTIQUES].sort());
    }
  });

  it("les paires de contraste ne référencent que des tokens sémantiques du manifeste", () => {
    const connus = new Set<string>(TOKENS_SEMANTIQUES);
    const inconnus = PAIRES_CONTRASTE.flatMap((p) => [p.avantPlan, p.fond]).filter((t) => !connus.has(t));
    expect(inconnus).toEqual([]);
  });

  it("chaque var(--cto-*) utilisée est définie quelque part dans le CSS", () => {
    const definis = new Set(Object.values(fichiersCss).flatMap((css) => Object.keys(proprietesDe(css))));
    const manquants = Object.entries(fichiersCss).flatMap(([chemin, css]) =>
      variablesUtilisees(css)
        .filter((v) => v.startsWith("--cto-") && !definis.has(v))
        .map((v) => `${chemin} : ${v}`)
    );
    expect(manquants).toEqual([]);
  });

  it("aucune couleur en dur hors de primitifs.css", () => {
    const fautes = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin !== PRIMITIFS)
      .flatMap(([chemin, css]) => couleursEnDur(css).map((c) => `${chemin} : ${c}`));
    expect(fautes).toEqual([]);
  });

  it("aucun CSS hors des fichiers de tokens ne lit une couleur primitive", () => {
    const primitive = /var\(\s*--cto-(?:teal|corail|ambre|menthe|neutre)-\d+/;
    const fautes = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin !== PRIMITIFS && chemin !== SEMANTIQUES)
      .filter(([, css]) => primitive.test(css))
      .map(([chemin]) => chemin);
    expect(fautes).toEqual([]);
  });

  for (const nom of NOMS_THEMES) {
    it(`respecte tous les contrastes du manifeste — thème ${nom}`, () => {
      const decl = PROPRIETES_THEME[nom];
      const echecs = PAIRES_CONTRASTE.flatMap((p) => {
        const ratio = ratioContraste(resoudre(p.avantPlan, decl), resoudre(p.fond, decl));
        return ratio >= p.seuil ? [] : [`${p.avantPlan} / ${p.fond} : ${ratio.toFixed(2)} < ${p.seuil}`];
      });
      expect(echecs).toEqual([]);
    });
  }
});
