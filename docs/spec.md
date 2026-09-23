# Design doc — aMP Tickets (sortie de `brainstorming`)

> Ce document est **la spec** : l'artefact central. Le code en découle. On corrige ici, pas dans le code.

## Problème
Les organisateurs de l'aMP reçoivent des demandes (matériel, accès, incidents) par mille canaux. On veut une **Power App** simple pour saisir, suivre et clôturer ces demandes.

## Utilisateurs & besoin
- **Demandeur** : créer une demande (titre, priorité).
- **Organisateur** : voir les demandes, filtrer par statut, faire avancer le statut, clôturer.

## Modèle de données (liste SharePoint `Tickets`)
| Colonne SharePoint | Type | Domaine |
|---|---|---|
| Title | Texte | `titre` (obligatoire, ≤120) |
| Description | Texte multi | `description` |
| Statut | Choix | `Nouveau` \| `En cours` \| `Résolu` |
| Priorite | Choix | `Basse` \| `Moyenne` \| `Haute` |
| Demandeur | Texte | `demandeur` (obligatoire) |

## Règles métier (→ tests)
1. Un ticket sans titre ou sans demandeur est refusé.
2. À la création, statut = `Nouveau`, priorité par défaut = `Moyenne`.
3. Transitions autorisées : `Nouveau → En cours`, `En cours → Résolu`, `En cours → Nouveau`, réouverture `Résolu → En cours`. Le saut `Nouveau → Résolu` est interdit.
4. Liste triée par priorité décroissante puis date récente.
5. Filtre par statut (`Tous` inclus).
6. Un ticket peut être supprimé quel que soit son statut (`Nouveau`, `En cours`, `Résolu`).

## Critères d'acceptation (DONE)
- [ ] CRUD complet sur la liste SharePoint.
- [ ] Règles 1–6 couvertes par des tests Vitest verts.
- [ ] UI lisible et responsive (liste + formulaire + filtres).
- [ ] Déployée via `pac code push`, connectée à la liste réelle.

## Hors périmètre (YAGNI)
Pièces jointes, notifications, droits fins, multi-listes. À voir plus tard si besoin réel.
