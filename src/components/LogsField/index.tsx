import type { UploadFieldServerProps } from 'payload'
import type { FC, ReactNode } from 'react'

import { getTranslation } from '@payloadcms/translations'
import { Link, TextareaInput } from '@payloadcms/ui'

import type { PayloadDoc } from '../../types.js'

import './index.scss'
import { CopyButton } from './CopyButton.js'
import { DownloadButton } from './DownloadButton.js'

type Props = {
  uploadSlug: string
} & UploadFieldServerProps

const MAX_FILESIZE_KB = 200
const KB_SIZE = 1024

const baseClass = 'vanguard-logs'

const Wrapper = ({ children }: { children: ReactNode }) => (
  <div className={`${baseClass} field-type upload`}>{children}</div>
)

export const LogsField: FC<Props> = async ({
  data,
  field,
  i18n,
  operation,
  path,
  payload,
  req,
  uploadSlug,
}) => {
  if (operation !== 'update') {
    return null
  }

  let logsDocFromData: null | number | PayloadDoc | string | undefined = data[path]

  if (typeof logsDocFromData === 'string' || typeof logsDocFromData === 'number') {
    logsDocFromData = await payload.findByID({
      id: logsDocFromData,
      collection: uploadSlug,
      req,
    })
  }

  const logsDoc = logsDocFromData as PayloadDoc | undefined

  const label: string = field.label ? getTranslation(field.label, i18n) : field.name

  const noFileFound = (
    <Wrapper>
      <p>{i18n.t('validation:fieldHasNo', { label })}</p>
    </Wrapper>
  )

  if (!logsDoc) {
    return noFileFound
  }

  const { filename, size, url } = logsDoc

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
    <Wrapper>
      <aside className={`${baseClass}__controls`}>
        <Link href={url}>{filename}</Link>
        <DownloadButton
          className={`${baseClass}__download-btn`}
          fieldValue={logsFileValue}
          filename={filename}
        />
        <CopyButton className={`${baseClass}__copy-btn`} fieldValue={logsFileValue} />
      </aside>
      {fileTooLarge ? null : (
        <TextareaInput
          path={path}
          readOnly
          style={{ maxHeight: 480, overflowY: 'auto' }}
          value={logsFileValue}
        />
      )}
    </Wrapper>
  )
}
