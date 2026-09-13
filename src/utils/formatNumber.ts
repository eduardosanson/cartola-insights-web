const EM_DASH = '—'

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

type Value = number | null | undefined

function isAbsent(value: Value): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value)
}

export function formatNumber(value: Value): string {
  return isAbsent(value) ? EM_DASH : numberFormatter.format(value)
}

export function formatCurrency(value: Value): string {
  return isAbsent(value) ? EM_DASH : `C$ ${currencyFormatter.format(value)}`
}

export function formatPercent(value: Value): string {
  return isAbsent(value) ? EM_DASH : `${percentFormatter.format(value)}%`
}

export function formatInteger(value: Value): string {
  return isAbsent(value) ? EM_DASH : integerFormatter.format(value)
}

const decimalFormatters = new Map<number, Intl.NumberFormat>()

function getDecimalFormatter(decimals: number): Intl.NumberFormat {
  let formatter = decimalFormatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    decimalFormatters.set(decimals, formatter)
  }
  return formatter
}

export function formatDecimal(value: Value, decimals = 1): string {
  if (isAbsent(value)) return EM_DASH
  return getDecimalFormatter(decimals).format(value)
}
