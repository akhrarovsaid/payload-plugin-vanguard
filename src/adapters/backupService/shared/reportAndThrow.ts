import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'

import type { OperationType } from '../../../utilities/operationType.js'
import type { PayloadDoc, TempFileInfos } from '../types.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { cleanup } from './cleanup.js'
import { uploadLogs } from './uploadLogs.js'

export type FailureSeverity = {
  logLevel: 'error' | 'info' | 'warn'
  shouldThrow: boolean
}

export type ReportAndThrowArgs = {
  backupDocId?: number | string
  backupLogsId?: number | string
  backupSlug: string
  falureSeverity?: FailureSeverity
  operation: OperationType
  req: PayloadRequest
  shouldCleanup?: boolean
  uploadSlug?: string
} & (
  | {
      shouldFlushLogs: true
      tempFileInfos: TempFileInfos
    }
  | {
      shouldFlushLogs?: false | undefined
      tempFileInfos?: never
    }
)

type ReportAndThrowErrorData = {
  error: unknown
  message: string
}

// TODO thread failureSeverity through to consumers
export async function reportAndThrow({
  backupDocId,
  backupLogsId,
  backupSlug,
  error,
  falureSeverity = { logLevel: 'error', shouldThrow: true },
  message,
  operation,
  req: { payload, t },
  shouldCleanup,
  shouldFlushLogs,
  tempFileInfos,
  uploadSlug,
}: ReportAndThrowArgs & ReportAndThrowErrorData): Promise<void> {
  const { logLevel, shouldThrow } = falureSeverity

  const hasBackupLogs = typeof backupLogsId === 'number' || typeof backupLogsId === 'string'

  const req = { payload }
  await initTransaction(req)

  const log = payload.logger[logLevel]
  log(error, message)

  if (backupDocId) {
    try {
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

      await payload.update({
        id: backupDocId,
        collection: backupSlug,
        data: {
          backupLogs: hasBackupLogs ? backupLogsId : logsDoc?.id,
          status: BackupStatus.FAILURE,
        },
        req,
      })

      await commitTransaction(req)
    } catch (_err) {
      await killTransaction(req)
      payload.logger.error(_err, t('error:noFilesUploaded'))
    }
  }

  if (shouldCleanup && tempFileInfos) {
    await cleanup({ payload, tempFileInfos })
  }

  if (shouldThrow) {
    throw error
  }
}
