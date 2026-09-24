"""
GeneGuard Family Evidence Calculator
------------------------------------
Extracts qualitative evidence and structured pedigree summaries from recorded
family members. Ensures that:
- Confirmed affected members (1) are accurately attributed to 1st/2nd degree.
- Confirmed absence (0) is distinguished from Unknown (None).
- A clean, clinical summary is produced for both the canvas and the final report.
"""

from typing import List, Dict, Any, Optional
from .familyRiskConfig import DISEASES, FAMILY_RISK_REGISTRY
from .familyFeatureBuilder import extract_member_disease_state, normalize_relationship_key, is_first_degree, is_second_degree


class FamilyEvidenceCalculator:
    """
    Computes disease-by-disease qualitative evidence, pedigree degree counts,
    and clinical summary labels.
    """

    @classmethod
    def calculate_summary(cls, family_members: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Produces the compact summary required by Section 16 of the specification:
        e.g.
        Diabetes: 2 first-degree relatives, 1 second-degree relative
        Hypertension: 1 first-degree relative
        Heart Disease: No confirmed family history recorded
        Thyroid Disease: Unknown
        """
        if not family_members:
            empty_summaries = {}
            for d in DISEASES:
                d_cfg = FAMILY_RISK_REGISTRY.get(d, {})
                empty_summaries[d] = {
                    "disease_key": d,
                    "disease_title": d_cfg.get("disease_name", d.capitalize()),
                    "signal_status": "Not provided",
                    "summary_text": "Family history not provided",
                    "first_degree_affected_count": 0,
                    "second_degree_affected_count": 0,
                    "first_degree_affected": [],
                    "second_degree_affected": [],
                    "all_affected": [],
                    "confirmed_negative": [],
                    "unknown_status": []
                }
            return {
                "disease_summaries": empty_summaries,
                "all_documented_relatives": [],
                "documented_members_count": 0
            }

        disease_summaries = {}
        all_documented_relatives = []

        for disease in DISEASES:
            disease_cfg = FAMILY_RISK_REGISTRY.get(disease, {})
            disease_title = disease_cfg.get("disease_name", disease.capitalize())

            first_degree_affected = []
            second_degree_affected = []
            confirmed_negative = []
            unknown_status = []

            for member in family_members:
                rel = member.get("relationship", "Relative")
                pid = member.get("person_id", "")
                rel_key = normalize_relationship_key(rel, pid)

                if rel_key in ["self", "me"]:
                    continue

                name = member.get("name") or rel
                status = extract_member_disease_state(member, disease)
                
                # Check optional age at diagnosis
                age_diag_map = member.get("age_at_diagnosis") or {}
                age_diag = age_diag_map.get(disease) if isinstance(age_diag_map, dict) else None

                member_record = {
                    "person_id": pid,
                    "name": name,
                    "relationship": rel,
                    "degree": "1st-degree" if is_first_degree(rel_key) else ("2nd-degree" if is_second_degree(rel_key) else "Relative"),
                    "status": "YES" if status == 1 else ("NO" if status == 0 else "UNKNOWN"),
                    "status_code": status,
                    "age_at_diagnosis": age_diag
                }

                if status == 1:
                    if is_first_degree(rel_key):
                        first_degree_affected.append(member_record)
                    elif is_second_degree(rel_key):
                        second_degree_affected.append(member_record)
                    else:
                        second_degree_affected.append(member_record)
                elif status == 0:
                    confirmed_negative.append(member_record)
                else:
                    unknown_status.append(member_record)

            # Determine clinical signal status
            n_1st = len(first_degree_affected)
            n_2nd = len(second_degree_affected)
            total_affected = n_1st + n_2nd

            if total_affected > 0:
                signal_status = "Detected"
                parts = []
                if n_1st > 0:
                    parts.append(f"{n_1st} first-degree relative{'s' if n_1st > 1 else ''}")
                if n_2nd > 0:
                    parts.append(f"{n_2nd} second-degree relative{'s' if n_2nd > 1 else ''}")
                summary_text = ", ".join(parts)
            elif len(confirmed_negative) > 0 and len(unknown_status) == 0:
                signal_status = "Not detected"
                summary_text = "No confirmed family history recorded"
            elif len(confirmed_negative) > 0 and len(unknown_status) > 0:
                signal_status = "Not detected"
                summary_text = "No confirmed family history recorded (some relatives unknown)"
            else:
                signal_status = "Unknown"
                summary_text = "Unknown / Not recorded"

            disease_summaries[disease] = {
                "disease_key": disease,
                "disease_title": disease_title,
                "signal_status": signal_status,
                "summary_text": summary_text,
                "first_degree_affected_count": n_1st,
                "second_degree_affected_count": n_2nd,
                "first_degree_affected": first_degree_affected,
                "second_degree_affected": second_degree_affected,
                "all_affected": first_degree_affected + second_degree_affected,
                "confirmed_negative": confirmed_negative,
                "unknown_status": unknown_status
            }

        # Build list of all relatives with at least one documented condition
        for member in family_members:
            pid = member.get("person_id", "")
            rel = member.get("relationship", "Relative")
            rel_key = normalize_relationship_key(rel, pid)
            if rel_key in ["self", "me"]:
                continue

            name = member.get("name") or rel
            known_conditions = []
            for d in DISEASES:
                st = extract_member_disease_state(member, d)
                if st == 1:
                    age_diag_map = member.get("age_at_diagnosis") or {}
                    age_val = age_diag_map.get(d) if isinstance(age_diag_map, dict) else None
                    diag_suffix = f" (dx age {age_val})" if age_val else ""
                    d_title = FAMILY_RISK_REGISTRY.get(d, {}).get("disease_name", d.capitalize())
                    known_conditions.append(f"{d_title}{diag_suffix}")

            is_1st = is_first_degree(rel_key)
            all_documented_relatives.append({
                "person_id": pid,
                "name": name,
                "relationship": rel,
                "degree": "1st" if is_1st else "2nd",
                "weight": "50% (0.50)" if is_1st else "25% (0.25)",
                "conditions": known_conditions,
                "has_conditions": len(known_conditions) > 0
            })

        return {
            "disease_summaries": disease_summaries,
            "documented_relatives": all_documented_relatives,
            "total_members": len(all_documented_relatives)
        }

    @classmethod
    def calculate_evidence_based_risk(
        cls,
        disease_key: str,
        p_personal: Optional[float],
        family_features: Dict[str, Any],
        has_family_members: bool = True
    ) -> Dict[str, Any]:
        """
        Calculates the quantitative family-adjusted probability using published
        epidemiological odds ratios when valid evidence exists.
        
        Mathematical Rules (Sections 1 & 2):
        1. NEVER adds arbitrary percentages (no +5% or +10%).
        2. NEVER multiplies probability directly by odds ratio (P * OR is invalid).
        3. Converts probability to odds: odds = P / (1 - P).
        4. Applies matched pattern odds ratio: family_odds = odds * OR.
        5. Converts family odds back to probability: P_family = family_odds / (1 + family_odds).
        6. Computes delta in percentage points: delta = (P_family - P) * 100.
        7. Returns State B (valid evidence estimate) or State C (evidence uncalibrated).
        """
        from .familyEvidenceRegistry import get_disease_evidence, match_family_pattern

        evidence_entry = get_disease_evidence(disease_key)
        if not evidence_entry:
            return {
                "status": "Not available",
                "quantification_status": "no_evidence_registered",
                "calculation_type": "none",
                "personal_probability": p_personal,
                "family_adjusted_probability": None,
                "delta_percentage_points": None,
                "direction": None,
                "matched_pattern": None,
                "evidence": None,
                "explanation": "No published family-history evidence registered for this disease."
            }

        matched_pattern = match_family_pattern(disease_key, family_features)
        primary_source = evidence_entry.get("primary_source", {})
        effect_val = float(matched_pattern.get("effect_value", 1.0))
        pattern_id = matched_pattern.get("id", "none_affected")
        pattern_label = matched_pattern.get("label", "Family history pattern")
        ci_str = matched_pattern.get("confidence_interval", "")
        citation = primary_source.get("citation", "")

        # STATE C: Personal model has insufficient data / uncalibrated baseline
        if p_personal is None or not (0.0 < p_personal < 1.0):
            explanation = (
                f"Personal model inputs are insufficient to establish a calibrated baseline. "
                f"Published evidence documents {effect_val}× higher odds ({matched_pattern.get('effect_measure', 'OR')}) "
                f"for {pattern_label} ({citation}), but GeneGuard does not calculate a speculative percentage adjustment."
                if pattern_id != "none_affected" else
                "Personal model data insufficient."
            )
            return {
                "status": "Personal data insufficient" if p_personal is None else "Not available",
                "quantification_status": "evidence_available_but_not_calibrated_to_personal_model",
                "calculation_type": "none",
                "personal_probability": None,
                "family_adjusted_probability": None,
                "delta_percentage_points": None,
                "direction": None,
                "matched_pattern": matched_pattern,
                "evidence": {
                    "source": primary_source.get("title", ""),
                    "citation": citation,
                    "cohort_population": primary_source.get("cohort_population", ""),
                    "outcome_definition": primary_source.get("outcome_definition", ""),
                    "effect_measure": matched_pattern.get("effect_measure", "OR"),
                    "effect_value": effect_val,
                    "confidence_interval": ci_str,
                    "matched_pattern_id": pattern_id,
                    "matched_pattern_label": pattern_label
                },
                "explanation": explanation
            }

        # No affected relatives recorded
        if pattern_id == "none_affected" or effect_val == 1.0:
            return {
                "status": "Available",
                "quantification_status": "evidence_based_family_estimate",
                "calculation_type": "odds_ratio_transformation",
                "personal_probability": round(p_personal, 4),
                "personal_percentage": round(p_personal * 100.0, 1),
                "family_adjusted_probability": round(p_personal, 4),
                "family_adjusted_percentage": round(p_personal * 100.0, 1),
                "delta_percentage_points": 0.0,
                "direction": "unchanged",
                "matched_pattern": matched_pattern,
                "evidence": {
                    "source": primary_source.get("title", ""),
                    "citation": citation,
                    "cohort_population": primary_source.get("cohort_population", ""),
                    "outcome_definition": primary_source.get("outcome_definition", ""),
                    "effect_measure": matched_pattern.get("effect_measure", "OR"),
                    "effect_value": 1.0,
                    "confidence_interval": "[1.00, 1.00]",
                    "matched_pattern_id": pattern_id,
                    "matched_pattern_label": pattern_label
                },
                "explanation": "No affected relatives are documented for this condition. The baseline model output is unchanged."
            }

        # STATE B: Valid Evidence-Based Family Estimate via Odds-Ratio Transformation
        personal_odds = p_personal / (1.0 - p_personal)
        family_odds = personal_odds * effect_val
        p_family = family_odds / (1.0 + family_odds)

        delta_pp = round((p_family - p_personal) * 100.0, 1)
        direction = "higher" if delta_pp > 0 else ("lower" if delta_pp < 0 else "unchanged")

        explanation = (
            f"The family-history-adjusted estimate is {round(p_family * 100.0, 1)}%, compared with a personal model output "
            f"of {round(p_personal * 100.0, 1)}% ({'+' if delta_pp > 0 else ''}{delta_pp} percentage points). "
            f"This reflects {effect_val}× higher odds ({matched_pattern.get('effect_measure', 'OR')}) reported for "
            f"{pattern_label} in published cohort evidence ({citation})."
        )

        return {
            "status": "Available",
            "quantification_status": "evidence_based_family_estimate",
            "calculation_type": "odds_ratio_transformation",
            "personal_probability": round(p_personal, 4),
            "personal_percentage": round(p_personal * 100.0, 1),
            "family_adjusted_probability": round(p_family, 4),
            "family_adjusted_percentage": round(p_family * 100.0, 1),
            "delta_percentage_points": delta_pp,
            "direction": direction,
            "matched_pattern": matched_pattern,
            "evidence": {
                "source": primary_source.get("title", ""),
                "citation": citation,
                "cohort_population": primary_source.get("cohort_population", ""),
                "outcome_definition": primary_source.get("outcome_definition", ""),
                "effect_measure": matched_pattern.get("effect_measure", "OR"),
                "effect_value": effect_val,
                "confidence_interval": ci_str,
                "matched_pattern_id": pattern_id,
                "matched_pattern_label": pattern_label
            },
            "explanation": explanation
        }

