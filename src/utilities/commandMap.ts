const mongoDumpCmd = 'mongodump'
const pgDumpCmd = 'pg_dump'

export const backupCommandMap = {
  'db-mongodb': mongoDumpCmd,
  'db-postgres': pgDumpCmd,
}
