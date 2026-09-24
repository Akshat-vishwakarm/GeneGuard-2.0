import React from 'react';
import { User, Users, Check } from 'lucide-react';

export default function FamilyMemberSelector({ familyList, selectedPerson, setSelectedPerson }) {
  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: '20px', 
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.025)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={17} color="#38BDF8" />
            <h2 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Family History Target Context
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888888', marginTop: '2px' }}>
            Select individual subject to inspect personal inputs, recorded family evidence, and calibrated models.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {familyList.map((person) => {
            const isSelected = selectedPerson?.person_id === person.person_id;
            return (
              <button
                key={person.person_id}
                onClick={() => setSelectedPerson(person)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isSelected 
                    ? '1px solid rgba(56, 189, 248, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected 
                    ? 'rgba(56, 189, 248, 0.1)' 
                    : 'rgba(255, 255, 255, 0.025)',
                  color: isSelected ? '#FFFFFF' : '#A0A0A0',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={13} color={isSelected ? '#38BDF8' : '#777777'} />
                <span>{person.name}</span>
                {isSelected && <Check size={13} color="#38BDF8" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
