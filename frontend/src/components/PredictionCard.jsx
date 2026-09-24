import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Info, ChevronDown, ChevronUp, Activity, CheckCircle2 } from 'lucide-react';

export default function PredictionCard({ moduleKey, result, title }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  if (!result.available) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '8px' }}>
          <AlertCircle size={20} />
          <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{title || moduleKey.toUpperCase()} Analysis</h4>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Analysis unavailable. Reason: {result.reason || 'Required information is missing.'}
        </p>
        {result.missing_fields && result.missing_fields.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#F87171' }}>
            Missing: {result.missing_fields.join(', ')}
          </div>
        )}
      </div>
    );
  }

  const isLow = result.prediction_code === 0;
  const badgeClass = isLow ? 'badge-low' : 'badge-elevated';
  const accentColor = isLow ? '#10B981' : '#EF4444';

  return (
    <div
      className="card"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.025)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            GeneGuard Analysis
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', letterSpacing: '-0.01em' }}>
            {title || result.title}
          </h3>
        </div>
        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
          {result.prediction}
        </span>
      </div>

      {/* Risk Percentage Box (0% = Risk Free, 100% = Very High Risk) */}
      {(() => {
        const riskPct = result.risk_percentage !== undefined ? result.risk_percentage : (result.confidence_percentage || 0);
        let barColor = '#34D399'; // Muted Green
        if (riskPct >= 60) {
          barColor = '#F87171'; // Muted Red
        } else if (riskPct >= 35) {
          barColor = '#FBBF24'; // Muted Amber
        }

        return (
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Model Predicted Risk Level
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  0% = Risk Free &nbsp;|&nbsp; 100% = Very High Risk
                </div>
              </div>

              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: barColor, letterSpacing: '-0.02em' }}>
                {riskPct}%
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, riskPct))}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>
        );
      })()}

      {result.contributing_inputs && result.contributing_inputs.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Key Contributing Model Factors (SHAP Explainability):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.contributing_inputs.map((factor, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.82rem'
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>• {factor.feature}</span>
                <span
                  style={{
                    color: factor.impact === 'Increases Risk' ? '#F87171' : '#34D399',
                    fontWeight: 500,
                    fontSize: '0.78rem'
                  }}
                >
                  {factor.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.class_probabilities && (
        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class Distribution:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Low', 'Medium', 'High'].map((cls) => {
              const p = result.class_probabilities[cls] ?? 0;
              return (
                <div key={cls} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cls}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{Math.round(p * 100)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.relevant_report_data && result.relevant_report_data.length > 0 && (
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Relevant Verified Report Data:
          </div>
          {result.relevant_report_data.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span>{item.test}: <strong style={{ color: 'var(--text-primary)' }}>{item.value} {item.unit}</strong></span>
              <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Source: {item.source || 'Uploaded Lab Report'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="disclaimer-box" style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ color: 'var(--text-secondary)' }}>{result.disclaimer || 'This result is a model-based prediction and is not a medical diagnosis.'}</span>
      </div>
    </div>
  );
}
