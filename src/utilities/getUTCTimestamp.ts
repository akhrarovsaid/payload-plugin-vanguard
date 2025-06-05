export function getUTCTimestamp() {
  return new Date().toISOString().replace(/:|\./g, '-')
}
