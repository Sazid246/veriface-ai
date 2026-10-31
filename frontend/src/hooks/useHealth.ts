import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'
export type HealthState = 'checking' | 'ready' | 'model-missing' | 'offline'
export function useHealth(): HealthState {
  const [s, setS] = useState<HealthState>('checking')
  useEffect(() => {
    let alive = true
    const check = () => getHealth().then(h => alive && setS(h.model_loaded ? 'ready' : 'model-missing')).catch(() => alive && setS('offline'))
    check(); const t = setInterval(check, 15000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return s
}
