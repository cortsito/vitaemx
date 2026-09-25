import { useEffect, useState } from 'react'

import { api } from './api/client'
import type { Sex } from './api/types'
import LifeTableView from './components/LifeTableView'
import MethodologyNotes from './components/MethodologyNotes'
import MortalityCurveView from './components/MortalityCurveView'
import PremiumCalculator from './components/PremiumCalculator'
import StateSexSelector from './components/StateSexSelector'
import { useLoad } from './hooks'

type Page = 'tabla' | 'curva' | 'prima' | 'metodologia'

const PAGES: { id: Page; label: string }[] = [
  { id: 'tabla', label: 'Tabla de vida' },
  { id: 'curva', label: 'Curva de mortalidad' },
  { id: 'prima', label: 'Prima' },
  { id: 'metodologia', label: 'Metodología' },
]

function pageFromHash(): Page {
  const id = window.location.hash.replace('#/', '')
  return PAGES.some((p) => p.id === id) ? (id as Page) : 'tabla'
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [stateCode, setStateCode] = useState(0)
  const [sex, setSex] = useState<Sex>('total')
  const states = useLoad(() => api.states(), [])

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div>
      <nav>
        <strong>VitaeMX</strong>{' '}
        {PAGES.map((p) => (
          <a key={p.id} href={`#/${p.id}`}>
            {page === p.id ? <strong>{p.label}</strong> : p.label}
          </a>
        ))}
        <a href="https://github.com/cortsito/vitaemx">Código</a>
      </nav>
      <p className="muted">
        Motor actuarial de mortalidad para México, construido sobre las proyecciones oficiales de
        CONAPO. Herramienta educativa: mortalidad poblacional, no tarificación real.
      </p>

      {states.error && <p className="error">{states.error}</p>}
      {states.data && page !== 'metodologia' && (
        <StateSexSelector
          states={states.data}
          stateCode={stateCode}
          sex={sex}
          onStateChange={setStateCode}
          onSexChange={setSex}
        />
      )}

      {page === 'tabla' && <LifeTableView stateCode={stateCode} sex={sex} />}
      {page === 'curva' && <MortalityCurveView stateCode={stateCode} sex={sex} />}
      {page === 'prima' && <PremiumCalculator stateCode={stateCode} sex={sex} />}
      {page === 'metodologia' && <MethodologyNotes />}
    </div>
  )
}
