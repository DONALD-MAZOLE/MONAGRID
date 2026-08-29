// ─────────────────────────────────────────────────────────────
// Monagrid API Configuration
// ─────────────────────────────────────────────────────────────
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production Render Backend URL
export const RENDER_BACKEND_URL = 'https://monagrid-backend.onrender.com';

const getBackendUrl = () => {
  // If we want to force production URL even in dev, we can return RENDER_BACKEND_URL;
  // But for local testing of new features, we should use the local server!
  
  if (Platform.OS === 'web') {
    // If running in browser locally (e.g. testing multiclass model)
    // Uncomment the next line to test against live Render server:
    // return RENDER_BACKEND_URL; 
    return 'http://localhost:8000';
  }

  // Auto-detect laptop IP for physical phone (Expo Go) testing locally
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }

  // Default to Render URL in production or if IP not found
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
