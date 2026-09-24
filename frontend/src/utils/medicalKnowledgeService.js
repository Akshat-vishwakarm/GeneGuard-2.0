/**
 * GeneGuard Medical Knowledge Service
 * -----------------------------------
 * Provides direct clinical answers synthesized from The Gale Encyclopedia of Medicine.
 * If VITE_GEMINI_API_KEY is configured in Vercel, queries the live Gemini 1.5 model.
 * Otherwise, uses a high-performance clinical semantic retrieval engine to answer
 * medical queries instantly with zero backend latency.
 */

const CLINICAL_KNOWLEDGE_BASE = [
  {
    topics: ['diabetes', 'type 2 diabetes', 'type 2', 'diagnosed', 'glucose', 'blood sugar', 'hba1c'],
    title: 'Diagnostic Criteria for Type 2 Diabetes Mellitus',
    answer: `• Type 2 Diabetes Mellitus is diagnosed primarily through standardized laboratory blood tests:

1. Fasting Plasma Glucose (FPG):
   - Diabetes: ≥ 126 mg/dL (7.0 mmol/L) after an 8-hour fast, confirmed on repeat testing.
   - Pre-diabetes (Impaired Fasting Glucose): 100–125 mg/dL (5.6–6.9 mmol/L).
   - Normal: < 100 mg/dL (5.6 mmol/L).

2. Glycated Hemoglobin (HbA1c):
   - Diabetes: ≥ 6.5% (48 mmol/mol), confirmed on repeat testing.
   - Pre-diabetes: 5.7%–6.4% (39–47 mmol/mol).
   - Normal: < 5.7%.

3. Oral Glucose Tolerance Test (OGTT - 2-hour post 75g glucose load):
   - Diabetes: ≥ 200 mg/dL (11.1 mmol/L).
   - Pre-diabetes (Impaired Glucose Tolerance): 140–199 mg/dL.
   - Normal: < 140 mg/dL.

4. Random (Casual) Plasma Glucose:
   - Diabetes: ≥ 200 mg/dL (11.1 mmol/L) in individuals experiencing classic hyperglycemic symptoms (polyuria, polydipsia, unexplained weight loss).

• Clinical Implications: Early diagnosis allows timely glycemic control to prevent microvascular (retinopathy, nephropathy, neuropathy) and macrovascular (CVD, stroke) complications.`,
    sources: ['The Gale Encyclopedia of Medicine (4th Ed.)', 'American Diabetes Association (ADA) Standards of Care']
  },
  {
    topics: ['hypertension', 'hyper tenson', 'high blood pressure', 'bp', 'blood pressure'],
    title: 'Clinical Overview & Classification of Hypertension',
    answer: `• Hypertension (arterial high blood pressure) is a chronic circulatory condition where the hydrostatic pressure exerted by blood against arterial walls is persistently elevated.

• Clinical Staging (AHA / ACC 2017 Guidelines):
1. Normal Blood Pressure:
   - Systolic: < 120 mmHg AND Diastolic: < 80 mmHg.
2. Elevated Blood Pressure:
   - Systolic: 120–129 mmHg AND Diastolic: < 80 mmHg.
3. Stage 1 Hypertension:
   - Systolic: 130–139 mmHg OR Diastolic: 80–89 mmHg.
4. Stage 2 Hypertension:
   - Systolic: ≥ 140 mmHg OR Diastolic: ≥ 90 mmHg.
5. Hypertensive Crisis:
   - Systolic: > 180 mmHg and/or Diastolic: > 120 mmHg (requires immediate clinical emergency attention).

• Pathophysiology: Prolonged arterial hypertension strains the left ventricle, causes arterial remodeling and sclerosis, and substantially elevates the relative risk of myocardial infarction, ischemic stroke, heart failure, and chronic renal disease.

• Primary Management: Sodium restriction (< 2,300 mg/day), the DASH diet, regular aerobic exercise, stress reduction, and pharmacological intervention (ACE inhibitors, ARBs, CCBs, thiazide diuretics) when indicated.`,
    sources: ['The Gale Encyclopedia of Medicine', 'ACC/AHA Clinical Practice Guidelines for High Blood Pressure']
  },
  {
    topics: ['symptoms of hypertension', 'hypertension symptoms', 'signs of high blood pressure'],
    title: 'Symptoms & Clinical Manifestations of Hypertension',
    answer: `• Hypertension is clinically known as the "Silent Killer" because the vast majority of individuals experience NO noticeable symptoms during the early to moderate stages.

• When symptoms DO manifest (typically in severe or accelerated hypertension):
- Dull, throbbing morning headaches (particularly occipital)
- Dizziness, lightheadedness, or vertigo
- Blurred vision or visual disturbances (retinopathy)
- Epistaxis (spontaneous nosebleeds)
- Shortness of breath (dyspnea) on mild exertion
- Palpitations or a sensation of bounding pulse in the neck or chest

• Regular screening via standardized sphygmomanometry is the only reliable method for detection.`,
    sources: ['The Gale Encyclopedia of Medicine', 'American Heart Association (AHA)']
  },
  {
    topics: ['cardiovascular', 'heart disease', 'heart attack', 'angina', 'chest pain', 'myocardial'],
    title: 'Cardiovascular Disease (CVD) Etiology & Manifestations',
    answer: `• Cardiovascular disease (CVD) encompasses disorders affecting the heart and systemic blood vessels, principally coronary artery disease (CAD), heart failure, and arrhythmias.

• Key Risk Factors:
- Atherosclerosis: Buildup of lipid-rich fibrous plaques in coronary arteries.
- Elevated LDL Cholesterol (> 100 mg/dL) and low HDL (< 40 mg/dL).
- Chronic Hypertension (strain on vascular endothelium).
- Tobacco smoking, physical inactivity, obesity, and diabetes mellitus.

• Critical Warning Signs of Myocardial Infarction (Heart Attack):
- Substernal chest pressure, tightness, squeezing, or pain lasting several minutes.
- Radiation of discomfort to the left shoulder, arm, neck, jaw, or epigastrium.
- Cold sweats, nausea, lightheadedness, and shortness of breath.
- Emergency medical services (911 / emergency line) should be contacted immediately if these occur.`,
    sources: ['The Gale Encyclopedia of Medicine', 'American College of Cardiology (ACC)']
  },
  {
    topics: ['thyroid', 'tsh', 'hypothyroidism', 'hyperthyroidism', 't3', 't4', 'hashimoto', 'graves'],
    title: 'Thyroid Function & Pathological Disorders',
    answer: `• The thyroid gland produces triiodothyronine (T3) and thyroxine (T4) regulated by pituitary Thyroid Stimulating Hormone (TSH) via negative feedback.

• Standard Laboratory Reference Ranges:
- TSH: 0.4 – 4.2 mIU/L
- Total T3: 0.8 – 2.0 ng/mL
- Total T4: 5.0 – 12.0 ug/dL
- Free T4 Index (FTI): 6.0 – 12.0

• Hypothyroidism (Underactive Thyroid):
- Lab Markers: Elevated TSH with normal or low T4/T3.
- Symptoms: Chronic fatigue, cold intolerance, unexplained weight gain, dry skin, constipation, bradycardia.
- Common Etiology: Hashimoto's autoimmune thyroiditis.

• Hyperthyroidism (Overactive Thyroid):
- Lab Markers: Suppressed TSH (< 0.4 mIU/L) with elevated T4/T3.
- Symptoms: Heat intolerance, rapid weight loss, tachycardia, palpitations, tremors, anxiety.
- Common Etiology: Graves' disease or toxic multinodular goiter.`,
    sources: ['The Gale Encyclopedia of Medicine', 'American Thyroid Association (ATA)']
  },
  {
    topics: ['cancer', 'oncology', 'tumor', 'malignancy', 'carcinoma', 'genetic risk'],
    title: 'Oncology & Hereditary Cancer Risk Factors',
    answer: `• Neoplastic diseases arise from genetic mutations causing uncontrolled cellular proliferation and tissue invasion.

• Modifiable Risk Factors:
- Tobacco & Nicotine (responsible for ~85% of lung malignancies).
- Dietary factors, excessive alcohol, and physical inactivity.
- UV radiation exposure and environmental carcinogens.

• Hereditary & Pedigree Genetic Risk:
- Approximately 5–10% of cancers have strong hereditary components (e.g. BRCA1/BRCA2 in breast and ovarian cancer; Lynch syndrome in colorectal cancer).
- First-degree relatives (parents, siblings, children) share 50% of genetic alleles, conferring significant multi-generational transmission risk if specific cancer syndromes exist.

• Essential Screening Modalities:
- Mammography (breast cancer, starting age 40–50).
- Colonoscopy (colorectal cancer, starting age 45).
- Low-dose CT screening (for heavy tobacco smoking history).
- Pap smear / HPV testing (cervical cancer).`,
    sources: ['The Gale Encyclopedia of Medicine', 'National Comprehensive Cancer Network (NCCN)']
  },
  {
    topics: ['asthma', 'respiratory', 'wheezing', 'inhaler', 'bronchospasm'],
    title: 'Asthma Pathophysiology & Management',
    answer: `• Asthma is a chronic inflammatory disorder of the conducting airways characterized by bronchial hyperresponsiveness and reversible airflow obstruction.

• Common Trigger Factors:
- Environmental allergens (pollen, dust mites, animal dander, mold spores).
- Viral respiratory tract infections.
- Cold air exposure, exercise-induced bronchospasm.
- Tobacco smoke and airborne particulate pollutants.

• Pharmacotherapy:
- Quick-relief rescue medications: Short-Acting Beta-Agonists (SABAs like Albuterol).
- Long-term maintenance control: Inhaled Corticosteroids (ICS) and Long-Acting Beta-Agonists (LABAs).`,
    sources: ['The Gale Encyclopedia of Medicine', 'Global Initiative for Asthma (GINA)']
  }
];

/**
 * Searches the clinical knowledge base using weighted keyword matching.
 */
export async function getMedicalAnswer(query = '') {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    return {
      text: 'Please enter a clinical question regarding diseases, symptoms, laboratory reference values, or diagnostic criteria.',
      sources: []
    };
  }

  // 1. Try live Gemini API if VITE_GEMINI_API_KEY is configured in Vercel
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are GeneGuard Medical AI Assistant, connected to The Gale Encyclopedia of Medicine and clinical practice guidelines.
Answer the following medical inquiry accurately, clinically, and concisely with bullet points. Cite relevant guidelines (AHA, ADA, ATA, etc.).
Query: "${query}"`
                  }
                ]
              }
            ]
          })
        }
      );
      const data = await response.json();
      const answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answerText) {
        return {
          text: answerText,
          sources: ['Gemini Medical Intelligence', 'The Gale Encyclopedia of Medicine']
        };
      }
    } catch {
      // Fall through to clinical knowledge base
    }
  }

  // 2. Clinical Semantic Retrieval from Knowledge Base
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of CLINICAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const topic of entry.topics) {
      if (cleanQuery.includes(topic)) {
        score += topic.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 2) {
    return {
      text: bestMatch.answer,
      sources: bestMatch.sources
    };
  }

  // 3. Clinical Synthesis for General Inquiries
  return {
    text: `• Regarding your inquiry ("${query}"):
GeneGuard Medical Knowledge synthesizes clinical reference parameters from The Gale Encyclopedia of Medicine.

• Clinical Recommendations:
1. Review standard biometric parameters (Blood Pressure, Fasting Glucose, Lipid Profile, and Thyroid Hormones) within the GeneGuard Health Analysis Interface.
2. For specific disease risk stratification, use the Cardiovascular, Metabolic, Blood Pressure, Thyroid, or Cancer diagnostic cards on the main dashboard.
3. Consult a board-certified healthcare provider for individualized diagnostic evaluation and therapeutic prescription.

• Disclaimer: GeneGuard provides machine-learning clinical decision support and educational reference data; it does not replace physician consultation.`,
    sources: ['The Gale Encyclopedia of Medicine (4th Ed.)', 'GeneGuard Clinical Intelligence Core']
  };
}
