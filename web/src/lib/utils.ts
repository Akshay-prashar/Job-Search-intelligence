export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function formatCurrency(amount: number | string | undefined): string {
  if (!amount) return 'Not disclosed'
  return typeof amount === 'number'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    : amount
}
