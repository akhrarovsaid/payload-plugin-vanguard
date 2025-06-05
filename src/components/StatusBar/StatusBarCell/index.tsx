import type { DefaultCellComponentProps } from 'payload'
import type { FC } from 'react'

import { StatusPill } from '../StatusPill.js'

export const StatusBarCell: FC<DefaultCellComponentProps> = ({ cellData }) => {
  return <StatusPill status={cellData} />
}
