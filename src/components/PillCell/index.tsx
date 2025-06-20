import type { DefaultCellComponentProps } from 'payload'
import type { FC } from 'react'

import { Pill } from '@payloadcms/ui'

import { capitalize } from '../../utilities/capitalize.js'

type PillStyles =
  | 'always-white'
  | 'dark'
  | 'error'
  | 'light'
  | 'light-gray'
  | 'success'
  | 'warning'
  | 'white'

type Props = {
  generateLabel?: (cellData: string) => string
  pillStyleMap?: Partial<Record<string, PillStyles>>
  size?: 'medium' | 'small'
} & DefaultCellComponentProps

const defaultSize = 'small'
const defaultPillStyle = 'light-gray'

export const PillCell: FC<Props> = ({
  cellData,
  generateLabel = (label) => capitalize(label),
  pillStyleMap: pillStyleMapFromProps,
  size: sizeFromProps,
}) => {
  const label = typeof generateLabel === 'function' ? generateLabel(cellData) : cellData
  const size = sizeFromProps || defaultSize

  const pillStyle: PillStyles = pillStyleMapFromProps
    ? pillStyleMapFromProps[cellData] || defaultPillStyle
    : defaultPillStyle

  return (
    <Pill pillStyle={pillStyle} size={size}>
      {label}
    </Pill>
  )
}
