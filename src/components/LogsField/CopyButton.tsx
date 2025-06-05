'use client'

import { Button, CopyIcon, toast, useTranslation } from '@payloadcms/ui'
import { type FC, useCallback } from 'react'

type Props = {
  className: string
  fieldValue?: string
}

export const CopyButton: FC<Props> = ({ className, fieldValue }) => {
  const { t } = useTranslation()

  const handleCopy = useCallback(async () => {
    if (!fieldValue) {
      return
    }

    try {
      await navigator.clipboard.writeText(fieldValue)
      toast.success(t('general:copied'))
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error(_err)
      toast.error(`${t('general:error')} ${t('general:copying')}`)
    }
  }, [fieldValue, t])

  return (
    <Button
      buttonStyle="subtle"
      className={className}
      icon={<CopyIcon />}
      iconPosition="left"
      onClick={handleCopy}
    >
      Copy
    </Button>
  )
}
