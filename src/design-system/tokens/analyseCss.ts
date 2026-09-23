export type Proprietes = Record<string, string>;
export type Bloc = { selecteur: string; proprietes: Proprietes };

const COMMENTAIRE = /\/\*[\s\S]*?\*\//g;

function sansCommentaires(css: string): string {
  return css.replace(COMMENTAIRE, "");
}

function lireProprietes(corps: string): Proprietes {
  const resultat: Proprietes = {};
  for (const ligne of corps.split(";")) {
    const i = ligne.indexOf(":");
    if (i === -1) continue;
    const nom = ligne.slice(0, i).trim();
    if (nom.startsWith("--")) resultat[nom] = ligne.slice(i + 1).trim();
  }
  return resultat;
}

/** Blocs `sélecteur { … }` d'un CSS sans imbrication (les @media sont aplatis : seul le bloc interne compte). */
export function extraireBlocs(css: string): Bloc[] {
  const blocs: Bloc[] = [];
  for (const [, selecteur, corps] of sansCommentaires(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    blocs.push({ selecteur: selecteur.trim(), proprietes: lireProprietes(corps) });
  }
  return blocs;
}

export function proprietesDe(css: string, fragmentSelecteur = ""): Proprietes {
  return extraireBlocs(css)
    .filter((b) => b.selecteur.includes(fragmentSelecteur))
    .reduce<Proprietes>((acc, b) => ({ ...acc, ...b.proprietes }), {});
}

export function resoudre(nom: string, proprietes: Proprietes, profondeur = 0): string {
  if (profondeur > 10) throw new Error(`Référence circulaire autour de ${nom}`);
  const valeur = proprietes[nom];
  if (valeur === undefined) throw new Error(`Token non défini : ${nom}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(valeur);
  return reference ? resoudre(reference[1], proprietes, profondeur + 1) : valeur;
}

export function variablesUtilisees(css: string): string[] {
  const noms = [...sansCommentaires(css).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
  return [...new Set(noms)];
}

export function couleursEnDur(css: string): string[] {
  return [...sansCommentaires(css).matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g)].map((m) => m[0]);
}
