import { runBeforeErrorHooks } from 'hooks/runErrorHooks.js'
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'

import type { VanguardPluginConfig } from '../../../types.js'
import type { OperationType } from '../../../utilities/operationType.js'
import type { TempFileInfos } from '../types.js'

import { cleanup } from './cleanup.js'
import { logMessage } from './logMessage.js'
import { reportBackupStatus } from './reportBackupStatus.js'

export type FailureSeverity = {
  logLevel: 'error' | 'info' | 'warn'
  shouldThrow: boolean
}

export type ReportAndThrowArgs = {
  backupDocId?: number | string
  backupLogsId?: number | string
  backupSlug: string
  failureSeverity?: FailureSeverity
  operation: OperationType
  pluginConfig: VanguardPluginConfig
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
  message?: string
}

const defaultSeverity: FailureSeverity = {
  logLevel: 'error',
  shouldThrow: true,
}

export async function reportAndThrow({
  error,
  failureSeverity = defaultSeverity,
  message,
  operation,
  pluginConfig,
  req: { payload, t },
  req: reqFromProps,
  shouldCleanup,
  tempFileInfos,
  ...rest
}: ReportAndThrowArgs & ReportAndThrowErrorData): Promise<void> {
  const req = { payload }
  await initTransaction(req)

  logMessage({ error, failureSeverity, message, payload })

  try {
    await reportBackupStatus({
      operation,
      pluginConfig,
      req: { ...reqFromProps, ...req },
      tempFileInfos,
      ...rest,
    })

    await commitTransaction(req)

    if (shouldCleanup) {
      await cleanup({ payload, tempFileInfos })
    }
  } catch (_err) {
    await killTransaction(req)
    payload.logger.error(_err, t('error:noFilesUploaded'))
  }

  if (!failureSeverity.shouldThrow) {
    return
  }

  const hookReq = { payload }
  await initTransaction(hookReq)
  try {
    await runBeforeErrorHooks({
      error,
      operation,
      pluginConfig,
      req: { ...reqFromProps, ...hookReq },
    })
  } catch (_err) {
    await killTransaction(hookReq)
    payload.logger.error(_err, t('error:unknown'))
  }

  throw error
}
