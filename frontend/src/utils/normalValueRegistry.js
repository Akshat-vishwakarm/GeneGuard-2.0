import { NORMAL_REFERENCE_RANGES } from './idealValues.js';
export { NORMAL_REFERENCE_RANGES };

/**
 * GeneGuard Central Normal Value Registry & Feature Mapping
 * ---------------------------------------------------------
 * Authoritative clinical normal-range reference values and feature schemas
 * for all 5 disease modules.
 *
 * Rules:
 * 1. Global Patient Profile values (Age, Sex, Height, Weight, BMI) always take precedence.
 * 2. Normal / Demo values are representative optimal values for missing model-specific inputs.
 * 3. Never overwrite entered user profile values with demo values.
 */

export const NORMAL_VALUE_REGISTRY = {
  cardiovascular: {
    // Model-specific inputs (profile supplies age, gender, height, weight)
    ap_hi: 118,
    ap_lo: 76,
    cholesterol: 'normal',
    gluc: 'normal',
    smoke: 'no',
    alco: 'no',
    active: 'yes'
  },
  metabolic: {
    // Model-specific inputs (profile supplies age, height, weight, bmi)
    waist: 78,
    body_fat: 19.5,
    skeletal_muscle: 29.0,
    fasting_glucose: 88,
    total_cholesterol: 175,
    ldl: 92,
    hdl: 58,
    triglycerides: 115,
    fasting_insulin: 6.8,
    sys_bp: 118,
    dia_bp: 76
  },
  blood_pressure: {
    // Model-specific inputs (profile supplies age, sex, bmi)
    hemoglobin: 14.2,
    genetic_coefficient: 0.15,
    pregnancy: 0,
    smoking: 0,
    physical_activity: 8500,
    salt_intake: 3200, // 3,200 mg/day (~3.2 g/day)
    alcohol_consumption: 0,
    stress_level: 1, // Low
    chronic_kidney_disease: 0,
    adrenal_thyroid_disorders: 0
  },
  thyroid: {
    // Model-specific inputs (profile supplies sex, age)
    tsh: 1.85,
    t3: 1.70,
    tt4: 8.5,
    t4u: 0.94,
    fti: 9.0,
    on_thyroxine: 0,
    on_antithyroid: 0,
    pregnant: 0,
    thyroid_surgery: 0,
    query_hypothyroid: 0,
    query_hyperthyroid: 0,
    goitre: 0,
    tumor: 0
  },
  cancer: {
    // Model-specific inputs (profile supplies age, gender)
    air_pollution: 2,
    alcohol_use: 1,
    dust_allergy: 2,
    occupational_hazards: 2,
    genetic_risk: 2,
    chronic_lung_disease: 1,
    balanced_diet: 6,
    obesity: 2,
    smoking: 1,
    passive_smoker: 1,
    chest_pain: 1,
    coughing_of_blood: 1,
    fatigue: 2,
    weight_loss: 1,
    shortness_of_breath: 1,
    wheezing: 1,
    swallowing_difficulty: 1,
    clubbing_finger_nails: 1,
    frequent_cold: 2,
    dry_cough: 1,
    snoring: 2
  }
};

/**
 * Common profile attributes mapping for each disease module.
 */
export const MODEL_COMMON_PROFILE_CONFIG = {
  cardiovascular: {
    totalCommon: 4,
    fields: ['age', 'gender', 'height', 'weight'],
    labels: ['Age', 'Gender', 'Height', 'Weight']
  },
  metabolic: {
    totalCommon: 4,
    fields: ['age', 'height', 'weight', 'bmi'],
    labels: ['Age', 'Height', 'Weight', 'BMI']
  },
  blood_pressure: {
    totalCommon: 3,
    fields: ['age', 'sex', 'bmi'],
    labels: ['Age', 'Sex', 'BMI']
  },
  thyroid: {
    totalCommon: 2,
    fields: ['sex', 'age'],
    labels: ['Sex', 'Age']
  },
  cancer: {
    totalCommon: 2,
    fields: ['age', 'gender'],
    labels: ['Age', 'Gender']
  }
};

/**
 * Default fallback demo biometrics used ONLY when user has not entered a patient profile.
 */
export const DEMO_PROFILE_FALLBACK = {
  name: 'Demo Patient',
  age: 38,
  sex: 'female',
  height_cm: 168,
  weight_kg: 62,
  bmi: 22.0
};

/**
 * Calculates BMI = weight_kg / (height_m ^ 2)
 */
export function calculateBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const heightM = h / 100.0;
  return parseFloat((w / (heightM * heightM)).toFixed(1));
}

/**
 * Extracts and maps global Patient Profile values into a specific disease module's schema.
 */
export function mapProfileToModuleInputs(profile, moduleKey) {
  if (!profile) return {};
  const mapped = {};
  const hasAge = profile.age !== '' && profile.age !== null && profile.age !== undefined;
  const hasSex = Boolean(profile.sex);
  const hasHeight = profile.height_cm !== '' && profile.height_cm !== null && profile.height_cm !== undefined;
  const hasWeight = profile.weight_kg !== '' && profile.weight_kg !== null && profile.weight_kg !== undefined;
  const bmiVal = profile.bmi || calculateBmi(profile.height_cm, profile.weight_kg);

  if (moduleKey === 'cardiovascular') {
    if (hasAge) mapped.age = Number(profile.age);
    if (hasSex) mapped.gender = profile.sex === 'male' ? 'male' : 'female';
    if (hasHeight) mapped.height = Number(profile.height_cm);
    if (hasWeight) mapped.weight = Number(profile.weight_kg);
  } else if (moduleKey === 'metabolic') {
    if (hasAge) mapped.age = Number(profile.age);
    if (hasHeight) mapped.height = Number(profile.height_cm);
    if (hasWeight) mapped.weight = Number(profile.weight_kg);
  } else if (moduleKey === 'blood_pressure') {
    if (hasAge) mapped.age = Number(profile.age);
    if (hasSex) mapped.sex = profile.sex === 'male' ? 1 : 0;
    if (bmiVal) mapped.bmi = Number(bmiVal);
  } else if (moduleKey === 'thyroid') {
    if (hasAge) mapped.age = Number(profile.age);
    if (hasSex) mapped.sex = profile.sex === 'male' ? 1 : 0;
  } else if (moduleKey === 'cancer') {
    if (hasAge) mapped.age = Number(profile.age);
    if (hasSex) mapped.gender = profile.sex === 'male' ? 1 : 2;
  }

  return mapped;
}

/**
 * Builds the complete form inputs for a module by applying normal values
 * while STRICTLY preserving any existing patient profile values.
 */
export function getNormalValuesForModule(moduleKey, patientProfile = null) {
  const normalSpecific = NORMAL_VALUE_REGISTRY[moduleKey] ? { ...NORMAL_VALUE_REGISTRY[moduleKey] } : {};
  
  // Map profile values if available
  const profileInputs = patientProfile && patientProfile.isComplete
    ? mapProfileToModuleInputs(patientProfile, moduleKey)
    : mapProfileToModuleInputs(patientProfile || DEMO_PROFILE_FALLBACK, moduleKey);

  return {
    ...normalSpecific,
    ...profileInputs
  };
}

/**
 * Model Feature Registry defining supported laboratory metrics and their field names per module.
 */
export const MODEL_FEATURE_REGISTRY = {
  thyroid: {
    tsh: 'tsh',
    t3: 't3',
    tt4: 'tt4',
    t4: 'tt4',
    t4u: 't4u',
    fti: 'fti'
  },
  metabolic: {
    fasting_glucose: 'fasting_glucose',
    glucose: 'fasting_glucose',
    total_cholesterol: 'total_cholesterol',
    cholesterol: 'total_cholesterol',
    ldl: 'ldl',
    hdl: 'hdl',
    triglycerides: 'triglycerides',
    fasting_insulin: 'fasting_insulin',
    sys_bp: 'sys_bp',
    dia_bp: 'dia_bp'
  },
  cardiovascular: {
    sys_bp: 'ap_hi',
    dia_bp: 'ap_lo',
    cholesterol: 'cholesterol',
    glucose: 'gluc',
    total_cholesterol: 'cholesterol',
    fasting_glucose: 'gluc'
  },
  blood_pressure: {
    hemoglobin: 'hemoglobin',
    sys_bp: 'sys_bp',
    dia_bp: 'dia_bp'
  }
};
