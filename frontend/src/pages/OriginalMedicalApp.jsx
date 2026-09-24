import React, { useState, useRef } from 'react';
import { 
  Bot, 
  ExternalLink, 
  RotateCcw, 
  Activity, 
  Users, 
  LayoutDashboard
} from 'lucide-react';
import Loader from '../components/Loader';

export default function OriginalMedicalApp({ onNavigateTab }) {
  const iframeRef = useRef(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  const handleReloadIframe = () => {
    setIframeLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = '/chatbot';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Navigation & Status Bar */}
      <div 
        style={{
          background: 'var(--glass-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <img 
              src="/geneguard-logo-symbol.png" 
              alt="GeneGuard AI" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Original Medical Chatbot App
              </h2>
              <span 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              >
                Port 5173 Integrated
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
              End-to-End Generative AI Medical Consultation • Powered by The Gale Encyclopedia of Medicine
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigateTab('input')}
            className="btn btn-glass"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Activity size={13} />
            <span>Health Data</span>
          </button>

          <button
            onClick={() => onNavigateTab('family')}
            className="btn btn-glass"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={13} />
            <span>Family Network</span>
          </button>

          <button
            onClick={() => onNavigateTab('dashboard')}
            className="btn btn-glass"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutDashboard size={13} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={handleReloadIframe}
            className="btn btn-glass"
            title="Reload Medical App"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          >
            <RotateCcw size={13} />
          </button>

          <a
            href="/chatbot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <span>Open in Tab</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Embedded Full Application View */}
      <div
        style={{
          flex: 1,
          minHeight: '740px',
          background: 'rgba(0, 0, 0, 0.30)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {iframeLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.70)',
              backdropFilter: 'blur(12px)',
              zIndex: 10
            }}
          >
            <Loader size={180} label="Connecting to GeneGuard Medical AI Agent..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/chatbot"
          title="Original Medical Chatbot App"
          onLoad={() => setIframeLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '740px',
            border: 'none',
            display: 'block',
            backgroundColor: '#000000'
          }}
        />
      </div>
    </div>
  );
}
