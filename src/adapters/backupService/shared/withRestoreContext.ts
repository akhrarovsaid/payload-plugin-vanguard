import type { RestoreOperationArgs, RestoreOperationContextArgs } from '../types.js'

import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { OperationType } from '../../../utilities/operationType.js'
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
  pluginConfig,
  req: { payload, user },
  req,
  runOperation,
  uploadSlug,
}: RestoreOperationContextArgs) {
  const operation = OperationType.RESTORE
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
    backupDocId,
    backupSlug,
    data: {
      latestRunId: runId,
      latestRunOperation: operation,
    },
    operation,
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

  await upsertBackupDoc({
    backupDocId,
    backupSlug,
    data: {
      restoredAt: new Date().toISOString(),
      restoredBy: user?.id,
      restoreLogs: logsDoc?.id,
    },
    falureSeverity: {
      logLevel: 'warn',
      shouldThrow: false,
    },
    operation,
    req,
    user,
  })
}
