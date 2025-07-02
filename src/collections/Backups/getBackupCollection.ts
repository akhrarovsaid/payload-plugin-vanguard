import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import {
  defaultArchiveFieldName,
  defaultBackupSlug,
  defaultUserSlug,
} from '../../collections/shared.js'
import { defaultBackupEndpointPath } from '../../endpoints/backup/defaults.js'
import { defaultRestoreEndpointPath } from '../../endpoints/restore/defaults.js'
import { auditDateField } from '../../fields/auditDateField.js'
import { logsField } from '../../fields/logsField.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { OperationType } from '../../utilities/operationType.js'
import { getDeleteBackupFileHook } from './hooks/getDeleteBackupFileHook.js'
import { getDeleteHistoryHook } from './hooks/getDeleteHistoryHook.js'
import { getPushHistoryHook } from './hooks/getPushHistoryHook.js'
import { getUpdateHistoryHook } from './hooks/getUpdateHistoryHook.js'

export const getBackupCollection = ({
  config,
  historyCollection,
  pluginConfig = {},
  uploadCollection,
}: {
  config: Config
  historyCollection: CollectionConfig
  pluginConfig?: VanguardPluginConfig
  uploadCollection: CollectionConfig
}): CollectionConfig => {
  const { overrideBackupCollection } = pluginConfig

  const userSlug = config.admin?.user ?? defaultUserSlug
  const uploadSlug = uploadCollection.slug
  const historySlug = historyCollection.slug
  const archiveFieldName = defaultArchiveFieldName

  const pushHistoryHook = getPushHistoryHook({ historySlug })
  const updateHistoryHook = getUpdateHistoryHook({ historySlug })
  const deleteBackupFileHook = getDeleteBackupFileHook({ uploadSlug })
  const deleteHistoryHook = getDeleteHistoryHook({ archiveFieldName, historySlug })

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
      defaultColumns: [
        'createdAt',
        'status',
        'method',
        'initiatedBy',
        'completedAt',
        'restoredBy',
        'restoredAt',
      ],
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
              {
                type: 'group',
                fields: [
                  {
                    name: 'history',
                    type: 'join',
                    admin: {
                      allowCreate: false,
                      disableListColumn: true,
                    },
                    collection: historySlug,
                    label: false,
                    on: archiveFieldName,
                  },
                ],
                label: 'History',
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
      afterChange: [pushHistoryHook],
      afterDelete: [deleteBackupFileHook],
      beforeChange: [updateHistoryHook],
      beforeDelete: [deleteHistoryHook],
    },
    labels: {
      plural: 'Database Backups',
      singular: 'Database Backup',
    },
  }

  if (typeof overrideBackupCollection === 'function') {
    collection = overrideBackupCollection({ collection })
  }

  historyCollection.fields.push({
    name: archiveFieldName,
    type: 'relationship',
    admin: {
      readOnly: true,
    },
    relationTo: collection.slug,
  })

  return collection
}
