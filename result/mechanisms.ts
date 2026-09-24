import type { Relationship } from './types.ts';
import { RELATIONSHIPS } from './types.ts';
import type { Assignment, PublishedEvidence } from './evidence.ts';
import { matchesPattern } from './evidence.ts';
import type { Slots } from './familyFeatures.ts';
import { buildFeatures, resolveSlots } from './familyFeatures.ts';
import type { StackedFamilyModel } from './registry.ts';
import { expit, fromOdds, isOpenProb, logit, riskUnderEffect, solveReferenceRisk, toOdds } from './math.ts';

export type MechanismOutcome =
  | { ok: true; pFamily: number; informative: boolean; used: Relationship[]; notUsed: Relationship[]; notes: string[] }
  | { ok: false; reason: string };

const known = (s: Slots) => RELATIONSHIPS.filter(r => s[r].status !== 'UNKNOWN');

/** Published category evidence. Unknown relatives are MARGINALISED (never imputed as NO). */
export function evaluatePublished(ev: PublishedEvidence, slots: Slots, p: number): MechanismOutcome {
  if (!isOpenProb(p)) return { ok: false, reason: 'personal probability must be strictly between 0 and 1' };
  const unknownScope = ev.scope.filter(r => slots[r].status === 'UNKNOWN');
  const base: Assignment = {};
  ev.scope.forEach(r => { if (slots[r].status !== 'UNKNOWN') base[r] = slots[r].status === 'YES'; });

  // Categories compatible with what is actually known.
  const compatible = new Set<string>();
  for (let m = 0; m < (1 << unknownScope.length); m++) {
    const a: Assignment = { ...base };
    unknownScope.forEach((r, i) => { a[r] = !!(m & (1 << i)); });
    for (const c of ev.categories) if (c.patterns.some(pt => matchesPattern(pt, a))) compatible.add(c.id);
  }
  const C = ev.categories.filter(c => compatible.has(c.id));
  const usedRel = ev.scope.filter(r => slots[r].status !== 'UNKNOWN');
  const notUsed = known(slots).filter(r => !ev.scope.includes(r));
  const notes: string[] = [];

  if (C.length === ev.categories.length) return { ok: true, pFamily: p, informative: false, used: usedRel, notUsed, notes: ['No in-scope relative has a recorded status; no numerical effect.'] };

  if (ev.measure === 'LR') {
    const num = C.reduce((s, c) => s + (c.pGivenDisease ?? 0), 0), den = C.reduce((s, c) => s + (c.pGivenNoDisease ?? 0), 0);
    if (den <= 0) return { ok: false, reason: 'likelihood ratio undefined (zero denominator)' };
    return { ok: true, pFamily: fromOdds(toOdds(p) * (num / den)), informative: true, used: usedRel, notUsed, notes: ['Posterior odds = prior odds × LR of the compatible category set.'] };
  }

  const measure = ev.measure as 'RR' | 'OR' | 'HR';
  if (ev.personalOutputInterpretation === 'unexposed_baseline') {
    if (C.length !== 1) return { ok: false, reason: 'partially unknown family history cannot be resolved when P_personal is treated as the unexposed baseline' };
    if (C[0].id === ev.referenceCategoryId) return { ok: true, pFamily: p, informative: false, used: usedRel, notUsed, notes: ['No affected in-scope relatives; P_personal is treated as the no-family-history baseline, so no numerical effect.'] };
    const r = riskUnderEffect(measure, C[0].effect!, p);
    return r == null ? { ok: false, reason: 'effect implies probability > 1' } : { ok: true, pFamily: r, informative: true, used: usedRel, notUsed, notes: [] };
  }

  const p0 = solveReferenceRisk(p, ev.categories.map(c => ({ effect: c.effect!, prevalence: c.prevalence! })), measure);
  if (p0 == null) return { ok: false, reason: 'personal model output cannot be reproduced by this evidence (marginal recalibration infeasible)' };
  const qC = C.reduce((s, c) => s + c.prevalence!, 0);
  if (qC <= 0) return { ok: false, reason: 'compatible categories have zero prevalence' };
  const pFam = C.reduce((s, c) => s + c.prevalence! * (riskUnderEffect(measure, c.effect!, p0) as number), 0) / qC;
  notes.push(`Implied reference-category risk: ${(p0 * 100).toFixed(2)}%.`);
  if (unknownScope.length) notes.push(`Unrecorded relatives (${unknownScope.join(', ')}) were marginalised over category prevalence, not assumed unaffected.`);
  return { ok: true, pFamily: pFam, informative: true, used: usedRel, notUsed, notes };
}

export function predictStacked(m: StackedFamilyModel, pPersonal: number, features: Record<string, number>): number {
  let z = m.intercept + m.personalLogitSlope * logit(pPersonal);
  for (const [k, beta] of Object.entries(m.coefficients)) z += beta * (features[k] ?? 0);
  const p = expit(z);
  return m.calibration.method === 'platt' ? expit(m.calibration.a + m.calibration.b * logit(p)) : p;
}

const FIRST: Relationship[] = ['father', 'mother', 'sibling'];
const SECOND: Relationship[] = ['paternalGrandfather', 'paternalGrandmother', 'maternalGrandfather', 'maternalGrandmother'];
const AGGREGATE_DEPENDS: Record<string, Relationship[]> = {
  first_degree_affected_count: FIRST, first_degree_known_count: FIRST, any_first_degree_affected: FIRST,
  second_degree_affected_count: SECOND, parents_affected_count: ['father', 'mother'], both_parents_affected: ['father', 'mother'],
};
/** Relatives that can actually move this model's output (from its fitted coefficients). */
export function relativesModelled(m: StackedFamilyModel): Relationship[] {
  const out = new Set<Relationship>();
  for (const k of Object.keys(m.coefficients)) {
    const direct = RELATIONSHIPS.find(r => k.startsWith(r + '_'));
    if (direct) out.add(direct); else (AGGREGATE_DEPENDS[k] ?? []).forEach(r => out.add(r));
  }
  return [...out];
}

export function evaluateStacked(m: StackedFamilyModel, slots: Slots, p: number): MechanismOutcome {
  if (!isOpenProb(p)) return { ok: false, reason: 'personal probability must be strictly between 0 and 1' };
  const pBase = predictStacked(m, p, buildFeatures(resolveSlots([])));
  const driftPP = Math.abs(pBase - p) * 100;
  if (driftPP > m.maxBaselineDriftPP) return { ok: false, reason: `family-aware model with no family information differs from the personal model by ${driftPP.toFixed(2)} pp (> ${m.maxBaselineDriftPP}); the comparison would mix model differences with the family effect` };
  const modelled = relativesModelled(m);
  const kn = known(slots);
  return {
    ok: true, pFamily: predictStacked(m, p, buildFeatures(slots)), informative: true,
    used: kn.filter(r => modelled.includes(r)), notUsed: kn.filter(r => !modelled.includes(r)),
    notes: ['Joint family-aware model; relative effects are not summed.'],
  };
}
