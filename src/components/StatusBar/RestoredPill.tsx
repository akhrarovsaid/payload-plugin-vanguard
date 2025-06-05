import type { FC } from 'react'

import { Pill } from '@payloadcms/ui'

type Props = {
  restored?: boolean
}

export const RestoredPill: FC<Props> = ({ restored }) =>
  restored ? (
    <Pill alignIcon="left" pillStyle="light-gray" size="small">
      Restored
    </Pill>
  ) : null
