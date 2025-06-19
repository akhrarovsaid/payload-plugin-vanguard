import type { BackupOperationArgs, RestoreOperationArgs } from '../types.js'

import { reportAndThrow } from './reportAndThrow.js'

type BackupRestoreArgs = BackupOperationArgs | RestoreOperationArgs

type Args<OperationArgs, ReturnType> = {
  backupDocId?: number | string
  operationArgs: OperationArgs
  runOperation: (args: OperationArgs) => Promise<ReturnType>
}

export async function executeOperation<OperationArgs extends BackupRestoreArgs, ReturnType>({
  backupDocId,
  operationArgs,
  runOperation,
}: Args<OperationArgs, ReturnType>) {
  try {
    return runOperation(operationArgs)
  } catch (_err) {
    const { backupSlug, req, tempFileInfos, uploadSlug } = operationArgs
    await reportAndThrow({
      backupDocId,
      backupSlug,
      error: _err,
      message: 'Backup failed: mongodump process error',
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
      uploadSlug,
    })
  }
}
