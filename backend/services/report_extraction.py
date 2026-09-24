"""
GeneGuard Dedicated Report Extraction & Verification Service
-------------------------------------------------------------
Parses Thyroid and General Laboratory Reports (PDF, JPG, PNG, TXT),
extracts raw text via OCR/PDF parsers, normalizes test names and units,
structures measurements for USER VERIFICATION, and routes verified metrics
to relevant disease model feature mappers.
"""

import io
import re
from datetime import datetime
from PIL import Image

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import pytesseract
except ImportError:
    pytesseract = None


TEST_NORMALIZATION_MAP = [
    {
        "id": "tsh",
        "standard_name": "TSH",
        "display_name": "Thyroid Stimulating Hormone (TSH)",
        "patterns": [
            r"(?:thyroid\s+stimulating\s+hormone|serum\s+tsh|tsh)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mIU/L",
        "target_models": ["thyroid"]
    },
    {
        "id": "t3",
        "standard_name": "T3",
        "display_name": "Triiodothyronine (Total T3)",
        "patterns": [
            r"(?:triiodothyronine|total\s+t3|\bt3\b)[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "ng/mL",
        "target_models": ["thyroid"]
    },
    {
        "id": "tt4",
        "standard_name": "T4",
        "display_name": "Total Thyroxine (Total T4)",
        "patterns": [
            r"(?:total\s+thyroxine|total\s+t4|serum\s+t4|thyroxine|\btt4\b|\bt4\b)[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "µg/dL",
        "target_models": ["thyroid"]
    },
    {
        "id": "t4u",
        "standard_name": "T4U",
        "display_name": "Thyroxine Uptake (T4U)",
        "patterns": [
            r"(?:thyroxine\s+utilization|thyroxine\s+uptake|t4\s+uptake|\bt4u\b)[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "ratio",
        "target_models": ["thyroid"]
    },
    {
        "id": "fti",
        "standard_name": "FTI",
        "display_name": "Free Thyroxine Index (FTI)",
        "patterns": [
            r"(?:free\s+thyroxine\s+index|\bfti\b)[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "index",
        "target_models": ["thyroid"]
    },
    {
        "id": "sys_bp",
        "standard_name": "Systolic BP",
        "display_name": "Systolic Blood Pressure",
        "patterns": [
            r"(?:systolic|sys\s+bp|bp[_\s]?sys)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
            r"(\d{2,3})\s*/\s*\d{2,3}\s*mmHg"
        ],
        "default_unit": "mmHg",
        "target_models": ["cardiovascular", "metabolic", "blood_pressure"]
    },
    {
        "id": "dia_bp",
        "standard_name": "Diastolic BP",
        "display_name": "Diastolic Blood Pressure",
        "patterns": [
            r"(?:diastolic|dia\s+bp|bp[_\s]?dia)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
            r"\d{2,3}\s*/\s*(\d{2,3})\s*mmHg"
        ],
        "default_unit": "mmHg",
        "target_models": ["cardiovascular", "metabolic", "blood_pressure"]
    },
    {
        "id": "total_cholesterol",
        "standard_name": "Total Cholesterol",
        "display_name": "Total Cholesterol",
        "patterns": [
            r"(?:total\s+cholesterol|cholesterol)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mg/dL",
        "target_models": ["cardiovascular", "metabolic"]
    },
    {
        "id": "ldl",
        "standard_name": "LDL",
        "display_name": "LDL Cholesterol",
        "patterns": [
            r"(?:ldl|ldl-c|low\s+density\s+lipoprotein)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mg/dL",
        "target_models": ["metabolic"]
    },
    {
        "id": "hdl",
        "standard_name": "HDL",
        "display_name": "HDL Cholesterol",
        "patterns": [
            r"(?:hdl|hdl-c|high\s+density\s+lipoprotein)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mg/dL",
        "target_models": ["metabolic"]
    },
    {
        "id": "triglycerides",
        "standard_name": "Triglycerides",
        "display_name": "Triglycerides",
        "patterns": [
            r"(?:triglycerides|trig)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mg/dL",
        "target_models": ["metabolic"]
    },
    {
        "id": "fasting_glucose",
        "standard_name": "Fasting Glucose",
        "display_name": "Fasting Glucose",
        "patterns": [
            r"(?:fasting\s+(?:blood\s+)?glucose|glucose|fbs)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "mg/dL",
        "target_models": ["cardiovascular", "metabolic"]
    },
    {
        "id": "fasting_insulin",
        "standard_name": "Fasting Insulin",
        "display_name": "Fasting Insulin",
        "patterns": [
            r"(?:fasting\s+insulin|insulin)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "μIU/mL",
        "target_models": ["metabolic"]
    },
    {
        "id": "hba1c",
        "standard_name": "HbA1c",
        "display_name": "Glycated Hemoglobin (HbA1c)",
        "patterns": [
            r"(?:hba1c|glycated\s+hemoglobin|a1c)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "%",
        "target_models": ["metabolic"]
    },
    {
        "id": "hemoglobin",
        "standard_name": "Hemoglobin",
        "display_name": "Hemoglobin Level",
        "patterns": [
            r"(?:hemoglobin|hgb|hb)\b[^\d\.\n]*[:\s=]+([\d\.]+)",
        ],
        "default_unit": "g/dL",
        "target_models": ["blood_pressure"]
    }
]


def extract_text_from_file_stream(file_bytes: bytes, filename: str) -> str:
    """Extracts raw text from PDF, JPG, PNG, or TXT file bytes."""
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext == "pdf":
        if pypdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                if text.strip():
                    return text
            except Exception as e:
                print(f"pypdf extraction error: {e}")
        return file_bytes.decode("utf-8", errors="ignore")

    elif ext in ["jpg", "jpeg", "png", "bmp"]:
        if pytesseract:
            try:
                img = Image.open(io.BytesIO(file_bytes))
                text = pytesseract.image_to_string(img)
                if text.strip():
                    return text
            except Exception as e:
                print(f"pytesseract extraction error: {e}")

    # Fallback to UTF-8 text decode
    return file_bytes.decode("utf-8", errors="ignore")


def parse_and_normalize_lab_report(report_text: str) -> list[dict]:
    """
    Parses raw report text, normalizes test names, units, and values,
    and returns a structured list of detected lab items for user verification.
    """
    extracted_items = []
    seen_ids = set()

    for item_def in TEST_NORMALIZATION_MAP:
        item_id = item_def["id"]
        if item_id in seen_ids:
            continue

        for p in item_def["patterns"]:
            match = re.search(p, report_text, re.IGNORECASE)
            if match:
                try:
                    val = float(match.group(1))
                    seen_ids.add(item_id)

                    extracted_items.append({
                        "id": item_id,
                        "test_key": item_def["standard_name"],
                        "display_name": item_def["display_name"],
                        "value": val,
                        "unit": item_def["default_unit"],
                        "status": "Verify",
                        "source": "Uploaded Lab Report",
                        "target_models": item_def["target_models"]
                    })
                    break
                except (ValueError, IndexError):
                    continue

    return extracted_items


def route_verified_report_data(verified_items: list[dict]) -> tuple[dict, list[dict]]:
    """
    Routes user-verified lab metrics ONLY to the relevant model feature mappers.
    Returns (mapped_inputs_by_module, structured_verified_records).
    """
    mapped_inputs = {
        "cardiovascular": {},
        "metabolic": {},
        "blood_pressure": {},
        "thyroid": {},
        "cancer": {}
    }

    verified_records = []
    current_date = datetime.now().strftime("%Y-%m-%d")

    for item in verified_items:
        test_id = item["id"]
        val = item["value"]
        unit = item.get("unit", "")
        source = item.get("source", "Uploaded Lab Report")

        verified_record = {
            "source": source,
            "verified": True,
            "test": item["display_name"],
            "test_key": item["test_key"],
            "value": val,
            "unit": unit,
            "date": current_date
        }
        verified_records.append(verified_record)

        # Module feature routing
        if test_id == "tsh":
            mapped_inputs["thyroid"]["tsh"] = val
        elif test_id == "t3":
            mapped_inputs["thyroid"]["t3"] = val
        elif test_id == "tt4":
            mapped_inputs["thyroid"]["tt4"] = val
        elif test_id == "t4u":
            mapped_inputs["thyroid"]["t4u"] = val
        elif test_id == "fti":
            mapped_inputs["thyroid"]["fti"] = val

        elif test_id == "sys_bp":
            mapped_inputs["cardiovascular"]["ap_hi"] = val
            mapped_inputs["metabolic"]["sys_bp"] = val
            mapped_inputs["blood_pressure"]["sys_bp"] = val
        elif test_id == "dia_bp":
            mapped_inputs["cardiovascular"]["ap_lo"] = val
            mapped_inputs["metabolic"]["dia_bp"] = val
            mapped_inputs["blood_pressure"]["dia_bp"] = val

        elif test_id == "total_cholesterol":
            mapped_inputs["metabolic"]["total_cholesterol"] = val
            if val < 200:
                mapped_inputs["cardiovascular"]["cholesterol"] = "normal"
            elif val < 240:
                mapped_inputs["cardiovascular"]["cholesterol"] = "above_normal"
            else:
                mapped_inputs["cardiovascular"]["cholesterol"] = "high"

        elif test_id == "fasting_glucose":
            mapped_inputs["metabolic"]["fasting_glucose"] = val
            if val < 100:
                mapped_inputs["cardiovascular"]["gluc"] = "normal"
            elif val < 126:
                mapped_inputs["cardiovascular"]["gluc"] = "above_normal"
            else:
                mapped_inputs["cardiovascular"]["gluc"] = "high"

        elif test_id == "ldl":
            mapped_inputs["metabolic"]["ldl"] = val
        elif test_id == "hdl":
            mapped_inputs["metabolic"]["hdl"] = val
        elif test_id == "triglycerides":
            mapped_inputs["metabolic"]["triglycerides"] = val
        elif test_id == "fasting_insulin":
            mapped_inputs["metabolic"]["fasting_insulin"] = val
        elif test_id == "hemoglobin":
            mapped_inputs["blood_pressure"]["hemoglobin"] = val

    return mapped_inputs, verified_records
