import type { BasePayload, PayloadRequest } from 'payload'

import fs from 'fs'

import type { OperationType } from '../../../utilities/operationType.js'
import type { PayloadDoc } from '../types.js'

import { capitalize } from '../../../utilities/capitalize.js'

type Args = {
  filename: string
  operation: OperationType
  path: string
  payload: BasePayload
  req: Partial<PayloadRequest>
  uploadSlug: string
}

export async function uploadLogs({
  filename,
  operation,
  path,
  payload,
  req,
  uploadSlug,
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

  if (!logBuffer) {
    return
  }

  try {
    return payload.create({
      collection: uploadSlug,
      data: {},
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
