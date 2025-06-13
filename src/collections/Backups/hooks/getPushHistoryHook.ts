import type { CollectionAfterChangeHook } from 'payload'

export const getPushHistoryHook = ({
  historySlug,
}: {
  historySlug: string
}): CollectionAfterChangeHook => {
  return async ({ doc, operation: operationFromProps, req: { payload }, req }) => {
    const isCreate = operationFromProps === 'create'

    if (!isCreate) {
      return doc
    }

    const {
      id: archive,
      completedAt,
      createdAt: startedAt,
      initiatedBy: user,
      latestRunId: runId,
      latestRunOperation: operation,
      method,
      status,
    } = doc

    const data = {
      archive,
      completedAt,
      method,
      operation,
      runId,
      startedAt,
      status,
      user,
    }

    await payload.create({
      collection: historySlug,
      data,
      depth: 0,
      req,
      select: {},
    })

    return doc
  }
}
