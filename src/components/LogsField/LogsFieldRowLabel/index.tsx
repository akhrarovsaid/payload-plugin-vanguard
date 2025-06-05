import type { FC } from 'react'

import { Pill } from '@payloadcms/ui'

import './index.scss'
import { formatFilesize } from 'payload/shared'

const baseClass = 'vanguard-logs-rowlabel'

type Props = {
  filename: string
  label?: string
  mimeType: string
  size: number
}

export const LogsFieldRowLabel: FC<Props> = ({ filename, label, mimeType, size }) => {
  return (
    <span className={baseClass}>
      <Pill pillStyle="white" size="small">
        {label}
      </Pill>
      {filename}
      <span className={`${baseClass}--filesize`}>{`${formatFilesize(size)} — ${mimeType}`}</span>
    </span>
  )
}
