import { Titre } from "../index";
import { DOCS_COMPOSANTS } from "./registre";

export function SectionComposants() {
  return (
    <section className="doc-section" aria-labelledby="doc-composants">
      <Titre niveau={2} id="doc-composants">
        Composants
      </Titre>
      {DOCS_COMPOSANTS.map((doc) => (
        <article key={doc.nom} className="doc-composant" aria-labelledby={`doc-composant-${doc.nom}`}>
          <Titre niveau={3} id={`doc-composant-${doc.nom}`}>
            {doc.nom}
          </Titre>
          <p>{doc.resume}</p>
          <div className="doc-demo">
            <doc.Demo />
          </div>

          <Titre niveau={4} apparence="carte">
            Props
          </Titre>
          <div className="doc-tableau-defilant">
            <table className="doc-tableau">
              <thead>
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Type</th>
                  <th scope="col">Défaut</th>
                  <th scope="col">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {doc.props.map((p) => (
                  <tr key={p.nom}>
                    <td><code>{p.nom}</code></td>
                    <td><code>{p.type}</code></td>
                    <td>{p.defaut ? <code>{p.defaut}</code> : "—"}</td>
                    <td>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Titre niveau={4} apparence="carte">
            Accessibilité
          </Titre>
          <ul className="doc-liste">
            {doc.accessibilite.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <div className="doc-bonnes-pratiques">
            <p className="doc-afaire"><strong>À faire.</strong> {doc.aFaire}</p>
            <p className="doc-aeviter"><strong>À éviter.</strong> {doc.aEviter}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
