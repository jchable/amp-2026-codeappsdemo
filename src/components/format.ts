export function numeroTicket(id: string): string {
  const chiffres = id.replace(/\D/g, "");
  return chiffres.length > 0 ? chiffres : id;
}

export function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
