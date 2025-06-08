import type { BasePayload, DatabaseAdapter } from 'payload'

export function getConnectionString({ payload }: { payload: BasePayload }): string {
  return (
    (payload.db as { url: string } & DatabaseAdapter).url ||
    (payload.db as { poolOptions: { connectionString: string } } & DatabaseAdapter).poolOptions
      ?.connectionString
  )
}
