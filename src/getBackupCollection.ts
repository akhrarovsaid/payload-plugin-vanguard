import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from './types.js'

export const getBackupCollection = ({
  config,
  pluginConfig,
}: {
  config: Config
  pluginConfig: VanguardPluginConfig
}): CollectionConfig => {
  const { overrideBackupCollection } = pluginConfig

  const userSlug = config.admin?.user ?? 'users'

  const collection: CollectionConfig = {
    slug: 'backups',
    access: {
      update: () => false,
    },
    admin: {
      useAsTitle: 'createdAt',
    },
    disableDuplicate: true,
    fields: [
      {
        name: 'status',
        type: 'select',
        admin: {
          readOnly: true,
        },
        options: ['success', 'failed', 'inProgress'],
      },
      {
        name: 'size',
        type: 'number',
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'completedAt',
        type: 'date',
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'initiatedBy',
        type: 'relationship',
        admin: {
          readOnly: true,
        },
        relationTo: userSlug,
      },
      {
        name: 'method',
        type: 'select',
        admin: {
          readOnly: true,
        },
        defaultValue: 'manual',
        options: ['manual', 'scheduled'],
      },
    ],
    labels: {
      plural: 'Database Backups',
      singular: 'Database Backup',
    },
  }

  if (typeof overrideBackupCollection === 'function') {
    return overrideBackupCollection(collection)
  }

  return collection
}
