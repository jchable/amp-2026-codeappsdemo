# Runbook de démo — aMP Tickets (Code App SharePoint)

Objectif : générer une Power App **testée et déployée** en ~16 min, sous contrôle.
Deux colonnes : **Plan A** (tout marche) et **Plan B** (filet à chaque rupture).

---

## 0. Pré-conf — à froid, la veille (NE PAS faire en live)

- [ ] **Environnement** : Admin Center → ton env → Settings → Features → **Code Apps = On**.
- [ ] **Liste SharePoint `Tickets`** créée (colonnes : `Title`, `Description`, `Statut` [choix], `Priorite` [choix], `Demandeur`).
- [ ] **Connexion SharePoint** créée dans make.powerapps.com ; récupérer son id : `pac connection list`.
- [ ] **Auth CLI** : `pac auth create --environment <url>` ; vérifier `pac auth list`.
- [ ] **Dataset et table SharePoint** : `pac code list-datasets` puis `pac code list-tables`, valeurs à copier telles quelles (jamais encodées à la main).
- [ ] **Repo** : `npm install` OK, `npm test` **vert** (voir `docs/superpowers/plans/` pour le compte à jour).
- [ ] **Checkpoints git** créés (section 3) pour pouvoir sauter à n'importe quelle étape.
- [ ] **Enregistrement de secours** de chaque jalon (asciinema/vidéo) sur le bureau.
- [ ] **Connexion internet de secours** (partage 4G) + captures déjà prêtes.
- [ ] Zoom terminal lisible (police ≥ 18 pt), thème clair, `npm run test:watch` testé une fois.

---

## Plan A — la démo live (nominal, ~16 min)

> Règle : tu **annonces avant** que l'agent agisse. Slides « feuille de route » / « ce qu'il faut regarder » restent affichées à côté du terminal.

### A0 · Constitution (1 min) — *jalon → slide 18/0*
- **Action** : ouvrir `CLAUDE.md`.
- **Dis** : « Pas une ligne de métier écrite, mais l'agent connaît déjà nos règles : React/TS, SharePoint, TDD, et la définition du DONE. »
- **Capture** : `CLAUDE.md` à l'écran.

### A1 · Brainstorming → spec (2–3 min) — *jalon spec*
- **Action** : dans Claude Code, lancer le skill `brainstorming` : « On construit une Power App de suivi de tickets sur une liste SharePoint. »
- **Montre** : l'agent **pose des questions** (statuts ? priorités ? règles de transition ?) et produit `docs/spec.md`.
- **Dis** : « Il ne code pas, il interroge. Ça, c'est la spec — et c'est là qu'on corrige, pas dans le code. »

### A2 · Plan (1–2 min)
- **Action** : skill `writing-plans` → `docs/superpowers/plans/<date>-<sujet>.md`.
- **Montre** : la découpe en tâches de 2–5 min.
- **Dis** : « Chaque tâche a un chemin de fichier et une vérif. C'est le contrat qu'on va exécuter. »

### A3 · TDD RED → GREEN (5–6 min) — *le cœur — 2 captures*
- **Action** : `npm run test:watch` dans un panneau. Skill `test-driven-development`.
- **RED** : l'agent écrit d'abord le test de la règle « `Nouveau → Résolu` interdit ». **Il échoue.**
  - **Dis** : « Rouge. C'est voulu : ça prouve que le test teste quelque chose. » **Capture ROUGE.**
- **GREEN** : l'agent écrit le code minimal dans `src/domain/ticket.ts`. Le test passe.
  - **Montre** la **sortie brute** des tests. **Dis** : « Il me montre la sortie brute — il ne peut pas mentir. Et Superpowers supprime tout code écrit avant son test. » **Capture VERTE.**

### A4 · Revue (1–2 min) — *jalon revue*
- **Action** : skill `requesting-code-review`.
- **Montre** : un sous-agent relit contre le plan, classe les issues par sévérité.
- **Dis** : « Le garde-fou dans le garde-fou. Les issues critiques bloquent. » **Capture revue.**

### A5 · Brancher SharePoint (2–3 min)
- **Action** :
  ```bash
  pac code list-datasets -a "shared_sharepointonline" -c "<connectionId>"
  pac code list-tables -a "shared_sharepointonline" -c "<connectionId>" -d "<dataset copié>"
  pac code add-data-source -a "shared_sharepointonline" -c "<connectionId>" \
    -t "<id de table copié>" -d "<dataset copié>"
  ```
- **Montre** : les fichiers générés dans `src/generated/` ; l'adaptateur `sharePointTicketRepository.ts` et le mapping `sharePointMapping.ts` sont déjà en place.
- **Dis** : « L'adaptateur SharePoint remplace l'impl mémoire — le reste de l'app ne bouge pas. »

### A6 · Lancer connecté (2 min) — *jalon app*
- **Action** : `npm run dev:sharepoint` puis `npm run power:run` (hôte Power Apps local — **jamais** `npm run dev` seul en mode SharePoint, les appels données ne passent que par cet hôte) → URL « Local Play », même profil navigateur que le tenant.
- **Montre** : créer un ticket → il apparaît dans la liste **et** dans SharePoint.

### A7 · Déployer (1–2 min) — *jalon déploiement*
- **Action** : `pac code push`.
- **Montre** : ouvrir la Power App déployée. **Capture APP EN LIGNE.**
- **Dis** : « DONE : une Power App fonctionnelle, belle, connectée, testée, en prod. »

---

## Plan B — filets de sécurité (par point de rupture)

| # | Ça casse à… | Symptôme | Bascule (fais ça) | Dis |
|---|---|---|---|---|
| B1 | **A1–A2** réseau/agent lent | l'agent rame ou coupe | `git switch --detach step-1-brainstorming` : la spec et le plan sont déjà là | « Je vous montre le résultat, on a préparé le terrain » |
| B2 | **A1–A4** l'agent part en vrille | skill ne se déclenche pas / ignore le plan | sauter au checkpoint suivant ; mentionner le skill `diagnosing-superpowers` | « Ça arrive — Superpowers sait diagnostiquer sa propre session » |
| B3 | **A3** rouge inattendu / build cassé | test ne passe pas comme prévu | `git switch --detach step-2-development` (état vert connu) ou jouer la **vidéo RED→GREEN** | « On repart d'un état vert connu » |
| B4 | **A5–A6** SharePoint | connexion, double-encode, port 3000, auth | `VITE_USE_SHAREPOINT=false` → **impl mémoire** : l'app tourne **sans** SharePoint ; montrer le CRUD en mémoire | « L'archi isole les données : l'app marche même sans la plateforme » |
| B5 | **A7** `pac code push` échoue | erreur de publication | rester sur `npm run dev` (local) + **capture app déployée** de secours | « Le push, je vous le montre en capture — l'app tourne en local » |
| B6 | **partout** temps qui manque | il reste 3 min | sauter A5–A7 : montrer l'app en **mémoire** (déjà belle) + décrire le push à l'oral | « Le reste, c'est le branchement plateforme — 2 commandes » |

**Ordre de repli général** : live → checkpoint git → vidéo de secours → captures. Ne jamais rester bloqué > 20 s : bascule et continue de parler.

---

## 3. Étapes git (tags step-*)

Les étapes du projet sont des tags annotés, empilés sur une seule branche (`main`) :

```bash
git tag -n --sort=version:refname          # lister les étapes
git switch --detach step-0-init           # aller à une étape (lecture seule)
git switch main                            # revenir
git switch -c essai step-1-brainstorming   # repartir d'une étape
```

| Tag | Contenu |
|---|---|
| `step-base` | application d'origine, avant la reconstruction |
| `step-0-init` | code remis à zéro |
| `step-1-brainstorming` | spec (règles 1 à 6) et plan TDD |
| `step-2-development` | app complète, SharePoint réel, interface Le guichet, déployée |
| `step-3-branding` | départ de la charte graphique |

---

## 4. Captures à prendre → slides jalons

| Capture | Quand (Plan A) | Slide |
|---|---|---|
| `CLAUDE.md` | A0 | Démo / feuille de route |
| Test **ROUGE** | A3 | Ce qu'il faut regarder |
| Test **VERT** + sortie brute | A3 | Ce qu'il faut regarder |
| Revue sous-agent | A4 | Ce qu'il faut regarder |
| App déployée (belle) | A7 | Ce qu'il faut regarder |

*(Je les intégrerai dans ton `.pptx` une fois que tu me les auras fournies.)*

---

## 5. Aide-mémoire commandes

```bash
npm install                 # 1re fois
npm test                    # socle métier (voir docs/superpowers/plans/ pour le compte)
npm run test:watch          # démo RED→GREEN
npm run dev                 # http://localhost:3000
pac auth list               # vérifier l'env
pac connection list         # récupérer le connectionId SharePoint
pac code list-datasets / list-tables / add-data-source   # voir A5 (valeurs copiées, jamais encodées)
pac code push               # déploiement
```

## 6. Pièges connus (rappel)
- **Port 3000 obligatoire** (imposé par le SDK).
- Dataset SharePoint en **double URL-encode** avec `pac code add-data-source` (le simple ne marche pas) — comportement non documenté officiellement, propre à `pac code` (pas à `pa app`, qui prend l'URL en clair). Plus sûr : `pac code list-datasets`/`list-tables` pour copier la valeur exacte au lieu de l'encoder à la main.
- La **connexion doit préexister** dans make.powerapps.com (la CLI ne la crée pas).
- **`generated/` ne s'édite jamais** (régénéré par `pac code`).
- **SDK initialisé** (PowerProvider) **avant** tout appel données.
