import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, ScanSearch, RefreshCw } from 'lucide-react'
import UploadPanel from '../components/UploadPanel'
import ResultCard from '../components/ResultCard'
import { ApiError, MAX_UPLOAD_MB, predict } from '../services/api'
import type { Prediction } from '../types'

const EXT = /\.(jpe?g|png|webp)$/i
const MIN_SIDE = 32

function checkReadable(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file); const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE ? `Image is too small (minimum ${MIN_SIDE}px per side).` : null) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('This file could not be read as an image.') }
    img.src = url
  })
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Prediction | null>(null); const [error, setError] = useState<ApiError | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])

  const reset = useCallback(() => { setFile(null); setPreview(null); setResult(null); setError(null); setFileError(null); setProgress(0) }, [])

  const select = async (f: File) => {
    setResult(null); setError(null)
    const problem = !EXT.test(f.name) ? 'Unsupported file type. Use JPG, JPEG, PNG or WEBP.'
      : f.size === 0 ? 'This file is empty.'
      : f.size > MAX_UPLOAD_MB * 1024 * 1024 ? `File is too large (max ${MAX_UPLOAD_MB} MB).` : await checkReadable(f)
    if (problem) { setFileError(problem); return }
    setFileError(null); setFile(f); setPreview(URL.createObjectURL(f))
  }

  const analyze = async () => {
    if (!file) return
    setBusy(true); setError(null); setProgress(0)
    try { const r = await predict(file, setProgress); setResult(r); setToast('Analysis complete') }
    catch (e) { setError(e instanceof ApiError ? e : new ApiError('Something went wrong.', 0, true)) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">HOG + HSV · SVM classifier</span>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Is this image <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">REAL or FAKE?</span></h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Upload an image and our trained model compares its texture and colour patterns with the REAL and FAKE examples it learned from.</p>
      </section>

      {result ? <ResultCard r={result} previewUrl={preview} onReset={reset} /> : (
        <section className="card mx-auto max-w-2xl p-5 sm:p-7">
          <UploadPanel file={file} previewUrl={preview} error={fileError} disabled={busy} onSelect={select} onRemove={reset} maxMb={MAX_UPLOAD_MB} />
          {error && (
            <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" /><div className="flex-1"><p className="font-semibold">Analysis failed</p><p>{error.message}</p></div>
              {error.retryable && <button className="btn-ghost !px-3 !py-1.5" onClick={analyze}><RefreshCw size={14} />Retry</button>}
            </div>)}
          {busy && (
            <div className="mt-4" role="status"><div className="mb-1 flex items-center gap-2 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" />
              {progress < 100 ? `Uploading… ${progress}%` : 'Analysing image…'}</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all" style={{ width: `${progress}%` }} /></div></div>)}
          <button className="btn-primary mt-5 w-full" disabled={!file || busy} onClick={analyze}><ScanSearch size={18} />Analyze Image</button>
          <p className="mt-3 text-center text-xs text-slate-500">Images are analysed in memory and are not stored. Only the prediction metadata is saved to history.</p>
        </section>)}

      {toast && <div role="status" className="fixed bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm text-white shadow-lg fade-up"><CheckCircle2 size={16} />{toast}</div>}

      <section className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        {[['1. Upload', 'Your image is validated on the server and decoded safely.'], ['2. Extract', 'It is resized to 128×128, then HOG shape and HSV colour features are computed.'],
          ['3. Classify', 'A trained SVM outputs a REAL/FAKE prediction and a model score.']].map(([t, d]) => (
          <div key={t} className="card p-4"><p className="font-bold">{t}</p><p className="mt-1 text-sm text-slate-600">{d}</p></div>))}
      </section>
      <p className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-900">
        <b>Disclaimer:</b> predictions are not definitive proof of authenticity. Results depend on the training data and can be wrong.</p>
    </div>
  )
}
