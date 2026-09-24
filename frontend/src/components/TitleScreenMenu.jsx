import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TitleScreenMenu.css';

/**
 * TitleScreenMenu
 * 
 * Game-Style Main Menu for GeneGuard.
 * Features:
 * - High-definition video background (Glass_figure_with_blowing_petals_revised.mp4)
 * - Minimalist Sci-Fi game UI aesthetics (pure black canvas, negative space, hairline outlines)
 * - 4 Menu Options: START GENEGUARD, ABOUT, GITHUB, CONTACT
 * - Smooth gliding selection indicator (<  OPTION  >) inspired by 65b42ce4-d20e-46b7-94af-6173d573e1ac-removebg-preview.png
 * - Zero neon glow, zero shiny effect, zero gradients, zero excessive animations
 * - 150-250ms fluid mechanical transitions
 * - Interactive About and Contact modals
 * - Keyboard navigation (Up/Down arrow keys, Enter, Esc)
 */

export default function TitleScreenMenu({ onStartGeneGuard }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'contact' | null
  const [indicatorStyle, setIndicatorStyle] = useState({
    top: 0,
    textWidth: 0,
    height: 38,
    ready: false
  });

  const menuListRef = useRef(null);
  const itemRefs = useRef([]);
  const textRefs = useRef([]);
  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play subtle game-style menu hover / select tick
  const playSubtleTick = useCallback((pitch = 1400) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(0.015, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.035);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // Ensure video background plays reliably across all browsers
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const attemptPlay = () => {
        if (video && video.paused) {
          video.muted = true;
          video.play().catch(() => {});
        }
      };

      attemptPlay();

      const handleUserGesture = () => {
        attemptPlay();
      };

      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });

      return () => {
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
    }
  }, []);

  // Update indicator position when hoveredIndex changes
  const updateIndicatorPosition = useCallback((index) => {
    if (index === null || !itemRefs.current[index] || !menuListRef.current) {
      return;
    }

    const itemEl = itemRefs.current[index];
    const textEl = textRefs.current[index];
    const top = itemEl.offsetTop;
    const textWidth = textEl ? textEl.offsetWidth : itemEl.offsetWidth;
    const height = itemEl.offsetHeight;

    setIndicatorStyle({
      top,
      textWidth,
      height,
      ready: true
    });
  }, []);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
    updateIndicatorPosition(index);
    playSubtleTick(1600);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Menu action handlers
  const handleStart = () => {
    playSubtleTick(2200);
    if (onStartGeneGuard) {
      onStartGeneGuard();
    }
  };

  const handleOpenAbout = () => {
    playSubtleTick(1800);
    setActiveModal('about');
  };

  const handleOpenGitHub = () => {
    playSubtleTick(1800);
    window.open('https://github.com/Akshat-vishwakarm/GeneGuard-2.0', '_blank', 'noopener,noreferrer');
  };

  const handleOpenContact = () => {
    playSubtleTick(1800);
    setActiveModal('contact');
  };

  const menuOptions = [
    {
      id: 'start',
      label: 'START GENEGUARD',
      action: handleStart
    },
    {
      id: 'about',
      label: 'ABOUT',
      action: handleOpenAbout
    },
    {
      id: 'github',
      label: 'GITHUB',
      action: handleOpenGitHub
    },
    {
      id: 'contact',
      label: 'CONTACT',
      action: handleOpenContact
    }
  ];

  // Full Keyboard Navigation (Up/Down arrow, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeModal) {
        if (e.key === 'Escape') {
          setActiveModal(null);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoveredIndex((prev) => {
          const next = prev === null || prev >= menuOptions.length - 1 ? 0 : prev + 1;
          updateIndicatorPosition(next);
          playSubtleTick(1500);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoveredIndex((prev) => {
          const next = prev === null || prev <= 0 ? menuOptions.length - 1 : prev - 1;
          updateIndicatorPosition(next);
          playSubtleTick(1500);
          return next;
        });
      } else if (e.key === 'Enter') {
        if (hoveredIndex !== null && menuOptions[hoveredIndex]) {
          e.preventDefault();
          menuOptions[hoveredIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, hoveredIndex, menuOptions, playSubtleTick, updateIndicatorPosition]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (hoveredIndex !== null) {
        updateIndicatorPosition(hoveredIndex);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hoveredIndex, updateIndicatorPosition]);

  return (
    <div className="title-screen-container">
      {/* 1. LAYER 0: Background Video */}
      <video
        ref={videoRef}
        className="title-video-background"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={() => {
          const video = videoRef.current;
          if (video && video.paused) {
            video.muted = true;
            video.play().catch(() => {});
          }
        }}
      >
        <source src="/Glass_figure_with_blowing_petals_revised.mp4" type="video/mp4" />
      </video>

      {/* 2. LAYER 1: Cinematic Vignette Overlay */}
      <div className="title-overlay" />
      <div className="title-scanlines" />

      {/* 3. TOP TELEMETRY HUD */}
      <header className="title-hud-top">
        <div className="title-hud-pill">
          <span className="title-hud-dot" />
          <span>GENEGUARD v2.0 // SYSTEM READY</span>
        </div>
        <div className="title-hud-pill">
          <span>SECURE CLINICAL REASONING ENVIRONMENT</span>
        </div>
      </header>

      {/* 4. CENTER MAIN MENU */}
      <main className="title-menu-center">
        {/* GeneGuard Symbol */}
        <img
          src="/geneguard-logo-symbol.png"
          alt="GeneGuard Logo"
          className="title-brand-symbol"
        />

        {/* Title & Subtitle */}
        <h1 className="title-main-heading">GeneGuard</h1>
        <p className="title-sub-heading">Multi-Disease Genetic & Clinical AI Platform</p>

        {/* Minimal Hairline Divider */}
        <div className="title-divider" />

        {/* Interactive Menu List */}
        <div className="sci-fi-menu-wrapper">
          <div
            className="sci-fi-menu-list"
            ref={menuListRef}
            onMouseLeave={handleMouseLeave}
          >
            {/* Sliding Minimal Outline Selection Indicator (< >) */}
            {indicatorStyle.ready && (
              <div
                className="menu-selection-indicator"
                style={{
                  transform: `translate3d(0, ${indicatorStyle.top}px, 0)`,
                  height: `${indicatorStyle.height}px`,
                  opacity: hoveredIndex !== null ? 1 : 0,
                  transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease',
                  visibility: hoveredIndex !== null ? 'visible' : 'hidden'
                }}
              >
                {/* Left Outline Bracket (<) */}
                <div
                  className="menu-chevron-bracket menu-chevron-left"
                  style={{
                    transform: `translate3d(-${(indicatorStyle.textWidth / 2) + 20}px, -50%, 0)`,
                    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <svg
                    className="menu-chevron-svg"
                    viewBox="0 0 18 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 2L3 11L13 20"
                      stroke="#FFFFFF"
                      strokeWidth="1.25"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                    <path
                      d="M17 4L9 11L17 18"
                      stroke="rgba(255, 255, 255, 0.72)"
                      strokeWidth="1.0"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </div>

                {/* Right Outline Bracket (>) */}
                <div
                  className="menu-chevron-bracket menu-chevron-right"
                  style={{
                    transform: `translate3d(${(indicatorStyle.textWidth / 2) + 20}px, -50%, 0)`,
                    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <svg
                    className="menu-chevron-svg"
                    viewBox="0 0 18 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 2L15 11L5 20"
                      stroke="#FFFFFF"
                      strokeWidth="1.25"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                    <path
                      d="M1 4L9 11L1 18"
                      stroke="rgba(255, 255, 255, 0.72)"
                      strokeWidth="1.0"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Menu Options */}
            {menuOptions.map((opt, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <button
                  key={opt.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  className={`sci-fi-menu-button ${isHovered ? 'is-active' : ''}`}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onFocus={() => handleMouseEnter(index)}
                  onClick={opt.action}
                  type="button"
                >
                  <span
                    ref={(el) => (textRefs.current[index] = el)}
                    className="sci-fi-menu-text"
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 5. BOTTOM HUD & CONTROLS */}
      <footer className="title-hud-bottom">
        <div className="title-control-hints">
          <div>
            <span className="title-hint-key">↑ / ↓</span>
            <span>NAVIGATE</span>
          </div>
          <div>
            <span className="title-hint-key">ENTER</span>
            <span>SELECT</span>
          </div>
          <div>
            <span className="title-hint-key">CLICK</span>
            <span>EXECUTE</span>
          </div>
        </div>

        <div>
          <span>GENEGUARD BIO-INTELLIGENCE // ALL RIGHTS RESERVED</span>
        </div>
      </footer>

      {/* ==========================================================================
          MODAL: ABOUT GENEGUARD
          ========================================================================== */}
      {activeModal === 'about' && (
        <div className="title-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="title-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="title-modal-header">
              <div>
                <h2 className="title-modal-title">About GeneGuard</h2>
                <div className="title-modal-subtitle">Multi-Organ Clinical AI & Genetic Risk Engine</div>
              </div>
              <button
                className="title-modal-close-btn"
                onClick={() => setActiveModal(null)}
                type="button"
              >
                [ ESC / CLOSE ]
              </button>
            </div>

            <div className="title-modal-content">
              <p>
                GeneGuard is an advanced, full-stack clinical intelligence platform designed to synthesize
                multi-organ diagnostic biomarkers with genetic pedigree inheritance trees.
              </p>

              <div className="title-modal-grid">
                <div className="title-modal-card">
                  <div className="title-modal-card-title">Multi-Disease ML Models</div>
                  <p className="title-modal-card-desc">
                    5 validated diagnostic modules spanning Cardiovascular Disease, Type 2 Diabetes,
                    Hypertension, Thyroid Pathologies, and Oncological Risk.
                  </p>
                </div>

                <div className="title-modal-card">
                  <div className="title-modal-card-title">Family Pedigree Analysis</div>
                  <p className="title-modal-card-desc">
                    Interactive canvas calculating kinship coefficient weights (50% first-degree, 25%
                    second-degree) for combined hereditary risk scoring.
                  </p>
                </div>

                <div className="title-modal-card">
                  <div className="title-modal-card-title">Automated OCR Ingestion</div>
                  <p className="title-modal-card-desc">
                    Universal laboratory report extraction with normal clinical range normalization and
                    smart auto-filling.
                  </p>
                </div>

                <div className="title-modal-card">
                  <div className="title-modal-card-title">Obsidian Glass Interface</div>
                  <p className="title-modal-card-desc">
                    Cinematic, dark-mode medical computing environment with transparent smoked glass and
                    strict clinical contrast standards.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  className="title-modal-action-btn"
                  onClick={() => {
                    setActiveModal(null);
                    handleStart();
                  }}
                  type="button"
                >
                  Start GeneGuard &rarr;
                </button>
                <button
                  className="title-modal-action-btn"
                  onClick={() => {
                    window.open('https://github.com/Akshat-vishwakarm/GeneGuard-2.0', '_blank', 'noopener,noreferrer');
                  }}
                  type="button"
                >
                  Explore on GitHub &nearr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: CONTACT & COLLABORATION
          ========================================================================== */}
      {activeModal === 'contact' && (
        <div className="title-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="title-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="title-modal-header">
              <div>
                <h2 className="title-modal-title">Contact & Inquiries</h2>
                <div className="title-modal-subtitle">Author & Research Collaboration</div>
              </div>
              <button
                className="title-modal-close-btn"
                onClick={() => setActiveModal(null)}
                type="button"
              >
                [ ESC / CLOSE ]
              </button>
            </div>

            <div className="title-modal-content">
              <p>
                GeneGuard 2.0 is developed by <strong>Akshat Vishwakarma</strong>. For technical collaboration,
                clinical validation inquiries, or questions regarding the genetic risk modeling algorithms:
              </p>

              <div className="title-modal-grid">
                <div className="title-modal-card">
                  <div className="title-modal-card-title">GitHub Repository</div>
                  <p className="title-modal-card-desc">
                    Contribute, inspect source code, or report issues on the official repository.
                  </p>
                </div>

                <div className="title-modal-card">
                  <div className="title-modal-card-title">Developer Profile</div>
                  <p className="title-modal-card-desc">
                    Akshat Vishwakarma on GitHub (Akshat-vishwakarm).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <a
                  className="title-modal-action-btn"
                  href="https://github.com/Akshat-vishwakarm/GeneGuard-2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository &nearr;
                </a>
                <a
                  className="title-modal-action-btn"
                  href="https://github.com/Akshat-vishwakarm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Author Profile &nearr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
