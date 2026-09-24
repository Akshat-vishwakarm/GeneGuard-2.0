import React, { useState } from 'react';
import DiseaseCard from '../components/DiseaseCard';
import DynamicInputForm from '../components/DynamicInputForm';
import PredictionCard from '../components/PredictionCard';
import FamilyHistoryEvidence from '../components/FamilyHistoryEvidence';
import PatientProfileCard from '../components/PatientProfileCard';
import ThyroidReportSection from '../components/ThyroidReportSection';
import {
  Activity,
  RefreshCw,
  Sparkles,
  RotateCcw,
  User,
  FileUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function HealthInput({
  schemas,
  selectedPerson,
  patientProfile,
  onSaveProfile,
  onClearProfile,
  formValues = {},
  onInputChange,
  predictionResults = {},
  onRunPrediction,
  missingFieldsMap = {},
  isPredictingMap = {},
  onRunAllPredictions,
  onApplyVerifiedReportData,
  onFillNormalValues,
  onClearModuleInputs,
  onOpenUploadModal,
  demoFieldsMap = {},
  activeModule: propActiveModule,
  setActiveModule: propSetActiveModule
}) {
  const [internalActiveModule, setInternalActiveModule] = useState('cardiovascular');
  const activeModule = propActiveModule || internalActiveModule;
  const setActiveModule = propSetActiveModule || setInternalActiveModule;
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  if (!schemas) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading GeneGuard Model Registry...</div>;
  }

  const modules = ['cardiovascular', 'metabolic', 'blood_pressure', 'thyroid', 'cancer'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFillNormalWithToast = (modKey) => {
    if (onFillNormalValues) {
      onFillNormalValues(modKey);
      showToast('Demo / Normal values filled (real profile values preserved)');
    }
  };

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.60)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FFFFFF',
            fontSize: '0.86rem',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-cyan)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & TOOLBAR */}
      <div
        className="glass-header-box"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '18px 22px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
            GeneGuard Health Analysis Interface
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
            Set your global profile once, upload lab reports once, and enter only missing model-specific information.
          </p>
        </div>

        {/* Toolbar: Actions [ Fill Normal / Demo Values ], [ Clear Current Module ], [ Upload Lab Report ], [ Run All 5 Disease Models ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Fill Normal / Demo Values Button */}
          {onFillNormalValues && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleFillNormalWithToast(activeModule)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(8, 8, 8, 0.58)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '0.84rem',
                padding: '8px 15px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
              title="Populate representative normal reference values for the active module (preserves your Patient Profile)"
            >
              <Sparkles size={14} color="var(--accent-cyan)" />
              <span>Fill Normal / Demo Values</span>
            </button>
          )}

          {/* Clear Current Module Button */}
          {onClearModuleInputs && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onClearModuleInputs(activeModule)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                padding: '8px 13px',
                color: 'var(--text-muted)'
              }}
              title="Clear only current module inputs without touching Patient Profile"
            >
              <RotateCcw size={13} />
              <span>Clear Current Module</span>
            </button>
          )}

          {/* Universal Upload Lab Report Button */}
          {onOpenUploadModal && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onOpenUploadModal(activeModule)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                padding: '8px 14px',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
              title="Upload lab report to extract and distribute values across eligible models"
            >
              <FileUp size={14} color="var(--accent-cyan)" />
              <span>Upload Lab Report</span>
            </button>
          )}

          {/* Run All 5 Disease Models Button */}
          <button
            className="btn btn-primary"
            onClick={onRunAllPredictions}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              padding: '8px 18px',
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} />
            <span>Run All 5 Disease Models</span>
          </button>
        </div>
      </div>

      {/* FEATURE 1: GLOBAL PATIENT PROFILE CARD */}
      <PatientProfileCard
        profile={patientProfile}
        onSaveProfile={onSaveProfile}
        onClearProfile={onClearProfile}
        isEditorOpen={isProfileEditorOpen}
        setIsEditorOpen={setIsProfileEditorOpen}
      />

      {/* Family History Evidence */}
      <FamilyHistoryEvidence person={selectedPerson} />

      {/* 5 Disease Module Launcher Cards */}
      <div className="grid-5" style={{ marginBottom: '28px' }}>
        {modules.map((modKey) => (
          <DiseaseCard
            key={modKey}
            moduleKey={modKey}
            schema={schemas[modKey]}
            isActive={activeModule === modKey}
            onSelect={(k) => setActiveModule(k)}
            predictionResult={predictionResults[modKey]}
            patientProfile={patientProfile}
            onOpenUpload={(mod) => onOpenUploadModal && onOpenUploadModal(mod)}
          />
        ))}
      </div>

      {/* Dedicated Thyroid Report Section inside Thyroid Analysis module */}
      {activeModule === 'thyroid' && (
        <div style={{ marginBottom: '24px' }}>
          <ThyroidReportSection onApplyVerifiedReportData={onApplyVerifiedReportData} />
        </div>
      )}

      {/* Active Disease Module Form & Outcome Display */}
      {activeModule && (
        <div className="grid-2">
          <div>
            <DynamicInputForm
              moduleKey={activeModule}
              schema={schemas[activeModule]}
              formValues={formValues[activeModule] || {}}
              onInputChange={(k, v) => onInputChange(activeModule, k, v)}
              onRunPrediction={onRunPrediction}
              missingFieldsAlert={missingFieldsMap[activeModule]}
              isPredicting={isPredictingMap[activeModule]}
              patientProfile={patientProfile}
              onOpenProfileEditor={() => setIsProfileEditorOpen(true)}
              onFillNormalValues={handleFillNormalWithToast}
              onClearModuleInputs={onClearModuleInputs}
              onOpenUpload={onOpenUploadModal}
              demoFields={demoFieldsMap[activeModule] || {}}
            />
          </div>

          <div>
            {predictionResults[activeModule] ? (
              <PredictionCard
                moduleKey={activeModule}
                result={predictionResults[activeModule]}
                title={schemas[activeModule]?.name}
              />
            ) : (
              <div
                className="card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  minHeight: '360px'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}
                >
                  <Activity size={30} color="var(--text-muted)" />
                </div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1.05rem' }}>
                  Awaiting Input Completion
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.5 }}>
                  Complete the {schemas[activeModule]?.name} parameters on the left or upload a report, then click Run Analysis to execute the trained model.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
