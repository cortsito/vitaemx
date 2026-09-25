import { useMemo, useRef, useState } from 'react'

import { api } from '../api/client'
import type { CurvePoint, Sex } from '../api/types'
import { fmt } from '../format'
import { useLoad } from '../hooks'

interface Props {
  stateCode: number
  sex: Sex
}

// A line + area chart of log10(mu_x) vs age: raw CONAPO series and the fitted
// Gompertz-Makeham curve, with a hover crosshair reading both series at once.
function CurveChart({
  points,
  ageMin,
  ageMax,
}: {
  points: CurvePoint[]
  ageMin: number
  ageMax: number
}) {
  const width = 720
  const height = 360
  const pad = { left: 52, right: 16, top: 16, bottom: 36 }
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const raw = points.filter((p) => p.mu_raw !== null && p.mu_raw > 0)
  const logs = [
    ...raw.map((p) => Math.log10(p.mu_raw as number)),
    ...points.map((p) => Math.log10(p.mu_fitted)),
  ]
  const yMin = Math.floor(Math.min(...logs))
  const yMax = Math.ceil(Math.max(...logs))
  const xMax = points[points.length - 1].age

  const x = (age: number) => pad.left + (age / xMax) * (width - pad.left - pad.right)
  const y = (log: number) =>
    pad.top + ((yMax - log) / (yMax - yMin)) * (height - pad.top - pad.bottom)
  const baseline = pad.top + (height - pad.top - pad.bottom)

  const linePath = (pts: { age: number; v: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.age).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')

  const fittedSeries = points.map((p) => ({ age: p.age, v: Math.log10(p.mu_fitted) }))
  const areaPath = `${linePath(fittedSeries)} L${x(fittedSeries[fittedSeries.length - 1].age).toFixed(1)},${baseline.toFixed(1)} L${x(fittedSeries[0].age).toFixed(1)},${baseline.toFixed(1)} Z`

  const yTicks = []
  for (let t = yMin; t <= yMax; t++) yTicks.push(t)
  const xTicks = [0, 20, 40, 60, 80, 100].filter((t) => t <= xMax)

  const hovered = hoverIndex === null ? null : points[hoverIndex]

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relX = ((event.clientX - rect.left) / rect.width) * width
    const age = Math.round(((relX - pad.left) / (width - pad.left - pad.right)) * xMax)
    const clamped = Math.max(0, Math.min(points.length - 1, age))
    setHoverIndex(clamped)
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    const current = hoverIndex ?? 0
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setHoverIndex(Math.min(points.length - 1, current + 1))
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setHoverIndex(Math.max(0, current - 1))
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setHoverIndex(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setHoverIndex(points.length - 1)
    }
  }

  return (
    <div className="chart-frame">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        tabIndex={0}
        aria-labelledby="mortality-chart-title mortality-chart-description"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        onFocus={() => setHoverIndex((index) => index ?? 0)}
        onKeyDown={handleKeyDown}
      >
        <title id="mortality-chart-title">Mortalidad observada y curva Gompertz-Makeham</title>
        <desc id="mortality-chart-description">
          Comparación entre la mortalidad observada por CONAPO y la curva ajustada. Usa las flechas
          para inspeccionar una edad; la tabla de valores debajo ofrece el detalle completo.
        </desc>
        <defs>
          <linearGradient id="fitted-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-fitted)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--chart-fitted)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Fit window */}
        <rect
          x={x(ageMin)}
          y={pad.top}
          width={x(ageMax) - x(ageMin)}
          height={height - pad.top - pad.bottom}
          fill="var(--blue-wash)"
        />

        {/* Gridlines: hairline, recessive */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text
              x={pad.left - 8}
              y={y(t) + 4}
              fontSize="11"
              fill="var(--ink-muted)"
              textAnchor="end"
            >
              1e{t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={height - 12}
            fontSize="11"
            fill="var(--ink-muted)"
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        {/* Fitted curve: area wash + line */}
        <path d={areaPath} fill="url(#fitted-area)" stroke="none" />
        <path
          d={linePath(fittedSeries)}
          className="curve-line curve-line--fitted"
          fill="none"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Observed CONAPO series */}
        <path
          d={linePath(raw.map((p) => ({ age: p.age, v: Math.log10(p.mu_raw as number) })))}
          className="curve-line curve-line--observed"
          fill="none"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover crosshair */}
        {hovered && (
          <g>
            <line
              x1={x(hovered.age)}
              x2={x(hovered.age)}
              y1={pad.top}
              y2={baseline}
              stroke="var(--ink-faint)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hovered.age)}
              cy={y(Math.log10(hovered.mu_fitted))}
              r="4"
              className="curve-point curve-point--fitted"
              stroke="var(--surface)"
              strokeWidth="2"
            />
            {hovered.mu_raw !== null && (
              <circle
                cx={x(hovered.age)}
                cy={y(Math.log10(hovered.mu_raw))}
                r="4"
                className="curve-point curve-point--observed"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            )}
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(x(hovered.age) / width) * 100}%`,
            top: `${(y(Math.log10(hovered.mu_fitted)) / height) * 100}%`,
          }}
        >
          <strong>Edad {hovered.age}</strong>
          {hovered.mu_raw !== null && (
            <div className="row">
              <span className="dot dot--observed" />
              CONAPO: {fmt.sci(hovered.mu_raw)}
            </div>
          )}
          <div className="row">
            <span className="dot dot--fitted" />
            Ajustada: {fmt.sci(hovered.mu_fitted)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MortalityCurveView({ stateCode, sex }: Props) {
  const { data, error, loading } = useLoad(
    () => api.mortalityCurve(stateCode, sex),
    [stateCode, sex],
  )

  const summary = useMemo(() => {
    if (!data) return null
    const p = data.parameters
    return { p }
  }, [data])

  if (error)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  if (loading || !data || !summary)
    return (
      <p className="loading" role="status">
        Cargando curva…
      </p>
    )

  const p = summary.p
  return (
    <article className="view curve-view" aria-labelledby="view-title">
      <header className="view-header">
        <p className="eyebrow">Ajuste actuarial · {data.state.name}</p>
        <h1 className="view-title" id="view-title" tabIndex={-1}>
          Una ley para describir el riesgo.
        </h1>
        <p className="view-lede">
          μ(x) = A + B·cˣ, ajustada por mínimos cuadrados sobre log μx en edades {p.age_min}–
          {p.age_max} (zona sombreada).
        </p>
      </header>
      <section className="chart-section" aria-labelledby="curve-chart-title">
        <div className="chart-section__heading">
          <div>
            <p className="eyebrow">Comparación</p>
            <h2 id="curve-chart-title">Mortalidad observada y ajustada</h2>
          </div>
          <p>Escala logarítmica</p>
        </div>
        <div className="chart-legend">
          <span className="item">
            <span className="swatch swatch--observed" />
            CONAPO (μx observada)
          </span>
          <span className="item">
            <span className="swatch swatch--fitted" />
            Gompertz-Makeham (ajuste)
          </span>
        </div>
        <CurveChart points={data.points} ageMin={p.age_min} ageMax={p.age_max} />
      </section>
      <dl className="metric-grid curve-metrics" aria-label="Parámetros del ajuste">
        <div className="metric">
          <dt>A</dt>
          <dd className="metric__value">{fmt.sci(p.A)}</dd>
        </div>
        <div className="metric">
          <dt>B</dt>
          <dd className="metric__value">{fmt.sci(p.B)}</dd>
        </div>
        <div className="metric">
          <dt>c</dt>
          <dd className="metric__value">{fmt.fixed(p.c, 5)}</dd>
        </div>
        <div className="metric metric--primary">
          <dt>R² (log μx)</dt>
          <dd className="metric__value">{fmt.fixed(p.r2_log_mu, 4)}</dd>
        </div>
        <div className="metric">
          <dt>RMSE (log μx)</dt>
          <dd className="metric__value">{fmt.fixed(p.rmse_log_mu, 4)}</dd>
        </div>
      </dl>
      <p className="note">
        Eje vertical en escala logarítmica. Fuera de la ventana de ajuste la aplicación usa los
        valores CONAPO sin suavizar; la mortalidad infantil y la de edades muy avanzadas se apartan
        de la ley Gompertz-Makeham y se excluyen del ajuste deliberadamente.
      </p>
      <section className="data-section" aria-labelledby="curve-table-title">
        <div className="data-section__heading">
          <div>
            <p className="eyebrow">Detalle</p>
            <h2 id="curve-table-title">Valores por edad</h2>
          </div>
          <p>{data.points.length} observaciones</p>
        </div>
        <div className="table-wrap" aria-label="Valores de la curva de mortalidad">
          <div className="scroll" tabIndex={0}>
            <table aria-label="Valores de la curva de mortalidad">
              <thead>
                <tr>
                  <th scope="col">Edad</th>
                  <th scope="col">μx CONAPO</th>
                  <th scope="col">μx ajustada</th>
                  <th scope="col">qx CONAPO</th>
                  <th scope="col">qx ajustada</th>
                  <th scope="col">Residual log μx</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((pt) => (
                  <tr key={pt.age}>
                    <td>{pt.age}</td>
                    <td>{pt.mu_raw === null ? '—' : fmt.prob(pt.mu_raw)}</td>
                    <td>{fmt.prob(pt.mu_fitted)}</td>
                    <td>{fmt.prob(pt.qx_raw)}</td>
                    <td>{fmt.prob(pt.qx_fitted)}</td>
                    <td>
                      {pt.mu_raw === null || pt.qx_source === 'raw'
                        ? '—'
                        : fmt.fixed(Math.log(pt.mu_raw) - Math.log(pt.mu_fitted), 4)}
                    </td>
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
