// ─────────────────────────────────────────────────────────────
// Monagrid API Configuration
// ─────────────────────────────────────────────────────────────
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production Render Backend URL
export const RENDER_BACKEND_URL = 'https://monagrid-backend.onrender.com';

const getBackendUrl = () => {
  // Point directly to deployed Render backend
  return RENDER_BACKEND_URL;
};

export const API_BASE_URL = getBackendUrl();

console.log('[Monagrid API] Configured Base URL:', API_BASE_URL);

// Endpoints
export const ENDPOINTS = {
  health:        `${API_BASE_URL}/health`,
  predictSingle: `${API_BASE_URL}/predict`,
  predictBatch:  `${API_BASE_URL}/predict/batch`,
};
