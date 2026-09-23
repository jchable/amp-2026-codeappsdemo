import { Titre } from "../index";

export function SectionGouvernance() {
  return (
    <section className="doc-section" aria-labelledby="doc-gouvernance">
      <Titre niveau={2} id="doc-gouvernance">
        Gouvernance
      </Titre>
      <Titre niveau={3} apparence="carte">
        Proposer un token
      </Titre>
      <ol className="doc-liste">
        <li>Décrire l'usage réel qui le justifie : sans usage aujourd'hui, la demande est refusée.</li>
        <li>L'ajouter dans les fichiers de tokens <em>et</em> dans le manifeste (le test de gouvernance vérifie que les deux concordent).</li>
        <li>S'il porte une couleur de texte ou de contour, déclarer sa paire de contraste dans le manifeste.</li>
        <li>Le définir dans chaque thème, puis noter le changement au CHANGELOG.</li>
      </ol>
      <Titre niveau={3} apparence="carte">
        Proposer un composant
      </Titre>
      <ol className="doc-liste">
        <li>Un usage existant dans l'app, et pas une hypothèse.</li>
        <li>Test rouge d'abord, puis le composant, son CSS (tokens seulement) et sa fiche <code>.doc.tsx</code>.</li>
        <li>L'exporter depuis <code>index.ts</code> : les tests de gouvernance exigent la fiche de doc.</li>
      </ol>
      <Titre niveau={3} apparence="carte">
        Versionnage
      </Titre>
      <p>
        Versionnage sémantique, journal dans <code>src/design-system/CHANGELOG.md</code>. Retirer ou renommer un token,
        une prop ou une variante est un changement cassant (version majeure).
      </p>
    </section>
  );
}
