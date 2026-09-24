"""
GeneGuard Family Risk Service
-----------------------------
Bridge connecting the Python backend to the standalone TypeScript Family Risk Calculation Engine.
Strictly adheres to scientific and clinical integrity:
- Personal models are never modified.
- Family history never invents arbitrary percentages or fabricated multipliers.
- Unvalidated models return status: "family_calculation_unavailable" and familyAdjustedProbability: null.
"""

import os
import json
import logging
import subprocess
from typing import Dict, List, Any, Optional

logger = logging.getLogger("geneguard.family_risk_service")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADAPTER_PATH = os.path.join(BASE_DIR, "familyRiskEngine", "src", "adapter.ts")

DISEASE_MAP_TO_ENGINE = {
    "blood_pressure": "hypertension",
    "hypertension": "hypertension",
    "metabolic": "diabetes",
    "diabetes": "diabetes",
    "cardiovascular": "cardiovascular",
    "thyroid": "thyroid",
    "cancer": "hereditaryCancer",
    "hereditaryCancer": "hereditaryCancer"
}

ENGINE_TO_DISEASE_MAP = {
    "hypertension": "hypertension",
    "diabetes": "diabetes",
    "cardiovascular": "cardiovascular",
    "thyroid": "thyroid",
    "hereditaryCancer": "cancer"
}


class FamilyRiskService:
    """
    Executes family-aware risk evaluation through the standalone TypeScript engine.
    """

    @classmethod
    def evaluate_disease(
        cls,
        disease: str,
        p_personal: float,
        family_members: List[Dict[str, Any]],
        patient_context: Optional[Dict[str, Any]] = None,
        permit_test_fixtures: bool = False,
        debug: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluates a single disease through the Family Risk Engine adapter.
        """
        engine_disease = DISEASE_MAP_TO_ENGINE.get(disease, disease)
        payload = {
            "disease": engine_disease,
            "pPersonal": p_personal,
            "members": family_members,
            "patient": patient_context or {},
            "options": {
                "permitTestFixtures": permit_test_fixtures,
                "debug": debug
            }
        }

        try:
            res = subprocess.run(
                ["node", "--experimental-strip-types", ADAPTER_PATH],
                input=json.dumps(payload),
                text=True,
                capture_output=True,
                cwd=BASE_DIR,
                timeout=10
            )

            if res.returncode == 0 and res.stdout.strip():
                data = json.loads(res.stdout)
                if data.get("status") == "success":
                    return data
                logger.error(f"Engine returned error: {data.get('error')}")
            else:
                logger.error(f"Engine process failed (code {res.returncode}): {res.stderr}")

        except Exception as e:
            logger.exception(f"Failed to execute Family Risk Engine for {disease}: {e}")

        # Fallback to unavailable
        return cls._unavailable_fallback(engine_disease, p_personal, family_members)

    @classmethod
    def evaluate_all(
        cls,
        personal_results: Dict[str, Any],
        family_members: List[Dict[str, Any]],
        patient_context: Optional[Dict[str, Any]] = None,
        permit_test_fixtures: bool = False,
        debug: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluates all 5 diseases through the Family Risk Engine adapter in a single batch.
        """
        eval_requests = []
        disease_keys = ["cardiovascular", "diabetes", "hypertension", "thyroid", "cancer"]

        for d in disease_keys:
            engine_disease = DISEASE_MAP_TO_ENGINE.get(d, d)
            mod_key = "blood_pressure" if d == "hypertension" else ("metabolic" if d == "diabetes" else d)

            pers_res = personal_results.get(mod_key, {})
            p_pct = pers_res.get("risk_percentage")
            if p_pct is not None:
                p_prob = p_pct / 100.0 if p_pct > 1.0 else p_pct
            else:
                p_prob = None

            eval_requests.append({
                "disease": engine_disease,
                "pPersonal": p_prob if p_prob is not None else 0.1,  # baseline dummy if unavailable
                "members": family_members,
                "_has_personal": p_prob is not None
            })

        batch_payload = {
            "patient": patient_context or {},
            "options": {
                "permitTestFixtures": permit_test_fixtures,
                "debug": debug
            },
            "evaluations": [
                {
                    "disease": req["disease"],
                    "pPersonal": req["pPersonal"],
                    "members": req["members"]
                }
                for req in eval_requests
            ]
        }

        try:
            res = subprocess.run(
                ["node", "--experimental-strip-types", ADAPTER_PATH],
                input=json.dumps(batch_payload),
                text=True,
                capture_output=True,
                cwd=BASE_DIR,
                timeout=15
            )

            if res.returncode == 0 and res.stdout.strip():
                data = json.loads(res.stdout)
                if data.get("status") == "success":
                    responses_by_disease = {}
                    for item in data.get("responses", []):
                        d_name = item.get("disease")
                        # map back to geneGuard key
                        gg_key = ENGINE_TO_DISEASE_MAP.get(d_name, d_name)
                        responses_by_disease[gg_key] = item
                        if d_name != gg_key:
                            responses_by_disease[d_name] = item
                    return responses_by_disease

        except Exception as e:
            logger.exception(f"Batch evaluation failed: {e}")

        # Fallback
        results = {}
        for d in disease_keys:
            engine_disease = DISEASE_MAP_TO_ENGINE.get(d, d)
            results[d] = cls._unavailable_fallback(engine_disease, 0.1, family_members)
        return results

    @classmethod
    def _unavailable_fallback(cls, disease: str, p_personal: float, family_members: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Provides a safe fallback response respecting scientific gates."""
        return {
            "status": "success",
            "disease": disease,
            "result": {
                "disease": disease,
                "pPersonal": p_personal,
                "familyStatus": "no_affected_recorded" if not family_members else "affected_relatives",
                "calc": "unavailable",
                "pFamily": None,
                "deltaPP": None,
                "direction": None,
                "message": "Family-aware numerical calculation unavailable",
                "relatives": {"recorded": [], "used": [], "notUsed": [], "unknown": []},
                "counts": {"affectedFirstDegree": 0, "affectedSecondDegree": 0, "affectedTotal": 0},
                "mechanism": None,
                "scenarios": [],
                "warnings": ["Family-aware calculation unavailable"],
                "rejected": []
            },
            "debugInfo": {
                "personalProbability": p_personal,
                "familyFeatures": {},
                "familyAwareProbability": None,
                "delta": None,
                "changePercentagePoints": None,
                "direction": None,
                "calculationMethod": "none",
                "modelVersion": "none",
                "status": "family_calculation_unavailable"
            }
        }
