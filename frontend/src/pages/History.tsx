import { useEffect, useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
import { clearHistory, getHistory, reportUrl } from '../services/api'
import type { HistoryResponse } from '../types'

export default function History() {
  const [data, setData] = useState<HistoryResponse | null>(null); const [err, setErr] = useState<string | null>(null)
  const load = () => getHistory().then(setData).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])
  const wipe = async () => { if (confirm('Delete all saved prediction history?')) { await clearHistory().catch(e => setErr(e.message)); load() } }
  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Prediction history</h1>{data && <p className="text-sm text-slate-500">Stored: {data.storage}</p>}</div>
        <button className="btn-ghost !text-rose-600" disabled={!data?.items.length} onClick={wipe}><Trash2 size={16} />Delete history</button>
      </div>
      {err && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
      {!data && !err && <p className="mt-6 flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={16} />Loading…</p>}
      {data && !data.items.length && <p className="mt-6 text-slate-500">No predictions yet. Analyze an image to see it here.</p>}
      {!!data?.items.length && (
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr>{['ID', 'Time', 'Class', 'REAL score', 'FAKE score', 'ms', ''].map(h => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
          <tbody>{data.items.map(i => (
            <tr key={i.prediction_id} className="border-t border-slate-100">
              <td className="px-2 py-2 font-mono text-xs">{i.prediction_id.slice(0, 8)}</td><td className="px-2 py-2">{new Date(i.timestamp).toLocaleString()}</td>
              <td className="px-2 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${i.predicted_label === 'REAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{i.predicted_label}</span></td>
              <td className="px-2 py-2">{i.scores.REAL.toFixed(3)}</td><td className="px-2 py-2">{i.scores.FAKE.toFixed(3)}</td><td className="px-2 py-2">{i.processing_time_ms}</td>
              <td className="px-2 py-2"><a className="text-violet-600 hover:underline" href={reportUrl(i.prediction_id)} download aria-label="Download report"><Download size={16} /></a></td>
            </tr>))}</tbody></table></div>)}
    </div>
  )
}
