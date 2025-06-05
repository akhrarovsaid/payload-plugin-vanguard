'use client'

import { Button, DocumentIcon, toast, useTranslation } from '@payloadcms/ui'
import { type FC, useCallback } from 'react'

type Props = {
  className: string
  fieldValue?: string
  filename: string
}

export const DownloadButton: FC<Props> = ({ className, fieldValue, filename }) => {
  const { t } = useTranslation()

  const handleDownload = useCallback(() => {
    if (!fieldValue) {
      return
    }

    const blob = new Blob([fieldValue], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`${t('upload:download')} ${t('general:success')}`)
  }, [fieldValue, filename, t])

  return fieldValue ? (
    <Button
      buttonStyle="subtle"
      className={className}
      icon={<DocumentIcon />}
      iconPosition="left"
      onClick={handleDownload}
    >
      Download
    </Button>
  ) : null
}
