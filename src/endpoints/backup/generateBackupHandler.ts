import { status as httpStatus } from 'http-status'
import {
  type CollectionConfig,
  type Config,
  headersWithCors,
  type JsonObject,
  type PayloadHandler,
  type TypeWithID,
} from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { executeAccess } from '../../access/executeAccess.js'
import { createBackupService } from '../../adapters/backup/create.js'
import { runAfterErrorHooks } from '../../hooks/runErrorHooks.js'
import { OperationType } from '../../utilities/operationType.js'

export type BackupHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig?: VanguardPluginConfig
}

export type BackupHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateBackupHandler = ({
  backupCollection,
  pluginConfig = {},
}: BackupHandlerArgs): PayloadHandler => {
  return async (req) => {
    const backupSlug = backupCollection.slug
    const operation = OperationType.BACKUP
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    const { hasAccess, message } = await executeAccess({ backupSlug, operation, req })
    if (!hasAccess) {
      return Response.json(
        {
          message,
        },
        { headers, status: httpStatus.UNAUTHORIZED },
      )
    }

    const backupService = createBackupService(req)

    try {
      const doc = await backupService.backup({
        backupSlug,
        operation,
        pluginConfig,
        req,
      })

      return Response.json(
        {
          doc,
          message: t('general:successfullyCreated', {
            label: backupCollection.labels?.singular,
          }),
        },
        { headers, status: httpStatus.CREATED },
      )
    } catch (_err) {
      const error = _err as Error

      await runAfterErrorHooks({ error, operation, pluginConfig, req })

      return Response.json(
        { message: error.message },
        { headers, status: httpStatus.INTERNAL_SERVER_ERROR },
      )
    }
  }
}
