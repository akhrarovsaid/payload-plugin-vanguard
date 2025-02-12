import type { BasePayload, DatabaseAdapter } from 'payload'

export function getDBName({ payload }: { payload: BasePayload }) {
  return (payload.db as { connection: { name: string } } & DatabaseAdapter).connection.name
}
