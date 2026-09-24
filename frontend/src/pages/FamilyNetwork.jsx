import React from 'react';
import { Users, User, ArrowRight } from 'lucide-react';

export default function FamilyNetwork({ familyList = [], selectedPerson, setSelectedPerson, onNavigateToInput }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Family Network & Genetic Node History
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Select a person from your family network to load their profile, report metrics, and qualitative family evidence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {familyList.map((person) => {
          const isSelected = selectedPerson?.person_id === person.person_id;

          return (
            <div
              key={person.person_id}
              className="card"
              style={{
                borderColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)',
                background: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'var(--glass-surface)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#000000' : 'var(--text-primary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600
                    }}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{person.name}</h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {person.relationship} ({person.age} yrs, {person.sex})
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontSize: '0.7rem' }}>
                    Active
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                {person.health_summary}
              </p>

              {person.family_history_evidence && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Family History Evidence Context
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {person.family_history_evidence.map((ev, idx) => (
                      <div key={idx} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '5px 8px', borderRadius: '4px' }}>
                        • {ev}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-glass'}`}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '7px 12px' }}
                  onClick={() => {
                    setSelectedPerson(person);
                    if (onNavigateToInput) onNavigateToInput();
                  }}
                >
                  <span>Select & Analyze Profile</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
