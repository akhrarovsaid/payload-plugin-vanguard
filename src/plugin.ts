import type { Config } from 'payload'

import type { VanguardPluginConfig } from './types.js'

import { getBackupCollection } from './collections/Backups/getBackupCollection.js'
import { getBackupEndpoint } from './endpoints/backup/getBackupEndpoint.js'
import { getRestoreEndpoint } from './endpoints/restore/getRestoreEndpoint.js'

export const vanguardPlugin =
  (pluginConfig?: VanguardPluginConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    const backupCollection = getBackupCollection({
      pluginConfig,
    })

    config.collections.push(backupCollection)

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginConfig?.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push(
      getBackupEndpoint({
        backupCollection,
        config,
        pluginConfig,
      }),
      getRestoreEndpoint({
        backupCollection,
        config,
        pluginConfig,
      }),
    )

    return config
  }
