import React from 'react';
import { Users, Info } from 'lucide-react';

export default function FamilyHistoryEvidence({ person }) {
  if (!person || !person.family_history_evidence) return null;

  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: '20px', 
        backgroundColor: 'rgba(8, 8, 8, 0.58)', 
        borderColor: 'rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(28px) saturate(115%)',
        WebkitBackdropFilter: 'blur(28px) saturate(115%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Users size={18} color="#38BDF8" />
        <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
          Family History Evidence Context — {person.name}
        </h3>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#A0A0A0', marginBottom: '12px', lineHeight: 1.45 }}>
        Qualitative clinical evidence collected from family nodes. Family history provides observational calibration context and is not artificially confounded with raw individual ML model outputs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {person.family_history_evidence.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.50)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.82rem',
              color: '#FFFFFF'
            }}
          >
            <Info size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
