# Constitution — aMP Tickets (Power Apps Code App)

Règles non-négociables. L'agent lit ce fichier avant chaque prompt.

## Stack
- Power Apps **Code App** : Vite + React 18 + TypeScript (strict).
- Données : **SharePoint** via le connecteur `shared_sharepointonline` (liste `Tickets`).
- SDK : `@microsoft/power-apps`. L'app tourne sur le **port 3000** (imposé par le SDK).
- Tests : **Vitest** + Testing Library. Le SDK n'est jamais appelé dans les tests.

## Discipline (imposée)
- **TDD strict** : test rouge d'abord, puis code minimal, puis refactor. Aucun code métier sans test qui échoue d'abord.
- **La logique métier vit dans `src/domain/` en fonctions pures** (aucun import React, aucun SDK) → 100 % testable.
- **L'accès données passe par une interface `TicketRepository`** ; l'implémentation SharePoint est isolée dans `src/data/`. Les composants ne parlent jamais au service généré directement.
- Les fichiers de `generated/` (modèles + services `pac code`) ne sont **jamais** édités à la main.
- TypeScript `strict`, pas de `any`, fonctions courtes, noms explicites en français métier.
- **Aucun secret en dur** : connexions gérées par Power Platform ; `.env.local` non commité.
- Le SDK doit être **initialisé** (PowerProvider) avant tout appel données.

## Définition du DONE
Une Power App **fonctionnelle**, **belle**, **conforme aux besoins**, **testée** (vert), **sans code smells**, déployée via `pac code push`.
