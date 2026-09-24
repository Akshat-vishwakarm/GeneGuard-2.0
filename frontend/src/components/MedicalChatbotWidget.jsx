import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  ExternalLink, 
  RotateCcw, 
  BookOpen, 
  Minimize2, 
  Maximize2,
  ChevronDown
} from 'lucide-react';
import Loader from './Loader';
import './AiFloatingButton.css';

// Using relative URL so all requests flow seamlessly through port 5173 via Vite proxy
const CHATBOT_URL = '';

export default function MedicalChatbotWidget({ isOpen, setIsOpen, onNavigateTab }) {

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '• Hello! I am your GeneGuard Medical AI Assistant.\n• Connected to The Gale Encyclopedia of Medicine.\n• Ask me any question regarding diseases, symptoms, clinical diagnosis, or treatments.',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'iframe'
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'What are the symptoms of hypertension?',
    'How is Type 2 Diabetes diagnosed?',
    'What causes asthma attacks?',
    'Explain HDL vs LDL cholesterol'
  ];

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.answer || 'No response received from medical service.',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback to /get form-encoded endpoint if api/chat failed
      try {
        const formData = new URLSearchParams();
        formData.append('msg', query);
        const fbResp = await fetch(`${CHATBOT_URL}/get`, {
          method: 'POST',
          body: formData
        });
        const fbText = await fbResp.text();
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: fbText || 'Medical response service temporarily unavailable.',
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (fbErr) {
        const errMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Unable to reach the Medical Chatbot server. Please verify that the chatbot service is running at http://localhost:8080.',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: '• Chat history cleared.\n• How can I help you with medical reference information today?',
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* -------------------------------------------------------------
          FIXED HOVER BUTTON (Bottom-Right of the Page)
      ------------------------------------------------------------- */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Hover Expandable Pill Badge */}
        {!isOpen && isHovered && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.40)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'fadeIn 0.15s ease',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            <span>Medical AI Assistant</span>
          </div>
        )}

        {/* Animated AI Button with 5 Ripple Boxes & App Logo in Middle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Toggle Medical Chatbot"
          className={`ai-button-loader ${isOpen ? 'open' : ''}`}
          title="GeneGuard Medical AI Agent"
        >
          {isOpen ? (
            <div className="box" style={{ inset: '15%', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} color="var(--text-primary)" />
            </div>
          ) : (
            <>
              {/* Box 1 (Innermost with App Logo in Middle) */}
              <div className="box">
                <div className="logo">
                  <img 
                    src="/geneguard-logo-symbol.png" 
                    alt="GeneGuard AI" 
                    className="ai-logo-img"
                  />
                </div>
              </div>

              {/* 4 Outer Concentric Ripple Boxes */}
              <div className="box" />
              <div className="box" />
              <div className="box" />
              <div className="box" />

              {/* Online Green Indicator Dot */}
              <span className="online-dot" />
            </>
          )}
        </button>
      </div>

      {/* -------------------------------------------------------------
          COMBINED CHATBOT POPUP WINDOW
      ------------------------------------------------------------- */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: isExpanded ? '640px' : '420px',
            maxWidth: 'calc(100vw - 36px)',
            height: isExpanded ? '760px' : '560px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'rgba(0, 0, 0, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: 'none',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}
              >
                <img 
                  src="/geneguard-logo-symbol.png" 
                  alt="GeneGuard AI" 
                  style={{ width: '20px', height: '20px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))' }} 
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Medical AI
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#10B981',
                      fontSize: '0.64rem',
                      fontWeight: 500,
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Online
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Gale Encyclopedia Reference & RAG
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Reset Thread */}
              <button
                onClick={handleResetChat}
                title="Clear conversation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                <RotateCcw size={14} />
              </button>

              {/* Expand Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand window'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              {/* Navigate to Full Page */}
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateTab('medical-app');
                  }}
                  title="Open Full Page View"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Full Page</span>
                </button>
              )}

              {/* Open in Standalone Tab */}
              <a
                href="/chatbot"
                target="_blank"
                rel="noreferrer"
                title="Open in standalone tab"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={14} />
              </a>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '5px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Native Chat vs Embedded Web App) */}
          <div
            style={{
              padding: '6px 16px',
              background: 'rgba(255, 255, 255, 0.01)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem'
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setViewMode('chat')}
                style={{
                  background: viewMode === 'chat' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  border: viewMode === 'chat' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  color: viewMode === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setViewMode('iframe')}
                style={{
                  background: viewMode === 'iframe' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  border: viewMode === 'iframe' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  color: viewMode === 'iframe' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Web App View
              </button>
            </div>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'monospace' }}>
              Port 5173
            </span>
          </div>

          {/* View Body */}
          {viewMode === 'iframe' ? (
            /* IFRAME EMBEDDED MODE */
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe
                src="/chatbot"
                title="Medical Chatbot"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#000000'
                }}
              />
            </div>
          ) : (
            /* NATIVE INTEGRATED CHAT MODE */
            <>
              {/* Message Thread */}
              <div
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'transparent'
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        padding: '10px 14px',
                        borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: m.sender === 'user'
                          ? 'rgba(255, 255, 255, 0.06)'
                          : m.isError
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                        border: m.sender === 'user'
                          ? '1px solid rgba(255, 255, 255, 0.12)'
                          : m.isError
                            ? '1px solid rgba(239, 68, 68, 0.25)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        color: m.isError ? '#F87171' : 'var(--text-primary)',
                        fontSize: '0.84rem',
                        lineHeight: 1.55
                      }}
                    >
                      {/* Message Content with Bulletpoint Support */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {m.text.split('\n').map((line, lIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
                          const content = isBullet ? trimmed.replace(/^[\•\-\*]\s*/, '') : trimmed;
                          return (
                            <div 
                              key={lIdx} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '6px' 
                              }}
                            >
                              {isBullet && (
                                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.88rem', lineHeight: '1.4' }}>•</span>
                              )}
                              <span style={{ flex: 1, lineHeight: 1.5 }}>{content}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Source Citation Badges */}
                      {m.sources && m.sources.length > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '6px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}
                        >
                          <BookOpen size={11} color="var(--accent-cyan)" />
                          <span>Sources:</span>
                          {m.sources.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                color: 'var(--accent-cyan)',
                                fontFamily: 'monospace'
                              }}
                            >
                              Page {s.page}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.64rem',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        padding: '0 4px'
                      }}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                ))}

                {/* AI Agent Ripple Loader with GeneGuard Logo in Center */}
                {isLoading && (
                  <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
                    <Loader size={110} label="GeneGuard AI is researching clinical data..." />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 3 && (
                <div
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                  }}
                >
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '12px',
                        padding: '3px 9px',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a medical question..."
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  style={{
                    background: inputText.trim() && !isLoading ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: inputText.trim() && !isLoading ? '#000000' : 'var(--text-muted)',
                    cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
