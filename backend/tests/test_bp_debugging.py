"""
GeneGuard Blood Pressure / Hypertension Pipeline Trace and Scenario Test
-------------------------------------------------------------------------
Executes Scenarios A, B, C, D, E using the SAME patient baseline data.
Traces intermediate values across all pipeline stages:
1. Patient Baseline
2. Family Tree & Normalization
3. Disease & Relationship Mapping
4. Family Features Construction
5. Family Risk Engine Execution
6. Mathematical Mechanism & Delta Calculation
7. Debug Info Output
"""

import os
import sys
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.prediction_service import prediction_service
from services.familyRiskEngine.familyRiskEngine import FamilyRiskEngine
from services.family_risk_service import FamilyRiskService

# Standard patient data that produces personal model output P_personal
PATIENT_BP_DATA = {
    "hemoglobin": 13.5,
    "age": 45,
    "bmi": 26.0,
    "sex": 1,
    "pregnancy": 0,
    "smoking": 0,
    "physical_activity": 7000,
    "salt_intake": 3000,
    "alcohol_consumption": 0,
    "stress_level": 1,
    "chronic_kidney_disease": 0,
    "adrenal_thyroid_disorders": 0
}

# Member definitions
FATHER_YES = {
    "person_id": "father",
    "name": "Father",
    "relationship": "Father",
    "sex": "male",
    "family_conditions": {"hypertension": 1}
}

MOTHER_YES = {
    "person_id": "mother",
    "name": "Mother",
    "relationship": "Mother",
    "sex": "female",
    "family_conditions": {"hypertension": 1}
}

GRANDFATHER_YES = {
    "person_id": "paternal_grandfather",
    "name": "Paternal Grandfather",
    "relationship": "Grandfather",
    "subtitle": "Paternal",
    "sex": "male",
    "family_conditions": {"hypertension": 1}
}


def run_scenario(scenario_name: str, members: list, personal_prob: float):
    print(f"\n{'='*70}")
    print(f"RUNNING {scenario_name}")
    print(f"{'='*70}")

    print(f"[Pipeline Stage 1: Patient Baseline] P_personal = {personal_prob * 100:.1f}% ({personal_prob})")
    print(f"[Pipeline Stage 2: Family Tree] Input members count: {len(members)}")
    for m in members:
        print(f"  - Relative: {m['relationship']} ({m.get('subtitle', 'N/A')}), hypertension: {m.get('family_conditions', {}).get('hypertension')}")

    # Stage 3, 4, 5: Family Risk Service evaluation
    eval_res = FamilyRiskService.evaluate_disease(
        disease="hypertension",
        p_personal=personal_prob,
        family_members=members,
        patient_context={"ageYears": 45, "sex": "male"},
        debug=True
    )

    dbg = eval_res.get("debugInfo", {})
    res = eval_res.get("result", {})

    print(f"\n[Pipeline Stage 3 & 4: Normalized Features]")
    feats = dbg.get("familyFeatures", {})
    print(f"  father_hypertension: {feats.get('father_hypertension')}")
    print(f"  mother_hypertension: {feats.get('mother_hypertension')}")
    print(f"  both_parents_affected: {feats.get('both_parents_affected')}")
    print(f"  first_degree_affected_count: {feats.get('first_degree_affected_count')}")
    print(f"  second_degree_affected_count: {feats.get('second_degree_affected_count')}")

    print(f"\n[Pipeline Stage 5 & 6: Engine Evaluation]")
    print(f"  calc status: {res.get('calc')}")
    print(f"  message: {res.get('message')}")
    print(f"  warnings: {res.get('warnings')}")

    print(f"\n[Pipeline Stage 7: Standard Scenario Output (Check 8 & 10)]")
    scenario_output = {
        "scenario": scenario_name,
        "personalProbability": personal_prob,
        "familyAdjustedProbability": dbg.get("familyAwareProbability"),
        "changePercentagePoints": dbg.get("changePercentagePoints"),
        "direction": dbg.get("direction"),
        "familyFeatures": {
            "father_hypertension": feats.get("father_hypertension", False),
            "mother_hypertension": feats.get("mother_hypertension", False),
            "both_parents_affected": feats.get("both_parents_affected", False)
        },
        "calculationMethod": dbg.get("calculationMethod"),
        "modelVersion": dbg.get("modelVersion"),
        "status": dbg.get("status")
    }

    print(json.dumps(scenario_output, indent=2))
    return scenario_output


def main():
    # 0. Personal baseline probability (using 46.5% as requested)
    P_PERSONAL = 0.465

    # Scenario A: No family history
    out_a = run_scenario("Scenario A: No family history", [], P_PERSONAL)

    # Scenario B: Father = YES
    out_b = run_scenario("Scenario B: Father = YES", [FATHER_YES], P_PERSONAL)

    # Scenario C: Mother = YES
    out_c = run_scenario("Scenario C: Mother = YES", [MOTHER_YES], P_PERSONAL)

    # Scenario D: Father = YES, Mother = YES
    out_d = run_scenario("Scenario D: Father = YES, Mother = YES", [FATHER_YES, MOTHER_YES], P_PERSONAL)

    # Scenario E: Father = YES, Mother = YES, Grandfather = YES
    out_e = run_scenario("Scenario E: Father = YES, Mother = YES, Grandfather = YES", [FATHER_YES, MOTHER_YES, GRANDFATHER_YES], P_PERSONAL)

    print("\n" + "="*70)
    print("SUMMARY OF ALL 5 SCENARIOS")
    print("="*70)
    for out in [out_a, out_b, out_c, out_d, out_e]:
        print(f"{out['scenario']}:")
        print(f"  P_personal: {out['personalProbability']*100:.1f}%, P_family: {out['familyAdjustedProbability']}, delta: {out['changePercentagePoints']}, status: {out['status']}")


if __name__ == "__main__":
    main()
