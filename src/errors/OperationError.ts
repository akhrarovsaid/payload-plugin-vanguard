import type { BaseErrorArgs } from './VanguardPluginError.js'

import { VanguardPluginError } from './VanguardPluginError.js'

type Args = {
  backupSlug: string
  operation: string
} & BaseErrorArgs

export class OperationError extends VanguardPluginError {
  constructor({ backupSlug, operation, options }: Args) {
    super({
      message: `${operation} error: failed to execute operation for backup "${backupSlug}"`,
      options,
    })
    this.name = 'OperationError'
  }
}
