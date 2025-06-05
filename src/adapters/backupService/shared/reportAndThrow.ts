import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'

import type { PayloadDoc, TempFileInfos } from '../types.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { cleanup } from './cleanup.js'
import { flushLogs } from './flushLogs.js'

type Args = {
  backupDocId?: number | string
  backupLogsId?: number | string
  backupSlug: string
  error: unknown
  message: string
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

export async function reportAndThrow({
  backupDocId,
  backupLogsId,
  backupSlug,
  error,
  message,
  req: { i18n, payload },
  shouldCleanup,
  shouldFlushLogs,
  tempFileInfos,
  uploadSlug,
}: Args): Promise<never> {
  const hasBackupLogs = typeof backupLogsId !== 'undefined'

  const req = { payload }
  await initTransaction(req)

  payload.logger.error(error, message)

  if (backupDocId) {
    try {
      let logsDoc: PayloadDoc | undefined = undefined
      if (shouldFlushLogs && !hasBackupLogs && tempFileInfos && uploadSlug) {
        logsDoc = await flushLogs({
          ...tempFileInfos.logs,
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
      payload.logger.error(_err, i18n.t('error:noFilesUploaded'))
    }
  }

  if (shouldCleanup && tempFileInfos) {
    await cleanup({ payload, tempFileInfos })
  }

  throw new Error(message)
}
