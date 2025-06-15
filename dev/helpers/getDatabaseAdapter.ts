import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import path from 'path'

const adapters = {
  mongo: () =>
    mongooseAdapter({
      url: process.env.MONGO_URL || '',
    }),
  postgres: () =>
    postgresAdapter({
      pool: {
        connectionString: process.env.POSTGRES_URL || '',
      },
    }),
  sqlite: () =>
    sqliteAdapter({
      client: {
        url: path.resolve(process.env.SQLITE_URL || ''),
      },
    }),
}

export function getDatabaseAdapter() {
  const dbType = process.env.DB_TYPE || 'mongo'
  const createAdapter = adapters[dbType as keyof typeof adapters]

  if (!createAdapter) {
    throw new Error(`Unsupported DB_TYPE: ${dbType}`)
  }

  return createAdapter()
}
