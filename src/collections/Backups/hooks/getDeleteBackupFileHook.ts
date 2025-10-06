import type { CollectionBeforeDeleteHook } from 'payload'

import { UploadTypes } from '../../../utilities/uploadTypes.js'

export const getDeleteBackupFileHook = ({
  backupSlug,
}: {
  backupSlug: string
}): CollectionBeforeDeleteHook => {
  return async ({ id, req, req: { payload } }) => {
    try {
      await payload.delete({
        collection: backupSlug,
        depth: 0,
        req,
        select: {},
        where: {
          and: [
            {
              type: {
                equals: UploadTypes.LOGS,
              },
            },
            {
              parent: {
                equals: id,
              },
            },
          ],
        },
      })
    } catch (_err) {
      payload.logger.error(_err, `Failed to delete logs with parent: ${id}`)
    }
  }
}
