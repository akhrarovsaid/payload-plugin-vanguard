import { promises } from 'fs'

import type {
  BackupOperationArgs,
  BackupOperationContextArgs,
  BackupOperationResult,
  PayloadDoc,
} from '../types.js'

import { runAfterOperationHooks } from '../../../hooks/runAfterOperationHooks.js'
import { runBeforeOperationHooks } from '../../../hooks/runBeforeOperationHooks.js'
import { BackupStatus } from '../../../utilities/backupStatus.js'
import { getConnectionString } from '../../../utilities/getConnectionString.js'
import { getDBName } from '../../../utilities/getDBName.js'
import { createMultipartAdapter } from '../../multipart/create.js'
import { AdapterNames } from '../../multipart/shared/adapterNames.js'
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

  const archiveAdapter = createMultipartAdapter(req, backupSlug)
  const logsAdapter = createMultipartAdapter(req, backupSlug)

  const isLocalAdapter =
    archiveAdapter.name === AdapterNames.LOCAL && logsAdapter.name === AdapterNames.LOCAL

  await archiveAdapter.init(
    isLocalAdapter ? tempFileInfos.archiveFileInfo.path : tempFileInfos.archiveFileInfo.filename,
  )
  await logsAdapter.init(
    isLocalAdapter ? tempFileInfos.logsFileInfo.path : tempFileInfos.logsFileInfo.filename,
  )

  const operationArgs = {
    adapters: { archive: archiveAdapter, logs: logsAdapter },
    backupSlug,
    connectionString,
    dbName,
    operation,
    pluginConfig,
    req,
    tempFileInfos,
  }

  const operationResult = (await executeOperation<BackupOperationArgs, BackupOperationResult>({
    backupDocId: backupDoc?.id,
    operationArgs,
    runOperation,
  })) as BackupOperationResult

  // Operation completed => we have logs and an archive file uploaded
  // If adapter is local, perform payload buffer upload
  // Else update backup document with file info

  const logsDoc = await uploadLogs({
    ...operationResult.logs,
    backupDocId: backupDoc?.id,
    backupSlug,
    operation,
    payload,
    req,
  })

  const data = {
    completedAt: new Date().toISOString(),
    status: BackupStatus.SUCCESS,
  }

  let backupDocPromise: Promise<PayloadDoc>

  if (isLocalAdapter) {
    const buffer = await promises.readFile(tempFileInfos.archiveFileInfo.path)

    const file = {
      name: operationResult.archive.filename,
      data: buffer,
      mimetype: 'application/gzip',
      size: buffer?.length ?? 0,
    }

    backupDocPromise = upsertBackupDoc({
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
  } else {
    // insert backup file data into db
    // update backup doc
    backupDocPromise = upsertBackupDoc({
      backupDocId: backupDoc?.id,
      backupLogsId: logsDoc?.id,
      backupSlug,
      data,
      operation,
      pluginConfig,
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
      user,
    }) as Promise<PayloadDoc>
  }

  await cleanup({ payload, tempFileInfos })

  await runAfterOperationHooks({ data, operation, pluginConfig, req })

  return backupDocPromise!
}
