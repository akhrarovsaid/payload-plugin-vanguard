import type { BackupOperationArgs, BackupOperationContextArgs, PayloadDoc } from '../types.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { OperationType } from '../../../utilities/operationType.js'
import { cleanup } from './cleanup.js'
import { ensureCommandExists } from './commandExists.js'
import { executeOperation } from './executeOperation.js'
import { generateRunId } from './generateRunId.js'
import { getTempFileInfos } from './getTempFileInfos.js'
import { uploadArchive } from './uploadArchive.js'
import { uploadLogs } from './uploadLogs.js'
import { upsertBackupDoc } from './upsertBackupDoc.js'

export async function withBackupContext({
  backupSlug,
  historySlug,
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
  uploadSlug,
}: BackupOperationContextArgs) {
  const operation = OperationType.BACKUP
  const runId = generateRunId()

  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })

  const { packageName } = payload.db
  const { generateFilename } = pluginConfig

  const tempFileInfos = await getTempFileInfos({
    generateFilename,
    operation,
    payload,
  })

  await ensureCommandExists({ backupSlug, operation, packageName, req })

  const backupDoc = await upsertBackupDoc({
    backupSlug,
    data: { initiatedBy: user, latestRunId: runId },
    operation,
    req,
    user,
  })

  const operationArgs = {
    backupSlug,
    connectionString,
    dbName,
    historySlug,
    pluginConfig,
    req,
    tempFileInfos,
    uploadSlug,
  }

  const buffer = await executeOperation<BackupOperationArgs, Buffer>({
    backupDocId: backupDoc?.id,
    operationArgs,
    runOperation,
  })

  const archiveDoc = await uploadArchive({
    backupDocId: backupDoc?.id,
    backupSlug,
    buffer,
    req,
    tempFileInfos,
    uploadSlug,
  })

  const logsDoc = await uploadLogs({
    ...tempFileInfos.logsFileInfo,
    operation,
    payload,
    req,
    uploadSlug,
  })

  await cleanup({ payload, tempFileInfos })

  const data = {
    backup: archiveDoc?.id,
    backupLogs: logsDoc?.id,
    completedAt: new Date().toISOString(),
    status: BackupStatus.SUCCESS,
  }

  return upsertBackupDoc({
    backupDocId: backupDoc?.id,
    backupLogsId: logsDoc?.id,
    backupSlug,
    data,
    operation,
    req,
    shouldCleanup: true,
    shouldFlushLogs: true,
    tempFileInfos,
    user,
  }) as Promise<PayloadDoc>
}
