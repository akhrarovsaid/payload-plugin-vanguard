import type { PayloadDoc } from '../../../types.js'
import type { BackupOperationContextArgs } from '../types.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { cleanup } from './cleanup.js'
import { flushLogs } from './flushLogs.js'
import { generateRunId } from './generateRunId.js'
import { getTempFileInfos } from './getTempFileInfos.js'
import { reportAndThrow } from './reportAndThrow.js'

export async function withBackupContext({
  backupSlug,
  historySlug,
  pluginConfig,
  req: { payload, t, user },
  req,
  runOperation,
  uploadSlug,
}: BackupOperationContextArgs) {
  const { generateFilename } = pluginConfig
  const tempFileInfos = await getTempFileInfos({
    generateFilename,
    operation: 'backup',
    payload,
  })
  const { archive: archiveFileInfo, logs: logsFileInfo } = tempFileInfos
  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })
  const runId = generateRunId()

  let backupDoc!: PayloadDoc
  try {
    backupDoc = await payload.create({
      collection: backupSlug,
      data: {
        initiatedBy: user,
        latestRunId: runId,
      },
      req,
    })
  } catch (_err) {
    await reportAndThrow({
      backupSlug,
      error: _err,
      message: 'Backup aborted: failed to create initial doc',
      req,
    })
  }

  let fileBuffer!: Buffer
  try {
    fileBuffer = await runOperation({
      backupSlug,
      connectionString,
      dbName,
      historySlug,
      pluginConfig,
      req,
      tempFileInfos,
      uploadSlug,
    })
  } catch (_err) {
    await reportAndThrow({
      backupDocId: backupDoc.id,
      backupSlug,
      error: _err,
      message: 'Backup failed: mongodump process error',
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }

  let uploadDoc!: PayloadDoc
  try {
    uploadDoc = await payload.create({
      collection: uploadSlug,
      data: {},
      file: {
        name: archiveFileInfo.filename,
        data: fileBuffer,
        mimetype: 'application/gzip',
        size: fileBuffer.length,
      },
      req,
    })
  } catch (_err) {
    await reportAndThrow({
      backupDocId: backupDoc.id,
      backupSlug,
      error: _err,
      message: t('error:problemUploadingFile'),
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }

  const logsDoc: PayloadDoc | undefined = await flushLogs({
    ...logsFileInfo,
    payload,
    req,
    uploadSlug,
  })

  try {
    await payload.update({
      id: backupDoc.id,
      collection: backupSlug,
      data: {
        backup: uploadDoc.id,
        backupLogs: logsDoc?.id,
        completedAt: new Date().toISOString(),
        status: BackupStatus.SUCCESS,
      },
      req,
    })
  } catch (_err) {
    await reportAndThrow({
      backupDocId: backupDoc.id,
      backupLogsId: logsDoc?.id,
      backupSlug,
      error: _err,
      message: 'Backup failed: update backup doc error',
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }

  await cleanup({ payload, tempFileInfos })

  return backupDoc
}
