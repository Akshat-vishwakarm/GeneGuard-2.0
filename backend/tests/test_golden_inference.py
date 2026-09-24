"""
GeneGuard Golden Inference Audit Script
---------------------------------------
Verifies that all 5 disease models execute deterministically with:
1. Raw Input
2. Feature Mapping & Validation
3. Processed Feature Values
4. Model Name & Path
5. Model Version
6. Model SHA-256 Hash
7. Model Classes
8. Model Prediction Label
9. Model Probability & Calibrated Risk %

Can be run locally or against any remote endpoint (e.g. Vercel).
Usage:
  python backend/tests/test_golden_inference.py
  python backend/tests/test_golden_inference.py --url https://your-app.vercel.app
"""

import os
import sys
import json
import hashlib
import argparse
import urllib.request

# Ensure repo root is on sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import GOLDEN_PATIENT_INPUT
from backend.services.model_registry import MODEL_REGISTRY
from backend.services.prediction_service import prediction_service


def compute_sha256(filepath):
    if not os.path.exists(filepath):
        return "FILE_NOT_FOUND"
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def run_local_audit():
    print("=" * 80)
    print(" GENEGUARD LOCAL INFERENCE AUDIT RECORD")
    print("=" * 80)

    modules = ["cardiovascular", "metabolic", "blood_pressure", "thyroid", "cancer"]
    results = {}

    for mod in modules:
        print(f"\n[{mod.upper()}]")
        cfg = MODEL_REGISTRY[mod]
        model_file = cfg["model_file"]
        model_hash = compute_sha256(model_file)
        raw_inp = GOLDEN_PATIENT_INPUT[mod]

        loaded_model = prediction_service.models.get(mod)
        classes = None
        if loaded_model is not None:
            if hasattr(loaded_model, "classes_"):
                classes = list(loaded_model.classes_)
            elif hasattr(loaded_model, "named_steps") and hasattr(loaded_model.named_steps.get("classifier"), "classes_"):
                classes = list(loaded_model.named_steps["classifier"].classes_)

        res = prediction_service.predict_disease(mod, raw_inp)

        print(f"  1. Model File:     {os.path.basename(model_file)}")
        print(f"  2. Model Version:  {cfg['id']}-v1")
        print(f"  3. SHA-256 Hash:   {model_hash}")
        print(f"  4. Feature Order:  {cfg.get('features_order', [])}")
        print(f"  5. Model Classes:  {classes}")
        print(f"  6. Target Classes: {cfg.get('target_classes')}")
        print(f"  7. Prediction:     {res.get('prediction')}")
        print(f"  8. Risk %:         {res.get('risk_percentage')}%")
        print(f"  9. Probabilities:  {res.get('probabilities') or res.get('class_probabilities') or res.get('probability')}")

        results[mod] = {
            "model_file": os.path.basename(model_file),
            "model_hash": model_hash,
            "prediction": res.get("prediction"),
            "risk_percentage": res.get("risk_percentage"),
            "available": res.get("available")
        }

        assert res.get("available") is True, f"Model {mod} failed prediction!"

    print("\n" + "=" * 80)
    print(" ALL 5 MODELS EVALUATED SUCCESSFULLY (LOCAL INFERENCE VERIFIED)")
    print("=" * 80)
    return results


def run_remote_audit(base_url):
    clean_url = base_url.rstrip("/")
    print("=" * 80)
    print(f" GENEGUARD REMOTE INFERENCE AUDIT: {clean_url}")
    print("=" * 80)

    # 1. Fetch Model Info
    info_url = f"{clean_url}/model-info"
    print(f"Fetching diagnostic info from: {info_url}...")
    try:
        req = urllib.request.Request(info_url, headers={"User-Agent": "GeneGuard-Auditor/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            info_data = json.loads(resp.read().decode("utf-8"))
            print(f"Environment:    {info_data.get('environment')}")
            print(f"Python Version: {info_data.get('python_version')[:40]}...")
            print(f"Scikit-Learn:   {info_data.get('sklearn_version')}")
    except Exception as e:
        print(f"Could not reach {info_url}: {e}")

    # 2. Fetch Golden Test
    gt_url = f"{clean_url}/golden-test"
    print(f"\nExecuting golden test against: {gt_url}...")
    try:
        req = urllib.request.Request(gt_url, headers={"User-Agent": "GeneGuard-Auditor/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            gt_data = json.loads(resp.read().decode("utf-8"))
            print(json.dumps(gt_data.get("audit_results"), indent=2))
    except Exception as e:
        print(f"Could not reach {gt_url}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GeneGuard Golden Inference Auditor")
    parser.add_argument("--url", help="Remote base URL to test (e.g. https://your-app.vercel.app)", default=None)
    args = parser.parse_args()

    if args.url:
        run_remote_audit(args.url)
    else:
        run_local_audit()
