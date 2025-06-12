import type { CollectionAfterChangeHook } from 'payload'

import { OperationType } from '../../../utilities/operationType.js'

export const getPushHistoryHook = ({
  historySlug,
}: {
  historySlug: string
}): CollectionAfterChangeHook => {
  return async ({ doc, operation: operationFromProps, previousDoc, req: { payload }, req }) => {
    const {
      id: archive,
      completedAt,
      createdAt,
      initiatedBy,
      latestRunId: runId,
      latestRunOperation: operation,
      method,
      restoredAt,
      restoredBy,
      status,
      updatedAt,
    } = doc

    const isCreate = operationFromProps === 'create'
    const isPreviousRunIdSame = Boolean(previousDoc) && previousDoc.latestRunId === runId
    const isNewRun = isCreate || !isPreviousRunIdSame
    const isBackup = operation === OperationType.BACKUP

    const data = {
      archive,
      completedAt: isBackup ? completedAt : restoredAt,
      method,
      operation,
      runId,
      startedAt: isBackup ? createdAt : updatedAt,
      status,
      user: restoredBy || initiatedBy,
    }

    if (isNewRun) {
      await payload.create({
        collection: historySlug,
        data,
        depth: 0,
        req,
        select: {},
      })
    } else {
      const { backupLogs, restoreLogs } = doc
      await payload.update({
        collection: historySlug,
        data: {
          ...data,
          logs: operation === OperationType.BACKUP ? backupLogs : restoreLogs,
        },
        depth: 0,
        req,
        where: {
          runId: {
            equals: runId,
          },
        },
      })
    }

    return doc
  }
}
