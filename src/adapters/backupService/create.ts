import type { PayloadRequest } from 'payload'

import type { BackupServiceAdapter } from './types.js'

import { mongodbAdapter } from './mongodb/index.js'
import { postgresAdapter } from './postgres/index.js'
import { databasePackageMap } from './shared/databasePackageMap.js'

const adapterMap = {
  [databasePackageMap.mongodb]: mongodbAdapter,
  [databasePackageMap.postgres]: postgresAdapter,
  /* [databasePackageMap.sqlite]: sqliteAdapter, */
}

export const createBackupService = (req: PayloadRequest): BackupServiceAdapter => {
  const packageName = req.payload.db.packageName
  const adapter = adapterMap[packageName]

  if (!adapter) {
    throw new Error(`Unsupported database adapter: ${packageName}`)
  }

  return adapter
}
