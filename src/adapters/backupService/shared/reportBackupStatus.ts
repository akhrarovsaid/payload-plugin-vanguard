import type { PayloadRequest } from 'payload'

import type { OperationType } from '../../../utilities/operationType.js'
import type { PayloadDoc, TempFileInfos } from '../types.js'
import type { FailureSeverity } from './reportAndThrow.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { uploadLogs } from './uploadLogs.js'

type Args = {
  backupDocId?: number | string
  backupLogsId?: number | string
  backupSlug: string
  failureSeverity?: FailureSeverity
  operation: OperationType
  req: PayloadRequest
  shouldFlushLogs?: boolean
  tempFileInfos?: TempFileInfos
  uploadSlug?: string
}

export async function reportBackupStatus({
  backupDocId,
  backupLogsId,
  backupSlug,
  operation,
  req: { payload },
  req,
  shouldFlushLogs,
  tempFileInfos,
  uploadSlug,
}: Args) {
  if (!backupDocId) {
    return
  }

  const hasBackupLogs = typeof backupLogsId === 'number' || typeof backupLogsId === 'string'

  let logsDoc: PayloadDoc | undefined = undefined
  if (shouldFlushLogs && !hasBackupLogs && tempFileInfos && uploadSlug) {
    logsDoc = await uploadLogs({
      ...tempFileInfos.logsFileInfo,
      operation,
      payload,
      req,
      uploadSlug,
    })
  }

  return payload.update({
    id: backupDocId,
    collection: backupSlug,
    data: {
      backupLogs: hasBackupLogs ? backupLogsId : logsDoc?.id,
      status: BackupStatus.FAILURE,
    },
    req,
  })
}
