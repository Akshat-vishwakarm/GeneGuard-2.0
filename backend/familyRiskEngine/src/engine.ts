import type { Disease, EvidenceSource, FamilyMember, PatientContext, PersonalModelProfile, Relationship } from './types.ts';
import { DEGREE, RELATIONSHIPS, UNAVAILABLE_MESSAGE } from './types.ts';
import { familyRiskConfig } from './config.ts';
import type { DiseaseFamilyConfig } from './config.ts';
import type { PublishedEvidence } from './evidence.ts';
import { gateEvidence } from './evidence.ts';
import { allUnknown, anyAffected, resolveSlots, restrictSlots } from './familyFeatures.ts';
import type { Slots } from './familyFeatures.ts';
import { EvidenceRegistry, defaultRegistry } from './registry.ts';
import type { StackedFamilyModel } from './registry.ts';
import { evaluatePublished, evaluateStacked } from './mechanisms.ts';
import type { MechanismOutcome } from './mechanisms.ts';
import { isOpenProb } from './math.ts';

export type Direction = 'higher' | 'lower' | 'unchanged';
export type FamilyStatus = 'affected_relatives' | 'no_affected_recorded' | 'not_enough_information' | 'family_history_detected';

export interface FamilyRiskInput {
  disease: Disease;
  pPersonal: number;                       // output of the EXISTING personal model, 0..1
  members: FamilyMember[];
  patient?: PatientContext;
  personalModel?: PersonalModelProfile;    // overrides config (e.g. per-request model version)
}

/** A validated pedigree model (e.g. wrapping a licensed cancer risk tool). Only used if verified. */
export interface PedigreeAdapter {
  id: string; source: EvidenceSource;
  requiredMemberFields: ('cancerType' | 'ageAtOnset')[];
  compute(i: { members: FamilyMember[]; patient: PatientContext; pPersonal: number }): { pFamily: number } | null;
}

export interface EngineOptions {
  registry?: EvidenceRegistry;
  config?: Record<Disease, DiseaseFamilyConfig>;
  permitTestFixtures?: boolean;
  pedigreeAdapter?: PedigreeAdapter;
  calibrationSlopeBounds?: [number, number];   // engineering default; tune with your validation policy
}

export interface ScenarioResult { id: string; label: string; included: Relationship[]; pFamily: number | null; deltaPP: number | null; note?: string }

export interface FamilyRiskResult {
  disease: Disease;
  pPersonal: number;
  familyStatus: FamilyStatus;
  calc: 'available' | 'no_family_information' | 'unavailable';
  pFamily: number | null;
  deltaPP: number | null;
  direction: Direction | null;
  message: string;
  relatives: { recorded: { id: string; relationship: Relationship; status: string }[]; used: Relationship[]; notUsed: Relationship[]; unknown: Relationship[] };
  counts: { affectedFirstDegree: number; affectedSecondDegree: number; affectedTotal: number };
  mechanism: null | { kind: 'stacked_family_model' | 'published_estimates' | 'pedigree_adapter'; id: string; sources: EvidenceSource[]; notes: string[] };
  scenarios: ScenarioResult[];
  warnings: string[];
  rejected: { id: string; reasons: string[] }[];
}

const DIRECTION_EPS_PP = 0.05; // display rule only: changes smaller than this are shown as "unchanged"
const direction = (dPP: number): Direction => (Math.abs(dPP) < DIRECTION_EPS_PP ? 'unchanged' : dPP > 0 ? 'higher' : 'lower');

type Candidate =
  | { kind: 'stacked_family_model'; id: string; sources: EvidenceSource[]; warnings: string[]; model: StackedFamilyModel }
  | { kind: 'published_estimates'; id: string; sources: EvidenceSource[]; warnings: string[]; evidence: PublishedEvidence };

function evalCandidate(c: Candidate, slots: Slots, p: number): MechanismOutcome {
  return c.kind === 'stacked_family_model' ? evaluateStacked(c.model, slots, p) : evaluatePublished(c.evidence, slots, p);
}

function gateModel(m: StackedFamilyModel, cfg: DiseaseFamilyConfig, personal: PersonalModelProfile, permitFixtures: boolean, bounds: [number, number]): string[] {
  const r: string[] = [];
  if (m.status !== 'validated') r.push(`model status is "${m.status}", not validated`);
  if (m.source.origin === 'test_fixture') { if (!permitFixtures) r.push('test-fixture model not permitted in this run'); }
  else if (!m.source.verified || !m.source.verifiedBy || !m.source.verifiedOn) r.push('model source not verified');
  if (personal.version === 'UNSET' || personal.outcomeCode === 'UNSET') r.push('personal model profile not configured');
  if (m.personalModelVersion !== personal.version) r.push(`trained on personal model "${m.personalModelVersion}", current is "${personal.version}"`);
  if (m.outcomeCode !== personal.outcomeCode) r.push('outcome mismatch with personal model');
  if (m.timeHorizonYears !== personal.timeHorizonYears) r.push('time horizon mismatch with personal model');
  if (m.familyHistoryDefinitionId !== cfg.familyHistoryDefinition.id) r.push('family-history definition mismatch');
  const s = m.validation.calibrationSlope;
  if (!(s >= bounds[0] && s <= bounds[1])) r.push(`calibration slope ${s} outside [${bounds[0]}, ${bounds[1]}]`);
  return r;
}

const SCENARIO_PLAN: { id: string; label: string; include: Relationship[] | 'all' }[] = [
  { id: 'S1', label: 'Father', include: ['father'] },
  { id: 'S2', label: 'Mother', include: ['mother'] },
  { id: 'S3', label: 'Both parents', include: ['father', 'mother'] },
  { id: 'S4', label: 'Both parents + paternal grandfather', include: ['father', 'mother', 'paternalGrandfather'] },
  { id: 'S5', label: 'All recorded family history', include: 'all' },
];

export function computeFamilyRisk(input: FamilyRiskInput, opts: EngineOptions = {}): FamilyRiskResult {
  const cfgAll = opts.config ?? familyRiskConfig;
  const cfg = cfgAll[input.disease];
  const registry = opts.registry ?? defaultRegistry;
  const personal = input.personalModel ?? cfg.personalModel;
  const patient = input.patient ?? {};
  const p = input.pPersonal;
  const slots = resolveSlots(input.members, cfg.familyHistoryDefinition.qualify);
  const warnings: string[] = [];
  const rejected: { id: string; reasons: string[] }[] = [];

  const affected = (rs: Relationship[]) => rs.reduce((a, r) => a + slots[r].affectedCount, 0);
  const counts = {
    affectedFirstDegree: affected(RELATIONSHIPS.filter(r => DEGREE[r] === 1)),
    affectedSecondDegree: affected(RELATIONSHIPS.filter(r => DEGREE[r] === 2)),
    affectedTotal: affected(RELATIONSHIPS),
  };
  const knownRel = RELATIONSHIPS.filter(r => slots[r].status !== 'UNKNOWN');
  const unknown = RELATIONSHIPS.filter(r => slots[r].status === 'UNKNOWN' && slots[r].memberIds.length > 0);
  const status: FamilyStatus = allUnknown(slots) ? 'not_enough_information' : anyAffected(slots) ? 'affected_relatives' : 'no_affected_recorded';

  const base: FamilyRiskResult = {
    disease: input.disease, pPersonal: p, familyStatus: status, calc: 'unavailable', pFamily: null, deltaPP: null, direction: null,
    message: UNAVAILABLE_MESSAGE,
    relatives: { recorded: input.members.map(m => ({ id: m.id, relationship: m.relationship, status: m.status })), used: [], notUsed: knownRel, unknown },
    counts, mechanism: null, scenarios: [], warnings, rejected,
  };
  if (unknown.length && status !== 'not_enough_information') warnings.push('Some relatives are UNKNOWN; they were not treated as unaffected.');

  if (!isOpenProb(p)) { warnings.push('Personal probability must be strictly between 0 and 1.'); return base; }

  // No usable family information: exact no-op by construction.
  if (status === 'not_enough_information') {
    return { ...base, calc: 'no_family_information', pFamily: p, deltaPP: 0, direction: 'unchanged', message: 'Not enough information', relatives: { ...base.relatives, notUsed: [] } };
  }

  // Hereditary cancer: numeric only through a verified pedigree adapter with complete inputs.
  if (input.disease === 'hereditaryCancer') return cancerResult(base, input, opts, patient);

  // ---- candidate mechanisms that pass static gates ----
  const bounds = opts.calibrationSlopeBounds ?? [0.8, 1.2];
  const gatePolicy = { personal, patient, familyHistoryDefinitionId: cfg.familyHistoryDefinition.id, permitTestFixtures: !!opts.permitTestFixtures, adjustmentPolicy: cfg.adjustmentPolicy };
  const candidates: Candidate[] = [];
  for (const kind of cfg.mechanismPriority) {
    if (kind === 'stackedFamilyModel') {
      for (const m of registry.modelsFor(input.disease)) {
        const r = gateModel(m, cfg, personal, !!opts.permitTestFixtures, bounds);
        if (r.length) rejected.push({ id: m.id, reasons: r }); else candidates.push({ kind: 'stacked_family_model', id: m.id, sources: [m.source], warnings: [], model: m });
      }
    } else {
      for (const ev of registry.evidenceFor(input.disease)) {
        const g = gateEvidence(ev, gatePolicy);
        if (!g.ok) rejected.push({ id: ev.id, reasons: g.reasons }); else candidates.push({ kind: 'published_estimates', id: ev.id, sources: [ev.source], warnings: g.warnings, evidence: ev });
      }
    }
  }
  if (!candidates.length) { warnings.push(cfg.numeric === 'when_validated_evidence_registered' && !registry.modelsFor(input.disease).length && !registry.evidenceFor(input.disease).length ? 'No validated family-aware model or evidence is registered for this disease.' : 'No registered model/evidence passed validation gates.'); return base; }

  // ---- choose ONE mechanism (first that can evaluate the full record) ----
  let chosen: Candidate | null = null; let full: MechanismOutcome | null = null;
  for (const c of candidates) {
    const o = evalCandidate(c, slots, p);
    if (o.ok) { chosen = c; full = o; break; }
    rejected.push({ id: c.id, reasons: [o.reason] });
  }
  if (!chosen || !full || !full.ok) return base;

  warnings.push(...chosen.warnings);
  const dPP = (full.pFamily - p) * 100;
  const scenarios = buildScenarios(chosen, slots, p);
  return {
    ...base, calc: 'available', pFamily: full.pFamily, deltaPP: dPP, direction: direction(dPP),
    message: 'Change in model output associated with recorded family history.',
    relatives: { ...base.relatives, used: full.used, notUsed: full.notUsed },
    mechanism: { kind: chosen.kind, id: chosen.id, sources: chosen.sources, notes: full.notes },
    scenarios, warnings,
  };
}

function buildScenarios(c: Candidate, slots: Slots, p: number): ScenarioResult[] {
  const out: ScenarioResult[] = [{ id: 'S0', label: 'Personal model only', included: [], pFamily: p, deltaPP: 0 }];
  let prevKey = '';
  for (const s of SCENARIO_PLAN) {
    const include = s.include === 'all' ? RELATIONSHIPS.filter(r => slots[r].status !== 'UNKNOWN') : s.include;
    if (include.some(r => slots[r].status === 'UNKNOWN')) continue;           // only scenarios built from recorded relatives
    const key = [...include].sort().join(',');
    if (key === prevKey) continue; prevKey = key;
    const o = evalCandidate(c, restrictSlots(slots, include), p);
    const tag = include.map(r => `${r}:${slots[r].status}`).join(', ');
    out.push(o.ok
      ? { id: s.id, label: `+ ${s.label}`, included: include, pFamily: o.pFamily, deltaPP: (o.pFamily - p) * 100, note: `Model output when this family history is included (${tag}). Not an additive contribution.` }
      : { id: s.id, label: `+ ${s.label}`, included: include, pFamily: null, deltaPP: null, note: o.reason });
  }
  return out;
}

function cancerResult(base: FamilyRiskResult, input: FamilyRiskInput, opts: EngineOptions, patient: PatientContext): FamilyRiskResult {
  const affectedMembers = input.members.filter(m => m.status === 'YES');
  const adapter = opts.pedigreeAdapter;
  const missing = new Set<string>();
  for (const m of affectedMembers) for (const f of (adapter?.requiredMemberFields ?? ['cancerType', 'ageAtOnset'] as const)) if (m[f] == null) missing.add(`${m.relationship}.${f}`);
  const w = base.warnings;

  if (!affectedMembers.length) return { ...base, calc: 'no_family_information', pFamily: base.pPersonal, deltaPP: 0, direction: 'unchanged', message: 'No affected relatives recorded (no numerical effect assumed).' };

  const verified = adapter && (adapter.source.origin === 'test_fixture' ? !!opts.permitTestFixtures : adapter.source.verified);
  if (adapter && verified && missing.size === 0) {
    const r = adapter.compute({ members: input.members, patient, pPersonal: base.pPersonal });
    if (r && isOpenProb(r.pFamily)) {
      const d = (r.pFamily - base.pPersonal) * 100;
      return { ...base, familyStatus: 'affected_relatives', calc: 'available', pFamily: r.pFamily, deltaPP: d, direction: direction(d), message: 'Change in model output associated with recorded family history.',
        relatives: { ...base.relatives, used: affectedMembers.map(m => m.relationship), notUsed: [] }, mechanism: { kind: 'pedigree_adapter', id: adapter.id, sources: [adapter.source], notes: [] } };
    }
  }
  if (adapter && missing.size) w.push(`Numerical calculation needs: ${[...missing].join(', ')}`);
  else if (!adapter) w.push('No validated pedigree model registered; showing descriptive flag only.');
  else if (!verified) w.push('Pedigree adapter is not verified; showing descriptive flag only.');
  return { ...base, familyStatus: 'family_history_detected', message: 'Family history detected' };
}
