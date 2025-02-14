import type { FC } from 'react'

import { ErrorIcon, Pill, SuccessIcon, WarningIcon } from '@payloadcms/ui'

import { BackupStatus } from '../../utilities/backupStatus.js'

type Props = {
  status: BackupStatus
}

export const StatusPill: FC<Props> = (props) => {
  const { status: statusValue } = props

  let statusText = 'Backup In Progress'
  let pillStyle: 'error' | 'success' | 'warning' = 'warning'
  let icon = <WarningIcon />
  if (statusValue === BackupStatus.SUCCESS) {
    statusText = 'Backup Ready'
    pillStyle = 'success'
    icon = <SuccessIcon />
  } else if (statusValue !== BackupStatus.FAILURE) {
    statusText = 'Backup Failed'
    pillStyle = 'error'
    icon = <ErrorIcon />
  }

  return (
    <Pill alignIcon="left" icon={icon} pillStyle={pillStyle}>
      {statusText}
    </Pill>
  )
}
