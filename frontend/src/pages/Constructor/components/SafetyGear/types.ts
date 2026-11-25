/** Виды средств безопасности (офис, ППР 1479 / ГОСТ 12.4.026 / ГОСТ 34428). */

export const KIND_EXTINGUISHER = "office/fire-extinguisher";
export const KIND_FIRST_AID = "office/first-aid";
export const KIND_EXIT_SIGN = "office/exit-sign";
export const KIND_EXIT_ARROW = "office/exit-arrow";
export const KIND_FIRE_SIGN = "office/fire-sign";

export const SAFETY_KINDS = [
  KIND_EXTINGUISHER,
  KIND_FIRST_AID,
  KIND_EXIT_SIGN,
  KIND_EXIT_ARROW,
  KIND_FIRE_SIGN,
] as const;

export type SafetyKind = (typeof SAFETY_KINDS)[number];

/** В режиме «Безопасность» можно трогать эти kinds (+ план эвакуации) */
export const SAFETY_INTERACT_KINDS = [
  ...SAFETY_KINDS,
  "office/evacuation-map",
] as const;

export function isSafetyInteractKind(kind: string | undefined | null) {
  if (!kind) return false;
  return (SAFETY_INTERACT_KINDS as readonly string[]).includes(kind);
}

/** Размеры в см (план) */
export const SIZE = {
  extinguisher: { width: 28, depth: 28 },
  firstAid: { width: 40, depth: 18 },
  /** Знак «Выход» ≥ 12.5×25 см; depth больше — читаемость в 3D */
  exitSign: { width: 48, depth: 8 },
  exitArrow: { width: 40, depth: 8 },
  fireSign: { width: 22, depth: 6 },
} as const;

/**
 * Нормы (кратко, для UI):
 * — ППР РФ № 1479 п.400: ≥2 переносных огнетушителя на этаж общественного здания
 * — ППР РФ № 1479 п.406: ≤20 м до огнетушителя в админ./общественных помещениях
 * — ППР РФ № 1479 п.409: верх огнетушителя ≤1,5 м от пола
 * — ГОСТ 12.4.026: E22/E01 «Выход», E03/E04 направление, F04 «Огнетушитель»
 * — ГОСТ 34428-2018: шаг знаков направления ≤5 м (стены), «Выход» над дверями эвакуации
 */

/** Макс. путь до огнетушителя, см (админ./общественные) */
export const EXTINGUISHER_MAX_PATH_CM = 2000;
/** Минимум огнетушителей на этаж */
export const EXTINGUISHER_MIN_PER_FLOOR = 2;
/** Шаг знаков направления по стене, см */
export const EXIT_ARROW_STEP_CM = 500;
