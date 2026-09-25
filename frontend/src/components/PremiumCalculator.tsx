import { useState } from 'react'

import { api } from '../api/client'
import type { PremiumResult, Product, Sex } from '../api/types'
import { fmt } from '../format'

interface Props {
  stateCode: number
  sex: Sex
}

export default function PremiumCalculator({ stateCode, sex }: Props) {
  const [age, setAge] = useState(35)
  const [product, setProduct] = useState<Product>('term')
  const [term, setTerm] = useState(20)
  const [interest, setInterest] = useState(5)
  const [sumAssured, setSumAssured] = useState(1_000_000)
  const [result, setResult] = useState<PremiumResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function calculate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setResult(
        await api.premium({
          state_code: stateCode,
          sex,
          age,
          product,
          term,
          interest_rate: interest / 100,
          sum_assured: sumAssured,
        }),
      )
    } catch (e) {
      setResult(null)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="view premium-view" aria-labelledby="view-title">
      <header className="view-header">
        <p className="eyebrow">Cálculo actuarial</p>
        <h1 className="view-title" id="view-title" tabIndex={-1}>
          Estima una prima neta.
        </h1>
        <p className="view-lede">
          Prima de riesgo pura: sin gastos, sin recargo de utilidad, sin caducidad y sin selección
          médica. No es lo que cobraría una aseguradora real. Ver{' '}
          <a href="#/metodologia">metodología, §3 y §4</a>.
        </p>
      </header>
      <section className="calculator-panel" aria-labelledby="calculator-title" aria-busy={busy}>
        <div className="calculator-panel__heading">
          <div>
            <p className="eyebrow">Hipótesis</p>
            <h2 id="calculator-title">Define el producto</h2>
          </div>
          <p>Valores nominales en MXN</p>
        </div>
        <form onSubmit={calculate}>
          <div className="controls">
            <label className="field age-field">
              Edad
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </label>
            <label className="field product-field">
              Producto
              <select value={product} onChange={(e) => setProduct(e.target.value as Product)}>
                <option value="term">Temporal (n años)</option>
                <option value="whole_life">Vida entera</option>
              </select>
            </label>
            <label className="field term-field">
              Plazo (años)
              <input
                type="number"
                min={1}
                max={60}
                inputMode="numeric"
                required
                value={term}
                disabled={product === 'whole_life'}
                aria-describedby="term-help"
                onChange={(e) => setTerm(Number(e.target.value))}
              />
              <span className="field-hint" id="term-help">
                {product === 'whole_life' ? 'No aplica para vida entera.' : 'De 1 a 60 años.'}
              </span>
            </label>
            <label className="field interest-field">
              Tasa de interés anual (%)
              <input
                type="number"
                min={0}
                max={30}
                step={0.25}
                inputMode="decimal"
                required
                value={interest}
                onChange={(e) => setInterest(Number(e.target.value))}
              />
            </label>
            <label className="field sum-field">
              Suma asegurada (MXN)
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                required
                value={sumAssured}
                onChange={(e) => setSumAssured(Number(e.target.value))}
              />
            </label>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Calculando…' : 'Calcular prima'}
            </button>
          </div>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section className="result-section" aria-labelledby="result-title" aria-live="polite">
          <div className="result-section__heading">
            <div>
              <p className="eyebrow">Resultado</p>
              <h2 id="result-title">El costo esperado del riesgo</h2>
            </div>
            <p>Con las condiciones elegidas y la base de mortalidad seleccionada.</p>
          </div>
          <dl className="metric-grid premium-metrics" aria-label="Resultados de prima">
            <div className="metric metric--primary">
              <dt>Prima neta única</dt>
              <dd className="metric__value">{fmt.money(result.net_single_premium)}</dd>
            </div>
            <div className="metric metric--primary">
              <dt>Prima anual nivelada</dt>
              <dd className="metric__value">{fmt.money(result.annual_premium)}</dd>
            </div>
            <div className="metric">
              <dt>Esperanza de vida a esa edad</dt>
              <dd className="metric__value">
                {fmt.fixed(result.life_expectancy_at_age, 2)} <span className="unit">años</span>
              </dd>
            </div>
          </dl>
          <table className="kv detail-table">
            <tbody>
              <tr>
                <td>Prima neta única (por unidad de suma asegurada)</td>
                <td>{fmt.prob(result.net_single_premium_per_unit)}</td>
              </tr>
              <tr>
                <td>Factor de anualidad anticipada (ä)</td>
                <td>{fmt.fixed(result.annuity_due_factor, 4)}</td>
              </tr>
              <tr>
                <td>Prima anual nivelada (por unidad)</td>
                <td>{fmt.prob(result.annual_premium_per_unit)}</td>
              </tr>
              <tr>
                <td>Prima anual por cada 1,000 de suma asegurada</td>
                <td>{fmt.fixed(result.annual_premium_per_1000, 2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="muted detail-note">Base de mortalidad: {result.mortality_basis}.</p>
          <p className="muted">Limitaciones: {result.limitations.join(' ')}</p>
        </section>
      )}
    </article>
  )
}
