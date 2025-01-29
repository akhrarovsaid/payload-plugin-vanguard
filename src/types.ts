import type { CollectionConfig } from 'payload'

export type VanguardPluginConfig = {
  /**
   * List of collections to add a custom field
   */
  disabled?: boolean
  overrideBackupCollection?: (collection: CollectionConfig) => CollectionConfig
}
