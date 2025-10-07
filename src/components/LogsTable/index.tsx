import type { JoinFieldServerProps } from 'payload'
import type { FC } from 'react'

import './index.scss'

import { getTranslation } from '@payloadcms/translations'

import { LogsTableClient } from './index.client.js'

type Props = {} & JoinFieldServerProps

const baseClass = 'vanguard-logs-table'

export const LogsTable: FC<Props> = (props) => {
  const {
    field: { admin: fieldAdmin, label, validate: _, ...fieldData },
    i18n,
    path,
  } = props

  return (
    <div className={baseClass}>
      <LogsTableClient
        field={{
          ...fieldData,
          admin: {
            ...fieldAdmin,
            allowCreate: false,
            defaultColumns: fieldAdmin?.defaultColumns ?? [],
            description: undefined,
            disableBulkEdit: true,
            disableRowTypes: true,
            readOnly: false,
          },
          label: label ? getTranslation(label, i18n) : undefined,
          targetField: { relationTo: 'parent' },
        }}
        path={path}
      />
    </div>
  )
}
