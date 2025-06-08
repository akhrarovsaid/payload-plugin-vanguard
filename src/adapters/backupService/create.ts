import type { PayloadRequest } from 'payload'

import type { BackupServiceAdapter } from './types.js'

import { mongodbAdapter } from './mongodb/index.js'
import { postgresAdapter } from './postgres/index.js'

export const createBackupService = (req: PayloadRequest): BackupServiceAdapter => {
  const packageName = req.payload.db.packageName
  const dbType = packageName.replace('@payloadcms/db-', '')
  switch (dbType) {
    case 'mongodb': {
      return mongodbAdapter
    }
    case 'postgres':
    case 'vercel-postgres': {
      return postgresAdapter
    }
    /* case 'sqlite': {
      return
    } */
    default: {
      throw new Error(`Unsupported database adapter: ${packageName}`)
    }
  }
}
