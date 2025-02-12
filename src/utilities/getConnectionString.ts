import type { BasePayload, DatabaseAdapter } from 'payload'

export function getConnectionString({ payload }: { payload: BasePayload }) {
  return (payload.db as { url: string } & DatabaseAdapter).url
}
