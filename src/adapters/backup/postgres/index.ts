import type { BackupServiceAdapter } from '../types.js'

import { backup } from './backup.js'
import { restore } from './restore.js'

export const postgresAdapter: BackupServiceAdapter = {
  backup,
  restore,
}
