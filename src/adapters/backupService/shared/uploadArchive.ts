import type { PayloadRequest } from 'payload'

import type { VanguardPluginConfig } from '../../../types.js'
import type { OperationType } from '../../../utilities/operationType.js'
import type { TempFileInfos } from '../types.js'

import { UploadArchiveError } from '../../../errors/UploadArchiveError.js'
import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  backupDocId?: number | string
  backupSlug: string
  buffer?: Buffer
  operation: OperationType
  pluginConfig: VanguardPluginConfig
  req: PayloadRequest
  tempFileInfos: TempFileInfos
  uploadSlug: string
}

export async function uploadArchive({
  backupDocId,
  backupSlug,
  buffer,
  operation,
  pluginConfig,
  req,
  tempFileInfos,
}: Args) {
  if (!buffer) {
    return
  }
  try {
    return req.payload.create({
      collection: backupSlug,
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
      pluginConfig,
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }
}
