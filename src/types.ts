import type { Access, CollectionConfig, JsonObject, TypeWithID } from 'payload'

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
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}

export type PayloadDoc = JsonObject & TypeWithID
