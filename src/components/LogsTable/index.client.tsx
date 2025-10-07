'use client'

import type { JoinFieldClientProps } from 'payload'
import type { FC } from 'react'

import { JoinField } from '@payloadcms/ui'

type Props = JoinFieldClientProps

export const LogsTableClient: FC<Props> = (props) => {
  return <JoinField {...props} />
}
