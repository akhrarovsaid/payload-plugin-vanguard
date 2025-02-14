import type { CollectionConfig } from 'payload'

export type CollectionOverrideArgs = {
  collection: CollectionConfig
}

export type VanguardPluginConfig = {
  /**
   * List of collections to add a custom field
   */
  disabled?: boolean
  overrideBackupCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  overrideUploadCollection?: (args: CollectionOverrideArgs) => CollectionConfig
  routes?: {
    backup?: string
    restore?: string
  }
}
