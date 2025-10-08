import type { CollectionConfig, JsonObject, PayloadRequest, TaskConfig, TypeWithID } from 'payload'

import type { GenerateFilenameFn } from './adapters/backup/types.js'
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

export type VanguardErrorHookArgs = {
  error: unknown
  operation: OperationType
  req: PayloadRequest
}
export type VanguardBeforeErrorHook = (args: VanguardErrorHookArgs) => Promise<void> | void
export type VanguardAfterErrorHook = (args: VanguardErrorHookArgs) => Promise<void> | void

export type VanguardPluginConfig = {
  debug?: boolean
  disabled?: boolean
  generateFilename?: GenerateFilenameFn
  hooks?: {
    afterError?: Array<VanguardAfterErrorHook>
    afterOperation?: Array<VanguardAfterOperationHook>
    beforeError?: Array<VanguardBeforeErrorHook>
    beforeOperation?: Array<VanguardBeforeOperationHook>
  }
  jobs?:
    | {
        overrideBackupTask?: (args: TaskConfig) => TaskConfig
      }
    | boolean
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideHistoryCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}

export type PayloadDoc = JsonObject & TypeWithID
