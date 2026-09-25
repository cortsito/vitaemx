import { api } from '../api/client'
import type { Sex } from '../api/types'
import { fmt } from '../format'
import { useLoad } from '../hooks'

interface Props {
  stateCode: number
  sex: Sex
}

export default function LifeTableView({ stateCode, sex }: Props) {
  const { data, error, loading } = useLoad(() => api.lifeTable(stateCode, sex), [stateCode, sex])

  if (error) return <p className="error">{error}</p>
  if (loading || !data) return <p>Cargando…</p>

  const e0 = data.rows[0].ex
  return (
    <div>
      <p className="title">Tabla de vida — {data.state.name}</p>
      <p>
        Esperanza de vida al nacer: <strong>{fmt.fixed(e0, 2)}</strong> años. Año de referencia{' '}
        {data.reference_year}, cohorte inicial l₀ = {fmt.int(data.radix)}.
      </p>
      <p className="muted">
        qx: probabilidad de morir entre x y x+1 · lx: sobrevivientes a edad exacta x · dx: muertes
        entre x y x+1 · Lx: años-persona vividos entre x y x+1 · Tx: años-persona vividos después de
        x · ex: esperanza de vida a edad x · qx ajustada: valor suavizado Gompertz-Makeham (edades
        30–90) o el valor CONAPO fuera de esa ventana. Ver <a href="#/metodologia">metodología</a>.
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Edad</th>
              <th>qx</th>
              <th>lx</th>
              <th>dx</th>
              <th>Lx</th>
              <th>Tx</th>
              <th>ex</th>
              <th>qx ajustada</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.age}>
                <td>{r.age}</td>
                <td>{fmt.prob(r.qx)}</td>
                <td>{fmt.int(r.lx)}</td>
                <td>{fmt.int(r.dx)}</td>
                <td>{fmt.int(r.Lx)}</td>
                <td>{fmt.int(r.Tx)}</td>
                <td>{fmt.fixed(r.ex, 2)}</td>
                <td>{fmt.prob(r.qx_fitted)}</td>
                <td>{r.qx_source === 'fitted' ? 'ajustada' : 'CONAPO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
