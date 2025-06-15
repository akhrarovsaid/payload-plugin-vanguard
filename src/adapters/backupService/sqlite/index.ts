import type { BackupServiceAdapter } from '../types.js'

/* import { backup } from './backup.js'
import { restore } from './restore.js' */

export const sqliteAdapter: BackupServiceAdapter = {
  backup: () => new Promise((resolve) => resolve({ id: '' })),
  restore: () => new Promise((resolve) => resolve()),
}
