import type { Disease, EvidenceSource } from './types.ts';
import type { PublishedEvidence } from './evidence.ts';
import { validateEvidence } from './evidence.ts';
import { FEATURE_CATALOG } from './familyFeatures.ts';

/**
 * A separately trained family-aware model, stacked on the personal model:
 *   z = intercept + personalLogitSlope * logit(P_personal) + sum_k beta_k * x_k
 *   P_family = calibrate(expit(z))
 * Trained on labelled cohort data that has BOTH the personal-model output and family-history fields.
 * A relative marked NO only matters if an `<rel>_unaffected` coefficient was actually fitted.
 * UNKNOWN is encoded as all-zero indicators for that relative (the training data must have used the same rule).
 */
export interface StackedFamilyModel {
  id: string;
  disease: Disease;
  status: 'validated' | 'research';
  personalModelVersion: string;
  outcomeCode: string;
  timeHorizonYears: number | null;
  familyHistoryDefinitionId: string;
  intercept: number;
  personalLogitSlope: number;
  coefficients: Record<string, number>;         // keys must be in FEATURE_CATALOG
  calibration: { method: 'none' } | { method: 'platt'; a: number; b: number };
  training: { dataset: string; n: number; nEvents: number; period: string; familyHistoryAscertainment: string };
  validation: { type: 'external' | 'temporal' | 'cross_validation'; n: number; auc?: number; calibrationSlope: number; calibrationInTheLarge: number };
  maxBaselineDriftPP: number;                   // tolerance for P_family(no family info) vs P_personal
  source: EvidenceSource;
}

export function validateModel(m: StackedFamilyModel): string[] {
  const errs: string[] = [];
  for (const k of Object.keys(m.coefficients)) if (!FEATURE_CATALOG.includes(k)) errs.push(`unknown feature "${k}"`);
  if (!Number.isFinite(m.intercept) || !Number.isFinite(m.personalLogitSlope)) errs.push('intercept/slope must be finite');
  return errs;
}

export class EvidenceRegistry {
  evidence: PublishedEvidence[] = [];
  models: StackedFamilyModel[] = [];
  addEvidence(ev: PublishedEvidence) {
    const e = validateEvidence(ev); if (e.length) throw new Error(`Evidence ${ev.id} rejected: ${e.join('; ')}`);
    this.evidence.push(ev); return this;
  }
  addModel(m: StackedFamilyModel) {
    const e = validateModel(m); if (e.length) throw new Error(`Model ${m.id} rejected: ${e.join('; ')}`);
    this.models.push(m); return this;
  }
  evidenceFor(d: Disease) { return this.evidence.filter(e => e.disease === d); }
  modelsFor(d: Disease) { return this.models.filter(m => m.disease === d); }
}

/** Production registry. Intentionally EMPTY: nothing ships until a human verifies it (see README intake checklist). */
export const defaultRegistry = new EvidenceRegistry();
