import { Bouton, Souche, Surface, Tampon, Titre } from "../index";
import { NOMS_THEMES, type NomTheme } from "../tokens/themes";

export const LIBELLE_THEME: Record<NomTheme, string> = { comptoir: "Comptoir", jour: "Jour" };

export function SectionThemes() {
  return (
    <section className="doc-section" aria-labelledby="doc-themes">
      <Titre niveau={2} id="doc-themes">
        Thèmes
      </Titre>
      <p>Comptoir est le thème par défaut. Jour est le thème clair. Les deux définissent exactement les mêmes tokens.</p>
      <div className="doc-themes">
        {NOMS_THEMES.map((nom) => (
          <div key={nom} data-theme={nom} className="doc-theme-carte">
            <Titre niveau={3} apparence="carte">
              {LIBELLE_THEME[nom]}
            </Titre>
            <Souche ton="haute" numero="N° 41" tampon={<Tampon>En cours</Tampon>}>
              <Titre niveau={4} apparence="carte">
                VPN inaccessible
              </Titre>
              <p className="doc-souche-texte">Julien, 23 sept.</p>
            </Souche>
            <Surface ton="claire">
              <Bouton>Créer</Bouton>
            </Surface>
          </div>
        ))}
      </div>
    </section>
  );
}
