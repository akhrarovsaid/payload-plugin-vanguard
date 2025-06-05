'use client'

import type { FC } from 'react'

import './index.scss'

import { MoreIcon, Popup, PopupList } from '@payloadcms/ui'

const baseClass = 'vanguard-logs-row-actions'

type Props = {
  onCopy: () => Promise<void>
  onDownload: () => void
  onOpenURL: string
}

export const LogsFieldRowActions: FC<Props> = ({ onCopy, onDownload, onOpenURL }) => {
  const handleAction = (type: 'copy' | 'download', cb: () => void) => {
    if (type === 'copy') {
      void onCopy()
    } else {
      onDownload()
    }
    cb()
  }

  return (
    <Popup
      button={<MoreIcon className={`${baseClass}__icon icon icon--more`} />}
      buttonClassName={`${baseClass}__btn`}
      className={baseClass}
      render={({ close }) => (
        <PopupList.ButtonGroup>
          <PopupList.Button onClick={() => handleAction('copy', close)}>Copy</PopupList.Button>
          <PopupList.Button onClick={() => handleAction('download', close)}>
            Download
          </PopupList.Button>
          <PopupList.Button href={onOpenURL}>Open</PopupList.Button>
        </PopupList.ButtonGroup>
      )}
    />
  )
}
