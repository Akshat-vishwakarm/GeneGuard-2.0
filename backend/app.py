"""
GeneGuard Backend API Server — Flask REST Endpoints
---------------------------------------------------
Exposes multi-disease ML prediction endpoints, model schemas, family network context,
and medical report extraction APIs.
"""

import os
from datetime import datetime
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

    # Minimum Data Gate: Check if user has provided personal data
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
        bool(self_data.get("lifestyle") and any(v not in [None, ""] for v in self_data.get("lifestyle", {}).values())),
        bool(self_data.get("verified_records")),
        bool(self_data.get("labs") and any(v not in [None, ""] for v in self_data.get("labs", {}).values()))
    ])

    if not has_personal_data:
        return jsonify({
            "status": "insufficient_data",
            "message": "GeneGuard needs personal health information before generating a personalized analysis. Please complete your personal health profile.",
            "report": None
        })

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


if __name__ == "__main__":
    print("[GeneGuard Backend] Starting server on http://localhost:5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
