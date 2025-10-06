import type { CollapsibleField, LabelFunction, StaticLabel } from 'payload'

export function logsField({
  name,
  backupSlug,
  label,
}: {
  backupSlug: string
  label?: LabelFunction | StaticLabel
  name: string
}): CollapsibleField {
  return {
    type: 'collapsible',
    admin: {
      components: {
        Field: {
          path: 'payload-plugin-vanguard/rsc#LogsField',
          serverProps: {
            backupSlug,
            path: name,
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
        relationTo: backupSlug,
      },
    ],
    label,
  }
}
