import type { JsonObject, PayloadRequest, TypeWithID } from 'payload'

export type AdapterArgs = {
  backupSlug: string
  req: PayloadRequest
  uploadSlug: string
}

export interface BackupServiceAdapter {
  backup: (args: AdapterArgs) => Promise<JsonObject & TypeWithID>
  restore: (args: AdapterArgs) => Promise<void>
}
