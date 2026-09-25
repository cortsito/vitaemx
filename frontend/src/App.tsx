import { useEffect, useState } from 'react'

import { api } from './api/client'
import type { Sex } from './api/types'
import LifeTableView from './components/LifeTableView'
import MethodologyNotes from './components/MethodologyNotes'
import MortalityCurveView from './components/MortalityCurveView'
import PremiumCalculator from './components/PremiumCalculator'
import SitePolicies from './components/SitePolicies'
import StateSexSelector from './components/StateSexSelector'
import { useLoad } from './hooks'

type Page = 'tabla' | 'curva' | 'prima' | 'metodologia' | 'privacidad' | 'uso'

const NAV_PAGES: { id: Exclude<Page, 'privacidad' | 'uso'>; label: string }[] = [
  { id: 'tabla', label: 'Tabla de vida' },
  { id: 'curva', label: 'Curva de mortalidad' },
  { id: 'prima', label: 'Prima' },
  { id: 'metodologia', label: 'Metodología' },
]

function pageFromHash(): Page {
  const id = window.location.hash.replace('#/', '')
  return [...NAV_PAGES, { id: 'privacidad' }, { id: 'uso' }].some((p) => p.id === id)
    ? (id as Page)
    : 'tabla'
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
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="app-header">
        <div className="header-frame">
          <a className="brand" href="#/tabla" aria-label="VitaeMX, tabla de vida">
            VitaeMX <span className="badge">CONAPO 2023</span>
          </a>
          <p className="tagline">Demografía actuarial de México · herramienta educativa</p>
          <nav className="tabs" aria-label="Navegación principal">
            {NAV_PAGES.map((p) => (
              <a
                key={p.id}
                href={`#/${p.id}`}
                className={page === p.id ? 'active' : undefined}
                aria-current={page === p.id ? 'page' : undefined}
              >
                {p.label}
              </a>
            ))}
          </nav>
          <a className="source-link" href="https://github.com/cortsito/vitaemx">
            Código fuente ↗
          </a>
        </div>
      </header>

      <main className="app-main" id="contenido" tabIndex={-1}>
        {states.error && (
          <p className="error" role="alert">
            {states.error}
          </p>
        )}
        {states.data && !['metodologia', 'privacidad', 'uso'].includes(page) && (
          <div className="workspace">
            <StateSexSelector
              states={states.data}
              stateCode={stateCode}
              sex={sex}
              onStateChange={setStateCode}
              onSexChange={setSex}
            />
            <div className="workspace-view">
              {page === 'tabla' && <LifeTableView stateCode={stateCode} sex={sex} />}
              {page === 'curva' && <MortalityCurveView stateCode={stateCode} sex={sex} />}
              {page === 'prima' && <PremiumCalculator stateCode={stateCode} sex={sex} />}
            </div>
          </div>
        )}
        {page === 'metodologia' && <MethodologyNotes />}
        {page === 'privacidad' && <SitePolicies page="privacidad" />}
        {page === 'uso' && <SitePolicies page="uso" />}
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>Herramienta educativa sobre mortalidad poblacional. No es una cotización de seguro.</p>
          <nav aria-label="Información legal">
            <a href="#/privacidad">Privacidad y cookies</a>
            <a href="#/uso">Condiciones de uso</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
