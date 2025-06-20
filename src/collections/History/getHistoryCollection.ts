import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { auditDateField } from '../../fields/auditDateField.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { OperationType } from '../../utilities/operationType.js'
import { defaultHistorySlug, defaultUserSlug } from '../shared.js'
import { getDeleteLogFilesHook } from './hooks/getDeleteLogFilesHook.js'

export const getHistoryCollection = ({
  config,
  pluginConfig,
  uploadCollection,
}: {
  config: Config
  pluginConfig: VanguardPluginConfig
  uploadCollection: CollectionConfig
}): CollectionConfig => {
  const { debug, overrideHistoryCollection } = pluginConfig

  const userSlug = config.admin?.user ?? defaultUserSlug
  const uploadSlug = uploadCollection.slug

  const deleteLogFilesHook = getDeleteLogFilesHook({ uploadSlug })

  const collection: CollectionConfig = {
    slug: defaultHistorySlug,
    access: {
      create: () => Boolean(debug),
      delete: () => Boolean(debug),
      update: () => Boolean(debug),
    },
    admin: {
      defaultColumns: ['user', 'method', 'operation', 'status', 'logs', 'startedAt', 'completedAt'],
      hidden: !debug,
    },
    disableDuplicate: true,
    fields: [
      {
        name: 'user',
        type: 'relationship',
        admin: {
          components: {
            Cell: {
              path: 'payload-plugin-vanguard/rsc#LinkCell',
              serverProps: {
                labelPath: 'email',
              },
            },
          },
          readOnly: true,
        },
        relationTo: userSlug,
      },
      {
        name: 'method',
        type: 'select',
        admin: {
          components: {
            Cell: {
              path: 'payload-plugin-vanguard/rsc#PillCell',
            },
          },
          readOnly: true,
        },
        defaultValue: BackupMethod.MANUAL,
        options: [BackupMethod.MANUAL, BackupMethod.AUTO],
      },
      {
        name: 'operation',
        type: 'select',
        admin: {
          components: {
            Cell: {
              path: 'payload-plugin-vanguard/rsc#PillCell',
            },
          },
          readOnly: true,
        },
        defaultValue: OperationType.RESTORE,
        options: [OperationType.BACKUP, OperationType.RESTORE],
      },
      {
        name: 'status',
        type: 'select',
        admin: {
          components: {
            Cell: {
              path: 'payload-plugin-vanguard/rsc#PillCell',
              serverProps: {
                pillStyleMap: {
                  [BackupStatus.FAILURE]: 'error',
                  [BackupStatus.IN_PROGRESS]: 'warning',
                  [BackupStatus.SUCCESS]: 'success',
                },
              },
            },
          },
          readOnly: true,
        },
        defaultValue: BackupStatus.IN_PROGRESS,
        options: [BackupStatus.SUCCESS, BackupStatus.FAILURE, BackupStatus.IN_PROGRESS],
      },
      {
        name: 'logs',
        type: 'upload',
        admin: {
          components: {
            Cell: {
              path: 'payload-plugin-vanguard/rsc#LinkCell',
              serverProps: {
                label: 'See Logs',
              },
            },
          },
          readOnly: true,
        },
        relationTo: uploadSlug,
      },
      {
        name: 'runId',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
      auditDateField({ name: 'startedAt' }),
      auditDateField({ name: 'completedAt' }),
    ],
    hooks: {
      beforeDelete: [deleteLogFilesHook],
    },
  }

  if (typeof overrideHistoryCollection === 'function') {
    return overrideHistoryCollection({ collection })
  }

  return collection
}
