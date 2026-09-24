"""
GeneGuard Thyroid Inference Engine
-----------------------------------
Loads gene_guard_thyroid_pipeline.pkl, executes validation with named pandas DataFrame,
handles missing values without zero-filling, and returns structured predictions.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "gene_guard_thyroid_pipeline.pkl")
EVAL_DIR = os.path.join(BASE_DIR, "evaluation")

EXPECTED_FEATURES = [
    'age', 'sex', 'on_thyroxine', 'query_on_thyroxine',
    'on_antithyroid_medication', 'sick', 'pregnant', 'thyroid_surgery',
    'i131_treatment', 'query_hypothyroid', 'query_hyperthyroid', 'lithium',
    'goitre', 'tumor', 'hypopituitary', 'psych', 'tsh_measured', 'tsh',
    't3_measured', 't3', 'tt4_measured', 'tt4', 't4u_measured', 't4u',
    'fti_measured', 'fti', 'tbg_measured', 'referral_source'
]

NUMERIC_COLS = ['age', 'tsh', 't3', 'tt4', 't4u', 'fti']
CATEGORICAL_COLS = [c for c in EXPECTED_FEATURES if c not in NUMERIC_COLS]

_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        with open(MODEL_PATH, "rb") as f:
            _pipeline = pickle.load(f)
    return _pipeline


def predict_thyroid(input_dict: dict) -> dict:
    """
    Accepts clinical input dictionary, converts missing values to NaN,
    builds named pandas DataFrame with exact schema, and returns structured prediction.
    """
    pipeline = get_pipeline()

    # Build input row with named columns
    row = {}
    for col in EXPECTED_FEATURES:
        val = input_dict.get(col)
        if val is None or val == "" or str(val).strip().lower() in ["unknown", "none", "nan", "?"]:
            row[col] = np.nan
        else:
            if col in NUMERIC_COLS:
                try:
                    row[col] = float(val)
                except (ValueError, TypeError):
                    row[col] = np.nan
            else:
                # String representation for categorical
                if isinstance(val, (int, float)):
                    if col == 'sex':
                        row[col] = 'M' if val == 1 else 'F'
                    else:
                        row[col] = 't' if val == 1 else 'f'
                elif isinstance(val, str):
                    val_lower = val.strip().lower()
                    if col == 'sex':
                        row[col] = 'M' if val_lower in ['m', 'male', '1'] else ('F' if val_lower in ['f', 'female', '0'] else np.nan)
                    elif val_lower in ['yes', 'y', 't', 'true', '1']:
                        row[col] = 't'
                    elif val_lower in ['no', 'n', 'f', 'false', '0']:
                        row[col] = 'f'
                    else:
                        row[col] = val
                else:
                    row[col] = str(val)

    # Set measured flags dynamically if not explicitly provided
    for key in ['tsh', 't3', 'tt4', 't4u', 'fti']:
        flag_col = f"{key}_measured"
        if pd.isna(row.get(flag_col)):
            row[flag_col] = 't' if pd.notna(row.get(key)) else 'f'

    if pd.isna(row.get('referral_source')):
        row['referral_source'] = 'other'

    input_df = pd.DataFrame([row])[EXPECTED_FEATURES]

    # Predict
    pred_class = int(pipeline.predict(input_df)[0])
    probs = pipeline.predict_proba(input_df)[0]
    classes = [int(c) for c in pipeline.classes_]

    prob_map = {str(c): round(float(p), 4) for c, p in zip(classes, probs)}
    prob_disorder = prob_map.get("0", 0.0) # Class 0 = Thyroid Disorder Signal
    prob_normal = prob_map.get("1", 1.0)   # Class 1 = Normal Thyroid Function

    # Clinical interpretation mapping
    if pred_class == 0 or prob_disorder >= 0.5:
        prediction_label = "Elevated Thyroid Disorder Signal"
        primary_class = 0
    else:
        prediction_label = "Normal Thyroid Function Signal"
        primary_class = 1

    return {
        "prediction": prediction_label,
        "class": primary_class,
        "disorder_probability": prob_disorder,
        "normal_probability": prob_normal,
        "probabilities": prob_map,
        "model_version": "1.0",
        "features_evaluated": {k: row[k] for k in NUMERIC_COLS if pd.notna(row[k])},
        "disclaimer": "This is a machine-learning-based health analysis and is not a medical diagnosis."
    }


def run_test_cases():
    """Executes the 3 clinical test reports and missing-data tests."""
    print("[Inference Test] Running 3 clinical reports...")

    test_1_normal = {
        "age": 35,
        "sex": "F",
        "tsh": 1.8,
        "t3": 1.5,
        "tt4": 105.0,
        "t4u": 0.95,
        "fti": 110.0
    }

    test_2_moderate = {
        "age": 48,
        "sex": "F",
        "tsh": 6.8,
        "t3": 1.1,
        "tt4": 75.0,
        "t4u": 1.05,
        "fti": 71.0,
        "query_hypothyroid": "yes"
    }

    test_3_severe = {
        "age": 55,
        "sex": "F",
        "tsh": 35.0,
        "t3": 0.5,
        "tt4": 30.0,
        "t4u": 1.20,
        "fti": 25.0,
        "on_thyroxine": "no",
        "query_hypothyroid": "yes",
        "goitre": "yes"
    }

    res1 = predict_thyroid(test_1_normal)
    res2 = predict_thyroid(test_2_moderate)
    res3 = predict_thyroid(test_3_severe)

    print(f"Test 1 (Normal): Disorder Prob = {res1['disorder_probability']} -> {res1['prediction']}")
    print(f"Test 2 (Moderate): Disorder Prob = {res2['disorder_probability']} -> {res2['prediction']}")
    print(f"Test 3 (Severe): Disorder Prob = {res3['disorder_probability']} -> {res3['prediction']}")

    print("\n[Inference Test] Running progressive missing-data scenarios...")
    missing_1_age_sex = {"age": 42, "sex": "M"}
    missing_2_age_sex_tsh = {"age": 42, "sex": "M", "tsh": 1.4}
    missing_3_age_sex_tsh_t3_t4 = {"age": 42, "sex": "M", "tsh": 1.4, "t3": 1.6, "tt4": 112.0}

    res_m1 = predict_thyroid(missing_1_age_sex)
    res_m2 = predict_thyroid(missing_2_age_sex_tsh)
    res_m3 = predict_thyroid(missing_3_age_sex_tsh_t3_t4)

    print(f"Missing 1 (Age+Sex only): Disorder Prob = {res_m1['disorder_probability']}")
    print(f"Missing 2 (Age+Sex+TSH): Disorder Prob = {res_m2['disorder_probability']}")
    print(f"Missing 3 (Age+Sex+TSH+T3+T4): Disorder Prob = {res_m3['disorder_probability']}")

    test_cases_payload = {
        "clinical_reports": [
            {"case_id": "TEST_1_NORMAL", "inputs": test_1_normal, "output": res1},
            {"case_id": "TEST_2_MODERATE", "inputs": test_2_moderate, "output": res2},
            {"case_id": "TEST_3_SEVERE", "inputs": test_3_severe, "output": res3}
        ],
        "missing_data_scenarios": [
            {"case_id": "AGE_SEX_ONLY", "inputs": missing_1_age_sex, "output": res_m1},
            {"case_id": "AGE_SEX_TSH", "inputs": missing_2_age_sex_tsh, "output": res_m2},
            {"case_id": "AGE_SEX_TSH_T3_T4", "inputs": missing_3_age_sex_tsh_t3_t4, "output": res_m3},
            {"case_id": "FULL_REPORT", "inputs": test_1_normal, "output": res1}
        ]
    }

    test_cases_path = os.path.join(EVAL_DIR, "thyroid_test_cases.json")
    with open(test_cases_path, "w") as f:
        json.dump(test_cases_payload, f, indent=2)
    print(f"[Save] Saved test cases to {test_cases_path}")

if __name__ == "__main__":
    run_test_cases()
