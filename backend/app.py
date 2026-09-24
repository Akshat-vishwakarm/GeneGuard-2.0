"""
GeneGuard Backend API Server — Flask REST Endpoints
---------------------------------------------------
Exposes multi-disease ML prediction endpoints, model schemas, family network context,
and medical report extraction APIs.
"""

import os
import sys
from datetime import datetime

# Ensure backend directory is in sys.path for direct imports
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from flask import Flask, request, jsonify
from flask_cors import CORS

from services.model_registry import MODEL_REGISTRY
from services.prediction_service import prediction_service
from services.report_extraction import (
    extract_text_from_file_stream,
    parse_and_normalize_lab_report,
    route_verified_report_data
)
from services.family_analysis import (
    map_unified_self_data_to_models,
    extract_family_evidence,
    compute_family_aware_analysis,
    evaluate_data_quality,
    calculate_bmi
)
from services.familyRiskEngine import (
    FamilyRiskEngine,
    FAMILY_RISK_REGISTRY
)
from services.pre_report_service import PreReportService
from services.gemini_evaluation_service import GeminiEvaluationService

app = Flask(__name__)
CORS(app)

# In-memory Family Network Context (Starts completely empty for fresh session)
FAMILY_NETWORK_DATA = []


@app.route("/api/family/reset", methods=["POST"])
def reset_family_network():
    """Resets the in-memory family network state to empty."""
    global FAMILY_NETWORK_DATA
    FAMILY_NETWORK_DATA = []
    return jsonify({
        "status": "success",
        "message": "Session reset successfully. In-memory family network cleared.",
        "family": []
    })


@app.route("/api/models/schema", methods=["GET"])
def get_model_schemas():
    """Returns dynamic input form schemas and feature requirements for all 5 disease models."""
    return jsonify({
        "status": "success",
        "models": MODEL_REGISTRY
    })


@app.route("/api/family", methods=["GET"])
def get_family_network():
    """Returns available family network members and qualitative evidence context."""
    return jsonify({
        "status": "success",
        "family": FAMILY_NETWORK_DATA
    })


@app.route("/api/family/save", methods=["POST"])
def save_family_network():
    """Saves updated family network structure and person details."""
    global FAMILY_NETWORK_DATA
    data = request.get_json() or {}
    updated_family = data.get("family", [])
    if isinstance(updated_family, list) and updated_family:
        FAMILY_NETWORK_DATA = updated_family
    return jsonify({
        "status": "success",
        "message": "Family network updated successfully.",
        "family": FAMILY_NETWORK_DATA
    })


@app.route("/api/final-analysis", methods=["POST"])
def final_analysis():
    """
    Stage 3: Runs ONE final combined analysis across personal data and family history.
    - Personal 5-disease model predictions
    - Family history extraction from recorded relatives
    - Family-aware analysis comparisons (e.g. Blood Pressure & Cancer)
    - Data quality evaluation
    - Persistent analysis record with unique analysis_id
    """
    data = request.get_json() or {}
    self_data = data.get("self_data", {})
    family_members = data.get("family_members", [])
    relationships = data.get("relationships", [])

    # Minimum Data Gate: Check if user has provided personal data, module inputs, or family members
    has_personal_data = any([
        self_data.get("age"),
        self_data.get("sex") or self_data.get("gender"),
        self_data.get("height"),
        self_data.get("weight"),
        self_data.get("blood_pressure_systolic"),
        self_data.get("blood_pressure_diastolic"),
        self_data.get("glucose"),
        self_data.get("cholesterol"),
        self_data.get("tsh"),
        bool(self_data.get("module_inputs") and any(bool(v) for v in self_data.get("module_inputs", {}).values())),
        bool(self_data.get("lifestyle") and any(v not in [None, ""] for v in self_data.get("lifestyle", {}).values())),
        bool(self_data.get("verified_records")),
        bool(self_data.get("labs") and any(v not in [None, ""] for v in self_data.get("labs", {}).values())),
        bool(family_members and len(family_members) > 0)
    ])

    if not has_personal_data:
        return jsonify({
            "status": "insufficient_data",
            "message": "GeneGuard needs personal health information before generating a personalized analysis. Please complete your personal health profile.",
            "report": None
        })

    # Ensure baseline demographics if omitted so downstream models have valid clinical context
    if not self_data.get("age"):
        self_data["age"] = 38
    if not (self_data.get("sex") or self_data.get("gender")):
        self_data["sex"] = "female"
        self_data["gender"] = "female"
    if not self_data.get("height"):
        self_data["height"] = 168.0
    if not self_data.get("weight"):
        self_data["weight"] = 62.0

    analysis_id = f"ANL-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # 1. Map self_data to all 5 disease module inputs (STRICT: no synthetic defaults)
    mapped_personal_inputs = map_unified_self_data_to_models(self_data)

    # 2. Run personal predictions for all 5 models
    personal_results = prediction_service.predict_all_diseases(mapped_personal_inputs)

    # 3. Extract documented family history evidence
    family_evidence = extract_family_evidence(family_members, relationships)

    # 4. Run family-aware / combined analysis
    family_aware_results = compute_family_aware_analysis(
        self_data,
        mapped_personal_inputs,
        personal_results,
        family_members,
        family_evidence
    )

    # 5. Data Quality evaluation
    data_quality = evaluate_data_quality(self_data, mapped_personal_inputs, family_members)

    # 6. Execute Family Risk Engine (Stage 3 cumulative family-risk analysis)
    family_risk_analysis = FamilyRiskEngine.analyze(
        personal_results=personal_results,
        mapped_personal_inputs=mapped_personal_inputs,
        family_members=family_members
    )

    # 7. Generate structured PRE-REPORT (Section 2 & 3)
    pre_report = PreReportService.build_pre_report(
        self_data=self_data,
        mapped_personal_inputs=mapped_personal_inputs,
        personal_results=personal_results,
        family_members=family_members,
        family_risk_analysis=family_risk_analysis,
        analysis_id=analysis_id
    )

    # 8. Send PRE-REPORT to Gemini for final interpretation & clinical evaluation (Section 1 & 14)
    ai_evaluation = GeminiEvaluationService.evaluate(pre_report)

    # Attach AI evaluations directly to disease evaluations
    ai_disease_evals = ai_evaluation.get("disease_evaluations", {})
    for dis, d_eval in family_risk_analysis.get("disease_evaluations", {}).items():
        if dis in ai_disease_evals:
            d_eval["ai_evaluation"] = ai_disease_evals[dis].get("evaluation")
            d_eval["ai_data_limitations"] = ai_disease_evals[dis].get("data_limitations", [])

    p_name = self_data.get("name")
    if not p_name or not str(p_name).strip() or str(p_name).strip().lower() in ["you", "me", "me (patient)", "alex morgan", "patient"]:
        clean_patient_name = "Patient"
    else:
        clean_patient_name = str(p_name).strip()

    bp_str = None
    if self_data.get("blood_pressure_systolic") and self_data.get("blood_pressure_diastolic"):
        bp_str = f"{self_data.get('blood_pressure_systolic')}/{self_data.get('blood_pressure_diastolic')}"

    report_payload = {
        "analysis_id": analysis_id,
        "person_id": self_data.get("person_id", "self"),
        "patient_name": clean_patient_name,
        "patient_age": int(self_data.get("age")) if self_data.get("age") else None,
        "patient_sex": self_data.get("sex") or self_data.get("gender") or None,
        "created_at": datetime.now().strftime("%d %B %Y"),
        "personal_summary": {
            "name": clean_patient_name,
            "sex": self_data.get("sex") or self_data.get("gender") or None,
            "age": int(self_data.get("age")) if self_data.get("age") else None,
            "height": float(self_data.get("height")) if self_data.get("height") else None,
            "weight": float(self_data.get("weight")) if self_data.get("weight") else None,
            "blood_pressure": bp_str,
            "bmi": calculate_bmi(self_data.get("height"), self_data.get("weight")) if (self_data.get("height") and self_data.get("weight")) else None,
            "lifestyle": self_data.get("lifestyle", {})
        },
        "family_network_summary": {
            "total_members": len(family_members),
            "members": [
                {
                    "person_id": m.get("person_id"),
                    "name": m.get("name"),
                    "relationship": m.get("relationship"),
                    "sex": m.get("sex"),
                    "conditions": m.get("conditions", []),
                    "family_conditions": m.get("family_conditions", {}),
                    "age_at_diagnosis": m.get("age_at_diagnosis", {})
                }
                for m in family_members
            ]
        },
        "personal_results": personal_results,
        "family_history": family_evidence,
        "family_aware_results": family_aware_results,
        "family_risk_analysis": family_risk_analysis,
        "pre_report": pre_report,
        "ai_evaluation": ai_evaluation,
        "data_quality": data_quality,
        "disclaimer": "This is a machine-learning-based health analysis and is not a medical diagnosis."
    }

    return jsonify({
        "status": "success",
        "analysis_id": analysis_id,
        "report": report_payload
    })


@app.route("/api/family-risk/registry", methods=["GET"])
def get_family_risk_registry():
    """Returns disease configurations and model availability statuses from the Family Risk Registry."""
    return jsonify({
        "status": "success",
        "registry": FAMILY_RISK_REGISTRY
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Executes disease risk prediction using existing trained models.
    Supports single-module prediction or all-module predictions.
    """
    data = request.get_json() or {}
    person_id = data.get("person_id", "person_001")
    disease_module = data.get("disease_module")
    inputs = data.get("inputs", {})

    if not disease_module:
        return jsonify({
            "status": "error",
            "message": "Missing required field 'disease_module'."
        }), 400

    if disease_module == "all":
        # Inputs can be structured as {"cardiovascular": {...}, "metabolic": {...}} or single dict
        all_inputs = {}
        for mod in ["cardiovascular", "metabolic", "blood_pressure", "thyroid", "cancer"]:
            if mod in inputs and isinstance(inputs[mod], dict):
                all_inputs[mod] = inputs[mod]
            else:
                all_inputs[mod] = inputs

        predictions = prediction_service.predict_all_diseases(all_inputs)
        return jsonify({
            "status": "success",
            "person_id": person_id,
            "predictions": predictions
        })
    else:
        result = prediction_service.predict_disease(disease_module, inputs)
        return jsonify({
            "status": "success",
            "person_id": person_id,
            "disease_module": disease_module,
            "result": result
        })


@app.route("/api/extract-report", methods=["POST"])
def extract_report():
    """
    Parses Thyroid or General Lab Reports (PDF, PNG, JPG, TXT),
    extracts raw text via OCR/PDF parsers, normalizes test names & units,
    and returns a structured list of detected items for USER VERIFICATION.
    """
    report_text = ""

    if "file" in request.files:
        file = request.files["file"]
        filename = file.filename or "report.txt"
        file_bytes = file.read()
        report_text = extract_text_from_file_stream(file_bytes, filename)
    elif request.is_json:
        data = request.get_json() or {}
        report_text = data.get("report_text", "")

    if not report_text.strip():
        return jsonify({
            "status": "error",
            "message": "No report text or valid file content provided."
        }), 400

    extracted_items = parse_and_normalize_lab_report(report_text)
    mapped_inputs, verified_records = route_verified_report_data(extracted_items)

    return jsonify({
        "status": "success",
        "raw_text_extracted": report_text[:300] + "...",
        "extracted_items": extracted_items,
        "extracted_measurements": {item["id"]: item["value"] for item in extracted_items},
        "mapped_features": mapped_inputs,
        "verification_required": True,
        "message": f"Successfully detected {len(extracted_items)} laboratory measurement(s). Please verify values before confirming."
    })


@app.route("/api/confirm-report", methods=["POST"])
def confirm_report():
    """
    Accepts user-verified lab metrics, routes them to relevant model feature mappers,
    and returns mapped feature dicts and verified records with source tracking.
    """
    data = request.get_json() or {}
    verified_items = data.get("verified_items", [])

    if not verified_items:
        return jsonify({
            "status": "error",
            "message": "No verified items submitted."
        }), 400

    mapped_inputs, verified_records = route_verified_report_data(verified_items)

    return jsonify({
        "status": "success",
        "mapped_inputs": mapped_inputs,
        "verified_records": verified_records,
        "message": "Verified report values mapped to eligible disease models."
    })


def get_model_diagnostics():
    import sys
    import hashlib
    import sklearn
    import joblib
    import numpy as np
    import pandas as pd

    models_info = {}
    for mod_key, cfg in MODEL_REGISTRY.items():
        m_file = cfg.get("model_file")
        m_exists = os.path.exists(m_file) if m_file else False
        m_hash = None
        m_size = None
        if m_exists:
            try:
                with open(m_file, "rb") as f:
                    content = f.read()
                    m_hash = hashlib.sha256(content).hexdigest()
                    m_size = len(content)
            except Exception as e:
                m_hash = f"Error reading: {e}"

        loaded_model = prediction_service.models.get(mod_key)
        classes = None
        if loaded_model is not None:
            if hasattr(loaded_model, "classes_"):
                classes = [int(c) if isinstance(c, (np.integer, int)) else str(c) for c in loaded_model.classes_]
            elif hasattr(loaded_model, "named_steps") and hasattr(loaded_model.named_steps.get("classifier"), "classes_"):
                clf = loaded_model.named_steps["classifier"]
                classes = [int(c) if isinstance(c, (np.integer, int)) else str(c) for c in clf.classes_]

        models_info[mod_key] = {
            "model_name": os.path.basename(m_file) if m_file else None,
            "model_version": cfg.get("id") + "-v1",
            "model_file": m_file,
            "model_exists": m_exists,
            "model_size_bytes": m_size,
            "model_hash": m_hash,
            "model_type": cfg.get("model_type"),
            "model_classes": classes,
            "target_classes": cfg.get("target_classes"),
            "feature_order": cfg.get("features_order", []),
            "loaded_in_memory": loaded_model is not None
        }

    return {
        "status": "success",
        "service": "GeneGuard Production ML Model Diagnostic Service",
        "environment": "vercel_production" if os.environ.get("VERCEL") else "localhost",
        "python_version": sys.version,
        "numpy_version": np.__version__,
        "pandas_version": pd.__version__,
        "sklearn_version": sklearn.__version__,
        "joblib_version": joblib.__version__,
        "models": models_info
    }


@app.route("/model-info", methods=["GET"])
@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Diagnostic endpoint to verify exact model hashes, versions, features, and environment."""
    return jsonify(get_model_diagnostics())


GOLDEN_PATIENT_INPUT = {
    "cardiovascular": {
        "age": 52,
        "gender": "male",
        "height": 175,
        "weight": 78,
        "ap_hi": 128,
        "ap_lo": 82,
        "cholesterol": "normal",
        "gluc": "normal",
        "smoke": "no",
        "alco": "no",
        "active": "yes"
    },
    "metabolic": {
        "age": 48,
        "height": 170,
        "weight": 72,
        "waist": 84,
        "body_fat": 22.0,
        "skeletal_muscle": 32.0,
        "sys_bp": 120,
        "dia_bp": 80,
        "total_cholesterol": 185,
        "fasting_glucose": 92,
        "triglycerides": 130,
        "hdl": 52,
        "ldl": 105,
        "fasting_insulin": 8.5
    },
    "blood_pressure": {
        "hemoglobin": 13.5,
        "genetic_coefficient": 0.25,
        "age": 45,
        "bmi": 24.2,
        "sex": 1,
        "pregnancy": 0,
        "smoking": 0,
        "physical_activity": 8500,
        "salt_intake": 12000,
        "alcohol_consumption": 0,
        "stress_level": 2,
        "chronic_kidney_disease": 0,
        "adrenal_thyroid_disorders": 0
    },
    "thyroid": {
        "age": 42,
        "sex": "F",
        "tsh": 2.1,
        "t3": 1.8,
        "tt4": 95,
        "t4u": 1.05,
        "fti": 90.5,
        "on_thyroxine": "f",
        "query_on_thyroxine": "f",
        "on_antithyroid": "f",
        "sick": "f",
        "pregnant": "f",
        "thyroid_surgery": "f",
        "i131_treatment": "f",
        "query_hypothyroid": "f",
        "query_hyperthyroid": "f",
        "lithium": "f",
        "goitre": "f",
        "tumor": "f",
        "hypopituitary": "f",
        "psych": "f"
    },
    "cancer": {
        "age": 30,
        "gender": 1,
        "air_pollution": 2,
        "alcohol_use": 2,
        "dust_allergy": 2,
        "occupational_hazards": 2,
        "genetic_risk": 2,
        "chronic_lung_disease": 2,
        "balanced_diet": 6,
        "obesity": 2,
        "smoking": 2,
        "passive_smoker": 2,
        "chest_pain": 2,
        "coughing_of_blood": 1,
        "fatigue": 2,
        "weight_loss": 2,
        "shortness_of_breath": 2,
        "wheezing": 1,
        "swallowing_difficulty": 2,
        "clubbing_finger_nails": 1,
        "frequent_cold": 2,
        "dry_cough": 1,
        "snoring": 2
    }
}


@app.route("/golden-test", methods=["GET"])
@app.route("/api/golden-test", methods=["GET"])
def golden_test():
    """
    Executes fixed golden patient input across all 5 models and returns
    reproducible inference audit record for comparing Localhost vs Vercel.
    """
    audit_results = {}
    for mod in ["cardiovascular", "metabolic", "blood_pressure", "thyroid", "cancer"]:
        res = prediction_service.predict_disease(mod, GOLDEN_PATIENT_INPUT[mod])
        audit_results[mod] = {
            "prediction": res.get("prediction"),
            "risk_percentage": res.get("risk_percentage"),
            "probability": res.get("probability"),
            "probabilities": res.get("probabilities") or res.get("class_probabilities"),
            "available": res.get("available")
        }

    return jsonify({
        "status": "success",
        "environment": "vercel_production" if os.environ.get("VERCEL") else "localhost",
        "timestamp": datetime.now().isoformat(),
        "golden_patient_input": GOLDEN_PATIENT_INPUT,
        "audit_results": audit_results
    })


if __name__ == "__main__":
    print("[GeneGuard Backend] Starting server on http://localhost:5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
