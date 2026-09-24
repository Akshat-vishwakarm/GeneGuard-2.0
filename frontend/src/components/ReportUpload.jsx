import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';

export default function ReportUpload({ isOpen, onClose, onApplyExtractedValues }) {
  const [reportText, setReportText] = useState('');
  const [extractedValues, setExtractedValues] = useState(null);
  const [mappedFeatures, setMappedFeatures] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const sampleReportText = `PATIENT COMPREHENSIVE LAB REPORT
Systolic Blood Pressure: 138 mmHg
Diastolic Blood Pressure: 88 mmHg
Total Cholesterol: 228 mg/dL
LDL Cholesterol: 145 mg/dL
HDL Cholesterol: 41 mg/dL
Triglycerides: 195 mg/dL
Fasting Glucose: 112 mg/dL
Hemoglobin: 14.8 g/dL
TSH: 3.8 mIU/L
Weight: 82 kg
Height: 176 cm`;

  const handleExtract = async () => {
    if (!reportText.trim()) {
      setErrorMsg('Please enter or paste medical report text.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_BASE}/extract-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_text: reportText })
      });

      const data = await response.json();
      if (data.status === 'success') {
        const measurements = data.extracted_measurements || (Array.isArray(data.extracted_items)
          ? Object.fromEntries(data.extracted_items.map(item => [item.id, item.value]))
          : {});
        setExtractedValues(measurements);
        setMappedFeatures(data.mapped_features || data.mapped_inputs);
      } else {
        setErrorMsg(data.message || 'Failed to extract measurements.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (mappedFeatures) {
      onApplyExtractedValues(mappedFeatures, extractedValues);
      onClose();
    }
  };

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
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="var(--text-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Medical Lab Report Extraction</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Upload or paste clinical lab report measurements. Extracted metrics will be presented for verification.
        </p>

        {!extractedValues ? (
          <div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Paste Report Content:</label>
              <textarea
                className="form-control"
                rows={7}
                placeholder="Paste lab text here..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '12px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setReportText(sampleReportText)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                Load Sample Report
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExtract}
                disabled={isLoading}
                style={{ fontSize: '0.78rem', padding: '6px 16px' }}
              >
                <Upload size={14} />
                <span>{isLoading ? 'Extracting Measurements...' : 'Extract Lab Measurements'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={16} color="#10B981" />
              <span style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>
                Review extracted values below before applying.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {Object.entries(extractedValues).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{key}</span>
                  <input
                    type="number"
                    step="any"
                    value={val}
                    onChange={(e) => {
                      const newV = parseFloat(e.target.value) || 0;
                      setExtractedValues({ ...extractedValues, [key]: newV });
                    }}
                    style={{
                      width: '80px',
                      padding: '3px 6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setExtractedValues(null)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                Re-enter Text
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmAndApply}
                style={{ fontSize: '0.78rem', padding: '6px 16px' }}
              >
                Confirm Verified Values & Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
