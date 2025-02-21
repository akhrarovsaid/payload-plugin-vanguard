import type { Access, CollectionConfig } from 'payload'

export type CollectionOverrideArgs = {
  collection: CollectionConfig
}

export type VanguardPluginConfig = {
  access?: {
    backup?: Access
    restore?: Access
  }
  disabled?: boolean
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}
