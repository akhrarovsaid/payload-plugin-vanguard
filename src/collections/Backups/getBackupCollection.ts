import type { CollectionConfig } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { defaultBackupEndpointPath } from '../../endpoints/backup/defaults.js'
import { defaultRestoreEndpointPath } from '../../endpoints/restore/defaults.js'
import { BackupMethod } from '../../utilities/backupMethod.js'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { UploadTypes } from '../../utilities/uploadTypes.js'
import { getDeleteBackupFileHook } from './hooks/getDeleteBackupFileHook.js'

export const defaultBackupSlug = 'vanguard-backups'

export const getBackupCollection = ({
  pluginConfig = {},
}: {
  pluginConfig?: VanguardPluginConfig
}): CollectionConfig => {
  const { overrideBackupCollection } = pluginConfig
  const backupSlug = defaultBackupSlug

  const deleteBackupFileHook = getDeleteBackupFileHook({ backupSlug })

  let collection: CollectionConfig = {
    slug: backupSlug,
    admin: {
      /* baseFilter: () => ({
        type: {
          equals: 'backup',
        },
      }), */
      components: {
        edit: {
          SaveButton: {
            path: 'payload-plugin-vanguard/rsc#OperationButton',
            serverProps: {
              backupEndpointRoute: pluginConfig.routes?.backup ?? defaultBackupEndpointPath,
              restoreEndpointRoute: pluginConfig.routes?.restore ?? defaultRestoreEndpointPath,
            },
          },
        },
      },
      defaultColumns: ['createdAt', 'status', 'method'],
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
            name: 'type',
            type: 'select',
            admin: {
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
            defaultValue: UploadTypes.BACKUP,
            options: [UploadTypes.BACKUP, UploadTypes.LOGS],
          },
          {
            name: 'parent',
            type: 'relationship',
            admin: {
              hidden: !pluginConfig.debug,
              readOnly: true,
            },
            relationTo: backupSlug,
          },
        ],
        label: 'Debug',
      },
    ],
    hooks: {
      beforeDelete: [deleteBackupFileHook],
    },
    labels: {
      plural: 'Database Backups',
      singular: 'Database Backup',
    },
    upload: {
      bulkUpload: false,
      crop: false,
      filesRequiredOnCreate: false,
      hideFileInputOnCreate: true,
      hideRemoveFile: true,
      pasteURL: false,
    },
  }

  if (typeof overrideBackupCollection === 'function') {
    collection = overrideBackupCollection({ collection })
  }

  collection.fields.push(
    {
      type: 'group',
      admin: {
        condition: (data, _, { operation }) =>
          data.type === UploadTypes.BACKUP && operation !== 'create',
      },
      fields: [
        {
          name: 'logs',
          type: 'join',
          admin: {
            allowCreate: false,
            components: {
              Field: {
                path: 'payload-plugin-vanguard/rsc#LogsTable',
                serverProps: {
                  backupSlug: collection.slug,
                },
              },
            },
            defaultColumns: ['filename', 'filesize', 'mimeType', 'createdAt'],
            disableListColumn: true,
            disableListFilter: true,
          },
          collection: collection.slug,
          label: false,
          on: 'parent',
        },
      ],
      label: 'Logs',
    },
    {
      name: 'logsViewer',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: 'payload-plugin-vanguard/rsc#LogsField',
            serverProps: {
              backupSlug: collection.slug,
            },
          },
        },
      },
    },
  )

  return collection
}
