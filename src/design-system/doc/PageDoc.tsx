import { useState } from "react";
import { Page, Puce, Titre } from "../index";
import { NOMS_THEMES, type NomTheme } from "../tokens/themes";
import { SectionComposants } from "./SectionComposants";
import { SectionFondations } from "./SectionFondations";
import { SectionGouvernance } from "./SectionGouvernance";
import { SectionPrincipes } from "./SectionPrincipes";
import { LIBELLE_THEME, SectionThemes } from "./SectionThemes";
import "./PageDoc.css";

export default function PageDoc() {
  const [theme, setTheme] = useState<NomTheme>("comptoir");
  return (
    <div data-theme={theme} data-testid="conteneur-doc" className="doc">
      <Page>
        <header className="doc-entete">
          <Titre niveau={1}>Contoso</Titre>
          <p>Le design system d'aMP Tickets : tokens, thèmes, composants et règles de gouvernance.</p>
          <div className="doc-selecteur" role="group" aria-label="Thème de la page">
            {NOMS_THEMES.map((nom) => (
              <Puce key={nom} actif={theme === nom} onClick={() => setTheme(nom)}>
                {LIBELLE_THEME[nom]}
              </Puce>
            ))}
          </div>
        </header>
        <SectionPrincipes />
        <SectionFondations />
        <SectionThemes />
        <SectionComposants />
        <SectionGouvernance />
      </Page>
    </div>
  );
}
