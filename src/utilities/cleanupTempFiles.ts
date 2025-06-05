import type { BasePayload } from 'payload'

import fs from 'fs'

export async function cleanupTempFiles(payload: BasePayload, ...tmpFilePaths: string[]) {
  for (let i = 0; i < tmpFilePaths.length; i++) {
    const tmpFilePath = tmpFilePaths[i]
    try {
      await fs.promises.unlink(tmpFilePath)
    } catch (_err) {
      const err = _err as Error
      payload.logger.warn(err, `Failed to delete temp file: ${tmpFilePath}`)
    }
  }
}
