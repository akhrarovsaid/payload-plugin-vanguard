import type { PayloadRequest } from 'payload'

import type { TempFileInfos } from '../types.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  archiveDocId?: number | string
  backupDocId?: number | string
  backupSlug: string
  logsDocId?: number | string
  req: PayloadRequest
  tempFileInfos: TempFileInfos
}

// DEPRECATED: Delete
export async function markBackupSuccess({
  archiveDocId,
  backupDocId,
  backupSlug,
  logsDocId,
  req: { payload },
  req,
  tempFileInfos,
}: Args) {
  if (!backupDocId) {
    throw new Error('Failed to update backup doc: invalid doc id.')
  }

  try {
    return payload.update({
      id: backupDocId,
      collection: backupSlug,
      data: {
        backup: archiveDocId,
        backupLogs: logsDocId,
        completedAt: new Date().toISOString(),
        status: BackupStatus.SUCCESS,
      },
      req,
    })
  } catch (_err) {
    await reportAndThrow({
      backupDocId,
      backupLogsId: logsDocId,
      backupSlug,
      error: _err,
      message: 'Backup failed: update backup doc error',
      req,
      shouldCleanup: true,
      shouldFlushLogs: true,
      tempFileInfos,
    })
  }
}
