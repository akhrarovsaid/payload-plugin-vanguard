import type { VanguardPluginConfig } from 'src/types.js'

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  type BasePayload,
  type CollectionConfig,
  type Config,
  type DatabaseAdapter,
  headersWithCors,
  type JsonObject,
  type PayloadHandler,
  type TypeWithID,
} from 'payload'

import { BackupStatus } from './BackupStatus.js'

type Args = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

async function backup(
  payload: BasePayload,
  uri: string,
  backupSlug: string,
  uploadSlug: string,
): Promise<JsonObject & TypeWithID> {
  const fileName = `mongodb_backup_${Date.now()}.gz`
  const tmpFilePath = path.join(os.tmpdir(), fileName)
  const writeStream = fs.createWriteStream(tmpFilePath)

  return new Promise((resolve, reject) => {
    const dumpProcess = spawn('mongodump', [
      `--uri=${uri}`,
      '--archive',
      '--gzip',
      `--excludeCollection=${backupSlug}`,
      `--excludeCollection=${uploadSlug}`,
    ])

    dumpProcess.stdout.pipe(writeStream)

    dumpProcess.on('error', (err) => {
      console.error(err)
      reject(err)
    })

    dumpProcess.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`mongodump exited with code ${code}`))
      }

      const fileBuffer = await fs.promises.readFile(tmpFilePath)

      // Upload
      const uploadDoc = await payload.create({
        collection: uploadSlug,
        data: {},
        file: {
          name: fileName,
          data: fileBuffer,
          mimetype: 'application/gzip',
          size: fileBuffer.length,
        },
      })

      await fs.promises.unlink(tmpFilePath)

      return resolve(uploadDoc)
    })
  })
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

    const connectionString = (payload.db as { url: string } & DatabaseAdapter).url

    // we need to:
    // 1. create the backup doc
    const backupDoc = await payload.create({
      collection: backupCollection.slug,
      data: {
        initiatedBy: req.user,
      },
    })

    // 2. use exec or spawn
    const uploadDoc = await backup(
      payload,
      connectionString,
      backupCollection.slug,
      uploadCollection.slug,
    )

    // 3. update the backup doc with resulting file
    await payload.update({
      id: backupDoc.id,
      collection: backupCollection.slug,
      data: {
        completedAt: new Date().toISOString(),
        file: uploadDoc.id,
        status: BackupStatus.SUCCESS,
      },
    })

    // 4. return response
    return Response.json({}, { status: 200 })
  }
}
