import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { auditDateField } from '../../fields/auditDateField.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { OperationType } from '../../utilities/operationType.js'
import { defaultUserSlug } from '../shared.js'

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

  const collection: CollectionConfig = {
    slug: 'vanguard-history',
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
      {
        name: 'operation',
        type: 'select',
        admin: {
          readOnly: true,
        },
        defaultValue: OperationType.RESTORE,
        options: [OperationType.BACKUP, OperationType.RESTORE],
      },
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
        name: 'logs',
        type: 'upload',
        admin: {
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
  }

  if (typeof overrideHistoryCollection === 'function') {
    return overrideHistoryCollection({ collection })
  }

  return collection
}
