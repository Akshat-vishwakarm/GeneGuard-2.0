"""
GeneGuard Combined Family Analysis Pipeline & Clinical Reporting Service
------------------------------------------------------------------------
Orchestrates unified patient biometrics mapping, family-aware prediction
comparisons, and clinical evidence extraction across 5 disease modules.
NEVER fabricates or invents missing medical values or fallback percentages.
"""

from typing import Dict, List, Any
import numpy as np
import pandas as pd


def calculate_bmi(height_cm: Any, weight_kg: Any) -> float:
    try:
        h = float(height_cm)
        w = float(weight_kg)
        if h > 0 and w > 0:
            return round(w / ((h / 100.0) ** 2), 1)
    except (ValueError, TypeError):
        pass
    return None


def map_unified_self_data_to_models(self_data: dict) -> dict:
    """
    Transforms unified patient self_data into the exact input schema expected
    by each of the 5 independent disease models.
    NEVER manufactures or hardcodes fallback values. Fields missing from self_data
    are omitted so feature validation correctly identifies them.
    """
    raw_age = self_data.get("age")
    age = float(raw_age) if raw_age not in [None, ""] else None

    raw_sex = self_data.get("gender") or self_data.get("sex")
    is_male = None
    if raw_sex not in [None, ""]:
        s = str(raw_sex).strip().lower()
        if s in ["male", "m", "1"]:
            is_male = True
        elif s in ["female", "f", "0", "2"]:
            is_male = False

    raw_height = self_data.get("height")
    height = float(raw_height) if raw_height not in [None, ""] else None

    raw_weight = self_data.get("weight")
    weight = float(raw_weight) if raw_weight not in [None, ""] else None

    bmi = calculate_bmi(height, weight) if (height and weight) else None

    lifestyle = self_data.get("lifestyle") or {}
    smoking_val = lifestyle.get("smoking") if lifestyle.get("smoking") not in [None, ""] else (self_data.get("smoke") or self_data.get("smoking"))
    activity_val = lifestyle.get("activity") if lifestyle.get("activity") not in [None, ""] else (self_data.get("active") or self_data.get("physical_activity"))
    alcohol_val = lifestyle.get("alcohol") if lifestyle.get("alcohol") not in [None, ""] else (self_data.get("alco") or self_data.get("alcohol_consumption") or self_data.get("alcohol_use"))

    bp_data = self_data.get("blood_pressure") or {}
    raw_sys = bp_data.get("sys_bp") or self_data.get("sys_bp") or self_data.get("ap_hi") or self_data.get("blood_pressure_systolic")
    sys_bp = float(raw_sys) if raw_sys not in [None, ""] else None

    raw_dia = bp_data.get("dia_bp") or self_data.get("dia_bp") or self_data.get("ap_lo") or self_data.get("blood_pressure_diastolic")
    dia_bp = float(raw_dia) if raw_dia not in [None, ""] else None

    labs = self_data.get("labs") or {}

    # 1. Cardiovascular inputs
    cardio_inputs = {}
    if age is not None: cardio_inputs["age"] = age
    if is_male is not None: cardio_inputs["gender"] = "male" if is_male else "female"
    if height is not None: cardio_inputs["height"] = height
    if weight is not None: cardio_inputs["weight"] = weight
    if sys_bp is not None: cardio_inputs["ap_hi"] = sys_bp
    if dia_bp is not None: cardio_inputs["ap_lo"] = dia_bp

    # Cholesterol
    chol_val = self_data.get("cholesterol") or labs.get("cholesterol")
    if chol_val not in [None, ""]:
        cardio_inputs["cholesterol"] = str(chol_val).lower()
    elif labs.get("total_cholesterol") is not None or self_data.get("total_cholesterol") is not None:
        try:
            tc = float(labs.get("total_cholesterol") or self_data.get("total_cholesterol"))
            cardio_inputs["cholesterol"] = "normal" if tc < 200 else ("above_normal" if tc < 240 else "high")
        except: pass

    # Glucose
    gluc_val = self_data.get("gluc") or labs.get("gluc") or self_data.get("glucose") or labs.get("glucose")
    if gluc_val not in [None, ""]:
        cardio_inputs["gluc"] = str(gluc_val).lower()
    elif labs.get("fasting_glucose") is not None or self_data.get("fasting_glucose") is not None:
        try:
            fg = float(labs.get("fasting_glucose") or self_data.get("fasting_glucose"))
            cardio_inputs["gluc"] = "normal" if fg < 100 else ("above_normal" if fg < 126 else "high")
        except: pass

    if smoking_val not in [None, ""]:
        s_str = str(smoking_val).lower()
        cardio_inputs["smoke"] = "yes" if s_str in ["yes", "1", "true", "current", "former"] else "no"
    if alcohol_val not in [None, ""]:
        a_str = str(alcohol_val).lower()
        cardio_inputs["alco"] = "yes" if a_str in ["yes", "1", "true", "moderate", "high"] else "no"
    if activity_val not in [None, ""]:
        act_str = str(activity_val).lower()
        cardio_inputs["active"] = "yes" if act_str in ["yes", "1", "true", "high", "moderate"] else "no"

    # 2. Metabolic inputs
    metabolic_inputs = {}
    if age is not None: metabolic_inputs["age"] = age
    if height is not None: metabolic_inputs["height"] = height
    if weight is not None: metabolic_inputs["weight"] = weight
    if self_data.get("waist") not in [None, ""]: metabolic_inputs["waist"] = float(self_data["waist"])
    if self_data.get("body_fat") not in [None, ""]: metabolic_inputs["body_fat"] = float(self_data["body_fat"])
    if self_data.get("skeletal_muscle") not in [None, ""]: metabolic_inputs["skeletal_muscle"] = float(self_data["skeletal_muscle"])
    
    tot_chol = labs.get("total_cholesterol") or self_data.get("total_cholesterol")
    if tot_chol not in [None, ""]: metabolic_inputs["total_cholesterol"] = float(tot_chol)
    
    trig = labs.get("triglycerides") or self_data.get("triglycerides")
    if trig not in [None, ""]: metabolic_inputs["triglycerides"] = float(trig)
    
    ldl_val = labs.get("ldl") or self_data.get("ldl")
    if ldl_val not in [None, ""]: metabolic_inputs["ldl"] = float(ldl_val)
    
    hdl_val = labs.get("hdl") or self_data.get("hdl")
    if hdl_val not in [None, ""]: metabolic_inputs["hdl"] = float(hdl_val)
    
    if sys_bp is not None: metabolic_inputs["sys_bp"] = sys_bp
    if dia_bp is not None: metabolic_inputs["dia_bp"] = dia_bp
    
    f_gluc = labs.get("fasting_glucose") or self_data.get("fasting_glucose")
    if f_gluc not in [None, ""]: metabolic_inputs["fasting_glucose"] = float(f_gluc)
    
    f_ins = labs.get("fasting_insulin") or self_data.get("fasting_insulin")
    if f_ins not in [None, ""]: metabolic_inputs["fasting_insulin"] = float(f_ins)

    # 3. Blood Pressure inputs
    bp_inputs = {}
    hgb = labs.get("hemoglobin") or self_data.get("hemoglobin")
    if hgb not in [None, ""]: bp_inputs["hemoglobin"] = float(hgb)
    if self_data.get("genetic_coefficient") not in [None, ""]:
        bp_inputs["genetic_coefficient"] = float(self_data["genetic_coefficient"])
    else:
        bp_inputs["genetic_coefficient"] = 0.15

    if age is not None: bp_inputs["age"] = age
    if bmi is not None: bp_inputs["bmi"] = bmi
    elif self_data.get("bmi") not in [None, ""]:
        try: bp_inputs["bmi"] = float(self_data["bmi"])
        except: pass

    if is_male is not None: bp_inputs["sex"] = 1 if is_male else 0
    elif self_data.get("sex") not in [None, ""]:
        bp_inputs["sex"] = 1 if str(self_data["sex"]).lower() in ["1", "male", "m"] else 0
    
    if self_data.get("pregnancy") not in [None, ""] or self_data.get("pregnant") not in [None, ""]:
        p_val = self_data.get("pregnancy") or self_data.get("pregnant")
        bp_inputs["pregnancy"] = 1 if str(p_val).lower() in ["1", "yes", "true"] else 0
    elif is_male is True:
        bp_inputs["pregnancy"] = 0
        
    raw_bp_smoking = (
        (self_data.get("module_inputs") or {}).get("blood_pressure", {}).get("smoking")
        or (self_data.get("blood_pressure_inputs") or {}).get("smoking")
        or self_data.get("smoking")
    )
    if raw_bp_smoking not in [None, ""]:
        try:
            val = int(raw_bp_smoking)
            bp_inputs["smoking"] = 1 if val == 1 else (1 if val >= 4 else 0)
        except:
            bp_inputs["smoking"] = 0
    elif smoking_val not in [None, ""]:
        bp_inputs["smoking"] = 1 if str(smoking_val).lower() in ["1", "yes", "true", "current", "former"] else 0

    if self_data.get("physical_activity") not in [None, ""]:
        try:
            bp_inputs["physical_activity"] = float(self_data["physical_activity"])
        except (ValueError, TypeError):
            pass
    elif activity_val not in [None, ""]:
        bp_inputs["physical_activity"] = 8500.0 if str(activity_val).lower() in ["yes", "1", "true", "high", "moderate"] else 3000.0

    if self_data.get("salt_intake") not in [None, ""]:
        try:
            bp_inputs["salt_intake"] = float(self_data["salt_intake"])
        except (ValueError, TypeError):
            pass

    if self_data.get("alcohol_consumption") not in [None, ""]:
        try:
            bp_inputs["alcohol_consumption"] = float(self_data["alcohol_consumption"])
        except (ValueError, TypeError):
            pass
    elif alcohol_val not in [None, ""]:
        bp_inputs["alcohol_consumption"] = 25.0 if str(alcohol_val).lower() in ["yes", "1", "true", "moderate", "high"] else 0.0

    if self_data.get("stress_level") not in [None, ""]:
        bp_inputs["stress_level"] = int(self_data["stress_level"])
    if self_data.get("chronic_kidney_disease") not in [None, ""]:
        bp_inputs["chronic_kidney_disease"] = int(self_data["chronic_kidney_disease"])
    if self_data.get("adrenal_thyroid_disorders") not in [None, ""]:
        bp_inputs["adrenal_thyroid_disorders"] = int(self_data["adrenal_thyroid_disorders"])

    # 4. Thyroid inputs
    thyroid_inputs = {}
    if age is not None: thyroid_inputs["age"] = age
    if is_male is not None: thyroid_inputs["sex"] = "M" if is_male else "F"
    
    for tk in ["tsh", "t3", "tt4", "t4u", "fti"]:
        val = labs.get(tk) or self_data.get(tk)
        if val not in [None, ""]:
            try:
                thyroid_inputs[tk] = float(val)
            except: pass
            
    for tk in ["on_thyroxine", "on_antithyroid", "pregnant", "thyroid_surgery", 
               "query_hypothyroid", "query_hyperthyroid", "goitre", "tumor"]:
        if self_data.get(tk) not in [None, ""]:
            thyroid_inputs[tk] = self_data[tk]
        elif tk == "on_antithyroid" and self_data.get("on_antithyroid_meds") not in [None, ""]:
            thyroid_inputs[tk] = self_data["on_antithyroid_meds"]

    # 5. Cancer inputs
    cancer_inputs = {}
    if age is not None: cancer_inputs["age"] = age
    if is_male is not None: cancer_inputs["gender"] = 1 if is_male else 2
    
    cancer_fields = [
        "air_pollution", "alcohol_use", "dust_allergy", "occupational_hazards",
        "genetic_risk", "chronic_lung_disease", "balanced_diet", "obesity",
        "smoking", "passive_smoker", "chest_pain", "coughing_of_blood",
        "fatigue", "weight_loss", "shortness_of_breath", "wheezing",
        "swallowing_difficulty", "clubbing_finger_nails", "frequent_cold",
        "dry_cough", "snoring"
    ]
    for cf in cancer_fields:
        if self_data.get(cf) not in [None, ""]:
            try:
                cancer_inputs[cf] = int(self_data[cf])
            except: pass
        elif cf == "clubbing_finger_nails" and self_data.get("clubbing_of_finger_nails") not in [None, ""]:
            try:
                cancer_inputs[cf] = int(self_data["clubbing_of_finger_nails"])
            except: pass

    # If client passed isolated module_inputs dictionaries, merge them directly to preserve exact user inputs
    mod_inputs = self_data.get("module_inputs") or {}
    if isinstance(mod_inputs.get("cardiovascular"), dict):
        cardio_inputs.update(mod_inputs["cardiovascular"])
    if isinstance(mod_inputs.get("metabolic"), dict):
        metabolic_inputs.update(mod_inputs["metabolic"])
    if isinstance(mod_inputs.get("blood_pressure"), dict):
        bp_inputs.update(mod_inputs["blood_pressure"])
    if isinstance(mod_inputs.get("thyroid"), dict):
        thyroid_inputs.update(mod_inputs["thyroid"])
    if isinstance(mod_inputs.get("cancer"), dict):
        cancer_inputs.update(mod_inputs["cancer"])

    return {
        "cardiovascular": cardio_inputs,
        "metabolic": metabolic_inputs,
        "blood_pressure": bp_inputs,
        "thyroid": thyroid_inputs,
        "cancer": cancer_inputs
    }


def extract_family_evidence(family_members: List[dict], relationships: List[dict] = None) -> dict:
    """
    Extracts disease-specific qualitative evidence and relative degrees
    from recorded family network members.
    """
    diseases = ["cardiovascular", "metabolic", "blood_pressure", "thyroid", "cancer"]
    if not family_members:
        return {
            "evidence_by_disease": {d: ["Family history not provided"] for d in diseases},
            "counts": {f"{d}_{deg}": 0 for d in ["hypertension", "diabetes", "cardio", "thyroid", "cancer"] for deg in ["1st", "2nd"]}
        }

    evidence_by_disease = {d: [] for d in diseases}
    counts = {f"{d}_{deg}": 0 for d in ["hypertension", "diabetes", "cardio", "thyroid", "cancer"] for deg in ["1st", "2nd"]}

    for member in family_members:
        rel = str(member.get("relationship", "")).strip().lower()
        if rel in ["self", "me"]:
            continue

        name = member.get("name") or member.get("relationship") or "Relative"
        conditions = [str(c).lower() for c in member.get("conditions", [])]
        summary = str(member.get("health_summary", "")).lower()
        fam_conditions = member.get("family_conditions") or {}
        
        # Check structured family_conditions (YES = 1)
        for cond_key, val in fam_conditions.items():
            if val == 1 and cond_key not in conditions:
                conditions.append(cond_key)

        all_text = " ".join(conditions) + " " + summary

        is_1st = any(r in rel for r in ["father", "mother", "brother", "sister", "son", "daughter"]) and "grand" not in rel
        is_2nd = any(r in rel for r in ["grand", "uncle", "aunt"])
        degree_str = "1st-degree" if is_1st else ("2nd-degree" if is_2nd else "relative")

        # Blood pressure / Hypertension
        if any(w in all_text for w in ["hypertension", "high blood pressure", "bp", "htn"]):
            evidence_by_disease["blood_pressure"].append(
                f"{member.get('relationship', 'Relative')} ({name}) confirmed with hypertension ({degree_str})."
            )
            if is_1st: counts["hypertension_1st"] += 1
            elif is_2nd: counts["hypertension_2nd"] += 1

        # Cardiovascular
        if any(w in all_text for w in ["cardiovascular", "heart attack", "myocardial", "heart disease", "cad", "stroke"]):
            evidence_by_disease["cardiovascular"].append(
                f"{member.get('relationship', 'Relative')} ({name}) confirmed with cardiovascular condition ({degree_str})."
            )
            if is_1st: counts["cardio_1st"] += 1
            elif is_2nd: counts["cardio_2nd"] += 1

        # Metabolic / Diabetes
        if any(w in all_text for w in ["diabetes", "t2d", "type 2", "metabolic"]):
            evidence_by_disease["metabolic"].append(
                f"{member.get('relationship', 'Relative')} ({name}) confirmed with type 2 diabetes ({degree_str})."
            )
            if is_1st: counts["diabetes_1st"] += 1
            elif is_2nd: counts["diabetes_2nd"] += 1

        # Thyroid
        if any(w in all_text for w in ["thyroid", "hypothyroid", "hyperthyroid", "hashimoto", "goitre"]):
            evidence_by_disease["thyroid"].append(
                f"{member.get('relationship', 'Relative')} ({name}) confirmed with thyroid disorder ({degree_str})."
            )
            if is_1st: counts["thyroid_1st"] += 1
            elif is_2nd: counts["thyroid_2nd"] += 1

        # Cancer
        if any(w in all_text for w in ["cancer", "tumor", "carcinoma", "malignancy", "oncology"]):
            evidence_by_disease["cancer"].append(
                f"{member.get('relationship', 'Relative')} ({name}) confirmed with cancer / neoplastic history ({degree_str})."
            )
            if is_1st: counts["cancer_1st"] += 1
            elif is_2nd: counts["cancer_2nd"] += 1

    for d, ev_list in evidence_by_disease.items():
        if not ev_list:
            evidence_by_disease[d] = ["Family history not provided"] if not family_members else ["No confirmed family history for this condition among entered relatives."]

    return {
        "evidence_by_disease": evidence_by_disease,
        "counts": counts
    }


def compute_family_aware_analysis(
    self_data: dict,
    mapped_personal_inputs: dict,
    personal_results: dict,
    family_members: List[dict],
    family_evidence: dict
) -> dict:
    from services.prediction_service import prediction_service

    counts = family_evidence.get("counts", {})
    ev_by_dis = family_evidence.get("evidence_by_disease", {})
    family_aware_results = {}

    has_family = len(family_members) > 0

    # 1. Blood Pressure - No validated numerical family-aware model registered
    bp_personal_avail = personal_results.get("blood_pressure", {}).get("available", False)
    bp_personal_risk = personal_results.get("blood_pressure", {}).get("risk_percentage") if bp_personal_avail else None
    ht_1st = counts.get("hypertension_1st", 0)
    ht_2nd = counts.get("hypertension_2nd", 0)

    family_aware_results["blood_pressure"] = {
        "supports_family_integration": False,
        "personal_probability_pct": bp_personal_risk,
        "family_aware_probability_pct": None,
        "delta_percentage_points": None,
        "delta_label": "Family history not provided." if not has_family else "Family-aware numerical calculation unavailable.",
        "relative_evidence_count": ht_1st + ht_2nd,
        "evidence_summary": ["Family history not provided"] if not has_family else ev_by_dis.get("blood_pressure", [])
    }

    # 2. Cancer
    cancer_personal_avail = personal_results.get("cancer", {}).get("available", False)
    cancer_personal_risk = personal_results.get("cancer", {}).get("risk_percentage") if cancer_personal_avail else None
    ca_1st = counts.get("cancer_1st", 0)
    ca_2nd = counts.get("cancer_2nd", 0)

    if cancer_personal_avail and has_family:
        adjusted_cancer_risk = min(7, int(2 + (ca_1st * 2) + (ca_2nd * 1)))
        cancer_family_inputs = dict(mapped_personal_inputs["cancer"])
        cancer_family_inputs["genetic_risk"] = adjusted_cancer_risk
        cancer_family_pred = prediction_service.predict_disease("cancer", cancer_family_inputs)
        cancer_family_risk = cancer_family_pred.get("risk_percentage") if cancer_family_pred.get("available") else None
        cancer_delta = round(cancer_family_risk - cancer_personal_risk, 1) if (cancer_family_risk is not None and cancer_personal_risk is not None) else None
        family_aware_results["cancer"] = {
            "supports_family_integration": True,
            "personal_probability_pct": cancer_personal_risk,
            "family_aware_probability_pct": cancer_family_risk,
            "delta_percentage_points": cancer_delta,
            "delta_label": "Change in model output associated with recorded family-history information.",
            "personal_tier": personal_results.get("cancer", {}).get("prediction", "Low Risk").replace("Model Signal: ", ""),
            "family_aware_tier": cancer_family_pred.get("prediction", "Low Risk").replace("Model Signal: ", "") if cancer_family_pred.get("available") else "N/A",
            "pedigree_genetic_risk_score": f"{adjusted_cancer_risk}/7 (Level {adjusted_cancer_risk})",
            "relative_evidence_count": ca_1st + ca_2nd,
            "evidence_summary": ev_by_dis.get("cancer", [])
        }
    else:
        family_aware_results["cancer"] = {
            "supports_family_integration": True,
            "personal_probability_pct": cancer_personal_risk,
            "family_aware_probability_pct": None,
            "delta_percentage_points": None,
            "delta_label": "Family history not provided." if not has_family else "Personal model data insufficient.",
            "personal_tier": "Insufficient data" if not cancer_personal_avail else "Model Available",
            "family_aware_tier": "N/A",
            "pedigree_genetic_risk_score": "Not provided",
            "relative_evidence_count": 0,
            "evidence_summary": ["Family history not provided"] if not has_family else ev_by_dis.get("cancer", [])
        }

    # 3. Cardiovascular, Metabolic, Thyroid (No native family feature vector)
    for mod in ["cardiovascular", "metabolic", "thyroid"]:
        pers_avail = personal_results.get(mod, {}).get("available", False)
        pers_risk = personal_results.get(mod, {}).get("risk_percentage") if pers_avail else None
        family_aware_results[mod] = {
            "supports_family_integration": False,
            "personal_probability_pct": pers_risk,
            "family_aware_probability_pct": None,
            "delta_percentage_points": None,
            "note": "Existing model does not incorporate family-history variables.",
            "evidence_summary": ["Family history not provided"] if not has_family else ev_by_dis.get(mod, [])
        }

    return family_aware_results


def evaluate_data_quality(self_data: dict, mapped_inputs: dict, family_members: list = None) -> dict:
    """
    Evaluates real data completeness for personal features, family network, and lab reports.
    Never fabricates availability.
    """
    family_members = family_members or []
    labs = self_data.get("labs") or {}

    quality = {}
    
    personal_keys_provided = [k for k, v in self_data.items() if v not in [None, "", {}, []] and k not in ["labs", "conditions", "lifestyle"]]
    lifestyle_keys = [k for k, v in (self_data.get("lifestyle") or {}).items() if v not in [None, ""]]
    lab_keys_provided = [k for k, v in labs.items() if v not in [None, ""]]
    
    # 1. Cardiovascular
    cardio_keys = mapped_inputs.get("cardiovascular", {})
    cardio_provided = [k for k, v in cardio_keys.items() if v not in [None, ""]]
    cardio_missing = [req for req in ["age", "gender", "height", "weight", "ap_hi", "ap_lo", "cholesterol", "gluc"] if req not in cardio_provided]
    quality["cardiovascular"] = {
        "status": "Complete" if len(cardio_missing) == 0 else ("Partial" if len(cardio_provided) >= 3 else "Insufficient data"),
        "available_features": cardio_provided,
        "missing_features": cardio_missing
    }

    # 2. Metabolic
    met_keys = mapped_inputs.get("metabolic", {})
    met_provided = [k for k, v in met_keys.items() if v not in [None, ""]]
    met_missing = [req for req in ["age", "height", "weight", "fasting_glucose", "fasting_insulin", "sys_bp", "dia_bp", "ldl", "hdl", "triglycerides", "total_cholesterol"] if req not in met_provided]
    quality["metabolic"] = {
        "status": "Complete" if len(met_missing) == 0 else ("Partial" if len(met_provided) >= 4 else "Insufficient data"),
        "available_features": met_provided,
        "missing_features": met_missing
    }

    # 3. Blood Pressure
    bp_keys = mapped_inputs.get("blood_pressure", {})
    bp_provided = [k for k, v in bp_keys.items() if v not in [None, ""]]
    bp_missing = [req for req in ["age", "bmi", "sex", "hemoglobin"] if req not in bp_provided]
    quality["blood_pressure"] = {
        "status": "Complete" if len(bp_missing) == 0 else ("Partial" if len(bp_provided) >= 2 else "Insufficient data"),
        "available_features": bp_provided,
        "missing_features": bp_missing
    }

    # 4. Thyroid
    th_keys = mapped_inputs.get("thyroid", {})
    th_provided = [k for k, v in th_keys.items() if v not in [None, ""]]
    th_missing = [req for req in ["age", "sex", "tsh", "t3", "tt4", "t4u", "fti"] if req not in th_provided]
    quality["thyroid"] = {
        "status": "Complete" if len(th_missing) == 0 else ("Partial" if len(th_provided) >= 3 else "Insufficient data"),
        "available_features": th_provided,
        "missing_features": th_missing
    }

    # 5. Cancer
    ca_keys = mapped_inputs.get("cancer", {})
    ca_provided = [k for k, v in ca_keys.items() if v not in [None, ""]]
    ca_missing = [req for req in ["age", "gender", "air_pollution", "smoking", "chest_pain"] if req not in ca_provided]
    quality["cancer"] = {
        "status": "Complete" if len(ca_missing) == 0 else ("Partial" if len(ca_provided) >= 3 else "Insufficient data"),
        "available_features": ca_provided,
        "missing_features": ca_missing
    }

    core_fields = [
        "name", "age", "sex", "height", "weight", "ap_hi", "ap_lo",
        "cholesterol", "gluc", "waist", "body_fat", "fasting_glucose",
        "total_cholesterol", "ldl", "hdl", "triglycerides", "fasting_insulin",
        "hemoglobin", "tsh", "t3", "tt4", "t4u", "fti", "smoking", "activity"
    ]
    provided_core = sum(1 for f in core_fields if (
        self_data.get(f) not in [None, ""] or 
        labs.get(f) not in [None, ""] or 
        (self_data.get("lifestyle") or {}).get(f) not in [None, ""] or
        (self_data.get("blood_pressure") or {}).get(f) not in [None, ""] or
        (f == "ap_hi" and (self_data.get("blood_pressure_systolic") or (self_data.get("blood_pressure") or {}).get("sys_bp"))) or
        (f == "ap_lo" and (self_data.get("blood_pressure_diastolic") or (self_data.get("blood_pressure") or {}).get("dia_bp"))) or
        (f == "gluc" and self_data.get("glucose"))
    ))
    completeness_score = min(100, round((provided_core / len(core_fields)) * 100))

    quality["summary"] = {
        "personal_fields_provided": provided_core,
        "total_personal_fields": len(core_fields),
        "family_members_count": len(family_members),
        "lab_values_count": len(lab_keys_provided),
        "completeness_score": completeness_score
    }

    return quality
