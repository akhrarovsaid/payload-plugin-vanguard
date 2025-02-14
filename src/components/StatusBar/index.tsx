import type { UIFieldServerProps } from 'payload'
import type { FC } from 'react'

import { MethodPill } from './MethodPill.js'
import { RestoredPill } from './RestoredPill.js'
import { StatusPill } from './StatusPill.js'

export const StatusBar: FC<UIFieldServerProps> = (props) => {
  const {
    data: { method, status },
  } = props

  return (
    <div
      className="field-type"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--base) / 2)' }}
    >
      <StatusPill status={status} />
      <MethodPill method={method} />
      <RestoredPill />
    </div>
  )
}
