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

import { createBackupService } from '../../adapters/backupService/create.js'

export type RestoreHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  historyCollection: CollectionConfig
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

export type RestoreHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateRestoreHandler = ({
  backupCollection,
  historyCollection,
  pluginConfig,
  uploadCollection,
}: RestoreHandlerArgs): PayloadHandler => {
  return async (req) => {
    const backupSlug = backupCollection.slug
    const historySlug = historyCollection.slug
    const uploadSlug = uploadCollection.slug
    const payload = req.payload
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    if (!req.user) {
      return Response.json(
        { message: t('error:unauthorized') },
        { headers, status: httpStatus.UNAUTHORIZED },
      )
    }

    // TODO: check for 'restore' access

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
        historySlug,
        pluginConfig,
        req,
        uploadSlug,
      })

      return Response.json(
        {
          doc,
          message: t('version:restoredSuccessfully'),
        },
        { headers, status: httpStatus.OK },
      )
    } catch (_err) {
      const err = _err as Error
      payload.logger.error(err)
      return Response.json(
        { message: err.message },
        { headers, status: httpStatus.INTERNAL_SERVER_ERROR },
      )
    }
  }
}
