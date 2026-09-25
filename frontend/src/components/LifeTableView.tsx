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

  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  if (loading || !data)
    return (
      <p className="loading" role="status">
        Cargando tabla de vida…
      </p>
    )

  const e0 = data.rows[0].ex
  return (
    <article className="view life-view" aria-labelledby="view-title">
      <header className="view-header">
        <p className="eyebrow">Tabla de vida · {data.state.name}</p>
        <h1 className="view-title" id="view-title" tabIndex={-1}>
          La supervivencia, edad por edad.
        </h1>
        <p className="view-lede">
          Año de referencia {data.reference_year}; una cohorte sintética de {fmt.int(data.radix)}
          personas seguida desde el nacimiento.
        </p>
      </header>

      <dl className="metric-grid" aria-label="Resumen de la tabla de vida">
        <div className="metric metric--primary">
          <dt>Esperanza de vida al nacer</dt>
          <dd className="metric__value">
            {fmt.fixed(e0, 2)} <span className="unit">años</span>
          </dd>
        </div>
        <div className="metric">
          <dt>Cohorte inicial l₀</dt>
          <dd className="metric__value">{fmt.int(data.radix)}</dd>
        </div>
        <div className="metric">
          <dt>Edades tabuladas</dt>
          <dd className="metric__value">{data.rows.length}</dd>
        </div>
      </dl>

      <p className="note">
        qx: probabilidad de morir entre x y x+1 · lx: sobrevivientes a edad exacta x · dx: muertes
        entre x y x+1 · Lx: años-persona vividos entre x y x+1 · Tx: años-persona vividos después de
        x · ex: esperanza de vida a edad x · qx ajustada: valor suavizado Gompertz-Makeham (edades
        30–90) o el valor CONAPO fuera de esa ventana. Ver <a href="#/metodologia">metodología</a>.
      </p>

      <section className="data-section" aria-labelledby="life-table-title">
        <div className="data-section__heading">
          <div>
            <p className="eyebrow">Detalle</p>
            <h2 id="life-table-title">Tabla completa</h2>
          </div>
          <p>{data.rows.length} edades</p>
        </div>
        <div className="table-wrap" aria-label="Tabla de vida detallada">
          <div className="scroll" tabIndex={0}>
            <table aria-label="Tabla de vida detallada">
              <thead>
                <tr>
                  <th scope="col">Edad</th>
                  <th scope="col">qx</th>
                  <th scope="col">lx</th>
                  <th scope="col">dx</th>
                  <th scope="col">Lx</th>
                  <th scope="col">Tx</th>
                  <th scope="col">ex</th>
                  <th scope="col">qx ajustada</th>
                  <th scope="col">Origen</th>
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
      </section>
    </article>
  )
}
