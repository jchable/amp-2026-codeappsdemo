# aMP Tickets — Power Apps Code App (démo)

Démo de la session **« Après le vibe coding : garder le volant »** : générer une Power App
(**Code Apps**, React/TypeScript) en **spec-driven + TDD**, données **SharePoint**.
Une application de suivi de demandes (tickets) pour des organisateurs d'événement.

## Démarrer

```bash
npm install
npm test            # Vitest : domaine, données, composants, design system
npm run dev         # http://localhost:3000  (port imposé par le SDK Power Apps)
```

Par défaut l'app tourne en **mémoire** (données de démo), sans Power Platform.
La documentation du design system est sur `http://localhost:3000/#/design-system`.

## Brancher votre propre SharePoint

Le dépôt ne contient **aucun identifiant de tenant**. `power.config.json` est propre à votre
environnement : il est ignoré par git et `power.config.example.json` en donne la forme.
Sur un clone, il faut donc :

1. `pac auth create`, puis `pac code init` (crée votre `power.config.json`) ;
2. `pac code add-data-source …` sur votre liste SharePoint `Tickets` (voir `CLAUDE.md`,
   section « Brancher SharePoint », et `docs/aMP-demo-runbook.md`, étape A5) ;
3. `npm run dev:sharepoint` puis `npm run power:run`.

Les fichiers de `src/generated/` et `.power/schemas/` sont la sortie de cette génération
pour la liste de la démo : ils seront régénérés pour la vôtre.

## Structure

```
CLAUDE.md / AGENTS.md         constitution (règles imposées à l'agent)
docs/spec.md                  la spec (modèle de données, règles métier)  ← artefact central
docs/superpowers/specs/       specs de conception (skill brainstorming) : l'app, le design system
docs/superpowers/plans/       plans d'implémentation (skill writing-plans)
docs/aMP-demo-runbook.md      déroulé de démo + plan B
docs/runbook-deploy.md        procédure de déploiement, nettoyage, dépannage
docs/design/mockups/          maquettes de l'interface
src/domain/                   logique métier PURE + tests Vitest  ← le garde-fou testé
src/data/                     TicketRepository (contrat) + impl mémoire + impl SharePoint
src/hooks/  src/components/   React
src/design-system/            design system Contoso (tokens, composants, doc vivante)
src/generated/                GÉNÉRÉ par pac code (ne pas éditer)
```

## Déployer

```bash
npm run build && npm run push      # pac code push
```

Voir `docs/runbook-deploy.md`. ⚠️ Le push modifie un environnement Power Platform.

## Licence

[MIT](LICENSE)
