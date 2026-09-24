import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Initializing multi-organ analysis pipeline...', duration: 500 },
  { id: 2, label: 'Evaluating personal biometrics & lab records...', duration: 600 },
  { id: 3, label: 'Mapping pedigree relations & family history evidence...', duration: 700 },
  { id: 4, label: 'Executing 5 disease-specific machine learning models...', duration: 800 },
  { id: 5, label: 'Synthesizing master GeneGuard clinical health report...', duration: 600 }
];

export default function AnalysisProcessingModal({ isOpen, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    let current = 0;
    const runNextStep = () => {
      if (current < ANALYSIS_STEPS.length - 1) {
        current += 1;
        setCurrentStepIndex(current);
        setTimeout(runNextStep, ANALYSIS_STEPS[current].duration);
      } else {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }
    };

    const firstTimer = setTimeout(runNextStep, ANALYSIS_STEPS[0].duration);
    return () => clearTimeout(firstTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPct = Math.round(((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.35)',
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
        style={{
          width: '500px',
          maxWidth: '100%',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
          padding: '36px 32px',
          borderRadius: '16px',
          textAlign: 'center'
        }}
      >
        {/* Sleek Minimal Spinner */}
        <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 20px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.08)',
              borderTopColor: '#FFFFFF',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Activity size={20} />
          </div>
        </div>

        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
          Processing Pipeline
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Running Combined Genetic Analysis
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto 24px' }}>
          Synthesizing personal health biometrics with documented family pedigree data.
        </p>

        {/* Progress Bar */}
        <div
          style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: '#FFFFFF',
              borderRadius: '4px',
              transition: 'width 0.25s ease'
            }}
          />
        </div>

        {/* Steps List */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ANALYSIS_STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isCurrent ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  border: isCurrent ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isFinished ? (
                    <CheckCircle2 size={16} color="#10B981" />
                  ) : isCurrent ? (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#FFFFFF'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isCurrent ? 500 : 400,
                    color: isCurrent ? 'var(--text-primary)' : isFinished ? 'var(--text-secondary)' : 'var(--text-muted)'
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
