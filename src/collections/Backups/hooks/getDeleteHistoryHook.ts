import type { CollectionBeforeDeleteHook } from 'payload'

export const getDeleteHistoryHook = ({
  archiveFieldName,
  historySlug,
}: {
  archiveFieldName: string
  historySlug: string
}): CollectionBeforeDeleteHook => {
  return async ({ id: backupDocId, req: { payload }, req }) => {
    await payload.delete({
      collection: historySlug,
      depth: 0,
      req,
      select: {},
      where: {
        [archiveFieldName]: {
          equals: backupDocId,
        },
      },
    })
  }
}
