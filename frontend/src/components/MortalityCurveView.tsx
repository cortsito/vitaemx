import { api } from '../api/client'
import type { CurvePoint, Sex } from '../api/types'
import { fmt } from '../format'
import { useLoad } from '../hooks'

interface Props {
  stateCode: number
  sex: Sex
}

// A plain SVG line chart of log10(mu_x) vs age: raw CONAPO series and fitted curve.
function CurveChart({
  points,
  ageMin,
  ageMax,
}: {
  points: CurvePoint[]
  ageMin: number
  ageMax: number
}) {
  const width = 640
  const height = 320
  const pad = { left: 48, right: 12, top: 12, bottom: 32 }

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
  const path = (pts: { age: number; v: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.age).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')

  const yTicks = []
  for (let t = yMin; t <= yMax; t++) yTicks.push(t)
  const xTicks = [0, 20, 40, 60, 80, 100]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <rect
        x={x(ageMin)}
        y={pad.top}
        width={x(ageMax) - x(ageMin)}
        height={height - pad.top - pad.bottom}
        fill="#eee"
      />
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#ddd" />
          <text x={pad.left - 6} y={y(t) + 4} fontSize="11" textAnchor="end">
            1e{t}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={t} x={x(t)} y={height - 10} fontSize="11" textAnchor="middle">
          {t}
        </text>
      ))}
      <path
        d={path(raw.map((p) => ({ age: p.age, v: Math.log10(p.mu_raw as number) })))}
        fill="none"
        stroke="#1a3c6e"
        strokeWidth="1.5"
      />
      <path
        d={path(points.map((p) => ({ age: p.age, v: Math.log10(p.mu_fitted) })))}
        fill="none"
        stroke="#a00"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x={pad.left + 8} y={pad.top + 14} fontSize="11" fill="#1a3c6e">
        CONAPO (μx observada)
      </text>
      <text x={pad.left + 8} y={pad.top + 28} fontSize="11" fill="#a00">
        Gompertz-Makeham (ajuste)
      </text>
    </svg>
  )
}

export default function MortalityCurveView({ stateCode, sex }: Props) {
  const { data, error, loading } = useLoad(
    () => api.mortalityCurve(stateCode, sex),
    [stateCode, sex],
  )

  if (error) return <p className="error">{error}</p>
  if (loading || !data) return <p>Cargando…</p>

  const p = data.parameters
  return (
    <div>
      <p className="title">Curva de mortalidad — {data.state.name}</p>
      <p>
        μ(x) = A + B·cˣ con A = {fmt.sci(p.A)}, B = {fmt.sci(p.B)}, c = {fmt.fixed(p.c, 5)}.
        Ajustada por mínimos cuadrados sobre log μx en edades {p.age_min}–{p.age_max} (zona gris).
        R² (log μx) = {fmt.fixed(p.r2_log_mu, 4)}, RMSE (log μx) = {fmt.fixed(p.rmse_log_mu, 4)}.
      </p>
      <p className="muted">
        Eje vertical en escala logarítmica. Fuera de la ventana de ajuste la aplicación usa los
        valores CONAPO sin suavizar; la mortalidad infantil y la de edades muy avanzadas se apartan
        de la ley Gompertz-Makeham y se excluyen del ajuste deliberadamente.
      </p>
      <CurveChart points={data.points} ageMin={p.age_min} ageMax={p.age_max} />
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
  )
}
