"""
GeneGuard Pre-Report Generation Service
---------------------------------------
Constructs a complete, structured PRE-REPORT from the current user session
before passing it to the Gemini evaluation layer.

Strict Rules:
- ONLY REAL DATA FROM THE CURRENT SESSION.
- Never generate dummy values.
- Never invent relatives.
- Never invent diseases.
- Never invent probabilities.
- Never use old session data or hardcoded demo data.
- Unknown values remain null or "unknown" (never convert to zero).
- Clearly separates personal health data, verified lab reports,
  trained ML predictions, family network nodes, and family-aware calculations.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger("geneguard.pre_report_service")

# Map of disease keys and clinical labels
DISEASE_DEFINITIONS = [
    {
        "key": "cardiovascular",
        "label": "Cardiovascular Disease",
        "module_key": "cardiovascular",
        "model_version": "cvd-rf-v1"
    },
    {
        "key": "diabetes",
        "label": "Diabetes / Metabolic Risk",
        "module_key": "metabolic",
        "model_version": "metabolic-gb-v1"
    },
    {
        "key": "hypertension",
        "label": "Blood Pressure / Hypertension",
        "module_key": "blood_pressure",
        "model_version": "blood-pressure-rf-v1"
    },
    {
        "key": "thyroid",
        "label": "Thyroid Disorder",
        "module_key": "thyroid",
        "model_version": "thyroid-ensemble-v1"
    },
    {
        "key": "cancer",
        "label": "Cancer / Respiratory Risk",
        "module_key": "cancer",
        "model_version": "cancer-multinomial-v1"
    }
]

DEGREE_MAPPING = {
    "father": "1st-degree",
    "mother": "1st-degree",
    "brother": "1st-degree",
    "sister": "1st-degree",
    "son": "1st-degree",
    "daughter": "1st-degree",
    "sibling": "1st-degree",
    "paternal_grandfather": "2nd-degree",
    "paternal_grandmother": "2nd-degree",
    "maternal_grandfather": "2nd-degree",
    "maternal_grandmother": "2nd-degree",
    "uncle": "2nd-degree",
    "aunt": "2nd-degree",
    "grandfather": "2nd-degree",
    "grandmother": "2nd-degree"
}


def normalize_relationship_token(rel: str = "", subtitle: str = "", pid: str = "") -> str:
    r = (rel or "").strip().lower()
    sub = (subtitle or "").strip().lower()
    i = (pid or "").strip().lower()

    if r == "father" or i == "father": return "father"
    if r == "mother" or i == "mother": return "mother"
    if any(k in r for k in ["brother", "sister", "sibling"]) or any(k in i for k in ["brother", "sister"]):
        return "sibling"

    is_pat = "paternal" in sub or "paternal" in r or "paternal" in i
    is_mat = "maternal" in sub or "maternal" in r or "maternal" in i

    if "grandfather" in r or "grandfather" in i:
        return "paternal_grandfather" if is_pat else ("maternal_grandfather" if is_mat else "grandfather")
    if "grandmother" in r or "grandmother" in i:
        return "paternal_grandmother" if is_pat else ("maternal_grandmother" if is_mat else "grandmother")

    return r.replace(" ", "_") if r else "relative"


class PreReportService:
    """
    Builds the formal structured PRE-REPORT payload for Gemini interpretation.
    """

    @classmethod
    def build_pre_report(
        cls,
        self_data: Dict[str, Any],
        mapped_personal_inputs: Dict[str, Any],
        personal_results: Dict[str, Any],
        family_members: List[Dict[str, Any]],
        family_risk_analysis: Dict[str, Any],
        analysis_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assembles all genuine session data into a validated pre-report dictionary.
        """
        # 1. Patient Profile
        age_val = self_data.get("age")
        try: age_int = int(age_val) if age_val not in [None, ""] else None
        except: age_int = None

        h_val = self_data.get("height")
        try: h_float = float(h_val) if h_val not in [None, ""] else None
        except: h_float = None

        w_val = self_data.get("weight")
        try: w_float = float(w_val) if w_val not in [None, ""] else None
        except: w_float = None

        bmi_val = None
        if h_float and w_float and h_float > 0:
            bmi_val = round(w_float / ((h_float / 100.0) ** 2), 1)

        patient_profile = {
            "patient_id": analysis_id or f"GENEGUARD-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "name": self_data.get("name") or "Patient",
            "age": age_int,
            "sex": self_data.get("sex") or self_data.get("gender") or "unknown",
            "height_cm": h_float,
            "weight_kg": w_float,
            "bmi": bmi_val
        }

        # 2. Personal Health Data (only available/verified inputs)
        personal_health_data = {}

        if self_data.get("blood_pressure_systolic") and self_data.get("blood_pressure_diastolic"):
            personal_health_data["blood_pressure"] = {
                "systolic": int(self_data["blood_pressure_systolic"]),
                "diastolic": int(self_data["blood_pressure_diastolic"]),
                "unit": "mmHg"
            }

        for lab_key, lab_name, lab_unit in [
            ("hemoglobin", "Hemoglobin", "g/dL"),
            ("glucose", "Fasting Glucose", "mg/dL"),
            ("fasting_glucose", "Fasting Glucose", "mg/dL"),
            ("fasting_insulin", "Fasting Insulin", "uIU/mL"),
            ("cholesterol", "Total Cholesterol", "mg/dL"),
            ("total_cholesterol", "Total Cholesterol", "mg/dL"),
            ("triglycerides", "Triglycerides", "mg/dL"),
            ("hdl", "HDL Cholesterol", "mg/dL"),
            ("ldl", "LDL Cholesterol", "mg/dL"),
            ("tsh", "TSH (Thyroid Stimulating Hormone)", "mIU/L"),
            ("t3", "Total T3", "nmol/L"),
            ("tt4", "Total T4", "nmol/L"),
            ("t4u", "T4 Uptake", "ratio"),
            ("fti", "Free Thyroxine Index", "index")
        ]:
            val = (self_data.get("labs", {}) or {}).get(lab_key) or self_data.get(lab_key)
            if val not in [None, ""]:
                try: personal_health_data[lab_key] = {"name": lab_name, "value": float(val), "unit": lab_unit}
                except: pass

        # Lifestyle factors
        lifestyle = self_data.get("lifestyle", {}) or {}
        lifestyle_clean = {}
        for lk, lv in lifestyle.items():
            if lv not in [None, ""]:
                lifestyle_clean[lk] = lv
        if self_data.get("salt_intake") not in [None, ""]:
            lifestyle_clean["salt_intake"] = self_data["salt_intake"]
        if self_data.get("stress_level") not in [None, ""]:
            lifestyle_clean["stress_level"] = self_data["stress_level"]
        if lifestyle_clean:
            personal_health_data["lifestyle"] = lifestyle_clean

        # Symptoms and clinical factors
        clinical_clean = {}
        for ck in ["chronic_kidney_disease", "adrenal_thyroid_disorders"]:
            if self_data.get(ck) not in [None, ""]:
                clinical_clean[ck] = self_data[ck]
        if clinical_clean:
            personal_health_data["clinical_history"] = clinical_clean

        # 3. Medical Report Data (verified uploads only)
        verified_medical_reports = []
        verified_records = self_data.get("verified_records", []) or []
        for rec in verified_records:
            verified_medical_reports.append({
                "marker": rec.get("marker", "Unknown"),
                "value": rec.get("value"),
                "unit": rec.get("unit"),
                "source": rec.get("source", "uploaded_lab_report"),
                "verified": bool(rec.get("verified", True))
            })

        # 4. Disease Model Results
        disease_model_results = {}
        for dis in DISEASE_DEFINITIONS:
            d_key = dis["key"]
            m_key = dis["module_key"]
            res = personal_results.get(m_key, {})
            is_avail = res.get("available") if "available" in res else (res.get("risk_percentage") is not None)

            if is_avail and res.get("risk_percentage") is not None:
                prob_pct = res.get("risk_percentage")
                prob_val = round(prob_pct / 100.0, 4) if prob_pct > 1.0 else round(prob_pct, 4)
                disease_model_results[d_key] = {
                    "disease_label": dis["label"],
                    "status": "available",
                    "model_probability": prob_val,
                    "risk_percentage": prob_pct,
                    "predicted_class": res.get("prediction", "Evaluated"),
                    "model_name": res.get("model_name", dis["label"] + " Model"),
                    "model_version": dis["model_version"]
                }
            else:
                disease_model_results[d_key] = {
                    "disease_label": dis["label"],
                    "status": "insufficient_data",
                    "model_probability": None,
                    "risk_percentage": None,
                    "predicted_class": "Not evaluated",
                    "missing_fields": res.get("missing_fields", []),
                    "model_version": dis["model_version"]
                }

        # 5. Complete Family Tree Nodes
        family_tree = []
        for m in family_members:
            rel = m.get("relationship", "")
            sub = m.get("subtitle", "")
            pid = m.get("person_id", "")
            norm_rel = normalize_relationship_token(rel, sub, pid)
            degree = DEGREE_MAPPING.get(norm_rel, "other")

            # Extract condition statuses: YES, NO, UNKNOWN
            fam_conds = m.get("family_conditions") or {}
            conds_list = [str(c).lower() for c in m.get("conditions", [])]
            status_map = {}

            for dis in ["diabetes", "hypertension", "cardiovascular", "thyroid", "cancer"]:
                if dis in fam_conds:
                    v = fam_conds[dis]
                    if v in [1, "1", True, "yes", "YES"]:
                        status_map[dis] = "YES"
                    elif v in [0, "0", False, "no", "NO"]:
                        status_map[dis] = "NO"
                    else:
                        status_map[dis] = "UNKNOWN"
                else:
                    # check legacy condition text
                    matched = any(dis in c for c in conds_list)
                    if matched:
                        status_map[dis] = "YES"
                    elif m.get("history_unknown"):
                        status_map[dis] = "UNKNOWN"
                    else:
                        status_map[dis] = "UNKNOWN"

            family_tree.append({
                "person_id": m.get("person_id") or pid or f"node_{len(family_tree)}",
                "name": m.get("name") or rel,
                "relationship": norm_rel,
                "relationship_display": rel,
                "degree": degree,
                "sex": m.get("sex", "unknown"),
                "age": m.get("age"),
                "status": "deceased" if m.get("deceased") else "alive",
                "recorded_conditions": status_map,
                "age_at_diagnosis": m.get("age_at_diagnosis", {})
            })

        # 6. Family Disease Grouping
        family_disease_grouping = {}
        for dis in ["diabetes", "hypertension", "cardiovascular", "thyroid", "cancer"]:
            affected_nodes = []
            for node in family_tree:
                if node["recorded_conditions"].get(dis) == "YES":
                    affected_nodes.append({
                        "person_id": node["person_id"],
                        "name": node["name"],
                        "relationship": node["relationship"],
                        "relationship_display": node["relationship_display"],
                        "degree": node["degree"],
                        "age_at_diagnosis": node["age_at_diagnosis"].get(dis)
                    })

            n_1st = sum(1 for a in affected_nodes if a["degree"] == "1st-degree")
            n_2nd = sum(1 for a in affected_nodes if a["degree"] == "2nd-degree")

            family_disease_grouping[dis] = {
                "total_affected": len(affected_nodes),
                "first_degree_affected_count": n_1st,
                "second_degree_affected_count": n_2nd,
                "affected_relatives": affected_nodes
            }

        # 7. Family-Aware Model & Context per Disease
        disease_evals = family_risk_analysis.get("disease_evaluations", {})
        family_aware_context = {}

        for dis in ["diabetes", "hypertension", "cardiovascular", "thyroid", "cancer"]:
            d_eval = disease_evals.get(dis, {})
            fa_mod = d_eval.get("family_aware_model", {})
            comp = d_eval.get("comparison", {})
            pers = disease_model_results.get(dis, {})

            fa_status = fa_mod.get("status", "Not available")
            fa_prob_pct = fa_mod.get("output_percentage")
            fa_delta_pp = fa_mod.get("delta_percentage_points")

            quant_status = fa_mod.get("quantification_status", "no_evidence_registered")
            evidence_obj = fa_mod.get("evidence")
            pattern_obj = fa_mod.get("matched_pattern")
            calc_type = fa_mod.get("calculation_type", "none")

            family_aware_context[dis] = {
                "personal_model_probability": pers.get("model_probability"),
                "personal_risk_percentage": pers.get("risk_percentage"),
                "family_history_recorded": family_disease_grouping[dis]["affected_relatives"],
                "quantification_status": quant_status,
                "calculation_type": calc_type,
                "family_aware_model_status": "available" if (fa_status == "Available" and fa_prob_pct is not None) else "unavailable",
                "family_aware_model_probability": round(fa_prob_pct / 100.0, 4) if (fa_prob_pct is not None and fa_prob_pct > 1.0) else fa_prob_pct,
                "family_aware_risk_percentage": fa_prob_pct,
                "delta_percentage_points": fa_delta_pp,
                "family_evidence": evidence_obj,
                "matched_pattern": pattern_obj,
                "explanation": comp.get("explanation", "Family-aware numerical calculation unavailable.")
            }

        pre_report = {
            "pre_report_version": "1.0",
            "generated_at": datetime.now().isoformat(),
            "patient_profile": patient_profile,
            "personal_health_data": personal_health_data,
            "verified_medical_reports": verified_medical_reports,
            "disease_model_results": disease_model_results,
            "family_tree": family_tree,
            "family_disease_grouping": family_disease_grouping,
            "family_aware_context": family_aware_context
        }

        # Save/log pre-report for development traceability (Section 17)
        try:
            log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, "latest_pre_report.json")
            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(pre_report, f, indent=2)
            logger.info(f"Saved latest PRE-REPORT to {log_path}")
        except Exception as e:
            logger.warning(f"Could not persist pre-report to log directory: {e}")

        return pre_report
