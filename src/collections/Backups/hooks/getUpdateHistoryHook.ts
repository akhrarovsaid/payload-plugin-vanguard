import type { CollectionBeforeChangeHook } from 'payload'

import { OperationType } from '../../../utilities/operationType.js'

export const getUpdateHistoryHook = ({
  historySlug,
}: {
  historySlug: string
}): CollectionBeforeChangeHook => {
  return async ({
    data: dataFromProps,
    operation: operationFromProps,
    originalDoc: { id: originalDocId, latestRunId: originalRunId },
    req: { payload },
    req,
  }) => {
    const isCreate = operationFromProps === 'create'

    if (isCreate) {
      return dataFromProps
    }

    const {
      id,
      backupLogs,
      completedAt,
      createdAt,
      initiatedBy,
      latestRunId: runId,
      latestRunOperation: operation,
      method,
      restoredAt,
      restoredBy,
      restoreLogs,
      status,
      updatedAt,
    } = dataFromProps

    const isBackup = operation === OperationType.BACKUP
    const archive = id || originalDocId

    const data = {
      archive,
      completedAt: isBackup ? completedAt : restoredAt,
      logs: isBackup ? backupLogs : restoreLogs,
      method,
      operation,
      runId,
      startedAt: isBackup ? createdAt : updatedAt,
      status,
      user: isBackup ? initiatedBy : restoredBy,
    }

    const isNewRun = runId !== originalRunId

    const args = {
      collection: historySlug,
      data,
      depth: 0,
      req,
    }

    const upsert = isNewRun
      ? payload.create(args)
      : payload.update({
          ...args,
          where: {
            runId: {
              equals: runId,
            },
          },
        })

    await upsert

    return dataFromProps
  }
}
