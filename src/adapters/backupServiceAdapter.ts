import type { JsonObject, PayloadRequest, TypeWithID } from 'payload'

export type BackupAdapterArgs = {
  backupSlug: string
  req: PayloadRequest
  uploadSlug: string
}

export type RestoreAdapterArgs = { id: number | string } & BackupAdapterArgs

export interface BackupServiceAdapter {
  backup: (args: BackupAdapterArgs) => Promise<JsonObject & TypeWithID>
  restore: (args: RestoreAdapterArgs) => Promise<void>
}
