import type { CollectionConfig, JsonObject, PayloadRequest, TypeWithID } from 'payload'

import type { GenerateFilenameFn } from './adapters/backupService/types.js'
import type { OperationType } from './utilities/operationType.js'

export type CollectionOverrideArgs = {
  collection: CollectionConfig
}

export type VanguardBeforeOperationArgs = {
  args: JsonObject
  operation: OperationType
  req: PayloadRequest
}
export type VanguardBeforeOperationHook = (
  args: VanguardBeforeOperationArgs,
) => JsonObject | Promise<JsonObject>

export type VanguardAfterOperationArgs = {
  data: JsonObject
  operation: OperationType
  req: PayloadRequest
}
export type VanguardAfterOperationHook = (args: VanguardAfterOperationArgs) => Promise<void> | void

export type VanguardPluginConfig = {
  debug?: boolean
  disabled?: boolean
  generateFilename?: GenerateFilenameFn
  hooks?: {
    afterOperation?: Array<VanguardAfterOperationHook>
    beforeOperation?: Array<VanguardBeforeOperationHook>
  }
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideHistoryCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}

export type PayloadDoc = JsonObject & TypeWithID
