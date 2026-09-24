import type { Disease, EvidenceSource, PatientContext, PersonalModelProfile, Relationship } from './types.ts';
import { RELATIONSHIPS } from './types.ts';
import type { EffectMeasure } from './math.ts';

/** Declarative (JSON-serialisable) description of which relatives are affected. */
export interface Pattern {
  require?: Partial<Record<Relationship, boolean>>;              // true = affected, false = not affected
  minAffectedOf?: { of: Relationship[]; atLeast: number };
  maxAffectedOf?: { of: Relationship[]; atMost: number };
}
export type Assignment = Partial<Record<Relationship, boolean>>;

export function matchesPattern(p: Pattern, a: Assignment): boolean {
  for (const [r, v] of Object.entries(p.require ?? {})) if (a[r as Relationship] !== v) return false;
  const count = (of: Relationship[]) => of.filter(r => a[r] === true).length;
  if (p.minAffectedOf && count(p.minAffectedOf.of) < p.minAffectedOf.atLeast) return false;
  if (p.maxAffectedOf && count(p.maxAffectedOf.of) > p.maxAffectedOf.atMost) return false;
  return true;
}

/**
 * One MUTUALLY EXCLUSIVE exposure category. Published estimates are per category
 * ("one parent", "both parents", ...). Categories are never combined by multiplication.
 */
export interface ExposureCategory {
  id: string;
  label: string;
  patterns: Pattern[];                // category matches if ANY pattern matches
  // RR / OR / HR evidence (reference category has effect === 1):
  effect?: number;
  ci95?: [number, number];
  prevalence?: number;                // share of the personal model's target population in this category
  // LR evidence:
  pGivenDisease?: number;             // P(category | disease)
  pGivenNoDisease?: number;           // P(category | no disease)
}

export interface PublishedEvidence {
  id: string;
  disease: Disease;
  measure: EffectMeasure;
  scope: Relationship[];              // relatives this evidence speaks about; everything else is "not used"
  familyHistoryDefinitionId: string;  // must equal the disease's definition (e.g. premature_cvd_v1)
  categories: ExposureCategory[];
  referenceCategoryId?: string;       // required unless measure === 'LR'
  /** How to read P_personal. 'marginal' (default, principled) needs category prevalences. */
  personalOutputInterpretation: 'marginal' | 'unexposed_baseline';
  prevalenceBasis?: 'personal_model_training_cohort' | 'same_study' | 'other_population';
  population: { description: string; ageRange?: [number, number]; sexes: 'both' | 'male' | 'female'; ancestry?: string };
  outcomeCode: string;
  timeHorizonYears: number | null;
  adjustedFor: string[];
  design: 'cohort' | 'case_control' | 'registry' | 'meta_analysis' | 'cross_sectional' | 'other';
  source: EvidenceSource;
  assumptions: string[];
}

/** Every family-history configuration of the in-scope relatives must map to exactly one category. */
export function validateEvidence(ev: PublishedEvidence): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const c of ev.categories) { if (ids.has(c.id)) errs.push(`duplicate category ${c.id}`); ids.add(c.id); }
  if (ev.scope.length === 0 || ev.scope.length > 10) errs.push('scope must have 1..10 relationships');
  if (ev.scope.some(r => !RELATIONSHIPS.includes(r))) errs.push('unknown relationship in scope');

  // Exhaustive + exclusive over all 2^|scope| affected/unaffected assignments.
  const n = ev.scope.length;
  for (let m = 0; m < (1 << n); m++) {
    const a: Assignment = {};
    ev.scope.forEach((r, i) => { a[r] = !!(m & (1 << i)); });
    const hits = ev.categories.filter(c => c.patterns.some(p => matchesPattern(p, a)));
    if (hits.length !== 1) errs.push(`assignment ${JSON.stringify(a)} matches ${hits.length} categories (need exactly 1)`);
  }

  if (ev.measure === 'LR') {
    for (const c of ev.categories) {
      if (![c.pGivenDisease, c.pGivenNoDisease].every(v => typeof v === 'number' && v >= 0 && v <= 1)) errs.push(`LR category ${c.id} needs pGivenDisease/pGivenNoDisease in [0,1]`);
    }
    const sD = ev.categories.reduce((s, c) => s + (c.pGivenDisease ?? 0), 0);
    const sN = ev.categories.reduce((s, c) => s + (c.pGivenNoDisease ?? 0), 0);
    if (Math.abs(sD - 1) > 1e-6 || Math.abs(sN - 1) > 1e-6) errs.push('LR category probabilities must each sum to 1');
  } else {
    const ref = ev.categories.find(c => c.id === ev.referenceCategoryId);
    if (!ref || ref.effect !== 1) errs.push('referenceCategoryId must point to a category with effect === 1');
    for (const c of ev.categories) {
      if (!(typeof c.effect === 'number' && Number.isFinite(c.effect) && c.effect > 0)) errs.push(`category ${c.id} needs effect > 0`);
      if (!(typeof c.prevalence === 'number' && c.prevalence >= 0 && c.prevalence <= 1)) errs.push(`category ${c.id} needs prevalence in [0,1]`);
    }
    const sum = ev.categories.reduce((s, c) => s + (c.prevalence ?? 0), 0);
    if (Math.abs(sum - 1) > 1e-6) errs.push(`category prevalences sum to ${sum}, need 1`);
  }
  return errs;
}

export interface GatePolicy {
  personal: PersonalModelProfile;
  patient: PatientContext;
  familyHistoryDefinitionId: string;
  permitTestFixtures: boolean;
  adjustmentPolicy: 'warn' | 'require';
}
export type GateResult = { ok: true; warnings: string[] } | { ok: false; reasons: string[] };

/** Static compatibility checks: is this evidence legitimately applicable to THIS personal model + patient? */
export function gateEvidence(ev: PublishedEvidence, g: GatePolicy): GateResult {
  const reasons: string[] = []; const warnings: string[] = [];
  const structural = validateEvidence(ev);
  if (structural.length) reasons.push(...structural.map(e => `invalid evidence: ${e}`));

  if (ev.source.origin === 'test_fixture') { if (!g.permitTestFixtures) reasons.push('test-fixture evidence is not permitted in this run'); }
  else if (!ev.source.verified || !ev.source.verifiedBy || !ev.source.verifiedOn) reasons.push('source not marked verified (needs verifiedBy + verifiedOn)');

  if (g.personal.outcomeCode === 'UNSET') reasons.push('personal model profile is not configured (outcomeCode UNSET)');
  if (ev.outcomeCode !== g.personal.outcomeCode) reasons.push(`outcome mismatch: evidence "${ev.outcomeCode}" vs personal model "${g.personal.outcomeCode}"`);
  if (ev.timeHorizonYears !== g.personal.timeHorizonYears) reasons.push(`time horizon mismatch: evidence ${ev.timeHorizonYears} vs personal model ${g.personal.timeHorizonYears}`);
  if (ev.familyHistoryDefinitionId !== g.familyHistoryDefinitionId) reasons.push(`family-history definition mismatch: evidence "${ev.familyHistoryDefinitionId}" vs GeneGuard "${g.familyHistoryDefinitionId}"`);

  const { ageRange, sexes } = ev.population;
  if (ageRange) {
    if (g.patient.ageYears == null) reasons.push('evidence is age-restricted but patient age is missing');
    else if (g.patient.ageYears < ageRange[0] || g.patient.ageYears > ageRange[1]) reasons.push(`patient age ${g.patient.ageYears} outside evidence population ${ageRange[0]}-${ageRange[1]}`);
  }
  if (sexes !== 'both') {
    if (!g.patient.sex) reasons.push('evidence is sex-specific but patient sex is missing');
    else if (g.patient.sex !== sexes) reasons.push(`evidence applies to ${sexes} only`);
  }

  if (ev.measure === 'HR' && ev.timeHorizonYears == null) reasons.push('HR requires a defined time horizon');
  if (ev.measure === 'LR') warnings.push('LR route assumes family history is conditionally independent of the personal-model features given disease status; shared risk factors can make it over-count.');
  if (ev.personalOutputInterpretation === 'unexposed_baseline') warnings.push('P_personal is being treated as the no-family-history baseline; negative history is given no numerical effect.');
  else if (ev.measure !== 'LR' && ev.prevalenceBasis !== 'personal_model_training_cohort') warnings.push(`category prevalences come from "${ev.prevalenceBasis ?? 'unspecified'}", not the personal model's training cohort; the marginal recalibration is only as good as that match.`);
  if (['case_control', 'cross_sectional'].includes(ev.design) && ev.measure !== 'OR' && ev.measure !== 'LR') reasons.push(`${ev.design} design cannot support ${ev.measure}`);

  const unadjusted = g.personal.covariates.filter(c => !ev.adjustedFor.includes(c));
  if (unadjusted.length) {
    const msg = `evidence not adjusted for personal-model covariates [${unadjusted.join(', ')}]; shared risk factors may be double counted`;
    if (g.adjustmentPolicy === 'require') reasons.push(msg); else warnings.push(msg);
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, warnings };
}
