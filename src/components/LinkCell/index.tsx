import type { DefaultCellComponentProps, LabelFunction, ServerProps, StaticLabel } from 'payload'
import type { FC } from 'react'

import { getTranslation } from '@payloadcms/translations'
import { DefaultCell, Link } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'

type Props = {
  label?: LabelFunction | StaticLabel
  labelPath?: string
} & DefaultCellComponentProps &
  ServerProps

export const LinkCell: FC<Props> = async ({
  cellData,
  collectionSlug,
  field,
  i18n,
  label: labelFromProps,
  labelPath,
  payload,
  rowData,
}) => {
  const isUploadOrRel = field.type === 'relationship' || field.type === 'upload'

  if (!isUploadOrRel) {
    return (
      <DefaultCell
        cellData={cellData}
        collectionSlug={collectionSlug}
        field={field}
        rowData={rowData}
      />
    )
  }

  const none = <span>{`<${i18n.t('general:none')}>`}</span>

  const adminRoute = payload.config.routes?.admin || '/admin'
  const relationTo = cellData?.relationTo || field?.relationTo
  let href = '#'
  if (isUploadOrRel) {
    if (field.type === 'relationship') {
      href = formatAdminURL({
        adminRoute,
        path: `/collections/${relationTo}/${cellData}`,
      })
    } else {
      const doc = await payload.findByID({
        id: cellData,
        collection: relationTo,
        depth: 0,
        disableErrors: true,
      })

      if (!doc) {
        return none
      }

      href = doc?.url || '#'
    }
  }

  let label = getTranslation(labelFromProps || '', i18n)
  if (labelPath && relationTo) {
    const doc = await payload.findByID({
      id: cellData,
      collection: relationTo,
      depth: 0,
      disableErrors: true,
    })

    if (doc && Object.hasOwn(doc || {}, labelPath)) {
      label = doc[labelPath]
    }
  }

  if (!label) {
    return none
  }

  return (
    <Link href={href} rel="noopener" target="_blank">
      {label}
    </Link>
  )
}
