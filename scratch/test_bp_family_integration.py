import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_bp_integration():
    print("Testing Blood Pressure Family-Aware Integration...")

    # Case 1: Only family members, no BP personal data
    payload_empty_bp = {
        "self_data": {
            "name": "Test User",
            "age": 21,
            "sex": "male",
            "gender": "male",
            "height": 183,
            "weight": 100,
            "bmi": 29.9
        },
        "family_members": [
            {
                "person_id": "father",
                "name": "Father",
                "relationship": "Father",
                "sex": "male",
                "conditions": ["hypertension"],
                "family_conditions": {"hypertension": 1}
            },
            {
                "person_id": "mother",
                "name": "Mother",
                "relationship": "Mother",
                "sex": "female",
                "conditions": ["hypertension"],
                "family_conditions": {"hypertension": 1}
            }
        ]
    }

    res1 = requests.post(f"{BASE_URL}/final-analysis", json=payload_empty_bp)
    data1 = res1.json()
    bp1 = data1["report"]["family_aware_results"]["blood_pressure"]
    print("Case 1 (No personal BP inputs):")
    print("  Personal prob:", bp1.get("personal_probability_pct"))
    print("  Family-aware prob:", bp1.get("family_aware_probability_pct"))
    print("  Delta label:", bp1.get("delta_label"))

    # Case 2: User provides normal/demo BP inputs
    payload_with_bp = dict(payload_empty_bp)
    payload_with_bp["self_data"].update({
        "hemoglobin": 14.2,
        "genetic_coefficient": 0.15,
        "pregnancy": 0,
        "smoking": 0,
        "physical_activity": 8500,
        "salt_intake": 3200,
        "alcohol_consumption": 0,
        "stress_level": 1,
        "chronic_kidney_disease": 0,
        "adrenal_thyroid_disorders": 0
    })

    res2 = requests.post(f"{BASE_URL}/final-analysis", json=payload_with_bp)
    data2 = res2.json()
    bp2 = data2["report"]["family_aware_results"]["blood_pressure"]
    personal2 = data2["report"]["personal_results"]["blood_pressure"]
    print("\nCase 2 (With personal BP inputs + Father & Mother Hypertension):")
    print("  Personal Available:", personal2.get("available"))
    print("  Personal prob:", bp2.get("personal_probability_pct"))
    print("  Family-aware prob:", bp2.get("family_aware_probability_pct"))
    print("  Delta percentage points:", bp2.get("delta_percentage_points"))
    print("  Evidence count:", bp2.get("relative_evidence_count"))

test_bp_integration()
