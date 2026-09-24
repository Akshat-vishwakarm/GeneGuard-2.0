import React, { useState } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Edit3,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function FinalAnalysisReport({
  analysisData,
  selfData = {},
  familyMembers = [],
  onReturnToNetwork,
  onReturnToInput
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [selectedTechDisease, setSelectedTechDisease] = useState(null);

  // -------------------------------------------------------------
  // INSUFFICIENT DATA / EMPTY SESSION GATE SCREEN
  // -------------------------------------------------------------
  if (!analysisData || analysisData.status === 'insufficient_data' || !analysisData.report) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px 80px' }}>
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '50px 32px',
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '20px',
            backdropFilter: 'blur(16px)',
            boxShadow: 'none'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <AlertTriangle size={28} color="#FBBF24" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '10px', letterSpacing: '-0.01em' }}>
            INSUFFICIENT PERSONAL DATA
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 26px' }}>
            GeneGuard requires personal health biometrics before generating a personalized risk dashboard.
            Please complete your personal health profile to proceed.
          </p>

          <button 
            className="btn btn-primary" 
            onClick={() => onReturnToInput && onReturnToInput()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              color: '#000000',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={15} />
            <span>Complete Personal Biometrics</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REPORT DATA PARSING (Strict traceability to actual outputs)
  // -------------------------------------------------------------
  const report = analysisData.report;
  const personal = report.personal_results || {};
  const fra = report.family_risk_analysis || {};
  const diseaseEvals = fra.disease_evaluations || {};
  const familySummary = fra.family_history_summary || {};
  const diseaseSummaries = familySummary.disease_summaries || {};
  const rawMembers = report.family_network_summary?.members || familyMembers || [];
  const patientSummary = report.personal_summary || {};
  const aiEval = report.ai_evaluation || {};

  // Patient Profile Header Formatting
  const cleanPatientName = (patientSummary.name && patientSummary.name.trim() && !['patient', 'me (patient)', 'you', 'me'].includes(patientSummary.name.trim().toLowerCase()))
    ? patientSummary.name.trim()
    : ((report.patient_name && report.patient_name.trim() && !['patient', 'me (patient)', 'you', 'me'].includes(report.patient_name.trim().toLowerCase()))
      ? report.patient_name.trim()
      : ((selfData.name && selfData.name.trim() && !['patient', 'me (patient)', 'you', 'me'].includes(selfData.name.trim().toLowerCase()))
        ? selfData.name.trim()
        : 'Patient'));
  
  const rawAge = patientSummary.age ?? report.patient_age ?? selfData.age;
  const formattedAge = (rawAge != null && rawAge !== '') ? `${rawAge} yrs` : 'Not provided';
  
  const rawSex = patientSummary.sex || report.patient_sex || selfData.gender || selfData.sex;
  const formattedSex = rawSex ? (String(rawSex).toLowerCase().startsWith('m') ? 'Male' : (String(rawSex).toLowerCase().startsWith('f') ? 'Female' : String(rawSex))) : 'Not provided';

  const rawHeight = patientSummary.height ?? selfData.height;
  const formattedHeight = (rawHeight != null && rawHeight !== '') ? `${rawHeight} cm` : null;

  const rawWeight = patientSummary.weight ?? selfData.weight;
  const formattedWeight = (rawWeight != null && rawWeight !== '') ? `${rawWeight} kg` : null;

  let calculatedBmi = null;
  if (rawHeight && rawWeight && Number(rawHeight) > 0 && Number(rawWeight) > 0) {
    const hM = Number(rawHeight) / 100;
    calculatedBmi = (Number(rawWeight) / (hM * hM)).toFixed(1);
  }
  const formattedBmi = calculatedBmi ? `${calculatedBmi} kg/m²` : (patientSummary.bmi ? `${patientSummary.bmi} kg/m²` : null);

  const rawSysBp = patientSummary.blood_pressure_systolic ?? selfData.blood_pressure?.sys_bp ?? selfData.blood_pressure_systolic;
  const rawDiaBp = patientSummary.blood_pressure_diastolic ?? selfData.blood_pressure?.dia_bp ?? selfData.blood_pressure_diastolic;
  const formattedBp = (rawSysBp && rawDiaBp) ? `${rawSysBp}/${rawDiaBp} mmHg` : (patientSummary.blood_pressure ? `${patientSummary.blood_pressure} mmHg` : null);

  // -------------------------------------------------------------
  // MASTER 5 DISEASES DEFINITION (Strict GeneGuard Order)
  // -------------------------------------------------------------
  const DISEASES = [
    {
      key: 'cardiovascular',
      diseaseName: 'Cardiovascular',
      moduleKey: 'cardiovascular',
      familyKey: 'cardiovascular',
      emoji: '❤️',
      color: '#EF4444',
      dataSource: 'Cardiovascular Disease Dataset (70,000 Patient Cohort)',
      featuresRequired: ['Age', 'Gender', 'Height', 'Weight', 'Systolic BP', 'Diastolic BP', 'Cholesterol', 'Glucose', 'Smoking', 'Alcohol', 'Physical Activity']
    },
    {
      key: 'diabetes',
      diseaseName: 'Diabetes / Metabolic',
      moduleKey: 'metabolic',
      familyKey: 'diabetes',
      emoji: '🩸',
      color: '#F59E0B',
      dataSource: 'Clinical Metabolic Panel & Biomarker Register (Kaggle/NHANES)',
      featuresRequired: ['Age', 'Height', 'Weight', 'Waist', 'Body Fat', 'Skeletal Muscle', 'Total Cholesterol', 'Triglycerides', 'LDL', 'HDL', 'Systolic BP', 'Diastolic BP', 'Fasting Glucose', 'Fasting Insulin']
    },
    {
      key: 'hypertension',
      diseaseName: 'Blood Pressure',
      moduleKey: 'blood_pressure',
      familyKey: 'hypertension',
      emoji: '💓',
      color: '#EC4899',
      dataSource: 'Multi-Factor Hypertension Biometrics Cohort with Kinship Integration',
      featuresRequired: ['Age', 'Sex', 'Hemoglobin', 'Systolic BP', 'Diastolic BP', 'Smoking', 'Physical Activity', 'Dietary Salt Intake', 'Alcohol Consumption', 'Stress Level', 'Chronic Kidney Disease', 'Adrenal/Thyroid Disorders']
    },
    {
      key: 'thyroid',
      diseaseName: 'Thyroid',
      moduleKey: 'thyroid',
      familyKey: 'thyroid',
      emoji: '🦋',
      color: '#06B6D4',
      dataSource: 'UCI Machine Learning Repository Thyroid Disease Database',
      featuresRequired: ['Age', 'Sex', 'TSH', 'T3', 'TT4', 'T4U', 'FTI', 'On Thyroxine', 'On Antithyroid', 'Pregnancy Status', 'Thyroid Surgery', 'Goitre', 'Tumor']
    },
    {
      key: 'cancer',
      diseaseName: 'Cancer / Respiratory',
      moduleKey: 'cancer',
      familyKey: 'cancer',
      emoji: '🫁',
      color: '#8B5CF6',
      dataSource: 'Multi-Modal Oncologic & Respiratory Malignancy Pedigree Dataset',
      featuresRequired: ['Age', 'Gender', 'Air Pollution Exposure', 'Alcohol Use', 'Dust Allergy', 'Occupational Hazards', 'Genetic Risk', 'Chronic Lung Disease', 'Balanced Diet', 'Obesity', 'Smoking', 'Passive Smoker', 'Chest Pain', 'Coughing Blood', 'Fatigue', 'Weight Loss', 'Shortness of Breath', 'Wheezing', 'Swallowing Difficulty', 'Clubbing Nails', 'Frequent Cold', 'Dry Cough', 'Snoring']
    }
  ];

  // Helper: Relative Avatar
  const getRelativeAvatar = (relationship = '') => {
    const r = (relationship || '').toLowerCase();
    if (r.includes('father') && !r.includes('grand')) return '👨';
    if (r.includes('mother') && !r.includes('grand')) return '👩';
    if (r.includes('grandfather')) return '👴';
    if (r.includes('grandmother')) return '👵';
    if (r.includes('brother') || r.includes('son')) return '👦';
    if (r.includes('sister') || r.includes('daughter')) return '👧';
    return '👤';
  };

  // Helper: Signal status text for Section 1
  const getRiskSignalLabel = (prob, predText) => {
    if (prob == null) return null;
    if (predText && typeof predText === 'string') {
      const cleanPred = predText.replace(/^Model Signal:\s*/i, '').trim().toLowerCase();
      if (cleanPred.includes('low') || cleanPred.includes('remission') || cleanPred.includes('normal')) {
        return 'Lower model signal';
      }
      if (cleanPred.includes('high') || cleanPred.includes('elevated') || cleanPred.includes('abnormal')) {
        return 'Elevated model signal';
      }
      if (cleanPred.includes('moderate')) {
        return 'Moderate model signal';
      }
    }
    if (prob < 20) return 'Lower model signal';
    if (prob < 50) return 'Moderate model signal';
    return 'Elevated model signal';
  };

  // Helper: Clean missing field names for simple display
  const formatMissingFields = (missingFields = []) => {
    if (!missingFields || missingFields.length === 0) return 'Key biometrics missing';
    // Shorten clinical labels to recognizable acronyms or words
    const shortened = missingFields.map(f => {
      if (typeof f !== 'string') return String(f);
      if (f.includes('TSH')) return 'TSH';
      if (f.includes('T3')) return 'T3';
      if (f.includes('TT4')) return 'TT4';
      if (f.includes('T4U')) return 'T4U';
      if (f.includes('FTI')) return 'FTI';
      if (f.includes('Fasting Glucose')) return 'Fasting Glucose';
      if (f.includes('Fasting Insulin')) return 'Fasting Insulin';
      if (f.includes('Systolic')) return 'Systolic BP';
      if (f.includes('Diastolic')) return 'Diastolic BP';
      if (f.includes('Cholesterol')) return 'Cholesterol';
      if (f.includes('Glucose')) return 'Glucose';
      if (f.includes('Hemoglobin')) return 'Hemoglobin';
      return f.split('(')[0].trim();
    });
    
    // Deduplicate
    const unique = [...new Set(shortened)];
    if (unique.length <= 2) {
      return unique.join(', ');
    }
    return `${unique.slice(0, 2).join(', ')} +${unique.length - 2} more`;
  };

  const handleScrollToTechnicalDetails = (diseaseKey = null) => {
    setShowTechnicalDetails(true);
    setSelectedTechDisease(diseaseKey);
    setTimeout(() => {
      const el = document.getElementById('section-technical-details');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="final-report-wrapper" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION & ACTIONS (Hidden in print)
      ------------------------------------------------------------- */}
      <div 
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onReturnToNetwork}
            style={{ 
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              color: 'var(--text-secondary)'
            }}
          >
            <ArrowLeft size={14} />
            <span>Family Network</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onReturnToInput && onReturnToInput()}
            style={{ 
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              color: 'var(--text-secondary)'
            }}
          >
            <Edit3 size={14} />
            <span>Edit Biometrics</span>
          </button>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => window.print()}
          style={{ 
            background: '#FFFFFF',
            color: '#000000',
            boxShadow: 'none',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Printer size={15} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          HEADER: GENEGUARD YOUR HEALTH ANALYSIS
      ------------------------------------------------------------- */}
      <div 
        style={{
          background: 'rgba(10, 10, 14, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '32px',
          backdropFilter: 'blur(28px) saturate(125%)',
          WebkitBackdropFilter: 'blur(28px) saturate(125%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <img 
                src="/geneguard-logo-symbol.png" 
                alt="GeneGuard Emblem" 
                style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' }} 
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                GENEGUARD CLINICAL HEALTH REPORT
              </span>
            </div>

            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.02em', 
              margin: '0 0 6px 0',
              lineHeight: 1.2
            }}>
              YOUR HEALTH ANALYSIS
            </h1>
            
            <p style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)', 
              margin: '0 0 18px 0',
              fontWeight: 400
            }}>
              Based on your current health data and recorded family history.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.10)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <img 
              src="/geneguard-logo-full.png" 
              alt="GeneGuard" 
              style={{ height: '48px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.15))' }} 
            />
          </div>
        </div>

        {/* Minimal Patient Profile Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cleanPatientName}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>{formattedSex}, {formattedAge}</span>
          {(formattedHeight || formattedWeight) && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>{[formattedHeight, formattedWeight].filter(Boolean).join(' · ')}</span>
            </>
          )}
          {formattedBmi && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>BMI {formattedBmi}</span>
            </>
          )}
          {formattedBp && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>BP {formattedBp}</span>
            </>
          )}
        </div>
      </div>

      {/* =============================================================
          SECTION 1 — MY HEALTH RISKS
      ============================================================= */}
      <section style={{ marginBottom: '38px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            SECTION 1
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            MY HEALTH RISKS
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '3px', margin: 0 }}>
            Your current personal model results
          </p>
        </div>

        {/* Unified 5-Disease Personal Risk Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {DISEASES.map((dis) => {
            const modRes = personal[dis.moduleKey] || {};
            const isAvail = modRes.available === true && modRes.risk_percentage != null;
            const riskPct = isAvail ? modRes.risk_percentage : null;
            const signalLabel = isAvail ? getRiskSignalLabel(riskPct, modRes.prediction) : null;
            const missingFields = modRes.missing_fields || [];

            return (
              <div
                key={dis.key}
                style={{
                  background: 'rgba(10, 10, 14, 0.72)',
                  backdropFilter: 'blur(24px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(125%)',
                  border: isAvail 
                    ? (riskPct >= 50 ? '1px solid rgba(248, 113, 113, 0.40)' : (riskPct >= 20 ? '1px solid rgba(251, 191, 36, 0.40)' : '1px solid rgba(255, 255, 255, 0.12)'))
                    : '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '175px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* Title with Emoji */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{dis.emoji}</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dis.diseaseName}
                    </span>
                  </div>

                  {/* Percentage or Insufficient Data */}
                  {isAvail ? (
                    <div>
                      <div style={{ 
                        fontSize: '2.2rem', 
                        fontWeight: 600, 
                        color: riskPct >= 50 ? '#F87171' : (riskPct >= 20 ? '#FBBF24' : 'var(--text-primary)'),
                        letterSpacing: '-0.02em',
                        lineHeight: 1
                      }}>
                        {riskPct}%
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: riskPct >= 50 ? '#F87171' : (riskPct >= 20 ? '#FBBF24' : '#34D399')
                      }}>
                        {signalLabel}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: '#FBBF24',
                        marginBottom: '6px'
                      }}>
                        Insufficient data
                      </div>
                      <div style={{ 
                        fontSize: '0.76rem', 
                        color: 'var(--text-muted)',
                        lineHeight: 1.4
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Missing: </span>
                        {formatMissingFields(missingFields)}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Details Subtle Link */}
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => handleScrollToTechnicalDetails(dis.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-muted)',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>View details</span>
                    <ChevronRight size={12} />
                  </button>

                  {!isAvail && onReturnToInput && (
                    <button
                      onClick={() => onReturnToInput(dis.moduleKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#FBBF24',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Fill
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =============================================================
          SECTION 2 — MY FAMILY'S DISEASE HISTORY
      ============================================================= */}
      <section style={{ marginBottom: '38px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            SECTION 2
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            MY FAMILY'S DISEASE HISTORY
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '3px', margin: 0 }}>
            Known conditions recorded in your family network
          </p>
        </div>

        {/* Grouped by Disease Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {DISEASES.map((dis) => {
            const disKey = dis.familyKey;
            const summary = diseaseSummaries[disKey] || {};
            
            // 1. Affected members: from summary or directly from family members
            const affectedMembers = summary.all_affected || [];
            const hasAffected = affectedMembers.length > 0;

            // 2. Confirmed negative members: explicitly marked 0
            const negativeMembers = (rawMembers || []).filter((m) => {
              if (!m) return false;
              if (m.family_conditions && m.family_conditions[disKey] === 0) return true;
              return false;
            });

            // 3. Check if any history is recorded at all for this disease
            // If family network is empty OR no relative has a defined (non-null) status for this disease
            const hasAnyRecordedStatus = (rawMembers || []).some((m) => {
              if (!m) return false;
              if (m.family_conditions && (m.family_conditions[disKey] === 1 || m.family_conditions[disKey] === 0)) return true;
              if (Array.isArray(m.conditions) && m.conditions.some(c => String(c).toLowerCase().includes(disKey))) return true;
              return false;
            });

            return (
              <div
                key={dis.key}
                style={{
                  background: 'rgba(10, 10, 14, 0.72)',
                  backdropFilter: 'blur(24px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(125%)',
                  border: hasAffected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.10)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Header: DISEASE */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{dis.emoji}</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                      {dis.diseaseName.toUpperCase()}
                    </span>
                  </div>

                  {hasAffected ? (
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {affectedMembers.length} {affectedMembers.length === 1 ? 'relative' : 'relatives'}
                    </span>
                  ) : hasAnyRecordedStatus ? (
                    <span style={{
                      background: 'rgba(52, 211, 153, 0.08)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      color: '#34D399',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      No cases
                    </span>
                  ) : null}
                </div>

                {/* Body: Affected family members list OR status note */}
                {hasAffected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {affectedMembers.map((rel, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.04)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '10px 14px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.05rem' }}>{getRelativeAvatar(rel.relationship)}</span>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {rel.relationship}
                          </span>
                          {rel.name && rel.name !== rel.relationship && (
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              ({rel.name})
                            </span>
                          )}
                        </div>

                        <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.82rem' }}>✓</span>
                      </div>
                    ))}

                    {/* Confirmed negative members note if explicitly marked */}
                    {negativeMembers.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        No known {dis.diseaseName.toLowerCase()} reported for {negativeMembers.map(m => m.relationship || m.name).join(', ')}.
                      </div>
                    )}
                  </div>
                ) : hasAnyRecordedStatus && negativeMembers.length > 0 ? (
                  /* Confirmed Negative (Explicit NO) */
                  <div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.84rem',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '6px'
                    }}>
                      No known cases recorded
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      No known {dis.diseaseName.toLowerCase()} reported for {negativeMembers.map(m => m.relationship || m.name).join(', ')}.
                    </div>
                  </div>
                ) : (
                  /* No family history recorded (All Unknown or no entries) */
                  <div style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.84rem',
                    fontStyle: 'italic',
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '10px',
                    border: '1px dashed rgba(255, 255, 255, 0.12)'
                  }}>
                    No family history recorded
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =============================================================
          SECTION 3 — HOW FAMILY HISTORY CHANGES MY RISK
      ============================================================= */}
      <section style={{ marginBottom: '38px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#06B6D4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            SECTION 3
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            HOW FAMILY HISTORY CHANGES MY RISK
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '3px', margin: 0 }}>
            Comparison of your personal model output with available family-aware analysis.
          </p>
        </div>

        {/* -----------------------------------------------------------
            FAMILY IMPACT OVERVIEW (Fast 5-second scan)
        ----------------------------------------------------------- */}
        <div style={{
          background: 'rgba(10, 10, 14, 0.72)',
          backdropFilter: 'blur(24px) saturate(125%)',
          WebkitBackdropFilter: 'blur(24px) saturate(125%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '22px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            FAMILY IMPACT ON YOUR MODELS
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px'
          }}>
            {DISEASES.map((dis) => {
              const evalData = diseaseEvals[dis.familyKey] || {};
              const faModel = evalData.family_aware_model || {};
              const delta = faModel.delta_percentage_points;
              const faStatus = faModel.status;
              const hasFAModel = faStatus === 'Available' && delta != null;
              const isUncalibrated = faModel.quantification_status === 'evidence_available_but_not_calibrated_to_personal_model';

              return (
                <div
                  key={dis.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{dis.emoji}</span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dis.diseaseName.split('/')[0].trim()}
                    </span>
                  </div>

                  <div>
                    {hasFAModel ? (
                      delta > 0 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: '#FBBF24',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          ↑ +{delta} pp
                        </span>
                      ) : delta < 0 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: '#34D399',
                          background: 'rgba(52, 211, 153, 0.1)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          ↓ {delta} pp
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          → 0 pp
                        </span>
                      )
                    ) : isUncalibrated ? (
                      <span style={{
                        color: '#FBBF24',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 500
                      }}>
                        Uncalibrated
                      </span>
                    ) : (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.76rem',
                        fontWeight: 500
                      }}>
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -----------------------------------------------------------
            DETAIL DISEASE COMPARISON CARDS
        ----------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {DISEASES.map((dis) => {
            const evalData = diseaseEvals[dis.familyKey] || {};
            const persModel = evalData.personal_model || {};
            const faModel = evalData.family_aware_model || {};
            const famHist = evalData.family_history || {};
            const affectedRels = famHist.affected_relatives || [];
            
            const personalProb = persModel.output_percentage;
            const faProb = faModel.output_percentage;
            const delta = faModel.delta_percentage_points;
            const isFAAvailable = faModel.status === 'Available' && delta != null;
            const isPersonalInsufficient = persModel.status === 'insufficient_data' || personalProb == null;
            const hasFamilyRecorded = affectedRels.length > 0;
            const quantStatus = faModel.quantification_status || evalData.comparison?.quantification_status;
            const faEvidence = faModel.evidence || evalData.comparison?.evidence;
            const calcType = faModel.calculation_type;

            const isStateA = quantStatus === 'valid_family_aware_model';
            const isStateB = isFAAvailable && (quantStatus === 'evidence_based_family_estimate' || calcType === 'odds_ratio_transformation');
            const isStateC = quantStatus === 'evidence_available_but_not_calibrated_to_personal_model' || (!isFAAvailable && !!faEvidence && hasFamilyRecorded);

            // Header badge determination
            let badgeText = 'Family-Aware Analysis Not Available';
            let badgeColor = 'var(--text-muted)';
            let badgeBg = 'rgba(255, 255, 255, 0.03)';
            let badgeBorder = 'rgba(255, 255, 255, 0.08)';

            if (isStateA) {
              badgeText = 'Family-Aware Model Active';
              badgeColor = 'var(--accent-cyan)';
              badgeBg = 'rgba(56, 189, 248, 0.08)';
              badgeBorder = 'rgba(56, 189, 248, 0.25)';
            } else if (isStateB) {
              badgeText = 'Evidence-Based Family Estimate Active';
              badgeColor = '#34D399';
              badgeBg = 'rgba(52, 211, 153, 0.08)';
              badgeBorder = 'rgba(52, 211, 153, 0.25)';
            } else if (isStateC) {
              badgeText = 'Published Evidence Available (Uncalibrated)';
              badgeColor = '#FBBF24';
              badgeBg = 'rgba(245, 158, 11, 0.08)';
              badgeBorder = 'rgba(245, 158, 11, 0.25)';
            }

            return (
              <div
                key={dis.key}
                style={{
                  background: 'rgba(10, 10, 14, 0.72)',
                  backdropFilter: 'blur(24px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(125%)',
                  border: isFAAvailable 
                    ? (isStateB ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)')
                    : isStateC 
                      ? '1px solid rgba(245, 158, 11, 0.35)' 
                      : '1px solid rgba(255, 255, 255, 0.10)',
                  borderRadius: '16px',
                  padding: '22px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Title and Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{dis.emoji}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {dis.diseaseName.toUpperCase()}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    color: badgeColor
                  }}>
                    {badgeText}
                  </span>
                </div>

                {/* Content Routing */}
                {isFAAvailable ? (
                  /* STATE A / STATE B: VALID NUMERICAL COMPARISON */
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '14px',
                      background: 'rgba(5, 5, 8, 0.65)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      alignItems: 'center',
                      marginBottom: '14px'
                    }}>
                      {/* Personal Model Output */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Personal Model Output
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.02em' }}>
                          {personalProb}%
                        </div>
                      </div>

                      {/* Family-Adjusted / Family-Aware Model Output */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          {isStateB ? 'Evidence-Adjusted Estimate' : 'Family-Aware Model Output'}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 600, color: isStateB ? '#34D399' : 'var(--accent-cyan)', marginTop: '2px', letterSpacing: '-0.02em' }}>
                          {faProb}%
                        </div>
                      </div>

                      {/* Visual Movement Indicator */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                          Change
                        </div>
                        {delta > 0 ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            color: '#FBBF24',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 700
                          }}>
                            <TrendingUp size={16} />
                            <span>+{delta} pp</span>
                          </div>
                        ) : delta < 0 ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(52, 211, 153, 0.1)',
                            border: '1px solid rgba(52, 211, 153, 0.25)',
                            color: '#34D399',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 700
                          }}>
                            <TrendingDown size={16} />
                            <span>{delta} pp</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            color: 'var(--accent-cyan)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 700
                          }}>
                            <Minus size={16} />
                            <span>0 pp</span>
                          </div>
                        )}
                        <div style={{ fontSize: '0.74rem', color: delta > 0 ? '#FBBF24' : (delta < 0 ? '#34D399' : 'var(--accent-cyan)'), marginTop: '4px', fontWeight: 500 }}>
                          {delta > 0 ? '↑ Increased family-history association' : (delta < 0 ? '↓ Lower family-history association' : '→ No change in model output')}
                        </div>
                      </div>
                    </div>

                    {/* Quantitative Evidence Block */}
                    {faEvidence && (
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.06)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ fontSize: '0.72rem', color: '#06B6D4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Quantitative Evidence ({faEvidence.cohort_population || 'Published Evidence'})
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                            {faEvidence.effect_measure || 'OR'}: {faEvidence.effect_value}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '3px' }}>
                          {faEvidence.effect_value}× higher odds in the cited study ({faEvidence.matched_pattern_label || 'recorded family pattern'})
                        </div>
                        {faEvidence.confidence_interval && (
                          <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginBottom: '3px' }}>
                            95% CI: <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{faEvidence.confidence_interval}</span>
                          </div>
                        )}
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          Source: <span style={{ color: '#94A3B8' }}>{faEvidence.citation}</span>
                        </div>
                      </div>
                    )}

                    {/* Non-Causal Plain Explanation */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      fontSize: '0.86rem',
                      color: '#CBD5E1',
                      lineHeight: 1.5,
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontWeight: 600, color: '#F8FAFC' }}>
                        The family-history-adjusted estimate is {faProb}%, compared with a personal model output of {personalProb}% ({delta > 0 ? `+${delta}` : delta} percentage points).
                      </span>{' '}
                      Recorded parental history is associated with higher risk in published population studies.
                    </div>

                    {/* Recorded Family History */}
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                      <span style={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Recorded family history:{' '}
                      </span>
                      {hasFamilyRecorded ? (
                        <span style={{ color: '#F1F5F9', fontWeight: 500 }}>
                          {affectedRels.map(r => `${r.relationship}: YES`).join('  ·  ')}
                        </span>
                      ) : (
                        <span style={{ color: '#64748B', fontStyle: 'italic' }}>
                          No relatives recorded with this condition
                        </span>
                      )}
                    </div>
                  </div>
                ) : isStateC && faEvidence ? (
                  /* STATE C: EVIDENCE AVAILABLE BUT NOT CALIBRATED TO PERSONAL MODEL */
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      background: 'rgba(245, 158, 11, 0.06)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Personal Model
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isPersonalInsufficient ? '#F59E0B' : '#F1F5F9', marginTop: '2px' }}>
                          {isPersonalInsufficient ? 'Insufficient data' : `${personalProb}%`}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Family-Adjusted Model
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#94A3B8', marginTop: '2px' }}>
                          Unavailable
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Family History
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: hasFamilyRecorded ? '#38BDF8' : '#64748B', marginTop: '2px' }}>
                          {hasFamilyRecorded 
                            ? affectedRels.map(r => `${r.relationship}: YES`).join(', ')
                            : 'Not recorded'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Quantitative Evidence Box for State C */}
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.06)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Quantitative Evidence ({faEvidence.cohort_population || 'Published Evidence'})
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                          {faEvidence.effect_measure || 'OR'}: {faEvidence.effect_value}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '3px' }}>
                        {faEvidence.effect_value}× higher odds in the cited study ({faEvidence.matched_pattern_label || 'recorded family pattern'})
                      </div>
                      {faEvidence.confidence_interval && (
                        <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginBottom: '3px' }}>
                          95% CI: <span style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{faEvidence.confidence_interval}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '8px' }}>
                        Source: <span style={{ color: '#94A3B8' }}>{faEvidence.citation}</span>
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#FBBF24',
                        background: 'rgba(245, 158, 11, 0.08)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        lineHeight: 1.45
                      }}>
                        Personal-model probability was not numerically adjusted because the published effect could not be validly calibrated to this model.
                      </div>
                    </div>

                    {/* Explanatory Message */}
                    <div style={{ 
                      fontSize: '0.84rem', 
                      color: '#94A3B8', 
                      lineHeight: 1.5,
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      Family-history effect: increased odds reported in published evidence. Personal-model probability was not numerically adjusted because the published effect could not be validly calibrated to this model. GeneGuard does not fabricate an uncalibrated percentage adjustment.
                    </div>
                  </div>
                ) : (
                  /* NO FAMILY HISTORY OR NO EVIDENCE AVAILABLE */
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      background: 'rgba(5, 5, 8, 0.65)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Personal Model
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isPersonalInsufficient ? '#F59E0B' : '#F1F5F9', marginTop: '2px' }}>
                          {isPersonalInsufficient ? 'Insufficient data' : `${personalProb}%`}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Family-Aware Analysis
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#94A3B8', marginTop: '2px' }}>
                          Not available
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                          Family History
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: hasFamilyRecorded ? '#38BDF8' : '#64748B', marginTop: '2px' }}>
                          {hasFamilyRecorded 
                            ? affectedRels.map(r => `${r.relationship}: YES`).join(', ')
                            : 'Not recorded'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Message */}
                    <div style={{ 
                      fontSize: '0.84rem', 
                      color: '#94A3B8', 
                      lineHeight: 1.5,
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      {hasFamilyRecorded ? (
                        <>
                          <span style={{ color: '#F1F5F9', fontWeight: 600 }}>
                            Family history recorded, but a family-aware numerical model is not currently available for this condition.
                          </span>{' '}
                          GeneGuard does not calculate a speculative or unvalidated percentage adjustment.
                        </>
                      ) : (
                        'No family history recorded for this condition, and a family-aware numerical comparison is not available.'
                      )}
                    </div>
                  </div>
                )}

                {/* Section 3 AI Clinical Evaluation for this disease */}
                {evalData.ai_evaluation && (
                  <div style={{
                    marginTop: '14px',
                    background: 'rgba(6, 182, 212, 0.06)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(6, 182, 212, 0.22)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    fontSize: '0.84rem',
                    color: '#E2E8F0',
                    lineHeight: 1.5
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                      color: '#38BDF8',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <span>AI Clinical Evaluation</span>
                    </div>
                    <div style={{ color: '#CBD5E1' }}>{evalData.ai_evaluation}</div>
                    {evalData.ai_data_limitations && evalData.ai_data_limitations.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#94A3B8' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 600 }}>Data Note: </span>
                        {evalData.ai_data_limitations.join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =============================================================
          SECTION 4 — FINAL AI EVALUATION & MODEL DETAILS
      ============================================================= */}
      <section id="section-technical-details" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            SECTION 4
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            CLINICAL AI EVALUATION & LINEAGE
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Comprehensive clinical interpretation and family network synthesis
          </p>
        </div>

        {/* AI Final Evaluation Content */}
        {aiEval.status === 'unavailable' ? (
          <div style={{
            background: 'rgba(10, 10, 14, 0.72)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '16px',
            padding: '22px',
            marginBottom: '16px',
            backdropFilter: 'blur(24px) saturate(125%)',
            WebkitBackdropFilter: 'blur(24px) saturate(125%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EAB308', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <span>AI final evaluation unavailable.</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
              Personal disease models and pedigree calculations remain fully active above. AI narrative synthesis is temporarily offline.
            </p>
          </div>
        ) : (aiEval.overall_summary || aiEval.family_network_summary) ? (
          <div style={{
            background: 'rgba(10, 10, 14, 0.72)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '22px',
            marginBottom: '16px',
            backdropFilter: 'blur(24px) saturate(125%)',
            WebkitBackdropFilter: 'blur(24px) saturate(125%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>✦</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Clinical Synthesis & Kinship Impact Summary
                </span>
              </div>
              <span style={{
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: 'var(--accent-cyan)',
                fontSize: '0.68rem',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                Gemini Interpretation Layer
              </span>
            </div>

            {/* Overall Narrative */}
            {aiEval.overall_summary && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Personalized Risk Synthesis
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{aiEval.overall_summary}</div>
              </div>
            )}

            {/* Family Network Hereditary Summary */}
            {aiEval.family_network_summary && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: (aiEval.important_data_gaps && aiEval.important_data_gaps.length > 0) ? '12px' : '0',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Family Network & Kinship Structure
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{aiEval.family_network_summary}</div>
              </div>
            )}

            {/* Important Data Gaps */}
            {aiEval.important_data_gaps && aiEval.important_data_gaps.length > 0 && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.05)',
                border: '1px solid rgba(234, 179, 8, 0.20)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '0.8rem',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#EAB308', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Important Data Gaps & Considerations
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {aiEval.important_data_gaps.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <div style={{
          background: 'rgba(10, 10, 14, 0.72)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          backdropFilter: 'blur(24px) saturate(125%)',
          WebkitBackdropFilter: 'blur(24px) saturate(125%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          {/* Collapsible Header Toggle Button */}
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                TECHNICAL MODEL & DATA SPECIFICATIONS
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Pipeline parameters, feature mappings, and trained model lineage
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              padding: '5px 10px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.74rem',
              fontWeight: 500
            }}>
              <span>{showTechnicalDetails ? 'Hide details' : 'View details'}</span>
              {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {/* Collapsible Content */}
          {showTechnicalDetails && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {DISEASES.map((dis) => {
                  const evalData = diseaseEvals[dis.familyKey] || {};
                  const persModel = evalData.personal_model || {};
                  const faModel = evalData.family_aware_model || {};
                  const faEvidence = faModel.evidence || evalData.comparison?.evidence;
                  const modRes = personal[dis.moduleKey] || {};
                  const missingFields = modRes.missing_fields || [];
                  const isSelected = selectedTechDisease === dis.key;

                  return (
                    <div
                      key={dis.key}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {dis.diseaseName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Module: {dis.moduleKey}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        fontSize: '0.78rem'
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Personal Model Status
                          </div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                            {persModel.name || 'Personal Classifier'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>
                            Status: <span style={{ color: persModel.status === 'Available' ? '#10B981' : '#EAB308' }}>{persModel.status || 'Active'}</span> · Ver: {persModel.version || 'v1'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Family-Aware Model Status
                          </div>
                          <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                            {faModel.name || 'Not Available'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>
                            Status: <span style={{ color: faModel.status === 'Available' ? '#10B981' : 'var(--text-muted)' }}>{faModel.status || 'N/A'}</span> · Calib: {faModel.calibration_status || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Feature Completeness
                          </div>
                          <div style={{ color: missingFields.length === 0 ? '#10B981' : '#EAB308', marginTop: '2px', fontWeight: 500 }}>
                            {missingFields.length === 0 ? 'All features provided' : `${missingFields.length} missing`}
                          </div>
                          {missingFields.length > 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '1px' }}>
                              Missing: {missingFields.slice(0, 3).join(', ')}{missingFields.length > 3 ? '...' : ''}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Training Data Source
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.72rem', lineHeight: 1.3 }}>
                            {dis.dataSource}
                          </div>
                        </div>
                      </div>

                      {faEvidence && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.76rem' }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Evidence Registry Source
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.72rem' }}>
                              {faEvidence.citation}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Epidemiological Effect
                            </div>
                            <div style={{ color: 'var(--accent-cyan)', marginTop: '2px', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                              {faEvidence.effect_measure}: {faEvidence.effect_value} {faEvidence.confidence_interval ? `(95% CI: ${faEvidence.confidence_interval})` : ''} · {faEvidence.cohort_population || 'Cohort'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Strict Medical Disclaimer */}
              <div style={{
                marginTop: '16px',
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Clinical Disclaimer: </span>
                  GeneGuard is an investigational risk assessment tool powered by machine learning. It is designed to assist in pattern recognition from self-reported data and is NOT a medical diagnosis. Always consult a licensed physician or clinical genetic counselor for medical decisions.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
