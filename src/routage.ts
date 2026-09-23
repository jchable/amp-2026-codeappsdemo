/** La doc du design system vit sous `#/design-system` (pas de router dans le projet). */
export function estRouteDoc(hash: string): boolean {
  return /^#\/design-system(\/.*)?$/.test(hash);
}
