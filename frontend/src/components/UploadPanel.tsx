import { useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react'

interface Props { file: File | null; previewUrl: string | null; error: string | null; disabled: boolean
  onSelect: (f: File) => void; onRemove: () => void; maxMb: number }

export default function UploadPanel({ file, previewUrl, error, disabled, onSelect, onRemove, maxMb }: Props) {
  const input = useRef<HTMLInputElement>(null); const [drag, setDrag] = useState(false)
  const pick = (f?: File | null) => { if (f) onSelect(f); if (input.current) input.current.value = '' }
  return (
    <div>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden"
        aria-label="Choose an image" onChange={e => pick(e.target.files?.[0])} />
      {previewUrl && file ? (
        <div className="fade-up">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={previewUrl} alt="Selected upload preview" className="mx-auto max-h-80 w-full object-contain" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm text-slate-600">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="flex gap-2">
              <button className="btn-ghost !px-3 !py-1.5" disabled={disabled} onClick={() => input.current?.click()}><RefreshCw size={15} />Replace</button>
              <button className="btn-ghost !px-3 !py-1.5 !text-rose-600" disabled={disabled} onClick={onRemove}><Trash2 size={15} />Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div role="button" tabIndex={0} aria-label="Upload area. Drop an image or press Enter to browse"
          onClick={() => input.current?.click()} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
          className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${drag ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}>
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 text-violet-600"><UploadCloud size={28} /></span>
          <p className="font-semibold">Drag &amp; drop an image here</p>
          <p className="mt-1 text-sm text-slate-500">JPG, JPEG, PNG or WEBP · up to {maxMb} MB</p>
          <span className="btn-ghost mt-4"><ImagePlus size={16} />Browse image</span>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  )
}
