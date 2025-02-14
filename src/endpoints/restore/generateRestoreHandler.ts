import type { VanguardPluginConfig } from 'src/types.js'

import { status as httpStatus } from 'http-status'
import {
  type CollectionConfig,
  type Config,
  headersWithCors,
  type JsonObject,
  type PayloadHandler,
  type TypeWithID,
} from 'payload'

import { createBackupService } from '../../adapters/backupServiceFactory.js'

export type RestoreHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

export type RestoreHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateRestoreHandler = ({
  backupCollection,
  config,
  pluginConfig,
  uploadCollection,
}: RestoreHandlerArgs): PayloadHandler => {
  const backupSlug = backupCollection.slug
  const uploadSlug = uploadCollection.slug
  return async (req) => {
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    if (!req.user) {
      return Response.json(
        { message: t('error:unauthorized') },
        { headers, status: httpStatus.UNAUTHORIZED },
      )
    }

    // TODO: check for 'restore' access

    const backupService = createBackupService(req)

    try {
      const doc = await backupService.restore({
        backupSlug,
        req,
        uploadSlug,
      })

      return Response.json(
        {
          doc,
          message: 'Successfully restored.',
        },
        { headers, status: httpStatus.OK },
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
