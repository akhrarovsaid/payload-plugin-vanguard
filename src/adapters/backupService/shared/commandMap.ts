import { databasePackageMap } from './databasePackageMap.js'

export const commandMap = {
  [databasePackageMap.mongodb]: {
    backup: 'mongodump',
    restore: 'mongorestore',
  },
  [databasePackageMap.postgres]: {
    backup: 'pg_dump',
    restore: 'pg_restore',
  },
  [databasePackageMap.sqlite]: {
    backup: 'sqlite3',
    restore: 'sqlite3',
  },
}

export function getCommand({ packageName }: { packageName: string }) {
  return commandMap[packageName]
}
