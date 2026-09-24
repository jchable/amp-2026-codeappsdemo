/** La doc du design system vit sous `#/design-system` (pas de router dans le projet). */
export function estRouteDoc(hash: string): boolean {
  return /^#\/design-system(\/.*)?$/.test(hash);
}

/** Un changement de hash ne recharge la page que s'il fait passer de l'app à la doc, ou l'inverse. */
export function changeDeRoute(ancienneUrl: string, nouvelleUrl: string): boolean {
  return estRouteDoc(new URL(ancienneUrl).hash) !== estRouteDoc(new URL(nouvelleUrl).hash);
}
