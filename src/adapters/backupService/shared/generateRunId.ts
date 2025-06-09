export function generateRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `run_${crypto.randomUUID()}`
  }

  // Fallback: timestamp + random
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `run_${timestamp}${random}`
}
