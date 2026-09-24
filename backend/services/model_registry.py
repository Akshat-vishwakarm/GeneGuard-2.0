"""
GeneGuard Internal Model Registry & Schema Definition
------------------------------------------------------
Authoritative metadata registry based on empirical inspection of all 5 disease-model folders:
- cardiovascular/
- matabolic/
- bloop presure/
- thyroid/
- cancer/
"""

import os

# Base directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_REGISTRY = {
    "cardiovascular": {
        "id": "cardiovascular",
        "name": "Cardiovascular Analysis",
        "description": "Cardiovascular disease risk signal analysis using multi-factor clinical parameters.",
        "model_file": os.path.join(BASE_DIR, "cardiovascular", "cardiovascular_model.pkl"),
        "threshold_file": os.path.join(BASE_DIR, "cardiovascular", "cardiovascular_threshold.pkl"),
        "features_file": os.path.join(BASE_DIR, "cardiovascular", "cardiovascular_features.pkl"),
        "model_type": "scikit-learn Pipeline (ColumnTransformer + RandomForestClassifier)",
        "features_order": [
            "age_years", "gender", "height", "weight", "ap_hi", "ap_lo",
            "cholesterol", "gluc", "smoke", "alco", "active",
            "bmi", "pulse_pressure", "bp_ratio"
        ],
        "preprocessing": "StandardScaler (num), OneHotEncoder (cat), engineered BMI, pulse pressure, & BP ratio",
        "target_classes": {0: "Lower Predicted Risk", 1: "Elevated Predicted Risk"},
        "supports_probability": True,
        "supports_shap": True,
        "ui_features": [
            {
                "key": "age",
                "label": "Age",
                "type": "number",
                "required": True,
                "unit": "years",
                "min": 1,
                "max": 120,
                "description": "Patient age in years",
                "maps_to": "age_years"
            },
            {
                "key": "gender",
                "label": "Gender",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "female", "label": "Female", "code": 1},
                    {"value": "male", "label": "Male", "code": 2}
                ],
                "maps_to": "gender"
            },
            {
                "key": "height",
                "label": "Height",
                "type": "number_unit",
                "required": True,
                "default_unit": "cm",
                "supported_units": ["cm", "ft_in"],
                "min": 50,
                "max": 250,
                "description": "Height (convertible between cm and feet/inches)",
                "maps_to": "height"
            },
            {
                "key": "weight",
                "label": "Weight",
                "type": "number_unit",
                "required": True,
                "default_unit": "kg",
                "supported_units": ["kg", "lbs"],
                "min": 20,
                "max": 350,
                "description": "Weight (convertible between kg and lbs)",
                "maps_to": "weight"
            },
            {
                "key": "ap_hi",
                "label": "Systolic Blood Pressure",
                "type": "number",
                "required": True,
                "unit": "mmHg",
                "min": 60,
                "max": 250,
                "description": "Peak pressure during heart contraction",
                "maps_to": "ap_hi"
            },
            {
                "key": "ap_lo",
                "label": "Diastolic Blood Pressure",
                "type": "number",
                "required": True,
                "unit": "mmHg",
                "min": 30,
                "max": 180,
                "description": "Pressure when heart rests between beats",
                "maps_to": "ap_lo"
            },
            {
                "key": "cholesterol",
                "label": "Cholesterol Level",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "normal", "label": "Normal (<200 mg/dL)", "code": 1},
                    {"value": "above_normal", "label": "Above Normal (200-239 mg/dL)", "code": 2},
                    {"value": "high", "label": "High (≥240 mg/dL)", "code": 3}
                ],
                "maps_to": "cholesterol"
            },
            {
                "key": "gluc",
                "label": "Glucose Level",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "normal", "label": "Normal (<100 mg/dL)", "code": 1},
                    {"value": "above_normal", "label": "Above Normal (100-125 mg/dL)", "code": 2},
                    {"value": "high", "label": "High (≥126 mg/dL)", "code": 3}
                ],
                "maps_to": "gluc"
            },
            {
                "key": "smoke",
                "label": "Tobacco Smoking",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "no", "label": "Non-Smoker", "code": 0},
                    {"value": "yes", "label": "Smoker", "code": 1}
                ],
                "maps_to": "smoke"
            },
            {
                "key": "alco",
                "label": "Alcohol Intake",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "no", "label": "No / Minimal", "code": 0},
                    {"value": "yes", "label": "Regular Consumption", "code": 1}
                ],
                "maps_to": "alco"
            },
            {
                "key": "active",
                "label": "Physical Activity Level",
                "type": "select",
                "required": True,
                "options": [
                    {"value": "yes", "label": "Physically Active (Regular Exercise)", "code": 1},
                    {"value": "no", "label": "Sedentary / Inactive", "code": 0}
                ],
                "maps_to": "active"
            }
        ]
    },

    "metabolic": {
        "id": "metabolic",
        "name": "Metabolic Analysis",
        "description": "Evaluation of metabolic syndrome risk based on blood glucose, lipid panel, and body composition.",
        "model_file": os.path.join(BASE_DIR, "matabolic", "model", "metabolic_model.pkl"),
        "scaler_file": os.path.join(BASE_DIR, "matabolic", "model", "scaler.pkl"),
        "model_type": "RandomForestClassifier with StandardScaler",
        "features_order": [
            "Age (years)", "Height (cm)", "Waist Circumference Pre (cm)", "BMI Pre",
            "Body Fat Pre (kg)", "Skeletal Muscle Pre (kg)", "Total Cholesterol Pre (mg/dL)",
            "Triglycerides Pre (mg/dL)", "LDL Pre (mg/dL)", "HDL Pre (mg/dL)",
            "Systolic BP Pre (mmHg)", "Diastolic BP Pre (mmHg)", "Fasting Glucose Pre (mg/dL)",
            "Fasting Insulin Pre (uIU/mL)", "HOMA-IR Pre"
        ],
        "preprocessing": "StandardScaler fitted on training data",
        "target_classes": {0: "Remission / Lower Risk", 1: "Active Metabolic Syndrome Signal"},
        "supports_probability": True,
        "supports_shap": False,
        "ui_features": [
            {
                "key": "age",
                "label": "Age",
                "type": "number",
                "required": True,
                "unit": "years",
                "min": 18,
                "max": 100,
                "maps_to": "Age (years)"
            },
            {
                "key": "height",
                "label": "Height",
                "type": "number",
                "required": True,
                "unit": "cm",
                "min": 100,
                "max": 230,
                "maps_to": "Height (cm)"
            },
            {
                "key": "waist",
                "label": "Waist Circumference",
                "type": "number",
                "required": True,
                "unit": "cm",
                "min": 50,
                "max": 200,
                "maps_to": "Waist Circumference Pre (cm)"
            },
            {
                "key": "weight",
                "label": "Weight (for BMI)",
                "type": "number",
                "required": True,
                "unit": "kg",
                "min": 30,
                "max": 250,
                "maps_to": "BMI Pre"  # Used to compute BMI Pre = weight / (height/100)^2
            },
            {
                "key": "body_fat",
                "label": "Body Fat Mass",
                "type": "number",
                "required": True,
                "unit": "kg",
                "min": 5,
                "max": 100,
                "maps_to": "Body Fat Pre (kg)"
            },
            {
                "key": "skeletal_muscle",
                "label": "Skeletal Muscle Mass",
                "type": "number",
                "required": True,
                "unit": "kg",
                "min": 10,
                "max": 80,
                "maps_to": "Skeletal Muscle Pre (kg)"
            },
            {
                "key": "total_cholesterol",
                "label": "Total Cholesterol",
                "type": "number",
                "required": True,
                "unit": "mg/dL",
                "min": 100,
                "max": 500,
                "maps_to": "Total Cholesterol Pre (mg/dL)"
            },
            {
                "key": "triglycerides",
                "label": "Triglycerides",
                "type": "number",
                "required": True,
                "unit": "mg/dL",
                "min": 50,
                "max": 800,
                "maps_to": "Triglycerides Pre (mg/dL)"
            },
            {
                "key": "ldl",
                "label": "LDL Cholesterol",
                "type": "number",
                "required": True,
                "unit": "mg/dL",
                "min": 30,
                "max": 400,
                "maps_to": "LDL Pre (mg/dL)"
            },
            {
                "key": "hdl",
                "label": "HDL Cholesterol",
                "type": "number",
                "required": True,
                "unit": "mg/dL",
                "min": 15,
                "max": 120,
                "maps_to": "HDL Pre (mg/dL)"
            },
            {
                "key": "sys_bp",
                "label": "Systolic Blood Pressure",
                "type": "number",
                "required": True,
                "unit": "mmHg",
                "min": 70,
                "max": 230,
                "maps_to": "Systolic BP Pre (mmHg)"
            },
            {
                "key": "dia_bp",
                "label": "Diastolic Blood Pressure",
                "type": "number",
                "required": True,
                "unit": "mmHg",
                "min": 40,
                "max": 150,
                "maps_to": "Diastolic BP Pre (mmHg)"
            },
            {
                "key": "fasting_glucose",
                "label": "Fasting Glucose",
                "type": "number",
                "required": True,
                "unit": "mg/dL",
                "min": 60,
                "max": 350,
                "maps_to": "Fasting Glucose Pre (mg/dL)"
            },
            {
                "key": "fasting_insulin",
                "label": "Fasting Insulin",
                "type": "number",
                "required": True,
                "unit": "μIU/mL",
                "min": 2,
                "max": 80,
                "maps_to": "Fasting Insulin Pre (uIU/mL)"
            }
        ]
    },

    "blood_pressure": {
        "id": "blood_pressure",
        "name": "Blood Pressure Analysis",
        "description": "Hypertension and blood pressure abnormality risk model based on clinical factors, lifestyle, and lab markers.",
        "model_file": os.path.join(BASE_DIR, "bloop presure", "models", "blood_pressure_model.pkl"),
        "metadata_file": os.path.join(BASE_DIR, "bloop presure", "models", "blood_pressure_metadata.pkl"),
        "model_type": "Pipeline (SimpleImputer + StandardScaler + Calibrated Blended Ensemble)",
        "features_order": [
            "Level_of_Hemoglobin", "Genetic_Pedigree_Coefficient", "Age", "BMI", "Sex",
            "Pregnancy", "Smoking", "Physical_activity", "salt_content_in_the_diet",
            "alcohol_consumption_per_day", "Level_of_Stress", "Chronic_kidney_disease",
            "Adrenal_and_thyroid_disorders"
        ],
        "preprocessing": "SimpleImputer(strategy='median') + StandardScaler fitted in Pipeline",
        "target_classes": {0: "Normal BP Signal", 1: "Hypertension / BP Abnormality Risk"},
        "supports_probability": True,
        "supports_shap": False,
        "ui_features": [
            {
                "key": "hemoglobin",
                "label": "Hemoglobin Level",
                "type": "number",
                "required": True,
                "unit": "g/dL",
                "min": 5.0,
                "max": 22.0,
                "description": "Hemoglobin concentration",
                "maps_to": "Level_of_Hemoglobin"
            },
            {
                "key": "genetic_coefficient",
                "label": "Genetic Pedigree Coefficient",
                "type": "number",
                "required": True,
                "unit": "scale (0-1)",
                "min": 0.0,
                "max": 1.0,
                "step": 0.01,
                "description": "Family history risk coefficient (0.0 to 1.0)",
                "maps_to": "Genetic_Pedigree_Coefficient"
            },
            {
                "key": "age",
                "label": "Age",
                "type": "number",
                "required": True,
                "unit": "years",
                "min": 18,
                "max": 100,
                "maps_to": "Age"
            },
            {
                "key": "bmi",
                "label": "Body Mass Index (BMI)",
                "type": "number",
                "required": True,
                "unit": "kg/m²",
                "min": 10,
                "max": 65,
                "maps_to": "BMI"
            },
            {
                "key": "sex",
                "label": "Sex",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "Female"},
                    {"value": 1, "label": "Male"}
                ],
                "maps_to": "Sex"
            },
            {
                "key": "pregnancy",
                "label": "Pregnancy Status",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No / Not Applicable"},
                    {"value": 1, "label": "Currently Pregnant"}
                ],
                "maps_to": "Pregnancy"
            },
            {
                "key": "smoking",
                "label": "Smoking Status",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "Non-Smoker"},
                    {"value": 1, "label": "Smoker"}
                ],
                "maps_to": "Smoking"
            },
            {
                "key": "physical_activity",
                "label": "Physical Activity",
                "type": "number",
                "required": True,
                "unit": "steps/day",
                "min": 500,
                "max": 50000,
                "description": "Average daily step count",
                "maps_to": "Physical_activity"
            },
            {
                "key": "salt_intake",
                "label": "Dietary Salt Intake",
                "type": "number",
                "required": True,
                "unit": "mg/day",
                "min": 100,
                "max": 50000,
                "description": "Daily sodium / salt consumption in mg",
                "maps_to": "salt_content_in_the_diet"
            },
            {
                "key": "alcohol_consumption",
                "label": "Alcohol Consumption",
                "type": "number",
                "required": True,
                "unit": "ml/day",
                "min": 0,
                "max": 500,
                "description": "Daily alcohol intake in ml",
                "maps_to": "alcohol_consumption_per_day"
            },
            {
                "key": "stress_level",
                "label": "Perceived Stress Level",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 1, "label": "Low Stress"},
                    {"value": 2, "label": "Moderate Stress"},
                    {"value": 3, "label": "High Stress"}
                ],
                "maps_to": "Level_of_Stress"
            },
            {
                "key": "chronic_kidney_disease",
                "label": "Chronic Kidney Disease",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No History"},
                    {"value": 1, "label": "Diagnosed / History"}
                ],
                "maps_to": "Chronic_kidney_disease"
            },
            {
                "key": "adrenal_thyroid_disorders",
                "label": "Adrenal / Thyroid Disorders",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No History"},
                    {"value": 1, "label": "Diagnosed / History"}
                ],
                "maps_to": "Adrenal_and_thyroid_disorders"
            }
        ]
    },

    "thyroid": {
        "id": "thyroid",
        "name": "Thyroid Analysis",
        "description": "Thyroid disorder risk prediction using hormonal lab values and clinical history.",
        "model_file": os.path.join(BASE_DIR, "thyroid", "models", "gene_guard_thyroid_pipeline.pkl"),
        "model_type": "scikit-learn Pipeline (ColumnTransformer + RandomForestClassifier)",
        "features_order": [
            "age", "sex", "on_thyroxine", "query_on_thyroxine",
            "on_antithyroid_medication", "sick", "pregnant", "thyroid_surgery",
            "i131_treatment", "query_hypothyroid", "query_hyperthyroid", "lithium",
            "goitre", "tumor", "hypopituitary", "psych", "tsh_measured", "tsh",
            "t3_measured", "t3", "tt4_measured", "tt4", "t4u_measured", "t4u",
            "fti_measured", "fti", "tbg_measured", "referral_source"
        ],
        "preprocessing": "ColumnTransformer (KNNImputer for numeric, SimpleImputer+OneHotEncoder for categorical)",
        "target_classes": {0: "Elevated Thyroid Disorder Signal", 1: "Normal Thyroid Function Signal"},
        "supports_probability": True,
        "supports_shap": False,
        "ui_features": [
            {
                "key": "sex",
                "label": "Sex",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "Female"},
                    {"value": 1, "label": "Male"}
                ],
                "maps_to": "sex"
            },
            {
                "key": "tsh",
                "label": "Thyroid Stimulating Hormone (TSH)",
                "type": "number",
                "required": True,
                "unit": "mIU/L",
                "min": 0.01,
                "max": 100.0,
                "step": 0.01,
                "description": "Serum TSH level",
                "maps_to": "tsh"
            },
            {
                "key": "t3",
                "label": "Triiodothyronine (T3)",
                "type": "number",
                "required": True,
                "unit": "nmol/L",
                "min": 0.05,
                "max": 10.0,
                "step": 0.01,
                "description": "Total serum T3 level",
                "maps_to": "t3"
            },
            {
                "key": "tt4",
                "label": "Total Thyroxine (TT4)",
                "type": "number",
                "required": True,
                "unit": "nmol/L",
                "min": 0.5,
                "max": 30.0,
                "step": 0.1,
                "description": "Total serum T4 level",
                "maps_to": "tt4"
            },
            {
                "key": "t4u",
                "label": "T4 Uptake (T4U)",
                "type": "number",
                "required": True,
                "unit": "ratio",
                "min": 0.4,
                "max": 2.5,
                "step": 0.01,
                "description": "Thyroxine binding capacity ratio",
                "maps_to": "t4u"
            },
            {
                "key": "fti",
                "label": "Free Thyroxine Index (FTI)",
                "type": "number",
                "required": False,
                "unit": "index",
                "min": 1.0,
                "max": 50.0,
                "step": 0.1,
                "description": "Computed FTI (auto-calculated as TT4 / T4U * 10 if omitted)",
                "maps_to": "fti"
            },
            {
                "key": "on_thyroxine",
                "label": "On Thyroxine Medication",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "on_thyroxine"
            },
            {
                "key": "on_antithyroid",
                "label": "On Antithyroid Medication",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "on_antithyroid_medication"
            },
            {
                "key": "pregnant",
                "label": "Pregnancy Status",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No / Not Applicable"},
                    {"value": 1, "label": "Pregnant"}
                ],
                "maps_to": "pregnant"
            },
            {
                "key": "thyroid_surgery",
                "label": "Prior Thyroid Surgery",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "thyroid_surgery"
            },
            {
                "key": "query_hypothyroid",
                "label": "Suspected Hypothyroidism",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "query_hypothyroid"
            },
            {
                "key": "query_hyperthyroid",
                "label": "Suspected Hyperthyroidism",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "query_hyperthyroid"
            },
            {
                "key": "goitre",
                "label": "Goitre Present",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "goitre"
            },
            {
                "key": "tumor",
                "label": "Thyroid Tumor / Nodule History",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 0, "label": "No"},
                    {"value": 1, "label": "Yes"}
                ],
                "maps_to": "tumor"
            }
        ]
    },

    "cancer": {
        "id": "cancer",
        "name": "Cancer Risk Analysis",
        "description": "Multi-factorial risk assessment for lung cancer based on environmental exposures, symptoms, and lifestyle.",
        "model_file": os.path.join(BASE_DIR, "cancer", "model.joblib"),
        "model_type": "RandomForestClassifier",
        "features_order": [
            "Age", "Gender", "AirPollution", "Alcoholuse", "DustAllergy",
            "OccuPationalHazards", "GeneticRisk", "chronicLungDisease", "BalancedDiet",
            "Obesity", "Smoking", "PassiveSmoker", "ChestPain", "CoughingofBlood",
            "Fatigue", "WeightLoss", "ShortnessofBreath", "Wheezing",
            "SwallowingDifficulty", "ClubbingofFingerNails", "FrequentCold",
            "DryCough", "Snoring"
        ],
        "preprocessing": "Integer severity ratings (1 to 7/8/9 scale), Gender (1=Male, 2=Female)",
        "target_classes": {0: "Low Risk Level", 1: "Medium Risk Level", 2: "High Risk Level"},
        "supports_probability": True,
        "supports_shap": False,
        "ui_features": [
            {
                "key": "age",
                "label": "Age",
                "type": "number",
                "required": True,
                "unit": "years",
                "min": 14,
                "max": 95,
                "maps_to": "Age"
            },
            {
                "key": "gender",
                "label": "Gender",
                "type": "select",
                "required": True,
                "options": [
                    {"value": 1, "label": "Male"},
                    {"value": 2, "label": "Female"}
                ],
                "maps_to": "Gender"
            },
            {
                "key": "air_pollution",
                "label": "Air Pollution Exposure",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Exposure level from 1 (Minimal) to 8 (Severe)",
                "maps_to": "AirPollution"
            },
            {
                "key": "alcohol_use",
                "label": "Alcohol Consumption Rating",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Frequency rating from 1 (None) to 8 (High)",
                "maps_to": "Alcoholuse"
            },
            {
                "key": "dust_allergy",
                "label": "Dust Allergy Severity",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Sensitivity rating from 1 (None) to 8 (Severe)",
                "maps_to": "DustAllergy"
            },
            {
                "key": "occupational_hazards",
                "label": "Occupational Hazard Exposure",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Chemicals/dust exposure rating (1 to 8)",
                "maps_to": "OccuPationalHazards"
            },
            {
                "key": "genetic_risk",
                "label": "Genetic Cancer Risk History",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Family history rating from 1 (None) to 7 (Strong)",
                "maps_to": "GeneticRisk"
            },
            {
                "key": "chronic_lung_disease",
                "label": "Chronic Lung Disease Rating",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Pre-existing condition severity (1 to 7)",
                "maps_to": "chronicLungDisease"
            },
            {
                "key": "balanced_diet",
                "label": "Balanced Diet Rating",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Dietary quality from 1 (Poor) to 7 (Optimal)",
                "maps_to": "BalancedDiet"
            },
            {
                "key": "obesity",
                "label": "Obesity Rating",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Body mass index severity rating (1 to 7)",
                "maps_to": "Obesity"
            },
            {
                "key": "smoking",
                "label": "Active Smoking Intensity",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Packs/frequency rating (1 to 8)",
                "maps_to": "Smoking"
            },
            {
                "key": "passive_smoker",
                "label": "Secondhand Smoke Exposure",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Passive exposure rating (1 to 8)",
                "maps_to": "PassiveSmoker"
            },
            {
                "key": "chest_pain",
                "label": "Chest Pain Severity",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 9,
                "description": "Discomfort rating (1 to 9)",
                "maps_to": "ChestPain"
            },
            {
                "key": "coughing_of_blood",
                "label": "Coughing up Blood (Hemoptysis)",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 9,
                "description": "Symptom severity (1 to 9)",
                "maps_to": "CoughingofBlood"
            },
            {
                "key": "fatigue",
                "label": "Unexplained Fatigue",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 9,
                "description": "Fatigue severity (1 to 9)",
                "maps_to": "Fatigue"
            },
            {
                "key": "weight_loss",
                "label": "Unintentional Weight Loss",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Weight loss severity (1 to 8)",
                "maps_to": "WeightLoss"
            },
            {
                "key": "shortness_of_breath",
                "label": "Shortness of Breath (Dyspnea)",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 9,
                "description": "Breathing difficulty rating (1 to 9)",
                "maps_to": "ShortnessofBreath"
            },
            {
                "key": "wheezing",
                "label": "Wheezing",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Wheezing severity (1 to 8)",
                "maps_to": "Wheezing"
            },
            {
                "key": "swallowing_difficulty",
                "label": "Difficulty Swallowing (Dysphagia)",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 8,
                "description": "Swallowing difficulty rating (1 to 8)",
                "maps_to": "SwallowingDifficulty"
            },
            {
                "key": "clubbing_finger_nails",
                "label": "Nail Clubbing",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 9,
                "description": "Fingernail enlargement rating (1 to 9)",
                "maps_to": "ClubbingofFingerNails"
            },
            {
                "key": "frequent_cold",
                "label": "Frequent Respiratory Infections",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Cold frequency rating (1 to 7)",
                "maps_to": "FrequentCold"
            },
            {
                "key": "dry_cough",
                "label": "Persistent Dry Cough",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Dry cough severity (1 to 7)",
                "maps_to": "DryCough"
            },
            {
                "key": "snoring",
                "label": "Loud Snoring / Sleep Apnea",
                "type": "rating",
                "required": True,
                "min": 1,
                "max": 7,
                "description": "Snoring severity rating (1 to 7)",
                "maps_to": "Snoring"
            }
        ]
    }
}
