import React, { useState } from 'react';
import { 
  User, 
  Activity, 
  Heart, 
  Flame, 
  Dna, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

const COMMON_CONDITIONS = [
  { id: 'hypertension', label: 'Hypertension (High BP)' },
  { id: 'diabetes', label: 'Type 2 Diabetes / Pre-diabetes' },
  { id: 'thyroid', label: 'Thyroid Disorder (Hypo / Hyper)' },
  { id: 'heart_disease', label: 'Coronary Artery / Heart Disease' },
  { id: 'stroke', label: 'Stroke / TIA' },
  { id: 'respiratory', label: 'Chronic Lung / Asthma / COPD' },
  { id: 'kidney_disease', label: 'Chronic Kidney Disease' },
  { id: 'cancer', label: 'Cancer History' }
];

export default function PersonalHealthInput({
  selfData,
  setSelfData,
  onSaveAndContinue,
  onOpenReportUpload
}) {
  const [activeTab, setActiveTab] = useState('biometrics'); // 'biometrics' | 'lifestyle' | 'labs' | 'conditions'
  const [validationError, setValidationError] = useState('');

  // Calculate BMI on the fly
  const heightM = (selfData.height || 0) / 100;
  const bmi = heightM > 0 && selfData.weight > 0 ? (selfData.weight / (heightM * heightM)).toFixed(1) : null;

  const getBmiCategory = (val) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (num < 18.5) return { label: 'Underweight', color: '#38BDF8' };
    if (num < 25.0) return { label: 'Normal Weight', color: '#10B981' };
    if (num < 30.0) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obese', color: '#EF4444' };
  };

  const bmiCat = getBmiCategory(bmi);

  const handleInputChange = (field, value) => {
    setSelfData((prev) => ({
      ...prev,
      [field]: value
    }));
    setValidationError('');
  };

  const handleLifestyleChange = (field, value) => {
    setSelfData((prev) => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        [field]: value
      }
    }));
  };

  const handleBpChange = (field, value) => {
    setSelfData((prev) => ({
      ...prev,
      blood_pressure: {
        ...prev.blood_pressure,
        [field]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  const handleLabChange = (field, value) => {
    setSelfData((prev) => ({
      ...prev,
      labs: {
        ...prev.labs,
        [field]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  const handleToggleCondition = (conditionLabel) => {
    setSelfData((prev) => {
      const current = prev.conditions || [];
      const exists = current.includes(conditionLabel);
      return {
        ...prev,
        conditions: exists 
          ? current.filter((c) => c !== conditionLabel)
          : [...current, conditionLabel]
      };
    });
  };

  const handleProceed = () => {
    // Validate required fields
    if (!selfData.name || selfData.name.trim() === '') {
      setValidationError('Please enter your name or an identifier.');
      return;
    }
    if (!selfData.age || selfData.age <= 0) {
      setValidationError('Please enter a valid age.');
      return;
    }
    if (!selfData.height || selfData.height <= 50) {
      setValidationError('Please enter a valid height (cm).');
      return;
    }
    if (!selfData.weight || selfData.weight <= 20) {
      setValidationError('Please enter a valid weight (kg).');
      return;
    }
    
    setValidationError('');
    onSaveAndContinue();
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Stage Header Banner */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            padding: '3px 10px', 
            borderRadius: '20px', 
            background: 'rgba(56, 189, 248, 0.15)', 
            color: '#38BDF8', 
            border: '1px solid rgba(56, 189, 248, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Stage 1 of 3
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Personal Health Profile Intake
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Collect & Store Your Health Data
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
          Enter your personal baseline measurements, lifestyle factors, and laboratory biomarkers.
          Disease predictions are <strong style={{ color: '#F59E0B' }}>deferred</strong> until you construct your family health network.
        </p>
      </div>

      {/* Lab Report Quick-Import Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'rgba(56, 189, 248, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#38BDF8'
          }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Have a Medical Lab Report?
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Upload your PDF, scanned image, or text report to automatically extract glucose, lipid panel, thyroid panel, and blood pressure.
            </div>
          </div>
        </div>

        <button 
          className="btn btn-outline"
          onClick={onOpenReportUpload}
          style={{ whiteSpace: 'nowrap', borderColor: '#38BDF8', color: '#38BDF8' }}
        >
          <FileText size={16} />
          <span>Upload Lab Report</span>
        </button>
      </div>

      {/* Main Profile Form Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color)', 
          background: 'rgba(11, 18, 30, 0.7)',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('biometrics')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '16px 20px',
              border: 'none',
              borderBottom: activeTab === 'biometrics' ? '2px solid #38BDF8' : '2px solid transparent',
              background: activeTab === 'biometrics' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              color: activeTab === 'biometrics' ? '#38BDF8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <User size={16} />
            <span>1. Biometrics *</span>
          </button>

          <button
            onClick={() => setActiveTab('lifestyle')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '16px 20px',
              border: 'none',
              borderBottom: activeTab === 'lifestyle' ? '2px solid #38BDF8' : '2px solid transparent',
              background: activeTab === 'lifestyle' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              color: activeTab === 'lifestyle' ? '#38BDF8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Flame size={16} />
            <span>2. Lifestyle *</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '16px 20px',
              border: 'none',
              borderBottom: activeTab === 'labs' ? '2px solid #38BDF8' : '2px solid transparent',
              background: activeTab === 'labs' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              color: activeTab === 'labs' ? '#38BDF8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={16} />
            <span>3. Blood Pressure & Labs</span>
          </button>

          <button
            onClick={() => setActiveTab('conditions')}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '16px 20px',
              border: 'none',
              borderBottom: activeTab === 'conditions' ? '2px solid #38BDF8' : '2px solid transparent',
              background: activeTab === 'conditions' ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
              color: activeTab === 'conditions' ? '#38BDF8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Stethoscope size={16} />
            <span>4. Known Conditions</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '28px' }}>
          {/* TAB 1: BIOMETRICS */}
          {activeTab === 'biometrics' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Personal Baseline Biometrics
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Core biometric variables required for baseline risk calibration across all organs.
                </p>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Full Name or Alias
                    <span className="required-tag">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={selfData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Biological Sex
                    <span className="required-tag">*</span>
                  </label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={selfData.gender || 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="male" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Male</option>
                    <option value="female" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Age (Years)
                    <span className="required-tag">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    className="form-control"
                    placeholder="e.g. 25"
                    value={selfData.age || ''}
                    onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Height (cm)
                    <span className="required-tag">*</span>
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="250"
                    className="form-control"
                    placeholder="e.g. 178"
                    value={selfData.height || ''}
                    onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || '')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Weight (kg)
                    <span className="required-tag">*</span>
                  </label>
                  <input
                    type="number"
                    min="25"
                    max="300"
                    step="0.5"
                    className="form-control"
                    placeholder="e.g. 74"
                    value={selfData.weight || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || '')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Calculated BMI</label>
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {bmi ? `${bmi} kg/m²` : '—'}
                    </span>
                    {bmiCat && (
                      <span 
                        style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 600, 
                          color: bmiCat.color,
                          background: `${bmiCat.color}20`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${bmiCat.color}40`
                        }}
                      >
                        {bmiCat.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('lifestyle')}
                >
                  <span>Continue to Lifestyle</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIFESTYLE */}
          {activeTab === 'lifestyle' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Lifestyle & Behavioral Profile
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Lifestyle factors modulate baseline probabilities for Cardiovascular, Metabolic, and Cancer models.
                </p>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Smoking Status
                    <span className="required-tag">*</span>
                  </label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={selfData.lifestyle?.smoking || 'no'}
                    onChange={(e) => handleLifestyleChange('smoking', e.target.value)}
                  >
                    <option value="no" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Non-Smoker (Never or quit &gt; 5 yrs)</option>
                    <option value="yes" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Active Smoker / Regular Tobacco User</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Physical Activity Level
                    <span className="required-tag">*</span>
                  </label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={selfData.lifestyle?.activity || 'yes'}
                    onChange={(e) => handleLifestyleChange('activity', e.target.value)}
                  >
                    <option value="yes" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Active (&ge; 150 mins moderate / 75 mins vigorous weekly)</option>
                    <option value="no" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Sedentary (Little or no regular physical exercise)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Alcohol Intake
                    <span className="required-tag">*</span>
                  </label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={selfData.lifestyle?.alcohol || 'no'}
                    onChange={(e) => handleLifestyleChange('alcohol', e.target.value)}
                  >
                    <option value="no" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>None or Occasional (&le; 1-2 drinks/month)</option>
                    <option value="yes" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Regular / Moderate to High (&ge; 3-4 drinks/week)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Dietary Pattern
                    <span className="optional-tag">Optional</span>
                  </label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF', colorScheme: 'dark' }}
                    value={selfData.lifestyle?.diet || 'balanced'}
                    onChange={(e) => handleLifestyleChange('diet', e.target.value)}
                  >
                    <option value="balanced" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Balanced / Mediterranean / Whole Foods</option>
                    <option value="high_carb" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>High Carbohydrate / High Sugar</option>
                    <option value="processed" style={{ backgroundColor: '#0D0D0D', color: '#FFFFFF' }}>Standard Western / High Processed Foods</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('biometrics')}
                >
                  Back
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('labs')}
                >
                  <span>Continue to Labs & BP</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BLOOD PRESSURE & LABS */}
          {activeTab === 'labs' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Blood Pressure & Laboratory Blood Tests
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      All laboratory values are optional. Missing values default to population-normed imputations.
                    </p>
                  </div>
                  <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>
                    All Fields Optional
                  </span>
                </div>
              </div>

              {/* Blood Pressure Box */}
              <div style={{ 
                background: 'rgba(11, 18, 30, 0.5)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#38BDF8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={16} />
                  <span>Resting Blood Pressure</span>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Systolic BP (mmHg)
                      <span className="optional-tag">Resting</span>
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="240"
                      className="form-control"
                      placeholder="e.g. 120"
                      value={selfData.blood_pressure?.sys_bp || ''}
                      onChange={(e) => handleBpChange('sys_bp', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Diastolic BP (mmHg)
                      <span className="optional-tag">Resting</span>
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="140"
                      className="form-control"
                      placeholder="e.g. 80"
                      value={selfData.blood_pressure?.dia_bp || ''}
                      onChange={(e) => handleBpChange('dia_bp', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Lab Tests Grid */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Fasting Glucose (mg/dL)
                    <span className="optional-tag">Metabolic / Diabetes</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 92"
                    value={selfData.labs?.fasting_glucose || ''}
                    onChange={(e) => handleLabChange('fasting_glucose', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Total Cholesterol (mg/dL)
                    <span className="optional-tag">Cardiovascular</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 195"
                    value={selfData.labs?.total_cholesterol || ''}
                    onChange={(e) => handleLabChange('total_cholesterol', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    LDL Cholesterol (mg/dL)
                    <span className="optional-tag">Lipid Profile</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 115"
                    value={selfData.labs?.ldl || ''}
                    onChange={(e) => handleLabChange('ldl', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    HDL Cholesterol (mg/dL)
                    <span className="optional-tag">Lipid Profile</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 52"
                    value={selfData.labs?.hdl || ''}
                    onChange={(e) => handleLabChange('hdl', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Triglycerides (mg/dL)
                    <span className="optional-tag">Lipid Profile</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 135"
                    value={selfData.labs?.triglycerides || ''}
                    onChange={(e) => handleLabChange('triglycerides', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Hemoglobin (g/dL)
                    <span className="optional-tag">Blood Panel</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 14.5"
                    value={selfData.labs?.hemoglobin || ''}
                    onChange={(e) => handleLabChange('hemoglobin', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    TSH (Thyroid Stimulating Hormone, &micro;IU/mL)
                    <span className="optional-tag">Thyroid Model</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="e.g. 2.1"
                    value={selfData.labs?.tsh || ''}
                    onChange={(e) => handleLabChange('tsh', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Total T3 (nmol/L)
                    <span className="optional-tag">Thyroid Model</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="e.g. 1.8"
                    value={selfData.labs?.t3 || ''}
                    onChange={(e) => handleLabChange('t3', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('lifestyle')}
                >
                  Back
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('conditions')}
                >
                  <span>Continue to Known Conditions</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KNOWN CONDITIONS */}
          {activeTab === 'conditions' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Known Personal Diagnoses
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Select any pre-existing health conditions or clinical diagnoses you currently manage.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {COMMON_CONDITIONS.map((cond) => {
                  const isChecked = (selfData.conditions || []).includes(cond.label);
                  return (
                    <div
                      key={cond.id}
                      onClick={() => handleToggleCondition(cond.label)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: isChecked ? '1px solid #38BDF8' : '1px solid var(--border-color)',
                        background: isChecked ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.88rem', fontWeight: isChecked ? 600 : 400, color: isChecked ? '#F5F7FA' : 'var(--text-secondary)' }}>
                        {cond.label}
                      </span>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isChecked ? '2px solid #38BDF8' : '2px solid var(--border-color)',
                        background: isChecked ? '#38BDF8' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isChecked && <CheckCircle2 size={14} color="#000" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('labs')}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {validationError && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          background: 'rgba(239, 68, 68, 0.12)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Primary Action Button to Transition to Stage 2 */}
      <div style={{ 
        marginTop: '28px', 
        padding: '24px', 
        borderRadius: 'var(--radius-lg)', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Ready to Build Your Family Network?
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Next: Position your biological relatives on the interactive network canvas to capture genetic risk modifiers.
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleProceed}
          style={{ 
            padding: '14px 28px', 
            fontSize: '1rem', 
            background: 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 100%)',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)'
          }}
        >
          <span>Save Health Information & Build Family Network</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Safety Notice */}
      <div className="disclaimer-box" style={{ marginTop: '20px' }}>
        <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Privacy & Calibration Assurance:</strong> Your health inputs are stored locally in your current session.
          Prediction models are evaluated only after your family history context is established, ensuring calibrated genetic weighting.
        </div>
      </div>
    </div>
  );
}
