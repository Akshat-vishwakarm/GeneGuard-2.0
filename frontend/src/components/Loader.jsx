import React from 'react';
import './Loader.css';

/**
 * GeneGuard AI Agent Ripple Loader
 * 
 * Features concentric ripple wave animations with the GeneGuard DNA emblem at the center.
 * Configurable via `size` (number or string, default: 160px), `duration`, and optional `label`.
 */
const Loader = ({ size = 160, duration = '2s', label = '' }) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className="geneguard-loader-wrapper">
      <div 
        className="loader" 
        style={{ 
          '--size': sizeValue,
          '--duration': duration 
        }}
      >
        <div className="box">
          <div className="logo">
            <img 
              src="/geneguard-logo-symbol.png" 
              alt="GeneGuard AI Logo" 
              className="loader-logo-img"
            />
          </div>
        </div>
        <div className="box" />
        <div className="box" />
        <div className="box" />
        <div className="box" />
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
};

export default Loader;
