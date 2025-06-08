import type { CollectionAfterDeleteHook } from 'payload'

import type { PayloadDoc } from '../../../types.js'

export const getDeleteLogFilesHook = ({
  uploadSlug,
}: {
  uploadSlug: string
}): CollectionAfterDeleteHook => {
  return async ({ doc, req: { payload }, req }) => {
    const logs: (null | number | PayloadDoc | string | undefined)[] = [
      doc.backupLogs,
      doc.restoreLogs,
    ]

    for (const logsFile of logs) {
      if (!logsFile) {
        continue
      }

      const logsDocId = typeof logsFile === 'object' ? logsFile.id : logsFile
      try {
        await payload.delete({
          id: logsDocId,
          collection: uploadSlug,
          req,
          select: {},
        })
      } catch (_err) {
        payload.logger.error(_err, `Failed to delete logs file with id: ${logsDocId}`)
      }
    }
  }
}
