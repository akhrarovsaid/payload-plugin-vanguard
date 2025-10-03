import type { CollectionConfig } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { defaultBackupSlug } from '../../collections/shared.js'
import { defaultBackupEndpointPath } from '../../endpoints/backup/defaults.js'
import { defaultRestoreEndpointPath } from '../../endpoints/restore/defaults.js'
import { logsField } from '../../fields/logsField.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { OperationType } from '../../utilities/operationType.js'
import { getDeleteBackupFileHook } from './hooks/getDeleteBackupFileHook.js'

export const getBackupCollection = ({
  pluginConfig = {},
  uploadCollection,
}: {
  pluginConfig?: VanguardPluginConfig
  uploadCollection: CollectionConfig
}): CollectionConfig => {
  const { overrideBackupCollection } = pluginConfig
  const uploadSlug = uploadCollection.slug

  const deleteBackupFileHook = getDeleteBackupFileHook({ uploadSlug })

  let collection: CollectionConfig = {
    slug: defaultBackupSlug,
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
      defaultColumns: ['createdAt', 'status', 'method', 'completedAt', 'restoredAt'],
      listSearchableFields: ['createdAt', 'status', 'method'],
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
        type: 'group',
        fields: [
          logsField({ name: 'backupLogs', label: 'Backup Logs', uploadSlug }),
          logsField({ name: 'restoreLogs', label: 'Restore Logs', uploadSlug }),
        ],
        label: 'Logs',
      },
      {
        type: 'group',
        admin: {
          hidden: !pluginConfig.debug,
        },
        fields: [
          {
            name: 'status',
            type: 'select',
            admin: {
              components: {
                Cell: 'payload-plugin-vanguard/rsc#StatusBarCell',
              },
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
            defaultValue: BackupStatus.IN_PROGRESS,
            options: [BackupStatus.SUCCESS, BackupStatus.FAILURE, BackupStatus.IN_PROGRESS],
          },
          {
            name: 'method',
            type: 'select',
            admin: {
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
            defaultValue: BackupMethod.MANUAL,
            options: [BackupMethod.MANUAL, BackupMethod.AUTO],
          },
          {
            name: 'latestRunId',
            type: 'text',
            admin: {
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
          },
          {
            name: 'latestRunOperation',
            type: 'select',
            admin: {
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
            defaultValue: OperationType.BACKUP,
            options: [OperationType.BACKUP, OperationType.RESTORE],
          },
        ],
        label: 'Debug',
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
    collection = overrideBackupCollection({ collection })
  }

  return collection
}
