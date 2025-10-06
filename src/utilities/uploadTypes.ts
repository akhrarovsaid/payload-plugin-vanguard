export const UploadTypes = {
  BACKUP: 'backup',
  LOGS: 'logs',
} as const

export type UploadType = (typeof UploadTypes)[keyof typeof UploadTypes]
