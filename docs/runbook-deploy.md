# Runbook de déploiement — aMP Tickets

Séquence pour déployer l'app en local (connectée à SharePoint), la publier sur PowerApps,
puis vérifier la version finale sans dépendance à `localhost`. Complète
`docs/aMP-demo-runbook.md` (scénario de démo) côté procédure de mise en prod. C'est aussi le
recueil des commandes et du dépannage : le runbook de démo n'en garde pas de copie.

---

## Pré-requis

- [ ] `npm install` OK.
- [ ] `pac auth list` : une session active sur le bon tenant.
- [ ] `power.config.json` existe **en local** : il est gitignoré (propre à votre environnement,
      modèle : `power.config.example.json`). Absent sur un clone → `pac code init`.
- [ ] `pac org select` fait pointer la CLI sur l'environnement du `power.config.json`
      (`environmentId`, sans le préfixe `Default-`) — voir section Dépannage sinon.
- [ ] `power.config.json` contient déjà `connectionReferences` (étape « brancher SharePoint »
      faite avec `pac code add-data-source`, cf. `CLAUDE.md`).

---

## Phase 1 — Déployer en local, connecté à SharePoint

1. Rien à configurer côté `.env*` : `npm run dev:sharepoint` lit `.env.sharepoint`
   (`VITE_USE_SHAREPOINT=true`). Le site SharePoint réel est celui du `power.config.json`.
2. Lancer **deux terminaux en parallèle** — `pac code run` n'est pas un serveur de dev, c'est
   le proxy d'authentification Power Platform : il s'attend à ce que l'appli tourne déjà sur
   `localhost:3000` (sinon → « localhost a refusé de se connecter » sur l'URL Local Play).
   - **Terminal 1**, à laisser tourner :
     ```bash
     npm run dev:sharepoint
     ```
   - **Terminal 2**, une fois le premier prêt :
     ```bash
     npm run power:run
     ```
   Les appels données ne passent que par cet hôte — jamais `npm run dev:sharepoint` ni `npm run dev`
   seuls en mode SharePoint.
3. Sur l'URL « Local Play » (même profil navigateur que le tenant), tester le CRUD complet :
   créer / modifier / supprimer un ticket, vérifier qu'il apparaît dans la liste SharePoint `Tickets`.
4. Vérifier le design system **Contoso** (documentation vivante, sur le hash `#/design-system`) :
   - **En local**, Terminal 1 lancé : ouvrir `http://localhost:3000/#/design-system`. La doc s'affiche
     (principes, fondations, thèmes Comptoir et Jour, 12 composants). Basculer le thème avec les
     deux boutons en haut de page : seul le contenu de la doc change de thème, pas la page du navigateur.
   - **Dans l'hôte Power Apps — à vérifier une fois** (jamais fait à ce jour : la vérification
     demande votre profil navigateur, elle n'a pas pu être faite depuis une session automatisée) :
     sur l'URL « Local Play », ajouter `#/design-system` à la fin de l'URL puis recharger.
     Attendu : la doc s'affiche, sans passer par `getContext()` (elle est rendue hors de
     `PowerProvider`). Si l'hôte encadre l'app dans un cadre dont l'URL n'est pas modifiable,
     la doc n'est consultable qu'en local : **ce n'est pas bloquant** pour le déploiement.
   - Sans hash, l'app se comporte exactement comme avant, mode SharePoint compris.
5. Avant de publier :
   ```bash
   npm test          # vert — inclut les tests de gouvernance du design system
   npm run build     # tsc -b + vite build, sans erreur ni warning
   ```
   Les tests de gouvernance vérifient : aucune couleur en dur, contrastes WCAG dans les deux
   thèmes, frontières d'import, une fiche de doc par composant. Un test rouge se corrige dans
   les tokens ou le composant, jamais en assouplissant le test.

---

## Phase 2 — Publier sur PowerApps (déploiement)

```bash
npm run push        # = pac code push
```

Build l'app (`./dist`, cf. `power.config.json`) et l'enregistre dans l'environnement
(`environmentId` du `power.config.json`). Ouvrir ensuite l'app depuis `make.powerapps.com`
(pas via « Local Play ») pour vérifier qu'elle tourne côté plateforme.

La page de doc du design system voyage dans le bundle mais dans un **chunk séparé** (~30 Ko),
chargé seulement quand on ouvre `#/design-system` : elle n'alourdit pas le chargement de l'app.

⚠️ Modifie un environnement Power Platform partagé — à exécuter en connaissance de cause,
jamais en boucle automatique.

**Retrouver l'URL de l'app :**
- `pac code push` l'affiche dans sa sortie console à la fin du déploiement (ligne « App url: … »).
- Sinon : `make.powerapps.com` → votre environnement (celui de `environmentId`) → **Apps** → chercher
  `aMP Tickets` (= `appDisplayName` du `power.config.json`) → **Détails** ou **Partager**
  donne l'URL de lancement. L'`appId` du `power.config.json` identifie l'app sans ambiguïté si le
  nom ne suffit pas.

---

## Phase 3 — Version finale, sans localhost connecté

Les Code Apps n'ont pas de bouton « Publier » séparé (contrairement aux Canvas Apps) :
`pac code push` **est** la publication, et le bundle uploadé est autonome.

1. Couper `npm run power:run` (plus rien en local).
2. Ouvrir l'app **directement depuis PowerApps** (`make.powerapps.com` → Apps, ou le lien
   direct de l'app), pas via l'URL locale.
3. Refaire le test CRUD complet sur cette URL cloud pour confirmer qu'elle fonctionne
   indépendamment du poste de dev.
4. Si tout est bon, c'est la version finale. Pour republier après une retouche de code :
   `npm run push` de nouveau (écrase la version précédente dans l'environnement, pas de
   rollback automatique).
5. Optionnel : si l'URL cloud de l'app accepte un hash, ajouter `#/design-system` pour voir la
   doc du design system côté plateforme. Sinon elle reste consultable en local. **Ne pas en faire
   un critère de réussite** du déploiement : l'app, elle, doit fonctionner sans hash.

---

## Dépublier et nettoyer — pour rejouer la procédure

Objectif : remettre l'environnement Power Platform et le repo dans un état permettant de
refaire tout ou partie de la démo (Phase 1 → 3) depuis le début.

### 1. Dépublier l'app dans l'environnement

`pac code` n'a **pas** de commande de suppression (vérifié : `pac code list` montre l'app,
mais ni `pac code`, ni `pac power-apps` [lecture seule], ni `pac application` [marketplace
Dataverse uniquement] n'exposent de `delete` pour un Code App). Ça passe par le portail :

- `make.powerapps.com` → votre environnement (celui de `environmentId`) → **Apps** → `aMP Tickets`
  → menu **…** → **Supprimer**.

Une fois supprimée, `npm run push` (= `pac code push`) recrée l'app depuis zéro au prochain
déploiement.

### 2. Nettoyer les données de test dans SharePoint

Les tickets créés pendant les répétitions restent dans la liste SharePoint `Tickets` — à
supprimer avant la vraie démo (vue liste SharePoint → sélectionner les lignes de test →
Supprimer). Liste SharePoint classique, pas de commande `pac` pour ça.

### 3. (Optionnel) Retirer la source de données locale — pour rejouer A5 « brancher SharePoint »

```bash
pac code delete-data-source --dataSourceName tickets --apiId shared_sharepointonline
```

Retire l'entrée de `power.config.json` (`connectionReferences`). Pour rejouer l'étape en
live, relancer ensuite `pac code add-data-source` (cf. `CLAUDE.md`, section « Brancher
SharePoint »).

⚠️ Ça touche `power.config.json` (**local, non versionné** : en garder une copie avant), ainsi que
`src/generated/` et `.power/schemas/` (**commités**) — vérifier `git status` avant de relancer
`add-data-source`, pour ne pas mélanger un état de répétition avec les fichiers réels du repo.

### 4. Repartir d'un repo propre

```bash
git status                                                        # vérifier ce qui a bougé
git checkout -- src/generated .power/schemas   # si retouchés sans le vouloir (power.config.json n'est pas versionné)
```

Ou, pour revenir à un état de démo connu, utiliser les tags `step-*` (cf. `docs/aMP-demo-runbook.md`,
section Plan B) : `git switch --detach step-2-development`.

---

## Dépannage

### `Error: No active environment set for the current auth profile.`

`pac auth list` peut afficher une session **UNIVERSAL** sans environnement actif associé.
Fixer via :

```bash
pac org list                        # repérer l'Environment ID (sans le préfixe "Default-")
pac org select --environment <environmentId ou Environment URL>
pac org who                         # vérifie que l'environnement actif est le bon
```

L'`environmentId` attendu est celui de `power.config.json` (retirer le préfixe `Default-` :
`Default-<guid>` → `<guid>`).

### L'app en prod affiche des données fictives au lieu de SharePoint

`VITE_USE_SHAREPOINT` est lu **au build**, pas à l'exécution (constante `useSharePoint` de `src/App.tsx`), et `pac code push`
**n'effectue pas de build lui-même** : il republie tel quel le `./dist` existant. Le build de
production lit `.env.production` (`VITE_USE_SHAREPOINT=true`, prioritaire sur `.env.local` qui est en
mode mémoire). Donc : toujours refaire `npm run build` juste avant `npm run push`, et ne pas changer
la valeur de `.env.production`. Un `dist` construit dans un autre mode, ou avec un `.env.production`
modifié, republie du mémoire sans prévenir.

Vérifier avant de publier :
```bash
npm run build
grep -c "getContext\|getAll\|sharepointonline" dist/assets/*.js   # > 0 si SharePoint est bien actif
```

### `npm test` rouge après une retouche de CSS (design system)

Les tests de gouvernance (`src/design-system/gouvernance.test.ts`) lisent les fichiers CSS.
Messages fréquents et remède :
- **« aucune couleur en dur »** : un hex / `rgb()` / `hsl()` a été écrit hors de
  `src/design-system/tokens/primitifs.css`. Passer par un token sémantique (`var(--cto-…)`).
- **« … ne lit une couleur primitive »** : un composant lit `--cto-teal-…`, `--cto-corail-…`,
  etc. Utiliser le token sémantique correspondant (`--cto-fond-surface`, …).
- **« var(--cto-…) utilisée mais non définie »** : faute de frappe, ou token à ajouter dans les
  fichiers de tokens **et** dans `src/design-system/tokens/manifeste.ts`.
- **contraste** : la paire texte/fond passe sous le seuil WCAG dans un des deux thèmes ; corriger
  la valeur du token, pas le seuil.

### Les tests de gouvernance passent alors qu'un CSS est visiblement faux

Vitest 2 renvoie une chaîne **vide** pour tout import `.css?raw` sans l'option
`css: { include: [/\.css\?raw$/] }` de `vitest.config.ts` : tous les scans passeraient alors à vide.
Ne pas retirer cette option ; un test-garde (« les CSS sont réellement lus ») échoue si elle
disparaît.

### Autres pièges (cf. aussi `CLAUDE.md`, section « Pièges connus »)

- **Port 3000 obligatoire** (`vite.config.ts` `strictPort: true` ↔ `localAppUrl`).
- **Dataset SharePoint en double URL-encode** avec `pac code add-data-source` (le simple ne marche
  pas) — comportement non documenté officiellement, propre à `pac code` (pas à `pa app`, qui prend
  l'URL en clair). Plus sûr : copier la valeur exacte depuis `pac code list-datasets` /
  `list-tables`, ne jamais l'encoder ni la composer à la main.
- **La connexion SharePoint doit préexister** dans `make.powerapps.com` (la CLI ne la crée pas).
- **`src/generated/` ne s'édite jamais** (régénéré par `pac code`).
- **SDK initialisé** (`PowerProvider`, `getContext()`) **avant** tout appel données.
- **Doc du design system** (`#/design-system`) : rendue **hors** `PowerProvider`, fiable en local,
  **non vérifiée dans l'hôte Power Apps** (voir Phase 1, étape 4).

### Aide-mémoire commandes

```bash
npm install                 # 1re fois
npm test                    # socle métier + gouvernance du design system
npm run test:watch          # boucle TDD, démo RED → GREEN
npm run dev                 # http://localhost:3000 (mode mémoire ; doc : /#/design-system)
npm run dev:sharepoint      # idem en mode SharePoint, avec npm run power:run
pac auth list               # vérifier la session
pac connection list         # récupérer le connectionId SharePoint
pac code list-datasets / list-tables / add-data-source   # valeurs copiées, jamais encodées à la main
npm run build && npm run push   # build puis pac code push
```

