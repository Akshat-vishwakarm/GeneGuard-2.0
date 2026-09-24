// Disease-specific entry points. Each one binds its own config (definition, relatives, evidence policy,
// registered evidence/models). There is deliberately no generic coefficient shared between them.
import { computeFamilyRisk } from './engine.ts';
import type { EngineOptions, FamilyRiskInput, FamilyRiskResult } from './engine.ts';

type In = Omit<FamilyRiskInput, 'disease'>;

/** Uses the "any_affected_v1" definition; evidence/models registered under 'diabetes' only. */
export const diabetesFamilyRisk = (i: In, o?: EngineOptions): FamilyRiskResult => computeFamilyRisk({ ...i, disease: 'diabetes' }, o);
export const hypertensionFamilyRisk = (i: In, o?: EngineOptions): FamilyRiskResult => computeFamilyRisk({ ...i, disease: 'hypertension' }, o);
/** Uses the "premature_cvd_v1" definition: needs relative onset age (and sex for siblings). */
export const cardiovascularFamilyRisk = (i: In, o?: EngineOptions): FamilyRiskResult => computeFamilyRisk({ ...i, disease: 'cardiovascular' }, o);
export const thyroidFamilyRisk = (i: In, o?: EngineOptions): FamilyRiskResult => computeFamilyRisk({ ...i, disease: 'thyroid' }, o);
/** Descriptive "Family history detected" unless a verified pedigree adapter + complete inputs are supplied. */
export const hereditaryCancerFamilyRisk = (i: In, o?: EngineOptions): FamilyRiskResult => computeFamilyRisk({ ...i, disease: 'hereditaryCancer' }, o);

export const diabetes_family_risk = diabetesFamilyRisk;
export const hypertension_family_risk = hypertensionFamilyRisk;
export const cardiovascular_family_risk = cardiovascularFamilyRisk;
export const thyroid_family_risk = thyroidFamilyRisk;
export const hereditary_cancer_family_risk = hereditaryCancerFamilyRisk;
