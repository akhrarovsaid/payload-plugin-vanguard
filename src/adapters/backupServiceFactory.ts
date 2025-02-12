import type { PayloadRequest } from 'payload'

import type { BackupServiceAdapter } from './backupServiceAdapter.js'

import { mongodbBackupServiceAdapter } from './mongodbBackupServiceAdapter.js'

export const createBackupService = (req: PayloadRequest): BackupServiceAdapter => {
  const packageName = req.payload.db.packageName
  const dbType = packageName.replace('@payloadcms/db-', '')
  switch (dbType) {
    case 'mongodb': {
      return mongodbBackupServiceAdapter
    }
    /* case 'postgres':
    case 'vercel-postgres': {
      return 
    } */
    /* case 'sqlite': {
      return
    } */
    default: {
      throw new Error(`Unsupported database adapter: ${packageName}`)
    }
  }
}
