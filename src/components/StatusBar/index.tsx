import type { UIFieldServerProps } from 'payload'

import { Banner } from '@payloadcms/ui'
import { type FC, Fragment } from 'react'

import { UploadTypes } from '../../utilities/uploadTypes.js'
import { MethodPill } from './MethodPill.js'
import { StatusPill } from './StatusPill.js'

export const StatusBar: FC<UIFieldServerProps> = (props) => {
  const {
    data: { type, method, status },
    operation,
  } = props

  if (type === UploadTypes.LOGS) {
    return null
  }

  return (
    <div
      className="field-type"
      style={{
        display: 'flex',
        flexDirection: operation !== 'create' ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 'calc(var(--base) / 2)',
      }}
    >
      {operation !== 'create' ? (
        <Fragment>
          <StatusPill status={status} />
          <MethodPill method={method} />
        </Fragment>
      ) : (
        <Banner type="info">
          <p>Hit the 'Save' button to create a new database backup.</p>
        </Banner>
      )}
    </div>
  )
}
