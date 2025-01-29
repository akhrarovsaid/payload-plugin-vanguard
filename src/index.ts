import type { Config } from 'payload'

import type { VanguardPluginConfig } from './types.js'

import { getBackupCollection } from './getBackupCollection.js'

export const vanguardPlugin =
  (pluginConfig: VanguardPluginConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    const backupCollection = getBackupCollection({ config, pluginConfig })

    config.collections.push(backupCollection)

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginConfig.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push({
      handler: () => {
        return Response.json({ message: 'Hello from custom endpoint' })
      },
      method: 'get',
      path: '/my-plugin-endpoint',
    })

    return config
  }
