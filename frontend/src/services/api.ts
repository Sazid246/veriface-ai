import type { Health, HistoryResponse, ModelInfo, Prediction } from '../types'

export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000').replace(/\/$/, '')
export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB ?? 10)

export class ApiError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) { super(message) }
}

const isPrediction = (d: any): d is Prediction =>
  d && typeof d.prediction_id === 'string' && (d.predicted_label === 'REAL' || d.predicted_label === 'FAKE') &&
  typeof d.scores?.REAL === 'number' && typeof d.scores?.FAKE === 'number' && typeof d.processing_time_ms === 'number' &&
  typeof d.timestamp === 'string' && typeof d.model_name === 'string'

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: ctrl.signal })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(typeof body.detail === 'string' ? body.detail : `Request failed (${res.status}).`, res.status, res.status >= 500)
    return body as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if ((e as Error).name === 'AbortError') throw new ApiError('The server took too long to respond.', 0, true)
    throw new ApiError(`Cannot reach the backend at ${API_BASE}. Is it running?`, 0, true)
  } finally { clearTimeout(timer) }
}

export const getHealth = () => request<Health>('/api/health', {}, 5000)
export const getModelInfo = () => request<ModelInfo>('/api/model-info')
export const getHistory = () => request<HistoryResponse>('/api/history')
export const clearHistory = () => request<{ deleted: number }>('/api/history', { method: 'DELETE' })
export const reportUrl = (id: string) => `${API_BASE}/api/report/${encodeURIComponent(id)}`

/** Multipart upload via XHR so we can report upload progress. */
export function predict(file: File, onProgress: (pct: number) => void, timeoutMs = 60000): Promise<Prediction> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); const form = new FormData(); form.append('file', file)
    xhr.open('POST', `${API_BASE}/api/predict`); xhr.timeout = timeoutMs; xhr.responseType = 'json'
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      const body = xhr.response
      if (xhr.status >= 200 && xhr.status < 300) {
        return isPrediction(body) ? resolve(body) : reject(new ApiError('The server returned an unexpected response.', xhr.status, false))
      }
      reject(new ApiError(typeof body?.detail === 'string' ? body.detail : `Request failed (${xhr.status}).`, xhr.status, xhr.status >= 500))
    }
    xhr.onerror = () => reject(new ApiError(`Cannot reach the backend at ${API_BASE}. Is it running?`, 0, true))
    xhr.ontimeout = () => reject(new ApiError('The analysis timed out.', 0, true))
    xhr.send(form)
  })
}
