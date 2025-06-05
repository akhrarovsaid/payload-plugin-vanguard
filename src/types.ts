import type { Access, CollectionConfig, JsonObject, TypeWithID } from 'payload'

import type { GenerateFilenameFn } from './adapters/backupService/types.js'

export type CollectionOverrideArgs = {
  collection: CollectionConfig
}

export type VanguardPluginConfig = {
  access?: {
    backup?: Access
    restore?: Access
  }
  debug?: boolean
  disabled?: boolean
  generateFilename?: GenerateFilenameFn
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}

export type PayloadDoc = JsonObject & TypeWithID
