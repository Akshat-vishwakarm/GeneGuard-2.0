import type { Disease, FamilyMember, RecordedStatus, Relationship } from './types.ts';
import { RELATIONSHIPS } from './types.ts';
import { computeFamilyRisk } from './engine.ts';
import type { EngineOptions, FamilyRiskResult } from './engine.ts';
import { resolveSlots, buildFeatures } from './familyFeatures.ts';
import { familyRiskConfig } from './config.ts';

export interface RawGeneGuardMember {
  id?: string;
  person_id?: string;
  name?: string;
  relationship?: string;
  subtitle?: string;
  sex?: string;
  conditions?: string[];
  family_conditions?: Record<string, any>;
  age_at_diagnosis?: Record<string, any>;
  history_unknown?: boolean;
  cancer_type?: string;
}

export interface DiseaseEvaluationRequest {
  disease: Disease;
  pPersonal: number; // 0..1 or 0..100
  members: RawGeneGuardMember[];
  patient?: { ageYears?: number; sex?: 'male' | 'female' };
  options?: EngineOptions & { debug?: boolean };
}

export interface DiseaseEvaluationResponse {
  disease: Disease;
  result: FamilyRiskResult;
  debugInfo: {
    personalProbability: number;
    familyFeatures: Record<string, any>;
    familyAwareProbability: number | null;
    delta: number | null;
    changePercentagePoints: number | null;
    direction: string | null;
    calculationMethod: string;
    modelVersion: string;
    status: string;
    rejectionReasons?: string[];
  };
}

const KEYWORD_MAP: Record<Disease, string[]> = {
  diabetes: ['diabetes', 't2d', 'type 2', 'type-2', 'metabolic'],
  hypertension: ['hypertension', 'high blood pressure', 'htn', 'bp', 'blood pressure'],
  cardiovascular: ['cardiovascular', 'heart attack', 'heart disease', 'cad', 'stroke', 'cvd', 'infarction'],
  thyroid: ['thyroid', 'hypothyroid', 'hyperthyroid', 'hashimoto', 'goitre', 'graves'],
  hereditaryCancer: ['cancer', 'tumor', 'carcinoma', 'malignancy', 'oncology', 'breast', 'ovarian', 'colon', 'colorectal']
};

export function normalizeRelationship(relStr: string = '', subtitle: string = '', pid: string = ''): Relationship | null {
  const r = relStr.trim().toLowerCase();
  const sub = subtitle.trim().toLowerCase();
  const id = pid.trim().toLowerCase();

  if (r === 'father' || id === 'father') return 'father';
  if (r === 'mother' || id === 'mother') return 'mother';
  if (['brother', 'sister', 'sibling'].includes(r) || id.startsWith('brother') || id.startsWith('sister')) return 'sibling';

  const isPaternal = sub.includes('paternal') || r.includes('paternal') || id.includes('paternal');
  const isMaternal = sub.includes('maternal') || r.includes('maternal') || id.includes('maternal');

  if (r.includes('grandfather') || id.includes('grandfather')) {
    if (isMaternal) return 'maternalGrandfather';
    return 'paternalGrandfather';
  }

  if (r.includes('grandmother') || id.includes('grandmother')) {
    if (isMaternal) return 'maternalGrandmother';
    return 'paternalGrandmother';
  }

  return null;
}

export function extractConditionStatus(member: RawGeneGuardMember, disease: Disease): RecordedStatus {
  const famCond = member.family_conditions;
  const diseaseKey = disease === 'hereditaryCancer' ? 'cancer' : disease;

  if (famCond && typeof famCond === 'object' && diseaseKey in famCond) {
    const val = famCond[diseaseKey];
    if (val === 1 || val === '1' || val === true || val === 'yes' || val === 'YES') return 'YES';
    if (val === 0 || val === '0' || val === false || val === 'no' || val === 'NO') return 'NO';
    if (val === null || val === undefined || val === 'unknown') return 'UNKNOWN';
  }

  if (member.history_unknown) return 'UNKNOWN';

  // Keyword check
  const conds = (member.conditions || []).map(c => String(c).toLowerCase());
  const kwList = KEYWORD_MAP[disease] || [disease];
  const matched = conds.some(c => kwList.some(kw => c.includes(kw)));
  if (matched) return 'YES';

  // If unrecorded, it is UNKNOWN — never convert unrecorded history into confirmed absence (NO)
  return 'UNKNOWN';
}

export function mapRawMembers(rawMembers: RawGeneGuardMember[], disease: Disease): FamilyMember[] {
  const out: FamilyMember[] = [];
  const diseaseKey = disease === 'hereditaryCancer' ? 'cancer' : disease;

  for (let i = 0; i < rawMembers.length; i++) {
    const m = rawMembers[i];
    const rel = normalizeRelationship(m.relationship, m.subtitle, m.person_id);
    if (!rel) continue;

    const status = extractConditionStatus(m, disease);
    const id = m.person_id || m.id || `${rel}_${i}`;

    let ageAtOnset: number | undefined;
    if (m.age_at_diagnosis && typeof m.age_at_diagnosis === 'object') {
      const a = m.age_at_diagnosis[diseaseKey] ?? m.age_at_diagnosis[disease];
      if (a != null && !isNaN(Number(a))) ageAtOnset = Number(a);
    }

    const sex = m.sex ? (m.sex.toLowerCase().startsWith('f') ? 'female' : 'male') : undefined;

    out.push({
      id,
      relationship: rel,
      status,
      sex,
      ageAtOnset,
      cancerType: m.cancer_type
    });
  }

  return out;
}

export function evaluateDiseaseFamilyRisk(req: DiseaseEvaluationRequest): DiseaseEvaluationResponse {
  const pNormalized = req.pPersonal > 1.0 ? req.pPersonal / 100 : req.pPersonal;
  const mappedMembers = mapRawMembers(req.members, req.disease);

  const cfg = (req.options?.config ?? familyRiskConfig)[req.disease];
  const slots = resolveSlots(mappedMembers, cfg.familyHistoryDefinition.qualify);
  const rawFeatures = buildFeatures(slots);

  const result = computeFamilyRisk(
    {
      disease: req.disease,
      pPersonal: pNormalized,
      members: mappedMembers,
      patient: req.patient
    },
    req.options
  );

  const famFeatures: Record<string, any> = {};
  for (const r of RELATIONSHIPS) {
    famFeatures[`${r}_${req.disease}`] = slots[r].status === 'YES';
    famFeatures[`${r}_unaffected_${req.disease}`] = slots[r].status === 'NO';
  }
  famFeatures.first_degree_affected_count = rawFeatures.first_degree_affected_count;
  famFeatures.second_degree_affected_count = rawFeatures.second_degree_affected_count;
  famFeatures.both_parents_affected = rawFeatures.both_parents_affected === 1;

  const delta = result.pFamily != null ? Number((result.pFamily - pNormalized).toFixed(4)) : null;
  const statusStr =
    result.calc === 'available'
      ? 'available'
      : result.calc === 'no_family_information'
      ? 'no_family_information'
      : 'family_calculation_unavailable';

  const debugInfo = {
    personalProbability: pNormalized,
    familyFeatures: famFeatures,
    familyAwareProbability: result.pFamily,
    delta,
    changePercentagePoints: result.deltaPP != null ? Number(result.deltaPP.toFixed(2)) : null,
    direction: result.direction,
    calculationMethod: result.mechanism?.kind || 'none',
    modelVersion: result.mechanism?.id || 'none',
    status: statusStr,
    rejectionReasons: result.rejected.length > 0 ? result.rejected.flatMap(r => r.reasons) : undefined
  };

  return {
    disease: req.disease,
    result,
    debugInfo
  };
}

// CLI handler for stdin/stdout communication
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('adapter.ts')) {
  let inputBuffer = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', chunk => { inputBuffer += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(inputBuffer);
      if (Array.isArray(data.evaluations)) {
        const responses = data.evaluations.map((evReq: DiseaseEvaluationRequest) =>
          evaluateDiseaseFamilyRisk({ ...evReq, patient: data.patient, options: data.options })
        );
        process.stdout.write(JSON.stringify({ status: 'success', responses }) + '\n');
      } else {
        const response = evaluateDiseaseFamilyRisk(data);
        process.stdout.write(JSON.stringify({ status: 'success', ...response }) + '\n');
      }
    } catch (err: any) {
      process.stderr.write(`Adapter Error: ${err?.message || err}\n`);
      process.stdout.write(JSON.stringify({ status: 'error', error: err?.message || String(err) }) + '\n');
      process.exit(1);
    }
  });
}
