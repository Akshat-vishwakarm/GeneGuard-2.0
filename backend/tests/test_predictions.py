"""
GeneGuard Automated Integration and Endpoint Tests for all 5 Disease Models
-----------------------------------------------------------------------------
Tests model prediction execution, missing feature discipline, unit conversions,
and REST API endpoints.
"""

import sys
import os
import unittest
import json

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from services.prediction_service import prediction_service


class GeneGuardBackendTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_schema_endpoint(self):
        res = self.app.get("/api/models/schema")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("cardiovascular", data["models"])
        self.assertIn("metabolic", data["models"])
        self.assertIn("blood_pressure", data["models"])
        self.assertIn("thyroid", data["models"])
        self.assertIn("cancer", data["models"])

    def test_cardiovascular_prediction(self):
        payload = {
            "disease_module": "cardiovascular",
            "inputs": {
                "age": 52,
                "gender": "male",
                "height": 175,
                "weight": 82,
                "ap_hi": 140,
                "ap_lo": 90,
                "cholesterol": "above_normal",
                "gluc": "normal",
                "smoke": "no",
                "alco": "no",
                "active": "yes"
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["result"]["available"])
        self.assertIn("Elevated", data["result"]["prediction"])
        self.assertIsNotNone(data["result"]["risk_percentage"])
        self.assertIn("contributing_inputs", data["result"])

    def test_metabolic_prediction(self):
        payload = {
            "disease_module": "metabolic",
            "inputs": {
                "age": 35,
                "height": 160,
                "waist": 110,
                "weight": 85,
                "body_fat": 32,
                "skeletal_muscle": 24,
                "total_cholesterol": 250,
                "triglycerides": 240,
                "ldl": 170,
                "hdl": 33,
                "sys_bp": 135,
                "dia_bp": 90,
                "fasting_glucose": 128,
                "fasting_insulin": 22
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["result"]["available"])
        self.assertIsNotNone(data["result"]["risk_percentage"])

    def test_blood_pressure_prediction(self):
        payload = {
            "disease_module": "blood_pressure",
            "inputs": {
                "hemoglobin": 14.2,
                "genetic_coefficient": 0.55,
                "age": 48,
                "bmi": 27.5,
                "sex": 1,
                "pregnancy": 0,
                "smoking": 1,
                "physical_activity": 6000,
                "salt_intake": 4200,
                "alcohol_consumption": 20,
                "stress_level": 2,
                "chronic_kidney_disease": 0,
                "adrenal_thyroid_disorders": 0
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["result"]["available"])

    def test_thyroid_prediction(self):
        payload = {
            "disease_module": "thyroid",
            "inputs": {
                "sex": 0,
                "tsh": 12.5,
                "t3": 0.4,
                "tt4": 3.2,
                "t4u": 0.9,
                "on_thyroxine": 0,
                "on_antithyroid": 0,
                "pregnant": 0,
                "thyroid_surgery": 0,
                "query_hypothyroid": 1,
                "query_hyperthyroid": 0,
                "goitre": 1,
                "tumor": 0
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["result"]["available"])

    def test_cancer_prediction(self):
        payload = {
            "disease_module": "cancer",
            "inputs": {
                "age": 55,
                "gender": 1,
                "air_pollution": 6,
                "alcohol_use": 5,
                "dust_allergy": 5,
                "occupational_hazards": 6,
                "genetic_risk": 6,
                "chronic_lung_disease": 4,
                "balanced_diet": 3,
                "obesity": 5,
                "smoking": 6,
                "passive_smoker": 5,
                "chest_pain": 6,
                "coughing_of_blood": 5,
                "fatigue": 6,
                "weight_loss": 5,
                "shortness_of_breath": 6,
                "wheezing": 5,
                "swallowing_difficulty": 4,
                "clubbing_finger_nails": 5,
                "frequent_cold": 4,
                "dry_cough": 5,
                "snoring": 4
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["result"]["available"])
        self.assertIn("class_probabilities", data["result"])

    def test_missing_required_inputs_returns_unavailable(self):
        # Omit required 'ap_hi' for cardiovascular
        payload = {
            "disease_module": "cardiovascular",
            "inputs": {
                "age": 50,
                "gender": "male"
                # Missing height, weight, ap_hi, etc.
            }
        }
        res = self.app.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data["result"]["available"])
        self.assertEqual(data["result"]["reason"], "Required information is missing.")
        self.assertTrue(len(data["result"]["missing_fields"]) > 0)

    def test_thyroid_report_extraction(self):
        report_text = """PATIENT THYROID LAB REPORT
        Thyroid Stimulating Hormone (TSH): 5.8 mIU/L
        Total T3: 0.82 ng/mL
        Total Thyroxine (T4): 6.1 ug/dL
        Thyroxine Uptake (T4U): 0.92
        Free Thyroxine Index (FTI): 6.6"""

        res = self.app.post("/api/extract-report", json={"report_text": report_text})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(len(data["extracted_items"]) >= 5)

        items_map = {item["test_key"]: item["value"] for item in data["extracted_items"]}
        self.assertEqual(items_map["TSH"], 5.8)
        self.assertEqual(items_map["T3"], 0.82)
        self.assertEqual(items_map["T4"], 6.1)
        self.assertEqual(items_map["T4U"], 0.92)
        self.assertEqual(items_map["FTI"], 6.6)

    def test_report_confirmation_and_routing(self):
        verified_items = [
            {"id": "tsh", "test_key": "TSH", "display_name": "TSH", "value": 5.8, "unit": "mIU/L", "source": "Uploaded Lab Report"},
            {"id": "ldl", "test_key": "LDL", "display_name": "LDL", "value": 142.0, "unit": "mg/dL", "source": "Uploaded Lab Report"}
        ]

        res = self.app.post("/api/confirm-report", json={"verified_items": verified_items})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("thyroid", data["mapped_inputs"])
        self.assertEqual(data["mapped_inputs"]["thyroid"]["tsh"], 5.8)
        self.assertIn("metabolic", data["mapped_inputs"])
        self.assertEqual(data["mapped_inputs"]["metabolic"]["ldl"], 142.0)


if __name__ == "__main__":
    unittest.main()
