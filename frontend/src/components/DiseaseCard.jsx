import React from 'react';
import {
  Heart,
  Flame,
  Activity,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileUp
} from 'lucide-react';
import { MODEL_COMMON_PROFILE_CONFIG } from '../utils/normalValueRegistry';

const MODULE_ICONS = {
  cardiovascular: Heart,
  metabolic: Flame,
  blood_pressure: Activity,
  thyroid: ShieldCheck,
  cancer: Stethoscope
};

const MODULE_DESCRIPTIONS = {
  cardiovascular: 'Atherosclerotic & ischemic vector evaluation',
  metabolic: 'Insulin resistance & glycosylation index',
  blood_pressure: 'Hemodynamic & arterial tension calibration',
  thyroid: 'Endocrine axis & TSH/T4 feedback model',
  cancer: 'Respiratory risk & cellular proliferation metrics'
};

const MODULES_WITH_LAB_SUPPORT = ['cardiovascular', 'metabolic', 'blood_pressure', 'thyroid'];

export default function DiseaseCard({
  moduleKey,
  schema,
  isActive,
  onSelect,
  predictionResult,
  patientProfile,
  onOpenUpload
}) {
  const IconComponent = MODULE_ICONS[moduleKey] || Activity;
  const description = MODULE_DESCRIPTIONS[moduleKey] || 'Clinical prognostic inference model';
  const totalReqCount = schema?.ui_features?.filter((f) => f.required).length || 0;

  const profileConfig = MODEL_COMMON_PROFILE_CONFIG[moduleKey] || { totalCommon: 0, fields: [] };
  const totalCommon = profileConfig.totalCommon;
  const additionalReqCount = Math.max(0, totalReqCount - totalCommon);

  const isProfileComplete = Boolean(patientProfile && patientProfile.isComplete);
  const supportsLabReport = MODULES_WITH_LAB_SUPPORT.includes(moduleKey);

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        position: 'relative',
        background: isActive ? 'rgba(12, 28, 40, 0.65)' : 'rgba(8, 8, 8, 0.58)',
        border: isActive 
          ? '1px solid rgba(56, 189, 248, 0.45)' 
          : '1px solid rgba(255, 255, 255, 0.10)',
        boxShadow: isActive ? '0 8px 30px rgba(56, 189, 248, 0.12)' : '0 8px 30px rgba(0, 0, 0, 0.45)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.18s ease',
        backdropFilter: 'blur(28px) saturate(115%)',
        WebkitBackdropFilter: 'blur(28px) saturate(115%)'
      }}
      onClick={() => onSelect(moduleKey)}
    >
      <div>
        {/* Card Header: Icon & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? '#38BDF8' : '#A0A0A0'
            }}
          >
            <IconComponent size={18} />
          </div>

          {predictionResult?.available ? (
            <span 
              className="badge"
              style={{
                background: predictionResult.prediction_code === 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${predictionResult.prediction_code === 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                color: predictionResult.prediction_code === 0 ? '#34D399' : '#F87171',
                fontSize: '0.72rem'
              }}
            >
              {predictionResult.prediction}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isActive ? '#38BDF8' : '#777777',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.035)',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {isActive ? 'Form Active' : 'Standby'}
            </span>
          )}
        </div>

        {/* Title & Short Description */}
        <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', letterSpacing: '-0.01em' }}>
          {schema?.name || moduleKey.toUpperCase()}
        </h3>
        <p style={{ fontSize: '0.76rem', color: '#888888', lineHeight: 1.4, marginBottom: '14px' }}>
          {description}
        </p>
      </div>

      {/* Card Footer: Metadata Strip & Action */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem'
        }}
      >
        <span style={{ color: '#666666' }}>
          {isProfileComplete ? `${totalCommon} synced` : '0 synced'} · {additionalReqCount} required
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {supportsLabReport && onOpenUpload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenUpload(moduleKey);
              }}
              style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#A0A0A0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Upload lab report to autofill this module"
            >
              <FileUp size={11} />
              <span>Lab</span>
            </button>
          )}

          <span
            style={{
              fontWeight: 500,
              color: isActive ? '#38BDF8' : '#A0A0A0',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>{isActive ? 'Active' : 'Select'}</span>
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
