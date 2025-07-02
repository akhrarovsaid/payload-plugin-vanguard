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
import { OperationType } from '../../utilities/operationType.js'

export type BackupHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  historyCollection: CollectionConfig
  pluginConfig?: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

export type BackupHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateBackupHandler = ({
  backupCollection,
  historyCollection,
  pluginConfig = {},
  uploadCollection,
}: BackupHandlerArgs): PayloadHandler => {
  return async (req) => {
    const backupSlug = backupCollection.slug
    const historySlug = historyCollection.slug
    const uploadSlug = uploadCollection.slug
    const operation = OperationType.BACKUP
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    const { hasAccess, message } = await executeAccess({ backupSlug, operation, req, uploadSlug })
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
        historySlug,
        operation,
        pluginConfig,
        req,
        uploadSlug,
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
      const err = _err as Error
      return Response.json(
        { message: err.message },
        { headers, status: httpStatus.INTERNAL_SERVER_ERROR },
      )
    }
  }
}
