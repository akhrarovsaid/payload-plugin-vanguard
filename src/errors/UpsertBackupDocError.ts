import type { OperationType } from 'utilities/operationType.js'

import { capitalize } from 'utilities/capitalize.js'

import type { BaseErrorArgs } from './VanguardPluginError.js'

import { VanguardPluginError } from './VanguardPluginError.js'

type Args = {
  backupSlug: string
  operation: OperationType
} & BaseErrorArgs

export class UpsertBackupDocError extends VanguardPluginError {
  constructor({ backupSlug, operation, options }: Args) {
    super({
      message: `${capitalize(operation)} error: failed to upsert archive doc in collection "${backupSlug}"`,
      options,
    })
    this.name = 'UpsertBackupDocError'
  }
}
