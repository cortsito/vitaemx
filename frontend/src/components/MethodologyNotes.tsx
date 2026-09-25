import { api } from '../api/client'
import { fmt } from '../format'
import { useLoad } from '../hooks'

const REPO = 'https://github.com/cortsito/vitaemx/blob/main'

export default function MethodologyNotes() {
  const version = useLoad(() => api.methodologyVersion(), [])
  const validation = useLoad(() => api.validation(), [])

  return (
    <div>
      <p className="title">Metodología</p>
      <p>
        Cada número de esta aplicación se puede rastrear hasta una fórmula y un supuesto declarado.
        El documento completo está en el repositorio:{' '}
        <a href={`${REPO}/docs/methodology.md`}>METHODOLOGY.md</a>, con las fuentes de datos en{' '}
        <a href={`${REPO}/docs/data-sources.md`}>DATA_SOURCES.md</a> y las decisiones de diseño en{' '}
        <a href={`${REPO}/docs/`}>docs/</a>.
      </p>
      <p>
        <strong>1. Tablas de vida.</strong> qx se obtiene de las defunciones y la población a mitad
        de año proyectadas por CONAPO, por edad simple, sexo y entidad: mx = D/P, qx = mx / (1 + (1
        − ax)·mx), con ax = 0.5 (0.1 a edad 0). lx, dx, Lx, Tx y ex siguen la recursión estándar con
        l₀ = 100,000. La última edad con exposición se cierra como intervalo abierto.
      </p>
      <p>
        <strong>2. Gompertz-Makeham.</strong> μ(x) = A + B·cˣ se ajusta por mínimos cuadrados no
        lineales sobre log μx, con μx = −ln(1 − qx), en edades 30–90. Fuera de esa ventana se usan
        los valores CONAPO sin suavizar y la aplicación lo indica en cada fila.
      </p>
      <p>
        <strong>3. Primas.</strong> Prima neta única temporal A¹ₓ:ₙ = Σ v^(k+1) · ₖ|qₓ (k = 0…n−1),
        vida entera hasta el final de la tabla, y prima anual nivelada = prima única / äₓ (o äₓ:ₙ),
        todo con v = 1/(1+i) y la serie lx reconstruida a partir de la qx ajustada.
      </p>
      <p>
        <strong>4. Limitaciones.</strong> Sin efectos de selección, sin estratificación
        socioeconómica, tasa de interés plana, sin gastos ni caducidad ni utilidad. Herramienta
        educativa sobre mortalidad poblacional, no un motor de tarificación real.
      </p>

      <p className="title">Versión de datos servida</p>
      {version.error && <p className="error">{version.error}</p>}
      {version.data && (
        <table className="kv">
          <tbody>
            <tr>
              <td>Fuente</td>
              <td>{version.data.data_source}</td>
            </tr>
            <tr>
              <td>Año de referencia</td>
              <td>{version.data.reference_year}</td>
            </tr>
            <tr>
              <td>Versión de metodología</td>
              <td>{version.data.methodology_version}</td>
            </tr>
            <tr>
              <td>Procesado el</td>
              <td>{version.data.processed_on}</td>
            </tr>
            <tr>
              <td>Ventana de ajuste</td>
              <td>
                {version.data.gompertz_makeham.fit_age_min}–
                {version.data.gompertz_makeham.fit_age_max}
              </td>
            </tr>
            <tr>
              <td>Notebooks</td>
              <td>{version.data.produced_by.join(', ')}</td>
            </tr>
            {version.data.raw_files.map((f) => (
              <tr key={f.file}>
                <td>{f.file}</td>
                <td>sha256 {f.sha256.slice(0, 16)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="title">Validación: esperanza de vida al nacer</p>
      <p className="muted">
        e₀ reconstruida por VitaeMX frente a la publicada por CONAPO para el mismo año, por entidad
        y sexo. Diferencias en años.
      </p>
      {validation.error && <p className="error">{validation.error}</p>}
      {validation.data && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Entidad</th>
                <th>Sexo</th>
                <th>e₀ VitaeMX</th>
                <th>e₀ CONAPO</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {validation.data.map((r) => (
                <tr key={`${r.state.code}-${r.sex}`}>
                  <td>{r.state.name}</td>
                  <td>{r.sex}</td>
                  <td>{fmt.fixed(r.e0_vitaemx, 2)}</td>
                  <td>{fmt.fixed(r.e0_conapo, 2)}</td>
                  <td>{fmt.fixed(r.difference_years, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
