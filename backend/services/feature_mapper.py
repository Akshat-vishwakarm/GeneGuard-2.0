"""
GeneGuard Feature Mapper & Unit Conversion Service
--------------------------------------------------
Validates UI inputs against required model features, converts units (ft/in -> cm, lbs -> kg),
and constructs ordered feature vectors for model consumption without fabricating missing values.
"""

import pandas as pd
import numpy as np
from .model_registry import MODEL_REGISTRY


def convert_height_to_cm(val_data: dict) -> float:
    """Converts height from cm or feet/inches to cm."""
    unit = str(val_data.get("height_unit", "cm")).strip().lower()
    if unit in ["ft", "feet", "ft_in"]:
        raw_ft = val_data.get("height_ft")
        raw_in = val_data.get("height_in", 0)
        raw_height = val_data.get("height")
        if raw_ft is not None and raw_ft != "":
            ft = float(raw_ft)
            inches = float(raw_in) if (raw_in is not None and raw_in != "") else 0.0
            return (ft * 30.48) + (inches * 2.54)
        elif raw_height is not None and raw_height != "":
            return float(raw_height) * 30.48
        else:
            raise ValueError("Height value is missing.")
    else:
        raw_height = val_data.get("height")
        if raw_height is None or raw_height == "":
            raise ValueError("Height value is missing.")
        return float(raw_height)


def convert_weight_to_kg(val_data: dict) -> float:
    """Converts weight from kg or lbs to kg."""
    unit = str(val_data.get("weight_unit", "kg")).strip().lower()
    raw_weight = val_data.get("weight")
    if raw_weight is None or raw_weight == "":
        raise ValueError("Weight value is missing.")
    val = float(raw_weight)
    if unit == "lbs":
        return val * 0.45359237
    return val


def validate_and_map_features(disease_module: str, input_dict: dict) -> tuple[pd.DataFrame, list[str]]:
    """
    Validates required features for the specified disease module.
    Returns (DataFrame with single feature row matching model schema, list of missing fields).
    """
    if disease_module not in MODEL_REGISTRY:
        raise ValueError(f"Unknown disease module: {disease_module}")

    config = MODEL_REGISTRY[disease_module]
    ui_features = config["ui_features"]
    missing_fields = []

    # Check required UI features
    for f in ui_features:
        if f.get("required", True):
            key = f["key"]
            val = input_dict.get(key)
            if val is None or val == "":
                # Check for unit variations like height_ft / height_in
                if key == "height" and (input_dict.get("height_ft") or input_dict.get("height")):
                    continue
                missing_fields.append(f["label"])

    if missing_fields:
        return None, missing_fields

    # Process module-specific feature vectors
    feature_dict = {}

    if disease_module == "cardiovascular":
        age_years = float(input_dict["age"])
        gender = 1 if str(input_dict["gender"]).lower() in ["female", "1", "f"] else 2
        height_cm = convert_height_to_cm(input_dict)
        weight_kg = convert_weight_to_kg(input_dict)
        ap_hi = float(input_dict["ap_hi"])
        ap_lo = float(input_dict["ap_lo"])

        if ap_hi <= ap_lo:
            raise ValueError("Systolic blood pressure must be higher than Diastolic blood pressure.")

        chol_map = {"normal": 1, "above_normal": 2, "high": 3, "1": 1, "2": 2, "3": 3, 1: 1, 2: 2, 3: 3}
        gluc_map = {"normal": 1, "above_normal": 2, "high": 3, "1": 1, "2": 2, "3": 3, 1: 1, 2: 2, 3: 3}
        bin_map = {"no": 0, "yes": 1, "0": 0, "1": 1, 0: 0, 1: 1}

        cholesterol = chol_map.get(str(input_dict["cholesterol"]).lower(), 1)
        gluc = gluc_map.get(str(input_dict["gluc"]).lower(), 1)
        smoke = bin_map.get(str(input_dict["smoke"]).lower(), 0)
        alco = bin_map.get(str(input_dict["alco"]).lower(), 0)
        active = bin_map.get(str(input_dict["active"]).lower(), 1)

        bmi = weight_kg / ((height_cm / 100.0) ** 2)
        pulse_pressure = ap_hi - ap_lo
        bp_ratio = ap_hi / ap_lo

        feature_dict = {
            "age_years": age_years,
            "gender": gender,
            "height": height_cm,
            "weight": weight_kg,
            "ap_hi": ap_hi,
            "ap_lo": ap_lo,
            "cholesterol": cholesterol,
            "gluc": gluc,
            "smoke": smoke,
            "alco": alco,
            "active": active,
            "bmi": bmi,
            "pulse_pressure": pulse_pressure,
            "bp_ratio": bp_ratio
        }

    elif disease_module == "metabolic":
        height_cm = float(input_dict["height"])
        weight_kg = float(input_dict["weight"])
        bmi_pre = weight_kg / ((height_cm / 100.0) ** 2)

        fasting_glucose = float(input_dict["fasting_glucose"])
        fasting_insulin = float(input_dict["fasting_insulin"])
        homa_ir = (fasting_glucose * fasting_insulin) / 405.0

        feature_dict = {
            "Age (years)": float(input_dict["age"]),
            "Height (cm)": height_cm,
            "Waist Circumference Pre (cm)": float(input_dict["waist"]),
            "BMI Pre": bmi_pre,
            "Body Fat Pre (kg)": float(input_dict["body_fat"]),
            "Skeletal Muscle Pre (kg)": float(input_dict["skeletal_muscle"]),
            "Total Cholesterol Pre (mg/dL)": float(input_dict["total_cholesterol"]),
            "Triglycerides Pre (mg/dL)": float(input_dict["triglycerides"]),
            "LDL Pre (mg/dL)": float(input_dict["ldl"]),
            "HDL Pre (mg/dL)": float(input_dict["hdl"]),
            "Systolic BP Pre (mmHg)": float(input_dict["sys_bp"]),
            "Diastolic BP Pre (mmHg)": float(input_dict["dia_bp"]),
            "Fasting Glucose Pre (mg/dL)": fasting_glucose,
            "Fasting Insulin Pre (uIU/mL)": fasting_insulin,
            "HOMA-IR Pre": homa_ir
        }
        # Use config's exact features_order list
        df = pd.DataFrame([feature_dict])
        df.columns = config["features_order"]
        return df, []

    elif disease_module == "blood_pressure":
        feature_dict = {
            "Level_of_Hemoglobin": float(input_dict["hemoglobin"]),
            "Genetic_Pedigree_Coefficient": float(input_dict["genetic_coefficient"]),
            "Age": float(input_dict["age"]),
            "BMI": float(input_dict["bmi"]),
            "Sex": int(input_dict["sex"]),
            "Pregnancy": int(input_dict["pregnancy"]),
            "Smoking": int(input_dict["smoking"]),
            "Physical_activity": float(input_dict["physical_activity"]),
            "salt_content_in_the_diet": float(input_dict["salt_intake"]),
            "alcohol_consumption_per_day": float(input_dict["alcohol_consumption"]),
            "Level_of_Stress": int(input_dict["stress_level"]),
            "Chronic_kidney_disease": int(input_dict["chronic_kidney_disease"]),
            "Adrenal_and_thyroid_disorders": int(input_dict["adrenal_thyroid_disorders"])
        }

    elif disease_module == "thyroid":
        def clean_val(v):
            if v is None or v == "" or str(v).strip().lower() in ["unknown", "none", "nan", "?"]:
                return np.nan
            try:
                return float(v)
            except (ValueError, TypeError):
                return np.nan

        age = clean_val(input_dict.get("age"))
        tsh = clean_val(input_dict.get("tsh"))
        t3 = clean_val(input_dict.get("t3"))
        tt4 = clean_val(input_dict.get("tt4"))
        t4u = clean_val(input_dict.get("t4u"))
        fti = clean_val(input_dict.get("fti"))
        if pd.isna(fti) and pd.notna(tt4) and pd.notna(t4u) and t4u > 0:
            fti = tt4 / t4u * 10.0

        raw_sex = input_dict.get("sex", "F")
        sex = "M" if str(raw_sex).strip().lower() in ["m", "male", "1"] else "F"

        def to_tf(val):
            if val is None or val == "" or str(val).strip().lower() in ["unknown", "none", "nan", "?"]:
                return np.nan
            return "t" if str(val).strip().lower() in ["yes", "y", "t", "true", "1"] else "f"

        feature_dict = {
            "age": age,
            "sex": sex,
            "on_thyroxine": to_tf(input_dict.get("on_thyroxine")),
            "query_on_thyroxine": to_tf(input_dict.get("query_on_thyroxine")),
            "on_antithyroid_medication": to_tf(input_dict.get("on_antithyroid") or input_dict.get("on_antithyroid_medication")),
            "sick": to_tf(input_dict.get("sick")),
            "pregnant": to_tf(input_dict.get("pregnant")),
            "thyroid_surgery": to_tf(input_dict.get("thyroid_surgery")),
            "i131_treatment": to_tf(input_dict.get("i131_treatment")),
            "query_hypothyroid": to_tf(input_dict.get("query_hypothyroid")),
            "query_hyperthyroid": to_tf(input_dict.get("query_hyperthyroid")),
            "lithium": to_tf(input_dict.get("lithium")),
            "goitre": to_tf(input_dict.get("goitre")),
            "tumor": to_tf(input_dict.get("tumor")),
            "hypopituitary": to_tf(input_dict.get("hypopituitary")),
            "psych": to_tf(input_dict.get("psych")),
            "tsh_measured": "t" if pd.notna(tsh) else "f",
            "tsh": tsh,
            "t3_measured": "t" if pd.notna(t3) else "f",
            "t3": t3,
            "tt4_measured": "t" if pd.notna(tt4) else "f",
            "tt4": tt4,
            "t4u_measured": "t" if pd.notna(t4u) else "f",
            "t4u": t4u,
            "fti_measured": "t" if pd.notna(fti) else "f",
            "fti": fti,
            "tbg_measured": "f",
            "referral_source": input_dict.get("referral_source") or "other"
        }

    elif disease_module == "cancer":
        feature_dict = {
            "Age": float(input_dict["age"]),
            "Gender": int(input_dict["gender"]),
            "AirPollution": float(input_dict["air_pollution"]),
            "Alcoholuse": float(input_dict["alcohol_use"]),
            "DustAllergy": float(input_dict["dust_allergy"]),
            "OccuPationalHazards": float(input_dict["occupational_hazards"]),
            "GeneticRisk": float(input_dict["genetic_risk"]),
            "chronicLungDisease": float(input_dict["chronic_lung_disease"]),
            "BalancedDiet": float(input_dict["balanced_diet"]),
            "Obesity": float(input_dict["obesity"]),
            "Smoking": float(input_dict["smoking"]),
            "PassiveSmoker": float(input_dict["passive_smoker"]),
            "ChestPain": float(input_dict["chest_pain"]),
            "CoughingofBlood": float(input_dict["coughing_of_blood"]),
            "Fatigue": float(input_dict["fatigue"]),
            "WeightLoss": float(input_dict["weight_loss"]),
            "ShortnessofBreath": float(input_dict["shortness_of_breath"]),
            "Wheezing": float(input_dict["wheezing"]),
            "SwallowingDifficulty": float(input_dict["swallowing_difficulty"]),
            "ClubbingofFingerNails": float(input_dict["clubbing_finger_nails"]),
            "FrequentCold": float(input_dict["frequent_cold"]),
            "DryCough": float(input_dict["dry_cough"]),
            "Snoring": float(input_dict["snoring"])
        }

    # Construct DataFrame with exact column order
    expected_order = config["features_order"]
    df = pd.DataFrame([feature_dict])[expected_order]
    return df, []
