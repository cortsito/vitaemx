// Mirrors backend/app/schemas.py. Keep the two in sync by hand for now.

export type Sex = 'total' | 'male' | 'female'
export type Product = 'term' | 'whole_life'

export interface State {
  code: number
  name: string
}

export interface LifeTableRow {
  age: number
  mx: number | null
  qx: number
  lx: number
  dx: number
  Lx: number
  Tx: number
  ex: number
  qx_fitted: number
  qx_source: 'raw' | 'fitted'
}

export interface LifeTable {
  state: State
  sex: Sex
  reference_year: number
  radix: number
  rows: LifeTableRow[]
}

export interface GompertzMakehamParams {
  A: number
  B: number
  c: number
  r2_log_mu: number
  rmse_log_mu: number
  age_min: number
  age_max: number
}

export interface CurvePoint {
  age: number
  mu_raw: number | null
  mu_fitted: number
  qx_raw: number
  qx_fitted: number
  qx_source: 'raw' | 'fitted'
}

export interface MortalityCurve {
  state: State
  sex: Sex
  parameters: GompertzMakehamParams
  points: CurvePoint[]
}

export interface PremiumRequest {
  state_code: number
  sex: Sex
  age: number
  product: Product
  term: number
  interest_rate: number
  sum_assured: number
}

export interface PremiumResult {
  inputs: PremiumRequest
  state: State
  net_single_premium_per_unit: number
  annuity_due_factor: number
  annual_premium_per_unit: number
  net_single_premium: number
  annual_premium: number
  annual_premium_per_1000: number
  life_expectancy_at_age: number
  mortality_basis: string
  limitations: string[]
}

export interface MethodologyVersion {
  methodology_version: string
  data_source: string
  reference_year: number
  processed_on: string
  raw_files: { file: string; sha256: string }[]
  gompertz_makeham: { fit_age_min: number; fit_age_max: number; loss: string }
  life_table: { radix: number; a0: number; ax: number; closure: string }
  produced_by: string[]
}

export interface ValidationRow {
  state: State
  sex: Sex
  e0_vitaemx: number
  e0_conapo: number
  difference_years: number
}
