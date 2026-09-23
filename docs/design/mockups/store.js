/* Socle commun des maquettes : mêmes données, mêmes règles métier que docs/spec.md.
   Règle 3 : transitions autorisées. Règle 4 : tri priorité puis date récente. Règle 5 : filtre. Règle 6 : suppression libre. */
(function () {
  const STATUTS = ["Nouveau", "En cours", "Résolu"];
  const PRIORITES = ["Basse", "Moyenne", "Haute"];
  const ORDRE = { Haute: 0, Moyenne: 1, Basse: 2 };
  const TRANSITIONS = { "Nouveau": ["En cours"], "En cours": ["Résolu", "Nouveau"], "Résolu": ["En cours"] };
  const MAINTENANT = new Date("2026-09-23T14:30:00");
  const il_y_a = (min) => new Date(MAINTENANT.getTime() - min * 60000).toISOString();

  let seq = 45;
  let tickets = [
    { id: "43", titre: "Vidéoprojecteur de la salle Lagon ne s'allume plus", description: "Coupure en plein test son. Le voyant reste orange, l'atelier de 15 h en dépend.", statut: "Nouveau", priorite: "Haute", demandeur: "Marc", creeLe: il_y_a(25) },
    { id: "38", titre: "VPN inaccessible depuis le site de Nouméa", description: "Les intervenants distants n'arrivent plus à se connecter au réseau interne.", statut: "En cours", priorite: "Haute", demandeur: "Julien", creeLe: il_y_a(190) },
    { id: "44", titre: "Badge d'accès HS à l'entrée B", description: "", statut: "Nouveau", priorite: "Moyenne", demandeur: "Sarah", creeLe: il_y_a(70) },
    { id: "41", titre: "Accès Wi-Fi invités pour les intervenants", description: "Prévoir 40 codes valables du 24 au 26 septembre.", statut: "En cours", priorite: "Moyenne", demandeur: "Hélène", creeLe: il_y_a(1500) },
    { id: "36", titre: "Impression des badges intervenants", description: "", statut: "Résolu", priorite: "Moyenne", demandeur: "Nadia", creeLe: il_y_a(3000) },
    { id: "45", titre: "Piles à remplacer pour les micros sans fil", description: "", statut: "Nouveau", priorite: "Basse", demandeur: "Léa", creeLe: il_y_a(12) },
    { id: "40", titre: "Compte Teams pour le stand d'accueil", description: "Un compte partagé suffit, avec accès à la liste des participants.", statut: "En cours", priorite: "Basse", demandeur: "Camille", creeLe: il_y_a(2900) },
    { id: "35", titre: "Multiprise supplémentaire sur la scène principale", description: "", statut: "Résolu", priorite: "Basse", demandeur: "Paul", creeLe: il_y_a(4300) },
  ];
  const abonnes = [];
  const emettre = () => abonnes.forEach((f) => f());

  window.Store = {
    STATUTS, PRIORITES, TRANSITIONS,
    transitions: (statut) => TRANSITIONS[statut],
    liste(filtre) {
      const l = filtre && filtre !== "Tous" ? tickets.filter((t) => t.statut === filtre) : tickets.slice();
      return l.sort((a, b) => ORDRE[a.priorite] - ORDRE[b.priorite] || b.creeLe.localeCompare(a.creeLe));
    },
    compter() {
      const c = { Tous: tickets.length };
      STATUTS.forEach((s) => (c[s] = tickets.filter((t) => t.statut === s).length));
      return c;
    },
    trouver: (id) => tickets.find((t) => t.id === id),
    creer({ titre, demandeur, description, priorite }) {
      const erreurs = [];
      if (!titre || !titre.trim()) erreurs.push("Le titre est obligatoire.");
      else if (titre.trim().length > 120) erreurs.push("Le titre dépasse 120 caractères.");
      if (!demandeur || !demandeur.trim()) erreurs.push("Le demandeur est obligatoire.");
      if (erreurs.length) return { ok: false, erreurs };
      const t = { id: String(++seq), titre: titre.trim(), description: (description || "").trim(), statut: "Nouveau", priorite: priorite || "Moyenne", demandeur: demandeur.trim(), creeLe: new Date(MAINTENANT.getTime() + (seq - 45) * 60000).toISOString() };
      tickets.push(t);
      emettre();
      return { ok: true, ticket: t };
    },
    changerStatut(id, vers) {
      const t = tickets.find((x) => x.id === id);
      if (!t || !TRANSITIONS[t.statut].includes(vers)) return false;
      t.statut = vers;
      emettre();
      return true;
    },
    supprimer(id) { tickets = tickets.filter((t) => t.id !== id); emettre(); },
    onChange: (f) => abonnes.push(f),
    verbe(de, vers) {
      if (de === "Nouveau" && vers === "En cours") return "Prendre en charge";
      if (de === "En cours" && vers === "Résolu") return "Marquer résolu";
      if (de === "En cours" && vers === "Nouveau") return "Renvoyer à Nouveau";
      return "Rouvrir";
    },
    quand(iso) {
      const min = Math.round((MAINTENANT - new Date(iso)) / 60000);
      if (min < 1) return "à l'instant";
      if (min < 60) return `il y a ${min} min`;
      if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
      const j = Math.round(min / 1440);
      return j === 1 ? "hier" : `il y a ${j} jours`;
    },
    esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  };
})();
