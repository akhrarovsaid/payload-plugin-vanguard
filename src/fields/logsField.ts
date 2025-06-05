import type { CollapsibleField, LabelFunction, StaticLabel } from 'payload'

export function logsField({
  name,
  label,
  uploadSlug,
}: {
  label?: LabelFunction | StaticLabel
  name: string
  uploadSlug: string
}): CollapsibleField {
  return {
    type: 'collapsible',
    admin: {
      components: {
        Field: {
          path: 'payload-plugin-vanguard/rsc#LogsField',
          serverProps: {
            path: name,
            uploadSlug,
          },
        },
      },
    },
    fields: [
      {
        name,
        type: 'upload',
        admin: {
          readOnly: true,
        },
        relationTo: uploadSlug,
      },
    ],
    label,
  }
}
