import React, { useState } from 'react';
import {
  AlertTriangle,
  Play,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Edit3,
  RotateCcw,
  FileUp
} from 'lucide-react';
import { NORMAL_REFERENCE_RANGES, MODEL_COMMON_PROFILE_CONFIG } from '../utils/normalValueRegistry';

export default function DynamicInputForm({
  moduleKey,
  schema,
  formValues = {},
  onInputChange,
  onRunPrediction,
  missingFieldsAlert,
  isPredicting,
  patientProfile,
  onOpenProfileEditor,
  onFillNormalValues,
  onClearModuleInputs,
  onOpenUpload,
  demoFields = {}
}) {
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');

  if (!schema || !schema.ui_features) {
    return <div className="card">Loading form schema...</div>;
  }

  const profileConfig = MODEL_COMMON_PROFILE_CONFIG[moduleKey] || { totalCommon: 0, fields: [] };
  const commonFields = profileConfig.fields || [];
  const isProfileComplete = Boolean(patientProfile && patientProfile.isComplete);

  // Filter out duplicate common profile fields from editable grid
  // (They are centrally managed and displayed in the Patient Profile banner)
  const modelSpecificFeatures = schema.ui_features.filter((f) => !commonFields.includes(f.key));

  const handleSubmit = (e) => {
    e.preventDefault();
    onRunPrediction(moduleKey);
  };

  return (
    <div className="card">
      {/* HEADER & MODULE ACTION TOOLBAR */}
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div>
          <h3 className="card-title" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {schema.name} Form
          </h3>
          <p className="card-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            This module collects ONLY parameters specific to the {schema.name} model. Common biometrics are supplied by
            your Patient Profile.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Fill Normal / Demo Values Button */}
          {onFillNormalValues && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onFillNormalValues(moduleKey)}
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Fill model-specific fields with normal/reference values (preserves your Patient Profile)"
            >
              <Sparkles size={13} color="var(--accent-cyan)" />
              <span>Fill Normal / Demo Values</span>
            </button>
          )}

          {/* Upload & Fill Button */}
          {onOpenUpload && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onOpenUpload(moduleKey)}
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Upload lab report to autofill relevant metrics for this module"
            >
              <FileUp size={13} color="var(--accent-cyan)" />
              <span>Upload & Fill</span>
            </button>
          )}

          {/* Clear Current Module Inputs Button */}
          {onClearModuleInputs && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onClearModuleInputs(moduleKey)}
              style={{
                fontSize: '0.78rem',
                padding: '6px 10px',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Clear only this disease module's inputs (Patient Profile remains intact)"
            >
              <RotateCcw size={12} />
              <span>Clear Module</span>
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL PATIENT PROFILE DEDICATED ROW & METRIC CELLS */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: isProfileComplete ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isProfileComplete ? (
              <ShieldCheck size={18} color="#34D399" />
            ) : (
              <AlertTriangle size={18} color="#FBBF24" />
            )}
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Patient Profile
            </span>
            <span
              onClick={onOpenProfileEditor}
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: isProfileComplete ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                color: isProfileComplete ? '#34D399' : '#FBBF24',
                border: isProfileComplete ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                cursor: onOpenProfileEditor ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={onOpenProfileEditor ? 'Click to complete the profile' : undefined}
            >
              <span>{isProfileComplete ? '✓ Complete' : '⚠ Incomplete — Click to complete'}</span>
            </span>
          </div>

          {onOpenProfileEditor && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenProfileEditor}
              style={{
                fontSize: '0.78rem',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <Edit3 size={13} />
              <span>{isProfileComplete ? 'Edit Profile' : 'Complete Profile'}</span>
            </button>
          )}
        </div>

        {/* Dedicated Metric Cells Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '8px'
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Age</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: patientProfile?.age ? 'var(--text-primary)' : '#FBBF24' }}>
              {patientProfile?.age ? `${patientProfile.age} yrs` : 'Not set'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Sex</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: patientProfile?.sex ? 'var(--text-primary)' : '#FBBF24' }}>
              {patientProfile?.sex ? (patientProfile.sex === 'male' ? 'Male' : 'Female') : 'Not set'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Height</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: patientProfile?.height_cm ? 'var(--text-primary)' : '#FBBF24' }}>
              {patientProfile?.height_cm ? `${patientProfile.height_cm} cm` : 'Not set'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Weight</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: patientProfile?.weight_kg ? 'var(--text-primary)' : '#FBBF24' }}>
              {patientProfile?.weight_kg ? `${patientProfile.weight_kg} kg` : 'Not set'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>BMI</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: patientProfile?.bmi ? 'var(--accent-cyan)' : '#FBBF24' }}>
              {patientProfile?.bmi ? `${patientProfile.bmi}` : 'Not set'}
            </div>
          </div>
        </div>
      </div>

      {/* MISSING FIELDS ALERT */}
      {missingFieldsAlert && missingFieldsAlert.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <AlertTriangle size={20} color="#EF4444" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#EF4444' }}>
              Additional information required for this analysis.
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              The following required fields must be completed prior to running model prediction:
            </p>
            <ul style={{ fontSize: '0.82rem', color: '#F87171', marginTop: '6px', marginLeft: '18px' }}>
              {missingFieldsAlert.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODEL-SPECIFIC INPUTS FORM GRID */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {modelSpecificFeatures.map((feat) => {
            const val = formValues[feat.key] ?? '';
            const refInfo = NORMAL_REFERENCE_RANGES[feat.key];
            const isDemoValue = Boolean(demoFields[feat.key]);

            // Rating Scale Selector (Cancer model 1-7/8/9 buttons)
            if (feat.type === 'rating') {
              const maxScale = feat.max || 8;
              const scaleButtons = Array.from({ length: maxScale }, (_, i) => i + 1);

              return (
                <div key={feat.key} className="form-group" style={{ gridColumn: 'span 1' }}>
                  <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {feat.label}
                      {feat.required ? <span className="required-tag">*</span> : <span className="optional-tag">(Optional)</span>}
                      {isDemoValue && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#FBBF24',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Demo value
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: refInfo ? '#34D399' : 'var(--text-muted)' }}>
                      {refInfo ? `Ideal: ${refInfo.ideal}` : `Rating: ${val || 'Not Set'}`}
                    </span>
                  </div>
                  <div className="rating-group">
                    {scaleButtons.map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`rating-btn ${Number(val) === num ? 'selected' : ''}`}
                        onClick={() => onInputChange(feat.key, num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {feat.description && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {feat.description}
                    </span>
                  )}
                </div>
              );
            }

            // Select Options Dropdown
            if (feat.type === 'select') {
              return (
                <div key={feat.key} className="form-group">
                  <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {feat.label}
                      {feat.required ? <span className="required-tag">*</span> : <span className="optional-tag">(Optional)</span>}
                      {isDemoValue && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#FBBF24',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Demo value
                        </span>
                      )}
                    </span>
                    {refInfo && (
                      <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 500 }}>
                        Ideal: {refInfo.ideal}
                      </span>
                    )}
                  </div>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={val}
                    onChange={(e) => onInputChange(feat.key, e.target.value)}
                  >
                    <option value="" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>-- Select {feat.label} --</option>
                    {feat.options.map((opt) => (
                      <option key={String(opt.value)} value={opt.value} style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            // Standard Numeric Input
            return (
              <div key={feat.key} className="form-group">
                <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {feat.label}
                    {feat.required ? <span className="required-tag">*</span> : <span className="optional-tag">(Optional)</span>}
                    {isDemoValue && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#FBBF24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        Demo value
                      </span>
                    )}
                  </span>
                  {refInfo ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#34D399',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}
                      title={refInfo.description}
                    >
                      Normal: {refInfo.range}
                    </span>
                  ) : (
                    feat.unit && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {feat.unit}
                      </span>
                    )
                  )}
                </div>
                <input
                  type="number"
                  step={feat.step || 'any'}
                  min={feat.min}
                  max={feat.max}
                  className="form-control"
                  placeholder={
                    refInfo
                      ? `Ideal: ${refInfo.ideal} (Normal: ${refInfo.range})`
                      : feat.description || `Enter ${feat.label}`
                  }
                  value={val}
                  onChange={(e) => onInputChange(feat.key, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        {/* SUBMIT BUTTON (DO NOT AUTO-RUN) */}
        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPredicting}
            style={{ padding: '10px 24px', fontSize: '0.9rem', background: '#FFFFFF', color: '#000000', border: 'none', fontWeight: 600 }}
          >
            <Play size={16} />
            <span>{isPredicting ? 'Executing Analysis...' : `Run ${schema.name}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
