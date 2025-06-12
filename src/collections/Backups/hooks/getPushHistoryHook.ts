import type { CollectionAfterChangeHook } from 'payload'

import { OperationType } from '../../../utilities/operationType.js'

// TODO: Fix this not working on restore
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
      latestRunId,
      method,
      restoredBy,
      status,
    } = doc

    const isNewRun =
      operationFromProps === 'create' || (previousDoc && previousDoc.latestRunId !== latestRunId)

    const operation = !isNewRun ? OperationType.BACKUP : OperationType.RESTORE

    const data = {
      archive,
      completedAt,
      method,
      operation,
      runId: latestRunId,
      startedAt: createdAt,
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
            equals: previousDoc.latestRunId,
          },
        },
      })
    }

    return doc
  }
}
