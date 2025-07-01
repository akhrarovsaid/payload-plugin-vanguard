import type { PayloadRequest } from 'payload'

import type { OperationType } from '../../../utilities/operationType.js'
import type { TempFileInfos } from '../types.js'

import { UploadArchiveError } from '../../../errors/UploadArchiveError.js'
import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  backupDocId?: number | string
  backupSlug: string
  buffer?: Buffer
  operation: OperationType
  req: PayloadRequest
  tempFileInfos: TempFileInfos
  uploadSlug: string
}

export async function uploadArchive({
  backupDocId,
  backupSlug,
  buffer,
  operation,
  req: { payload, t },
  req,
  tempFileInfos,
  uploadSlug,
}: Args) {
  if (!buffer) {
    return
  }
  try {
    return payload.create({
      collection: uploadSlug,
      data: {},
      file: {
        name: tempFileInfos.archiveFileInfo.filename,
        data: buffer,
        mimetype: 'application/gzip',
        size: buffer.length,
      },
      req,
    })
  } catch (_err) {
    await reportAndThrow({
      backupDocId,
      backupSlug,
      error: new UploadArchiveError({ backupSlug, options: { cause: _err } }),
      operation,
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }
}
