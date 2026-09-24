import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Play, 
  ArrowRight, 
  Info, 
  Activity, 
  Heart, 
  Droplet, 
  Gauge, 
  Sparkles, 
  FileText,
  Brain,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import PredictionCard from '../components/PredictionCard';

export default function AnalysisDashboard({
  schemas,
  selectedPerson,
  predictionResults = {},
  onRunAllPredictions,
  onNavigateToModule,
  familyMembers = [],
  finalAnalysis = null
}) {
  const [evalToast, setEvalToast] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    if (onRunAllPredictions) {
      await onRunAllPredictions();
    }
    setIsEvaluating(false);
    setEvalToast(true);
    setTimeout(() => setEvalToast(false), 4000);
  };

  // Helper to extract relatives with a specific disease condition
  const getAffectedRelativesFor = (conditionKey) => {
    const list = [];
    familyMembers.forEach((m) => {
      const conds = m.conditions || [];
      const isAffected = conds.some((c) => {
        const cLower = String(c).toLowerCase();
        if (conditionKey === 'cardiovascular') return cLower.includes('heart') || cLower.includes('cardio');
        if (conditionKey === 'metabolic') return cLower.includes('diabet');
        if (conditionKey === 'blood_pressure') return cLower.includes('hypertens') || cLower.includes('pressure');
        if (conditionKey === 'thyroid') return cLower.includes('thyroid');
        if (conditionKey === 'cancer') return cLower.includes('cancer') || cLower.includes('resp');
        return false;
      });
      if (isAffected) {
        list.push({
          name: m.name || m.relationship,
          relationship: m.relationship,
          status: 'Diagnosed'
        });
      }
    });
    return list;
  };

  // Data helpers for the 5 disease modules
  const getModuleSummary = (modKey) => {
    const res = predictionResults[modKey];
    const diseaseEvals = finalAnalysis?.report?.family_risk_analysis?.disease_evaluations || {};
    
    // Map module key to family risk key if available
    let familyKey = modKey;
    if (modKey === 'metabolic') familyKey = 'diabetes';
    if (modKey === 'blood_pressure') familyKey = 'hypertension';
    
    const familyEval = diseaseEvals[familyKey];

    const isAvailable = res && res.available;
    const personalPct = isAvailable 
      ? (res.risk_percentage !== undefined ? res.risk_percentage : (res.confidence_percentage || 0))
      : null;

    const familyAwarePct = familyEval?.family_adjusted_percentage ?? null;
    const delta = familyEval?.change_percentage_points ?? null;

    let displayPct = personalPct !== null ? `${personalPct}%` : '—';
    if (familyAwarePct !== null) {
      displayPct = `${familyAwarePct}%`;
    }

    let statusTag = 'Personal ML';
    if (familyAwarePct !== null) statusTag = 'Family Active';
    else if (!isAvailable) statusTag = 'Pending Data';

    return {
      isAvailable,
      personalPct,
      familyAwarePct,
      displayPct,
      delta,
      statusTag,
      prediction: res?.prediction || 'Pending'
    };
  };

  const diseaseDefinitions = [
    {
      key: 'cardiovascular',
      title: 'Cardiovascular',
      subtitle: 'Personal ML',
      icon: <Heart size={18} color="var(--text-muted)" />,
      activeIcon: <Heart size={18} color="var(--accent-cyan)" />,
      defaultDescription: 'No family history recorded for this condition, and a family-aware numerical comparison is not available.',
      aiRationale: 'Personal ML model evaluates cardiovascular risk signal based on lipid biomarkers and resting blood pressure. Second-degree relatives remain unrecorded.',
      dataNote: 'Second-degree relatives are unrecorded • Family-aware numerical model is unavailable'
    },
    {
      key: 'metabolic',
      title: 'Metabolic / Diabetes',
      subtitle: 'Personal ML',
      icon: <Droplet size={18} color="var(--text-muted)" />,
      activeIcon: <Droplet size={18} color="var(--accent-cyan)" />,
      defaultDescription: 'Qualitative family history recorded. GeneGuard deliberately refrains from speculative or unvalidated percentage adjustments.',
      aiRationale: 'Personal ML model reflects metabolic profile based on fasting glucose and insulin metrics. First-degree relatives carry primary qualitative weight.',
      dataNote: 'Ages at diagnosis for relatives are qualitative • Synthetic percentage escalation avoided'
    },
    {
      key: 'blood_pressure',
      title: 'Blood Pressure',
      subtitle: 'Family Active',
      icon: <Gauge size={18} color="var(--accent-cyan)" />,
      activeIcon: <Gauge size={18} color="var(--accent-cyan)" />,
      defaultDescription: 'Quantitative lineage-calibrated odds ratio model active based on recorded parental hypertension evidence.',
      aiRationale: 'Validated epidemiological model evaluates parental hypertension history alongside measured systolic and diastolic levels.',
      dataNote: 'Quantitative lineage calibration applied • Evidence: Biparental and unparental relative risk coefficients'
    },
    {
      key: 'thyroid',
      title: 'Thyroid Axis',
      subtitle: 'Personal ML',
      icon: <Sparkles size={18} color="var(--text-muted)" />,
      activeIcon: <Sparkles size={18} color="var(--accent-cyan)" />,
      defaultDescription: 'Family history recorded where applicable. Free thyroxine and TSH biomarkers serve as primary objective diagnostic drivers.',
      aiRationale: 'Personal ML evaluates thyroid axis function using calibrated reference bands for TSH, T3, and Free Thyroxine Index.',
      dataNote: 'Endocrine panel operates on strict laboratory reference ranges • Family history qualitative'
    },
    {
      key: 'cancer',
      title: 'Cancer / Respiratory',
      subtitle: 'Calibrated',
      icon: <FileText size={18} color="var(--accent-cyan)" />,
      activeIcon: <FileText size={18} color="var(--accent-cyan)" />,
      defaultDescription: 'Multi-factorial symptom rating and environmental risk model evaluated with baseline genomic priors.',
      aiRationale: 'Evaluated against multi-cohort oncology register with high-weight environmental exposure weighting.',
      dataNote: 'Symptom severity scales and demographic baseline • Model calibrated against validated cohort'
    }
  ];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* STATUS & MICRO-HEADER CONTEXT */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Clinical Evaluation Engine v4.2
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Dataset: Multi-Cohort Longitudinal
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Health Risk Analysis Summary
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(8, 8, 8, 0.58)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35)'
            }}
          >
            <UserCheck size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Target Profile:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedPerson?.name || 'Patient'} {selectedPerson?.age ? `(${selectedPerson.age} yrs)` : ''}
            </span>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleEvaluate}
            disabled={isEvaluating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              padding: '8px 18px',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <Play size={14} fill="#000000" />
            <span>{isEvaluating ? 'Evaluating Models...' : 'Evaluate All Models'}</span>
          </button>
        </div>
      </div>

      {/* CLINICAL PROTOCOL DISCLAIMER BAR */}
      <div 
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(8, 8, 8, 0.58)',
          backdropFilter: 'blur(24px) saturate(115%)',
          WebkitBackdropFilter: 'blur(24px) saturate(115%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '32px'
        }}
      >
        <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Each disease model operates independently based on its original training dataset and parameters. 
          GeneGuard deliberately refrains from calculating an artificial combined score to avoid false clinical certainty and synthetic confounding.
        </p>
      </div>

      {/* SECTION 1: OVERVIEW DISEASE PODS */}
      <div style={{ marginBottom: '40px' }}>
        <div className="glass-header-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Module Summary
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>5 Primary Vectors</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Independent Calibrations</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {diseaseDefinitions.map((def) => {
            const summary = getModuleSummary(def.key);
            const isFamilyActive = summary.statusTag === 'Family Active';

            return (
              <div
                key={def.key}
                onClick={() => onNavigateToModule(def.key)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(8, 8, 8, 0.58)',
                  backdropFilter: 'blur(28px) saturate(115%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(115%)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                  border: isFamilyActive 
                    ? '1px solid rgba(56, 189, 248, 0.35)' 
                    : '1px solid rgba(255, 255, 255, 0.10)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '135px',
                  transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 15, 15, 0.72)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(8, 8, 8, 0.58)';
                  e.currentTarget.style.borderColor = isFamilyActive 
                    ? '1px solid rgba(56, 189, 248, 0.35)' 
                    : '1px solid rgba(255, 255, 255, 0.10)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    {isFamilyActive ? def.activeIcon : def.icon}
                    <span 
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isFamilyActive ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                        color: isFamilyActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        border: isFamilyActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                        fontWeight: 500
                      }}
                    >
                      {summary.statusTag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {def.title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {summary.displayPct}
                    </span>
                    {summary.delta !== null && (
                      <span style={{ fontSize: '0.72rem', color: summary.delta < 0 ? '#34D399' : '#F87171', fontWeight: 600 }}>
                        {summary.delta > 0 ? `+${summary.delta}pp` : `${summary.delta}pp`}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {summary.prediction}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: MY FAMILY'S DISEASE HISTORY */}
      <div style={{ marginBottom: '40px' }}>
        <div className="glass-header-box">
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Section 2
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: '2px 0 0 0' }}>
              My Family's Disease History
            </h2>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Known conditions recorded in your primary network ({familyMembers.length} relatives)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {diseaseDefinitions.map((def) => {
            const affected = getAffectedRelativesFor(def.key);

            return (
              <div
                key={def.key}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(8, 8, 8, 0.58)',
                  backdropFilter: 'blur(28px) saturate(115%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(115%)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {def.icon}
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {def.title.split('/')[0]}
                    </span>
                  </div>
                  {affected.length > 0 ? (
                    <span 
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--accent-cyan)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        fontWeight: 500
                      }}
                    >
                      {affected.length} relative{affected.length > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>

                {affected.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {affected.map((rel, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{rel.relationship}</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{rel.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No family history recorded
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: HOW FAMILY HISTORY CHANGES MY RISK */}
      <div style={{ marginBottom: '32px' }}>
        <div className="glass-header-box">
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Section 3
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: '2px 0 0 0' }}>
              How Family History Changes My Risk
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Direct comparison between personal and lineage-calibrated models
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {diseaseDefinitions.map((def) => {
            const summary = getModuleSummary(def.key);
            const affected = getAffectedRelativesFor(def.key);
            const isFamilyActive = summary.statusTag === 'Family Active';
            const schema = schemas ? schemas[def.key] : null;

            return (
              <div
                key={def.key}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(8, 8, 8, 0.58)',
                  backdropFilter: 'blur(32px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(120%)',
                  boxShadow: '0 10px 35px rgba(0, 0, 0, 0.50)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  padding: '24px'
                }}
              >
                {/* Header inside Panel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {def.icon}
                    </div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                      {def.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isFamilyActive ? 'var(--accent-cyan)' : 'var(--text-muted)'
                      }} 
                    />
                    <span 
                      style={{
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: isFamilyActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}
                    >
                      {isFamilyActive ? 'Family-Aware Model Active' : 'Family-Aware Analysis Not Available'}
                    </span>
                  </div>
                </div>

                {/* Triple Column Readout */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    padding: '16px 20px',
                    background: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Personal Model Output
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {summary.personalPct !== null ? `${summary.personalPct}%` : 'Not evaluated'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Family-Aware Output
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 600, color: isFamilyActive ? 'var(--accent-cyan)' : 'var(--text-muted)', letterSpacing: '-0.02em' }}>
                      {summary.familyAwarePct !== null ? `${summary.familyAwarePct}%` : 'Not available'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Movement / Impact
                    </div>
                    {summary.delta !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: summary.delta < 0 ? '#34D399' : '#F87171',
                            fontWeight: 600,
                            fontSize: '0.88rem'
                          }}
                        >
                          {summary.delta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                          {summary.delta > 0 ? `+${summary.delta}` : summary.delta} pp
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {summary.delta < 0 ? 'Lower risk signal' : 'Higher risk signal'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {affected.length > 0 
                          ? `${affected.map(a => `${a.relationship}: YES`).join(', ')}`
                          : 'Not recorded'
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Qualitative / Description Note */}
                <div style={{ marginTop: '14px', padding: '0 2px' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {def.defaultDescription}
                  </p>
                </div>

                {/* AI Clinical Assessment Box */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.50)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Brain size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      AI Clinical Evaluation
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 10px 0' }}>
                    {def.aiRationale}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Data Note:</strong> {def.dataNote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE TOAST FEEDBACK */}
      {evalToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.60)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Evaluation Complete
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              All 5 clinical sub-models recalibrated against local biometrics.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
