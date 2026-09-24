"""
GeneGuard Family Scenario Engine
--------------------------------
Simulates and evaluates counterfactual family-history scenarios to determine
how model output varies when specific relatives are included.

CRITICAL RULES:
- Never assume additivity: P(both parents) is evaluated directly by the model,
  never as (father_delta + mother_delta).
- Language: Always describe results as "Change in model output when recorded
  family history is included" (never biological causality).
"""

from typing import Dict, List, Any, Optional
from services.prediction_service import prediction_service


class FamilyScenarioEngine:
    """
    Evaluates multi-scenario family impacts for models supporting family integration.
    """

    @classmethod
    def evaluate_scenarios(
        cls,
        disease: str,
        personal_inputs: Dict[str, Any],
        personal_risk_pct: float,
        family_features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs Scenario A (Personal only), B (+Father), C (+Mother), D (+Both Parents),
        and E (Full Pedigree) for diseases with active family-aware models.
        """
        if disease == "hypertension":
            return cls._evaluate_hypertension_scenarios(personal_inputs, personal_risk_pct, family_features)
        elif disease == "cancer":
            return cls._evaluate_cancer_scenarios(personal_inputs, personal_risk_pct, family_features)
        else:
            return {
                "supported": False,
                "disease": disease,
                "scenarios": [],
                "note": "Family scenario engine not active: No validated family-aware model for this condition."
            }

    @classmethod
    def _evaluate_hypertension_scenarios(
        cls,
        personal_inputs: Dict[str, Any],
        personal_risk_pct: float,
        family_features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Hypertension scenarios using calibrated genetic coefficient:
        Base coefficient: 0.15
        +1st degree relative (Father or Mother): +0.25
        +2nd degree relative: +0.12
        """
        base_inputs = dict(personal_inputs)

        # Scenario A: Personal data only (baseline)
        base_inputs["genetic_coefficient"] = 0.15
        res_a = prediction_service.predict_disease("blood_pressure", base_inputs)
        p0 = res_a.get("risk_percentage", personal_risk_pct)

        # Scenario B: Personal + Father affected
        inputs_b = dict(base_inputs)
        inputs_b["genetic_coefficient"] = 0.40  # 0.15 + 0.25
        res_b = prediction_service.predict_disease("blood_pressure", inputs_b)
        p_father = res_b.get("risk_percentage", p0)

        # Scenario C: Personal + Mother affected
        inputs_c = dict(base_inputs)
        inputs_c["genetic_coefficient"] = 0.40  # 0.15 + 0.25
        res_c = prediction_service.predict_disease("blood_pressure", inputs_c)
        p_mother = res_c.get("risk_percentage", p0)

        # Scenario D: Personal + Both Parents affected (Direct non-additive model scoring)
        inputs_d = dict(base_inputs)
        inputs_d["genetic_coefficient"] = 0.65  # 0.15 + 0.25*2
        res_d = prediction_service.predict_disease("blood_pressure", inputs_d)
        p_both = res_d.get("risk_percentage", p0)

        # Scenario E: Full recorded pedigree
        n_1st = family_features.get("first_degree_affected_count", 0)
        n_2nd = family_features.get("second_degree_affected_count", 0)
        actual_coef = min(0.90, round(0.15 + (n_1st * 0.25) + (n_2nd * 0.12), 2))
        inputs_e = dict(base_inputs)
        inputs_e["genetic_coefficient"] = actual_coef
        res_e = prediction_service.predict_disease("blood_pressure", inputs_e)
        p_full = res_e.get("risk_percentage", p0)

        scenarios = [
            {
                "scenario_id": "scenario_a",
                "label": "Scenario A: Personal data only (Baseline)",
                "description": "Excludes all family history information.",
                "output_percentage": p0,
                "delta_percentage_points": 0.0,
                "delta_label": "Baseline personal model output."
            },
            {
                "scenario_id": "scenario_b",
                "label": "Scenario B: Personal + Paternal History",
                "description": "Simulates positive hypertension history in biological father.",
                "output_percentage": p_father,
                "delta_percentage_points": round(p_father - p0, 1),
                "delta_label": "Change in model output when recorded paternal family history is included."
            },
            {
                "scenario_id": "scenario_c",
                "label": "Scenario C: Personal + Maternal History",
                "description": "Simulates positive hypertension history in biological mother.",
                "output_percentage": p_mother,
                "delta_percentage_points": round(p_mother - p0, 1),
                "delta_label": "Change in model output when recorded maternal family history is included."
            },
            {
                "scenario_id": "scenario_d",
                "label": "Scenario D: Personal + Both Parents Affected",
                "description": "Evaluated directly by pipeline without assuming additive contributions.",
                "output_percentage": p_both,
                "delta_percentage_points": round(p_both - p0, 1),
                "delta_label": "Change in model output when recorded biparental family history is included."
            },
            {
                "scenario_id": "scenario_e",
                "label": "Scenario E: Recorded Full Pedigree",
                "description": f"Reflects all documented relatives ({n_1st} 1st-degree, {n_2nd} 2nd-degree).",
                "output_percentage": p_full,
                "delta_percentage_points": round(p_full - p0, 1),
                "delta_label": "Change in model output associated with full recorded family-history pedigree."
            }
        ]

        return {
            "supported": True,
            "disease": "hypertension",
            "baseline_output": p0,
            "full_pedigree_output": p_full,
            "full_delta": round(p_full - p0, 1),
            "scenarios": scenarios
        }

    @classmethod
    def _evaluate_cancer_scenarios(
        cls,
        personal_inputs: Dict[str, Any],
        personal_risk_pct: float,
        family_features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Cancer scenarios using genetic_risk integer feature (1 to 7):
        Base: 2
        Father: 4
        Mother: 4
        Both: 6 (direct evaluation)
        Full: based on total confirmed pedigree
        """
        base_inputs = dict(personal_inputs)

        # Baseline A
        base_inputs["genetic_risk"] = 2
        res_a = prediction_service.predict_disease("cancer", base_inputs)
        p0 = res_a.get("risk_percentage", personal_risk_pct)

        # Father B
        inputs_b = dict(base_inputs)
        inputs_b["genetic_risk"] = 4
        res_b = prediction_service.predict_disease("cancer", inputs_b)
        p_father = res_b.get("risk_percentage", p0)

        # Mother C
        inputs_c = dict(base_inputs)
        inputs_c["genetic_risk"] = 4
        res_c = prediction_service.predict_disease("cancer", inputs_c)
        p_mother = res_c.get("risk_percentage", p0)

        # Both D (direct evaluation)
        inputs_d = dict(base_inputs)
        inputs_d["genetic_risk"] = 6
        res_d = prediction_service.predict_disease("cancer", inputs_d)
        p_both = res_d.get("risk_percentage", p0)

        # Full E
        n_1st = family_features.get("first_degree_affected_count", 0)
        n_2nd = family_features.get("second_degree_affected_count", 0)
        actual_risk = min(7, int(2 + (n_1st * 2) + (n_2nd * 1)))
        inputs_e = dict(base_inputs)
        inputs_e["genetic_risk"] = actual_risk
        res_e = prediction_service.predict_disease("cancer", inputs_e)
        p_full = res_e.get("risk_percentage", p0)

        scenarios = [
            {
                "scenario_id": "scenario_a",
                "label": "Scenario A: Personal data only (Baseline)",
                "description": "Excludes familial oncologic history.",
                "output_percentage": p0,
                "delta_percentage_points": 0.0,
                "delta_label": "Baseline personal model output."
            },
            {
                "scenario_id": "scenario_b",
                "label": "Scenario B: Personal + Paternal Malignancy",
                "description": "Simulates reported oncologic diagnosis in biological father.",
                "output_percentage": p_father,
                "delta_percentage_points": round(p_father - p0, 1),
                "delta_label": "Change in model output when recorded paternal family history is included."
            },
            {
                "scenario_id": "scenario_c",
                "label": "Scenario C: Personal + Maternal Malignancy",
                "description": "Simulates reported oncologic diagnosis in biological mother.",
                "output_percentage": p_mother,
                "delta_percentage_points": round(p_mother - p0, 1),
                "delta_label": "Change in model output when recorded maternal family history is included."
            },
            {
                "scenario_id": "scenario_d",
                "label": "Scenario D: Personal + Both Parents Affected",
                "description": "Evaluated directly by multinomial classifier without assuming additivity.",
                "output_percentage": p_both,
                "delta_percentage_points": round(p_both - p0, 1),
                "delta_label": "Change in model output when recorded biparental family history is included."
            },
            {
                "scenario_id": "scenario_e",
                "label": "Scenario E: Recorded Full Pedigree",
                "description": f"Reflects all documented relatives ({n_1st} 1st-degree, {n_2nd} 2nd-degree).",
                "output_percentage": p_full,
                "delta_percentage_points": round(p_full - p0, 1),
                "delta_label": "Change in model output associated with full recorded family-history pedigree."
            }
        ]

        return {
            "supported": True,
            "disease": "cancer",
            "baseline_output": p0,
            "full_pedigree_output": p_full,
            "full_delta": round(p_full - p0, 1),
            "scenarios": scenarios
        }
