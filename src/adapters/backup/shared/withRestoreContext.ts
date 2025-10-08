import type { RestoreOperationArgs, RestoreOperationContextArgs } from '../types.js'

import { runAfterOperationHooks } from '../../../hooks/runAfterOperationHooks.js'
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
  operation,
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
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
    operation,
    pluginConfig,
    req,
    tempFileInfos,
    url: `${req.origin}${backupDoc?.url}`,
  }

  await executeOperation<RestoreOperationArgs, void>({
    backupDocId,
    operationArgs,
    runOperation,
  })

  const logsDoc = await uploadLogs({
    ...tempFileInfos.logsFileInfo,
    backupDocId,
    backupSlug,
    operation,
    payload,
    req,
  })

  const data = {
    restoredAt: new Date().toISOString(),
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
