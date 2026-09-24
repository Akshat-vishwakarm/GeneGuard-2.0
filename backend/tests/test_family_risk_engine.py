"""
Unit tests for GeneGuard Quantitative Family Impact Engine & Evidence Registry
-------------------------------------------------------------------------------
Verifies:
1. Feature extraction preserves three-state logic (1 = YES, 0 = NO, None = UNKNOWN).
2. Exact odds-based transformation:
     odds = P / (1 - P)
     familyAdjustedOdds = odds * OR
     familyAdjustedProbability = familyAdjustedOdds / (1 + familyAdjustedOdds)
     changePercentagePoints = (familyAdjustedProbability - P) * 100
3. No arbitrary percentage addition (no +5%, +10%).
4. No invalid linear probability multiplication (P * OR is forbidden).
5. Family patterns matter: biparental != paternal + maternal.
6. State B (valid evidence-adjusted estimate) vs State C (uncalibrated / insufficient data).
7. Traceable citations and epidemiological sources for each condition.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.familyRiskEngine import (
    FamilyFeatureBuilder,
    FamilyEvidenceCalculator,
    FamilyScenarioEngine,
    FamilyRiskEngine,
    FAMILY_RISK_REGISTRY,
    get_disease_evidence,
    match_family_pattern
)


class TestFamilyRiskEngine(unittest.TestCase):

    def setUp(self):
        self.sample_family = [
            {
                "person_id": "father",
                "name": "Father",
                "relationship": "Father",
                "sex": "Male",
                "family_conditions": {
                    "diabetes": 1,
                    "hypertension": 0,
                    "cardiovascular": None,
                    "thyroid": None,
                    "cancer": None
                },
                "age_at_diagnosis": {
                    "diabetes": 52
                }
            },
            {
                "person_id": "mother",
                "name": "Mother",
                "relationship": "Mother",
                "sex": "Female",
                "family_conditions": {
                    "diabetes": 1,
                    "hypertension": 1,
                    "cardiovascular": None,
                    "thyroid": 0,
                    "cancer": None
                }
            },
            {
                "person_id": "grandfather_paternal",
                "name": "Paternal Grandfather",
                "relationship": "Paternal Grandfather",
                "sex": "Male",
                "family_conditions": {
                    "diabetes": 1,
                    "hypertension": None,
                    "cardiovascular": None,
                    "thyroid": None,
                    "cancer": None
                }
            },
            {
                "person_id": "grandfather_maternal",
                "name": "Maternal Grandfather",
                "relationship": "Maternal Grandfather",
                "sex": "Male",
                "family_conditions": {
                    "diabetes": None,
                    "hypertension": None,
                    "cardiovascular": None,
                    "thyroid": None,
                    "cancer": None
                }
            }
        ]

    def test_feature_builder_three_state_and_counts(self):
        features = FamilyFeatureBuilder.build_disease_features("diabetes", self.sample_family)
        
        # Father: YES (1)
        self.assertEqual(features["father_diabetes"], 1)
        # Mother: YES (1)
        self.assertEqual(features["mother_diabetes"], 1)
        # Paternal Grandfather: YES (1)
        self.assertEqual(features["paternal_grandfather_diabetes"], 1)
        # Maternal Grandfather: UNKNOWN (None)
        self.assertIsNone(features["maternal_grandfather_diabetes"])
        
        # 1st-degree affected: Father + Mother = 2
        self.assertEqual(features["first_degree_affected_count"], 2)
        # 2nd-degree affected: Paternal Grandfather = 1
        self.assertEqual(features["second_degree_affected_count"], 1)
        # Affected parents = 2
        self.assertEqual(features["affected_parent_count"], 2)

    def test_unknown_never_converted_to_no(self):
        features = FamilyFeatureBuilder.build_disease_features("cardiovascular", self.sample_family)
        # All cardiovascular are None
        self.assertIsNone(features["father_cardiovascular"])
        self.assertIsNone(features["mother_cardiovascular"])
        self.assertEqual(features["first_degree_affected_count"], 0)

        # Thyroid: Mother is confirmed 0 (NO), Father is None (UNKNOWN)
        th_features = FamilyFeatureBuilder.build_disease_features("thyroid", self.sample_family)
        self.assertEqual(th_features["mother_thyroid"], 0)
        self.assertIsNone(th_features["father_thyroid"])

    def test_evidence_summary_generation(self):
        summary = FamilyEvidenceCalculator.calculate_summary(self.sample_family)
        diab_sum = summary["disease_summaries"]["diabetes"]
        
        self.assertEqual(diab_sum["signal_status"], "Detected")
        self.assertIn("2 first-degree relatives", diab_sum["summary_text"])
        self.assertIn("1 second-degree relative", diab_sum["summary_text"])

    def test_quantitative_odds_ratio_hypertension_biparental(self):
        """
        User Prompt Example:
        P_personal = 46.5% (0.465)
        Father: Hypertension = YES
        Mother: Hypertension = YES
        Published Framingham Offspring Study Biparental OR = 1.76 (95% CI: 1.42–2.18)
        
        Exact Math:
        personal_odds = 0.465 / (1 - 0.465) = 0.8691588785
        family_odds = 0.8691588785 * 1.76 = 1.529719626
        P_family = 1.529719626 / (1 + 1.529719626) = 0.604699 (~60.5%)
        delta = 60.5 - 46.5 = +14.0 percentage points
        """
        family_htn_biparental = [
            {"person_id": "f", "relationship": "Father", "family_conditions": {"hypertension": 1}},
            {"person_id": "m", "relationship": "Mother", "family_conditions": {"hypertension": 1}}
        ]
        fam_features = FamilyFeatureBuilder.build_disease_features("hypertension", family_htn_biparental)
        
        result = FamilyEvidenceCalculator.calculate_evidence_based_risk(
            disease_key="hypertension",
            p_personal=0.465,
            family_features=fam_features,
            has_family_members=True
        )

        self.assertEqual(result["status"], "Available")
        self.assertEqual(result["quantification_status"], "evidence_based_family_estimate")
        self.assertEqual(result["calculation_type"], "odds_ratio_transformation")
        self.assertEqual(result["family_adjusted_percentage"], 60.5)
        self.assertEqual(result["delta_percentage_points"], 14.0)
        self.assertEqual(result["direction"], "higher")

        # Verify publication citation and pattern
        ev = result["evidence"]
        self.assertIn("Parikh NI", ev["citation"])
        self.assertEqual(ev["effect_measure"], "OR")
        self.assertEqual(ev["effect_value"], 1.76)
        self.assertEqual(ev["confidence_interval"], "[1.42, 2.18]")

        # Crucial check: NOT linear probability multiplication (46.5 * 1.76 = 81.84)
        self.assertNotEqual(result["family_adjusted_percentage"], round(46.5 * 1.76, 1))
        # Crucial check: NOT arbitrary percentage addition (46.5 + 5 + 5 = 56.5)
        self.assertNotEqual(result["family_adjusted_percentage"], 56.5)

    def test_family_pattern_distinction_uniparental_vs_biparental(self):
        """
        Tests that engine distinguishes Father-only vs Mother-only vs Both Parents.
        Do NOT assume father effect + mother effect equals both-parent effect.
        """
        p_personal = 0.465

        # 1. Father only
        fam_f = [{"person_id": "f", "relationship": "Father", "family_conditions": {"hypertension": 1}}]
        feats_f = FamilyFeatureBuilder.build_disease_features("hypertension", fam_f)
        pat_f = match_family_pattern("hypertension", feats_f)
        self.assertEqual(pat_f["id"], "htn_paternal")
        self.assertEqual(pat_f["effect_value"], 1.42)

        res_f = FamilyEvidenceCalculator.calculate_evidence_based_risk("hypertension", p_personal, feats_f)
        # personal_odds = 0.465/0.535 = 0.8691588785; family_odds = 0.8691588785 * 1.42 = 1.2342056; P_family = 1.2342056/2.2342056 = 55.2%
        self.assertEqual(res_f["family_adjusted_percentage"], 55.2)
        self.assertEqual(res_f["delta_percentage_points"], 8.7)

        # 2. Mother only
        fam_m = [{"person_id": "m", "relationship": "Mother", "family_conditions": {"hypertension": 1}}]
        feats_m = FamilyFeatureBuilder.build_disease_features("hypertension", fam_m)
        pat_m = match_family_pattern("hypertension", feats_m)
        self.assertEqual(pat_m["id"], "htn_maternal")
        self.assertEqual(pat_m["effect_value"], 1.48)

        res_m = FamilyEvidenceCalculator.calculate_evidence_based_risk("hypertension", p_personal, feats_m)
        self.assertEqual(res_m["family_adjusted_percentage"], 56.3)
        self.assertEqual(res_m["delta_percentage_points"], 9.8)

        # 3. Both parents
        fam_both = [
            {"person_id": "f", "relationship": "Father", "family_conditions": {"hypertension": 1}},
            {"person_id": "m", "relationship": "Mother", "family_conditions": {"hypertension": 1}}
        ]
        feats_both = FamilyFeatureBuilder.build_disease_features("hypertension", fam_both)
        pat_both = match_family_pattern("hypertension", feats_both)
        self.assertEqual(pat_both["id"], "htn_biparental")
        self.assertEqual(pat_both["effect_value"], 1.76)

        # Notice: 1.76 is NOT 1.42 + 1.48 (which would be 2.90)
        self.assertNotEqual(pat_both["effect_value"], pat_f["effect_value"] + pat_m["effect_value"])

    def test_state_c_uncalibrated_or_insufficient_personal_baseline(self):
        """
        STATE C: Personal model has insufficient data / uncalibrated baseline (P = None).
        Engine must report the documented odds ratio and source citation, but
        MUST NOT fabricate a numerical family-adjusted probability or delta.
        """
        family_htn = [
            {"person_id": "f", "relationship": "Father", "family_conditions": {"hypertension": 1}},
            {"person_id": "m", "relationship": "Mother", "family_conditions": {"hypertension": 1}}
        ]
        feats = FamilyFeatureBuilder.build_disease_features("hypertension", family_htn)

        # P_personal is None (insufficient biometrics)
        res_c = FamilyEvidenceCalculator.calculate_evidence_based_risk(
            disease_key="hypertension",
            p_personal=None,
            family_features=feats,
            has_family_members=True
        )

        self.assertEqual(res_c["quantification_status"], "evidence_available_but_not_calibrated_to_personal_model")
        self.assertEqual(res_c["calculation_type"], "none")
        self.assertIsNone(res_c["family_adjusted_probability"])
        self.assertIsNone(res_c["delta_percentage_points"])
        self.assertIsNotNone(res_c["evidence"])
        self.assertEqual(res_c["evidence"]["effect_value"], 1.76)
        self.assertIn("does not calculate a speculative percentage adjustment", res_c["explanation"])

    def test_end_to_end_family_risk_engine_coordination(self):
        """
        Tests FamilyRiskEngine.analyze() integrating State B for Hypertension and Diabetes,
        and State C for conditions where personal inputs are insufficient.
        """
        mock_personal_results = {
            "metabolic": {"available": True, "risk_percentage": 20.0, "prediction": "Moderate"},
            "blood_pressure": {"available": True, "risk_percentage": 46.5, "prediction": "Moderate"},
            "cardiovascular": {"available": True, "risk_percentage": 18.0, "prediction": "Lower Risk"},
            "thyroid": {"available": False, "risk_percentage": None, "missing_fields": ["TSH"]},
            "cancer": {"available": False, "risk_percentage": None, "missing_fields": ["coughing_of_blood"]}
        }

        family_data = [
            {"person_id": "f", "relationship": "Father", "family_conditions": {"hypertension": 1, "diabetes": 1, "thyroid": 1}},
            {"person_id": "m", "relationship": "Mother", "family_conditions": {"hypertension": 1, "diabetes": 0, "thyroid": 0}}
        ]

        analysis = FamilyRiskEngine.analyze(
            personal_results=mock_personal_results,
            mapped_personal_inputs={},
            family_members=family_data
        )

        evals = analysis["disease_evaluations"]

        # Hypertension: Personal 46.5%, Biparental HTN -> State B: 60.5% (+14.0 pp)
        htn = evals["hypertension"]
        self.assertEqual(htn["family_aware_model"]["status"], "Available")
        self.assertEqual(htn["family_aware_model"]["quantification_status"], "evidence_based_family_estimate")
        self.assertEqual(htn["family_aware_model"]["output_percentage"], 60.5)
        self.assertEqual(htn["family_aware_model"]["delta_percentage_points"], 14.0)

        # Diabetes: Personal 20.0%, Paternal Diabetes -> State B
        # OR = 1.54 (Meigs et al. 2000)
        # odds = 0.20 / 0.80 = 0.25; family_odds = 0.25 * 1.54 = 0.385; P_fam = 0.385 / 1.385 = 27.8%; delta = +7.8 pp
        diab = evals["diabetes"]
        self.assertEqual(diab["family_aware_model"]["status"], "Available")
        self.assertEqual(diab["family_aware_model"]["quantification_status"], "evidence_based_family_estimate")
        self.assertEqual(diab["family_aware_model"]["output_percentage"], 27.8)
        self.assertEqual(diab["family_aware_model"]["delta_percentage_points"], 7.8)

        # Thyroid: Personal biometrics unavailable -> State C
        # Must retain published evidence (Manji et al.) but NOT fabricate a percentage
        thyroid = evals["thyroid"]
        self.assertEqual(thyroid["family_aware_model"]["quantification_status"], "evidence_available_but_not_calibrated_to_personal_model")
        self.assertIsNone(thyroid["family_aware_model"]["output_percentage"])
        self.assertIsNone(thyroid["family_aware_model"]["delta_percentage_points"])
        self.assertIsNotNone(thyroid["family_aware_model"]["evidence"])
        self.assertIn("Manji", thyroid["family_aware_model"]["evidence"]["citation"])


if __name__ == "__main__":
    unittest.main()
