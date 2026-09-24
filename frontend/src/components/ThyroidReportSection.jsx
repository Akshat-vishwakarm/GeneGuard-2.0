import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Edit2, FileUp, Check } from 'lucide-react';

export default function ThyroidReportSection({ onApplyVerifiedReportData }) {
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [extractedItems, setExtractedItems] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const sampleThyroidReport = `PATIENT THYROID LABORATORY REPORT
Test Name: Thyroid Stimulating Hormone (TSH)
Result: 5.8 mIU/L  (Ref Range: 0.4 - 4.2)
Test Name: Total T3
Result: 0.82 ng/mL  (Ref Range: 0.8 - 2.0)
Test Name: Total Thyroxine (T4)
Result: 6.1 ug/dL   (Ref Range: 5.0 - 12.0)
Test Name: Thyroxine Uptake (T4U)
Result: 0.92        (Ref Range: 0.7 - 1.3)
Test Name: Free Thyroxine Index (FTI)
Result: 6.6         (Ref Range: 6.0 - 12.0)`;

  // Client-side parser for local fallback when backend is temporarily offline
  const extractThyroidLocally = (text) => {
    const definitions = [
      {
        id: 'tsh',
        test_key: 'TSH',
        display_name: 'Thyroid Stimulating Hormone (TSH)',
        patterns: [/(?:thyroid\s+stimulating\s+hormone|serum\s+tsh|tsh)\b[^\d.\n]*[:\s=]+([\d.]+)/i],
        unit: 'mIU/L',
        target_models: ['thyroid']
      },
      {
        id: 't3',
        test_key: 'T3',
        display_name: 'Triiodothyronine (Total T3)',
        patterns: [/(?:triiodothyronine|total\s+t3|\bt3\b)[^\d.\n]*[:\s=]+([\d.]+)/i],
        unit: 'ng/mL',
        target_models: ['thyroid']
      },
      {
        id: 'tt4',
        test_key: 'T4',
        display_name: 'Total Thyroxine (Total T4)',
        patterns: [/(?:total\s+thyroxine|total\s+t4|serum\s+t4|thyroxine|\btt4\b|\bt4\b)[^\d.\n]*[:\s=]+([\d.]+)/i],
        unit: 'µg/dL',
        target_models: ['thyroid']
      },
      {
        id: 't4u',
        test_key: 'T4U',
        display_name: 'Thyroxine Uptake (T4U)',
        patterns: [/(?:thyroxine\s+uptake|t4\s+uptake|\bt4u\b)[^\d.\n]*[:\s=]+([\d.]+)/i],
        unit: 'ratio',
        target_models: ['thyroid']
      },
      {
        id: 'fti',
        test_key: 'FTI',
        display_name: 'Free Thyroxine Index (FTI)',
        patterns: [/(?:free\s+thyroxine\s+index|\bfti\b)[^\d.\n]*[:\s=]+([\d.]+)/i],
        unit: 'index',
        target_models: ['thyroid']
      }
    ];

    const extracted = [];
    for (const def of definitions) {
      for (const p of def.patterns) {
        const match = text.match(p);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) {
            extracted.push({
              id: def.id,
              test_key: def.test_key,
              display_name: def.display_name,
              value: val,
              unit: def.unit,
              status: 'Verify',
              source: 'Uploaded Lab Report',
              target_models: def.target_models
            });
            break;
          }
        }
      }
    }
    return extracted;
  };

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsExtracting(true);
    setErrorMsg(null);
    setIsConfirmed(false);
    setIsFallbackMode(false);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('http://localhost:5000/api/extract-report', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.status === 'success') {
        setExtractedItems(data.extracted_items);
      } else {
        setErrorMsg(data.message || 'Failed to extract lab report.');
      }
    } catch (err) {
      // If it's a text file, attempt client-side extraction
      if (uploadedFile.type === 'text/plain' || uploadedFile.name.endsWith('.txt')) {
        try {
          const text = await uploadedFile.text();
          const localItems = extractThyroidLocally(text);
          if (localItems.length > 0) {
            setExtractedItems(localItems);
            setIsFallbackMode(true);
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      setErrorMsg('Unable to connect to backend server at http://localhost:5000. Please start the backend with: python backend/app.py');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTextExtract = async () => {
    const textToExtract = pastedText.trim() || sampleThyroidReport;
    setIsExtracting(true);
    setErrorMsg(null);
    setIsConfirmed(false);
    setIsFallbackMode(false);

    try {
      const response = await fetch('http://localhost:5000/api/extract-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_text: textToExtract })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setExtractedItems(data.extracted_items);
        return;
      } else {
        setErrorMsg(data.message || 'Failed to extract lab report.');
      }
    } catch (err) {
      // Local client-side extraction fallback
      const localItems = extractThyroidLocally(textToExtract);
      if (localItems.length > 0) {
        setExtractedItems(localItems);
        setIsFallbackMode(true);
        return;
      }
      setErrorMsg('Unable to connect to backend server at http://localhost:5000. Please start the backend with: python backend/app.py');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmValues = async () => {
    if (!extractedItems || extractedItems.length === 0) return;

    try {
      const response = await fetch('http://localhost:5000/api/confirm-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_items: extractedItems })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsConfirmed(true);
        setIsEditing(false);
        onApplyVerifiedReportData(data.mapped_inputs, data.verified_records);
        return;
      }
    } catch (err) {
      console.warn('Backend confirmation unavailable, using client-side mapping fallback:', err);
    }

    // Client-side fallback mapping if backend is offline
    const mappedInputs = {
      cardiovascular: {},
      metabolic: {},
      blood_pressure: {},
      thyroid: {},
      cancer: {}
    };
    const currentDate = new Date().toISOString().split('T')[0];
    const verifiedRecords = extractedItems.map(item => ({
      source: item.source || 'Uploaded Lab Report',
      verified: true,
      test: item.display_name,
      test_key: item.test_key,
      value: item.value,
      unit: item.unit || '',
      date: currentDate
    }));

    extractedItems.forEach(item => {
      if (item.id === 'tsh') mappedInputs.thyroid.tsh = item.value;
      if (item.id === 't3') mappedInputs.thyroid.t3 = item.value;
      if (item.id === 'tt4') mappedInputs.thyroid.tt4 = item.value;
      if (item.id === 't4u') mappedInputs.thyroid.t4u = item.value;
      if (item.id === 'fti') mappedInputs.thyroid.fti = item.value;
    });

    setIsConfirmed(true);
    setIsEditing(false);
    onApplyVerifiedReportData(mappedInputs, verifiedRecords);
  };

  return (
    <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--glass-surface)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)', borderRadius: '12px' }}>
      <div className="card-header" style={{ marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--text-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Thyroid Report</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Upload a thyroid laboratory report to extract verified measurements for risk evaluation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['PDF', 'JPG', 'PNG', 'TXT'].map((type) => (
            <span key={type} style={{ fontSize: '0.66rem', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {type}
            </span>
          ))}
        </div>
      </div>

      {!extractedItems ? (
        <div>
          {/* Dropzone Upload Box */}
          <div
            style={{
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '28px 20px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.015)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '16px'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
          >
            <FileUp size={24} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Upload Thyroid / Lab Report
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
              Drag & drop files or click below to select
            </p>
            <input
              type="file"
              id="thyroid-file-input"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="thyroid-file-input" className="btn btn-glass" style={{ display: 'inline-flex', fontSize: '0.78rem', padding: '6px 14px' }}>
              <Upload size={14} />
              <span>{isExtracting ? 'Extracting Text...' : 'Upload Report'}</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>— OR —</span>
            <button
              type="button"
              className="btn btn-glass"
              onClick={handleTextExtract}
              disabled={isExtracting}
              style={{ fontSize: '0.76rem', padding: '5px 12px' }}
            >
              {isExtracting ? 'Extracting...' : 'Load Sample Thyroid Lab Report'}
            </button>
          </div>

          {errorMsg && (
            <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '12px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* User Verification Section */}
          <div
            style={{
              backgroundColor: isConfirmed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.06)',
              border: isConfirmed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(234, 179, 8, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isConfirmed ? (
                <CheckCircle2 size={16} color="#10B981" />
              ) : (
                <AlertCircle size={16} color="#EAB308" />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isConfirmed ? '#10B981' : '#EAB308' }}>
                  {isConfirmed ? 'Thyroid Values Confirmed & Mapped' : 'Thyroid Values Detected — Please Verify Below'}
                </span>
                {isFallbackMode && (
                  <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    Local Fallback
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-glass"
              onClick={() => {
                setExtractedItems(null);
                setIsConfirmed(false);
              }}
              style={{ fontSize: '0.74rem', padding: '4px 8px' }}
            >
              New Report
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Test</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Value</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {extractedItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.display_name} ({item.test_key})
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={item.value}
                          onChange={(e) => {
                            const newV = parseFloat(e.target.value) || 0;
                            const updated = [...extractedItems];
                            updated[idx].value = newV;
                            setExtractedItems(updated);
                          }}
                          style={{
                            width: '80px',
                            padding: '3px 6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem'
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.value}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{item.unit}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                      {item.source}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-glass"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isConfirmed}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Edit2 size={13} />
              <span>{isEditing ? 'Done Editing' : 'Edit Values'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmValues}
              disabled={isConfirmed}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Check size={14} />
              <span>{isConfirmed ? 'Values Confirmed' : 'Confirm Values'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
