// ─────────────────────────────────────────────────────────────
// Monagrid API Configuration
// ─────────────────────────────────────────────────────────────
// BROWSER (Expo Web)  → use 'http://localhost:8000'
// PHYSICAL PHONE      → use 'http://155.0.74.77:8000'  (your LAN IP)
// PRODUCTION (Render) → use 'https://your-app.onrender.com'
// ─────────────────────────────────────────────────────────────

export const API_BASE_URL = 'http://localhost:8000';

// Endpoints
export const ENDPOINTS = {
  health:        `${API_BASE_URL}/health`,
  predictSingle: `${API_BASE_URL}/predict`,
  predictBatch:  `${API_BASE_URL}/predict/batch`,
};
