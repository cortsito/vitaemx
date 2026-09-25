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
    <div className="card filter-bar">
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
    </div>
  )
}
