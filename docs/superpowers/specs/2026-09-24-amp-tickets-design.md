# aMP Tickets — spec de conception

Date : 2026-09-24 · Nature : **rétrospective** (exemple de sortie du skill `brainstorming`)
Base : `main`, application livrée et testée.

> **Source de vérité.** Les règles métier et les critères DONE vivent dans
> [`docs/spec.md`](../../spec.md) ; ce document ne les recopie pas, il les référence par leur
> numéro. On change une règle dans `docs/spec.md` d'abord, puis ici si l'architecture bouge, puis
> dans le code.
>
> **Ce que ce document est.** La spec de conception qu'aurait produite l'étape A1 de la démo
> (`docs/aMP-demo-runbook.md`) : intention, périmètre, décisions et alternatives écartées,
> architecture, stratégie de test, ordre d'exécution, risques. Il a été rédigé **après coup** à
> partir de `docs/spec.md`, de `CLAUDE.md` et du code : les motifs des décisions sont reconstitués,
> ils ne sont pas tirés d'un dialogue d'époque.

## 1. Intention

Les organisateurs de l'aMP reçoivent des demandes (matériel, accès, incidents) par des canaux
dispersés. Livrer une **Power App Code App** (React/TypeScript) qui permet de saisir, suivre et
clôturer ces demandes, avec les données dans une liste SharePoint `Tickets`.

L'app est aussi le **support d'une démonstration** : montrer qu'on peut déléguer du code à un agent
sans perdre le contrôle, grâce à une spec, des tests écrits avant le code et une constitution
(`CLAUDE.md`). Chaque choix ci-dessous doit donc rester lisible en quelques minutes.

**Succès** = les critères DONE de `docs/spec.md` sont tenus **et** :
- `npm test` est vert et `npm run build` passe sans erreur ni warning TypeScript ;
- le domaine métier se teste sans SDK, sans React, sans réseau ;
- l'app tourne à l'identique en mode mémoire (démo, plan B) et en mode SharePoint : seule la
  source de données change.

## 2. Périmètre

**Dans le périmètre** : les 8 règles métier de `docs/spec.md`, le CRUD d'un ticket (créer, lister,
changer de statut, supprimer), l'interface (prochain ticket, formulaire, filtre par statut, liste),
les deux implémentations de données (mémoire, SharePoint), le déploiement par `pac code push`.

**Hors périmètre (YAGNI, cf. `docs/spec.md`)** : pièces jointes, notifications, droits fins,
multi-listes. Pas non plus : édition d'un ticket après création, authentification propre à l'app
(l'identité vient de Power Platform), pagination de la liste.

Le **design system Contoso** a sa propre spec
([`2026-09-23-design-system-contoso-design.md`](2026-09-23-design-system-contoso-design.md)) : l'app
le consomme, elle ne le définit pas.

## 3. Décisions et alternatives écartées

| # | Décision | Alternative écartée | Pourquoi |
|---|---|---|---|
| D1 | Toute la logique métier en **fonctions pures** dans `src/domain/`, dépendances impures (`id`, `maintenant`) **injectées**. | Logique dans les composants ou dans les hooks. | Testable sans rendu ni SDK ; le test rouge d'une règle tient en quelques lignes. |
| D2 | **Une seule porte vers les données** : l'interface `TicketRepository`. | Appeler le service généré (`generated/`) depuis les hooks. | Le SDK n'est jamais appelé dans les tests, et le reste de l'app ignore d'où viennent les données. |
| D3 | **Deux implémentations** : mémoire (défaut) et SharePoint, choisies par `VITE_USE_SHAREPOINT` au build. | SharePoint seul, avec des mocks du SDK dans les tests. | Une démo doit survivre à une panne réseau (plan B) ; un mock du SDK trahit un mauvais découpage. |
| D4 | Un **mapping SharePoint ↔ domaine pur** (`sharePointMapping.ts`), séparé de l'adaptateur. | Mapper à l'intérieur de l'adaptateur. | Les pièges du connecteur (colonnes Choix, `null` OData) se testent sans SDK. |
| D5 | **`useTickets` recharge la liste après chaque mutation**, y compris après un échec. | Mise à jour locale optimiste. | Une écriture a pu réussir côté serveur alors que sa réponse échoue : un nouvel essai aveugle créerait un doublon. |
| D6 | Interface **« Le guichet »**, retenue parmi 5 maquettes interactives (`docs/design/mockups/`). | Tableau, file, strates, terrain. | Met en tête le ticket à traiter en premier (règle 7) ; lisible et tactile sur mobile. |
| D7 | Une règle rejetée est une **erreur explicite**, jamais une correction silencieuse (valeur de statut inconnue, transition interdite). | Retomber sur une valeur par défaut. | Une donnée mal formée doit se voir ; seule l'**absence** de valeur reçoit un défaut (règle 8). |

## 4. Architecture

Dépendances à sens unique :

```
components/ + hooks/  →  data/TicketRepository (contrat)  →  domain/ (pur)
                            ├─ InMemoryTicketRepository    tests + dev local (défaut)
                            └─ SharePointTicketRepository  adaptateur → generated/
```

| Unité | Rôle | Dépend de |
|---|---|---|
| `src/domain/ticket.ts` | Types `Ticket`, `Statut`, `Priorite` ; `validerTicket`, `creerTicket`, `changerStatut`, `transitionAutorisee`, `transitionsPossibles`, `filtrerParStatut`, `trierParPriorite`, `compter`, `prochainATraiter`, `libelleTransition`. | rien |
| `src/data/ticketRepository.ts` | Contrat : `lister`, `creer`, `changerStatut`, `supprimer`. | `domain/` |
| `src/data/inMemoryTicketRepository.ts` | Implémentation mémoire (ids `mem-N`). | `domain/` |
| `src/data/sharePointMapping.ts` | Mapping pur colonnes SharePoint ↔ `Ticket` (`fromSharePoint`, `toSharePoint`, `choixSharePoint`). | `domain/` |
| `src/data/sharePointTicketRepository.ts` | Adaptateur : mappe et délègue au service généré. **Seul fichier** qui touche `generated/` et le SDK. | mapping, `generated/` |
| `src/hooks/useTickets.ts` | État, erreurs, rechargement après mutation ; trie via le domaine. | contrat `TicketRepository` |
| `src/components/`, `src/App.tsx` | Interface, composition, choix du repository. | hooks, `domain/`, design system |
| `src/PowerProvider.tsx` | Attend `getContext()` avant d'afficher l'app ; bannière si Power Platform est absent. | SDK |

`src/generated/` et `.power/schemas/` sont la sortie de `pac code add-data-source` : commités,
**jamais édités à la main**.

## 5. Règles métier

Source : [`docs/spec.md`](../../spec.md), règles 1 à 8. Chaque règle a au moins un test rouge écrit
**avant** son code (règle 6 de `CLAUDE.md`).

| Règle | Résumé | Où elle vit | Test qui la verrouille |
|---|---|---|---|
| 1 | Titre (≤ 120) et demandeur obligatoires | `validerTicket` | `ticket.test.ts` › `validerTicket` (exige, espaces seuls, 120/121) |
| 2 | Création : `Nouveau`, priorité `Moyenne` | `creerTicket` | `ticket.test.ts` › `creerTicket` |
| 3 | Transitions autorisées, `Nouveau → Résolu` interdit | `changerStatut` | `ticket.test.ts` › `changerStatut / transitionAutorisee` |
| 4 | Tri priorité décroissante, puis plus récent | `trierParPriorite` | `ticket.test.ts` › `trierParPriorite` (dont le départage par date) |
| 5 | Filtre par statut, `Tous` inclus | `filtrerParStatut` | `ticket.test.ts` › `filtrerParStatut`, `compter` |
| 6 | Suppression quel que soit le statut | `TicketRepository.supprimer` | `inMemoryTicketRepository.test.ts` (Nouveau, En cours, Résolu) |
| 7 | Prochain ticket : `Nouveau`, priorité max, puis plus ancien | `prochainATraiter` | `ticket.test.ts` › `prochainATraiter (règle 7)` |
| 8 | Ligne SharePoint sans statut/priorité lue comme `Nouveau`/`Moyenne` ; valeur inconnue = erreur | `fromSharePoint` | `sharePointMapping.test.ts` › défauts à la lecture (règle 8), valeurs distantes invalides |

## 6. Stratégie de test

- **Outils** : Vitest 2, Testing Library, environnement `jsdom`, `globals: true`.
- **Le SDK n'est jamais appelé dans les tests.** On teste le domaine, le mapping SharePoint pur et
  l'implémentation mémoire. Si un test réclame un mock du SDK, c'est le découpage qui est faux.
- **Domaine et mapping** : tests unitaires purs, sans horloge ni aléa (`id` et `maintenant` injectés).
- **Hook** : `useTickets` est testé contre l'implémentation mémoire et contre un repository dont
  les mutations tombent en panne (erreur exposée, liste rechargée quand même).
- **Composants** : rendu et interactions (trois priorités en radios avec `Moyenne` par défaut,
  erreurs de validation affichées, saisie conservée si la création échoue, bouton désactivé pendant
  la création pour éviter le double envoi).
- **Ce que les tests ne couvrent pas** : l'appel réel au connecteur SharePoint. Il est vérifié à la
  main sur la liste réelle (recette CRUD) via `npm run dev:sharepoint` et `npm run power:run`.

## 7. Ordre d'exécution

Le plan détaillé est dans
[`docs/superpowers/plans/2026-09-23-amp-tickets-rebuild.md`](../plans/2026-09-23-amp-tickets-rebuild.md).
Chaque tâche suit RED → GREEN → refactor.

1. **Domaine** : types, validation, création (règles 1–2), transitions (3), tri et filtre (4–5).
2. **Données en mémoire** : contrat `TicketRepository` et implémentation mémoire (règle 6).
3. **Orchestration** : hook `useTickets`.
4. **Interface** : composants, `PowerProvider`, `App` — l'app fonctionne en mode mémoire.
   Vérification de bout en bout : typecheck strict, build, `npm run dev`.
5. **SharePoint** : génération du service, mapping pur testé, câblage de l'adaptateur, bascule.
6. **Recette et déploiement** : CRUD sur la liste réelle, puis `pac code push`.

Deux règles sont arrivées en cours de route, toujours dans le même ordre : la spec change d'abord,
puis le test rouge, puis le code. La **règle 7** (prochain ticket) a été ajoutée pendant la
reconstruction, avant le premier déploiement. La **règle 8** (défauts à la lecture) est postérieure
au premier `pac code push` : elle répond à un défaut constaté sur la liste réelle (colonnes Choix
écrites en chaîne brute, donc lignes aux choix vides).

## 8. Risques

| Risque | Effet | Parade |
|---|---|---|
| Colonnes Choix : le type généré annonce `string`, le connecteur exige `{ Value }` | Une chaîne brute est ignorée sans erreur : la ligne est créée avec des choix vides | Cast **à un seul endroit** (adaptateur), test du payload, règle 8 pour relire de telles lignes |
| `delete` du service généré renvoie `void` | Un échec de suppression n'est pas observable | Rechargement de la liste après chaque mutation (D5) |
| `getAll` sans pagination | Une longue liste peut être tronquée par la taille de page du connecteur | Hors périmètre tant que la liste reste courte ; à vérifier sur la liste réelle |
| Port 3000 imposé par le SDK | `localhost` refusé si `vite.config.ts` et `localAppUrl` divergent | `strictPort: true`, à changer des deux côtés ensemble |
| `pac code` est en preview et en voie de dépréciation (successeur `pa app`) | Scripts npm obsolètes | Ne pas mélanger les deux CLI sans mettre à jour les scripts |
| Le mode SharePoint ne marche que dans l'hôte Power Apps | `npm run dev` seul n'atteint pas les données | `npm run power:run` obligatoire ; le mode mémoire reste le plan B |
| Dérive entre la spec courte et cette spec | Deux vérités | Les règles ne sont **pas** recopiées ici, seulement référencées |

## 9. Critères DONE

Ceux de [`docs/spec.md`](../../spec.md) (CRUD complet sur la liste SharePoint, règles 1–8 couvertes
par des tests verts, interface lisible et responsive, application déployée via `pac code push`),
auxquels s'ajoutent les critères de succès du §1 : `npm test` vert, `npm run build` sans erreur ni
warning, domaine testable sans SDK.
