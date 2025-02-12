export function getUTCTimestamp() {
  const now = new Date()

  const YYYY = now.getUTCFullYear()
  const MM = String(now.getUTCMonth() + 1).padStart(2, '0') // Months are zero-based
  const DD = String(now.getUTCDate()).padStart(2, '0')
  const HH = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const SS = String(now.getUTCSeconds()).padStart(2, '0')

  return `${YYYY}${MM}${DD}-${HH}${mm}${SS}`
}
