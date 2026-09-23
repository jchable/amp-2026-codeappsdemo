import { Titre } from "../index";
import { TOKENS_PRIMITIFS_AUTRES } from "../tokens/manifeste";
import { NOMS_THEMES } from "../tokens/themes";
import { lignesPaires, pastillesPrimitives, pastillesSemantiques, type Pastille } from "./donnees";

const commencePar = (prefixe: string) => TOKENS_PRIMITIFS_AUTRES.filter((t) => t.startsWith(prefixe));

function ListePastilles({ pastilles }: { pastilles: Pastille[] }) {
  return (
    <ul className="doc-pastilles">
      {pastilles.map((p) => (
        <li key={p.nom}>
          <span className="doc-pastille" style={{ background: `var(${p.nom})` }} aria-hidden="true" />
          <code>{p.nom}</code>
          <span className="doc-valeurs">{[...new Set(NOMS_THEMES.map((t) => p.valeurs[t]))].join(" · ")}</span>
        </li>
      ))}
    </ul>
  );
}

export function SectionFondations() {
  const paires = lignesPaires();
  return (
    <section className="doc-section" aria-labelledby="doc-fondations">
      <Titre niveau={2} id="doc-fondations">
        Fondations
      </Titre>

      <Titre niveau={3} apparence="carte">
        Couleurs primitives
      </Titre>
      <p>Valeurs brutes, jamais lues par un composant.</p>
      <ListePastilles pastilles={pastillesPrimitives()} />

      <Titre niveau={3} apparence="carte">
        Tokens sémantiques
      </Titre>
      <p>Redéfinis par thème. La pastille suit le thème choisi en haut de page ; les valeurs listées sont Comptoir · Jour.</p>
      <ListePastilles pastilles={pastillesSemantiques()} />

      <Titre niveau={3} apparence="carte">
        Contrastes vérifiés
      </Titre>
      <div className="doc-tableau-defilant">
        <table className="doc-tableau">
          <thead>
            <tr>
              <th scope="col">Avant-plan</th>
              <th scope="col">Fond</th>
              <th scope="col">Seuil</th>
              <th scope="col">Comptoir</th>
              <th scope="col">Jour</th>
            </tr>
          </thead>
          <tbody>
            {paires.map((l) => (
              <tr key={`${l.avantPlan}/${l.fond}`}>
                <td><code>{l.avantPlan}</code></td>
                <td><code>{l.fond}</code></td>
                <td>{l.seuil}</td>
                <td>{l.ratios.comptoir.toFixed(2)}</td>
                <td>{l.ratios.jour.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Titre niveau={3} apparence="carte">
        Espacement
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-space-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span className="doc-barre" style={{ width: `var(${t})` }} aria-hidden="true" />
          </li>
        ))}
      </ul>

      <Titre niveau={3} apparence="carte">
        Rayons
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-rayon-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span className="doc-carre" style={{ borderRadius: `var(${t})` }} aria-hidden="true" />
          </li>
        ))}
      </ul>

      <Titre niveau={3} apparence="carte">
        Typographie
      </Titre>
      <ul className="doc-echelle">
        {commencePar("--cto-taille-").map((t) => (
          <li key={t}>
            <code>{t}</code>
            <span style={{ fontSize: `var(${t})` }}>Guichet des demandes aMP</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
