'use client'

import type { DocumentPreferences } from 'payload'

import { Collapsible, toast, useDocumentInfo, usePreferences, useTranslation } from '@payloadcms/ui'
import { type FC, useCallback, useEffect, useState } from 'react'

import { LogsFieldRowActions } from './LogsFieldRowActions/index.js'
import { LogsFieldRowLabel } from './LogsFieldRowLabel/index.js'
import { LogsFieldTextarea } from './LogsFieldTextarea/index.js'

type Props = {
  className?: string
  filename: string
  fileTooLarge?: boolean
  initCollapsed?: boolean
  label?: string
  mimeType: string
  path: string
  size: number
  url: string
  value?: string
}

export const LogsFieldClient: FC<Props> = ({
  className,
  filename,
  initCollapsed,
  label,
  mimeType,
  path,
  url,
  value,
  ...rest
}) => {
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>()
  const fieldPreferencesKey = `collapsible-${path?.replace(/\./g, '__')}`
  const { t } = useTranslation()

  const onCopy = useCallback(async () => {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('general:copied'))
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error(_err)
      toast.error(`${t('general:error')} ${t('general:copying')}`)
    }
  }, [value, t])

  const onDownload = useCallback(() => {
    if (!value) {
      return
    }

    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`${t('upload:download')} ${t('general:success')}`)
  }, [value, filename, t])

  const onToggle = useCallback(
    async (newCollapsedState: boolean): Promise<void> => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey as string)

      if (preferencesKey) {
        void setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path
            ? {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [path]: {
                    ...existingPreferences?.fields?.[path],
                    collapsed: newCollapsedState,
                  },
                },
              }
            : {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [fieldPreferencesKey]: {
                    ...existingPreferences?.fields?.[fieldPreferencesKey],
                    collapsed: newCollapsedState,
                  },
                },
              }),
        })
      }
    },
    [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path],
  )

  useEffect(() => {
    const fetchInitialState = async () => {
      if (preferencesKey) {
        const preferences = await getPreference(preferencesKey)
        const fieldPreferences = preferences?.fields as { [key: string]: { collapsed?: boolean } }
        const specificPreference = path
          ? fieldPreferences?.[path]?.collapsed
          : fieldPreferences?.[fieldPreferencesKey]?.collapsed

        if (specificPreference !== undefined) {
          setCollapsedOnMount(Boolean(specificPreference))
        } else {
          setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
        }
      } else {
        setCollapsedOnMount(typeof initCollapsed === 'boolean' ? initCollapsed : false)
      }
    }

    void fetchInitialState()
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path])

  if (typeof collapsedOnMount !== 'boolean') {
    return null
  }

  return (
    <Collapsible
      actions={<LogsFieldRowActions onCopy={onCopy} onDownload={onDownload} onOpenURL={url} />}
      className={className}
      header={
        <LogsFieldRowLabel filename={filename} label={label} mimeType={mimeType} size={rest.size} />
      }
      initCollapsed={collapsedOnMount}
      onToggle={onToggle}
    >
      <LogsFieldTextarea path={path} value={value} {...rest} />
    </Collapsible>
  )
}
