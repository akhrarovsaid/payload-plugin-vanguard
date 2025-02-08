import type { VanguardPluginConfig } from 'src/types.js'

import { exec } from 'child_process'
import {
  type CollectionConfig,
  type Config,
  type DatabaseAdapter,
  headersWithCors,
  type PayloadHandler,
} from 'payload'

type Args = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

export const generateBackupHandler = ({
  backupCollection,
  config,
  pluginConfig,
  uploadCollection,
}: Args): PayloadHandler => {
  return async (req) => {
    const payload = req.payload
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    if (!req.user) {
      return Response.json({ message: t('error:unauthorized') }, { headers, status: 401 })
    }
    // TODO: check for 'create' access

    const adapterName = payload.db.packageName.replace('@payloadcms/', '')
    const connectionString = (payload.db as { url: string } & DatabaseAdapter).url

    console.log(adapterName, connectionString)

    // we need to:
    // 1. create the backup doc
    const backupDoc = await payload.create({
      collection: backupCollection.slug,
      data: {
        initiatedBy: req.user,
      },
    })
    // 2. use exec or spawn

    // 3. update the backup doc with resulting file
    const blob = new Blob([])
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadDoc = await payload.create({
      collection: uploadCollection.slug,
      file: {
        data: buffer,
      },
    })
    // 4. return response

    return Response.json({}, { status: 200 })
  }
}
