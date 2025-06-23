import type { BasePayload, DatabaseAdapter } from 'payload'

import { databasePackageMap } from './databasePackageMap.js'

export function getDBName({ payload }: { payload: BasePayload }): string {
  const packageName = payload.db.packageName

  if (packageName === databasePackageMap.sqlite) {
    const db = payload.db as { clientConfig: { url: string } } & DatabaseAdapter
    return db.clientConfig.url.split('/').pop() as string
  } else if (packageName === databasePackageMap.postgres) {
    const db = payload.db as { poolOptions: { connectionString: string } } & DatabaseAdapter
    return db.poolOptions.connectionString.split('/').pop() as string
  } else {
    const db = payload.db as { connection: { name: string } } & DatabaseAdapter
    return db.connection.name
  }
}
