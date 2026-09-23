import type { Priorite } from "../domain/ticket";
import type { TonPriorite } from "../design-system";

const TON: Record<Priorite, TonPriorite> = { Basse: "basse", Moyenne: "moyenne", Haute: "haute" };

/** Frontière métier → design system : le DS ne connaît pas `Priorite`, l'app traduit. */
export function tonPriorite(priorite: Priorite): TonPriorite {
  return TON[priorite];
}
