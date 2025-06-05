import type { CollectionAfterDeleteHook } from 'payload'

export const getDeleteBackupFileHook = ({
  uploadSlug,
}: {
  uploadSlug: string
}): CollectionAfterDeleteHook => {
  return async ({ doc, req }) => {
    const backupFileId = doc.backup?.id
    if (typeof backupFileId === 'undefined') {
      return
    }

    const payload = req.payload

    try {
      await payload.delete({
        id: backupFileId,
        collection: uploadSlug,
        req,
        select: {},
      })
    } catch (_err) {
      payload.logger.error(_err, `Failed to delete backup file with id: ${backupFileId}`)
    }
  }
}
