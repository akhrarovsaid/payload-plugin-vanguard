import type { BasePayload } from 'payload'

import type { FailureSeverity } from './reportAndThrow.js'

type Args = {
  error: unknown
  failureSeverity?: Partial<FailureSeverity>
  message?: string
  payload: BasePayload
}

export function logMessage({
  error,
  failureSeverity = { logLevel: 'error' },
  message,
  payload,
}: Args) {
  if (typeof message === 'string' && failureSeverity.logLevel) {
    const log = payload.logger[failureSeverity.logLevel]
    log(error, message)
  }
}
