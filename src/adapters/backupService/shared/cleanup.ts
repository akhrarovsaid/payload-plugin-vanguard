import type { BasePayload } from 'payload'

import fs from 'fs'

import type { TempFileInfos } from '../types.js'

export async function cleanup({
  payload,
  tempFileInfos: fileInfosFromProps,
}: {
  payload: BasePayload
  tempFileInfos: TempFileInfos
}) {
  const tempFileInfos = Object.values(fileInfosFromProps || {})
  for (let i = 0; i < tempFileInfos.length; i++) {
    const tempFile = tempFileInfos[i]
    try {
      await fs.promises.unlink(tempFile.path)
    } catch (_err) {
      const err = _err as Error
      payload.logger.warn(err, `Failed to delete temp file: ${tempFile.path}`)
    }
  }
}
