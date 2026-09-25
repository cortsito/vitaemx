import { useMemo, useRef, useState } from 'react'

import { api } from '../api/client'
import type { CurvePoint, Sex } from '../api/types'
import { fmt } from '../format'
import { useLoad } from '../hooks'

interface Props {
  stateCode: number
  sex: Sex
}

const COLOR_OBSERVED = '#2f6fb0'
const COLOR_FITTED = '#c1440e'

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

  return (
    <div className="chart-frame">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="fitted-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR_FITTED} stopOpacity="0.16" />
            <stop offset="100%" stopColor={COLOR_FITTED} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Fit window */}
        <rect
          x={x(ageMin)}
          y={pad.top}
          width={x(ageMax) - x(ageMin)}
          height={height - pad.top - pad.bottom}
          fill="var(--navy-100, #e8eef6)"
        />

        {/* Gridlines: hairline, recessive */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e1e5eb" />
            <text x={pad.left - 8} y={y(t) + 4} fontSize="11" fill="#5b6470" textAnchor="end">
              1e{t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={height - 12} fontSize="11" fill="#5b6470" textAnchor="middle">
            {t}
          </text>
        ))}

        {/* Fitted curve: area wash + line */}
        <path d={areaPath} fill="url(#fitted-area)" stroke="none" />
        <path
          d={linePath(fittedSeries)}
          fill="none"
          stroke={COLOR_FITTED}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Observed CONAPO series */}
        <path
          d={linePath(raw.map((p) => ({ age: p.age, v: Math.log10(p.mu_raw as number) })))}
          fill="none"
          stroke={COLOR_OBSERVED}
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
              stroke="#8992a0"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hovered.age)}
              cy={y(Math.log10(hovered.mu_fitted))}
              r="4"
              fill={COLOR_FITTED}
              stroke="#fcfcfb"
              strokeWidth="2"
            />
            {hovered.mu_raw !== null && (
              <circle
                cx={x(hovered.age)}
                cy={y(Math.log10(hovered.mu_raw))}
                r="4"
                fill={COLOR_OBSERVED}
                stroke="#fcfcfb"
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
              <span className="dot" style={{ background: COLOR_OBSERVED }} />
              CONAPO: {fmt.sci(hovered.mu_raw)}
            </div>
          )}
          <div className="row">
            <span className="dot" style={{ background: COLOR_FITTED }} />
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

  if (error) return <p className="error">{error}</p>
  if (loading || !data || !summary) return <p>Cargando…</p>

  const p = summary.p
  return (
    <div>
      <div className="card chart-card">
        <p className="section-title">Curva de mortalidad — {data.state.name}</p>
        <p className="section-lede">
          μ(x) = A + B·cˣ, ajustada por mínimos cuadrados sobre log μx en edades {p.age_min}–
          {p.age_max} (zona sombreada).
        </p>
        <div className="chart-legend">
          <span className="item">
            <span className="swatch" style={{ background: COLOR_OBSERVED }} />
            CONAPO (μx observada)
          </span>
          <span className="item">
            <span className="swatch" style={{ background: COLOR_FITTED }} />
            Gompertz-Makeham (ajuste)
          </span>
        </div>
        <CurveChart points={data.points} ageMin={p.age_min} ageMax={p.age_max} />
        <div className="stat-grid">
          <div className="stat-tile">
            <p className="label">A</p>
            <p className="value">{fmt.sci(p.A)}</p>
          </div>
          <div className="stat-tile">
            <p className="label">B</p>
            <p className="value">{fmt.sci(p.B)}</p>
          </div>
          <div className="stat-tile">
            <p className="label">c</p>
            <p className="value">{fmt.fixed(p.c, 5)}</p>
          </div>
          <div className="stat-tile accent">
            <p className="label">R² (log μx)</p>
            <p className="value">{fmt.fixed(p.r2_log_mu, 4)}</p>
          </div>
          <div className="stat-tile">
            <p className="label">RMSE (log μx)</p>
            <p className="value">{fmt.fixed(p.rmse_log_mu, 4)}</p>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          Eje vertical en escala logarítmica. Fuera de la ventana de ajuste la aplicación usa los
          valores CONAPO sin suavizar; la mortalidad infantil y la de edades muy avanzadas se
          apartan de la ley Gompertz-Makeham y se excluyen del ajuste deliberadamente.
        </p>
      </div>
      <div className="table-wrap">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Edad</th>
                <th>μx CONAPO</th>
                <th>μx ajustada</th>
                <th>qx CONAPO</th>
                <th>qx ajustada</th>
                <th>Residual log μx</th>
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
    </div>
  )
}
