/**
 * GeneGuard Ideal Clinical Biometric & Normal Reference Ranges
 * -------------------------------------------------------------
 * Authoritative medical reference values representing healthy, optimal
 * physiological parameters across all 5 disease categories.
 */

export const IDEAL_NORMAL_VALUES = {
  cardiovascular: {
    age: 38,
    gender: 'female',
    height: 168,
    weight: 62,
    ap_hi: 118,
    ap_lo: 76,
    cholesterol: 'normal',
    gluc: 'normal',
    smoke: 'no',
    alco: 'no',
    active: 'yes'
  },
  metabolic: {
    age: 38,
    height: 168,
    weight: 62,
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
    age: 38,
    bmi: 22.0,
    sex: 0, // Female (0 = Female, 1 = Male)
    pregnancy: 0,
    smoking: 0,
    physical_activity: 8500,
    salt_intake: 3.2,
    alcohol_consumption: 0,
    stress_level: 1, // Low (1 = Low, 2 = Medium, 3 = High)
    chronic_kidney_disease: 0,
    adrenal_thyroid_disorders: 0,
    hemoglobin: 14.2,
    genetic_coefficient: 0.15
  },
  thyroid: {
    age: 38,
    sex: 'F',
    tsh: 1.85,
    t3: 1.7,
    tt4: 104.0,
    t4u: 0.94,
    fti: 110.0,
    on_thyroxine: 'f',
    on_antithyroid: 'f',
    pregnant: 'f',
    thyroid_surgery: 'f',
    query_hypothyroid: 'f',
    query_hyperthyroid: 'f',
    goitre: 'f',
    tumor: 'f'
  },
  cancer: {
    age: 38,
    gender: 2, // Female (1 = Male, 2 = Female)
    air_pollution: 2,
    alcohol_use: 1,
    dust_allergy: 2,
    occupational_hazards: 2,
    genetic_risk: 2,
    chronic_lung_disease: 1,
    balanced_diet: 6, // High adherence
    obesity: 2,
    smoking: 1, // None
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

export const NORMAL_REFERENCE_RANGES = {
  // Cardiovascular
  age: { range: '18 – 65 yrs', ideal: '38 yrs', description: 'Adult clinical screening baseline' },
  ap_hi: { range: '90 – 120 mmHg', ideal: '118 mmHg', description: 'Optimal resting systolic pressure' },
  ap_lo: { range: '60 – 80 mmHg', ideal: '76 mmHg', description: 'Optimal resting diastolic pressure' },
  cholesterol: { range: 'Desirable: < 200 mg/dL', ideal: 'Normal (< 200)', description: 'Total serum cholesterol' },
  gluc: { range: 'Normal: 70 – 99 mg/dL', ideal: 'Normal (88 mg/dL)', description: 'Fasting blood glucose' },
  smoke: { range: 'Non-smoker', ideal: 'No', description: 'Zero tobacco exposure' },
  alco: { range: 'None / Low', ideal: 'No', description: 'Zero excessive alcohol' },
  active: { range: 'Active', ideal: 'Yes', description: 'Regular aerobic physical activity' },

  // Metabolic
  fasting_glucose: { range: '70 – 99 mg/dL', ideal: '88 mg/dL', description: 'Fasting blood glucose in optimal euglycemic range' },
  total_cholesterol: { range: '< 200 mg/dL', ideal: '175 mg/dL', description: 'Desirable total cholesterol' },
  ldl: { range: '< 100 mg/dL', ideal: '92 mg/dL', description: 'Optimal low-density lipoprotein cholesterol' },
  hdl: { range: '≥ 50 mg/dL (F) / ≥ 40 mg/dL (M)', ideal: '58 mg/dL', description: 'Cardioprotective high-density lipoprotein' },
  triglycerides: { range: '< 150 mg/dL', ideal: '115 mg/dL', description: 'Normal fasting serum triglycerides' },
  fasting_insulin: { range: '2.6 – 24.9 µIU/mL', ideal: '6.8 µIU/mL', description: 'Optimal insulin sensitivity (< 10 µIU/mL)' },
  waist: { range: '< 80 cm (F) / < 94 cm (M)', ideal: '78 cm', description: 'Healthy central adiposity circumference' },
  body_fat: { range: '14 – 24% (F) / 10 – 20% (M)', ideal: '19.5%', description: 'Healthy body fat percentage' },
  skeletal_muscle: { range: '24 – 35 kg', ideal: '29.0 kg', description: 'Healthy skeletal muscle mass' },
  sys_bp: { range: '90 – 120 mmHg', ideal: '118 mmHg', description: 'Optimal resting systolic pressure' },
  dia_bp: { range: '60 – 80 mmHg', ideal: '76 mmHg', description: 'Optimal resting diastolic pressure' },

  // Blood Pressure
  bmi: { range: '18.5 – 24.9 kg/m²', ideal: '22.0 kg/m²', description: 'Normal body mass index' },
  hemoglobin: { range: '12.0 – 15.5 g/dL (F) / 13.5 – 17.5 g/dL (M)', ideal: '14.2 g/dL', description: 'Normal oxygen-carrying capacity' },
  physical_activity: { range: '≥ 8,000 steps/day', ideal: '8,500 steps/day', description: 'Active lifestyle volume' },
  salt_intake: { range: '< 5.0 g/day (WHO)', ideal: '3.2 g/day', description: 'Recommended sodium consumption' },
  stress_level: { range: '1 (Low) on 1–3 scale', ideal: '1 (Low)', description: 'Minimal chronic stress' },

  // Thyroid
  tsh: { range: '0.4 – 4.0 mIU/L', ideal: '1.85 mIU/L', description: 'Euthyroid pituitary hormone release' },
  t3: { range: '1.2 – 2.8 nmol/L', ideal: '1.7 nmol/L', description: 'Active triiodothyronine hormone level' },
  tt4: { range: '60 – 150 nmol/L', ideal: '104.0 nmol/L', description: 'Total thyroxine hormone level' },
  t4u: { range: '0.70 – 1.20', ideal: '0.94', description: 'Thyroxine uptake ratio' },
  fti: { range: '70 – 140', ideal: '110.0', description: 'Free thyroxine index' },

  // Cancer & Respiratory
  balanced_diet: { range: '5 – 7 (High adherence)', ideal: '6', description: 'High Mediterranean / antioxidant nutrition' },
  air_pollution: { range: '1 – 3 (Low exposure)', ideal: '2', description: 'Low particulate exposure' },
  chest_pain: { range: '1 (None)', ideal: '1', description: 'Asymptomatic chest comfort' },
  coughing_of_blood: { range: '1 (None)', ideal: '1', description: 'Zero hemoptysis' },
  shortness_of_breath: { range: '1 (None)', ideal: '1', description: 'Normal respiratory exertion' }
};

export const IDEAL_PATIENT_PROFILE = {
  person_id: 'me',
  name: 'Alex Morgan',
  relationship: 'Self',
  age: 38,
  gender: 'female'
};
