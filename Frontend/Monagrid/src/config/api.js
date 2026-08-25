// ─────────────────────────────────────────────────────────────
// Monagrid API Configuration
// ─────────────────────────────────────────────────────────────
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = () => {
  // 1. Browser (Expo Web) -> use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  // 2. Physical Phone (Expo Go) -> auto-detect laptop IP from Metro host
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

  // 3. Fallback Wi-Fi IP
  return 'http://192.168.40.87:8000';
};

export const API_BASE_URL = getBackendUrl();

console.log('[Monagrid API] Configured Base URL:', API_BASE_URL);

// Endpoints
export const ENDPOINTS = {
  health:        `${API_BASE_URL}/health`,
  predictSingle: `${API_BASE_URL}/predict`,
  predictBatch:  `${API_BASE_URL}/predict/batch`,
};
