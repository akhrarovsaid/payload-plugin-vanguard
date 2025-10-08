import type { PayloadRequest } from 'payload'
import type { VanguardPluginConfig } from 'types.js'

import type { OperationType } from '../../../utilities/operationType.js'
import type { TempFileInfos } from '../types.js'
import type { FailureSeverity } from './reportAndThrow.js'

import { BackupStatus } from '../../../utilities/backupStatus.js'
import { capitalize } from '../../../utilities/capitalize.js'
import { uploadLogs } from './uploadLogs.js'

type Args = {
  backupDocId?: number | string
  backupLogsId?: number | string
  backupSlug: string
  failureSeverity?: FailureSeverity
  operation: OperationType
  pluginConfig: VanguardPluginConfig
  req: PayloadRequest
  shouldFlushLogs?: boolean
  tempFileInfos?: TempFileInfos
}

export async function reportBackupStatus({
  backupDocId,
  backupLogsId: logsIdFromProps,
  backupSlug,
  operation,
  req: { payload },
  req,
  shouldFlushLogs,
  tempFileInfos,
}: Args) {
  const hasBackupLogs = typeof logsIdFromProps === 'number' || typeof logsIdFromProps === 'string'
  const shouldUploadLogs = shouldFlushLogs && !hasBackupLogs && tempFileInfos

  if (shouldUploadLogs) {
    await uploadLogs({
      ...tempFileInfos.logsFileInfo,
      backupDocId,
      backupSlug,
      operation,
      payload,
      req,
    })
  }

  if (typeof backupDocId === 'undefined') {
    return
  }

  try {
    await payload.update({
      id: backupDocId,
      collection: backupSlug,
      data: {
        status: BackupStatus.FAILURE,
      },
      req,
    })
  } catch (error) {
    // TODO: Translations
    payload.logger.warn(
      error,
      `${capitalize(operation)} error: unable to report ${operation} failure`,
    )
  }
}
