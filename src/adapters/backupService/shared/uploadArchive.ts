import type { PayloadRequest } from 'payload'

import type { TempFileInfos } from '../types.js'

import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  backupDocId?: number | string
  backupSlug: string
  buffer?: Buffer
  req: PayloadRequest
  tempFileInfos: TempFileInfos
  uploadSlug: string
}

export async function uploadArchive({
  backupDocId,
  backupSlug,
  buffer,
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
      error: _err,
      message: t('error:problemUploadingFile'),
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }
}
