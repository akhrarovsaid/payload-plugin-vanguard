import type { UploadField } from 'payload'

export function getLogsField({
  name,
  uploadSlug,
}: {
  name: string
  uploadSlug: string
}): UploadField {
  return {
    name,
    type: 'upload',
    admin: {
      components: {
        Field: {
          path: 'payload-plugin-vanguard/rsc#LogsField',
          serverProps: {
            uploadSlug,
          },
        },
      },
      readOnly: true,
    },
    relationTo: uploadSlug,
  }
}
