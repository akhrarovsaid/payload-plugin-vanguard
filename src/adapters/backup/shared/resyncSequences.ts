import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { BasePayload, DatabaseAdapter } from 'payload'

import { sql } from '@payloadcms/db-postgres'

import { toSnakeCase } from '../../../utilities/toSnakeCase.js'

type Args = {
  collectionSlugs: string[]
  payload: BasePayload
}

export async function resyncSequences({ collectionSlugs, payload }: Args) {
  const db = payload.db as DatabaseAdapter & PostgresAdapter
  for (let i = 0; i < collectionSlugs.length; i++) {
    const tableName = toSnakeCase(collectionSlugs[i])
    const sequenceName = `${tableName}_id_seq`
    const query = sql.raw(`SELECT setval('${sequenceName}', (SELECT MAX(id) FROM "${tableName}"))`)
    try {
      await db.drizzle.execute(query)
    } catch (_err) {
      payload.logger.warn(_err, `Failed to resync id sequences ${sequenceName} for ${tableName}.`)
    }
  }
}
