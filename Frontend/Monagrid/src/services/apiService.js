// src/services/apiService.js
// All API calls to the Monagrid FastAPI backend
import { ENDPOINTS } from '../config/api';

/**
 * Check if the backend is reachable and the model is loaded.
 * @returns {Promise<{ok: boolean, detail: string}>}
 */
export async function checkHealth() {
  try {
    const res = await fetch(ENDPOINTS.health, { method: 'GET' });
    const data = await res.json();
    return { ok: data.status === 'ok' && data.model_loaded, detail: JSON.stringify(data) };
  } catch (e) {
    return { ok: false, detail: e.message };
  }
}

/**
 * Send a single image to the /predict endpoint.
 * @param {string} uri       - Local file URI from ImagePicker
 * @param {string} fileName  - File name for the form-data field
 * @param {string} mimeType  - MIME type (image/jpeg or image/png)
 * @returns {Promise<PredictionResult>}
 *
 * PredictionResult shape:
 * {
 *   class_index: number,      // 0 = Healthy, 1 = Faulty
 *   label: string,            // "Healthy" | "Faulty"
 *   confidence: number,       // 0.0 – 1.0
 *   confidence_pct: string,   // "93.12%"
 *   severity: string,         // "ok" | "critical"
 *   description: string,
 *   probabilities: { Healthy: number, Faulty: number }
 * }
 */
export async function predictSingle(uri, fileName, mimeType = 'image/jpeg') {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName || 'panel.jpg',
    type: mimeType,
  });

  const res = await fetch(ENDPOINTS.predictSingle, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type manually — let fetch set it with the boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Server error ${res.status}`);
  }

  return res.json();
}

/**
 * Send multiple images to the /predict/batch endpoint.
 * @param {Array<{uri: string, fileName: string, mimeType: string}>} assets
 * @returns {Promise<Array<BatchResult>>}
 *
 * BatchResult shape:
 * {
 *   filename: string,
 *   prediction: PredictionResult,
 *   error: string | null
 * }
 */
export async function predictBatch(assets) {
  const formData = new FormData();
  for (const asset of assets) {
    formData.append('files', {
      uri: asset.uri,
      name: asset.fileName || 'panel.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
  }

  const res = await fetch(ENDPOINTS.predictBatch, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Server error ${res.status}`);
  }

  return res.json();
}
