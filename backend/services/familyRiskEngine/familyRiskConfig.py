"""
GeneGuard Family Risk Engine Configuration & Disease Registry
-------------------------------------------------------------
Defines disease-specific configurations, feature schemas, and model registry
for the Family Risk Engine. Strictly adheres to scientific integrity:
- Only features explicitly supported by each model are accepted.
- Uncalibrated / nonexistent family-aware models are marked as 'Not available'
  rather than fabricating arbitrary percentages.
"""

from typing import Dict, List, Any

# Standard 5 disease keys used in GeneGuard
DISEASES = [
    "diabetes",
    "hypertension",
    "cardiovascular",
    "thyroid",
    "cancer"
]

# Mapping between clinical disease keys and backend disease modules
DISEASE_TO_MODULE_MAP = {
    "diabetes": "metabolic",
    "hypertension": "blood_pressure",
    "cardiovascular": "cardiovascular",
    "thyroid": "thyroid",
    "cancer": "cancer"
}

MODULE_TO_DISEASE_MAP = {v: k for k, v in DISEASE_TO_MODULE_MAP.items()}

# Authoritative Family Risk Model Registry
FAMILY_RISK_REGISTRY: Dict[str, Dict[str, Any]] = {
    "diabetes": {
        "disease_key": "diabetes",
        "disease_name": "Type 2 Diabetes / Metabolic Risk",
        "module_key": "metabolic",
        "personal_model": {
            "name": "Gradient Boosting Metabolic Classifier",
            "status": "Available",
            "version": "metabolic-gb-v1",
            "calibration_status": "Calibrated"
        },
        "family_aware_model": {
            "name": "Family-Aware Metabolic Integration",
            "status": "Not available",  # Underlying model was trained on Kaggle metabolic panel without family covariates
            "version": None,
            "calibration_status": "N/A",
            "supported_features": [
                "father_diabetes",
                "mother_diabetes",
                "sibling_diabetes",
                "paternal_grandfather_diabetes",
                "paternal_grandmother_diabetes",
                "maternal_grandfather_diabetes",
                "maternal_grandmother_diabetes",
                "first_degree_affected_count",
                "second_degree_affected_count"
            ],
            "fallback_behavior": "qualitative_signal_only"
        }
    },
    "hypertension": {
        "disease_key": "hypertension",
        "disease_name": "Hypertension / Blood Pressure Abnormality",
        "module_key": "blood_pressure",
        "personal_model": {
            "name": "Hypertension Biometrics Pipeline",
            "status": "Available",
            "version": "blood-pressure-rf-v1",
            "calibration_status": "Calibrated"
        },
        "family_aware_model": {
            "name": "Family-Aware Hypertension Estimator",
            "status": "Not available",
            "version": None,
            "calibration_status": "N/A",
            "supported_features": [
                "father_hypertension",
                "mother_hypertension",
                "sibling_hypertension",
                "first_degree_affected_count",
                "second_degree_affected_count",
                "both_parents_affected"
            ],
            "fallback_behavior": "qualitative_signal_only"
        }
    },
    "cardiovascular": {
        "disease_key": "cardiovascular",
        "disease_name": "Cardiovascular Disease",
        "module_key": "cardiovascular",
        "personal_model": {
            "name": "Random Forest Cardiovascular Classifier (70k cohort)",
            "status": "Available",
            "version": "cvd-rf-v1",
            "calibration_status": "Calibrated"
        },
        "family_aware_model": {
            "name": "Family-Aware Cardiovascular Estimator",
            "status": "Not available",  # Trained on 70k CVD dataset without pedigree variables
            "version": None,
            "calibration_status": "N/A",
            "supported_features": [
                "father_cardiovascular",
                "mother_cardiovascular",
                "sibling_cardiovascular",
                "paternal_grandfather_cardiovascular",
                "maternal_grandfather_cardiovascular",
                "first_degree_affected_count",
                "second_degree_affected_count"
            ],
            "fallback_behavior": "qualitative_signal_only"
        }
    },
    "thyroid": {
        "disease_key": "thyroid",
        "disease_name": "Thyroid Disorder Risk",
        "module_key": "thyroid",
        "personal_model": {
            "name": "Calibrated Random Forest Pipeline (UCI cohort)",
            "status": "Available",
            "version": "thyroid-calibrated-rf-v2",
            "calibration_status": "Calibrated (Brier Score 0.003)"
        },
        "family_aware_model": {
            "name": "Family-Aware Thyroid Estimator",
            "status": "Not available",  # UCI dataset does not include familial lineage features
            "version": None,
            "calibration_status": "N/A",
            "supported_features": [
                "father_thyroid",
                "mother_thyroid",
                "sibling_thyroid",
                "first_degree_affected_count",
                "second_degree_affected_count"
            ],
            "fallback_behavior": "qualitative_signal_only"
        }
    },
    "cancer": {
        "disease_key": "cancer",
        "disease_name": "Neoplastic / Cancer Risk",
        "module_key": "cancer",
        "personal_model": {
            "name": "Multinomial Respiratory / Oncologic Classifier",
            "status": "Available",
            "version": "cancer-multinomial-v1",
            "calibration_status": "Calibrated"
        },
        "family_aware_model": {
            "name": "Pedigree Familial Malignancy Risk Engine",
            "status": "Available",
            "version": "cancer-pedigree-v1",
            "calibration_status": "Research Prototype",
            "supported_features": [
                "father_cancer",
                "mother_cancer",
                "sibling_cancer",
                "first_degree_affected_count",
                "second_degree_affected_count",
                "affected_parent_count",
                "genetic_risk"
            ],
            "fallback_behavior": "evaluate_model"
        }
    }
}
