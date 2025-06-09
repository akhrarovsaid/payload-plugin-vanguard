import fs from 'fs'

import type { PayloadDoc, RestoreOperationContextArgs } from '../types.js'

import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { generateRunId } from './generateRunId.js'
import { getTempFileInfos } from './getTempFileInfos.js'

export async function withRestoreContext({
  id,
  backupSlug,
  historySlug,
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
  uploadSlug,
}: RestoreOperationContextArgs) {
  const { generateFilename } = pluginConfig
  const tempFileInfos = await getTempFileInfos({
    generateFilename,
    operation: 'restore',
    payload,
  })
  const { logs: logFileInfo } = tempFileInfos
  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })
  const runId = generateRunId()

  let backupDoc: PayloadDoc
  try {
    backupDoc = await payload.update({
      id,
      collection: backupSlug,
      data: {
        latestRunId: runId,
      },
      req,
      select: {
        backup: true,
        status: true,
      },
    })
  } catch (_err) {
    const message = req.t('error:notFound')
    payload.logger.error(_err, message)
    throw new Error(message)
  }

  const url = backupDoc?.backup.url

  try {
    await runOperation({
      backupSlug,
      connectionString,
      dbName,
      historySlug,
      pluginConfig,
      req,
      tempFileInfos,
      uploadSlug,
      url: `${req.origin}${url}`,
    })
  } catch (_err) {
    const err = _err as Error
    payload.logger.error(err)
    throw new Error(err.message)
  }

  let logsBuffer: Buffer | undefined = undefined
  try {
    logsBuffer = await fs.promises.readFile(logFileInfo.path)
  } catch (_err) {
    payload.logger.warn(_err, `Failed to read log file: ${logFileInfo.path}`)
  }

  let logsDoc: PayloadDoc | undefined = undefined
  if (logsBuffer) {
    try {
      logsDoc = await payload.create({
        collection: uploadSlug,
        data: {},
        file: {
          name: logFileInfo.filename,
          data: logsBuffer,
          mimetype: 'text/plain',
          size: logsBuffer.length,
        },
        req,
      })
    } catch (_err) {
      payload.logger.warn(_err, `Failed to create log file: ${logFileInfo.path}`)
    }
  }

  try {
    await payload.update({
      id,
      collection: backupSlug,
      data: {
        restoredAt: new Date().toISOString(),
        restoredBy: user!.id,
        restoreLogs: logsDoc?.id,
      },
      req,
    })
  } catch (_err) {
    payload.logger.warn(_err, `Unable to update backup doc with id: ${id} after restore.`)
  }
}
