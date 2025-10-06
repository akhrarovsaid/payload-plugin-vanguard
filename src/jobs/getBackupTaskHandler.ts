import type { TaskHandler, TaskHandlerArgs } from 'payload'

import { upsertBackupDoc } from 'adapters/backupService/shared/upsertBackupDoc.js'

import type { VanguardPluginConfig } from '../types.js'
import type { VanguardBackupTaskType } from './types.js'

import { executeAccess } from '../access/executeAccess.js'
import { createBackupService } from '../adapters/backupService/create.js'
import { runAfterErrorHooks } from '../hooks/runErrorHooks.js'
import { BackupStatus } from '../utilities/backupStatus.js'
import { OperationType } from '../utilities/operationType.js'

export function getBackupTaskHandler({
  backupSlug,
  pluginConfig,
}: {
  backupSlug: string
  pluginConfig: VanguardPluginConfig
}): TaskHandler<VanguardBackupTaskType> {
  return async ({ req }: TaskHandlerArgs<VanguardBackupTaskType>) => {
    const operation = OperationType.BACKUP

    // TODO:: Add a bypass to this check if valid secret
    const { hasAccess, message } = await executeAccess({ backupSlug, operation, req })
    if (!hasAccess) {
      await upsertBackupDoc({
        backupSlug,
        data: { status: BackupStatus.FAILURE },
        failureSeverity: { logLevel: 'warn', shouldThrow: false },
        operation,
        pluginConfig,
        req,
        user: req.user,
      })

      return {
        errorMessage: message,
        state: 'failed',
      }
    }

    const backupService = createBackupService(req)

    try {
      const doc = await backupService.backup({
        backupSlug,
        operation,
        pluginConfig,
        req,
      })

      return {
        output: {
          doc,
        },
      }
    } catch (_err) {
      const error = _err as Error
      await runAfterErrorHooks({ error, operation, pluginConfig, req })
      return {
        errorMessage: error.message,
        state: 'failed',
      }
    }
  }
}
