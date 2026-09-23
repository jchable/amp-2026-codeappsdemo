import { Titre } from "../index";

const PRINCIPES = [
  "Les composants ne lisent que des tokens sémantiques : jamais une couleur brute, jamais une couleur primitive.",
  "L'accessibilité n'est pas négociable : contrastes vérifiés par test dans chaque thème, focus visible, cibles tactiles de 44 px.",
  "La couleur ne porte jamais seule une information : la priorité d'une souche s'écrit aussi en toutes lettres.",
  "Le design system ne connaît pas le métier : il ne sait pas ce qu'est une demande, une priorité ou un statut.",
  "Chaque token et chaque composant répond à un usage réel. Le reste est refusé (YAGNI).",
];

export function SectionPrincipes() {
  return (
    <section className="doc-section" aria-labelledby="doc-principes">
      <Titre niveau={2} id="doc-principes">
        Principes
      </Titre>
      <ol className="doc-liste">
        {PRINCIPES.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
    </section>
  );
}
