import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Edit2,
  Check,
  Trash2,
  ArrowRight,
  ShieldCheck,
  FileUp,
  RotateCcw
} from 'lucide-react';
import { MODEL_FEATURE_REGISTRY } from '../utils/normalValueRegistry';
import { API_BASE } from '../utils/apiConfig';

export default function ReportUploadModal({
  isOpen,
  onClose,
  onApplyExtractedValues,
  currentFormValues = {},
  targetModule = null
}) {
  const [reportText, setReportText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedItems, setExtractedItems] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rawTextSample, setRawTextSample] = useState('');

  // Conflict management state: { [testId]: 'report' | 'existing' }
  const [conflictChoices, setConflictChoices] = useState({});

  // Editable items state in verification screen: { [testId]: { ...item, accepted: boolean, editedValue: number } }
  const [verifiedItemsState, setVerifiedItemsState] = useState({});

  if (!isOpen) return null;

  const sampleGeneralLabReport = `PATIENT COMPREHENSIVE LAB REPORT
Report ID: LAB-2026-9921
Patient: John Doe
Date of Collection: 24-Sep-2026

THYROID PANEL:
Serum TSH: 5.8 mIU/L  (Ref: 0.4 - 4.2)
Total T3: 0.82 ng/mL  (Ref: 0.8 - 2.0)
Total Thyroxine (T4): 6.1 ug/dL  (Ref: 5.0 - 12.0)
Thyroxine Uptake (T4U): 0.92  (Ref: 0.7 - 1.3)
Free Thyroxine Index (FTI): 6.6  (Ref: 6.0 - 12.0)

METABOLIC & LIPID PANEL:
Fasting Glucose: 98 mg/dL  (Ref: 70 - 99)
HbA1c: 5.4 %  (Ref: < 5.7)
Total Cholesterol: 185 mg/dL  (Ref: < 200)
LDL Cholesterol: 112 mg/dL  (Ref: < 100)
HDL Cholesterol: 54 mg/dL  (Ref: > 40)
Triglycerides: 138 mg/dL  (Ref: < 150)
Fasting Insulin: 7.2 uIU/mL  (Ref: 2.6 - 24.9)

VITALS & HEMATOLOGY:
Systolic Blood Pressure: 122 mmHg  (Ref: 90 - 120)
Diastolic Blood Pressure: 78 mmHg  (Ref: 60 - 80)
Hemoglobin: 14.6 g/dL  (Ref: 13.5 - 17.5)`;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await fetch(`${API_BASE}/extract-report`, {
          method: 'POST',
          body: formData
        });
      } else {
        const textToUse = reportText.trim();
        if (!textToUse) {
          setErrorMsg('Please upload a lab report file or enter report text.');
          setIsLoading(false);
          return;
        }
        response = await fetch(`${API_BASE}/extract-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_text: textToUse })
        });
      }

      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.extracted_items) && data.extracted_items.length > 0) {
        setExtractedItems(data.extracted_items);
        setRawTextSample(data.raw_text_extracted || '');

        // Initialize verification state
        const initialVerified = {};
        const initialConflicts = {};

        data.extracted_items.forEach((item) => {
          const testId = item.id;
          initialVerified[testId] = {
            ...item,
            accepted: true,
            editedValue: item.value,
            source: selectedFile ? selectedFile.name : 'Uploaded Lab Report'
          };

          // Detect conflict with existing manual form inputs
          const existingVal = getExistingValueForTest(testId);
          if (existingVal !== null && existingVal !== undefined && existingVal !== '' && Number(existingVal) !== Number(item.value)) {
            // Default conflict choice to 'report' (user can toggle)
            initialConflicts[testId] = 'report';
          }
        });

        setVerifiedItemsState(initialVerified);
        setConflictChoices(initialConflicts);
      } else {
        setErrorMsg(data.message || 'No recognizable laboratory measurements found in the uploaded report.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to backend extraction service. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to find if existing form inputs already have a value for this test
  const getExistingValueForTest = (testId) => {
    if (testId === 'tsh') return currentFormValues.thyroid?.tsh;
    if (testId === 't3') return currentFormValues.thyroid?.t3;
    if (testId === 'tt4') return currentFormValues.thyroid?.tt4;
    if (testId === 't4u') return currentFormValues.thyroid?.t4u;
    if (testId === 'fti') return currentFormValues.thyroid?.fti;
    if (testId === 'fasting_glucose') return currentFormValues.metabolic?.fasting_glucose;
    if (testId === 'total_cholesterol') return currentFormValues.metabolic?.total_cholesterol;
    if (testId === 'ldl') return currentFormValues.metabolic?.ldl;
    if (testId === 'hdl') return currentFormValues.metabolic?.hdl;
    if (testId === 'triglycerides') return currentFormValues.metabolic?.triglycerides;
    if (testId === 'fasting_insulin') return currentFormValues.metabolic?.fasting_insulin;
    if (testId === 'sys_bp') return currentFormValues.cardiovascular?.ap_hi || currentFormValues.metabolic?.sys_bp;
    if (testId === 'dia_bp') return currentFormValues.cardiovascular?.ap_lo || currentFormValues.metabolic?.dia_bp;
    if (testId === 'hemoglobin') return currentFormValues.blood_pressure?.hemoglobin;
    return null;
  };

  const toggleItemAcceptance = (testId) => {
    setVerifiedItemsState((prev) => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        accepted: !prev[testId].accepted
      }
    }));
  };

  const handleValueChange = (testId, newVal) => {
    const val = parseFloat(newVal);
    setVerifiedItemsState((prev) => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        editedValue: isNaN(val) ? newVal : val
      }
    }));
  };

  const handleApplyVerifiedValues = () => {
    const finalVerifiedItems = [];
    const mappedByModule = {
      cardiovascular: {},
      metabolic: {},
      blood_pressure: {},
      thyroid: {},
      cancer: {}
    };

    const verifiedRecords = [];
    const currentTimestamp = new Date().toISOString();

    Object.values(verifiedItemsState).forEach((item) => {
      if (!item.accepted) return; // User rejected this value

      const testId = item.id;
      let effectiveValue = parseFloat(item.editedValue);
      if (isNaN(effectiveValue)) return;

      // Handle conflict resolution
      if (conflictChoices[testId] === 'existing') {
        const existingVal = getExistingValueForTest(testId);
        if (existingVal !== null && existingVal !== undefined) {
          effectiveValue = parseFloat(existingVal);
        }
      }

      finalVerifiedItems.push({
        id: testId,
        test_key: item.test_key,
        display_name: item.display_name,
        value: effectiveValue,
        unit: item.unit,
        source: item.source || 'Uploaded Lab Report',
        timestamp: currentTimestamp
      });

      // Module distribution
      if (testId === 'tsh') mappedByModule.thyroid.tsh = effectiveValue;
      if (testId === 't3') mappedByModule.thyroid.t3 = effectiveValue;
      if (testId === 'tt4') mappedByModule.thyroid.tt4 = effectiveValue;
      if (testId === 't4u') mappedByModule.thyroid.t4u = effectiveValue;
      if (testId === 'fti') mappedByModule.thyroid.fti = effectiveValue;

      if (testId === 'sys_bp') {
        mappedByModule.cardiovascular.ap_hi = effectiveValue;
        mappedByModule.metabolic.sys_bp = effectiveValue;
        mappedByModule.blood_pressure.sys_bp = effectiveValue;
      }
      if (testId === 'dia_bp') {
        mappedByModule.cardiovascular.ap_lo = effectiveValue;
        mappedByModule.metabolic.dia_bp = effectiveValue;
        mappedByModule.blood_pressure.dia_bp = effectiveValue;
      }
      if (testId === 'total_cholesterol') {
        mappedByModule.metabolic.total_cholesterol = effectiveValue;
        if (effectiveValue < 200) mappedByModule.cardiovascular.cholesterol = 'normal';
        else if (effectiveValue < 240) mappedByModule.cardiovascular.cholesterol = 'above_normal';
        else mappedByModule.cardiovascular.cholesterol = 'high';
      }
      if (testId === 'fasting_glucose') {
        mappedByModule.metabolic.fasting_glucose = effectiveValue;
        if (effectiveValue < 100) mappedByModule.cardiovascular.gluc = 'normal';
        else if (effectiveValue < 126) mappedByModule.cardiovascular.gluc = 'above_normal';
        else mappedByModule.cardiovascular.gluc = 'high';
      }
      if (testId === 'ldl') mappedByModule.metabolic.ldl = effectiveValue;
      if (testId === 'hdl') mappedByModule.metabolic.hdl = effectiveValue;
      if (testId === 'triglycerides') mappedByModule.metabolic.triglycerides = effectiveValue;
      if (testId === 'fasting_insulin') mappedByModule.metabolic.fasting_insulin = effectiveValue;
      if (testId === 'hemoglobin') mappedByModule.blood_pressure.hemoglobin = effectiveValue;

      verifiedRecords.push({
        source: item.source || 'Uploaded Lab Report',
        verified: true,
        test: item.display_name,
        test_key: item.test_key,
        value: effectiveValue,
        unit: item.unit,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      });
    });

    onApplyExtractedValues(mappedByModule, verifiedRecords, finalVerifiedItems);
    onClose();
  };

  // Inspect missing features for target module if specified
  const getMissingFeaturesForTarget = () => {
    if (!targetModule || !verifiedItemsState) return null;
    const extractedIds = Object.keys(verifiedItemsState);

    if (targetModule === 'thyroid') {
      const required = ['tsh', 't3', 'tt4', 't4u'];
      const present = required.filter((id) => extractedIds.includes(id));
      const missing = required.filter((id) => !extractedIds.includes(id));
      return { present, missing, moduleName: 'Thyroid Analysis' };
    }
    if (targetModule === 'metabolic') {
      const required = ['fasting_glucose', 'total_cholesterol', 'ldl', 'hdl', 'triglycerides'];
      const present = required.filter((id) => extractedIds.includes(id));
      const missing = required.filter((id) => !extractedIds.includes(id));
      return { present, missing, moduleName: 'Metabolic Analysis' };
    }
    return null;
  };

  const missingInfo = getMissingFeaturesForTarget();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: 'none',
          padding: '24px'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              <FileUp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Universal Medical Lab Report Extraction
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                Upload once • Extract raw lab metrics • Verify values • Intelligently distribute to eligible models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: UPLOAD / PASTE VIEW */}
        {!extractedItems ? (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Extraction Principle: </strong>
              The OCR/extraction layer only extracts verified numbers and units. It{' '}
              <strong style={{ color: '#EF4444' }}>NEVER</strong> predicts diseases or assigns diagnoses. Predictions
              are handled separately by validated machine learning models.
            </div>

            {/* File Upload Zone */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Upload Report File (PDF, PNG, JPG, TXT)</span>
              </label>
              <div
                style={{
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
                onClick={() => document.getElementById('report-file-input').click()}
              >
                <Upload size={24} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {selectedFile ? selectedFile.name : 'Click to select or drop a medical lab report'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supported formats: PDF, JPG, PNG, TXT documents
                </div>
                <input
                  id="report-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Or Paste Text */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Or Paste Laboratory Report Text</span>
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setReportText(sampleGeneralLabReport);
                    setSelectedFile(null);
                  }}
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Load Sample Multi-Panel Lab Report
                </button>
              </div>

              <textarea
                className="form-control"
                rows={6}
                placeholder="Paste lab text here..."
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  setSelectedFile(null);
                }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#EF4444',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{
                  fontSize: '0.82rem',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExtract}
                disabled={isLoading}
                style={{
                  fontSize: '0.82rem',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '6px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                <Upload size={15} />
                <span>{isLoading ? 'Extracting Lab Metrics...' : 'Extract & Review Measurements'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: VERIFICATION & CONFLICT RESOLUTION SCREEN */
          <div>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10B981" />
                <span style={{ fontSize: '0.84rem', color: '#10B981', fontWeight: 600 }}>
                  Detected {Object.keys(verifiedItemsState).length} Laboratory Measurement(s)
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Review, modify, or reject values before model ingestion
              </span>
            </div>

            {/* Missing Features Warning if Target Specified */}
            {missingInfo && missingInfo.missing.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.03)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <AlertTriangle size={15} color="#EAB308" />
                  <strong style={{ fontSize: '0.82rem', color: '#EAB308' }}>
                    {missingInfo.moduleName} — Incomplete Report Coverage
                  </strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '23px' }}>
                  <div>
                    Available:{' '}
                    <span style={{ color: '#10B981', fontWeight: 500 }}>
                      {missingInfo.present.map((p) => p.toUpperCase()).join(', ') || 'None'}
                    </span>
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    Missing:{' '}
                    <span style={{ color: '#EF4444', fontWeight: 500 }}>
                      {missingInfo.missing.map((m) => m.toUpperCase()).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Lab Items Verification Table */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '10px'
                }}
              >
                {Object.values(verifiedItemsState).map((item) => {
                  const testId = item.id;
                  const isAccepted = item.accepted;
                  const existingVal = getExistingValueForTest(testId);
                  const hasConflict =
                    existingVal !== null &&
                    existingVal !== undefined &&
                    existingVal !== '' &&
                    Number(existingVal) !== Number(item.value);

                  return (
                    <div
                      key={testId}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: isAccepted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.005)',
                        border: isAccepted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px dashed rgba(255, 255, 255, 0.04)',
                        opacity: isAccepted ? 1 : 0.45,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.display_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Targets: {item.target_models.join(', ')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => toggleItemAcceptance(testId)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: isAccepted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              color: isAccepted ? '#10B981' : '#EF4444'
                            }}
                          >
                            {isAccepted ? 'Accepted' : 'Excluded'}
                          </button>
                        </div>
                      </div>

                      {/* Value Editor */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Value:</span>
                        <input
                          type="number"
                          step="any"
                          value={item.editedValue}
                          disabled={!isAccepted}
                          onChange={(e) => handleValueChange(testId, e.target.value)}
                          style={{
                            width: '90px',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.82rem'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.unit}
                        </span>
                      </div>

                      {/* Conflict Resolution Box if Manual Value Exists */}
                      {hasConflict && isAccepted && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(234, 179, 8, 0.04)',
                            border: '1px solid rgba(234, 179, 8, 0.2)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ color: '#EAB308', fontWeight: 600, marginBottom: '2px' }}>
                            Value Conflict:
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Existing input: {existingVal} {item.unit} | Report extracted: {item.value} {item.unit}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setConflictChoices((prev) => ({ ...prev, [testId]: 'existing' }))}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid ' + (conflictChoices[testId] === 'existing' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'),
                                cursor: 'pointer',
                                backgroundColor:
                                  conflictChoices[testId] === 'existing' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                color: conflictChoices[testId] === 'existing' ? '#FFFFFF' : 'var(--text-secondary)'
                              }}
                            >
                              Keep Existing ({existingVal})
                            </button>
                            <button
                              type="button"
                              onClick={() => setConflictChoices((prev) => ({ ...prev, [testId]: 'report' }))}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid ' + (conflictChoices[testId] === 'report' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'),
                                cursor: 'pointer',
                                backgroundColor:
                                  conflictChoices[testId] === 'report' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                color: conflictChoices[testId] === 'report' ? '#FFFFFF' : 'var(--text-secondary)'
                              }}
                            >
                              Use Report ({item.value})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                paddingTop: '16px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setExtractedItems(null);
                  setSelectedFile(null);
                }}
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)'
                }}
              >
                Change Report
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyVerifiedValues}
                style={{
                  fontSize: '0.82rem',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '6px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Check size={15} />
                <span>Apply Verified Values</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
