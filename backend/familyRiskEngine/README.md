# GeneGuard – Family History Risk Impact Engine

Answers one question: *"Given my existing personal model output, how does the recorded family history change it?"*
Personal models are untouched. The engine takes `P_personal`, the family tree and the patient context, and returns
`P_family`, `ΔP = P_family − P_personal`, scenario outputs, and a full record of what was and was not used.

```
Patient profile → Personal model → P_personal ─┐
Family tree → resolveSlots (definition applied) → buildFeatures ─┤
                        ┌─ gated stacked family-aware model ──────┤
                        └─ gated published category evidence ─────┴→ P_family → ΔP → RiskMovementCard
```

**Nothing numeric ships.** `defaultRegistry` is empty, `personalModel` in config is `UNSET`. Until a human registers
verified evidence or a trained model, every disease returns *"Family-aware numerical calculation unavailable"*
(hereditary cancer: *"Family history detected"*). All numbers in `test/` are hand-checkable fixtures tagged
`test_fixture`, which production runs refuse.

## Two mechanisms (priority order per disease)

**A. Stacked family-aware model** (`StackedFamilyModel`) – preferred once labelled data exists.
`logit P_family = α + β_p·logit P_personal + Σ β_k x_k`, then calibration. Fit on cohort data containing the
personal-model output *and* family-history fields. Because it is fitted jointly, parents/grandparents are never summed
and interactions (`both_parents_affected`) are learnt. `NO` matters only if a `<rel>_unaffected` coefficient was fitted;
UNKNOWN encodes as all-zero indicators (training data must use the same rule). Gates: `status: validated`, matches the
personal model version/outcome/horizon/family-history definition, calibration slope within bounds, and
`P_family(no family info)` within `maxBaselineDriftPP` of `P_personal` (otherwise ΔP would mix model differences with family effect).

**B. Published category evidence** (`PublishedEvidence`) – for when no family-labelled data exists but a verified
study reports effects for *mutually exclusive* exposure categories ("no affected parent / father only / mother only / both").

Key point: the personal model was fit **without** family history, so its output is a *marginal* over unseen categories:

`P_personal = Σ_k q_k · f_k(p0)`  (q_k = category prevalence, p0 = risk with no affected relative, f_k = RR/OR/HR applied to p0)

The engine solves for `p0` (monotone → exact bisection), then `P_family = Σ_{k compatible} q_k f_k(p0) / Σ_{k compatible} q_k`.
Consequences that fall out of the maths rather than rules:
- a YES is an increase; a **NO is a decrease only because the evidence includes prevalence** (`p0 < P_personal`);
- **UNKNOWN is marginalised**, never imputed: all-unknown gives exactly `P_personal`; partly-unknown averages over compatible categories;
- multiple relatives use the joint category (e.g. "both parents"), so nothing is added or multiplied across relatives;
- relatives outside the evidence's `scope` (e.g. grandparents) are reported as *recorded but not used*.

`personalOutputInterpretation: 'unexposed_baseline'` is an explicit opt-in (no prevalence needed; negative history gets no effect,
partial unknowns are refused). `measure: 'LR'` uses posterior odds = prior odds × LR of the compatible category set
(warns about conditional-independence/double-counting). Conversions: RR `p1=RR·p0`; OR on odds; HR `1−(1−p0)^HR` (same horizon, PH).

## Validation gates (`gateEvidence`) – your 10 points
Source verified (`verifiedBy`, `verifiedOn`) · outcome code equal · time horizon equal · family-history *definition* equal
(e.g. `premature_cvd_v1`) · patient inside evidence age/sex population · design compatible with measure (case-control/cross-sectional → OR only) ·
categories exhaustive + exclusive (checked over all 2^|scope| assignments) · prevalences sum to 1 · adjustment-set overlap with the
personal model's covariates (warn, or reject with `adjustmentPolicy: 'require'`) · prevalence-basis warning.

## Disease specifics (`src/config.ts`)
- **Cardiovascular** counts a relative only if premature (male <55 / female <65; verify). Missing onset age ⇒ UNKNOWN. Risk-score coefficients (QRISK3, Reynolds) are *not* transferable multipliers – use them for definitions and cross-checks.
- **Thyroid**: evidence must match the personal model's subtype; do not pool subtypes.
- **Hereditary cancer**: no "any relative = +X%". Numeric only via a verified `PedigreeAdapter` (pedigree model per cancer type) with `cancerType` and `ageAtOnset` for every affected relative; otherwise "Family history detected".
- `candidateSources` lists papers to *look at*. They were recalled from memory, are flagged `unverified_candidate`, and **no coefficient has been copied from them**.

## Adding evidence (intake checklist)
1. Read the paper. Record population, outcome, horizon, measure (RR/OR/HR/LR), exposure categories, adjustment set.
2. Get category **prevalences** in a population like your personal model's training cohort (ideally the cohort itself).
3. Write a `PublishedEvidence` JSON/TS record, `registry.addEvidence(ev)` (throws if categories aren't exhaustive/exclusive).
4. Set `source.verified/verifiedBy/verifiedOn` only after a second person checks it. Add a regression test with the paper's reported cases.
5. Fill `familyRiskConfig[disease].personalModel` (version, outcomeCode, horizon, covariates).

## Training the family-aware model later
Need a cohort with the disease outcome, the *same* personal-model inputs, and family-history fields collected the same way GeneGuard collects them
(YES/NO/UNKNOWN per relative, onset age where the definition needs it). Compute `P_personal` with the frozen personal model, fit the stacked logistic on
its logit, hold out (external/temporal) for calibration slope and calibration-in-the-large, then export a `StackedFamilyModel` with `status: 'validated'`.
Do not use synthetic family labels.

## Use
```ts
import { diabetesFamilyRisk, toRiskMovementCard, defaultRegistry } from './src/index.ts';
const r = diabetesFamilyRisk({ pPersonal: 0.14, patient: { ageYears: 45, sex: 'male' },
  members: [{ id: 'f', relationship: 'father', status: 'YES' }, { id: 'm', relationship: 'mother', status: 'YES' }] });
const card = toRiskMovementCard(r);   // personal, familyAware|null, change|null, breakdown[], warnings
```
Run tests: `npm test` (Node ≥ 22.6). `src/` type-checks under `strict`.

## Assumptions and limits
Personal model and evidence must share outcome and horizon; UNKNOWN is assumed missing-at-random when marginalised; slots collapse multiple siblings into one
(any affected ⇒ YES); half-relatives, aunts/uncles and children are not modelled yet; ΔP is a change in *model output associated with recorded family history*, not a causal or genetic effect.
`DIRECTION_EPS_PP` (0.05 pp) and the default calibration-slope bounds (0.8–1.2) are engineering defaults, not clinical thresholds.
