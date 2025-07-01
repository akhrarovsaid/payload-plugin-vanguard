import type { BackupOperationArgs, RestoreOperationArgs } from '../types.js'

import { OperationError } from '../../../errors/OperationError.js'
import { reportAndThrow } from './reportAndThrow.js'

type BackupRestoreArgs = BackupOperationArgs | RestoreOperationArgs

type Args<OperationArgs, ReturnType> = {
  backupDocId?: number | string
  operationArgs: OperationArgs
  runOperation: (args: OperationArgs) => Promise<ReturnType>
}

// TODO: Translations
export async function executeOperation<OperationArgs extends BackupRestoreArgs, ReturnType>({
  backupDocId,
  operationArgs,
  runOperation,
}: Args<OperationArgs, ReturnType>) {
  try {
    return runOperation(operationArgs)
  } catch (_err) {
    const { backupSlug, operation, req, tempFileInfos, uploadSlug } = operationArgs
    const error = _err as Error
    await reportAndThrow({
      backupDocId,
      backupSlug,
      error: new OperationError({ backupSlug, operation, options: { cause: error } }),
      operation,
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
      uploadSlug,
    })
  }
}
