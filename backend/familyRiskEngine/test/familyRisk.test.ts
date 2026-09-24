// IMPORTANT: every number below is a TEST FIXTURE chosen so the arithmetic can be checked by hand.
// They are NOT medical evidence and are marked origin:'test_fixture' so production runs refuse them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EvidenceRegistry, computeFamilyRisk, diabetesFamilyRisk, cardiovascularFamilyRisk, hereditaryCancerFamilyRisk,
  toRiskMovementCard, renderCardText, solveReferenceRisk, riskUnderEffect, expit, logit, UNAVAILABLE_MESSAGE, defaultRegistry,
} from '../src/index.ts';
import type { FamilyMember, PublishedEvidence, StackedFamilyModel, PersonalModelProfile, Relationship, RecordedStatus, PedigreeAdapter } from '../src/index.ts';

const P = 0.14;
const PM: PersonalModelProfile = { version: 'pm-1', outcomeCode: 'TEST_OUTCOME', timeHorizonYears: 10, covariates: [] };
const FIX_SRC = { origin: 'test_fixture' as const, citation: 'unit-test fixture', verified: false };
const mem = (relationship: Relationship, status: RecordedStatus, extra: Partial<FamilyMember> = {}): FamilyMember => ({ id: relationship + (extra.id ?? ''), relationship, status, ...extra });
const near = (a: number | null, b: number, eps = 1e-9) => { assert.ok(a != null && Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`); };

// Parent-level evidence with distinct father-only / mother-only / both categories (RR vs "no affected parent").
const parents = (over: Partial<PublishedEvidence> = {}): PublishedEvidence => ({
  id: 'fx-parents', disease: 'diabetes', measure: 'RR', scope: ['father', 'mother'], familyHistoryDefinitionId: 'any_affected_v1',
  referenceCategoryId: 'none', personalOutputInterpretation: 'marginal', prevalenceBasis: 'personal_model_training_cohort',
  population: { description: 'fixture', sexes: 'both' }, outcomeCode: 'TEST_OUTCOME', timeHorizonYears: 10, adjustedFor: [], design: 'cohort',
  source: FIX_SRC, assumptions: [],
  categories: [
    { id: 'none', label: 'no affected parent', patterns: [{ require: { father: false, mother: false } }], effect: 1, prevalence: 0.55 },
    { id: 'fatherOnly', label: 'father only', patterns: [{ require: { father: true, mother: false } }], effect: 1.8, prevalence: 0.20 },
    { id: 'motherOnly', label: 'mother only', patterns: [{ require: { father: false, mother: true } }], effect: 2.2, prevalence: 0.15 },
    { id: 'both', label: 'both parents', patterns: [{ require: { father: true, mother: true } }], effect: 4, prevalence: 0.10 },
  ], ...over,
});
const reg = (...evs: PublishedEvidence[]) => { const r = new EvidenceRegistry(); evs.forEach(e => r.addEvidence(e)); return r; };
const opts = (r: EvidenceRegistry) => ({ registry: r, permitTestFixtures: true });
const run = (members: FamilyMember[], r: EvidenceRegistry, patient = {}) => diabetesFamilyRisk({ pPersonal: P, members, personalModel: PM, patient }, opts(r));

// hand-derived: sum q_k*RR_k = .55+.36+.33+.40 = 1.64  =>  p0 = .14/1.64
const p0 = P / 1.64;

test('TEST 1: no family history recorded -> exact no-op', () => {
  for (const r of [reg(parents()), defaultRegistry]) {
    const res = run([], r);
    assert.equal(res.calc, 'no_family_information'); assert.equal(res.pFamily, P); assert.equal(res.deltaPP, 0);
    assert.equal(res.familyStatus, 'not_enough_information');
  }
});

test('TEST 2: father YES (mother unrecorded) -> marginalised over mother, not assumed NO', () => {
  const res = run([mem('father', 'YES')], reg(parents()));
  near(res.pFamily, ((0.20 * 1.8 + 0.10 * 4) / 0.30) * p0);
  assert.equal(res.direction, 'higher'); assert.equal(res.calc, 'available');
});

test('TEST 3: mother YES calculated separately and differs from father', () => {
  const m = run([mem('mother', 'YES')], reg(parents())), f = run([mem('father', 'YES')], reg(parents()));
  near(m.pFamily, ((0.15 * 2.2 + 0.10 * 4) / 0.25) * p0);
  assert.notEqual(m.pFamily, f.pFamily);
});

test('TEST 4: both parents come from the joint category, NOT father effect + mother effect', () => {
  const r = reg(parents());
  const both = run([mem('father', 'YES'), mem('mother', 'YES')], r);
  near(both.pFamily, 4 * p0);
  const f = run([mem('father', 'YES'), mem('mother', 'NO')], r), m = run([mem('father', 'NO'), mem('mother', 'YES')], r);
  const additive = P + (f.pFamily! - P) + (m.pFamily! - P);
  assert.ok(Math.abs(both.pFamily! - additive) > 0.01, 'must not equal the additive combination');
});

test('TEST 5: + paternal grandfather is reported as NOT used when evidence does not cover it; scenarios are labelled non-additive', () => {
  const res = run([mem('father', 'YES'), mem('mother', 'YES'), mem('paternalGrandfather', 'YES')], reg(parents()));
  near(res.pFamily, 4 * p0);
  assert.ok(res.relatives.notUsed.includes('paternalGrandfather'));
  assert.deepEqual(res.counts, { affectedFirstDegree: 2, affectedSecondDegree: 1, affectedTotal: 3 });
  assert.deepEqual(res.scenarios.map(s => s.id), ['S0', 'S1', 'S2', 'S3', 'S4']);
  assert.ok(res.scenarios.every(s => s.id === 'S0' || /Not an additive contribution/.test(s.note ?? '')));
  const [s0, s1, s2, s3, s4] = res.scenarios;
  assert.equal(s0.pFamily, P); assert.ok(s1.pFamily! > P && s2.pFamily! > s1.pFamily!); near(s3.pFamily, 4 * p0); near(s4.pFamily, s3.pFamily!);
});

test('TEST 6: NO/NO only lowers output when the evidence supports it', () => {
  const kids = [mem('father', 'NO'), mem('mother', 'NO')];
  const marg = run(kids, reg(parents()));
  near(marg.pFamily, p0); assert.equal(marg.direction, 'lower');
  const unexposed = run(kids, reg(parents({ personalOutputInterpretation: 'unexposed_baseline' })));
  assert.equal(unexposed.pFamily, P); assert.equal(unexposed.direction, 'unchanged');
  const none = run(kids, defaultRegistry);
  assert.equal(none.calc, 'unavailable'); assert.equal(none.pFamily, null); assert.equal(none.message, UNAVAILABLE_MESSAGE);
});

test('TEST 7: UNKNOWN never moves the output, and never behaves like NO', () => {
  const r = reg(parents());
  const unk = run([mem('father', 'UNKNOWN'), mem('mother', 'UNKNOWN')], r);
  assert.equal(unk.pFamily, P); assert.equal(unk.deltaPP, 0); assert.equal(unk.familyStatus, 'not_enough_information');
  const mixed = run([mem('father', 'NO'), mem('mother', 'UNKNOWN')], r);
  const allNo = run([mem('father', 'NO'), mem('mother', 'NO')], r);
  near(mixed.pFamily, ((0.55 + 0.15 * 2.2) / 0.70) * p0);
  assert.ok(mixed.pFamily! > allNo.pFamily! && mixed.pFamily! < P);
  assert.ok(mixed.warnings.some(w => /UNKNOWN/.test(w)));
});

test('math: category risks reproduce the personal model output (marginal consistency)', () => {
  const r = reg(parents());
  const cells = [['NO', 'NO', .55], ['YES', 'NO', .2], ['NO', 'YES', .15], ['YES', 'YES', .1]] as const;
  const s = cells.reduce((a, [f, m, q]) => a + q * run([mem('father', f), mem('mother', m)], r).pFamily!, 0);
  near(s, P, 1e-9);
  for (const measure of ['RR', 'OR', 'HR'] as const) {
    const cats = [{ effect: 1, prevalence: .6 }, { effect: 1.7, prevalence: .3 }, { effect: 3, prevalence: .1 }];
    const q = solveReferenceRisk(P, cats, measure)!;
    near(cats.reduce((a, c) => a + c.prevalence * riskUnderEffect(measure, c.effect, q)!, 0), P, 1e-9);
  }
  assert.equal(solveReferenceRisk(0.9, [{ effect: 1, prevalence: .5 }, { effect: 4, prevalence: .5 }], 'RR'), null);
});

test('LR route: unknown -> LR 1; posterior odds = prior odds x LR', () => {
  const lr = parents({ id: 'fx-lr', measure: 'LR', referenceCategoryId: undefined, categories: [
    { id: 'none', label: 'none', patterns: [{ require: { father: false, mother: false } }], pGivenDisease: .30, pGivenNoDisease: .60 },
    { id: 'fatherOnly', label: 'f', patterns: [{ require: { father: true, mother: false } }], pGivenDisease: .25, pGivenNoDisease: .15 },
    { id: 'motherOnly', label: 'm', patterns: [{ require: { father: false, mother: true } }], pGivenDisease: .25, pGivenNoDisease: .15 },
    { id: 'both', label: 'b', patterns: [{ require: { father: true, mother: true } }], pGivenDisease: .20, pGivenNoDisease: .10 },
  ] });
  const both = run([mem('father', 'YES'), mem('mother', 'YES')], reg(lr));
  near(both.pFamily, (P / (1 - P)) * 2 / (1 + (P / (1 - P)) * 2));
  assert.ok(both.warnings.some(w => /conditionally independent/.test(w)));
  assert.equal(run([mem('father', 'UNKNOWN')], reg(lr)).pFamily, P);
});

test('gates: unverified real evidence, fixtures in prod, horizon, outcome, population, definition', () => {
  const real = parents({ source: { origin: 'published', citation: 'x', verified: false } });
  assert.equal(run([mem('father', 'YES')], reg(real)).calc, 'unavailable');
  assert.equal(diabetesFamilyRisk({ pPersonal: P, members: [mem('father', 'YES')], personalModel: PM }, { registry: reg(parents()) }).calc, 'unavailable'); // fixtures not permitted
  assert.equal(run([mem('father', 'YES')], reg(parents({ timeHorizonYears: 5 }))).calc, 'unavailable');
  assert.equal(run([mem('father', 'YES')], reg(parents({ outcomeCode: 'OTHER' }))).calc, 'unavailable');
  assert.equal(run([mem('father', 'YES')], reg(parents({ population: { description: 'x', sexes: 'both', ageRange: [40, 60] } })), { ageYears: 30 }).calc, 'unavailable');
  assert.equal(run([mem('father', 'YES')], reg(parents({ population: { description: 'x', sexes: 'both', ageRange: [40, 60] } })), { ageYears: 50 }).calc, 'available');
  const unadjusted = parents({});
  const res = diabetesFamilyRisk({ pPersonal: P, members: [mem('father', 'YES')], personalModel: { ...PM, covariates: ['bmi'] } }, opts(reg(unadjusted)));
  assert.ok(res.warnings.some(w => /double counted/.test(w)));
  const bad = diabetesFamilyRisk({ pPersonal: P, members: [mem('father', 'YES')], personalModel: UNSET_PM() }, opts(reg(parents())));
  assert.equal(bad.calc, 'unavailable');
  assert.throws(() => reg(parents({ categories: parents().categories.slice(0, 3) })), /matches 0 categories/);   // non-exhaustive
});
const UNSET_PM = (): PersonalModelProfile => ({ version: 'UNSET', outcomeCode: 'UNSET', timeHorizonYears: null, covariates: [] });

const model = (over: Partial<StackedFamilyModel> = {}): StackedFamilyModel => ({
  id: 'fx-model', disease: 'diabetes', status: 'validated', personalModelVersion: 'pm-1', outcomeCode: 'TEST_OUTCOME', timeHorizonYears: 10,
  familyHistoryDefinitionId: 'any_affected_v1', intercept: 0, personalLogitSlope: 1,
  coefficients: { father_affected: 0.5, mother_affected: 0.6, both_parents_affected: 0.3 }, calibration: { method: 'none' },
  training: { dataset: 'fixture', n: 1, nEvents: 1, period: 'n/a', familyHistoryAscertainment: 'n/a' },
  validation: { type: 'external', n: 1, calibrationSlope: 1, calibrationInTheLarge: 0 }, maxBaselineDriftPP: 0.5, source: FIX_SRC, ...over,
});
const mreg = (m: StackedFamilyModel) => new EvidenceRegistry().addModel(m);

test('stacked family-aware model: joint prediction, interaction, no summing, NO only if fitted', () => {
  const r = mreg(model());
  const f = run([mem('father', 'YES')], r), m = run([mem('mother', 'YES')], r), b = run([mem('father', 'YES'), mem('mother', 'YES')], r);
  near(f.pFamily, expit(logit(P) + 0.5)); near(m.pFamily, expit(logit(P) + 0.6)); near(b.pFamily, expit(logit(P) + 1.4));
  assert.equal(b.mechanism?.kind, 'stacked_family_model');
  const noCoef = run([mem('father', 'NO'), mem('mother', 'NO')], r); near(noCoef.pFamily, P, 1e-12); assert.equal(noCoef.direction, 'unchanged');
  const withNo = run([mem('father', 'NO')], mreg(model({ coefficients: { father_affected: .5, father_unaffected: -.2 } })));
  near(withNo.pFamily, expit(logit(P) - 0.2)); assert.equal(withNo.direction, 'lower');
  assert.equal(run([mem('father', 'UNKNOWN')], r).pFamily, P);
});

test('stacked model gates: baseline drift, version, calibration, status', () => {
  const drift = run([mem('father', 'YES')], mreg(model({ intercept: 0.5 })));
  assert.equal(drift.calc, 'unavailable'); assert.ok(drift.rejected.some(x => /differs from the personal model/.test(x.reasons.join())));
  assert.equal(run([mem('father', 'YES')], mreg(model({ personalModelVersion: 'pm-0' }))).calc, 'unavailable');
  assert.equal(run([mem('father', 'YES')], mreg(model({ validation: { type: 'external', n: 1, calibrationSlope: 0.4, calibrationInTheLarge: 0 } }))).calc, 'unavailable');
  assert.equal(run([mem('father', 'YES')], mreg(model({ status: 'research' }))).calc, 'unavailable');
  assert.throws(() => mreg(model({ coefficients: { made_up_feature: 1 } })), /unknown feature/);
});

test('cardiovascular: premature definition; unknown onset is UNKNOWN; wrong-definition evidence rejected', () => {
  const cvdEv = (id: string, def: string) => parents({ id, disease: 'cardiovascular', familyHistoryDefinitionId: def });
  const ok = (members: FamilyMember[], def = 'premature_cvd_v1') => cardiovascularFamilyRisk({ pPersonal: P, members, personalModel: PM }, opts(reg(cvdEv('c', def))));
  assert.equal(ok([mem('father', 'YES', { ageAtOnset: 50 })]).calc, 'available');
  assert.equal(ok([mem('father', 'YES', { ageAtOnset: 50 })], 'any_affected_v1').calc, 'unavailable');
  assert.equal(ok([mem('father', 'YES')]).familyStatus, 'not_enough_information');            // no onset age
  const late = ok([mem('father', 'YES', { ageAtOnset: 70 }), mem('mother', 'NO')]);
  assert.equal(late.familyStatus, 'no_affected_recorded'); assert.equal(late.direction, 'lower'); // 70 > 55: not premature
  assert.equal(ok([mem('mother', 'YES', { ageAtOnset: 60 })]).familyStatus, 'affected_relatives'); // <65 for women
});

test('hereditary cancer: never invents a number', () => {
  const affected = [mem('mother', 'YES', { cancerType: 'breast', ageAtOnset: 45 })];
  const r = hereditaryCancerFamilyRisk({ pPersonal: P, members: affected, personalModel: PM });
  assert.equal(r.familyStatus, 'family_history_detected'); assert.equal(r.pFamily, null); assert.equal(r.message, 'Family history detected');
  const adapter: PedigreeAdapter = { id: 'fx-ped', source: FIX_SRC, requiredMemberFields: ['cancerType', 'ageAtOnset'], compute: () => ({ pFamily: 0.2 }) };
  const missing = hereditaryCancerFamilyRisk({ pPersonal: P, members: [mem('mother', 'YES')], personalModel: PM }, { pedigreeAdapter: adapter, permitTestFixtures: true });
  assert.equal(missing.pFamily, null); assert.ok(missing.warnings.some(w => /needs: mother\.cancerType/.test(w)));
  const full = hereditaryCancerFamilyRisk({ pPersonal: P, members: affected, personalModel: PM }, { pedigreeAdapter: adapter, permitTestFixtures: true });
  near(full.pFamily, 0.2);
  assert.equal(hereditaryCancerFamilyRisk({ pPersonal: P, members: affected, personalModel: PM }, { pedigreeAdapter: adapter }).pFamily, null); // fixture not permitted
});

test('production default: empty registry -> "Family-aware numerical calculation unavailable" for every disease', () => {
  for (const disease of ['diabetes', 'hypertension', 'cardiovascular', 'thyroid'] as const) {
    const res = computeFamilyRisk({ disease, pPersonal: P, members: [mem('father', 'YES', { ageAtOnset: 40 })] });
    assert.equal(res.calc, 'unavailable'); assert.equal(res.pFamily, null); assert.equal(res.message, UNAVAILABLE_MESSAGE);
  }
});

test('UI card: 3-node example', () => {
  const res = run([mem('father', 'YES'), mem('mother', 'YES'), mem('paternalGrandfather', 'YES')], reg(parents()));
  const text = renderCardText(toRiskMovementCard(res));
  for (const s of ['DIABETES', 'Your personal model', '14%', 'Family-aware model', 'percentage points', '👴 Paternal grandfather', 'Recorded but not used', 'Personal model only: 14%']) assert.ok(text.includes(s), s);
  const unk = renderCardText(toRiskMovementCard(run([mem('father', 'UNKNOWN')], reg(parents()))));
  assert.ok(unk.includes('Not enough information') && !unk.includes('Family-aware model'));
  const na = renderCardText(toRiskMovementCard(run([mem('father', 'YES')], defaultRegistry)));
  assert.ok(na.includes(UNAVAILABLE_MESSAGE) && !na.includes('percentage points'));
  console.log('\n' + text + '\n');
});
