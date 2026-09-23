import { resoudre } from "../tokens/analyseCss";
import { ratioContraste } from "../tokens/contraste";
import { PAIRES_CONTRASTE, TOKENS_PRIMITIFS_COULEUR, TOKENS_SEMANTIQUES } from "../tokens/manifeste";
import { NOMS_THEMES, PROPRIETES_THEME, type NomTheme } from "../tokens/themes";

export type Pastille = { nom: string; valeurs: Record<NomTheme, string> };
export type LignePaire = { avantPlan: string; fond: string; seuil: number; ratios: Record<NomTheme, number> };

function parTheme<T>(calcul: (theme: NomTheme) => T): Record<NomTheme, T> {
  return Object.fromEntries(NOMS_THEMES.map((theme) => [theme, calcul(theme)])) as Record<NomTheme, T>;
}

function pastilles(noms: readonly string[]): Pastille[] {
  return noms.map((nom) => ({ nom, valeurs: parTheme((theme) => resoudre(nom, PROPRIETES_THEME[theme])) }));
}

export const pastillesPrimitives = (): Pastille[] => pastilles(TOKENS_PRIMITIFS_COULEUR);
export const pastillesSemantiques = (): Pastille[] => pastilles(TOKENS_SEMANTIQUES);

export function lignesPaires(): LignePaire[] {
  return PAIRES_CONTRASTE.map((paire) => ({
    ...paire,
    ratios: parTheme((theme) => {
      const decl = PROPRIETES_THEME[theme];
      return ratioContraste(resoudre(paire.avantPlan, decl), resoudre(paire.fond, decl));
    }),
  }));
}
