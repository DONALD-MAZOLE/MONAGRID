// src/services/apiService.js
// All API calls to the Monagrid FastAPI backend
import { ENDPOINTS } from '../config/api';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Normalise any thrown value to a readable string.
 */
function toMessage(e) {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message || String(e);
  if (typeof e === 'object') {
    return e.message || e.detail || JSON.stringify(e);
  }
  return String(e);
}

/**
 * Build a FormData entry that works on both React Native (file URI)
 * and browser (fetch the URI → Blob).
 */
async function buildFileEntry(uri, fileName, mimeType) {
  if (Platform.OS === 'web') {
    // In the browser, fetch the blob-URL / data-URL created by ImagePicker
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], fileName || 'panel.jpg', { type: mimeType || 'image/jpeg' });
  }
  // React Native — return the RN-style object
  return { uri, name: fileName || 'panel.jpg', type: mimeType || 'image/jpeg' };
}

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

/**
 * Check if the backend is reachable and the model is loaded.
 */
export async function checkHealth() {
  try {
    const res = await fetch(ENDPOINTS.health, { method: 'GET' });
    const data = await res.json();
    return { ok: data.status === 'ok' && data.model_loaded, detail: JSON.stringify(data) };
  } catch (e) {
    return { ok: false, detail: toMessage(e) };
  }
}

/**
 * Send a single image to POST /predict.
 */
export async function predictSingle(uri, fileName, mimeType = 'image/jpeg') {
  let formData;

  try {
    const fileEntry = await buildFileEntry(uri, fileName, mimeType);
    formData = new FormData();
    formData.append('file', fileEntry);
  } catch (e) {
    throw new Error(`Could not read image: ${toMessage(e)}`);
  }

  let res;
  try {
    res = await fetch(ENDPOINTS.predictSingle, {
      method: 'POST',
      body: formData,
      // Do NOT manually set Content-Type — browser/RN will add the multipart boundary
    });
  } catch (e) {
    throw new Error(`Cannot reach backend at ${ENDPOINTS.predictSingle}. Is the server running? (${toMessage(e)})`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    throw new Error(detail || `Server error ${res.status}`);
  }

  return res.json();
}

/**
 * Send multiple images to POST /predict/batch.
 */
export async function predictBatch(assets) {
  let formData;

  try {
    formData = new FormData();
    for (const asset of assets) {
      const fileEntry = await buildFileEntry(asset.uri, asset.fileName, asset.mimeType);
      formData.append('files', fileEntry);
    }
  } catch (e) {
    throw new Error(`Could not read images: ${toMessage(e)}`);
  }

  let res;
  try {
    res = await fetch(ENDPOINTS.predictBatch, {
      method: 'POST',
      body: formData,
    });
  } catch (e) {
    throw new Error(`Cannot reach backend at ${ENDPOINTS.predictBatch}. Is the server running? (${toMessage(e)})`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    throw new Error(detail || `Server error ${res.status}`);
  }

  return res.json();
}
