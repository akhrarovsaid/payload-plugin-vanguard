import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from './types.js'

import { BackupMethod } from './utilities/BackupMethod.js'
import { BackupStatus } from './utilities/BackupStatus.js'

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
      create: () => false,
    },
    admin: {
      components: {
        views: {
          list: {
            actions: ['payload-plugin-vanguard/rsc#CreateBackupAction'],
          },
        },
      },
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
        defaultValue: BackupStatus.IN_PROGRESS,
        options: [BackupStatus.SUCCESS, BackupStatus.FAILURE, BackupStatus.IN_PROGRESS],
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
        defaultValue: BackupMethod.MANUAL,
        options: [BackupMethod.MANUAL, BackupMethod.AUTO],
      },
    ],
    labels: {
      plural: 'Database Backups',
      singular: 'Database Backup',
    },
    upload: {
      bulkUpload: false,
      crop: false,
      mimeTypes: ['application/octet-stream'],
      pasteURL: false,
    },
  }

  if (typeof overrideBackupCollection === 'function') {
    return overrideBackupCollection(collection)
  }

  return collection
}
