import type { Sex, State } from '../api/types'

interface Props {
  states: State[]
  stateCode: number
  sex: Sex
  onStateChange: (code: number) => void
  onSexChange: (sex: Sex) => void
}

const SEX_LABELS: Record<Sex, string> = { total: 'Ambos sexos', male: 'Hombres', female: 'Mujeres' }

export default function StateSexSelector({
  states,
  stateCode,
  sex,
  onStateChange,
  onSexChange,
}: Props) {
  return (
    <aside className="context-panel" aria-labelledby="context-title">
      <div className="context-panel__header">
        <span className="eyebrow" id="context-title">
          Base consultada
        </span>
        <p>Elige la población sobre la cual se construyen todos los resultados de esta vista.</p>
      </div>
      <label className="field">
        Entidad
        <select value={stateCode} onChange={(e) => onStateChange(Number(e.target.value))}>
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Sexo
        <select value={sex} onChange={(e) => onSexChange(e.target.value as Sex)}>
          {(Object.keys(SEX_LABELS) as Sex[]).map((key) => (
            <option key={key} value={key}>
              {SEX_LABELS[key]}
            </option>
          ))}
        </select>
      </label>
      <p className="context-panel__note">Proyecciones oficiales de CONAPO · 2023</p>
    </aside>
  )
}
