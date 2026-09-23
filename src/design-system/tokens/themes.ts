import primitifsCss from "./primitifs.css?raw";
import semantiquesCss from "./semantiques.css?raw";
import { proprietesDe, type Proprietes } from "./analyseCss";

export type NomTheme = "comptoir" | "jour";
export const NOMS_THEMES: readonly NomTheme[] = ["comptoir", "jour"];

export const PROPRIETES_PRIMITIFS: Proprietes = proprietesDe(primitifsCss);

/** Tokens sémantiques définis par chaque thème (sans les primitifs). */
export const BLOCS_THEME: Record<NomTheme, Proprietes> = {
  comptoir: proprietesDe(semantiquesCss, 'data-theme="comptoir"'),
  jour: proprietesDe(semantiquesCss, 'data-theme="jour"'),
};

/** Primitifs + sémantiques d'un thème : de quoi résoudre n'importe quelle chaîne de var(). */
export const PROPRIETES_THEME: Record<NomTheme, Proprietes> = {
  comptoir: { ...PROPRIETES_PRIMITIFS, ...BLOCS_THEME.comptoir },
  jour: { ...PROPRIETES_PRIMITIFS, ...BLOCS_THEME.jour },
};
