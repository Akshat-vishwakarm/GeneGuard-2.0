/**
 * GeneGuard Default Model Schemas
 * Serves as an instant client-side fallback so the app loads immediately
 * even before/without a remote backend connection.
 */

export const DEFAULT_MODEL_SCHEMAS = {
  "blood_pressure": {
    "description": "Hypertension and blood pressure abnormality risk model based on clinical factors, lifestyle, and lab markers.",
    "features_order": [
      "Level_of_Hemoglobin",
      "Genetic_Pedigree_Coefficient",
      "Age",
      "BMI",
      "Sex",
      "Pregnancy",
      "Smoking",
      "Physical_activity",
      "salt_content_in_the_diet",
      "alcohol_consumption_per_day",
      "Level_of_Stress",
      "Chronic_kidney_disease",
      "Adrenal_and_thyroid_disorders"
    ],
    "id": "blood_pressure",
    "metadata_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\bloop presure\\models\\blood_pressure_metadata.pkl",
    "model_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\bloop presure\\models\\blood_pressure_model.pkl",
    "model_type": "Pipeline (SimpleImputer + StandardScaler + Calibrated Blended Ensemble)",
    "name": "Blood Pressure Analysis",
    "preprocessing": "SimpleImputer(strategy='median') + StandardScaler fitted in Pipeline",
    "supports_probability": true,
    "supports_shap": false,
    "target_classes": {
      "0": "Normal BP Signal",
      "1": "Hypertension / BP Abnormality Risk"
    },
    "ui_features": [
      {
        "description": "Hemoglobin concentration",
        "key": "hemoglobin",
        "label": "Hemoglobin Level",
        "maps_to": "Level_of_Hemoglobin",
        "max": 22.0,
        "min": 5.0,
        "required": true,
        "type": "number",
        "unit": "g/dL"
      },
      {
        "description": "Family history risk coefficient (0.0 to 1.0)",
        "key": "genetic_coefficient",
        "label": "Genetic Pedigree Coefficient",
        "maps_to": "Genetic_Pedigree_Coefficient",
        "max": 1.0,
        "min": 0.0,
        "required": true,
        "step": 0.01,
        "type": "number",
        "unit": "scale (0-1)"
      },
      {
        "key": "age",
        "label": "Age",
        "maps_to": "Age",
        "max": 100,
        "min": 18,
        "required": true,
        "type": "number",
        "unit": "years"
      },
      {
        "key": "bmi",
        "label": "Body Mass Index (BMI)",
        "maps_to": "BMI",
        "max": 65,
        "min": 10,
        "required": true,
        "type": "number",
        "unit": "kg/m\u00b2"
      },
      {
        "key": "sex",
        "label": "Sex",
        "maps_to": "Sex",
        "options": [
          {
            "label": "Female",
            "value": 0
          },
          {
            "label": "Male",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "pregnancy",
        "label": "Pregnancy Status",
        "maps_to": "Pregnancy",
        "options": [
          {
            "label": "No / Not Applicable",
            "value": 0
          },
          {
            "label": "Currently Pregnant",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "smoking",
        "label": "Smoking Status",
        "maps_to": "Smoking",
        "options": [
          {
            "label": "Non-Smoker",
            "value": 0
          },
          {
            "label": "Smoker",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "description": "Average daily step count",
        "key": "physical_activity",
        "label": "Physical Activity",
        "maps_to": "Physical_activity",
        "max": 50000,
        "min": 500,
        "required": true,
        "type": "number",
        "unit": "steps/day"
      },
      {
        "description": "Daily sodium / salt consumption in mg",
        "key": "salt_intake",
        "label": "Dietary Salt Intake",
        "maps_to": "salt_content_in_the_diet",
        "max": 50000,
        "min": 100,
        "required": true,
        "type": "number",
        "unit": "mg/day"
      },
      {
        "description": "Daily alcohol intake in ml",
        "key": "alcohol_consumption",
        "label": "Alcohol Consumption",
        "maps_to": "alcohol_consumption_per_day",
        "max": 500,
        "min": 0,
        "required": true,
        "type": "number",
        "unit": "ml/day"
      },
      {
        "key": "stress_level",
        "label": "Perceived Stress Level",
        "maps_to": "Level_of_Stress",
        "options": [
          {
            "label": "Low Stress",
            "value": 1
          },
          {
            "label": "Moderate Stress",
            "value": 2
          },
          {
            "label": "High Stress",
            "value": 3
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "chronic_kidney_disease",
        "label": "Chronic Kidney Disease",
        "maps_to": "Chronic_kidney_disease",
        "options": [
          {
            "label": "No History",
            "value": 0
          },
          {
            "label": "Diagnosed / History",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "adrenal_thyroid_disorders",
        "label": "Adrenal / Thyroid Disorders",
        "maps_to": "Adrenal_and_thyroid_disorders",
        "options": [
          {
            "label": "No History",
            "value": 0
          },
          {
            "label": "Diagnosed / History",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      }
    ]
  },
  "cancer": {
    "description": "Multi-factorial risk assessment for lung cancer based on environmental exposures, symptoms, and lifestyle.",
    "features_order": [
      "Age",
      "Gender",
      "AirPollution",
      "Alcoholuse",
      "DustAllergy",
      "OccuPationalHazards",
      "GeneticRisk",
      "chronicLungDisease",
      "BalancedDiet",
      "Obesity",
      "Smoking",
      "PassiveSmoker",
      "ChestPain",
      "CoughingofBlood",
      "Fatigue",
      "WeightLoss",
      "ShortnessofBreath",
      "Wheezing",
      "SwallowingDifficulty",
      "ClubbingofFingerNails",
      "FrequentCold",
      "DryCough",
      "Snoring"
    ],
    "id": "cancer",
    "model_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\cancer\\model.joblib",
    "model_type": "RandomForestClassifier",
    "name": "Cancer Risk Analysis",
    "preprocessing": "Integer severity ratings (1 to 7/8/9 scale), Gender (1=Male, 2=Female)",
    "supports_probability": true,
    "supports_shap": false,
    "target_classes": {
      "0": "Low Risk Level",
      "1": "Medium Risk Level",
      "2": "High Risk Level"
    },
    "ui_features": [
      {
        "key": "age",
        "label": "Age",
        "maps_to": "Age",
        "max": 95,
        "min": 14,
        "required": true,
        "type": "number",
        "unit": "years"
      },
      {
        "key": "gender",
        "label": "Gender",
        "maps_to": "Gender",
        "options": [
          {
            "label": "Male",
            "value": 1
          },
          {
            "label": "Female",
            "value": 2
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "description": "Exposure level from 1 (Minimal) to 8 (Severe)",
        "key": "air_pollution",
        "label": "Air Pollution Exposure",
        "maps_to": "AirPollution",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Frequency rating from 1 (None) to 8 (High)",
        "key": "alcohol_use",
        "label": "Alcohol Consumption Rating",
        "maps_to": "Alcoholuse",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Sensitivity rating from 1 (None) to 8 (Severe)",
        "key": "dust_allergy",
        "label": "Dust Allergy Severity",
        "maps_to": "DustAllergy",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Chemicals/dust exposure rating (1 to 8)",
        "key": "occupational_hazards",
        "label": "Occupational Hazard Exposure",
        "maps_to": "OccuPationalHazards",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Family history rating from 1 (None) to 7 (Strong)",
        "key": "genetic_risk",
        "label": "Genetic Cancer Risk History",
        "maps_to": "GeneticRisk",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Pre-existing condition severity (1 to 7)",
        "key": "chronic_lung_disease",
        "label": "Chronic Lung Disease Rating",
        "maps_to": "chronicLungDisease",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Dietary quality from 1 (Poor) to 7 (Optimal)",
        "key": "balanced_diet",
        "label": "Balanced Diet Rating",
        "maps_to": "BalancedDiet",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Body mass index severity rating (1 to 7)",
        "key": "obesity",
        "label": "Obesity Rating",
        "maps_to": "Obesity",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Packs/frequency rating (1 to 8)",
        "key": "smoking",
        "label": "Active Smoking Intensity",
        "maps_to": "Smoking",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Passive exposure rating (1 to 8)",
        "key": "passive_smoker",
        "label": "Secondhand Smoke Exposure",
        "maps_to": "PassiveSmoker",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Discomfort rating (1 to 9)",
        "key": "chest_pain",
        "label": "Chest Pain Severity",
        "maps_to": "ChestPain",
        "max": 9,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Symptom severity (1 to 9)",
        "key": "coughing_of_blood",
        "label": "Coughing up Blood (Hemoptysis)",
        "maps_to": "CoughingofBlood",
        "max": 9,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Fatigue severity (1 to 9)",
        "key": "fatigue",
        "label": "Unexplained Fatigue",
        "maps_to": "Fatigue",
        "max": 9,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Weight loss severity (1 to 8)",
        "key": "weight_loss",
        "label": "Unintentional Weight Loss",
        "maps_to": "WeightLoss",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Breathing difficulty rating (1 to 9)",
        "key": "shortness_of_breath",
        "label": "Shortness of Breath (Dyspnea)",
        "maps_to": "ShortnessofBreath",
        "max": 9,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Wheezing severity (1 to 8)",
        "key": "wheezing",
        "label": "Wheezing",
        "maps_to": "Wheezing",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Swallowing difficulty rating (1 to 8)",
        "key": "swallowing_difficulty",
        "label": "Difficulty Swallowing (Dysphagia)",
        "maps_to": "SwallowingDifficulty",
        "max": 8,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Fingernail enlargement rating (1 to 9)",
        "key": "clubbing_finger_nails",
        "label": "Nail Clubbing",
        "maps_to": "ClubbingofFingerNails",
        "max": 9,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Cold frequency rating (1 to 7)",
        "key": "frequent_cold",
        "label": "Frequent Respiratory Infections",
        "maps_to": "FrequentCold",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Dry cough severity (1 to 7)",
        "key": "dry_cough",
        "label": "Persistent Dry Cough",
        "maps_to": "DryCough",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      },
      {
        "description": "Snoring severity rating (1 to 7)",
        "key": "snoring",
        "label": "Loud Snoring / Sleep Apnea",
        "maps_to": "Snoring",
        "max": 7,
        "min": 1,
        "required": true,
        "type": "rating"
      }
    ]
  },
  "cardiovascular": {
    "description": "Cardiovascular disease risk signal analysis using multi-factor clinical parameters.",
    "features_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\cardiovascular\\cardiovascular_features.pkl",
    "features_order": [
      "age_years",
      "gender",
      "height",
      "weight",
      "ap_hi",
      "ap_lo",
      "cholesterol",
      "gluc",
      "smoke",
      "alco",
      "active",
      "bmi",
      "pulse_pressure",
      "bp_ratio"
    ],
    "id": "cardiovascular",
    "model_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\cardiovascular\\cardiovascular_model.pkl",
    "model_type": "scikit-learn Pipeline (ColumnTransformer + RandomForestClassifier)",
    "name": "Cardiovascular Analysis",
    "preprocessing": "StandardScaler (num), OneHotEncoder (cat), engineered BMI, pulse pressure, & BP ratio",
    "supports_probability": true,
    "supports_shap": true,
    "target_classes": {
      "0": "Lower Predicted Risk",
      "1": "Elevated Predicted Risk"
    },
    "threshold_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\cardiovascular\\cardiovascular_threshold.pkl",
    "ui_features": [
      {
        "description": "Patient age in years",
        "key": "age",
        "label": "Age",
        "maps_to": "age_years",
        "max": 120,
        "min": 1,
        "required": true,
        "type": "number",
        "unit": "years"
      },
      {
        "key": "gender",
        "label": "Gender",
        "maps_to": "gender",
        "options": [
          {
            "code": 1,
            "label": "Female",
            "value": "female"
          },
          {
            "code": 2,
            "label": "Male",
            "value": "male"
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "default_unit": "cm",
        "description": "Height (convertible between cm and feet/inches)",
        "key": "height",
        "label": "Height",
        "maps_to": "height",
        "max": 250,
        "min": 50,
        "required": true,
        "supported_units": [
          "cm",
          "ft_in"
        ],
        "type": "number_unit"
      },
      {
        "default_unit": "kg",
        "description": "Weight (convertible between kg and lbs)",
        "key": "weight",
        "label": "Weight",
        "maps_to": "weight",
        "max": 350,
        "min": 20,
        "required": true,
        "supported_units": [
          "kg",
          "lbs"
        ],
        "type": "number_unit"
      },
      {
        "description": "Peak pressure during heart contraction",
        "key": "ap_hi",
        "label": "Systolic Blood Pressure",
        "maps_to": "ap_hi",
        "max": 250,
        "min": 60,
        "required": true,
        "type": "number",
        "unit": "mmHg"
      },
      {
        "description": "Pressure when heart rests between beats",
        "key": "ap_lo",
        "label": "Diastolic Blood Pressure",
        "maps_to": "ap_lo",
        "max": 180,
        "min": 30,
        "required": true,
        "type": "number",
        "unit": "mmHg"
      },
      {
        "key": "cholesterol",
        "label": "Cholesterol Level",
        "maps_to": "cholesterol",
        "options": [
          {
            "code": 1,
            "label": "Normal (<200 mg/dL)",
            "value": "normal"
          },
          {
            "code": 2,
            "label": "Above Normal (200-239 mg/dL)",
            "value": "above_normal"
          },
          {
            "code": 3,
            "label": "High (\u2265240 mg/dL)",
            "value": "high"
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "gluc",
        "label": "Glucose Level",
        "maps_to": "gluc",
        "options": [
          {
            "code": 1,
            "label": "Normal (<100 mg/dL)",
            "value": "normal"
          },
          {
            "code": 2,
            "label": "Above Normal (100-125 mg/dL)",
            "value": "above_normal"
          },
          {
            "code": 3,
            "label": "High (\u2265126 mg/dL)",
            "value": "high"
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "smoke",
        "label": "Tobacco Smoking",
        "maps_to": "smoke",
        "options": [
          {
            "code": 0,
            "label": "Non-Smoker",
            "value": "no"
          },
          {
            "code": 1,
            "label": "Smoker",
            "value": "yes"
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "alco",
        "label": "Alcohol Intake",
        "maps_to": "alco",
        "options": [
          {
            "code": 0,
            "label": "No / Minimal",
            "value": "no"
          },
          {
            "code": 1,
            "label": "Regular Consumption",
            "value": "yes"
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "active",
        "label": "Physical Activity Level",
        "maps_to": "active",
        "options": [
          {
            "code": 1,
            "label": "Physically Active (Regular Exercise)",
            "value": "yes"
          },
          {
            "code": 0,
            "label": "Sedentary / Inactive",
            "value": "no"
          }
        ],
        "required": true,
        "type": "select"
      }
    ]
  },
  "metabolic": {
    "description": "Evaluation of metabolic syndrome risk based on blood glucose, lipid panel, and body composition.",
    "features_order": [
      "Age (years)",
      "Height (cm)",
      "Waist Circumference Pre (cm)",
      "BMI Pre",
      "Body Fat Pre (kg)",
      "Skeletal Muscle Pre (kg)",
      "Total Cholesterol Pre (mg/dL)",
      "Triglycerides Pre (mg/dL)",
      "LDL Pre (mg/dL)",
      "HDL Pre (mg/dL)",
      "Systolic BP Pre (mmHg)",
      "Diastolic BP Pre (mmHg)",
      "Fasting Glucose Pre (mg/dL)",
      "Fasting Insulin Pre (uIU/mL)",
      "HOMA-IR Pre"
    ],
    "id": "metabolic",
    "model_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\matabolic\\model\\metabolic_model.pkl",
    "model_type": "RandomForestClassifier with StandardScaler",
    "name": "Metabolic Analysis",
    "preprocessing": "StandardScaler fitted on training data",
    "scaler_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\matabolic\\model\\scaler.pkl",
    "supports_probability": true,
    "supports_shap": false,
    "target_classes": {
      "0": "Remission / Lower Risk",
      "1": "Active Metabolic Syndrome Signal"
    },
    "ui_features": [
      {
        "key": "age",
        "label": "Age",
        "maps_to": "Age (years)",
        "max": 100,
        "min": 18,
        "required": true,
        "type": "number",
        "unit": "years"
      },
      {
        "key": "height",
        "label": "Height",
        "maps_to": "Height (cm)",
        "max": 230,
        "min": 100,
        "required": true,
        "type": "number",
        "unit": "cm"
      },
      {
        "key": "waist",
        "label": "Waist Circumference",
        "maps_to": "Waist Circumference Pre (cm)",
        "max": 200,
        "min": 50,
        "required": true,
        "type": "number",
        "unit": "cm"
      },
      {
        "key": "weight",
        "label": "Weight (for BMI)",
        "maps_to": "BMI Pre",
        "max": 250,
        "min": 30,
        "required": true,
        "type": "number",
        "unit": "kg"
      },
      {
        "key": "body_fat",
        "label": "Body Fat Mass",
        "maps_to": "Body Fat Pre (kg)",
        "max": 100,
        "min": 5,
        "required": true,
        "type": "number",
        "unit": "kg"
      },
      {
        "key": "skeletal_muscle",
        "label": "Skeletal Muscle Mass",
        "maps_to": "Skeletal Muscle Pre (kg)",
        "max": 80,
        "min": 10,
        "required": true,
        "type": "number",
        "unit": "kg"
      },
      {
        "key": "total_cholesterol",
        "label": "Total Cholesterol",
        "maps_to": "Total Cholesterol Pre (mg/dL)",
        "max": 500,
        "min": 100,
        "required": true,
        "type": "number",
        "unit": "mg/dL"
      },
      {
        "key": "triglycerides",
        "label": "Triglycerides",
        "maps_to": "Triglycerides Pre (mg/dL)",
        "max": 800,
        "min": 50,
        "required": true,
        "type": "number",
        "unit": "mg/dL"
      },
      {
        "key": "ldl",
        "label": "LDL Cholesterol",
        "maps_to": "LDL Pre (mg/dL)",
        "max": 400,
        "min": 30,
        "required": true,
        "type": "number",
        "unit": "mg/dL"
      },
      {
        "key": "hdl",
        "label": "HDL Cholesterol",
        "maps_to": "HDL Pre (mg/dL)",
        "max": 120,
        "min": 15,
        "required": true,
        "type": "number",
        "unit": "mg/dL"
      },
      {
        "key": "sys_bp",
        "label": "Systolic Blood Pressure",
        "maps_to": "Systolic BP Pre (mmHg)",
        "max": 230,
        "min": 70,
        "required": true,
        "type": "number",
        "unit": "mmHg"
      },
      {
        "key": "dia_bp",
        "label": "Diastolic Blood Pressure",
        "maps_to": "Diastolic BP Pre (mmHg)",
        "max": 150,
        "min": 40,
        "required": true,
        "type": "number",
        "unit": "mmHg"
      },
      {
        "key": "fasting_glucose",
        "label": "Fasting Glucose",
        "maps_to": "Fasting Glucose Pre (mg/dL)",
        "max": 350,
        "min": 60,
        "required": true,
        "type": "number",
        "unit": "mg/dL"
      },
      {
        "key": "fasting_insulin",
        "label": "Fasting Insulin",
        "maps_to": "Fasting Insulin Pre (uIU/mL)",
        "max": 80,
        "min": 2,
        "required": true,
        "type": "number",
        "unit": "\u03bcIU/mL"
      }
    ]
  },
  "thyroid": {
    "description": "Thyroid disorder risk prediction using hormonal lab values and clinical history.",
    "features_order": [
      "age",
      "sex",
      "on_thyroxine",
      "query_on_thyroxine",
      "on_antithyroid_medication",
      "sick",
      "pregnant",
      "thyroid_surgery",
      "i131_treatment",
      "query_hypothyroid",
      "query_hyperthyroid",
      "lithium",
      "goitre",
      "tumor",
      "hypopituitary",
      "psych",
      "tsh_measured",
      "tsh",
      "t3_measured",
      "t3",
      "tt4_measured",
      "tt4",
      "t4u_measured",
      "t4u",
      "fti_measured",
      "fti",
      "tbg_measured",
      "referral_source"
    ],
    "id": "thyroid",
    "model_file": "C:\\Users\\Akshat\\Downloads\\New folder (2)\\thyroid\\models\\gene_guard_thyroid_pipeline.pkl",
    "model_type": "scikit-learn Pipeline (ColumnTransformer + RandomForestClassifier)",
    "name": "Thyroid Analysis",
    "preprocessing": "ColumnTransformer (KNNImputer for numeric, SimpleImputer+OneHotEncoder for categorical)",
    "supports_probability": true,
    "supports_shap": false,
    "target_classes": {
      "0": "Elevated Thyroid Disorder Signal",
      "1": "Normal Thyroid Function Signal"
    },
    "ui_features": [
      {
        "key": "sex",
        "label": "Sex",
        "maps_to": "sex",
        "options": [
          {
            "label": "Female",
            "value": 0
          },
          {
            "label": "Male",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "description": "Serum TSH level",
        "key": "tsh",
        "label": "Thyroid Stimulating Hormone (TSH)",
        "maps_to": "tsh",
        "max": 100.0,
        "min": 0.01,
        "required": true,
        "step": 0.01,
        "type": "number",
        "unit": "mIU/L"
      },
      {
        "description": "Total serum T3 level",
        "key": "t3",
        "label": "Triiodothyronine (T3)",
        "maps_to": "t3",
        "max": 10.0,
        "min": 0.05,
        "required": true,
        "step": 0.01,
        "type": "number",
        "unit": "nmol/L"
      },
      {
        "description": "Total serum T4 level",
        "key": "tt4",
        "label": "Total Thyroxine (TT4)",
        "maps_to": "tt4",
        "max": 30.0,
        "min": 0.5,
        "required": true,
        "step": 0.1,
        "type": "number",
        "unit": "nmol/L"
      },
      {
        "description": "Thyroxine binding capacity ratio",
        "key": "t4u",
        "label": "T4 Uptake (T4U)",
        "maps_to": "t4u",
        "max": 2.5,
        "min": 0.4,
        "required": true,
        "step": 0.01,
        "type": "number",
        "unit": "ratio"
      },
      {
        "description": "Computed FTI (auto-calculated as TT4 / T4U * 10 if omitted)",
        "key": "fti",
        "label": "Free Thyroxine Index (FTI)",
        "maps_to": "fti",
        "max": 50.0,
        "min": 1.0,
        "required": false,
        "step": 0.1,
        "type": "number",
        "unit": "index"
      },
      {
        "key": "on_thyroxine",
        "label": "On Thyroxine Medication",
        "maps_to": "on_thyroxine",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "on_antithyroid",
        "label": "On Antithyroid Medication",
        "maps_to": "on_antithyroid_medication",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "pregnant",
        "label": "Pregnancy Status",
        "maps_to": "pregnant",
        "options": [
          {
            "label": "No / Not Applicable",
            "value": 0
          },
          {
            "label": "Pregnant",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "thyroid_surgery",
        "label": "Prior Thyroid Surgery",
        "maps_to": "thyroid_surgery",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "query_hypothyroid",
        "label": "Suspected Hypothyroidism",
        "maps_to": "query_hypothyroid",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "query_hyperthyroid",
        "label": "Suspected Hyperthyroidism",
        "maps_to": "query_hyperthyroid",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "goitre",
        "label": "Goitre Present",
        "maps_to": "goitre",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      },
      {
        "key": "tumor",
        "label": "Thyroid Tumor / Nodule History",
        "maps_to": "tumor",
        "options": [
          {
            "label": "No",
            "value": 0
          },
          {
            "label": "Yes",
            "value": 1
          }
        ],
        "required": true,
        "type": "select"
      }
    ]
  }
};

export default DEFAULT_MODEL_SCHEMAS;
