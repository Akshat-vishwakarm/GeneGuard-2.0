"""
Test Gemini Pipeline & Pre-Report Integrity
-------------------------------------------
Tests the end-to-end evaluation flow:
1. Patient health inputs + Family network nodes
2. Pre-Report generation (PreReportService)
3. Gemini evaluation (GeminiEvaluationService) with guardrail verification
4. Fallback resilience on API error
"""

import unittest
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.prediction_service import prediction_service
from services.pre_report_service import PreReportService
from services.gemini_evaluation_service import GeminiEvaluationService
from services.familyRiskEngine import FamilyRiskEngine
from services.family_analysis import map_unified_self_data_to_models


class TestGeminiPipeline(unittest.TestCase):

    def setUp(self):
        # Specific scenario from User Prompt Section 21:
        # Patient with realistic biometrics
        self.patient_data = {
            "name": "David Miller",
            "age": 55,
            "sex": "male",
            "gender": "male",
            "height": 175,
            "weight": 82,
            "blood_pressure_systolic": 138,
            "blood_pressure_diastolic": 88,
            "cholesterol": 2,
            "glucose": 1,
            "smoking": 0,
            "alcohol": 0,
            "physical_activity": 1,
            "salt_intake": 4.5,
            "stress_level": 1,
            "chronic_kidney_disease": 0,
            "adrenal_thyroid_disorders": 0,
            "lifestyle": {
                "smoking": "no",
                "activity": "yes",
                "alcohol": "no"
            },
            "labs": {
                "hemoglobin": 15.2,
                "fasting_glucose": 110,
                "fasting_insulin": 12.0
            }
        }

        # Family members specified in Section 21:
        # Father: Hypertension = YES, Diabetes = YES
        # Mother: Hypertension = YES
        # Paternal Grandfather: Diabetes = YES
        self.family_members = [
            {
                "person_id": "father_01",
                "relationship": "Father",
                "sex": "male",
                "age": 80,
                "deceased": False,
                "family_conditions": {
                    "hypertension": 1,
                    "diabetes": 1,
                    "cardiovascular": 0,
                    "thyroid": None
                },
                "age_at_diagnosis": {
                    "hypertension": 50,
                    "diabetes": 58
                }
            },
            {
                "person_id": "mother_01",
                "relationship": "Mother",
                "sex": "female",
                "age": 78,
                "deceased": False,
                "family_conditions": {
                    "hypertension": 1,
                    "diabetes": 0,
                    "cardiovascular": 0,
                    "thyroid": 1
                },
                "age_at_diagnosis": {
                    "hypertension": 55,
                    "thyroid": 60
                }
            },
            {
                "person_id": "pat_gf_01",
                "relationship": "Grandfather",
                "subtitle": "Paternal",
                "sex": "male",
                "age": 85,
                "deceased": True,
                "family_conditions": {
                    "diabetes": 1,
                    "hypertension": 0
                },
                "age_at_diagnosis": {
                    "diabetes": 62
                }
            }
        ]

    def test_pre_report_structure_and_integrity(self):
        """Verify Pre-Report contains ONLY real session data without hallucinated values."""
        # 1. Run actual ML predictions using application mapping
        mod_inputs = map_unified_self_data_to_models(self.patient_data)
        personal_results = prediction_service.predict_all_diseases(mod_inputs)

        # 2. Run Family Risk Pipeline
        family_risk_analysis = FamilyRiskEngine.analyze(
            personal_results=personal_results,
            mapped_personal_inputs=mod_inputs,
            family_members=self.family_members
        )

        # 3. Build Pre-Report
        pre_report = PreReportService.build_pre_report(
            self_data=self.patient_data,
            mapped_personal_inputs=mod_inputs,
            personal_results=personal_results,
            family_members=self.family_members,
            family_risk_analysis=family_risk_analysis
        )

        # Verify Patient Profile
        prof = pre_report["patient_profile"]
        self.assertEqual(prof["age"], 55)
        self.assertEqual(prof["sex"], "male")
        self.assertEqual(prof["height_cm"], 175.0)
        self.assertEqual(prof["weight_kg"], 82.0)
        self.assertAlmostEqual(prof["bmi"], 26.8, places=1)

        # Verify Family Tree Nodes
        fam_tree = pre_report["family_tree"]
        self.assertEqual(len(fam_tree), 3)

        father_node = next(n for n in fam_tree if n["relationship"] == "father")
        self.assertEqual(father_node["degree"], "1st-degree")
        self.assertEqual(father_node["recorded_conditions"]["hypertension"], "YES")
        self.assertEqual(father_node["recorded_conditions"]["diabetes"], "YES")
        self.assertEqual(father_node["recorded_conditions"]["cardiovascular"], "NO")

        mother_node = next(n for n in fam_tree if n["relationship"] == "mother")
        self.assertEqual(mother_node["degree"], "1st-degree")
        self.assertEqual(mother_node["recorded_conditions"]["hypertension"], "YES")
        self.assertEqual(mother_node["recorded_conditions"]["diabetes"], "NO")

        gf_node = next(n for n in fam_tree if "grandfather" in n["relationship"])
        self.assertEqual(gf_node["degree"], "2nd-degree")
        self.assertEqual(gf_node["recorded_conditions"]["diabetes"], "YES")

        # Verify Disease Grouping
        grouping = pre_report["family_disease_grouping"]
        # Hypertension: Father + Mother (2 first-degree, 0 second-degree)
        self.assertEqual(grouping["hypertension"]["total_affected"], 2)
        self.assertEqual(grouping["hypertension"]["first_degree_affected_count"], 2)
        self.assertEqual(grouping["hypertension"]["second_degree_affected_count"], 0)

        # Diabetes: Father (1st-degree) + Grandfather (2nd-degree)
        self.assertEqual(grouping["diabetes"]["total_affected"], 2)
        self.assertEqual(grouping["diabetes"]["first_degree_affected_count"], 1)
        self.assertEqual(grouping["diabetes"]["second_degree_affected_count"], 1)

        # Cardiovascular: 0 affected
        self.assertEqual(grouping["cardiovascular"]["total_affected"], 0)

        # Verify Disease Model Results (Cardiovascular, BP, Diabetes are available)
        d_models = pre_report["disease_model_results"]
        self.assertEqual(d_models["cardiovascular"]["status"], "available")
        self.assertIsNotNone(d_models["cardiovascular"]["model_probability"])
        self.assertEqual(d_models["hypertension"]["status"], "available")
        self.assertIsNotNone(d_models["hypertension"]["model_probability"])

        # Cancer model without required symptoms should be insufficient_data
        self.assertEqual(d_models["cancer"]["status"], "insufficient_data")
        self.assertIsNone(d_models["cancer"]["model_probability"])

    def test_gemini_evaluation_and_numerical_authority(self):
        """Verify Gemini receives the pre-report and backend numerical authority is strictly enforced."""
        mod_inputs = map_unified_self_data_to_models(self.patient_data)
        personal_results = prediction_service.predict_all_diseases(mod_inputs)
        family_risk_analysis = FamilyRiskEngine.analyze(
            personal_results=personal_results,
            mapped_personal_inputs=mod_inputs,
            family_members=self.family_members
        )
        pre_report = PreReportService.build_pre_report(
            self_data=self.patient_data,
            mapped_personal_inputs=mod_inputs,
            personal_results=personal_results,
            family_members=self.family_members,
            family_risk_analysis=family_risk_analysis
        )

        # Call Gemini evaluation
        eval_result = GeminiEvaluationService.evaluate(pre_report)

        self.assertIn("status", eval_result)
        self.assertIn("disease_evaluations", eval_result)

        dis_evals = eval_result["disease_evaluations"]
        for d in ["cardiovascular", "diabetes", "hypertension", "thyroid", "cancer"]:
            self.assertIn(d, dis_evals)
            entry = dis_evals[d]
            # Ensure backend truth is strictly enforced
            truth_mod = pre_report["disease_model_results"].get(d, {})
            self.assertEqual(entry["personal_model_output"], truth_mod.get("model_probability"))

        # Verify Hypertension family counts in Gemini result
        htn_fam = dis_evals["hypertension"]["family_history"]
        self.assertEqual(htn_fam["first_degree_count"], 2)
        self.assertEqual(htn_fam["second_degree_count"], 0)

        # Verify Diabetes family counts in Gemini result
        dia_fam = dis_evals["diabetes"]["family_history"]
        self.assertEqual(dia_fam["first_degree_count"], 1)
        self.assertEqual(dia_fam["second_degree_count"], 1)

    def test_fallback_when_api_key_invalid_or_missing(self):
        """Verify that when Gemini is unavailable, ML outputs and fallback messages are preserved."""
        pre_report = {
            "disease_model_results": {
                "hypertension": {"model_probability": 0.465, "risk_percentage": 46.5},
                "diabetes": {"model_probability": 0.210, "risk_percentage": 21.0}
            },
            "family_disease_grouping": {
                "hypertension": {"first_degree_affected_count": 2, "second_degree_affected_count": 0, "affected_relatives": []},
                "diabetes": {"first_degree_affected_count": 1, "second_degree_affected_count": 1, "affected_relatives": []}
            },
            "family_aware_context": {
                "hypertension": {"family_aware_model_status": "available", "delta_percentage_points": 5.8},
                "diabetes": {"family_aware_model_status": "available", "delta_percentage_points": 3.2}
            }
        }

        fallback = GeminiEvaluationService._fallback_response(pre_report)
        self.assertEqual(fallback["status"], "unavailable")
        self.assertEqual(fallback["message"], "AI final evaluation unavailable.")
        self.assertEqual(fallback["disease_evaluations"]["hypertension"]["personal_model_output"], 0.465)
        self.assertEqual(fallback["disease_evaluations"]["hypertension"]["family_aware_model"]["status"], "available")


if __name__ == "__main__":
    unittest.main()
