// Shared types. Erasable TypeScript only (no enums) so it runs under Node type-stripping.

export type Disease =
  | 'diabetes' | 'hypertension' | 'cardiovascular' | 'thyroid' | 'hereditaryCancer';

export type RecordedStatus = 'YES' | 'NO' | 'UNKNOWN';

export type Relationship =
  | 'father' | 'mother' | 'sibling'
  | 'paternalGrandfather' | 'paternalGrandmother'
  | 'maternalGrandfather' | 'maternalGrandmother';

export const RELATIONSHIPS: Relationship[] = [
  'father', 'mother', 'sibling',
  'paternalGrandfather', 'paternalGrandmother', 'maternalGrandfather', 'maternalGrandmother',
];

export const DEGREE: Record<Relationship, 1 | 2> = {
  father: 1, mother: 1, sibling: 1,
  paternalGrandfather: 2, paternalGrandmother: 2, maternalGrandfather: 2, maternalGrandmother: 2,
};

export const IMPLIED_SEX: Partial<Record<Relationship, 'male' | 'female'>> = {
  father: 'male', mother: 'female',
  paternalGrandfather: 'male', maternalGrandfather: 'male',
  paternalGrandmother: 'female', maternalGrandmother: 'female',
};

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  father: 'Father', mother: 'Mother', sibling: 'Sibling',
  paternalGrandfather: 'Paternal grandfather', paternalGrandmother: 'Paternal grandmother',
  maternalGrandfather: 'Maternal grandfather', maternalGrandmother: 'Maternal grandmother',
};

/** One person in the family tree, for ONE disease. */
export interface FamilyMember {
  id: string;
  relationship: Relationship;
  status: RecordedStatus;
  sex?: 'male' | 'female';        // needed for siblings when a definition is sex-specific
  ageAtOnset?: number | null;     // needed by some definitions (premature CVD, cancer)
  cancerType?: string | null;     // hereditary cancer only
}

export interface PatientContext { ageYears?: number; sex?: 'male' | 'female' }

/** Facts about the existing personal model that evidence must be compatible with. */
export interface PersonalModelProfile {
  version: string;
  outcomeCode: string;            // e.g. 'incident_t2d' – must equal the evidence outcomeCode
  timeHorizonYears: number | null; // null = prevalent/lifetime; must match evidence exactly
  covariates: string[];           // features the personal model uses (for double-counting warnings)
}

export interface EvidenceSource {
  origin: 'published' | 'internal_validation' | 'test_fixture';
  citation: string;
  identifier?: string;            // DOI / PMID
  verified: boolean;              // a human read the paper and checked population/measure/horizon
  verifiedBy?: string;
  verifiedOn?: string;            // ISO date
}

export const UNAVAILABLE_MESSAGE = 'Family-aware numerical calculation unavailable';
