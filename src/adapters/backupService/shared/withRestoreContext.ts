import { runAfterOperationHooks } from 'hooks/runAfterOperationHooks.js'

import type { RestoreOperationArgs, RestoreOperationContextArgs } from '../types.js'

import { runBeforeOperationHooks } from '../../../hooks/runBeforeOperationHooks.js'
import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { ensureCommandExists } from './commandExists.js'
import { executeOperation } from './executeOperation.js'
import { generateRunId } from './generateRunId.js'
import { getTempFileInfos } from './getTempFileInfos.js'
import { uploadLogs } from './uploadLogs.js'
import { upsertBackupDoc } from './upsertBackupDoc.js'

export async function withRestoreContext({
  id: backupDocId,
  backupSlug,
  historySlug,
  operation,
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
  uploadSlug,
}: RestoreOperationContextArgs) {
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
    args: { latestRunId: runId, latestRunOperation: operation },
    operation,
    pluginConfig,
    req,
  })

  await ensureCommandExists({ backupSlug, operation, packageName, pluginConfig, req })

  const backupDoc = await upsertBackupDoc({
    backupDocId,
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
    historySlug,
    operation,
    pluginConfig,
    req,
    tempFileInfos,
    uploadSlug,
    url: `${req.origin}${backupDoc?.backup.url}`,
  }

  await executeOperation<RestoreOperationArgs, void>({
    backupDocId: backupDoc?.id,
    operationArgs,
    runOperation,
  })

  const logsDoc = await uploadLogs({
    ...tempFileInfos.logsFileInfo,
    operation,
    payload,
    req,
    uploadSlug,
  })

  const data = {
    restoredAt: new Date().toISOString(),
    restoredBy: user?.id,
    restoreLogs: logsDoc?.id,
  }

  const upsert = upsertBackupDoc({
    backupDocId,
    backupSlug,
    data,
    failureSeverity: {
      logLevel: 'warn',
      shouldThrow: false,
    },
    operation,
    pluginConfig,
    req,
    user,
  })

  await runAfterOperationHooks({ data, operation, pluginConfig, req })

  await upsert
}
