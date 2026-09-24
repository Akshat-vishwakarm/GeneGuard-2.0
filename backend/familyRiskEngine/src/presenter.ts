import type { FamilyRiskResult } from './engine.ts';
import { familyRiskConfig } from './config.ts';
import { RELATIONSHIP_LABEL } from './types.ts';
import type { Relationship } from './types.ts';

const EMOJI: Record<Relationship, string> = {
  father: '👨', mother: '👩', sibling: '🧑',
  paternalGrandfather: '👴', maternalGrandfather: '👴', paternalGrandmother: '👵', maternalGrandmother: '👵',
};
export const fmtPct = (p: number) => `${(Math.round(p * 1000) / 10).toString()}%`;
const fmtPP = (d: number) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(Math.round(d * 10) / 10)} percentage points`;
const ARROW = { higher: '↑', lower: '↓', unchanged: '→' } as const;

export interface RiskMovementCard {
  title: string;
  personal: string;
  familyHistoryLine: string;
  familyAware: string | null;          // null => do not show a number
  change: string | null;
  recorded: { emoji: string; label: string; status: string }[];
  notUsedNote: string | null;
  headline: string;                    // "Family-aware model output" / "Family history detected" / ...
  breakdown: { label: string; value: string; note?: string }[];   // "View how this was calculated"
  method: string | null;
  warnings: string[];
}

export function toRiskMovementCard(r: FamilyRiskResult): RiskMovementCard {
  const title = familyRiskConfig[r.disease].label.toUpperCase();
  const recorded = r.relatives.recorded.filter(m => m.status !== 'UNKNOWN').map(m => ({ emoji: EMOJI[m.relationship], label: RELATIONSHIP_LABEL[m.relationship], status: m.status === 'YES' ? 'affected' : 'not affected' }));
  const famLine =
    r.familyStatus === 'not_enough_information' ? 'Not enough information'
    : r.familyStatus === 'family_history_detected' ? 'Family history detected'
    : r.familyStatus === 'no_affected_recorded' ? 'No affected relatives recorded'
    : r.calc === 'available' ? `${ARROW[r.direction!]} ${r.direction === 'higher' ? 'Higher' : r.direction === 'lower' ? 'Lower' : 'Unchanged'} model output`
    : 'Family history recorded';
  const available = r.calc === 'available';
  return {
    title, personal: fmtPct(r.pPersonal), familyHistoryLine: famLine,
    familyAware: available ? fmtPct(r.pFamily!) : null,
    change: available ? `${ARROW[r.direction!]} ${fmtPP(r.deltaPP!)}` : null,
    recorded,
    notUsedNote: r.relatives.notUsed.length ? `Recorded but not used by the validated evidence: ${r.relatives.notUsed.map(x => RELATIONSHIP_LABEL[x]).join(', ')}` : null,
    headline: available ? 'Family-aware model' : r.calc === 'unavailable' && r.familyStatus !== 'family_history_detected' ? r.message : r.message,
    breakdown: r.scenarios.map(s => ({ label: s.label, value: s.pFamily == null ? 'Not available' : fmtPct(s.pFamily), note: s.note })),
    method: r.mechanism ? `${r.mechanism.kind.replace(/_/g, ' ')} (${r.mechanism.id})` : null,
    warnings: r.warnings,
  };
}

export function renderCardText(c: RiskMovementCard): string {
  const L = [c.title, '', 'Your personal model', c.personal, '', 'Family history', c.familyHistoryLine];
  if (c.familyAware) L.push('', 'Family-aware model', c.familyAware, '', 'Change', c.change!);
  else if (c.headline && c.familyHistoryLine !== c.headline && c.headline !== 'Not enough information') L.push('', c.headline);
  if (c.recorded.length) L.push('', 'Family history recorded:', ...c.recorded.map(r => `${r.emoji} ${r.label} (${r.status})`));
  if (c.notUsedNote) L.push(c.notUsedNote);
  if (c.breakdown.length) { L.push('', '[View how this was calculated]'); for (const b of c.breakdown) L.push(`${b.label}: ${b.value}`); }
  return L.join('\n');
}
