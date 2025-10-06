import type { BasePayload, PayloadRequest } from 'payload'

import fs from 'fs'

import type { OperationType } from '../../../utilities/operationType.js'
import type { PayloadDoc } from '../types.js'

import { capitalize } from '../../../utilities/capitalize.js'
import { UploadTypes } from '../../../utilities/uploadTypes.js'

type Args = {
  backupDocId?: number | string
  backupSlug: string
  filename: string
  operation: OperationType
  path: string
  payload: BasePayload
  req: Partial<PayloadRequest>
}

export async function uploadLogs({
  backupDocId,
  backupSlug,
  filename,
  operation,
  path,
  payload,
  req,
}: Args): Promise<PayloadDoc | undefined> {
  let logBuffer: Buffer | undefined = undefined
  try {
    logBuffer = await fs.promises.readFile(path)
  } catch (error) {
    // TODO: Translations
    payload.logger.warn(
      error,
      `${capitalize(operation)} error: Failed to read temp log file during error handling`,
    )
  }

  if (!logBuffer || !backupDocId) {
    return
  }

  try {
    return payload.create({
      collection: backupSlug,
      data: {
        type: UploadTypes.LOGS,
        parent: backupDocId,
      },
      file: {
        name: filename,
        data: logBuffer,
        mimetype: 'text/plain',
        size: logBuffer.length,
      },
      req,
    })
  } catch (error) {
    // TODO: Translations
    payload.logger.warn(
      error,
      `${capitalize(operation)} error: Failed to upload temp log file during error handling`,
    )
  }
}
