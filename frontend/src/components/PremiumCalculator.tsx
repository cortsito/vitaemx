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
    <div>
      <div className="card">
        <p className="section-title">Prima neta simplificada</p>
        <p className="section-lede">
          Prima de riesgo pura: sin gastos, sin recargo de utilidad, sin caducidad y sin selección
          médica. No es lo que cobraría una aseguradora real. Ver{' '}
          <a href="#/metodologia">metodología, §3 y §4</a>.
        </p>
        <form onSubmit={calculate}>
          <div className="controls">
            <label className="field">
              Edad
              <input
                type="number"
                min={0}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Producto
              <select value={product} onChange={(e) => setProduct(e.target.value as Product)}>
                <option value="term">Temporal (n años)</option>
                <option value="whole_life">Vida entera</option>
              </select>
            </label>
            <label className="field">
              Plazo (años)
              <input
                type="number"
                min={1}
                max={60}
                value={term}
                disabled={product === 'whole_life'}
                onChange={(e) => setTerm(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Tasa de interés anual (%)
              <input
                type="number"
                min={0}
                max={30}
                step={0.25}
                value={interest}
                onChange={(e) => setInterest(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Suma asegurada (MXN)
              <input
                type="number"
                min={0}
                step={1000}
                value={sumAssured}
                onChange={(e) => setSumAssured(Number(e.target.value))}
              />
            </label>
            <button type="submit" disabled={busy}>
              Calcular
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      {result && (
        <div className="card">
          <div className="stat-grid">
            <div className="stat-tile accent">
              <p className="label">Prima neta única</p>
              <p className="value">{fmt.money(result.net_single_premium)}</p>
            </div>
            <div className="stat-tile accent">
              <p className="label">Prima anual nivelada</p>
              <p className="value">{fmt.money(result.annual_premium)}</p>
            </div>
            <div className="stat-tile">
              <p className="label">Esperanza de vida a esa edad</p>
              <p className="value">
                {fmt.fixed(result.life_expectancy_at_age, 2)} <span className="unit">años</span>
              </p>
            </div>
          </div>
          <table className="kv" style={{ marginTop: 18 }}>
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
          <p className="muted" style={{ marginTop: 10 }}>
            Base de mortalidad: {result.mortality_basis}.
          </p>
          <p className="muted">Limitaciones: {result.limitations.join(' ')}</p>
        </div>
      )}
    </div>
  )
}
