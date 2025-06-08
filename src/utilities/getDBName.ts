import type { BasePayload, DatabaseAdapter } from 'payload'

export function getDBName({ payload }: { payload: BasePayload }): string {
  return ((payload.db as { connection: { name: string } } & DatabaseAdapter).connection?.name ||
    (
      payload.db as { poolOptions: { connectionString: string } } & DatabaseAdapter
    ).poolOptions?.connectionString
      .split('/')
      .pop()) as string
}
