# CLAUDE.md — aMP Tickets (Power Apps Code App)

Constitution du projet : règles non négociables + repères pour travailler vite et juste.
`AGENTS.md` conserve la version courte d'origine (constitution seule, montrée en démo).

## Contexte

Démo « Après le vibe coding : garder le volant ». Une Power App **Code App** (React/TS) de suivi
de demandes (tickets) pour les organisateurs de l'aMP, construite en **spec-driven + TDD**,
données dans une liste **SharePoint** `Tickets`.

- **La spec fait foi** : `docs/spec.md` (modèle de données, règles métier 1–7, critères DONE).
  On corrige la spec, puis le code. Jamais l'inverse.
- Plan de tâches : `docs/superpowers/plans/` (sortie du skill `writing-plans`, une TDD strict).
  Le code a été intégralement remis à zéro pour repartir en spec-driven + TDD depuis le domaine
  jusqu'au branchement SharePoint et au déploiement.

## Commandes

```bash
npm install
npm test               # Vitest, une passe — voir docs/superpowers/plans/ pour le compte à jour
npm run test:watch     # boucle TDD : RED → GREEN → refactor
npm run build          # tsc -b (typecheck strict) + vite build — doit passer sans erreur
npm run dev            # http://localhost:3000 — mode MÉMOIRE, sans Power Platform
npm run power:run      # pac code run : hôte Power Apps local, requis pour le mode SharePoint
npm run push           # pac code push : déploiement
```

## Stack (figée)

- Vite 5, React 18, TypeScript 5 `strict` + `noUnusedLocals` + `noUnusedParameters`.
- `@microsoft/power-apps` **1.4.0** (SDK v1). API utilisée : `getContext()` depuis
  `@microsoft/power-apps/app`. `initialize()` n'existe plus en v1 : ne pas le réintroduire.
- Données : connecteur `shared_sharepointonline`, liste `Tickets`
  (colonnes `Title`, `Description`, `Statut`, `Priorite`, `Demandeur`).
- Tests : Vitest 2 + Testing Library, environnement `jsdom`, `globals: true`,
  setup `src/test/setup.ts` (jest-dom).
- CLI : `pac code …` (Power Platform CLI, outil .NET, présent sur la machine). Son successeur
  officiel `pa app …` (`@microsoft/power-apps-cli`, npm) n'est **pas** installé ici.

## Architecture — dépendances à sens unique

```
components/ + hooks/  →  data/TicketRepository (contrat)  →  domain/ (pur)
                            ├─ InMemoryTicketRepository    tests + dev local (défaut)
                            └─ SharePointTicketRepository  adaptateur → generated/
```

| Fichier | Rôle |
|---|---|
| `src/domain/ticket.ts` | Types `Ticket`, `Statut`, `Priorite`, `NouveauTicket`. Fonctions pures : `validerTicket`, `creerTicket`, `changerStatut`, `transitionAutorisee`, `filtrerParStatut`, `trierParPriorite`, `compter`. Les dépendances impures (`id`, `maintenant`) sont **injectées**. |
| `src/data/ticketRepository.ts` | Interface `TicketRepository` : `lister`, `creer`, `changerStatut`, `supprimer`. Seule porte vers les données. |
| `src/data/inMemoryTicketRepository.ts` | Impl mémoire (ids `mem-N`). Utilisée par défaut et dans les tests. |
| `src/data/sharePointTicketRepository.ts` | Adaptateur SharePoint : mappe colonnes SP ↔ modèle métier, délègue au service généré (`../generated/services/TicketsService`). Implémenté. |
| `src/hooks/useTickets.ts` | État, erreurs, rechargement après chaque mutation. Trie via le domaine. |
| `src/App.tsx` | Choisit le repo selon `VITE_USE_SHAREPOINT`. Données de démo en mémoire. |
| `src/PowerProvider.tsx` | Attend `getContext()` avant d'afficher l'app. Bannière si Power Platform indisponible. |
| `src/generated/` + `.power/schemas/` | Sortie de `pac code add-data-source` (modèles + services), commitée. **Jamais éditée à la main.** |

## Règles (non négociables)

1. **TDD strict.** Test qui échoue d'abord (`npm run test:watch`), code minimal, refactor.
   Aucune règle métier sans test rouge préalable.
2. **Le SDK n'est jamais appelé dans les tests.** On teste le domaine et l'impl mémoire.
   Pas de mock du SDK : si un test en a besoin, le découpage est mauvais.
3. **Le domaine reste pur.** Aucun import React ni SDK dans `src/domain/`. Pas de `Date`,
   `Math.random` ou `crypto` en direct : on injecte.
4. **Une seule porte vers les données : `TicketRepository`.** Ni composant ni hook n'importe
   `generated/` ou le SDK. Seul `sharePointTicketRepository.ts` y touche.
5. **TypeScript strict, zéro `any`.** Fonctions courtes. Noms en **français métier**
   (`titre`, `demandeur`, `changerStatut`). Termes techniques anglais tolérés
   (`useTickets`, `Repository`).
6. **Une règle métier = une ligne dans `docs/spec.md` + un test.** Le besoin change ?
   La spec change d'abord.
7. **Aucun secret dans le code.** Connexions gérées par Power Platform. `.env.local` est
   ignoré par git. `power.config.json` ne contient que des identifiants non sensibles.
8. **YAGNI.** Hors périmètre tant que non demandé : pièces jointes, notifications, droits
   fins, multi-listes.

## Règles métier (rappel — la source est `docs/spec.md`)

- Titre obligatoire (≤ 120 car.) et demandeur obligatoire. Sinon : refus.
- Création : statut `Nouveau`, priorité `Moyenne` par défaut, champs trimés.
- Transitions autorisées : `Nouveau → En cours`, `En cours → Résolu`, `En cours → Nouveau`,
  `Résolu → En cours`. **`Nouveau → Résolu` interdit.**
- Tri : `Haute` > `Moyenne` > `Basse`, puis plus récent d'abord. Filtre par statut, `Tous` inclus.
- Suppression : autorisée quel que soit le statut du ticket.
- Prochain ticket à traiter : parmi les `Nouveau`, priorité la plus haute, puis le plus ancien.

## Environnement et bascule de données

- `VITE_USE_SHAREPOINT` absent ou `false` → mémoire (défaut, plan B de démo).
  `true` → `SharePointTicketRepository`.
- `.env.local` : copier `.env.local.example`. Variables : `VITE_SP_SITE_URL`, `VITE_USE_SHAREPOINT`.
- `power.config.json` : produit par `pac code init` (`appId`, `environmentId`) puis complété par
  `pac code add-data-source` (`connectionReferences`). `pac code init` refuse de s'exécuter si le
  fichier existe déjà. Le code applicatif ne le lit pas.

## Brancher SharePoint (étape 6 du plan)

```bash
pac auth create                    # environnement de démo
pac connection list                # connectionId SharePoint (la connexion doit préexister dans make.powerapps.com)
pac code list-datasets ...         # copier la valeur du dataset telle quelle pour -d
pac code list-tables ...           # copier l'id de la table (un GUID) tel quel pour -t
pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" \
  -t "<id de table, sortie de list-tables>" -d "<dataset, sortie de list-datasets>"
```

Puis dans `sharePointTicketRepository.ts` : les imports `../generated/...` et le mapping
(`fromSharePoint` / `toSharePoint`, dans `sharePointMapping.ts`) sont en place ; il reste à
mettre `VITE_USE_SHAREPOINT=true` et à lancer `npm run power:run`.

- Code généré : `src/generated/` et `.power/schemas/`, les deux commités, jamais édités à la main.
  Les imports depuis `src/data/` sont de la forme `../generated/...`.
- Service généré : `getAll()`, `get(id)`, `create(record)`, `update(id, partial)`, `delete(id)`.
  Les résultats sont des `IOperationResult<T> = { success, data, error? }` : `data` est le
  tableau ou l'enregistrement directement (pas d'enveloppe `.value`). `delete` renvoie `void` :
  son échec n'est pas observable.
- Colonnes Choix (`Statut`, `Priorite`), asymétriques : en **lecture** ce sont des objets
  `{ "@odata.type", Value, Id }` ; en **écriture** ce sont de simples chaînes
  (`Statut?: string`). Ne pas envoyer `{ Value: ... }`.
- Ignorer les propriétés suffixées `#Id` du modèle généré dans les payloads `create` / `update`.
- `delete(id)` attend l'ID numérique SharePoint sous forme de chaîne.

## Pièges connus

- **Port 3000.** `vite.config.ts` (`strictPort: true`) et `localAppUrl` de `power.config.json`
  doivent coïncider. Changer l'un = changer l'autre.
- **Mode SharePoint ≠ `npm run dev`.** Les appels données ne passent que par l'hôte Power Apps
  (`npm run power:run`, URL « Local Play », même profil navigateur que le tenant).
  `npm run dev` seul suffit uniquement en mode mémoire.
- **Valeurs de `-d` et `-t`** : les copier depuis `pac code list-datasets` / `list-tables`, ne pas les composer à la main.
- **`pac code` est en preview et en voie de dépréciation** au profit de
  `pa app init | add data-source | run | push`. Les commandes `pac` fonctionnent encore.
  Ne pas mélanger les deux sans mettre à jour les scripts npm.
- **`Cannot find module @rollup/rollup-win32-x64-msvc`** au lancement de Vitest ou Vite :
  `node_modules` incomplet. Relancer `npm install` ; au besoin supprimer `node_modules` et
  `package-lock.json` d'abord.
- **`vitest.config.ts.timestamp-*.mjs`** : résidus d'un chargement de config planté.
  À supprimer, jamais à commiter.
- Code Apps doit être **activé dans l'environnement** (Admin Center → Settings → Features).
  Les utilisateurs finaux ont besoin d'une licence Power Apps Premium.

## Définition du DONE

Une Power App :
- **fonctionnelle** : CRUD bout-en-bout sur la liste SharePoint réelle ;
- **belle** : liste + formulaire + filtres, lisible et responsive ;
- **conforme** à `docs/spec.md`, règles 1–7 couvertes par des tests ;
- **testée** : `npm test` vert ;
- **sans code smells** : `npm run build` passe sans erreur ni warning TypeScript ;
- **déployée** via `npm run push`.
