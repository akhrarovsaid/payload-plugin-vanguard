import type { CollectionConfig, Config } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { auditDateField } from '../../fields/auditDateField.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { OperationType } from '../../utilities/operationType.js'
import { defaultUserSlug } from '../shared.js'

export const getHistoryCollection = ({
  config,
  pluginConfig,
}: {
  config: Config
  pluginConfig: VanguardPluginConfig
}): CollectionConfig => {
  const { overrideHistoryCollection } = pluginConfig

  const userSlug = config.admin?.user ?? defaultUserSlug

  const collection: CollectionConfig = {
    slug: 'vanguard-history',
    access: {
      create: () => false,
    },
    admin: {
      defaultColumns: [defaultUserSlug, 'operation', 'status', 'startedAt', 'completedAt'],
      hidden: !pluginConfig.debug,
    },
    disableDuplicate: true,
    fields: [
      {
        name: defaultUserSlug,
        type: 'relationship',
        admin: {
          readOnly: true,
        },
        relationTo: userSlug,
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
      auditDateField({ name: 'startedAt' }),
      auditDateField({ name: 'completedAt' }),
    ],
  }

  if (typeof overrideHistoryCollection === 'function') {
    return overrideHistoryCollection({ collection })
  }

  return collection
}
