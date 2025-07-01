import type { BaseErrorArgs } from './VanguardPluginError.js'

import { VanguardPluginError } from './VanguardPluginError.js'

type Args = {
  backupSlug: string
} & BaseErrorArgs

export class UploadArchiveError extends VanguardPluginError {
  constructor({ backupSlug, options }: Args) {
    const args = {
      message: `Failed to upload archive for backup: ${backupSlug}`,
      options,
    }

    super(args)
    this.name = 'UploadArchiveError'
  }
}
