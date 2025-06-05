import type { FC } from 'react'

import { Pill } from '@payloadcms/ui'

import { BackupStatus } from '../../utilities/backupStatus.js'
import { capitalize } from '../../utilities/capitalize.js'

type Props = {
  status: BackupStatus
}

export const StatusPill: FC<Props> = (props) => {
  const { status: cellData } = props

  const displayStatus = capitalize(cellData)

  let pillStyle: 'error' | 'success' | 'warning' = 'warning'
  if (cellData === BackupStatus.FAILURE) {
    pillStyle = 'error'
  } else if (cellData === BackupStatus.SUCCESS) {
    pillStyle = 'success'
  }

  return (
    <Pill pillStyle={pillStyle} size="small">
      {displayStatus}
    </Pill>
  )
}
