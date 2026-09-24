import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, AlertCircle, Edit3, X, Save, RotateCcw, Activity, ArrowRight } from 'lucide-react';
import { calculateBmi } from '../utils/normalValueRegistry';

export default function PatientProfileCard({
  profile,
  onSaveProfile,
  onClearProfile,
  isEditorOpen,
  setIsEditorOpen
}) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age ?? '',
    sex: profile?.sex || '',
    height_cm: profile?.height_cm ?? '',
    weight_kg: profile?.weight_kg ?? ''
  });

  const [validationError, setValidationError] = useState(null);
  const [isStatusHovered, setIsStatusHovered] = useState(false);


  // Sync internal form when external profile state changes
  useEffect(() => {
    setFormData({
      name: profile?.name || '',
      age: profile?.age ?? '',
      sex: profile?.sex || '',
      height_cm: profile?.height_cm ?? '',
      weight_kg: profile?.weight_kg ?? ''
    });
  }, [profile]);

  // Derived auto-calculated BMI
  const computedBmi = calculateBmi(formData.height_cm, formData.weight_kg);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setValidationError(null);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    const ageNum = parseInt(formData.age, 10);
    const heightNum = parseFloat(formData.height_cm);
    const weightNum = parseFloat(formData.weight_kg);

    if (!formData.sex) {
      setValidationError('Please select Sex / Gender.');
      return;
    }
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 125) {
      setValidationError('Please enter a valid age (1-125 years).');
      return;
    }
    if (isNaN(heightNum) || heightNum < 40 || heightNum > 260) {
      setValidationError('Please enter a valid height in cm (40-260 cm).');
      return;
    }
    if (isNaN(weightNum) || weightNum < 15 || weightNum > 350) {
      setValidationError('Please enter a valid weight in kg (15-350 kg).');
      return;
    }

    const bmiVal = calculateBmi(heightNum, weightNum);

    const updatedProfile = {
      name: formData.name.trim() || 'Patient',
      age: ageNum,
      sex: formData.sex,
      height_cm: heightNum,
      weight_kg: weightNum,
      bmi: bmiVal,
      isComplete: true
    };

    onSaveProfile(updatedProfile);
    setIsEditorOpen(false);
  };

  const handleClear = () => {
    setFormData({
      name: '',
      age: '',
      sex: '',
      height_cm: '',
      weight_kg: ''
    });
    setValidationError(null);
    onClearProfile();
  };

  const isComplete = Boolean(
    profile &&
    profile.isComplete &&
    profile.age &&
    profile.sex &&
    profile.height_cm &&
    profile.weight_kg
  );

  return (
    <div
      className="card"
      style={{
        marginBottom: '24px',
        border: isComplete ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(245, 158, 11, 0.35)',
        background: 'rgba(8, 8, 8, 0.58)',
        backdropFilter: 'blur(28px) saturate(115%)',
        WebkitBackdropFilter: 'blur(28px) saturate(115%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      {/* HEADER / STATUS BAR (Always visible & interactive) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: isEditorOpen ? '16px' : '0',
          borderBottom: isEditorOpen ? '1px solid var(--border-subtle)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: isComplete ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isComplete ? 'rgba(52, 211, 153, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isComplete ? '#34D399' : '#FBBF24'
            }}
          >
            <User size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Global Patient Profile
              </span>
              {isComplete ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={13} /> Complete
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.16)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <AlertCircle size={13} /> Incomplete
                </span>
              )}
            </div>

            {/* Profile summary badges */}
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isComplete ? (
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{profile.name}</strong> •{' '}
                  {profile.age} yrs •{' '}
                  {profile.sex === 'male' ? 'Male' : 'Female'} •{' '}
                  {profile.height_cm} cm •{' '}
                  {profile.weight_kg} kg •{' '}
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>BMI {profile.bmi}</span>
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Set common profile biometrics once to automatically autofill all 5 disease models without repetitive entry.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            style={{
              fontSize: '0.82rem',
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: isComplete ? undefined : '1px solid rgba(245, 158, 11, 0.5)',
              background: isComplete ? undefined : 'rgba(245, 158, 11, 0.12)',
              color: isComplete ? undefined : '#FBBF24',
              fontWeight: 600
            }}
          >
            <Edit3 size={14} />
            <span>{isEditorOpen ? 'Close Editor' : isComplete ? 'Edit Profile' : 'Complete Profile'}</span>
          </button>

          {isComplete && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClear}
              style={{
                fontSize: '0.82rem',
                padding: '7px 12px',
                color: 'var(--text-muted)'
              }}
              title="Clear Global Patient Profile"
            >
              <RotateCcw size={13} />
              <span>Clear Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED PROFILE ROW & METRIC CELLS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Cell 1: Status */}
        <div
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          onMouseEnter={() => setIsStatusHovered(true)}
          onMouseLeave={() => setIsStatusHovered(false)}
          style={{
            background: isComplete 
              ? (isStatusHovered ? 'rgba(52, 211, 153, 0.08)' : 'rgba(52, 211, 153, 0.04)') 
              : (isStatusHovered ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)'),
            border: isComplete 
              ? (isStatusHovered ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(52, 211, 153, 0.2)') 
              : (isStatusHovered ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(245, 158, 11, 0.2)'),
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'all 0.18s ease'
          }}
          title={isComplete ? 'Click to edit profile' : 'Click to complete the profile'}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Profile Status
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: isComplete ? '#34D399' : '#FBBF24'
            }}
          >
            {isComplete ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{isComplete ? 'Complete' : 'Incomplete'}</span>
          </div>

          {/* Action Prompt with Animated Arrow */}
          <div
            style={{
              marginTop: '5px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: isComplete
                ? (isStatusHovered ? '#6EE7B7' : '#10B981')
                : (isStatusHovered ? '#FDE68A' : '#F59E0B'),
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{isComplete ? 'Click to edit profile' : 'Click to complete the profile'}</span>
            <ArrowRight
              size={12}
              style={{
                transform: isStatusHovered ? 'translateX(3px)' : 'none',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
        </div>

        {/* Cell 2: Age */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Age
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.92rem', fontWeight: 600, color: profile?.age ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {profile?.age ? `${profile.age} yrs` : '— Not set'}
          </div>
        </div>

        {/* Cell 3: Biological Sex */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Biological Sex
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.92rem', fontWeight: 600, color: profile?.sex ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {profile?.sex ? (profile.sex === 'male' ? 'Male' : 'Female') : '— Not set'}
          </div>
        </div>

        {/* Cell 4: Height */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Height
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.92rem', fontWeight: 600, color: profile?.height_cm ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {profile?.height_cm ? `${profile.height_cm} cm` : '— Not set'}
          </div>
        </div>

        {/* Cell 5: Weight */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Weight
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.92rem', fontWeight: 600, color: profile?.weight_kg ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {profile?.weight_kg ? `${profile.weight_kg} kg` : '— Not set'}
          </div>
        </div>

        {/* Cell 6: BMI Index */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            BMI Index
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.92rem', fontWeight: 700, color: profile?.bmi ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {profile?.bmi ? `${profile.bmi}` : '— Not set'}
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE PROFILE EDITOR */}
      {isEditorOpen && (
        <form onSubmit={handleSave} style={{ marginTop: '18px' }}>
          {validationError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#EF4444',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '18px'
            }}
          >
            {/* Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Patient Name</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            {/* Age */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Age <span className="required-tag">*</span></span>
              </label>
              <input
                type="number"
                min="1"
                max="125"
                className="form-control"
                placeholder="e.g. 45"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                required
              />
            </div>

            {/* Sex / Gender */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Sex / Gender <span className="required-tag">*</span></span>
              </label>
              <select
                className="form-control"
                style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                value={formData.sex}
                onChange={(e) => handleChange('sex', e.target.value)}
                required
              >
                <option value="" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Select...</option>
                <option value="male" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Male</option>
                <option value="female" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Female</option>
              </select>
            </div>

            {/* Height (cm) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Height (cm) <span className="required-tag">*</span></span>
              </label>
              <input
                type="number"
                step="any"
                min="40"
                max="260"
                className="form-control"
                placeholder="e.g. 175"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
                required
              />
            </div>

            {/* Weight (kg) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Weight (kg) <span className="required-tag">*</span></span>
              </label>
              <input
                type="number"
                step="any"
                min="15"
                max="350"
                className="form-control"
                placeholder="e.g. 70"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
                required
              />
            </div>

            {/* BMI Display (Auto-calculated, read-only) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Body Mass Index (BMI)</span>
              </label>
              <div
                style={{
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }}
              >
                <span>{computedBmi ? `${computedBmi} kg/m²` : '—'}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Auto-calculated
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditorOpen(false)}
              style={{ fontSize: '0.84rem', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                fontSize: '0.84rem',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                fontWeight: 600
              }}
            >
              <Save size={15} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
