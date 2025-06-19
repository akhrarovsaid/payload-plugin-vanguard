import type { BasePayload, PayloadRequest } from 'payload'

import fs from 'fs'

import type { PayloadDoc } from '../types.js'

type Args = {
  filename: string
  path: string
  payload: BasePayload
  req: Partial<PayloadRequest>
  uploadSlug: string
}

export async function uploadLogs({
  filename,
  path,
  payload,
  req,
  uploadSlug,
}: Args): Promise<PayloadDoc | undefined> {
  try {
    const logBuffer = await fs.promises.readFile(path)

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
    payload.logger.warn(error, `Failed to read/upload log file during error handling`)
  }
}
