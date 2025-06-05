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

export type BackupHandlerArgs = {
  backupCollection: CollectionConfig
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}

export type BackupHandlerResponse = {
  doc?: JsonObject & TypeWithID
  message: string
}

export const generateBackupHandler = ({
  backupCollection,
  pluginConfig,
  uploadCollection,
}: BackupHandlerArgs): PayloadHandler => {
  return async (req) => {
    const backupSlug = backupCollection.slug
    const uploadSlug = uploadCollection.slug
    const t = req.t

    const headers = headersWithCors({ headers: new Headers(), req })

    if (!req.user) {
      return Response.json(
        { message: t('error:unauthorized') },
        { headers, status: httpStatus.UNAUTHORIZED },
      )
    }

    // TODO: check for 'backup' access
    // TODO: implement pluginConfig.access?.backup

    const backupService = createBackupService(req)

    try {
      const doc = await backupService.backup({
        backupSlug,
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
