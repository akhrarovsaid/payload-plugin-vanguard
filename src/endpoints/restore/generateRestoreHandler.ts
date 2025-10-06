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
import { createBackupService } from '../../adapters/backupService/create.js'
import { runAfterErrorHooks } from '../../hooks/runErrorHooks.js'
import { OperationType } from '../../utilities/operationType.js'

export type RestoreHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig?: VanguardPluginConfig
}

export type RestoreHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateRestoreHandler = ({
  backupCollection,
  pluginConfig = {},
}: RestoreHandlerArgs): PayloadHandler => {
  return async (req) => {
    const backupSlug = backupCollection.slug
    const operation = OperationType.RESTORE
    const payload = req.payload
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

    if (!req.json) {
      const message = req.t('error:missingRequiredData')
      payload.logger.error(message)
      return Response.json({ message }, { headers, status: httpStatus.BAD_REQUEST })
    }

    const { id } = (await req.json()) as { id?: number | string }
    if (typeof id !== 'string' && typeof id !== 'number') {
      const message = req.t('error:missingIDOfDocument')
      payload.logger.error(message)
      return Response.json({ message }, { headers, status: httpStatus.BAD_REQUEST })
    }

    const backupService = createBackupService(req)

    try {
      const doc = await backupService.restore({
        id,
        backupSlug,
        operation,
        pluginConfig,
        req,
      })

      return Response.json(
        {
          doc,
          message: t('version:restoredSuccessfully'),
        },
        { headers, status: httpStatus.OK },
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
