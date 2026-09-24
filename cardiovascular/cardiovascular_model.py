"""
GeneGuard ML Prediction Service with Unit Conversion & Evaluation Analyses
----------------------------------------------------------------------------
Loads the pre-trained cardiovascular model, decision threshold, and feature schema once upon initialization.
Handles unit conversions (cm/feet/inches -> cm, kg/lbs -> kg), feature engineering, categorical mapping, 
model prediction, and SHAP evaluation analyses.
"""

import os
import joblib
import pandas as pd
import numpy as np
import shap

# Load pre-trained artifacts once during module startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "cardiovascular_model.pkl")
THRESHOLD_PATH = os.path.join(BASE_DIR, "cardiovascular_threshold.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "cardiovascular_features.pkl")

print("[GeneGuard] Loading trained model artifacts...")
try:
    model = joblib.load(MODEL_PATH)
    threshold = float(joblib.load(THRESHOLD_PATH))
    expected_features = joblib.load(FEATURES_PATH)
    
    # Initialize fitted preprocessor, classifier, and SHAP TreeExplainer
    preprocessor = model.named_steps["preprocessor"]
    rf_classifier = model.named_steps["classifier"]
    feature_names = preprocessor.get_feature_names_out()
    explainer = shap.TreeExplainer(rf_classifier)

    print(f"[GeneGuard] Model loaded successfully. Threshold: {threshold}")
    print(f"[GeneGuard] Expected feature order: {expected_features}")
except Exception as e:
    raise RuntimeError(f"Failed to load GeneGuard model files: {e}")

# Human-readable feature mapping
READABLE_FEATURE_NAMES = {
    "num__age_years": "Age",
    "num__height": "Height",
    "num__weight": "Weight",
    "num__ap_hi": "Systolic Blood Pressure",
    "num__ap_lo": "Diastolic Blood Pressure",
    "num__bmi": "BMI",
    "num__pulse_pressure": "Pulse Pressure",
    "num__bp_ratio": "Blood Pressure Ratio",
    "cat__gender_1": "Gender: Female",
    "cat__gender_2": "Gender: Male",
    "cat__cholesterol_1": "Cholesterol: Normal",
    "cat__cholesterol_2": "Cholesterol: Above Normal",
    "cat__cholesterol_3": "Cholesterol: High",
    "cat__gluc_1": "Glucose: Normal",
    "cat__gluc_2": "Glucose: Above Normal",
    "cat__gluc_3": "Glucose: High",
    "cat__smoke_0": "Non-Smoker",
    "cat__smoke_1": "Smoker",
    "cat__alco_0": "No Alcohol Intake",
    "cat__alco_1": "Alcohol Intake",
    "cat__active_0": "Inactive Lifestyle",
    "cat__active_1": "Physically Active"
}

# Categorical Encodings matching training dataset
GENDER_MAP = {"female": 1, "male": 2, "1": 1, "2": 2, 1: 1, 2: 2}
LEVEL_MAP = {"normal": 1, "above_normal": 2, "high": 3, "1": 1, "2": 2, "3": 3, 1: 1, 2: 2, 3: 3}
BINARY_MAP = {"no": 0, "yes": 1, "0": 0, "1": 1, 0: 0, 1: 1, "inactive": 0, "active": 1}


def validate_and_preprocess_input(input_data: dict) -> tuple[pd.DataFrame, dict]:
    """
    Validates input fields, converts unit options (feet/inches -> cm, lbs -> kg),
    performs feature engineering, and formats a single-row DataFrame matching model schema.
    """
    errors = []

    # 1. Age
    raw_age = input_data.get("age")
    if raw_age is None or raw_age == "":
        errors.append("Please enter your age.")
    else:
        try:
            age_years = float(raw_age)
            if age_years < 1 or age_years > 120:
                errors.append("Please enter a valid age between 1 and 120 years.")
        except (ValueError, TypeError):
            errors.append("Please enter a valid numeric age.")

    # 2. Gender
    raw_gender = str(input_data.get("gender", "")).strip().lower()
    if not raw_gender or raw_gender not in GENDER_MAP:
        errors.append("Please select a valid gender (Male or Female).")
    else:
        gender_code = GENDER_MAP[raw_gender]

    # 3. Height with Unit Conversion (cm or ft/in)
    height_unit = str(input_data.get("height_unit", "cm")).strip().lower()
    height_cm = None

    if height_unit in ["ft", "feet", "ft_in"]:
        raw_ft = input_data.get("height_ft")
        raw_in = input_data.get("height_in", 0)
        raw_single_height = input_data.get("height")

        if (raw_ft is not None and raw_ft != ""):
            try:
                feet = float(raw_ft)
                inches = float(raw_in) if (raw_in is not None and raw_in != "") else 0.0
                if feet < 1 or feet > 8 or inches < 0 or inches >= 12:
                    errors.append("Please enter a valid height in feet (1-8) and inches (0-11).")
                else:
                    height_cm = (feet * 30.48) + (inches * 2.54)
            except (ValueError, TypeError):
                errors.append("Please enter valid numeric values for feet and inches.")
        elif raw_single_height is not None and raw_single_height != "":
            try:
                feet = float(raw_single_height)
                if feet < 1 or feet > 8:
                    errors.append("Please enter a valid height in feet between 1 and 8 ft.")
                else:
                    height_cm = feet * 30.48
            except (ValueError, TypeError):
                errors.append("Please enter a valid numeric height in feet.")
        else:
            errors.append("Please enter your height.")
    else:
        # Default unit: cm
        raw_height = input_data.get("height")
        if raw_height is None or raw_height == "":
            errors.append("Please enter your height in cm.")
        else:
            try:
                height_cm = float(raw_height)
                if height_cm < 50 or height_cm > 250:
                    errors.append("Please enter a valid height between 50 cm and 250 cm.")
            except (ValueError, TypeError):
                errors.append("Please enter a valid numeric height.")

    # 4. Weight with Unit Conversion (kg or lbs)
    weight_unit = str(input_data.get("weight_unit", "kg")).strip().lower()
    weight_kg = None
    raw_weight = input_data.get("weight")

    if raw_weight is None or raw_weight == "":
        errors.append("Please enter your weight.")
    else:
        try:
            val_weight = float(raw_weight)
            if weight_unit == "lbs":
                if val_weight < 40 or val_weight > 700:
                    errors.append("Please enter a valid weight between 40 lbs and 700 lbs.")
                else:
                    weight_kg = val_weight * 0.45359237
            else:
                # Default unit: kg
                if val_weight < 20 or val_weight > 350:
                    errors.append("Please enter a valid weight between 20 kg and 350 kg.")
                else:
                    weight_kg = val_weight
        except (ValueError, TypeError):
            errors.append("Please enter a valid numeric weight.")

    # 5. Blood Pressure
    raw_ap_hi = input_data.get("ap_hi")
    raw_ap_lo = input_data.get("ap_lo")

    if raw_ap_hi is None or raw_ap_hi == "":
        errors.append("Please enter your Systolic blood pressure.")
    else:
        try:
            ap_hi = float(raw_ap_hi)
            if ap_hi < 60 or ap_hi > 250:
                errors.append("Please enter a realistic Systolic blood pressure (60-250 mmHg).")
        except (ValueError, TypeError):
            errors.append("Please enter a valid numeric Systolic blood pressure.")

    if raw_ap_lo is None or raw_ap_lo == "":
        errors.append("Please enter your Diastolic blood pressure.")
    else:
        try:
            ap_lo = float(raw_ap_lo)
            if ap_lo < 30 or ap_lo > 180:
                errors.append("Please enter a realistic Diastolic blood pressure (30-180 mmHg).")
        except (ValueError, TypeError):
            errors.append("Please enter a valid numeric Diastolic blood pressure.")

    if 'ap_hi' in locals() and 'ap_lo' in locals() and ap_hi <= ap_lo:
        errors.append("Systolic blood pressure must be higher than Diastolic blood pressure.")

    if errors:
        raise ValueError("; ".join(errors))

    # Parse categorical inputs
    raw_chol = str(input_data.get("cholesterol", "normal")).strip().lower()
    cholesterol = LEVEL_MAP.get(raw_chol, 1)

    raw_gluc = str(input_data.get("gluc", "normal")).strip().lower()
    gluc = LEVEL_MAP.get(raw_gluc, 1)

    raw_smoke = str(input_data.get("smoke", "no")).strip().lower()
    smoke = BINARY_MAP.get(raw_smoke, 0)

    raw_alco = str(input_data.get("alco", "no")).strip().lower()
    alco = BINARY_MAP.get(raw_alco, 0)

    raw_active = str(input_data.get("active", "yes")).strip().lower()
    active = BINARY_MAP.get(raw_active, 1)

    # Engineered Features in standard SI units required by ML model (cm & kg)
    bmi = weight_kg / ((height_cm / 100.0) ** 2)
    pulse_pressure = ap_hi - ap_lo
    bp_ratio = ap_hi / ap_lo

    processed_dict = {
        'age_years': age_years,
        'gender': gender_code,
        'height': height_cm,
        'weight': weight_kg,
        'ap_hi': ap_hi,
        'ap_lo': ap_lo,
        'cholesterol': cholesterol,
        'gluc': gluc,
        'smoke': smoke,
        'alco': alco,
        'active': active,
        'bmi': bmi,
        'pulse_pressure': pulse_pressure,
        'bp_ratio': bp_ratio
    }

    patient_df = pd.DataFrame([processed_dict])[expected_features]
    return patient_df, processed_dict


def predict_cardiovascular_risk(patient_data: dict) -> dict:
    """
    Takes patient health dictionary with unit choices, validates & converts units,
    runs model prediction and SHAP evaluation analyses.
    """
    patient_df, raw_processed = validate_and_preprocess_input(patient_data)

    # Model prediction
    probabilities = model.predict_proba(patient_df)[0]
    risk_probability = float(probabilities[1])  # Class 1 probability
    prediction_class = int(risk_probability >= threshold)

    # Risk level classification
    if risk_probability < 0.35:
        risk_label = "Lower Predicted Risk"
        risk_category = "low"
        risk_description = "Your submitted health metrics suggest a lower probability of cardiovascular risk compared to population reference standards."
    elif risk_probability < 0.60:
        risk_label = "Moderate Predicted Risk"
        risk_category = "moderate"
        risk_description = "Your submitted health metrics indicate a moderate cardiovascular risk profile. Lifestyle management and regular check-ups are advised."
    else:
        risk_label = "Elevated Predicted Risk"
        risk_category = "high"
        risk_description = "Your health parameters indicate an elevated predicted cardiovascular risk profile. We recommend consulting a healthcare professional for clinical evaluation."

    # SHAP Evaluation Analysis
    patient_transformed = preprocessor.transform(patient_df)
    patient_shap = explainer.shap_values(patient_transformed)

    if isinstance(patient_shap, list):
        patient_shap_cvd = patient_shap[1][0]
    elif len(patient_shap.shape) == 3:
        patient_shap_cvd = patient_shap[0, :, 1]
    else:
        patient_shap_cvd = patient_shap[0]

    explanation_df = pd.DataFrame({
        "feature": feature_names,
        "shap_value": patient_shap_cvd
    })
    explanation_df["absolute_shap"] = explanation_df["shap_value"].abs()
    explanation_df["readable_feature"] = explanation_df["feature"].map(
        lambda f: READABLE_FEATURE_NAMES.get(f, f)
    )
    explanation_df = explanation_df.sort_values("absolute_shap", ascending=False).head(6)

    explanation_list = []
    for _, row in explanation_df.iterrows():
        explanation_list.append({
            "feature": row["readable_feature"],
            "shap_value": round(float(row["shap_value"]), 4),
            "direction": "increases_risk" if row["shap_value"] > 0 else "decreases_risk",
            "impact_label": "Increases Risk" if row["shap_value"] > 0 else "Lowers Risk"
        })

    # Format human readable output with converted metric values
    height_cm = raw_processed['height']
    total_inches = height_cm / 2.54
    feet = int(total_inches // 12)
    rem_inches = round(total_inches % 12, 1)
    if rem_inches == int(rem_inches):
        rem_inches_str = str(int(rem_inches))
    else:
        rem_inches_str = str(rem_inches)

    weight_kg = raw_processed['weight']
    weight_lbs = round(weight_kg / 0.45359237, 1)

    formatted_user_data = {
        "age": round(raw_processed['age_years']),
        "gender": "Female" if raw_processed['gender'] == 1 else "Male",
        "height_cm": round(height_cm, 1),
        "height_ft_in": f"{feet} ft {rem_inches_str} in" if feet > 0 else f"{rem_inches_str} in",
        "weight_kg": round(weight_kg, 1),
        "weight_lbs": weight_lbs,
        "bmi": round(raw_processed['bmi'], 1),
        "ap_hi": round(raw_processed['ap_hi']),
        "ap_lo": round(raw_processed['ap_lo']),
        "cholesterol": {1: "Normal", 2: "Above Normal", 3: "High"}[raw_processed['cholesterol']],
        "gluc": {1: "Normal", 2: "Above Normal", 3: "High"}[raw_processed['gluc']],
        "smoke": "Yes" if raw_processed['smoke'] == 1 else "No",
        "alco": "Yes" if raw_processed['alco'] == 1 else "No",
        "active": "Active" if raw_processed['active'] == 1 else "Inactive",
        "pulse_pressure": round(raw_processed['pulse_pressure'], 1),
        "bp_ratio": round(raw_processed['bp_ratio'], 2)
    }

    return {
        "status": "success",
        "prediction": prediction_class,
        "risk_probability": round(risk_probability, 4),
        "risk_percentage": round(risk_probability * 100, 1),
        "threshold": round(threshold, 4),
        "risk_label": risk_label,
        "risk_category": risk_category,
        "risk_description": risk_description,
        "model_accuracy": "73%",
        "explanation": explanation_list,
        "patient_data": formatted_user_data
    }
