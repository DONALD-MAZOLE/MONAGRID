// ─────────────────────────────────────────────────────────────
// Monagrid API Configuration
// ─────────────────────────────────────────────────────────────
// LOCAL DEV: use your machine's LAN IP so a physical phone can reach it.
// PRODUCTION: swap this for your Render URL before deploying.
// ─────────────────────────────────────────────────────────────

export const API_BASE_URL = 'http://155.0.74.77:8000';

// Endpoints
export const ENDPOINTS = {
  health:       `${API_BASE_URL}/health`,
  predictSingle:`${API_BASE_URL}/predict`,
  predictBatch: `${API_BASE_URL}/predict/batch`,
};
