import { api } from '../api/client'
import { fmt } from '../format'
import { useLoad } from '../hooks'

const REPO = 'https://github.com/cortsito/vitaemx/blob/main'

export default function MethodologyNotes() {
  const version = useLoad(() => api.methodologyVersion(), [])
  const validation = useLoad(() => api.validation(), [])

  return (
    <article className="methodology" aria-labelledby="view-title">
      <header className="methodology__intro">
        <p className="eyebrow">Trazabilidad</p>
        <h1 className="view-title" id="view-title" tabIndex={-1}>
          Cada resultado tiene un supuesto detrás.
        </h1>
        <p className="view-lede">
          Esta aplicación expone la tabla, el ajuste y las limitaciones que sostienen cada cálculo.
        </p>
        <p className="methodology__links">
          <a href={`${REPO}/docs/methodology.md`}>Metodología completa</a>
          <a href={`${REPO}/docs/data-sources.md`}>Fuentes de datos</a>
          <a href={`${REPO}/docs/`}>Decisiones de diseño</a>
        </p>
      </header>

      <div className="methodology__body">
        <section className="method-block" aria-labelledby="tables-method-title">
          <p className="eyebrow">01 · Tablas de vida</p>
          <h2 id="tables-method-title">De defunciones proyectadas a supervivencia.</h2>
          <p>
            qx se obtiene de las defunciones y la población a mitad de año proyectadas por CONAPO,
            por edad simple, sexo y entidad: mx = D/P, qx = mx / (1 + (1 − ax)·mx), con ax = 0.5
            (0.1 a edad 0). lx, dx, Lx, Tx y ex siguen la recursión estándar con l₀ = 100,000. La
            última edad con exposición se cierra como intervalo abierto.
          </p>
        </section>

        <section className="method-block" aria-labelledby="fit-method-title">
          <p className="eyebrow">02 · Gompertz-Makeham</p>
          <h2 id="fit-method-title">Un ajuste donde el modelo aporta claridad.</h2>
          <p>
            μ(x) = A + B·cˣ se ajusta por mínimos cuadrados no lineales sobre log μx, con μx = −ln(1
            − qx), en edades 30–90. Fuera de esa ventana se usan los valores CONAPO sin suavizar y
            la aplicación lo indica en cada fila.
          </p>
        </section>

        <section className="method-block" aria-labelledby="premium-method-title">
          <p className="eyebrow">03 · Primas</p>
          <h2 id="premium-method-title">Valor presente esperado, sin cargos comerciales.</h2>
          <p>
            La prima neta única temporal A¹ₓ:ₙ = Σ v^(k+1) · ₖ|qₓ (k = 0…n−1). Para vida entera se
            proyecta hasta el final de la tabla y la prima anual nivelada se obtiene al dividir
            entre äₓ (o äₓ:ₙ), con v = 1/(1+i).
          </p>
        </section>

        <section className="method-block method-block--limit" aria-labelledby="limits-method-title">
          <p className="eyebrow">04 · Límites</p>
          <h2 id="limits-method-title">Una herramienta educativa, no una cotización.</h2>
          <p>
            No incorpora selección médica, estratificación socioeconómica, gastos, caducidad,
            utilidad ni una curva de tasas. Describe mortalidad poblacional; no sustituye la
            tarificación de una aseguradora.
          </p>
        </section>

        <section className="evidence-section" aria-labelledby="version-title">
          <div className="evidence-section__heading">
            <p className="eyebrow">Datos servidos</p>
            <h2 id="version-title">Versión y validación</h2>
          </div>
          <div className="evidence-grid">
            <section className="evidence-card" aria-labelledby="data-version-title">
              <h3 id="data-version-title">Versión de datos</h3>
              {version.error && (
                <p className="error" role="alert">
                  {version.error}
                </p>
              )}
              {version.data && (
                <table className="kv" aria-label="Versión de datos servida">
                  <tbody>
                    <tr>
                      <th scope="row">Fuente</th>
                      <td>{version.data.data_source}</td>
                    </tr>
                    <tr>
                      <th scope="row">Año de referencia</th>
                      <td>{version.data.reference_year}</td>
                    </tr>
                    <tr>
                      <th scope="row">Versión de metodología</th>
                      <td>{version.data.methodology_version}</td>
                    </tr>
                    <tr>
                      <th scope="row">Procesado el</th>
                      <td>{version.data.processed_on}</td>
                    </tr>
                    <tr>
                      <th scope="row">Ventana de ajuste</th>
                      <td>
                        {version.data.gompertz_makeham.fit_age_min}–
                        {version.data.gompertz_makeham.fit_age_max}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Notebooks</th>
                      <td>{version.data.produced_by.join(', ')}</td>
                    </tr>
                    {version.data.raw_files.map((file) => (
                      <tr key={file.file}>
                        <th scope="row">{file.file}</th>
                        <td>sha256 {file.sha256.slice(0, 16)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="evidence-card" aria-labelledby="validation-title">
              <h3 id="validation-title">Esperanza de vida al nacer</h3>
              <p className="muted">
                e₀ reconstruida por VitaeMX frente a la publicada por CONAPO para el mismo año, por
                entidad y sexo. Diferencias en años.
              </p>
              {validation.error && (
                <p className="error" role="alert">
                  {validation.error}
                </p>
              )}
              {validation.data && (
                <div
                  className="validation-list"
                  role="list"
                  aria-label="Validación por entidad y sexo"
                >
                  {validation.data.map((r) => (
                    <article
                      className="validation-row"
                      role="listitem"
                      key={`${r.state.code}-${r.sex}`}
                    >
                      <div className="validation-row__population">
                        <p>{r.state.name}</p>
                        <span>{r.sex}</span>
                      </div>
                      <dl>
                        <div>
                          <dt>e₀ VitaeMX</dt>
                          <dd>{fmt.fixed(r.e0_vitaemx, 2)}</dd>
                        </div>
                        <div>
                          <dt>e₀ CONAPO</dt>
                          <dd>{fmt.fixed(r.e0_conapo, 2)}</dd>
                        </div>
                        <div>
                          <dt>Diferencia</dt>
                          <dd>{fmt.fixed(r.difference_years, 2)}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </article>
  )
}
