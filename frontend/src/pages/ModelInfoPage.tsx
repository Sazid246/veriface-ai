import { useEffect, useState } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { getModelInfo } from '../services/api'
import type { ModelInfo } from '../types'

export default function ModelInfoPage() {
  const [m, setM] = useState<ModelInfo | null>(null); const [err, setErr] = useState<string | null>(null)
  useEffect(() => { getModelInfo().then(setM).catch(e => setErr(e.message)) }, [])
  if (err) return <p role="alert" className="card p-5 text-rose-700">{err}</p>
  if (!m) return <p className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={16} />Loading…</p>
  const f = m.feature_extraction; const metrics = m.evaluation_metrics?.test_metrics_selected
  const rows: [string, string][] = [['Model', m.model_name], ['Pipeline', m.pipeline.join(' → ')], ['Classes', Object.entries(m.classes).map(([k, v]) => `${k} = ${v}`).join(', ')],
    ['Input', `${f.resize}; ${f.image_size}×${f.image_size} px`], ['HOG', `${f.hog.orientations} orientations, ${f.hog.pixels_per_cell}px cells, ${f.hog.cells_per_block}×${f.hog.cells_per_block} blocks, ${f.hog.block_norm} (${f.hog.input})`],
    ['Colour', f.colour], ['Feature length', String(f.feature_dim)], ['Library', f.library], ['Decision threshold', String(m.decision_threshold)]]
  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-7"><h1 className="text-2xl font-extrabold">Model information</h1>
        <dl className="mt-4 divide-y divide-slate-100 text-sm">{rows.map(([k, v]) => <div key={k} className="grid gap-1 py-2 sm:grid-cols-[170px_1fr]"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><Info size={16} className="mt-0.5 shrink-0" />{m.score_note}</p></div>
      <div className="card p-5 sm:p-7"><h2 className="text-lg font-bold">Test-set evaluation</h2>
        {metrics ? <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(metrics).map(([k, v]) => <div key={k} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-lg font-bold">{v.toFixed(3)}</dd></div>)}</dl>
          : <p className="mt-2 text-sm text-slate-600">{m.metrics_note ?? 'No evaluation results are available.'}</p>}
        <p className="mt-3 text-xs text-slate-500">Test metrics describe performance on held-out dataset images, not on images you upload.</p></div>
    </div>
  )
}
