import type { FC } from 'react'

import { Pill } from '@payloadcms/ui'

import type { BackupMethod } from '../../utilities/backupMethod.js'

type Props = {
  method: BackupMethod
}

export const MethodPill: FC<Props> = ({ method }) => (
  <Pill alignIcon="left" pillStyle="light-gray" size="small">
    {`${method.charAt(0).toUpperCase() + method.slice(1)} Backup`}
  </Pill>
)
