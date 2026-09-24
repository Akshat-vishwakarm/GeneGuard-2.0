import React from 'react';
import { Activity, Users, FileText, LayoutDashboard, RotateCcw, Bot, Sparkles, User } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  selectedPerson, 
  setShowReportModal, 
  onResetSession,
  isChatbotOpen,
  onToggleChatbot 
}) {
  return (
    <header className="navbar">
      {/* Brand & Main Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div 
          className="nav-brand"
          onClick={() => setActiveTab('input')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          title="GeneGuard Medical AI"
        >
          <div className="brand-icon" style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.12)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img 
              src="/geneguard-logo-symbol.png" 
              alt="GeneGuard" 
              style={{ width: '22px', height: '22px', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.45))' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title" style={{ letterSpacing: '0.04em' }}>GeneGuard</span>
            <span className="brand-badge">Medical AI</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            <Activity size={15} />
            <span>My Health Data</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'family' ? 'active' : ''}`}
            onClick={() => setActiveTab('family')}
          >
            <Users size={15} />
            <span>Family Network</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Analysis Dashboard</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'medical-app' ? 'active' : ''}`}
            onClick={() => setActiveTab('medical-app')}
          >
            <Bot size={15} />
            <span>Original Medical App</span>
          </button>

          <button
            className={`nav-btn ${isChatbotOpen ? 'active' : ''}`}
            onClick={onToggleChatbot}
            title="Toggle Floating Assistant Widget"
          >
            <Sparkles size={14} color="#38BDF8" />
            <span>Quick Chat</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={() => setShowReportModal(true)}
            style={{ 
              height: '32px', 
              fontSize: '0.78rem', 
              padding: '0 12px', 
              marginLeft: '8px',
              borderRadius: '6px'
            }}
          >
            <FileText size={14} />
            <span>Upload Lab Report</span>
          </button>
        </nav>
      </div>

      {/* Right Controls: Start New User & Profile Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="btn"
          onClick={onResetSession}
          title="Clear all session data and start as a completely fresh user"
          style={{
            height: '30px',
            fontSize: '0.78rem',
            padding: '0 10px',
            color: '#A0A0A0',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RotateCcw size={12} />
          <span>Start New User</span>
        </button>

        {/* Minimal Profile Status Pill */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: '#38BDF8' 
            }} 
          />
          <span style={{ fontSize: '0.76rem', color: '#A0A0A0' }}>
            Profile: <strong style={{ color: '#FFFFFF', fontWeight: 500 }}>{selectedPerson?.name ? selectedPerson.name : 'Patient'}</strong>
          </span>
          <div 
            style={{ 
              width: '22px', 
              height: '22px', 
              borderRadius: '50%', 
              background: 'rgba(56, 189, 248, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#38BDF8'
            }}
          >
            <User size={12} />
          </div>
        </div>
      </div>
    </header>
  );
}
