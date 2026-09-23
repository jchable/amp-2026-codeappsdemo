const HEX = /^#[0-9a-fA-F]{6}$/;

function canal(valeur: number): number {
  const v = valeur / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative WCAG d'une couleur `#rrggbb`. */
export function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`Couleur hex #rrggbb attendue, reçu : ${hex}`);
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs `#rrggbb`, de 1 à 21. */
export function ratioContraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}
