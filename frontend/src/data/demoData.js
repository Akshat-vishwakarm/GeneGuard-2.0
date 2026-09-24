/**
 * GeneGuard Developer / Testing Demo Data
 * ---------------------------------------
 * NOTE: This file is for development testing only.
 * Normal application startup MUST NOT import or initialize this demo data automatically.
 */

export const DEMO_CANVAS_FAMILY = [
  {
    person_id: 'father',
    name: 'Father',
    relationship: 'Father',
    sex: 'Male',
    age: 54,
    conditions: ['Hypertension'],
    family_conditions: {
      diabetes: null,
      hypertension: 1,
      cardiovascular: null,
      thyroid: null,
      cancer: null
    },
    age_at_diagnosis: {
      hypertension: 48
    },
    history_unknown: false
  },
  {
    person_id: 'mother',
    name: 'Mother',
    relationship: 'Mother',
    sex: 'Female',
    age: 51,
    conditions: ['Thyroid Disorder'],
    family_conditions: {
      diabetes: null,
      hypertension: null,
      cardiovascular: null,
      thyroid: 1,
      cancer: null
    },
    history_unknown: false
  },
  {
    person_id: 'brother',
    name: 'Brother',
    relationship: 'Brother',
    sex: 'Male',
    age: 22,
    conditions: [],
    family_conditions: {
      diabetes: 0,
      hypertension: 0,
      cardiovascular: null,
      thyroid: null,
      cancer: null
    },
    history_unknown: false
  },
  {
    person_id: 'grandfather_paternal',
    name: 'Grandfather',
    relationship: 'Grandfather',
    subtitle: 'Paternal',
    sex: 'Male',
    age: 78,
    conditions: ['Heart Disease'],
    family_conditions: {
      diabetes: null,
      hypertension: null,
      cardiovascular: 1,
      thyroid: null,
      cancer: null
    },
    history_unknown: false
  },
  {
    person_id: 'grandfather_maternal',
    name: 'Maternal Grandfather',
    relationship: 'Maternal Grandfather',
    sex: 'Male',
    age: 76,
    conditions: ['Diabetes'],
    family_conditions: {
      diabetes: 1,
      hypertension: null,
      cardiovascular: null,
      thyroid: null,
      cancer: null
    },
    history_unknown: false
  }
];

export const DEMO_HEALTH_INPUTS = {
  cardiovascular: {
    age: 45,
    gender: 'male',
    height: 175,
    weight: 80,
    ap_hi: 130,
    ap_lo: 85,
    cholesterol: 'above_normal',
    gluc: 'normal',
    smoke: 'no',
    alco: 'no',
    active: 'yes'
  },
  metabolic: {
    age: 45,
    height: 175,
    waist: 96,
    weight: 80,
    body_fat: 24,
    skeletal_muscle: 32,
    total_cholesterol: 215,
    triglycerides: 170,
    ldl: 135,
    hdl: 42,
    sys_bp: 130,
    dia_bp: 85,
    fasting_glucose: 95,
    fasting_insulin: 12
  },
  blood_pressure: {
    hemoglobin: 14.5,
    genetic_coefficient: 0.45,
    age: 45,
    bmi: 26.1,
    sex: 1,
    pregnancy: 0,
    smoking: 0,
    physical_activity: 7000,
    salt_intake: 3200,
    alcohol_consumption: 0,
    stress_level: 2,
    chronic_kidney_disease: 0,
    adrenal_thyroid_disorders: 0
  },
  thyroid: {
    age: 45,
    sex: 'M',
    on_thyroxine: 'no',
    query_on_thyroxine: 'no',
    on_antithyroid: 'no',
    sick: 'no',
    pregnant: 'no',
    thyroid_surgery: 'no',
    query_hypothyroid: 'no',
    query_hyperthyroid: 'no',
    lithium: 'no',
    goitre: 'no',
    tumor: 'no',
    hypopituitary: 'no',
    psych: 'no',
    tsh: 2.1,
    t3: 1.8,
    tt4: 108.0,
    t4u: 0.98,
    fti: 110.0,
    referral_source: 'other'
  },
  cancer: {
    age: 45,
    gender: 1,
    air_pollution: 2,
    alcohol_use: 1,
    dust_allergy: 2,
    occupational_hazards: 2,
    genetic_risk: 3,
    chronic_lung_disease: 1,
    balanced_diet: 6,
    obesity: 3,
    smoking: 1,
    passive_smoker: 2,
    chest_pain: 1,
    coughing_of_blood: 1,
    fatigue: 2,
    weight_loss: 1,
    shortness_of_breath: 2,
    wheezing: 1,
    swallowing_difficulty: 2,
    clubbing_finger_nails: 1,
    frequent_cold: 4,
    dry_cough: 2,
    snoring: 1
  }
};
