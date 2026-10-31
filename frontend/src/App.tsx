import { NavLink, Route, Routes } from 'react-router-dom'
import { ScanFace } from 'lucide-react'
import Home from './pages/Home'
import History from './pages/History'
import ModelInfoPage from './pages/ModelInfoPage'
import About from './pages/About'
import { useHealth } from './hooks/useHealth'

const links = [['/', 'Analyze'], ['/history', 'History'], ['/model', 'Model'], ['/about', 'About']]
const badge = { checking: ['Checking…', 'bg-slate-100 text-slate-600'], ready: ['Model ready', 'bg-emerald-100 text-emerald-700'],
  'model-missing': ['Model not loaded', 'bg-amber-100 text-amber-800'], offline: ['Backend offline', 'bg-rose-100 text-rose-700'] } as const

export default function App() {
  const h = useHealth(); const [text, cls] = badge[h]
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3" aria-label="Main">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><ScanFace size={20} /></span>
            VeriFace <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">AI</span>
          </NavLink>
          <div className="flex items-center gap-1 text-sm font-medium">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end className={({ isActive }) => `rounded-lg px-3 py-1.5 transition ${isActive ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</NavLink>))}
            <span role="status" className={`ml-2 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{text}</span>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Routes><Route path="/" element={<Home />} /><Route path="/history" element={<History />} />
          <Route path="/model" element={<ModelInfoPage />} /><Route path="/about" element={<About />} /></Routes>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        VeriFace AI gives a model-based estimate, not proof of authenticity. Do not rely on it for high-stakes decisions.</footer>
    </div>
  )
}
