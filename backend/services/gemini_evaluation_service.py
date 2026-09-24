"""
GeneGuard Gemini Final Evaluation Service
-----------------------------------------
Sends the structured PRE-REPORT to the Gemini API for medical interpretation
and family-impact evaluation.

Strict Guidelines:
1. Gemini is an INTERPRETATION / EVALUATION layer only.
2. Gemini MUST NOT replace or overwrite trained disease models.
3. Gemini MUST NOT calculate new disease probabilities.
4. Gemini MUST NOT invent arbitrary percentage adjustments (e.g. no +10%, +20%).
5. Backend remains the authoritative source of numerical truth.
6. If the Gemini call fails, the ML model outputs remain fully intact,
   and a graceful fallback message is returned.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("geneguard.gemini_service")

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PROMPT = """You are GeneGuard's medical-information interpretation layer.

You are given a structured pre-report containing:
- patient profile
- personal health inputs
- verified laboratory data
- disease-specific ML model outputs
- disease-specific ML model outputs
- family tree with exact relationship degrees
- recorded family disease history
- family-aware model outputs / evidence-based calculations where available
- quantitative published evidence metadata (odds ratios, confidence intervals, cohorts, citations)

Your task is to interpret these results.

THREE EVALUATION STATES:
- STATE A (Trained Family-Aware Model): Explain the model delta calculated by the backend without recalculating.
- STATE B (Evidence-Based Family Estimate): Explain the odds-ratio transformation from the cited cohort study (e.g. "Biparental history is associated with 1.76× higher odds in the cited study, adjusting the personal model output to X% (+Y percentage points)").
- STATE C (Evidence Available but Uncalibrated / Insufficient Data): State that the published evidence reports higher odds (e.g. "1.76× higher odds reported in published literature"), but that GeneGuard has not applied a numerical percentage adjustment because personal baseline data is incomplete or uncalibrated.

CRITICAL RULES:
1. Never invent patient information, relatives, diseases, laboratory values, or probabilities.
2. Never modify ML model outputs or invent new risk scores.
3. Never calculate a new disease probability or assign arbitrary percentages (no "+5% for father", "+10% for mother").
4. OR IS NOT "% MORE PROBABILITY": Never say "76% more probability" for an OR of 1.76. State "1.76× higher odds in the cited study" unless referring to the backend's calculated absolute probability.
5. NON-CAUSAL LANGUAGE: Never claim causation (do NOT say "your parents caused your disease"). Say "recorded parental history is associated with higher risk in published population studies."
6. Explain which recorded family nodes are relevant to each disease, distinguishing first-degree vs second-degree relatives.
7. Use cautious, objective, medically appropriate language.
8. Identify missing information or data limitations where relevant.
9. Do not provide prescription or treatment instructions as if acting as a clinician.

You must return a valid JSON object matching the following structure:
{
  "overall_summary": "Concise summary of patient's personalized health risk profile and family network context.",
  "family_network_summary": "Structural summary of recorded family nodes, degree of relationship, and concentrated conditions.",
  "disease_evaluations": {
    "<disease_key>": {
      "personal_model_output": <number or null>,
      "family_history": {
        "affected_relatives": ["<Relationship>: <Condition>"],
        "first_degree_count": <number>,
        "second_degree_count": <number>
      },
      "family_aware_model": {
        "status": "<available | unavailable>",
        "probability": <number or null>,
        "delta": <number or null>,
        "quantification_status": "<family_aware_model_active | evidence_based_family_estimate | evidence_available_but_not_calibrated_to_personal_model | family_history_not_provided>"
      },
      "evaluation": "Clear, contextual interpretation explaining what the recorded family history and published evidence mean in relation to the personal model output.",
      "data_limitations": ["<Limitation or missing information>"]
    }
  },
  "important_data_gaps": ["<Missing lab test or unrecorded branch of family history>"],
  "disclaimer": "This analysis is an AI-assisted risk interpretation and not a clinical diagnosis or treatment recommendation."
}
"""


class GeminiEvaluationService:
    """
    Orchestrates pre-report interpretation via Google Gemini API.
    """

    @classmethod
    def evaluate(cls, pre_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits the pre-report to Gemini and returns the structured clinical interpretation.
        Enforces backend authority over all numerical fields.
        """
        api_key = os.environ.get("GEMINI_API_KEY", GEMINI_API_KEY)
        if not api_key:
            logger.warning("No Gemini API key configured. Returning unavailable status.")
            return cls._fallback_response(pre_report, reason="API key not configured")

        url = f"{GEMINI_ENDPOINT}?key={api_key}"

        # Clean sanitized pre-report for privacy (Section 18)
        sanitized_report = {
            "patient_profile": {
                "patient_id": pre_report.get("patient_profile", {}).get("patient_id", "patient"),
                "age": pre_report.get("patient_profile", {}).get("age"),
                "sex": pre_report.get("patient_profile", {}).get("sex"),
                "bmi": pre_report.get("patient_profile", {}).get("bmi")
            },
            "personal_health_data": pre_report.get("personal_health_data", {}),
            "verified_medical_reports": pre_report.get("verified_medical_reports", []),
            "disease_model_results": pre_report.get("disease_model_results", {}),
            "family_tree": pre_report.get("family_tree", []),
            "family_disease_grouping": pre_report.get("family_disease_grouping", {}),
            "family_aware_context": pre_report.get("family_aware_context", {})
        }

        user_message = (
            "Please review the following complete GeneGuard pre-report and produce the structured "
            "clinical risk interpretation and family impact evaluation according to your system rules:\n\n"
            + json.dumps(sanitized_report, indent=2)
        )

        request_payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_message}]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
        }

        # Log request in development mode (Section 17)
        candidate_models = [GEMINI_MODEL, "gemini-3.5-flash", "gemini-flash-latest"]
        last_error = None

        for model_name in candidate_models:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            try:
                log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
                os.makedirs(log_dir, exist_ok=True)
                with open(os.path.join(log_dir, "latest_gemini_request.json"), "w", encoding="utf-8") as f:
                    json.dump({"url": endpoint, "payload": request_payload}, f, indent=2)
            except Exception:
                pass

            try:
                resp = requests.post(endpoint, json=request_payload, timeout=25)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed_json = json.loads(raw_text)

                    # Persist raw response for traceability
                    try:
                        with open(os.path.join(log_dir, "latest_gemini_response.json"), "w", encoding="utf-8") as f:
                            json.dump(parsed_json, f, indent=2)
                    except Exception:
                        pass

                    # Enforce backend numerical truth (Section 16)
                    final_eval = cls._enforce_backend_truth(parsed_json, pre_report)
                    final_eval["status"] = "success"
                    final_eval["model_used"] = model_name
                    return final_eval

                else:
                    last_error = f"Model {model_name} HTTP {resp.status_code}: {resp.text[:200]}"
                    logger.warning(f"Gemini API returned error for {model_name}: {last_error}. Trying next candidate...")

            except Exception as e:
                last_error = str(e)
                logger.warning(f"Error calling {model_name}: {e}. Trying next candidate...")

        logger.error(f"All candidate Gemini models failed. Last error: {last_error}")
        return cls._fallback_response(pre_report, reason=last_error or "All candidate models failed")

    @classmethod
    def _enforce_backend_truth(cls, gemini_output: Dict[str, Any], pre_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        CRITICAL RULE (Section 16):
        Backend remains the authoritative source of truth.
        Overwrites any numerical probabilities with the exact outputs from the pre-report.
        Gemini cannot overwrite numerical model results or invent new ones.
        """
        disease_results = pre_report.get("disease_model_results", {})
        fa_context = pre_report.get("family_aware_context", {})
        fam_grouping = pre_report.get("family_disease_grouping", {})

        evals = gemini_output.get("disease_evaluations", {})
        for dis_key in ["cardiovascular", "diabetes", "hypertension", "thyroid", "cancer"]:
            if dis_key not in evals:
                evals[dis_key] = {}

            dis_eval = evals[dis_key]
            truth_mod = disease_results.get(dis_key, {})
            truth_fa = fa_context.get(dis_key, {})
            truth_group = fam_grouping.get(dis_key, {})

            # Enforce true personal model output
            dis_eval["personal_model_output"] = truth_mod.get("model_probability")
            dis_eval["personal_risk_percentage"] = truth_mod.get("risk_percentage")

            # Enforce true family-aware output & evidence metadata
            fa_dict = dis_eval.get("family_aware_model", {})
            fa_dict["status"] = truth_fa.get("family_aware_model_status", "unavailable")
            fa_dict["probability"] = truth_fa.get("family_aware_model_probability")
            fa_dict["delta"] = truth_fa.get("delta_percentage_points")
            fa_dict["quantification_status"] = truth_fa.get("quantification_status")
            fa_dict["evidence"] = truth_fa.get("family_evidence")
            fa_dict["matched_pattern"] = truth_fa.get("matched_pattern")
            dis_eval["family_aware_model"] = fa_dict

            # Enforce true family counts
            fam_dict = dis_eval.get("family_history", {})
            fam_dict["first_degree_count"] = truth_group.get("first_degree_affected_count", 0)
            fam_dict["second_degree_count"] = truth_group.get("second_degree_affected_count", 0)
            dis_eval["family_history"] = fam_dict

        gemini_output["disease_evaluations"] = evals
        return gemini_output

    @classmethod
    def _fallback_response(cls, pre_report: Dict[str, Any], reason: str = "Unavailable") -> Dict[str, Any]:
        """
        Graceful fallback when Gemini is unavailable (Section 19).
        All underlying model results and family history remain preserved.
        """
        disease_results = pre_report.get("disease_model_results", {})
        fa_context = pre_report.get("family_aware_context", {})
        fam_grouping = pre_report.get("family_disease_grouping", {})

        disease_evals = {}
        for dis_key in ["cardiovascular", "diabetes", "hypertension", "thyroid", "cancer"]:
            truth_mod = disease_results.get(dis_key, {})
            truth_fa = fa_context.get(dis_key, {})
            truth_group = fam_grouping.get(dis_key, {})

            affected_names = [f"{a['relationship_display']} ({a['degree']})" for a in truth_group.get("affected_relatives", [])]
            if not affected_names:
                qual_text = "No family history recorded for this condition."
            else:
                quant_st = truth_fa.get("quantification_status")
                if quant_st == "evidence_based_family_estimate":
                    ev = truth_fa.get("family_evidence") or {}
                    pat = truth_fa.get("matched_pattern") or {}
                    qual_text = (
                        f"Recorded family history: {', '.join(affected_names)}. "
                        f"Published cohort evidence reports {pat.get('effect_value', 1.0)}× higher odds "
                        f"for {pat.get('label', 'this pattern')}. The evidence-based family estimate is "
                        f"{truth_fa.get('family_aware_risk_percentage')}% ({'+' if (truth_fa.get('delta_percentage_points') or 0) > 0 else ''}{truth_fa.get('delta_percentage_points')} pp)."
                    )
                else:
                    qual_text = f"Recorded family history: {', '.join(affected_names)}. Family-aware numerical model is {truth_fa.get('family_aware_model_status')}."

            disease_evals[dis_key] = {
                "personal_model_output": truth_mod.get("model_probability"),
                "personal_risk_percentage": truth_mod.get("risk_percentage"),
                "family_history": {
                    "affected_relatives": affected_names,
                    "first_degree_count": truth_group.get("first_degree_affected_count", 0),
                    "second_degree_count": truth_group.get("second_degree_affected_count", 0)
                },
                "family_aware_model": {
                    "status": truth_fa.get("family_aware_model_status", "unavailable"),
                    "probability": truth_fa.get("family_aware_model_probability"),
                    "delta": truth_fa.get("delta_percentage_points"),
                    "quantification_status": truth_fa.get("quantification_status"),
                    "evidence": truth_fa.get("family_evidence"),
                    "matched_pattern": truth_fa.get("matched_pattern")
                },
                "evaluation": qual_text,
                "data_limitations": []
            }

        return {
            "status": "unavailable",
            "message": "AI final evaluation unavailable.",
            "overall_summary": "GeneGuard analyzed personal biometrics and documented family history across all 5 disease modules. AI narrative synthesis is temporarily unavailable.",
            "family_network_summary": "Family network processed directly through GeneGuard verified pedigree rules.",
            "disease_evaluations": disease_evals,
            "important_data_gaps": [],
            "disclaimer": "This is a machine-learning-based risk analysis and is not a medical diagnosis."
        }
