/**
 * GeneGuard API Configuration
 * Supports local development, custom backend environments, and Vercel cloud deployment.
 */

export const getApiBase = () => {
  // Explicit environment variable provided (e.g. in Vercel Project Settings)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // Local development default
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }

  // Production relative fallback (can be routed via vercel.json rewrites)
  return '/api';
};

export const API_BASE = getApiBase();

export const CHATBOT_URL = (import.meta.env.VITE_CHATBOT_URL || '').replace(/\/+$/, '');
