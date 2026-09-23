# Runbook de déploiement — aMP Tickets

Séquence pour déployer l'app en local (connectée à SharePoint), la publier sur PowerApps,
puis vérifier la version finale sans dépendance à `localhost`. Complète
`docs/aMP-demo-runbook.md` (scénario de démo) côté procédure de mise en prod.

---

## Pré-requis

- [ ] `npm install` OK.
- [ ] `pac auth list` : une session active sur le bon tenant.
- [ ] `pac org select` fait pointer la CLI sur l'environnement du `power.config.json`
      (`environmentId`, sans le préfixe `Default-`) — voir section Dépannage sinon.
- [ ] `power.config.json` contient déjà `connectionReferences` (étape « brancher SharePoint »
      faite, cf. `CLAUDE.md`).

---

## Phase 1 — Déployer en local, connecté à SharePoint

1. Créer `.env.local` si absent :
   ```bash
   cp .env.local.example .env.local
   ```
   Mettre `VITE_USE_SHAREPOINT=true` (et `VITE_SP_SITE_URL` si besoin).
2. Lancer **deux terminaux en parallèle** — `pac code run` n'est pas un serveur de dev, c'est
   le proxy d'authentification Power Platform : il s'attend à ce que l'appli tourne déjà sur
   `localhost:3000` (sinon → « localhost a refusé de se connecter » sur l'URL Local Play).
   - **Terminal 1**, à laisser tourner :
     ```bash
     npm run dev
     ```
   - **Terminal 2**, une fois le premier prêt :
     ```bash
     npm run power:run
     ```
   Les appels données ne passent que par cet hôte — jamais `npm run dev` seul en mode SharePoint.
3. Sur l'URL « Local Play » (même profil navigateur que le tenant), tester le CRUD complet :
   créer / modifier / supprimer un ticket, vérifier qu'il apparaît dans la liste SharePoint `Tickets`.
4. Avant de publier :
   ```bash
   npm test          # vert
   npm run build     # tsc -b + vite build, sans erreur ni warning
   ```

---

## Phase 2 — Publier sur PowerApps (déploiement)

```bash
npm run push        # = pac code push
```

Build l'app (`./dist`, cf. `power.config.json`) et l'enregistre dans l'environnement
(`environmentId` du `power.config.json`). Ouvrir ensuite l'app depuis `make.powerapps.com`
(pas via « Local Play ») pour vérifier qu'elle tourne côté plateforme.

⚠️ Modifie un environnement Power Platform partagé — à exécuter en connaissance de cause,
jamais en boucle automatique.

**Retrouver l'URL de l'app :**
- `pac code push` l'affiche dans sa sortie console à la fin du déploiement (ligne « App url: … »).
- Sinon : `make.powerapps.com` → environnement « votre environnement » → **Apps** → chercher
  `aMP Tickets` (= `appDisplayName` du `power.config.json`) → **Détails** ou **Partager**
  donne l'URL de lancement. `appId` (`11111111-1111-1111-1111-111111111111`) identifie l'app
  sans ambiguïté si le nom ne suffit pas.

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

---

## Dépublier et nettoyer — pour rejouer la procédure

Objectif : remettre l'environnement Power Platform et le repo dans un état permettant de
refaire tout ou partie de la démo (Phase 1 → 3) depuis le début.

### 1. Dépublier l'app dans l'environnement

`pac code` n'a **pas** de commande de suppression (vérifié : `pac code list` montre l'app,
mais ni `pac code`, ni `pac power-apps` [lecture seule], ni `pac application` [marketplace
Dataverse uniquement] n'exposent de `delete` pour un Code App). Ça passe par le portail :

- `make.powerapps.com` → environnement « votre environnement » → **Apps** → `aMP Tickets`
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

⚠️ Ça touche `power.config.json`, `src/generated/` et `.power/schemas/`, tous **commités** —
vérifier `git status` avant de relancer `add-data-source`, pour ne pas mélanger un état de
répétition avec les fichiers réels du repo.

### 4. Repartir d'un repo propre

```bash
git status                                                        # vérifier ce qui a bougé
git checkout -- power.config.json src/generated .power/schemas   # si retouchés sans le vouloir
```

Ou, si des checkpoints git existent (cf. `docs/aMP-demo-runbook.md`, section Plan B) :
`git checkout checkpoint-<étape>` pour revenir à un état de démo connu.

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

`VITE_USE_SHAREPOINT` est lu **au build**, pas à l'exécution (`src/App.tsx:13`). Si `.env.local`
est absent ou à `false` au moment de `npm run build`, le bundle retombe sur le mode mémoire —
et `pac code push` **n'effectue pas de build lui-même**, il republie tel quel le `./dist`
existant. Comme `.env.local` est gitignore, il faut le recréer après chaque `git clone` /
poste neuf (`cp .env.local.example .env.local`, `VITE_USE_SHAREPOINT=true`) — sinon un
`npm run build` fait par réflexe avant de pousser republie du mémoire sans prévenir.

Vérifier avant de publier :
```bash
npm run build
grep -c "getContext\|getAll\|sharepointonline" dist/assets/*.js   # > 0 si SharePoint est bien actif
```

### Autres pièges (rappel, cf. `CLAUDE.md`)

- Port 3000 obligatoire (`vite.config.ts` `strictPort: true` ↔ `localAppUrl`).
- Dataset SharePoint en double URL-encode avec `pac code add-data-source` — copier les valeurs
  depuis `pac code list-datasets` / `list-tables`, ne pas les composer à la main.
- La connexion SharePoint doit préexister dans `make.powerapps.com`.
- `src/generated/` ne s'édite jamais (régénéré par `pac code`).
