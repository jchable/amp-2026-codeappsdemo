# CLAUDE.md — aMP Tickets (Power Apps Code App)

Constitution du projet : règles non négociables + repères pour travailler vite et juste.
`AGENTS.md` conserve la version courte d'origine (constitution seule, montrée en démo).

## Contexte

Démo « Après le vibe coding : garder le volant ». Une Power App **Code App** (React/TS) de suivi
de demandes (tickets) pour les organisateurs de l'aMP, construite en **spec-driven + TDD**,
données dans une liste **SharePoint** `Tickets`.

- **La spec fait foi** : `docs/spec.md` (modèle de données, règles métier 1–8, critères DONE).
  On corrige la spec, puis le code. Jamais l'inverse.
- Plan de tâches : `docs/superpowers/plans/` (sortie du skill `writing-plans`, une TDD strict).
  Le code a été intégralement remis à zéro pour repartir en spec-driven + TDD depuis le domaine
  jusqu'au branchement SharePoint et au déploiement.

## Commandes

```bash
npm install
npm test               # Vitest, une passe — voir docs/superpowers/plans/ pour le compte à jour
npm run test:watch     # boucle TDD : RED → GREEN → refactor
npm run build          # tsc -b (typecheck strict) + vite build (lit .env.production : app connectée à SharePoint) — doit passer sans erreur
npm run dev            # http://localhost:3000 — mode MÉMOIRE, sans Power Platform
# Documentation du design system : http://localhost:3000/#/design-system (mode mémoire)
npm run dev:sharepoint  # comme dev, mais mode SharePoint (lit .env.sharepoint), à lancer avec power:run
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
- Styles : CSS pur et variables CSS `--cto-*` (design system Contoso), polices `@fontsource-variable`. Aucune bibliothèque de composants ni de CSS-in-JS.

## Architecture — dépendances à sens unique

```
components/ + hooks/  →  data/TicketRepository (contrat)  →  domain/ (pur)
                            ├─ InMemoryTicketRepository    tests + dev local (défaut)
                            └─ SharePointTicketRepository  adaptateur → generated/
```

| Fichier | Rôle |
|---|---|
| `src/domain/ticket.ts` | Types `Ticket`, `Statut`, `Priorite`, `NouveauTicket`. Fonctions pures : `validerTicket`, `creerTicket`, `changerStatut`, `transitionAutorisee`, `transitionsPossibles`, `filtrerParStatut`, `trierParPriorite`, `compter`, `prochainATraiter` (règle 7), `libelleTransition`. Les dépendances impures (`id`, `maintenant`) sont **injectées**. |
| `src/data/ticketRepository.ts` | Interface `TicketRepository` : `lister`, `creer`, `changerStatut`, `supprimer`. Seule porte vers les données. |
| `src/data/inMemoryTicketRepository.ts` | Impl mémoire (ids `mem-N`). Utilisée par défaut et dans les tests. |
| `src/data/sharePointTicketRepository.ts` | Adaptateur SharePoint : mappe colonnes SP ↔ modèle métier, délègue au service généré (`../generated/services/TicketsService`). Implémenté. |
| `src/data/sharePointMapping.ts` | Mapping pur SharePoint ↔ domaine (`fromSharePoint`, `toSharePoint`, `choixSharePoint`) : lecture en objets `{ Value }`, écriture en `{ Value }`, défauts Nouveau/Moyenne (règle 8). Testé sans SDK. |
| `src/hooks/useTickets.ts` | État, erreurs, rechargement après chaque mutation. Trie via le domaine. |
| `src/components/` | Interface « Le guichet » : `Prochain` (hero du prochain ticket), `TicketList` (tickets à souche, boutons de transition), `TicketForm`, `StatusFilter`, `format.ts` (numéro, date). Maquette de référence : `docs/design/mockups/2-guichet.html`. |
| `src/App.tsx` | Compose l'écran ; choisit le repo selon `VITE_USE_SHAREPOINT`. Données de démo en mémoire. |
| `src/PowerProvider.tsx` | Attend `getContext()` avant d'afficher l'app. Bannière si Power Platform indisponible. |
| `src/design-system/` | Design system **Contoso** : tokens `--cto-*` (primitifs → sémantiques par thème → composants), 12 composants React, doc vivante `#/design-system`. Point d'entrée unique : `index.ts`. **N'importe rien du métier.** Voir `src/design-system/README.md`. |
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
7. **Aucun secret ni identifiant de tenant dans le code.** Connexions gérées par Power Platform.
   Les `.env*` sont versionnés (dépôt public) et ne contiennent que des valeurs neutres
   (`votretenant.sharepoint.com`). `power.config.json` (appId, environmentId, connexions) est
   **gitignoré** : seul `power.config.example.json` est versionné. Ne jamais y coller le nom du
   tenant, un GUID d'environnement ou un `connectionId` réels, ni dans un commit, une doc ou un test.
8. **YAGNI.** Hors périmètre tant que non demandé : pièces jointes, notifications, droits
   fins, multi-listes.
9. **Design system Contoso.** Les composants de l'app n'utilisent ni couleur en dur ni couleur
   primitive (`--cto-teal-…`, etc.) : uniquement des tokens sémantiques. Leur CSS local est préfixé
   `app-`. Le DS n'importe jamais le métier (`domain/`, `data/`, `hooks/`, `generated/`, SDK, `App`).
   On importe depuis `../design-system`, jamais un fichier profond. Un nouveau composant ou token
   passe par le README du DS (usage réel, test rouge, fiche de doc, manifeste).

## Règles métier (rappel — la source est `docs/spec.md`)

- Titre obligatoire (≤ 120 car.) et demandeur obligatoire. Sinon : refus.
- Création : statut `Nouveau`, priorité `Moyenne` par défaut, champs trimés.
- Transitions autorisées : `Nouveau → En cours`, `En cours → Résolu`, `En cours → Nouveau`,
  `Résolu → En cours`. **`Nouveau → Résolu` interdit.**
- Tri : `Haute` > `Moyenne` > `Basse`, puis plus récent d'abord. Filtre par statut, `Tous` inclus.
- Suppression : autorisée quel que soit le statut du ticket.
- Prochain ticket à traiter : parmi les `Nouveau`, priorité la plus haute, puis le plus ancien.
- Ligne SharePoint sans statut ou sans priorité : lue comme `Nouveau` / `Moyenne`.

## Environnement et bascule de données

- `VITE_USE_SHAREPOINT` absent ou `false` → mémoire (défaut de `npm run dev`, plan B de démo).
  `true` → `SharePointTicketRepository`.
- Fichiers d'environnement, tous versionnés (dépôt public, valeurs neutres, aucun secret) : `.env.local` (mode mémoire, défaut de `npm run dev`), `.env.production` (SharePoint, lu par `npm run build` donc par `npm run push`), `.env.sharepoint` (SharePoint en local, lu par `npm run dev:sharepoint`). Variables : `VITE_USE_SHAREPOINT` (la bascule) et `VITE_SP_SITE_URL` (indicative : déclarée dans `vite-env.d.ts`, jamais lue par le code ; le site réel est dans `power.config.json`).
- `power.config.json` : **gitignoré**, propre à chaque environnement. Produit par `pac code init`
  (`appId`, `environmentId`) puis complété par `pac code add-data-source` (`connectionReferences`).
  `pac code init` refuse de s'exécuter si le fichier existe déjà. Le code applicatif ne le lit pas.
  Modèle versionné : `power.config.example.json`. Sur un clone : `pac code init`, puis `add-data-source`.
- `src/generated/` et `.power/schemas/` viennent de la liste de la démo : à régénérer pour une autre liste.

## Brancher SharePoint (étape 6 du plan)

```bash
pac auth create                    # environnement de démo
pac code init                      # crée votre power.config.json (gitignoré) ; absent sur un clone
pac connection list                # connectionId SharePoint (la connexion doit préexister dans make.powerapps.com)
pac code list-datasets ...         # copier la valeur du dataset telle quelle pour -d
pac code list-tables ...           # copier l'id de la table (un GUID) tel quel pour -t
pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" \
  -t "<id de table, sortie de list-tables>" -d "<dataset, sortie de list-datasets>"
```

Puis dans `sharePointTicketRepository.ts` : les imports `../generated/...` et le mapping
(`fromSharePoint` / `toSharePoint`, dans `sharePointMapping.ts`) sont en place ; il reste à
lancer `npm run dev:sharepoint` (mode SharePoint) puis `npm run power:run`.

- Code généré : `src/generated/` et `.power/schemas/`, les deux commités, jamais édités à la main.
  Les imports depuis `src/data/` sont de la forme `../generated/...`.
- Service généré : `getAll()`, `get(id)`, `create(record)`, `update(id, partial)`, `delete(id)`.
  Les résultats sont des `IOperationResult<T> = { success, data, error? }` : `data` est le
  tableau ou l'enregistrement directement (pas d'enveloppe `.value`). `delete` renvoie `void` :
  son échec n'est pas observable.
- Colonnes Choix (`Statut`, `Priorite`) : la **lecture** renvoie des objets
  `{ "@odata.type", Value, Id }` ; l'**écriture** doit AUSSI envoyer `{ Value: "..." }`
  (schéma `.power/schemas/sharepointonline/tickets.Schema.json`), bien que le type TypeScript
  généré dise `string` (défaut du générateur : cast à la frontière du repository). Une chaîne
  brute est ignorée silencieusement et crée une ligne aux choix vides.
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
- **Tests de gouvernance du DS** (`src/design-system/gouvernance.test.ts`) : ils lisent les CSS via
  `import.meta.glob(…?raw)`. Un `npm test` rouge « couleur en dur », « token non défini » ou
  « contraste » se corrige dans les tokens, pas en assouplissant le test.
- **Hash routing** : la doc est sur `#/design-system`. Elle est rendue hors de `PowerProvider`.
- Code Apps doit être **activé dans l'environnement** (Admin Center → Settings → Features).
  Les utilisateurs finaux ont besoin d'une licence Power Apps Premium.

## Définition du DONE

Une Power App :
- **fonctionnelle** : CRUD bout-en-bout sur la liste SharePoint réelle ;
- **belle** : liste + formulaire + filtres, lisible et responsive ;
- **conforme** à `docs/spec.md`, règles 1–8 couvertes par des tests ;
- **testée** : `npm test` vert ;
- **sans code smells** : `npm run build` passe sans erreur ni warning TypeScript ;
- **déployée** via `npm run push`.
