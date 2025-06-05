import type { BasePayload, PayloadRequest } from 'payload'

import fs from 'fs'

import type { PayloadDoc } from '../types.js'

export async function uploadLogs({
  filename,
  path,
  payload,
  req,
  uploadSlug,
}: {
  filename: string
  path: string
  payload: BasePayload
  req: PayloadRequest
  uploadSlug: string
}): Promise<PayloadDoc | undefined> {
  let logsDoc: PayloadDoc | undefined
  try {
    const logBuffer = await fs.promises.readFile(path)

    logsDoc = await payload.create({
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
  } catch (_err) {
    payload.logger.warn(_err, `Failed to read/upload log file during error handling`)
  }
  return logsDoc
}
