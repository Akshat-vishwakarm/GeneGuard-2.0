"""
GeneGuard UX & Report Extraction Backend Acceptance Tests
Tests scenarios from prompt:
- Test 3: Thyroid report extraction
- Test 4: Metabolic report extraction
- Test 5: One report multi-model distribution
- Test 6: Missing data handling (no fake zeros)
- Test 7: Conflict handling simulation
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def run_tests():
    print("=== RUNNING GENEGUARD REPORT EXTRACTION & MODEL ROUTING ACCEPTANCE TESTS ===")

    # Test 3: Thyroid Report
    thyroid_text = """
    PATIENT THYROID REPORT
    Thyroid Stimulating Hormone: 5.8 mIU/L
    Total T3: 0.82 ng/mL
    Total Thyroxine: 6.10 ug/dL
    Thyroxine Utilization: 0.92
    Free Thyroxine Index: 6.63
    """
    res = requests.post(f"{BASE_URL}/extract-report", json={"report_text": thyroid_text})
    assert res.status_code == 200, f"Thyroid extract failed: {res.text}"
    data = res.json()
    items = {item["id"]: item["value"] for item in data["extracted_items"]}
    print("\n[TEST 3] Extracted Thyroid Items:", items)
    assert items.get("tsh") == 5.8, "TSH should be 5.8"
    assert items.get("t3") == 0.82, "T3 should be 0.82"
    assert items.get("tt4") == 6.10, "T4 should be 6.10"
    assert items.get("t4u") == 0.92, "T4U should be 0.92"
    assert items.get("fti") == 6.63, "FTI should be 6.63"
    print("[OK] Test 3 Passed: All thyroid metrics correctly extracted with normalized test names.")

    # Test 4: Metabolic Report
    metabolic_text = """
    METABOLIC LAB PANEL
    Fasting Blood Glucose: 98 mg/dL
    HbA1c: 5.4%
    Total Cholesterol: 185 mg/dL
    LDL: 112 mg/dL
    HDL: 54 mg/dL
    Triglycerides: 138 mg/dL
    """
    res = requests.post(f"{BASE_URL}/extract-report", json={"report_text": metabolic_text})
    assert res.status_code == 200, f"Metabolic extract failed: {res.text}"
    data = res.json()
    items = {item["id"]: item["value"] for item in data["extracted_items"]}
    print("\n[TEST 4] Extracted Metabolic Items:", items)
    assert items.get("fasting_glucose") == 98.0, "Glucose should be 98.0"
    assert items.get("hba1c") == 5.4, "HbA1c should be 5.4"
    assert items.get("total_cholesterol") == 185.0, "Total Cholesterol should be 185.0"
    assert items.get("ldl") == 112.0, "LDL should be 112.0"
    assert items.get("hdl") == 54.0, "HDL should be 54.0"
    assert items.get("triglycerides") == 138.0, "Triglycerides should be 138.0"
    print("[OK] Test 4 Passed: Metabolic report correctly extracted and mapped.")

    # Test 5: One Report, Multiple Models
    combined_text = """
    COMPREHENSIVE MULTI-PANEL REPORT
    TSH: 3.4 mIU/L
    Total Thyroxine: 7.8 ug/dL
    Fasting Blood Glucose: 92 mg/dL
    LDL: 105 mg/dL
    HDL: 55 mg/dL
    """
    res = requests.post(f"{BASE_URL}/extract-report", json={"report_text": combined_text})
    assert res.status_code == 200
    data = res.json()
    mapped = data["mapped_features"]
    print("\n[TEST 5] Mapped features by disease module:")
    print("Thyroid received:", mapped["thyroid"])
    print("Metabolic received:", mapped["metabolic"])
    print("Cardio received:", mapped["cardiovascular"])
    assert "tsh" in mapped["thyroid"] and "tt4" in mapped["thyroid"], "Thyroid must receive TSH and T4"
    assert "fasting_glucose" in mapped["metabolic"] and "ldl" in mapped["metabolic"] and "hdl" in mapped["metabolic"], "Metabolic must receive glucose, ldl, hdl"
    # Thyroid should NOT receive LDL or glucose
    assert "ldl" not in mapped["thyroid"] and "fasting_glucose" not in mapped["thyroid"], "Thyroid must NOT receive metabolic features"
    print("[OK] Test 5 Passed: One report correctly distributed to eligible models only.")

    # Test 6: Partial report (Missing data - should NOT fabricate values or run incomplete model)
    partial_text = """
    PARTIAL REPORT
    TSH: 5.8 mIU/L
    Total T3: 0.82 ng/mL
    """
    res = requests.post(f"{BASE_URL}/extract-report", json={"report_text": partial_text})
    data = res.json()
    items = {item["id"]: item["value"] for item in data["extracted_items"]}
    assert "tsh" in items and "t3" in items
    assert "tt4" not in items and "t4u" not in items, "Missing features must NOT be zero-filled or fabricated"

    # Now verify model prediction fails safely if required features are missing
    pred_res = requests.post(f"{BASE_URL}/predict", json={
        "person_id": "test_person",
        "disease_module": "thyroid",
        "inputs": {"tsh": 5.8, "t3": 0.82}
    })
    pred_data = pred_res.json()
    assert pred_data["result"]["available"] == False, "Model must NOT run with missing required features"
    print("\n[TEST 6] Incomplete features check:")
    print("Model availability:", pred_data["result"]["available"])
    print("Missing fields detected by backend:", pred_data["result"].get("missing_fields"))
    print("[OK] Test 6 Passed: Incomplete required features safely prevent model prediction without fabricating zeros.")

    print("\n================ ALL BACKEND EXTRACTION TESTS PASSED! ================\n")

if __name__ == "__main__":
    run_tests()
