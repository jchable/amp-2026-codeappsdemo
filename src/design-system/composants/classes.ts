export function classes(...noms: Array<string | false | null | undefined>): string {
  return noms.filter(Boolean).join(" ");
}
