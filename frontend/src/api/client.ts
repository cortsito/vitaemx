import type {
  LifeTable,
  MethodologyVersion,
  MortalityCurve,
  PremiumRequest,
  PremiumResult,
  Sex,
  State,
  ValidationRow,
} from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // keep statusText
    }
    throw new Error(`${response.status}: ${detail}`)
  }
  return response.json() as Promise<T>
}

export const api = {
  states: () => request<State[]>('/api/states'),
  lifeTable: (code: number, sex: Sex) => request<LifeTable>(`/api/life-table/${code}?sex=${sex}`),
  mortalityCurve: (code: number, sex: Sex) =>
    request<MortalityCurve>(`/api/mortality-curve/${code}?sex=${sex}`),
  premium: (body: PremiumRequest) =>
    request<PremiumResult>('/api/premium', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  methodologyVersion: () => request<MethodologyVersion>('/api/methodology-version'),
  validation: () => request<ValidationRow[]>('/api/validation'),
}
