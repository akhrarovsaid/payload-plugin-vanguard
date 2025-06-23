import type { BasePayload, DatabaseAdapter } from 'payload'

import { databasePackageMap } from './databasePackageMap.js'

export function getConnectionString({ payload }: { payload: BasePayload }): string {
  const packageName = payload.db.packageName

  if (packageName === databasePackageMap.sqlite) {
    const db = payload.db as { clientConfig: { url: string } } & DatabaseAdapter
    return db.clientConfig.url
  } else if (packageName === databasePackageMap.postgres) {
    const db = payload.db as { poolOptions: { connectionString: string } } & DatabaseAdapter
    return db.poolOptions.connectionString
  } else {
    const db = payload.db as { url: string } & DatabaseAdapter
    return db.url
  }
}
