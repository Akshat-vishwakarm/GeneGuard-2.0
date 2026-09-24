// Pure probability arithmetic. Contains NO disease coefficients.

export type EffectMeasure = 'RR' | 'OR' | 'HR' | 'LR';

export const isOpenProb = (p: number) => Number.isFinite(p) && p > 0 && p < 1;
export const toOdds = (p: number) => p / (1 - p);
export const fromOdds = (o: number) => o / (1 + o);
export const logit = (p: number) => Math.log(p / (1 - p));
export const expit = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Risk of a group whose reference-group risk is p0, given an effect measure vs the reference group.
 *  RR: p1 = RR * p0                      (must stay <= 1)
 *  OR: odds1 = OR * odds0
 *  HR: p1 = 1 - (1-p0)^HR                (proportional hazards, SAME time horizon as p0)
 * LR is not a group-vs-reference measure and is handled separately.
 */
export function riskUnderEffect(measure: 'RR' | 'OR' | 'HR', effect: number, p0: number): number | null {
  if (measure === 'RR') { const p1 = effect * p0; return p1 <= 1 + 1e-12 ? Math.min(p1, 1) : null; }
  if (measure === 'OR') return fromOdds(effect * toOdds(p0));
  return 1 - Math.pow(1 - p0, effect);
}

/**
 * Marginal-to-conditional recalibration.
 *
 * The personal model was fit WITHOUT family history, so its output pMarginal averages over the
 * (unseen) family-history categories of people like the patient:
 *
 *     pMarginal = sum_k q_k * f_k(p0)
 *
 * q_k = prevalence of exposure category k, p0 = risk in the reference ("no affected relative")
 * category, f_k = risk under category k's effect measure. Solve for p0 (g is strictly increasing
 * in p0, so bisection is exact). Returns null if the evidence cannot reproduce pMarginal.
 */
export function solveReferenceRisk(
  pMarginal: number,
  cats: { effect: number; prevalence: number }[],
  measure: 'RR' | 'OR' | 'HR',
): number | null {
  const maxEffect = Math.max(...cats.map(c => c.effect));
  const hi = measure === 'RR' ? Math.min(1, 1 / maxEffect) * (1 - 1e-12) : 1 - 1e-12;
  const g = (p0: number) => cats.reduce((s, c) => s + c.prevalence * (riskUnderEffect(measure, c.effect, p0) ?? NaN), 0);
  if (!(g(hi) >= pMarginal)) return null;
  let lo = 0, up = hi;
  for (let i = 0; i < 200; i++) { const mid = (lo + up) / 2; if (g(mid) < pMarginal) lo = mid; else up = mid; }
  return (lo + up) / 2;
}

export const pp = (delta: number) => delta * 100;
