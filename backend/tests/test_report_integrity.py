import json
import urllib.request

API_URL = "http://localhost:5000/api/final-analysis"

def post_json(payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_empty_user():
    print("--- TEST 1: Empty Profile + 0 Family Members ---")
    payload = {
        "self_data": {},
        "family_members": []
    }
    res = post_json(payload)
    print("Response status:", res.get("status"))
    print("Report is None:", res.get("report") is None)
    assert res.get("status") == "insufficient_data", f"Expected insufficient_data, got {res.get('status')}"
    assert res.get("report") is None, "Expected report to be None"
    print("TEST 1 PASSED: Minimum Data Gate activated correctly!\n")

def test_partial_user():
    print("--- TEST 2: Partial Profile (Age 32, Male, no lab tests) + 0 Family Members ---")
    payload = {
        "self_data": {
            "name": "Jane Doe",
            "age": 32,
            "sex": "female",
            "height": 165,
            "weight": 60
        },
        "family_members": []
    }
    res = post_json(payload)
    assert res.get("status") == "success", f"Expected success, got {res.get('status')}"
    report = res["report"]
    
    print("Patient name:", report.get("patient_name"))
    print("Patient age:", report.get("patient_age"))
    print("Patient sex:", report.get("personal_summary", {}).get("sex"))
    assert report.get("patient_name") == "Jane Doe"
    assert report.get("patient_age") == 32
    assert report.get("personal_summary", {}).get("sex") == "female"
    
    # Check that personal models with missing features do NOT return fake numbers
    personal = report.get("personal_results", {})
    for mod in ["cardiovascular", "metabolic", "blood_pressure", "thyroid", "cancer"]:
        m_res = personal.get(mod, {})
        print(f"Model [{mod}] -> available: {m_res.get('available')}, risk_pct: {m_res.get('risk_percentage')}")
        assert m_res.get("available") is False, f"Model {mod} should not be available with missing inputs"
        assert m_res.get("risk_percentage") is None, f"Model {mod} should have None risk_percentage"

    # Check family history
    fam_hist = report.get("family_history", {})
    ev = fam_hist.get("evidence_by_disease", {})
    for mod, bullets in ev.items():
        assert bullets == ["Family history not provided"], f"Expected 'Family history not provided' for {mod}, got {bullets}"
    print("Family history evidence correctly states 'Family history not provided'")

    # Check Family Risk Engine disease evaluations
    fra = report.get("family_risk_analysis", {}).get("disease_evaluations", {})
    for d_key, d_eval in fra.items():
        pm = d_eval.get("personal_model", {})
        fa = d_eval.get("family_aware_model", {})
        assert pm.get("output_percentage") is None, f"Expected personal_model output_percentage to be None for {d_key}"
        assert fa.get("output_percentage") is None, f"Expected family_aware_model output_percentage to be None for {d_key}"
        if d_key in ["hypertension", "cancer"]:
            assert fa.get("status") == "Family history not provided", f"Expected 'Family history not provided' for {d_key}, got {fa.get('status')}"
        else:
            assert fa.get("status") == "Not available", f"Expected 'Not available' for {d_key}, got {fa.get('status')}"
    print("Family Risk Engine evaluations correctly report None/not provided for all 5 diseases")

    # Data Quality
    dq = report.get("data_quality", {}).get("summary", {})
    print("Data completeness score:", dq.get("completeness_score"))
    assert dq.get("family_members_count") == 0
    assert dq.get("lab_values_count") == 0
    print("TEST 2 PASSED: Zero fabricated values, clean insufficient-data handling!\n")

def test_full_model_execution():
    print("--- TEST 3: User with Complete Cardiovascular & Blood Pressure inputs + 1 Family Member ---")
    payload = {
        "self_data": {
            "name": "Robert Smith",
            "age": 55,
            "sex": "male",
            "height": 178,
            "weight": 82,
            "blood_pressure_systolic": 145,
            "blood_pressure_diastolic": 92,
            "cholesterol": 2, # Above normal
            "glucose": 1,     # Normal
            "lifestyle": {
                "smoking": "yes",
                "activity": "yes",
                "alcohol": "no"
            },
            "salt_intake": 4.5,
            "stress_level": 1,
            "chronic_kidney_disease": 0,
            "adrenal_thyroid_disorders": 0,
            "labs": {
                "hemoglobin": 15.2
            }
        },
        "family_members": [
            {
                "person_id": "fam_father",
                "name": "David Smith",
                "relationship": "Father",
                "sex": "male",
                "conditions": ["Hypertension"],
                "family_conditions": {"hypertension": 1, "diabetes": 0},
                "age_at_diagnosis": {"hypertension": 50}
            }
        ]
    }
    res = post_json(payload)
    assert res.get("status") == "success"
    report = res["report"]

    personal = report.get("personal_results", {})
    cardio = personal.get("cardiovascular", {})
    bp = personal.get("blood_pressure", {})
    thyroid = personal.get("thyroid", {})

    print(f"Cardiovascular model -> available: {cardio.get('available')}, risk_pct: {cardio.get('risk_percentage')}%")
    print(f"Blood Pressure model -> available: {bp.get('available')}, risk_pct: {bp.get('risk_percentage')}%")
    print(f"Thyroid model (no TSH provided) -> available: {thyroid.get('available')}, risk_pct: {thyroid.get('risk_percentage')}")

    assert cardio.get("available") is True, "Cardio model should be available with complete inputs"
    assert cardio.get("risk_percentage") is not None, "Cardio model should output a real percentage"
    assert bp.get("available") is True, "Blood pressure model should be available with complete inputs"
    assert bp.get("risk_percentage") is not None, "BP model should output a real percentage"
    assert thyroid.get("available") is False, "Thyroid model must NOT run without TSH panel"
    assert thyroid.get("risk_percentage") is None, "Thyroid model must NOT return fake 0.5%"

    # Check Family Risk Engine for Hypertension
    fra = report.get("family_risk_analysis", {}).get("disease_evaluations", {})
    htn_eval = fra.get("hypertension", {})
    htn_fa = htn_eval.get("family_aware_model", {})
    print(f"Hypertension Family-Aware model -> status: {htn_fa.get('status')}, fa_pct: {htn_fa.get('output_percentage')}, delta: {htn_fa.get('delta_percentage_points')} pp")
    assert htn_fa.get("status") == "Available", "Family-aware HTN estimate should be Available with published evidence"
    assert htn_fa.get("quantification_status") == "evidence_based_family_estimate", "Should be evidence_based_family_estimate"
    assert htn_fa.get("output_percentage") is not None, "Evidence-based HTN model should output calculated probability"
    assert htn_fa.get("delta_percentage_points") is not None, "Evidence-based HTN model should have delta pp"
    assert htn_fa.get("evidence") is not None, "Must provide epidemiological evidence source"
    assert "Parikh NI" in htn_fa.get("evidence", {}).get("citation", ""), "Must cite Framingham study"
    print("TEST 3 PASSED: Models execute genuinely only when inputs exist, evidence-based family calculations strictly active!\n")

if __name__ == "__main__":
    test_empty_user()
    test_partial_user()
    test_full_model_execution()
    print("ALL INTEGRITY TESTS PASSED!")
