"""
GeneGuard Family Risk Engine (Core Service)
-------------------------------------------
Main architectural service orchestrating disease-specific family feature extraction,
validated family-aware model execution, counterfactual scenario analysis, and
strict adherence to clinical/scientific integrity.

Rules:
- Sits directly AFTER the existing personal models.
- Never feeds unsupported family variables to models.
- Never invents arbitrary or fabricated risk percentages.
- Always explains model output changes without claiming biological causality.
"""

from typing import Dict, List, Any, Optional
from .familyRiskConfig import (
    DISEASES,
    FAMILY_RISK_REGISTRY,
    DISEASE_TO_MODULE_MAP,
    MODULE_TO_DISEASE_MAP
)
from .familyFeatureBuilder import FamilyFeatureBuilder
from .familyEvidenceCalculator import FamilyEvidenceCalculator
from services.family_risk_service import FamilyRiskService


class FamilyRiskEngine:
    """
    Core Family Risk Engine orchestrating family-aware evaluations.
    """

    @classmethod
    def analyze(
        cls,
        personal_results: Dict[str, Any],
        mapped_personal_inputs: Dict[str, Any],
        family_members: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes family risk evaluation across all 5 disease conditions using
        the integrated standalone TypeScript Family Risk Engine.
        """
        # 1. Build disease-specific family features (1, 0, null)
        family_features_by_disease = FamilyFeatureBuilder.build_all_disease_features(family_members)

        # 2. Extract clinical evidence summary & pedigree counts
        evidence_summary = FamilyEvidenceCalculator.calculate_summary(family_members)
        disease_summaries = evidence_summary.get("disease_summaries", {})

        # 3. Patient context for engine
        patient_context = {}
        for mod in ["blood_pressure", "cardiovascular", "metabolic", "cancer"]:
            inp = mapped_personal_inputs.get(mod, {})
            if inp.get("age"):
                patient_context["ageYears"] = inp["age"]
            if inp.get("sex") is not None:
                patient_context["sex"] = "male" if inp["sex"] == 1 else "female"
            if patient_context.get("ageYears"):
                break

        # 4. Run integrated engine evaluations
        engine_evals = FamilyRiskService.evaluate_all(
            personal_results=personal_results,
            family_members=family_members,
            patient_context=patient_context,
            debug=True
        )

        # 5. Evaluate each disease independently
        disease_evaluations = {}
        has_family = len(family_members) > 0

        for disease in DISEASES:
            cfg = FAMILY_RISK_REGISTRY[disease]
            module_key = cfg["module_key"]
            personal_res = personal_results.get(module_key, {})
            personal_avail = personal_res.get("available") if "available" in personal_res else (personal_res.get("risk_percentage") is not None)
            personal_prob_pct = personal_res.get("risk_percentage") if personal_avail else None

            fam_features = family_features_by_disease.get(disease, {})
            ev_data = disease_summaries.get(disease, {})
            fam_signal = ev_data.get("signal_status", "Unknown") if has_family else "Not provided"
            fam_summary_text = ev_data.get("summary_text", "No confirmed family history recorded") if has_family else "Family history not provided"

            fa_cfg = cfg["family_aware_model"]

            eng_data = engine_evals.get(disease, {})
            eng_result = eng_data.get("result", {})
            eng_debug = eng_data.get("debugInfo", {})

            # STATE A: Valid Trained/Stacked Family-Aware Model
            is_stacked_available = (eng_result.get("calc") == "available") and personal_avail and has_family

            if is_stacked_available:
                is_calc_available = True
                quant_status = "family_aware_model_active"
                calc_type = "stacked_model"
                fa_prob_pct = round(eng_result["pFamily"] * 100, 1) if eng_result.get("pFamily") is not None else None
                delta_pct = round(eng_result["deltaPP"], 1) if eng_result.get("deltaPP") is not None else None
                direction = eng_result.get("direction", "unchanged")
                diff_phrase = f"{abs(delta_pct)} percentage points {direction}" if delta_pct else "identical"
                explanation = (
                    f"Family-aware model output is {diff_phrase} than the personal model output. "
                    "Change in model output associated with recorded family-history information."
                )
                scenarios = eng_result.get("scenarios", [])
                fa_status = "Available"
                delta_label = "Change in model output associated with recorded family-history information."
                evidence_info = None
                matched_pattern = None

            elif has_family:
                # STATE B or STATE C: Quantitative Evidence-Based Risk using Published Epidemiological ORs
                p_prob = (personal_prob_pct / 100.0) if (personal_prob_pct is not None and personal_prob_pct > 1.0) else personal_prob_pct
                ev_calc = FamilyEvidenceCalculator.calculate_evidence_based_risk(
                    disease_key=disease,
                    p_personal=p_prob,
                    family_features=fam_features,
                    has_family_members=True
                )

                quant_status = ev_calc.get("quantification_status", "no_evidence_registered")
                evidence_info = ev_calc.get("evidence")
                matched_pattern = ev_calc.get("matched_pattern")
                scenarios = []

                if quant_status == "evidence_based_family_estimate" and personal_avail:
                    # STATE B: Mathematically valid odds-ratio transformation
                    is_calc_available = True
                    calc_type = "odds_ratio_transformation"
                    fa_status = "Available"
                    fa_prob_pct = ev_calc.get("family_adjusted_percentage")
                    delta_pct = ev_calc.get("delta_percentage_points")
                    direction = ev_calc.get("direction", "unchanged")
                    explanation = ev_calc.get("explanation", "")
                    delta_label = "Evidence-based family-history estimate"
                else:
                    # STATE C: Evidence exists but personal baseline uncalibrated / insufficient data
                    is_calc_available = False
                    calc_type = "none"
                    fa_status = "Personal data insufficient" if not personal_avail else "Not available"
                    fa_prob_pct = None
                    delta_pct = None
                    direction = None
                    explanation = ev_calc.get("explanation", "")
                    delta_label = "Family-aware estimation not currently available."
            else:
                # No family members entered
                is_calc_available = False
                quant_status = "family_history_not_provided"
                calc_type = "none"
                fa_prob_pct = None
                delta_pct = None
                direction = None
                scenarios = []
                fa_status = "Family history not provided" if disease in ["hypertension", "cancer"] else "Not available"
                delta_label = "Family history not provided"
                explanation = "Family history not provided."
                evidence_info = None
                matched_pattern = None

            # Ensure complete debug info
            if not eng_debug or not is_stacked_available:
                eng_debug = {
                    "personalProbability": round(personal_prob_pct / 100.0, 4) if personal_prob_pct is not None else None,
                    "familyFeatures": fam_features,
                    "familyAwareProbability": round(fa_prob_pct / 100.0, 4) if fa_prob_pct is not None else None,
                    "delta": round(delta_pct / 100.0, 4) if delta_pct is not None else None,
                    "changePercentagePoints": delta_pct,
                    "direction": direction if is_calc_available else None,
                    "calculationMethod": calc_type,
                    "quantificationStatus": quant_status,
                    "modelVersion": fa_cfg.get("version") or "evidence-registry-v1",
                    "status": "available" if is_calc_available else "family_calculation_unavailable",
                    "matchedPattern": matched_pattern,
                    "evidence": evidence_info
                }

            disease_evaluations[disease] = {
                "disease_key": disease,
                "disease_name": cfg["disease_name"],
                "module_key": module_key,
                "personal_model": {
                    "name": cfg["personal_model"]["name"],
                    "status": "Available" if personal_avail else "insufficient_data",
                    "version": cfg["personal_model"]["version"],
                    "output_percentage": personal_prob_pct,
                    "missing_fields": personal_res.get("missing_fields", [])
                },
                "family_aware_model": {
                    "name": fa_cfg["name"],
                    "status": fa_status,
                    "quantification_status": quant_status,
                    "calculation_type": calc_type,
                    "version": fa_cfg["version"] if is_calc_available else None,
                    "calibration_status": fa_cfg.get("calibration_status", "N/A") if is_calc_available else "N/A",
                    "output_percentage": fa_prob_pct,
                    "delta_percentage_points": delta_pct,
                    "supported_features": fa_cfg["supported_features"],
                    "evidence": evidence_info,
                    "matched_pattern": matched_pattern
                },
                "comparison": {
                    "supports_family_integration": is_calc_available,
                    "quantification_status": quant_status,
                    "delta_percentage_points": delta_pct,
                    "delta_label": delta_label,
                    "explanation": explanation,
                    "evidence": evidence_info,
                    "matched_pattern": matched_pattern
                },
                "scenarios": scenarios,
                "family_history": {
                    "signal_status": fam_signal,
                    "summary_text": fam_summary_text,
                    "first_degree_affected_count": ev_data.get("first_degree_affected_count", 0) if has_family else 0,
                    "second_degree_affected_count": ev_data.get("second_degree_affected_count", 0) if has_family else 0,
                    "affected_relatives": ev_data.get("all_affected", []) if has_family else []
                },
                "debug_info": eng_debug
            }

        return {
            "disease_evaluations": disease_evaluations,
            "family_history_summary": evidence_summary,
            "raw_family_features": family_features_by_disease,
            "registry": FAMILY_RISK_REGISTRY,
            "disclaimer": "For research and prototype use only. This output is a machine-learning-based risk signal analysis and is not a medical diagnosis."
        }


# Singleton export
family_risk_engine = FamilyRiskEngine()
