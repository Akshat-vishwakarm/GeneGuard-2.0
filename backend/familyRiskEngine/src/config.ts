import type { Disease, PersonalModelProfile, RecordedStatus, Relationship, FamilyMember } from './types.ts';
import { IMPLIED_SEX } from './types.ts';
import type { Qualifier } from './familyFeatures.ts';

export interface CandidateSource { citation: string; useFor: string; status: 'unverified_candidate'; caveat: string }

export interface DiseaseFamilyConfig {
  disease: Disease;
  label: string;
  /** Relatives GeneGuard may ever use for this disease. Evidence/models decide the subset actually used. */
  supportedRelationships: Relationship[];
  familyHistoryDefinition: { id: string; description: string; qualify: Qualifier };
  /** Describes the EXISTING personal model. GeneGuard must fill this in; 'UNSET' blocks every numerical path. */
  personalModel: PersonalModelProfile;
  mechanismPriority: ('stackedFamilyModel' | 'publishedEstimates')[];
  modelType: string;
  features: string[];
  calibration: string;
  adjustmentPolicy: 'warn' | 'require';
  numeric: 'when_validated_evidence_registered' | 'descriptive_only_without_pedigree_adapter';
  candidateSources: CandidateSource[];
}

const UNSET = (): PersonalModelProfile => ({ version: 'UNSET', outcomeCode: 'UNSET', timeHorizonYears: null, covariates: [] });
const anyAffected: Qualifier = (m: FamilyMember): RecordedStatus => m.status;

/** "Premature" CVD: first-degree male <55 / female <65 is a widely used definition. VERIFY before use. */
const prematureCvd: Qualifier = (m) => {
  if (m.status !== 'YES') return m.status;
  const sex = m.sex ?? IMPLIED_SEX[m.relationship];
  if (!sex || m.ageAtOnset == null) return 'UNKNOWN';   // cannot tell if it meets the definition
  return m.ageAtOnset < (sex === 'male' ? 55 : 65) ? 'YES' : 'NO'; // NO here = "does not meet the premature definition"
};

const CAVEAT_SHARED = 'Recalled from memory, NOT verified. Do not lift numbers into the registry until a human has read the paper and checked population, measure, horizon and adjustment set.';
const CAVEAT_MODEL_INTERNAL = 'Coefficients from a risk score are conditional on that score\'s own covariates; they are NOT transferable multipliers for a different personal model. Use for definitions and cross-validation only.';

export const familyRiskConfig: Record<Disease, DiseaseFamilyConfig> = {
  diabetes: {
    disease: 'diabetes', label: 'Diabetes',
    supportedRelationships: ['father', 'mother', 'sibling'],
    familyHistoryDefinition: { id: 'any_affected_v1', description: 'Relative reported to have diabetes (type not distinguished unless the personal model does).', qualify: anyAffected },
    personalModel: UNSET(),
    mechanismPriority: ['stackedFamilyModel', 'publishedEstimates'],
    modelType: 'stacked logistic on logit(P_personal) OR published category effects with marginal recalibration',
    features: ['father_affected', 'mother_affected', 'sibling_affected', 'both_parents_affected', 'first_degree_affected_count'],
    calibration: 'Platt/isotonic on held-out cohort; report calibration slope + calibration-in-the-large',
    adjustmentPolicy: 'warn', numeric: 'when_validated_evidence_registered',
    candidateSources: [
      { citation: 'Meigs JB et al., Parental transmission of type 2 diabetes: the Framingham Offspring Study. Diabetes 2000', useFor: 'parental (one vs both) categories in an offspring cohort', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
      { citation: 'Scott RA et al. (InterAct), family history and T2D risk, EPIC-InterAct. Diabetologia 2013', useFor: 'family-history effect estimates adjusted for anthropometry/lifestyle', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
    ],
  },
  hypertension: {
    disease: 'hypertension', label: 'Hypertension',
    supportedRelationships: ['father', 'mother', 'sibling'],
    familyHistoryDefinition: { id: 'any_affected_v1', description: 'Relative reported to have hypertension.', qualify: anyAffected },
    personalModel: UNSET(),
    mechanismPriority: ['stackedFamilyModel', 'publishedEstimates'],
    modelType: 'stacked logistic OR published parental-history categories',
    features: ['father_affected', 'mother_affected', 'both_parents_affected'],
    calibration: 'Calibrate to the personal model\'s time horizon; blood-pressure covariates in the personal model absorb much familial effect',
    adjustmentPolicy: 'require', numeric: 'when_validated_evidence_registered',
    candidateSources: [
      { citation: 'Parikh NI et al., A risk score for predicting near-term incidence of hypertension: Framingham Heart Study. Ann Intern Med 2008', useFor: 'whether parental history adds information beyond BP/BMI (adjustment-set check)', status: 'unverified_candidate', caveat: CAVEAT_SHARED + ' ' + CAVEAT_MODEL_INTERNAL },
    ],
  },
  cardiovascular: {
    disease: 'cardiovascular', label: 'Cardiovascular disease',
    supportedRelationships: ['father', 'mother', 'sibling'],
    familyHistoryDefinition: { id: 'premature_cvd_v1', description: 'First-degree relative with CVD before age 55 (male) / 65 (female). Relative without known onset age is UNKNOWN.', qualify: prematureCvd },
    personalModel: UNSET(),
    mechanismPriority: ['stackedFamilyModel', 'publishedEstimates'],
    modelType: 'stacked logistic OR published premature-CVD categories',
    features: ['father_affected', 'mother_affected', 'sibling_affected', 'first_degree_affected_count'],
    calibration: 'Must match the personal model\'s 10-year (or other) horizon exactly',
    adjustmentPolicy: 'require', numeric: 'when_validated_evidence_registered',
    candidateSources: [
      { citation: 'Lloyd-Jones DM et al., Parental cardiovascular disease as a risk factor for CVD in middle-aged adults. JAMA 2004', useFor: 'parental CVD categories', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
      { citation: 'Hippisley-Cox J et al., QRISK3. BMJ 2017', useFor: 'definition of family history used in a validated score', status: 'unverified_candidate', caveat: CAVEAT_SHARED + ' ' + CAVEAT_MODEL_INTERNAL },
      { citation: 'Ridker PM et al., Reynolds Risk Score. JAMA 2007', useFor: 'parental premature MI as a predictor', status: 'unverified_candidate', caveat: CAVEAT_SHARED + ' ' + CAVEAT_MODEL_INTERNAL },
    ],
  },
  thyroid: {
    disease: 'thyroid', label: 'Thyroid disease',
    supportedRelationships: ['father', 'mother', 'sibling'],
    familyHistoryDefinition: { id: 'any_affected_v1', description: 'Relative reported to have thyroid disease (subtype not distinguished).', qualify: anyAffected },
    personalModel: UNSET(),
    mechanismPriority: ['stackedFamilyModel', 'publishedEstimates'],
    modelType: 'stacked logistic OR published familial-risk categories for the SAME thyroid subtype as the personal model',
    features: ['mother_affected', 'father_affected', 'sibling_affected', 'any_first_degree_affected'],
    calibration: 'Subtype-specific (autoimmune hypo/hyper, nodules, cancer are different outcomes); never pool subtypes',
    adjustmentPolicy: 'warn', numeric: 'when_validated_evidence_registered',
    candidateSources: [
      { citation: 'Registry/twin/family studies of autoimmune thyroid disease familial risk (search terms: "familial risk autoimmune thyroid disease registry")', useFor: 'first-degree relative categories; no specific paper verified', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
    ],
  },
  hereditaryCancer: {
    disease: 'hereditaryCancer', label: 'Hereditary cancer',
    supportedRelationships: ['father', 'mother', 'sibling', 'paternalGrandfather', 'paternalGrandmother', 'maternalGrandfather', 'maternalGrandmother'],
    familyHistoryDefinition: { id: 'cancer_pedigree_v1', description: 'Affected relative WITH cancer type and age at diagnosis; a bare "has cancer" flag is descriptive only.', qualify: anyAffected },
    personalModel: UNSET(),
    mechanismPriority: [],
    modelType: 'validated pedigree-based model via adapter (per cancer type); otherwise descriptive flag only',
    features: ['cancerType', 'relationship', 'ageAtOnset', 'affected relative count', 'known syndrome'],
    calibration: 'Delegated to the validated pedigree model',
    adjustmentPolicy: 'require', numeric: 'descriptive_only_without_pedigree_adapter',
    candidateSources: [
      { citation: 'Lee A et al., BOADICEA breast cancer risk prediction model (CanRisk). Genet Med 2019', useFor: 'pedigree-based breast/ovarian risk; check licence/API terms', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
      { citation: 'Tyrer J, Duffy SW, Cuzick J. Breast cancer risk model (IBIS/Tyrer-Cuzick). Stat Med 2004', useFor: 'pedigree-based breast cancer risk', status: 'unverified_candidate', caveat: CAVEAT_SHARED },
    ],
  },
};
