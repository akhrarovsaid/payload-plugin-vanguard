import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { defaultBackupEndpointPath } from '../../endpoints/backup/defaults.js'
import { defaultRestoreEndpointPath } from '../../endpoints/restore/defaults.js'
import { auditDateField } from '../../fields/auditDateField.js'
import { logsField } from '../../fields/logsField.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { getDeleteBackupFileHook } from './hooks/getDeleteBackupFileHook.js'
import { getDeleteLogFilesHook } from './hooks/getDeleteLogFilesHook.js'

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
  const deleteLogFilesHook = getDeleteLogFilesHook({ uploadSlug })

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
      defaultColumns: [
        'createdAt',
        'status',
        'method',
        'initiatedBy',
        'completedAt',
        'restoredBy',
        'restoredAt',
      ],
      hidden: pluginConfig.disabled,
      listSearchableFields: ['createdAt', 'initiatedBy', 'restoredBy', 'status', 'method'],
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
                type: 'group',
                fields: [
                  {
                    type: 'row',
                    fields: [
                      auditDateField({ name: 'completedAt' }),
                      {
                        name: 'initiatedBy',
                        type: 'relationship',
                        admin: {
                          readOnly: true,
                        },
                        relationTo: userSlug,
                      },
                    ],
                  },
                ],
                label: 'Backup Audit',
              },
              {
                type: 'group',
                fields: [
                  {
                    type: 'row',
                    fields: [
                      auditDateField({ name: 'restoredAt' }),
                      {
                        name: 'restoredBy',
                        type: 'relationship',
                        admin: {
                          readOnly: true,
                        },
                        relationTo: userSlug,
                      },
                    ],
                  },
                ],
                label: 'Latest Restore Audit',
              },
            ],
            label: 'Details',
          },
          {
            fields: [
              logsField({ name: 'backupLogs', label: 'Backup Logs', uploadSlug }),
              logsField({ name: 'restoreLogs', label: 'Restore Logs', uploadSlug }),
            ],
            label: 'Logs',
          },
        ],
      },
      {
        name: 'status',
        type: 'select',
        admin: {
          components: {
            Cell: 'payload-plugin-vanguard/rsc#StatusBarCell',
          },
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
      afterDelete: [deleteBackupFileHook, deleteLogFilesHook],
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
