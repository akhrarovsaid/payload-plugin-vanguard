import type { UIFieldServerProps } from 'payload'
import type { FC, ReactNode } from 'react'

import { getTranslation } from '@payloadcms/translations'

import type { PayloadDoc } from '../../types.js'

import './index.scss'
import { UploadTypes } from '../../utilities/uploadTypes.js'
import { LogsFieldClient } from './index.client.js'

type Props = {
  backupSlug: string
} & UIFieldServerProps

const MAX_FILESIZE_KB = 200
const KB_SIZE = 1024

const baseClass = 'vanguard-logs'

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className={`${baseClass} field-type collapsible`}>{children}</div>
)

export const LogsField: FC<Props> = async ({
  data,
  field,
  i18n,
  operation,
  path,
  payload,
  req,
}) => {
  if (operation !== 'update' || data.type === UploadTypes.BACKUP) {
    return null
  }

  const logsDoc = data as PayloadDoc | undefined

  const label: string = field.label ? getTranslation(field.label, i18n) : 'Logs'

  const noFileFound = (
    <Wrapper>
      <p>{i18n.t('validation:fieldHasNo', { label })}</p>
    </Wrapper>
  )

  if (!logsDoc) {
    return noFileFound
  }

  const { filename, filesize: size, mimeType, url } = logsDoc

  const fileTooLarge = size > MAX_FILESIZE_KB * KB_SIZE
  let logsFileValue: string | undefined
  if (!fileTooLarge) {
    try {
      const serverURL = payload.config.serverURL || req.origin
      const logsFileReq = await fetch(`${serverURL}${url}`, {
        credentials: 'include',
        method: 'GET',
      })

      if (!logsFileReq.ok) {
        return noFileFound
      }

      logsFileValue = await logsFileReq.text()
    } catch (_err) {
      payload.logger.error(_err, `Error while fetching log file.`)
      return noFileFound
    }
  }

  return (
    <LogsFieldClient
      className={baseClass}
      filename={filename}
      fileTooLarge={fileTooLarge}
      label={label}
      mimeType={mimeType}
      path={path}
      size={size}
      url={url}
      value={logsFileValue}
    />
  )
}
