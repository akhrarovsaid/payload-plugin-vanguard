import type { BackupOperationArgs, BackupOperationContextArgs, PayloadDoc } from '../types.js'

import { runAfterOperationHooks } from '../../../hooks/runAfterOperationHooks.js'
import { runBeforeOperationHooks } from '../../../hooks/runBeforeOperationHooks.js'
import { BackupStatus } from '../../../utilities/backupStatus.js'
import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { cleanup } from './cleanup.js'
import { ensureCommandExists } from './commandExists.js'
import { executeOperation } from './executeOperation.js'
import { generateRunId } from './generateRunId.js'
import { getTempFileInfos } from './getTempFileInfos.js'
import { uploadLogs } from './uploadLogs.js'
import { upsertBackupDoc } from './upsertBackupDoc.js'

export async function withBackupContext({
  backupSlug,
  operation,
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
}: BackupOperationContextArgs) {
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

  const args = await runBeforeOperationHooks({
    args: { latestRunId: runId },
    operation,
    pluginConfig,
    req,
  })

  await ensureCommandExists({ backupSlug, operation, packageName, pluginConfig, req })

  const backupDoc = await upsertBackupDoc({
    backupSlug,
    data: args,
    operation,
    pluginConfig,
    req,
    user,
  })

  const operationArgs = {
    backupSlug,
    connectionString,
    dbName,
    operation,
    pluginConfig,
    req,
    tempFileInfos,
  }

  const buffer = await executeOperation<BackupOperationArgs, Buffer>({
    backupDocId: backupDoc?.id,
    operationArgs,
    runOperation,
  })

  const logsDoc = await uploadLogs({
    ...tempFileInfos.logsFileInfo,
    backupDocId: backupDoc?.id,
    backupSlug,
    operation,
    payload,
    req,
  })

  await cleanup({ payload, tempFileInfos })

  const data = {
    completedAt: new Date().toISOString(),
    status: BackupStatus.SUCCESS,
  }

  const file = {
    name: tempFileInfos.archiveFileInfo.filename,
    data: buffer as Buffer,
    mimetype: 'application/gzip',
    size: buffer?.length ?? 0,
  }

  const backupDocPromise = upsertBackupDoc({
    backupDocId: backupDoc?.id,
    backupLogsId: logsDoc?.id,
    backupSlug,
    data,
    file,
    operation,
    pluginConfig,
    req,
    shouldCleanup: true,
    shouldFlushLogs: true,
    tempFileInfos,
    user,
  }) as Promise<PayloadDoc>

  await runAfterOperationHooks({ data, operation, pluginConfig, req })

  return backupDocPromise
}
