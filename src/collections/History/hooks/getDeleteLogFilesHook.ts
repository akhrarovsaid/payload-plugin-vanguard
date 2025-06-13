import type { CollectionBeforeDeleteHook } from 'payload'

export const getDeleteLogFilesHook = ({
  uploadSlug,
}: {
  uploadSlug: string
}): CollectionBeforeDeleteHook => {
  return async ({ id: historyDocId, collection, req: { payload }, req }) => {
    const historyDoc = await payload.findByID({
      id: historyDocId,
      collection: collection.slug,
      depth: 0,
      select: {
        logs: true,
      },
    })

    if (!historyDoc.logs) {
      return
    }

    await payload.delete({
      collection: uploadSlug,
      req,
      where: {
        id: {
          equals: historyDoc.logs,
        },
      },
    })
  }
}
