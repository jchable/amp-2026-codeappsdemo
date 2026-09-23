import { describe, it, expect } from "vitest";
import { couleursEnDur, extraireBlocs, proprietesDe, resoudre, variablesUtilisees } from "./analyseCss";

const CSS = `
/* commentaire : --cto-fantome: #ffffff; */
:root {
  --cto-a: #112233;
  --cto-b: var(--cto-a);
}
[data-theme="jour"] {
  --cto-b: #ffffff;
}
@media (pointer: coarse) {
  .x { min-height: var(--cto-cible, 44px); }
}
`;

describe("extraireBlocs", () => {
  it("ignore les commentaires et les préambules @media, et ne garde que les propriétés --*", () => {
    const blocs = extraireBlocs(CSS);
    expect(blocs.map((b) => b.selecteur)).toEqual([":root", '[data-theme="jour"]', ".x"]);
    expect(blocs[0].proprietes).toEqual({ "--cto-a": "#112233", "--cto-b": "var(--cto-a)" });
    expect(blocs[2].proprietes).toEqual({});
  });
});

describe("proprietesDe", () => {
  it("fusionne tous les blocs, le dernier gagnant", () => {
    expect(proprietesDe(CSS)["--cto-b"]).toBe("#ffffff");
  });

  it("ne garde que les blocs dont le sélecteur contient le fragment", () => {
    expect(proprietesDe(CSS, ":root")["--cto-b"]).toBe("var(--cto-a)");
    expect(proprietesDe(CSS, 'data-theme="jour"')).toEqual({ "--cto-b": "#ffffff" });
  });

  it("garde une valeur contenant des virgules et des parenthèses", () => {
    const css = ":root { --cto-v: color-mix(in srgb, var(--cto-a) 40%, transparent); }";
    expect(proprietesDe(css)["--cto-v"]).toBe("color-mix(in srgb, var(--cto-a) 40%, transparent)");
  });
});

describe("resoudre", () => {
  it("suit une chaîne de var() jusqu'à la valeur", () => {
    expect(resoudre("--cto-b", proprietesDe(CSS, ":root"))).toBe("#112233");
  });

  it("lève si le token n'est pas défini", () => {
    expect(() => resoudre("--cto-absent", {})).toThrow(/non défini/);
    expect(() => resoudre("--cto-b", { "--cto-b": "var(--cto-absent)" })).toThrow(/non défini/);
  });

  it("lève sur une référence circulaire", () => {
    expect(() => resoudre("--cto-a", { "--cto-a": "var(--cto-b)", "--cto-b": "var(--cto-a)" })).toThrow(/circulaire/);
  });
});

describe("variablesUtilisees", () => {
  it("liste chaque variable lue par var(), sans doublon, hors commentaires", () => {
    const css = "/* var(--cto-fantome) */ .a { color: var(--cto-x); border: 1px solid var(--cto-x, var(--cto-y)); }";
    expect(variablesUtilisees(css)).toEqual(["--cto-x", "--cto-y"]);
  });
});

describe("couleursEnDur", () => {
  it("détecte hex, rgb(a) et hsl(a), hors commentaires", () => {
    const css = ".a { color: #fff; background: rgba(0,0,0,.5); border-color: #0d2b2e; outline-color: hsl(1 2% 3%); } /* #123456 */";
    expect(couleursEnDur(css)).toEqual(["#fff", "rgba(", "#0d2b2e", "hsl("]);
  });

  it("ne signale rien pour du CSS qui ne passe que par des variables", () => {
    expect(couleursEnDur(".a { color: var(--cto-texte-principal); background: transparent; }")).toEqual([]);
  });
});
