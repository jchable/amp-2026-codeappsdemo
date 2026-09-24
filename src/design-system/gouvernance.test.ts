import { describe, it, expect } from "vitest";
import * as DS from "./index";
import type { DocComposant } from "./doc-types";
import { couleursEnDur, proprietesDe, resoudre, variablesUtilisees, type Proprietes } from "./tokens/analyseCss";
import { ratioContraste } from "./tokens/contraste";
import {
  PAIRES_CONTRASTE,
  POINT_DE_RUPTURE_PX,
  TOKENS_PRIMITIFS_AUTRES,
  TOKENS_PRIMITIFS_COULEUR,
  TOKENS_SEMANTIQUES,
} from "./tokens/manifeste";
import { BLOCS_THEME, NOMS_THEMES, PROPRIETES_PRIMITIFS, PROPRIETES_THEME } from "./tokens/themes";

// Périmètre des scans CSS : le DS, les composants de l'app et les CSS à la racine de src/.
const fichiersCss = import.meta.glob<string>(
  ["/src/design-system/**/*.css", "/src/components/**/*.css", "/src/*.css"],
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

describe("gouvernance — responsive", () => {
  it("le point de rupture du manifeste est celui des @media du DS", () => {
    const attendu = `@media (max-width: ${POINT_DE_RUPTURE_PX}px)`;
    const grille = fichiersCss["/src/design-system/composants/Grille/Grille.css"];
    expect(grille).toContain(attendu);
    const autres = Object.entries(fichiersCss)
      .filter(([chemin]) => chemin.startsWith("/src/design-system/"))
      .flatMap(([chemin, css]) =>
        [...css.matchAll(/@media \(max-width: (\d+)px\)/g)].filter((m) => m[1] !== String(POINT_DE_RUPTURE_PX)).map(() => chemin)
      );
    expect(autres).toEqual([]);
  });
});

const sourcesDs = import.meta.glob<string>(
  ["/src/design-system/**/*.{ts,tsx}", "!/src/design-system/**/*.test.{ts,tsx}"],
  { query: "?raw", import: "default", eager: true }
);

const IMPORTS_INTERDITS = [
  /(^|\/)domain(\/|$)/,
  /(^|\/)data(\/|$)/,
  /(^|\/)hooks(\/|$)/,
  /(^|\/)generated(\/|$)/,
  /(^|\/)components(\/|$)/,
  /@microsoft\/power-apps/,
  /(^|\/)App(\.tsx?)?$/,
  /PowerProvider/,
];

function specifieurs(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
}

// Côté app : on importe le DS par son index (`../design-system`), jamais par un chemin profond.
const sourcesApp = import.meta.glob<string>(
  [
    "/src/components/**/*.{ts,tsx}",
    "!/src/components/**/*.test.{ts,tsx}",
    "/src/App.tsx",
    "/src/PowerProvider.tsx",
  ],
  { query: "?raw", import: "default", eager: true }
);

describe("gouvernance — frontières", () => {
  it("les sources du DS sont réellement scannées (glob non vide)", () => {
    expect(Object.keys(sourcesDs).length).toBeGreaterThan(20);
  });

  it("l'app importe le DS par son index, jamais par un chemin profond", () => {
    expect(Object.keys(sourcesApp).length).toBeGreaterThan(5);
    const fautes = Object.entries(sourcesApp).flatMap(([chemin, source]) =>
      specifieurs(source)
        .filter((s) => s.includes("design-system/"))
        .map((s) => `${chemin} importe ${s}`)
    );
    expect(fautes).toEqual([]);
  });

  it("le DS n'importe rien du métier, du SDK, de generated/ ni de l'App", () => {
    const fautes = Object.entries(sourcesDs).flatMap(([chemin, source]) =>
      specifieurs(source)
        .filter((s) => IMPORTS_INTERDITS.some((interdit) => interdit.test(s)))
        .map((s) => `${chemin} importe ${s}`)
    );
    expect(fautes).toEqual([]);
  });

  it("l'index n'exporte aucune valeur autre que les composants", () => {
    expect(Object.keys(DS).sort()).toEqual([
      "Bandeau", "Bouton", "Champ", "ChoixSegmente", "EtatVide", "Grille",
      "Page", "Puce", "Souche", "Surface", "Tampon", "Titre",
    ]);
  });
});

describe("gouvernance — accessibilité tactile", () => {
  const INTERACTIFS = [
    "/src/design-system/composants/Bouton/Bouton.css",
    "/src/design-system/composants/Champ/Champ.css",
    "/src/design-system/composants/ChoixSegmente/ChoixSegmente.css",
    "/src/design-system/composants/Puce/Puce.css",
  ];

  // Corps du bloc `@media (pointer: coarse)` (commentaires retirés), trouvé par comptage des accolades.
  function blocCoarse(css: string): string {
    const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const debut = sansCommentaires.indexOf("@media (pointer: coarse)");
    if (debut === -1) return "";
    const ouvrante = sansCommentaires.indexOf("{", debut);
    if (ouvrante === -1) return "";
    let profondeur = 0;
    for (let i = ouvrante; i < sansCommentaires.length; i++) {
      if (sansCommentaires[i] === "{") profondeur++;
      if (sansCommentaires[i] === "}") profondeur--;
      if (profondeur === 0) return sansCommentaires.slice(ouvrante + 1, i);
    }
    return "";
  }

  it("les composants interactifs référencent la cible tactile dans un @media (pointer: coarse)", () => {
    const fautes = INTERACTIFS.filter((chemin) => !blocCoarse(fichiersCss[chemin] ?? "").includes("var(--cto-cible-tactile)"));
    expect(fautes).toEqual([]);
  });
});

const fichesDoc = import.meta.glob<DocComposant>("./composants/*/*.doc.tsx", { import: "default", eager: true });

describe("gouvernance — documentation", () => {
  it("tout composant exporté par l'index possède sa fiche .doc.tsx, et inversement", () => {
    const exportes = Object.keys(DS).sort();
    const documentes = Object.values(fichesDoc).map((d) => d.nom).sort();
    expect(documentes).toEqual(exportes);
  });

  it("chaque fiche est rangée dans le dossier de son composant, sous le nom <Nom>.doc.tsx", () => {
    const fautes = Object.entries(fichesDoc)
      .filter(([chemin, doc]) => !chemin.endsWith(`/${doc.nom}/${doc.nom}.doc.tsx`))
      .map(([chemin]) => chemin);
    expect(fautes).toEqual([]);
  });
});
