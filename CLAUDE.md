# CLAUDE.md — aMP Tickets (Power Apps Code App)

Constitution du projet : règles non négociables + repères pour travailler vite et juste.
`AGENTS.md` conserve la version courte d'origine (constitution seule, montrée en démo).

## Contexte

Démo « Après le vibe coding : garder le volant ». Une Power App **Code App** (React/TS) de suivi
de demandes (tickets) pour les organisateurs de l'aMP, construite en **spec-driven + TDD**,
données dans une liste **SharePoint** `Tickets`.

- **La spec fait foi** : `docs/spec.md` (modèle de données, règles métier 1–5, critères DONE).
  On corrige la spec, puis le code. Jamais l'inverse.
- Plan de tâches : `docs/plan.md`. Étapes 1–5 faites (socle testé). 6–8 restantes :
  branchement SharePoint, recette, push.

## Commandes

```bash
npm install
npm test               # Vitest, une passe — 15 tests verts attendus
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
| `src/data/sharePointTicketRepository.ts` | Adaptateur SharePoint : mappe colonnes SP ↔ modèle métier, délègue au service généré. Lève une erreur explicite tant que `generated/` n'existe pas. |
| `src/hooks/useTickets.ts` | État, erreurs, rechargement après chaque mutation. Trie via le domaine. |
| `src/App.tsx` | Choisit le repo selon `VITE_USE_SHAREPOINT`. Données de démo en mémoire. |
| `src/PowerProvider.tsx` | Attend `getContext()` avant d'afficher l'app. Bannière si Power Platform indisponible. |
| `generated/` | Sortie de `pac code add-data-source` (modèles + services). **Jamais édité à la main.** |

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

## Environnement et bascule de données

- `VITE_USE_SHAREPOINT` absent ou `false` → mémoire (défaut, plan B de démo).
  `true` → `SharePointTicketRepository`.
- `.env.local` : copier `.env.local.example`. Variables : `VITE_SP_SITE_URL`, `VITE_USE_SHAREPOINT`.
- `power.config.json` : `appId` et `environmentId` renseignés par `pac code init`,
  `dataSources` par `pac code add-data-source`. Le code applicatif ne le lit pas.

## Brancher SharePoint (étape 6 du plan)

```bash
pac auth create                    # environnement de démo
pac connection list                # connectionId SharePoint (la connexion doit préexister dans make.powerapps.com)
pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" \
  -t "Tickets" -d "<URL du site, DOUBLE URL-encodée>"
```

Puis dans `sharePointTicketRepository.ts` : décommenter les imports `generated/`, écrire
`fromSharePoint` / `toSharePoint`, puis `VITE_USE_SHAREPOINT=true` et `npm run power:run`.

- Service généré : `getAll()`, `get(id)`, `create(record)`, `update(id, partial)`, `delete(id)`.
  Les réponses sont enveloppées : lire `result.data` (et parfois `.value`).
- Colonnes Choix (`Statut`, `Priorite`) : envoyer l'objet développé attendu par le connecteur
  (ex. `{ Value: "Nouveau" }`), pas une simple chaîne. Vérifier la forme dans le modèle généré.
- Ignorer les propriétés suffixées `#Id` du modèle généré dans les payloads `create` / `update`.
- `delete(id)` attend l'ID numérique SharePoint sous forme de chaîne.
- Chemin de génération : la doc officielle actuelle génère dans `src/generated/`, les
  commentaires de l'adaptateur supposent `generated/` à la racine. Vérifier le chemin réellement
  produit et ajuster **les imports**, pas les fichiers générés.

## Pièges connus

- **Port 3000.** `vite.config.ts` (`strictPort: true`) et `localAppUrl` de `power.config.json`
  doivent coïncider. Changer l'un = changer l'autre.
- **Mode SharePoint ≠ `npm run dev`.** Les appels données ne passent que par l'hôte Power Apps
  (`npm run power:run`, URL « Local Play », même profil navigateur que le tenant).
  `npm run dev` seul suffit uniquement en mode mémoire.
- **Dataset double URL-encodé** dans `-d`. `-t` = nom de la liste tel qu'affiché.
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
- **conforme** à `docs/spec.md`, règles 1–5 couvertes par des tests ;
- **testée** : `npm test` vert ;
- **sans code smells** : `npm run build` passe sans erreur ni warning TypeScript ;
- **déployée** via `npm run push`.
