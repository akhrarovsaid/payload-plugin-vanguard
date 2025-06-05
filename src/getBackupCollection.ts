import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from './types.js'

import { defaultBackupEndpointPath } from './endpoints/backup/defaults.js'
import { defaultRestoreEndpointPath } from './endpoints/restore/defaults.js'
import { getLogsField } from './fields/getLogsField.js'
import { getDeleteBackupFileHook } from './hooks/getDeleteBackupFileHook.js'
import { BackupMethod } from './utilities/backupMethod.js'
import { BackupStatus } from './utilities/backupStatus.js'

export const getBackupCollection = ({
  config,
  pluginConfig,
  uploadCollection,
}: {
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}): CollectionConfig => {
  const { overrideBackupCollection } = pluginConfig

  const userSlug = config.admin?.user ?? 'users'
  const uploadSlug = uploadCollection.slug

  const deleteBackupFileHook = getDeleteBackupFileHook({ uploadSlug })

  const collection: CollectionConfig = {
    slug: 'vanguard-backups',
    access: {
      create: () => false,
    },
    admin: {
      components: {
        edit: {
          SaveButton: {
            path: 'payload-plugin-vanguard/rsc#RestoreButton',
            serverProps: {
              restoreEndpointPath: pluginConfig.routes?.restore ?? defaultRestoreEndpointPath,
            },
          },
        },
        views: {
          list: {
            actions: [
              {
                path: 'payload-plugin-vanguard/rsc#CreateBackupAction',
                serverProps: {
                  backupEndpointPath: pluginConfig.routes?.backup ?? defaultBackupEndpointPath,
                },
              },
            ],
          },
        },
      },
      hidden: pluginConfig.disabled,
      useAsTitle: 'createdAt',
    },
    disableDuplicate: true,
    fields: [
      {
        name: 'statusBar',
        type: 'ui',
        admin: {
          components: {
            Field: 'payload-plugin-vanguard/rsc#StatusBar',
          },
          disableListColumn: true,
        },
      },
      {
        name: 'backup',
        type: 'upload',
        admin: {
          condition: (data) => data.backup,
          readOnly: true,
        },
        relationTo: uploadSlug,
      },
      {
        type: 'tabs',
        tabs: [
          {
            fields: [
              {
                name: 'completedAt',
                type: 'date',
                admin: {
                  date: {
                    displayFormat: 'PPPppp',
                  },
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
                name: 'restoredAt',
                type: 'date',
                admin: {
                  date: {
                    displayFormat: 'PPPppp',
                  },
                  readOnly: true,
                },
              },
              {
                name: 'restoredBy',
                type: 'relationship',
                admin: {
                  readOnly: true,
                },
                relationTo: userSlug,
              },
            ],
            label: 'Details',
          },
          {
            fields: [
              {
                type: 'collapsible',
                fields: [getLogsField({ name: 'backupLogs', uploadSlug })],
                label: 'Backup Logs',
              },
              {
                type: 'collapsible',
                fields: [getLogsField({ name: 'restoreLogs', uploadSlug })],
                label: 'Restore Logs',
              },
            ],
            label: 'Logs',
          },
        ],
      },
      {
        name: 'status',
        type: 'select',
        admin: {
          hidden: true,
          readOnly: true,
        },
        defaultValue: BackupStatus.IN_PROGRESS,
        options: [BackupStatus.SUCCESS, BackupStatus.FAILURE, BackupStatus.IN_PROGRESS],
      },
      {
        name: 'method',
        type: 'select',
        admin: {
          hidden: true,
          readOnly: true,
        },
        defaultValue: BackupMethod.MANUAL,
        options: [BackupMethod.MANUAL, BackupMethod.AUTO],
      },
    ],
    hooks: {
      afterDelete: [deleteBackupFileHook],
    },
    labels: {
      plural: 'Database Backups',
      singular: 'Database Backup',
    },
  }

  if (typeof overrideBackupCollection === 'function') {
    return overrideBackupCollection({ collection })
  }

  return collection
}
