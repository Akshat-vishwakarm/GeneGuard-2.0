import type { FamilyMember, RecordedStatus, Relationship } from './types.ts';
import { DEGREE, RELATIONSHIPS } from './types.ts';

export interface SlotState { status: RecordedStatus; affectedCount: number; knownCount: number; memberIds: string[] }
export type Slots = Record<Relationship, SlotState>;
/** Applies a disease-specific family-history DEFINITION to one member (e.g. "premature CVD"). */
export type Qualifier = (m: FamilyMember) => RecordedStatus;

const emptySlot = (): SlotState => ({ status: 'UNKNOWN', affectedCount: 0, knownCount: 0, memberIds: [] });

/**
 * Collapse the tree into one slot per relationship.
 *  YES     : at least one qualifying member is affected
 *  NO      : members exist and every one is known-unaffected
 *  UNKNOWN : no members, or any unknown with no affected member. UNKNOWN is never turned into NO.
 */
export function resolveSlots(members: FamilyMember[], qualify: Qualifier = m => m.status): Slots {
  const slots = Object.fromEntries(RELATIONSHIPS.map(r => [r, emptySlot()])) as Slots;
  for (const r of RELATIONSHIPS) {
    const ms = members.filter(m => m.relationship === r);
    const st = ms.map(qualify);
    const yes = st.filter(s => s === 'YES').length, no = st.filter(s => s === 'NO').length;
    slots[r] = {
      status: yes > 0 ? 'YES' : (ms.length > 0 && no === ms.length ? 'NO' : 'UNKNOWN'),
      affectedCount: yes, knownCount: yes + no, memberIds: ms.map(m => m.id),
    };
  }
  return slots;
}

/** Scenario helper: relatives not included are UNKNOWN ("not recorded"), never NO. */
export function restrictSlots(slots: Slots, include: Relationship[]): Slots {
  const out = { ...slots };
  for (const r of RELATIONSHIPS) if (!include.includes(r)) out[r] = emptySlot();
  return out;
}

export const allUnknown = (s: Slots) => RELATIONSHIPS.every(r => s[r].status === 'UNKNOWN');
export const anyAffected = (s: Slots) => RELATIONSHIPS.some(r => s[r].status === 'YES');

const sum = (s: Slots, rs: Relationship[], k: 'affectedCount' | 'knownCount') => rs.reduce((a, r) => a + s[r][k], 0);
const first = RELATIONSHIPS.filter(r => DEGREE[r] === 1);
const second = RELATIONSHIPS.filter(r => DEGREE[r] === 2);

/** Full catalogue of features a family-aware model may be trained on. Models use a subset. */
export function buildFeatures(s: Slots): Record<string, number> {
  const f: Record<string, number> = {};
  for (const r of RELATIONSHIPS) {
    f[`${r}_affected`] = s[r].status === 'YES' ? 1 : 0;
    f[`${r}_unaffected`] = s[r].status === 'NO' ? 1 : 0;
  }
  f.first_degree_affected_count = sum(s, first, 'affectedCount');
  f.second_degree_affected_count = sum(s, second, 'affectedCount');
  f.first_degree_known_count = sum(s, first, 'knownCount');
  f.parents_affected_count = sum(s, ['father', 'mother'], 'affectedCount');
  f.both_parents_affected = s.father.status === 'YES' && s.mother.status === 'YES' ? 1 : 0;
  f.any_first_degree_affected = f.first_degree_affected_count > 0 ? 1 : 0;
  return f;
}
export const FEATURE_CATALOG: string[] = Object.keys(buildFeatures(resolveSlots([])));
