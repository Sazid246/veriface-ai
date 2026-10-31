import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { CheckCircle2, Download, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Prediction } from '../types'
import { reportUrl } from '../services/api'

const pct = (v: unknown) => `${(Number(v) * 100).toFixed(1)}%`

export default function ResultCard({ r, previewUrl, onReset }: { r: Prediction; previewUrl: string | null; onReset: () => void }) {
  const real = r.predicted_label === 'REAL'
  const data = [{ name: 'REAL', value: r.scores.REAL }, { name: 'FAKE', value: r.scores.FAKE }]
  return (
    <section className="card fade-up p-5 sm:p-7" aria-live="polite">
      <div className="grid gap-6 md:grid-cols-2">
        {previewUrl && <img src={previewUrl} alt="Analysed image" className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-100 object-contain" />}
        <div>
          <div className={`flex items-center gap-3 rounded-xl p-4 ${real ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {real ? <CheckCircle2 size={32} /> : <ShieldAlert size={32} />}
            <div><p className="text-xs font-medium uppercase tracking-wide opacity-70">Model prediction</p>
              <p className="text-3xl font-extrabold">{r.predicted_label}</p></div>
          </div>
          <div className="mt-4 h-28" role="img" aria-label={`Model score REAL ${pct(r.scores.REAL)}, FAKE ${pct(r.scores.FAKE)}`}>
            <ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
              <XAxis type="number" domain={[0, 1]} hide /><YAxis type="category" dataKey="name" width={48} tick={{ fill: '#0f172a', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={pct} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" radius={6} label={{ position: 'right', fill: '#0f172a', fontSize: 12, formatter: pct }}>
                {data.map(d => <Cell key={d.name} fill={d.name === 'REAL' ? '#10b981' : '#f43f5e'} />)}</Bar>
            </BarChart></ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">These are <b>model scores</b> (uncalibrated), not the probability that the image is authentic.</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        {[['Model', r.model_name], ['Processing time', `${r.processing_time_ms} ms`], ['Analysed at', new Date(r.timestamp).toLocaleString()]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-slate-50 px-3 py-2"><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onReset}><RotateCcw size={16} />Analyze another image</button>
        <a className="btn-ghost" href={reportUrl(r.prediction_id)} download><Download size={16} />Download report</a>
      </div>
    </section>
  )
}
