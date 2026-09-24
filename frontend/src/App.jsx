import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FamilyMemberSelector from './components/FamilyMemberSelector';
import ReportUploadModal from './components/ReportUploadModal';
import AnalysisProcessingModal from './components/AnalysisProcessingModal';
import MedicalChatbotWidget from './components/MedicalChatbotWidget';
import GeneGuardBackgroundVideo from './components/GeneGuardBackgroundVideo';
import TitleScreenMenu from './components/TitleScreenMenu';

import HealthInput from './pages/HealthInput';
import AnalysisDashboard from './pages/AnalysisDashboard';
import FamilyNetworkCanvas from './pages/FamilyNetworkCanvas';
import FinalAnalysisReport from './pages/FinalAnalysisReport';
import OriginalMedicalApp from './pages/OriginalMedicalApp';

import {
  NORMAL_VALUE_REGISTRY,
  getNormalValuesForModule,
  mapProfileToModuleInputs,
  calculateBmi
} from './utils/normalValueRegistry';
import { API_BASE } from './utils/apiConfig';
import { DEFAULT_MODEL_SCHEMAS } from './data/defaultModelSchemas';
import { predictDiseaseClientSide, generateFinalAnalysisClientSide } from './utils/clinicalInferenceEngine';

export default function App() {
  const [inTitleScreen, setInTitleScreen] = useState(true);
  const [activeTab, setActiveTab] = useState('input');
  const [activeModule, setActiveModule] = useState('cardiovascular');
  const [schemas, setSchemas] = useState(DEFAULT_MODEL_SCHEMAS);
  const [familyList, setFamilyList] = useState([]);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // FEATURE 1: GLOBAL PATIENT PROFILE (Single Source of Truth)
  const [patientProfile, setPatientProfile] = useState({
    name: '',
    age: null,
    sex: '',
    height_cm: null,
    weight_kg: null,
    bmi: null,
    isComplete: false
  });

  const [selectedPerson, setSelectedPerson] = useState({
    person_id: 'me',
    name: '',
    relationship: 'Self',
    age: null,
    gender: null
  });

  // Empty initial form state for a fresh user session
  const [formValues, setFormValues] = useState({
    cardiovascular: {},
    metabolic: {},
    blood_pressure: {},
    thyroid: {},
    cancer: {}
  });

  // Central Store for Verified Laboratory Data
  const [verifiedLabData, setVerifiedLabData] = useState({});

  // Visual tracking of fields populated by "Fill Normal / Demo Values"
  const [demoFieldsMap, setDemoFieldsMap] = useState({
    cardiovascular: {},
    metabolic: {},
    blood_pressure: {},
    thyroid: {},
    cancer: {}
  });

  const [predictionResults, setPredictionResults] = useState({});
  const [missingFieldsMap, setMissingFieldsMap] = useState({});
  const [isPredictingMap, setIsPredictingMap] = useState({});

  // Universal Report Upload Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [uploadTargetModule, setUploadTargetModule] = useState(null);

  // Canvas Family Network & Final Analysis: ALWAYS clean empty array and null on startup
  const [canvasFamilyMembers, setCanvasFamilyMembers] = useState([]);
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);

  // Proactively purge any demo or stale localStorage/sessionStorage keys on startup
  useEffect(() => {
    try {
      localStorage.removeItem('geneguard_canvas_family');
      localStorage.removeItem('geneguard_final_analysis');
      localStorage.removeItem('geneguard_canvas_positions_v2');
      localStorage.removeItem('geneGuard_user');
      localStorage.removeItem('geneGuard_family');
      localStorage.removeItem('geneGuard_health');
      localStorage.removeItem('geneGuard_analysis');
      localStorage.removeItem('geneGuard_reports');
      localStorage.removeItem('geneGuard_predictions');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }
  }, []);

  // Fetch initial model schemas
  useEffect(() => {
    fetch(`${API_BASE}/models/schema`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.models) {
          setSchemas(data.models);
        }
      })
      .catch((err) => console.warn('[GeneGuard] Backend offline - using bundled clinical model schemas:', err));

    fetch(`${API_BASE}/family`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setFamilyList(data.family || []);
        }
      })
      .catch((err) => console.error('Failed to load family network:', err));
  }, []);

  // FEATURE 1: Save or Update Global Patient Profile
  const handleSaveProfile = (newProfile) => {
    setPatientProfile(newProfile);

    // Sync profile values to all 5 disease module inputs
    setFormValues((prev) => {
      const updated = { ...prev };
      ['cardiovascular', 'metabolic', 'blood_pressure', 'thyroid', 'cancer'].forEach((mod) => {
        const profileInputs = mapProfileToModuleInputs(newProfile, mod);
        updated[mod] = { ...updated[mod], ...profileInputs };
      });
      return updated;
    });

    // Update selectedPerson reference
    setSelectedPerson((prev) => ({
      ...prev,
      name: newProfile.name || 'Patient',
      age: newProfile.age,
      gender: newProfile.sex,
      sex: newProfile.sex
    }));

    // Clear missing fields map to re-evaluate
    setMissingFieldsMap({});
  };

  // Clear Global Patient Profile
  const handleClearProfile = () => {
    setPatientProfile({
      name: '',
      age: null,
      sex: '',
      height_cm: null,
      weight_kg: null,
      bmi: null,
      isComplete: false
    });

    setSelectedPerson({
      person_id: 'me',
      name: '',
      relationship: 'Self',
      age: null,
      gender: null
    });
  };

  // Complete Reset / Start New User function
  const handleResetSession = async () => {
    try {
      await fetch(`${API_BASE}/family/reset`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend reset call notice:', e);
    }

    try {
      localStorage.removeItem('geneguard_canvas_family');
      localStorage.removeItem('geneguard_final_analysis');
      localStorage.removeItem('geneguard_canvas_positions_v2');
      sessionStorage.clear();
    } catch (e) {}

    setCanvasFamilyMembers([]);
    setFinalAnalysis(null);
    setPredictionResults({});
    setMissingFieldsMap({});
    setIsPredictingMap({});
    setVerifiedLabData({});
    setDemoFieldsMap({
      cardiovascular: {},
      metabolic: {},
      blood_pressure: {},
      thyroid: {},
      cancer: {}
    });

    // Reset profile and forms to completely empty clean state
    setPatientProfile({
      name: '',
      age: null,
      sex: '',
      height_cm: null,
      weight_kg: null,
      bmi: null,
      isComplete: false
    });

    setFormValues({
      cardiovascular: {},
      metabolic: {},
      blood_pressure: {},
      thyroid: {},
      cancer: {}
    });

    setSelectedPerson({
      person_id: 'me',
      name: '',
      relationship: 'Self',
      age: null,
      gender: null
    });

    setFamilyList([]);
    setActiveTab('input');
  };

  // FEATURE 2: Fill Normal / Demo Values
  // Strictly preserves patient profile values if set! Does NOT auto-run models.
  const handleFillNormalValues = (moduleKey = 'all') => {
    if (moduleKey === 'all') {
      const newFormValues = {};
      const newDemoMap = {};

      ['cardiovascular', 'metabolic', 'blood_pressure', 'thyroid', 'cancer'].forEach((mod) => {
        newFormValues[mod] = getNormalValuesForModule(mod, patientProfile);
        // Mark model-specific normal fields as demo values
        newDemoMap[mod] = {};
        Object.keys(NORMAL_VALUE_REGISTRY[mod] || {}).forEach((k) => {
          newDemoMap[mod][k] = true;
        });
      });

      setFormValues(newFormValues);
      setDemoFieldsMap(newDemoMap);
      setMissingFieldsMap({});
    } else {
      const moduleValues = getNormalValuesForModule(moduleKey, patientProfile);
      setFormValues((prev) => ({
        ...prev,
        [moduleKey]: {
          ...prev[moduleKey],
          ...moduleValues
        }
      }));

      // Mark demo fields for this module
      const moduleDemoKeys = {};
      Object.keys(NORMAL_VALUE_REGISTRY[moduleKey] || {}).forEach((k) => {
        moduleDemoKeys[k] = true;
      });

      setDemoFieldsMap((prev) => ({
        ...prev,
        [moduleKey]: moduleDemoKeys
      }));

      setMissingFieldsMap((prev) => ({ ...prev, [moduleKey]: null }));
    }
  };

  // Clear ONLY current module inputs (Keeps Patient Profile intact!)
  const handleClearCurrentModule = (moduleKey) => {
    // Retain common profile inputs for this module if profile is complete
    const profileInputs = patientProfile && patientProfile.isComplete
      ? mapProfileToModuleInputs(patientProfile, moduleKey)
      : {};

    setFormValues((prev) => ({
      ...prev,
      [moduleKey]: profileInputs
    }));

    setDemoFieldsMap((prev) => ({
      ...prev,
      [moduleKey]: {}
    }));

    setPredictionResults((prev) => {
      const updated = { ...prev };
      delete updated[moduleKey];
      return updated;
    });

    setMissingFieldsMap((prev) => ({ ...prev, [moduleKey]: null }));
  };

  const handleInputChange = (moduleKey, featureKey, value) => {
    setFormValues((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [featureKey]: value
      }
    }));

    // If user edited a field, remove its demo tag
    setDemoFieldsMap((prev) => {
      if (prev[moduleKey]?.[featureKey]) {
        const updated = { ...prev[moduleKey] };
        delete updated[featureKey];
        return { ...prev, [moduleKey]: updated };
      }
      return prev;
    });

    setMissingFieldsMap((prev) => ({ ...prev, [moduleKey]: null }));
  };

  const runPrediction = async (moduleKey) => {
    setIsPredictingMap((prev) => ({ ...prev, [moduleKey]: true }));
    setMissingFieldsMap((prev) => ({ ...prev, [moduleKey]: null }));

    let predictionDone = false;

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_id: selectedPerson?.person_id || 'person_001',
          disease_module: moduleKey,
          inputs: formValues[moduleKey] || {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.result) {
          if (!data.result.available && data.result.missing_fields) {
            setMissingFieldsMap((prev) => ({ ...prev, [moduleKey]: data.result.missing_fields }));
          }
          setPredictionResults((prev) => ({ ...prev, [moduleKey]: data.result }));
          predictionDone = true;
        }
      }
    } catch (err) {
      console.warn(`[GeneGuard] Server prediction unavailable for ${moduleKey} - using client-side clinical engine:`, err);
    }

    // Automatic client-side clinical engine fallback (ensures models always work on Vercel)
    if (!predictionDone) {
      const clientResult = predictDiseaseClientSide(moduleKey, formValues[moduleKey] || {}, patientProfile);
      setPredictionResults((prev) => ({ ...prev, [moduleKey]: clientResult }));
    }

    setIsPredictingMap((prev) => ({ ...prev, [moduleKey]: false }));
  };

  const runAllPredictions = async () => {
    const modules = ['cardiovascular', 'metabolic', 'blood_pressure', 'thyroid', 'cancer'];
    for (const mod of modules) {
      await runPrediction(mod);
    }
    setActiveTab('dashboard');
  };

  // FEATURE 3: Apply Verified Lab Report Values to Multiple Modules
  const handleApplyExtractedReportValues = (mappedByModule, verifiedRecords = [], rawExtractedList = []) => {
    setFormValues((prev) => ({
      cardiovascular: { ...prev.cardiovascular, ...mappedByModule.cardiovascular },
      metabolic: { ...prev.metabolic, ...mappedByModule.metabolic },
      blood_pressure: { ...prev.blood_pressure, ...mappedByModule.blood_pressure },
      thyroid: { ...prev.thyroid, ...mappedByModule.thyroid },
      cancer: { ...prev.cancer, ...mappedByModule.cancer }
    }));

    // Update Central Store of Verified Lab Data
    setVerifiedLabData((prev) => {
      const updated = { ...prev };
      if (Array.isArray(rawExtractedList)) {
        rawExtractedList.forEach((item) => {
          updated[item.id] = {
            value: item.value,
            unit: item.unit,
            source: item.source || 'Uploaded Lab Report',
            timestamp: item.timestamp || new Date().toISOString(),
            verified: true
          };
        });
      }
      return updated;
    });

    if (verifiedRecords && verifiedRecords.length > 0) {
      setPredictionResults((prev) => {
        const updated = { ...prev };
        const thyroidRecords = verifiedRecords.filter((r) => ['TSH', 'T3', 'T4', 'T4U', 'FTI'].includes(r.test_key));
        const metabolicRecords = verifiedRecords.filter((r) =>
          ['LDL', 'HDL', 'Triglycerides', 'Fasting Glucose', 'HbA1c', 'Fasting Insulin'].includes(r.test_key)
        );
        const cardioRecords = verifiedRecords.filter((r) =>
          ['Systolic BP', 'Diastolic BP', 'Total Cholesterol', 'LDL', 'HDL'].includes(r.test_key)
        );
        const bpRecords = verifiedRecords.filter((r) =>
          ['Systolic BP', 'Diastolic BP', 'Hemoglobin'].includes(r.test_key)
        );

        if (updated.thyroid) updated.thyroid.relevant_report_data = thyroidRecords;
        if (updated.metabolic) updated.metabolic.relevant_report_data = metabolicRecords;
        if (updated.cardiovascular) updated.cardiovascular.relevant_report_data = cardioRecords;
        if (updated.blood_pressure) updated.blood_pressure.relevant_report_data = bpRecords;

        return updated;
      });
    }
  };

  // Convert current profile and form values into self_data format for combined analysis
  const getSelfDataForAnalysis = () => {
    const cardio = formValues.cardiovascular || {};
    const bp = formValues.blood_pressure || {};
    const metabolic = formValues.metabolic || {};
    const thyroid = formValues.thyroid || {};
    const cancer = formValues.cancer || {};

    const cleanName =
      patientProfile?.name && patientProfile.name.trim() && patientProfile.name.trim().toLowerCase() !== 'patient'
        ? patientProfile.name.trim()
        : selectedPerson?.name && selectedPerson.name.trim() && selectedPerson.name.trim().toLowerCase() !== 'patient'
        ? selectedPerson.name.trim()
        : 'Patient';

    const cleanAge =
      patientProfile?.age || cardio.age || bp.age || metabolic.age || thyroid.age || cancer.age || 38;

    let cleanGender = patientProfile?.sex || null;
    if (!cleanGender) {
      if (
        cardio.gender === 2 ||
        cardio.gender === '2' ||
        cardio.gender === 'male' ||
        bp.sex === 1 ||
        bp.sex === '1' ||
        thyroid.sex === 'M' ||
        cancer.gender === 1 ||
        cancer.gender === '1'
      ) {
        cleanGender = 'male';
      } else if (
        cardio.gender === 1 ||
        cardio.gender === '1' ||
        cardio.gender === 'female' ||
        bp.sex === 0 ||
        bp.sex === '0' ||
        thyroid.sex === 'F' ||
        cancer.gender === 2 ||
        cancer.gender === '2'
      ) {
        cleanGender = 'female';
      } else {
        cleanGender = 'female';
      }
    }

    const cleanHeight = patientProfile?.height_cm || cardio.height || metabolic.height || 168;
    const cleanWeight = patientProfile?.weight_kg || cardio.weight || metabolic.weight || 62;
    const cleanBmi = patientProfile?.bmi || calculateBmi(cleanHeight, cleanWeight) || 22.0;

    const sysBp = cardio.ap_hi || metabolic.sys_bp || bp.sys_bp || null;
    const diaBp = cardio.ap_lo || metabolic.dia_bp || bp.dia_bp || null;

    const lifestyleData = {};
    if (cardio.smoke !== undefined && cardio.smoke !== '')
      lifestyleData.smoking =
        String(cardio.smoke) === '1' || String(cardio.smoke).toLowerCase() === 'yes' ? 'yes' : 'no';
    else if (bp.smoking !== undefined && bp.smoking !== '')
      lifestyleData.smoking = String(bp.smoking) === '1' ? 'yes' : 'no';

    if (cardio.active !== undefined && cardio.active !== '')
      lifestyleData.activity =
        String(cardio.active) === '1' || String(cardio.active).toLowerCase() === 'yes' ? 'yes' : 'no';
    else if (bp.physical_activity !== undefined && bp.physical_activity !== '')
      lifestyleData.activity = Number(bp.physical_activity) > 5000 ? 'yes' : 'no';

    if (cardio.alco !== undefined && cardio.alco !== '')
      lifestyleData.alcohol =
        String(cardio.alco) === '1' || String(cardio.alco).toLowerCase() === 'yes' ? 'yes' : 'no';
    else if (bp.alcohol_consumption !== undefined && bp.alcohol_consumption !== '')
      lifestyleData.alcohol = Number(bp.alcohol_consumption) > 0 ? 'yes' : 'no';

    return {
      name: cleanName,
      age: cleanAge,
      gender: cleanGender,
      sex: cleanGender,
      height: cleanHeight,
      weight: cleanWeight,
      bmi: cleanBmi,
      blood_pressure_systolic: sysBp,
      blood_pressure_diastolic: diaBp,
      cholesterol: cardio.cholesterol || null,
      gluc: cardio.gluc || null,
      glucose: cardio.gluc || null,
      waist: metabolic.waist || null,
      body_fat: metabolic.body_fat || null,
      skeletal_muscle: metabolic.skeletal_muscle || null,
      lifestyle: lifestyleData,
      blood_pressure:
        sysBp && diaBp
          ? {
              sys_bp: sysBp,
              dia_bp: diaBp
            }
          : null,
      labs: {
        fasting_glucose: metabolic.fasting_glucose || null,
        total_cholesterol: metabolic.total_cholesterol || null,
        ldl: metabolic.ldl || null,
        hdl: metabolic.hdl || null,
        triglycerides: metabolic.triglycerides || null,
        fasting_insulin: metabolic.fasting_insulin || null,
        hemoglobin: bp.hemoglobin || null,
        tsh: thyroid.tsh || null,
        t3: thyroid.t3 || null,
        tt4: thyroid.tt4 || null,
        t4u: thyroid.t4u || null,
        fti: thyroid.fti || null
      },
      verified_records: Object.values(verifiedLabData),
      salt_intake: bp.salt_intake ?? null,
      stress_level: bp.stress_level ?? null,
      chronic_kidney_disease: bp.chronic_kidney_disease ?? null,
      adrenal_thyroid_disorders: bp.adrenal_thyroid_disorders ?? null,
      genetic_coefficient: bp.genetic_coefficient ?? null,
      // Isolated module inputs to prevent key collision / schema interchange
      module_inputs: {
        cardiovascular: { ...cardio },
        metabolic: { ...metabolic },
        blood_pressure: { ...bp },
        thyroid: { ...thyroid },
        cancer: { ...cancer }
      },
      cardiovascular: { ...cardio },
      metabolic: { ...metabolic },
      blood_pressure_inputs: { ...bp },
      thyroid_inputs: { ...thyroid },
      cancer_inputs: { ...cancer },
      conditions: []
    };
  };

  // Generate Final Combined Analysis
  const handleGenerateFinalAnalysis = async () => {
    const selfPayload = getSelfDataForAnalysis();

    setIsProcessingAnalysis(true);
    let analysisGenerated = false;

    try {
      const response = await fetch(`${API_BASE}/final-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          self_data: selfPayload,
          family_members: canvasFamilyMembers
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'success' && data.report) {
          setFinalAnalysis(data);
          analysisGenerated = true;
        }
      }
    } catch (err) {
      console.warn('[GeneGuard] Server final analysis unavailable - using client-side pedigree analysis engine:', err);
    }

    // Automatic client-side multi-organ & pedigree analysis fallback (guarantees report on Vercel)
    if (!analysisGenerated) {
      const fallbackAnalysis = generateFinalAnalysisClientSide(selfPayload, canvasFamilyMembers);
      setFinalAnalysis(fallbackAnalysis);
    }
  };

  const handleProcessingModalComplete = () => {
    setIsProcessingAnalysis(false);
    setActiveTab('report');
  };

  const handleOpenUploadModal = (targetMod = null) => {
    setUploadTargetModule(targetMod);
    setShowReportModal(true);
  };

  if (inTitleScreen) {
    return (
      <TitleScreenMenu
        onStartGeneGuard={() => {
          setInTitleScreen(false);
          setActiveTab('input');
        }}
      />
    );
  }

  return (
    <>
      <GeneGuardBackgroundVideo activeTab={activeTab} />
      <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPerson={selectedPerson}
        setShowReportModal={() => handleOpenUploadModal(null)}
        onResetSession={handleResetSession}
        isChatbotOpen={isChatbotOpen}
        onToggleChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        onReturnToTitleScreen={() => setInTitleScreen(true)}
      />

      <main className="main-content" style={{ padding: activeTab === 'family' ? '16px 20px 20px' : '24px 20px 60px' }}>
        {/* TAB 1: MY HEALTH DATA */}
        {activeTab === 'input' && (
          <div>
            <FamilyMemberSelector
              familyList={[
                { person_id: 'me', name: patientProfile?.name || selectedPerson?.name || 'Patient', relationship: 'Self' },
                ...canvasFamilyMembers
              ]}
              selectedPerson={selectedPerson}
              setSelectedPerson={(person) => {
                setSelectedPerson(person);
                setPredictionResults({});
                setMissingFieldsMap({});
              }}
            />

            <HealthInput
              schemas={schemas}
              selectedPerson={selectedPerson}
              patientProfile={patientProfile}
              onSaveProfile={handleSaveProfile}
              onClearProfile={handleClearProfile}
              formValues={formValues}
              onInputChange={handleInputChange}
              predictionResults={predictionResults}
              onRunPrediction={runPrediction}
              missingFieldsMap={missingFieldsMap}
              isPredictingMap={isPredictingMap}
              onRunAllPredictions={runAllPredictions}
              onApplyVerifiedReportData={handleApplyExtractedReportValues}
              onFillNormalValues={handleFillNormalValues}
              onClearModuleInputs={handleClearCurrentModule}
              onOpenUploadModal={handleOpenUploadModal}
              demoFieldsMap={demoFieldsMap}
              activeModule={activeModule}
              setActiveModule={setActiveModule}
            />
          </div>
        )}

        {/* TAB 2: ANALYSIS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {finalAnalysis && (
              <div
                style={{
                  marginBottom: '20px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Combined Family-Aware Analysis Ready</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    View your multi-organ combined clinical health report with genetic pedigree weighting.
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('report')}
                  style={{ fontSize: '0.85rem' }}
                >
                  View Full Combined Report &rarr;
                </button>
              </div>
            )}

            <AnalysisDashboard
              schemas={schemas}
              selectedPerson={selectedPerson}
              predictionResults={predictionResults}
              onRunAllPredictions={runAllPredictions}
              onNavigateToModule={(modKey) => {
                if (modKey) setActiveModule(modKey);
                setActiveTab('input');
              }}
              familyMembers={canvasFamilyMembers}
              finalAnalysis={finalAnalysis}
            />
          </div>
        )}

        {/* TAB 3: FAMILY NETWORK */}
        {activeTab === 'family' && (
          <FamilyNetworkCanvas
            selfData={getSelfDataForAnalysis()}
            familyMembers={canvasFamilyMembers}
            setFamilyMembers={setCanvasFamilyMembers}
            onBackToInput={() => setActiveTab('input')}
            onGenerateFinalAnalysis={handleGenerateFinalAnalysis}
            onOpenReportUpload={() => handleOpenUploadModal(null)}
          />
        )}

        {/* TAB 4: FINAL COMBINED REPORT */}
        {activeTab === 'report' && (
          <FinalAnalysisReport
            analysisData={finalAnalysis}
            selfData={getSelfDataForAnalysis()}
            familyMembers={canvasFamilyMembers}
            onReturnToNetwork={() => setActiveTab('family')}
            onReturnToInput={(modKey) => {
              if (modKey) setActiveModule(modKey);
              setActiveTab('input');
            }}
          />
        )}

        {/* TAB 5: ORIGINAL MEDICAL APP INTEGRATED (PORT 5173) */}
        {activeTab === 'medical-app' && (
          <OriginalMedicalApp
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* UNIVERSAL REPORT UPLOAD MODAL */}
      <ReportUploadModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onApplyExtractedValues={handleApplyExtractedReportValues}
        currentFormValues={formValues}
        targetModule={uploadTargetModule}
      />

      <AnalysisProcessingModal
        isOpen={isProcessingAnalysis}
        onComplete={handleProcessingModalComplete}
      />

      {/* FIXED BOTTOM-RIGHT HOVER MEDICAL CHATBOT WIDGET */}
      <MedicalChatbotWidget
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        onNavigateTab={setActiveTab}
      />
      </div>
    </>
  );
}

