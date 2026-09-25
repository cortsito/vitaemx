const es = 'es-MX'

export const fmt = {
  int: (n: number) => n.toLocaleString(es, { maximumFractionDigits: 0 }),
  fixed: (n: number, digits: number) =>
    n.toLocaleString(es, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  prob: (n: number) => n.toFixed(6),
  money: (n: number) => n.toLocaleString(es, { style: 'currency', currency: 'MXN' }),
  sci: (n: number) => n.toExponential(3),
}
