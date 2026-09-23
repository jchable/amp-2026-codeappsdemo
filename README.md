# aMP Tickets — Power Apps Code App (démo)

Démo de la session **« Après le vibe coding : garder le volant »** : générer une Power App
(**Code Apps**, React/TypeScript) en **spec-driven + TDD**, données **SharePoint**.

## Démarrer
```bash
npm install
npm run test        # 15 tests verts (le socle métier)
npm run dev         # http://localhost:3000  (port imposé par le SDK Power Apps)
```
Par défaut l'app tourne en **mémoire** (données de démo). Pour brancher SharePoint,
voir `docs/demo-runbook.md`, puis `VITE_USE_SHAREPOINT=true`.

## Structure
```
CLAUDE.md / AGENTS.md      constitution (règles imposées à l'agent)
docs/spec.md               la spec (design doc)  ← artefact central
docs/plan.md               plan d'implémentation
docs/demo-runbook.md       déroulé de démo + plan B
src/domain/                logique métier PURE + tests Vitest  ← le garde-fou testé
src/data/                  TicketRepository (contrat) + impl mémoire + impl SharePoint
src/hooks/ src/components/  React
generated/                 GÉNÉRÉ par pac code (ne pas éditer)
```

## Déployer
```bash
pac code push
```
Voir `docs/demo-runbook.md` pour la configuration Power Platform / SharePoint complète.
