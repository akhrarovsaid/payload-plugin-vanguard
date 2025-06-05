import type { FC } from 'react'

import { TextareaInput } from '@payloadcms/ui'

import './index.scss'

type Props = {
  fileTooLarge?: boolean
  path: string
  value?: string
}

const baseClass = 'vanguard-logs-textarea'

export const LogsFieldTextarea: FC<Props> = ({ fileTooLarge, path, value: logsFileValue }) => {
  const shouldRender = !fileTooLarge && logsFileValue
  return (
    <div className={baseClass}>
      {shouldRender ? (
        <TextareaInput path={path} readOnly value={logsFileValue} />
      ) : (
        <p className={`${baseClass}__placeholder`}>
          {fileTooLarge ? '<Too large to display>' : '<No logs>'}
        </p>
      )}
    </div>
  )
}
